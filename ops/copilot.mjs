/**
 * NIFTY50OPS CO-PILOT — the server-side live watcher for the trader's manual
 * wall system. Fed by the snapshot the app tab posts every 5 s
 * (services/opsState.ts → POST /api/ops/state), it:
 *
 *   1. records every new market tick (spot + OI ladder) to ticks.jsonl, so
 *      every day has 30-second data for replays without a browser export;
 *   2. runs the same wall-setup machine as the Manual tab
 *      (services/wallSetup.ts) on completed 1-minute bars;
 *   3. raises IN-APP alerts only (the user's choice): setup stages, a wall
 *      failing, stale/slow/missing data, and the levels of the trade the user
 *      logged on the Manual tab (stop, target, trail);
 *   4. runs a PAPER shadow of the manual system (first confirmed setup with
 *      room ≥ 30 at a defended wall, one per day) in Nifty points;
 *   5. runs the morning checks (08:45–09:20) and writes the end-of-day report
 *      (15:40).
 *
 * It never places, modifies or closes an order, never touches an engine, and
 * never changes a parameter. It reads the app's snapshot and the journal, and
 * writes only its own journal streams (ticks, copilot) and copilot-eod.md.
 */

import { appendJournal, readJournal, writeJournalFile } from './journal.mjs';
import { istDateStr, istMinutes, istTimeStr, hhmm, isTradingDay } from './time.mjs';
import { wallContext } from '../services/oiWalls.ts';
import { buildPulse } from '../services/marketPulse.ts';
import {
  DEFAULT_SETUP_PARAMS, fiveMinuteTrend, initialSetupState, scorePlan, stepWallSetup, toFiveMinuteBars,
  toMinuteBars, trailLevel
} from '../services/wallSetup.ts';

export const COPILOT_TIMES = Object.freeze({
  morningFrom: hhmm(8, 45),
  feedCheck: hhmm(9, 5),
  zoneCheck: hhmm(9, 20),
  open: hhmm(9, 15),
  signalFrom: hhmm(9, 30),
  signalUntil: hhmm(14, 45),
  shadowExit: hhmm(15, 0),
  close: hhmm(15, 30),
  eod: hhmm(15, 40)
});

const MAX_ALERTS = 200;

/**
 * A tick is market data only inside the session and only if it is believable.
 * On 2026-11-27 at 17:11 a 16-Oct cache price (23,136) reached the co-pilot after
 * hours and was reported as "closed 2,464 pts below 25600: wall failed".
 */
export const SESSION_FROM = hhmm(9, 0);
export const SESSION_TO = hhmm(15, 35);
export const MAX_TICK_JUMP = 0.03;
export function acceptTick(tick, prev) {
  if (!tick || !(tick.spot > 0) || !Number.isFinite(tick.t)) return false;
  const m = istMinutes(tick.t);
  if (m < SESSION_FROM || m > SESSION_TO) return false;
  if (prev && Math.abs(tick.spot - prev.spot) / prev.spot > MAX_TICK_JUMP) return false;
  return true;
}
const minuteOf = t => Math.floor(t / 60_000) * 60_000;

/** Median gap (s) between the last n ticks. */
export function cadenceSec(ticks, n = 7) {
  const recent = ticks.slice(-n);
  const gaps = recent.slice(1).map((t, i) => (t.t - recent[i].t) / 1000).sort((a, b) => a - b);
  return gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)]) : null;
}

/** Walls in force at time t from the ladder history (ticks oldest-first). */
export function wallsAt(ticks, t, spot) {
  const hist = [];
  for (let i = ticks.length - 1; i >= 0 && hist.length < 20; i--) {
    if (ticks[i].t <= t && ticks[i].oiLadder) hist.push({ timestamp: ticks[i].t, oiLadder: ticks[i].oiLadder });
  }
  if (!hist.length || t - hist[0].timestamp > 5 * 60_000) return null;
  const w = wallContext(hist, spot, 5);
  return { floor: w.floor, floorOIChangePct: w.floorOIChangePct, ceiling: w.ceiling, ceilingOIChangePct: w.ceilingOIChangePct };
}

export function createCopilot({
  journal = appendJournal,
  read = readJournal,
  writeFile = writeJournalFile,
  now = () => Date.now(),
  params = DEFAULT_SETUP_PARAMS
} = {}) {
  let day = null;
  let ticks = [];
  let bars = [];
  let setup = initialSetupState();
  let events = [];
  let alerts = [];
  let walls = null;
  let shadow = null;          // { status: 'OPEN'|'CLOSED', side, entry, stop, target, entryT, exitT?, exit?, points?, result? }
  let watched = null;         // the trade the user logged on the Manual tab
  let lastQuoteAt = 0;
  let missingLadderRun = 0;
  let pulses = [];
  const raised = new Map();   // alert key -> last raised ms (dedupe)
  const done = new Set();     // daily one-shot checks

  const alert = (kind, severity, title, message, key = `${kind}:${title}`, everyMs = 10 * 60_000) => {
    const at = now();
    if (raised.has(key) && at - raised.get(key) < everyMs) return null;
    raised.set(key, at);
    // Alerts belong to market hours (user, 2026-11-27). Outside 09:15-15:30 on a trading day
    // the event is still recorded (journal, agent chat) but marked quiet: no toast, not in the feed.
    const mm = istMinutes(at);
    const quiet = !isTradingDay(at) || mm < COPILOT_TIMES.open || mm > COPILOT_TIMES.close;
    const a = { id: `${at}-${alerts.length}`, at, time: istTimeStr(at), kind, severity, title, message, quiet };
    alerts.push(a);
    if (alerts.length > MAX_ALERTS) alerts = alerts.slice(-MAX_ALERTS);
    try { journal('copilot', { event: 'ALERT', ...a }); } catch { /* journal failure must not stop the watcher */ }
    return a;
  };

  function resetDay(d) {
    day = d;
    ticks = [];
    bars = [];
    setup = initialSetupState();
    events = [];
    alerts = [];
    walls = null;
    shadow = null;
    watched = null;
    lastQuoteAt = 0;
    missingLadderRun = 0;
    pulses = [];
    raised.clear();
    done.clear();
    // A restarted server rebuilds the day from its own tick record.
    try {
      const rows = read('ticks', { date: d, limit: 0 })
        .filter(r => Number.isFinite(r.t) && r.spot > 0)
        .sort((a, b) => a.t - b.t);
      for (const r of rows) {
        const tick = { t: r.t, spot: r.spot, oiLadder: r.oiLadder ?? null, adv: r.adv ?? null, dec: r.dec ?? null, pcr: r.pcr ?? null, sent: r.sent ?? null, callsOI: r.callsOI ?? null, putsOI: r.putsOI ?? null, movers: r.movers ?? null };
        if (acceptTick(tick, ticks[ticks.length - 1])) ticks.push(tick);
      }
      lastQuoteAt = ticks.length ? ticks[ticks.length - 1].t : 0;
      for (const b of toMinuteBars(ticks).slice(0, -1)) completeBar(b, true);
      const shadowRows = read('copilot', { date: d, limit: 0 }).filter(r => r.event === 'SHADOW_ENTRY' || r.event === 'SHADOW_EXIT');
      const entry = shadowRows.find(r => r.event === 'SHADOW_ENTRY');
      const exit = shadowRows.find(r => r.event === 'SHADOW_EXIT');
      if (entry) shadow = { ...entry.shadow, ...(exit ? exit.shadow : {}) };
      for (const r of read('copilot', { date: d, limit: 0 })) if (r.event === 'CHECK_DONE') done.add(r.check);
    } catch { /* no journal yet */ }
  }

  function completeBar(bar, replaying = false) {
    bars.push(bar);
    const w = wallsAt(ticks, bar.t + 59_999, bar.c);
    if (w) walls = w;
    if (!w) {
      const p = buildPulse(ticks, bar.t + 59_999);
      if (p) { pulses.push(p); if (pulses.length > 400) pulses = pulses.slice(-400); if (!replaying) { try { journal('copilot', { event: 'PULSE', pulse: p }); } catch { /* ignore */ } } }
      return;
    }
    const m = istMinutes(bar.t);
    for (const ev of stepWallSetup(setup, bar, w, params)) {
      events.push(ev);
      if (events.length > 500) events = events.slice(-500);
      if (replaying) continue;
      try { journal('copilot', { event: 'SETUP', side: ev.side, stage: ev.stage, wall: ev.wall, spot: ev.spot, note: ev.note, plan: ev.plan ?? null, barAt: ev.t }); } catch { /* ignore */ }
      const label = `${ev.side === 'LONG' ? 'LONG off floor' : 'SHORT off ceiling'} ${ev.wall}`;
      if (ev.stage === 'AT_WALL') alert('setup', 'info', `At wall · ${label}`, ev.note, `at:${ev.side}:${ev.wall}`, 15 * 60_000);
      if (ev.stage === 'TURNING') alert('setup', 'info', `Turning · ${label}`, ev.note, `turn:${ev.side}:${ev.wall}:${ev.t}`);
      if (ev.stage === 'FAILED') alert('setup', 'warn', `Wall failed · ${ev.wall}`, ev.note, `fail:${ev.side}:${ev.wall}`, 15 * 60_000);
      if (ev.stage === 'CONFIRMED' && ev.plan) {
        const p = ev.plan;
        const inWindow = m >= COPILOT_TIMES.signalFrom && m <= COPILOT_TIMES.signalUntil;
        alert('setup', 'action', `Setup confirmed · ${label}`,
          `entry ~${p.entry} · stop ${p.stop} · target ${p.target}${p.targetCapped ? ' (wall)' : ''} · room ${p.room ?? '?'}` +
          `${p.roomOk ? '' : ' · ROOM < 30'}${p.wallDefended === false ? ' · writers LEAVING' : ''}${inWindow ? '' : ' · outside 09:30–14:45'}`,
          `conf:${ev.side}:${ev.t}`, 0);
        // PAPER shadow: the system's own filter, one per day, nothing sent to any broker.
        if (!shadow && inWindow && p.roomOk && p.wallDefended === true) {
          shadow = { status: 'OPEN', side: p.side, wall: p.wall, entry: p.entry, stop: p.stop, target: p.target, entryT: ev.t, entryTime: istTimeStr(ev.t) };
          try { journal('copilot', { event: 'SHADOW_ENTRY', shadow }); } catch { /* ignore */ }
          alert('shadow', 'info', `PAPER shadow entered · ${p.side}`, `entry ${p.entry}, stop ${p.stop}, target ${p.target} (spot points; no order placed)`, 'shadow:entry', 0);
        }
      }
    }
    if (shadow?.status === 'OPEN' && !replaying) stepShadow(bar);
    // One Market Pulse per completed minute (also rebuilt on reload, not journalled twice).
    const p = buildPulse(ticks, bar.t + 59_999);
    if (p) {
      pulses.push(p);
      if (pulses.length > 400) pulses = pulses.slice(-400);
      if (!replaying) { try { journal('copilot', { event: 'PULSE', pulse: p }); } catch { /* ignore */ } }
    }
  }

  function stepShadow(bar) {
    const s = shadow;
    const sign = s.side === 'LONG' ? 1 : -1;
    const hitStop = sign > 0 ? bar.l <= s.stop : bar.h >= s.stop;
    const hitTarget = sign > 0 ? bar.h >= s.target : bar.l <= s.target;
    const timeUp = istMinutes(bar.t) >= COPILOT_TIMES.shadowExit;
    if (!hitStop && !hitTarget && !timeUp) return;
    const exit = hitStop ? s.stop : hitTarget ? s.target : bar.c;
    const result = hitStop ? 'STOP' : hitTarget ? 'TARGET' : 'TIME';
    Object.assign(s, { status: 'CLOSED', exit, exitT: bar.t, exitTime: istTimeStr(bar.t), result, points: Math.round(sign * (exit - s.entry) * 10) / 10 });
    try { journal('copilot', { event: 'SHADOW_EXIT', shadow: s }); } catch { /* ignore */ }
    alert('shadow', 'info', `PAPER shadow closed · ${result}`, `${s.points >= 0 ? '+' : ''}${s.points} pts (${s.entry} → ${exit})`, 'shadow:exit', 0);
  }

  /** The latest trade plan the user logged on the Manual tab today, if still open. */
  function refreshWatched() {
    let rows = [];
    try { rows = read('manual', { date: day, limit: 0 }); } catch { return; }
    const ticket = [...rows].reverse().find(r => r.event === 'TICKET');
    if (!ticket) { watched = null; return; }
    const closed = rows.some(r => r.event === 'TRADE' && r.timestamp > ticket.timestamp);
    if (closed) { if (watched) watched.status = 'CLOSED'; return; }
    if (!watched || watched.loggedAt !== ticket.timestamp) {
      watched = { loggedAt: ticket.timestamp, side: ticket.side, entry: ticket.entry, stop: ticket.stop, target: ticket.target, status: 'OPEN', trail: null, targetHit: false };
    }
  }

  function watchTrade(spot) {
    if (!watched || watched.status !== 'OPEN' || !Number.isFinite(spot)) return;
    const w = watched;
    const sign = w.side === 'LONG' ? 1 : -1;
    if (Number.isFinite(w.stop) && sign * (spot - w.stop) <= 0) {
      alert('trade', 'action', 'Your stop level is hit', `Nifty ${spot} through your stop ${w.stop}. Your rule: exit without arguing.`, `stop:${w.loggedAt}`, 3 * 60_000);
    }
    if (Number.isFinite(w.target) && sign * (spot - w.target) >= 0 && !w.targetHit) {
      w.targetHit = true;
      alert('trade', 'action', 'Target reached', `Nifty ${spot} at your target ${w.target}. Exit, or trail from here.`, `target:${w.loggedAt}`, 0);
    }
    if (w.targetHit) {
      w.trail = trailLevel(w.side, bars, w.trail);
      if (w.trail !== null && sign * (spot - w.trail) <= 0) {
        alert('trade', 'action', 'Trail hit', `Nifty ${spot} through the trail ${w.trail} (last 1-min ${w.side === 'LONG' ? 'low − 5' : 'high + 5'}).`, `trail:${w.loggedAt}`, 3 * 60_000);
      }
    }
  }

  function dataChecks(snapshot, t) {
    const m = istMinutes(t);
    if (m < hhmm(9, 0) || m > COPILOT_TIMES.close) return;
    const age = snapshot?.market?.quoteAgeSec;
    if (Number.isFinite(age) && age > 60) alert('data', 'warn', 'Price is stale', `Last quote ${age}s old. Check the app tab and the Paytm token.`, 'stale', 5 * 60_000);
    const cad = cadenceSec(ticks);
    if (ticks.length >= 7 && cad !== null && cad > 45) alert('data', 'warn', 'Refresh is slow', `Prices arrive every ~${cad}s (setting is 30s).`, 'cadence', 10 * 60_000);
    if (missingLadderRun >= 3) alert('data', 'warn', 'OI ladder missing', 'The last snapshots carry no per-strike OI; walls cannot be read.', 'ladder', 10 * 60_000);
  }

  /** Called with every snapshot the app posts. */
  function onState(snapshot) {
    const t = now();
    const d = istDateStr(t);
    if (d !== day) resetDay(d);
    if (!isTradingDay(t)) return;
    const mk = snapshot?.market ?? {};
    const quoteAt = Number(mk.quoteAt);
    const spot = Number(mk.spot);
    const pi = mk.pulse && typeof mk.pulse === 'object' ? mk.pulse : null;
    const candidate = {
      t: quoteAt, spot, oiLadder: typeof mk.oiLadder === 'string' && mk.oiLadder ? mk.oiLadder : null,
      ...(pi ? { adv: pi.adv ?? null, dec: pi.dec ?? null, pcr: pi.pcr ?? null, sent: pi.sent ?? null, callsOI: pi.callsOI ?? null, putsOI: pi.putsOI ?? null, movers: Array.isArray(pi.movers) ? pi.movers.slice(0, 20) : null } : {})
    };
    if (Number.isFinite(quoteAt) && quoteAt > lastQuoteAt && istDateStr(quoteAt) === d && acceptTick(candidate, ticks[ticks.length - 1])) {
      lastQuoteAt = quoteAt;
      const tick = candidate;
      missingLadderRun = tick.oiLadder ? 0 : missingLadderRun + 1;
      const prev = ticks[ticks.length - 1];
      ticks.push(tick);
      try { journal('ticks', tick); } catch { /* ignore */ }
      if (prev && minuteOf(prev.t) !== minuteOf(tick.t)) {
        const all = toMinuteBars(ticks);
        const finished = all.filter(b => b.t > (bars[bars.length - 1]?.t ?? 0) && b.t < minuteOf(tick.t));
        finished.forEach(b => completeBar(b));
      }
    }
    refreshWatched();
    if (istMinutes(t) >= SESSION_FROM && istMinutes(t) <= SESSION_TO && ticks.length && Math.abs(spot - ticks[ticks.length - 1].spot) / ticks[ticks.length - 1].spot <= MAX_TICK_JUMP) watchTrade(spot);
    dataChecks(snapshot, t);
  }

  /** Once-a-day checks; `ctx` gives the morning data the copilot cannot see itself. */
  async function tickClock({ state, premarketRows, preflight, chartsToday, repullCharts } = {}) {
    const t = now();
    const d = istDateStr(t);
    if (d !== day) resetDay(d);
    if (!isTradingDay(t)) return;
    const m = istMinutes(t);
    const once = async (name, fn) => {
      if (done.has(name)) return;
      done.add(name);
      try { journal('copilot', { event: 'CHECK_DONE', check: name }); } catch { /* ignore */ }
      await fn();
    };
    if (m >= COPILOT_TIMES.morningFrom && m < COPILOT_TIMES.open && preflight) {
      await once('preflight', async () => {
        const r = await preflight();
        const failed = (r?.checks || []).filter(c => !c.ok);
        alert('morning', failed.some(c => c.critical) ? 'action' : failed.length ? 'warn' : 'info',
          failed.length ? `Pre-flight: ${failed.length} problem(s)` : 'Pre-flight passed',
          failed.length ? failed.map(c => `${c.label}: ${c.detail}`).join(' · ') : 'Server, token, expiry, lot size, sidecar all OK.', 'preflight', 0);
      });
    }
    // Self-heal: no chart set by 08:55 -> one guarded pull through the sidecar (the OTP/token stays the user's).
    if (m >= hhmm(8, 55) && m < COPILOT_TIMES.open && chartsToday && repullCharts) {
      await once('charts', async () => {
        const have = chartsToday();
        if (have >= 4) { alert('morning', 'info', 'Charts present', `${have} chart file(s) pulled today.`, 'charts', 0); return; }
        const r = await repullCharts();
        const ok = r && !r.error && r.ok;
        alert('morning', ok ? 'info' : 'action', ok ? 'Charts re-pulled' : 'Chart pull failed',
          ok ? `Only ${have} chart file(s) found by 08:55, so I pulled them: ${r.accepted} accepted. Open PreMkt and generate the decision.`
             : `Only ${have} chart file(s) by 08:55 and the automatic pull failed (${r?.error ?? 'unknown'}). Pull them from PreMkt.`, 'charts', 0);
      });
    }
    if (m >= COPILOT_TIMES.feedCheck && m < COPILOT_TIMES.close) {
      await once('feed', async () => {
        const recent = ticks.filter(x => t - x.t < 5 * 60_000);
        const cad = cadenceSec(recent);
        const ladders = recent.filter(x => x.oiLadder).length;
        const problems = [];
        if (!recent.length) problems.push('no prices in the last 5 min (is the app tab open with a fresh token?)');
        if (cad !== null && cad > 45) problems.push(`refresh every ~${cad}s, not 30s`);
        if (recent.length && !ladders) problems.push('no OI ladder in the snapshots');
        if (state && (state.stale || !state.snapshot)) problems.push('the app tab is not reporting');
        alert('morning', problems.length ? 'action' : 'info', problems.length ? 'Live feed NOT healthy' : 'Live feed healthy',
          problems.length ? problems.join(' · ') : `${recent.length} ticks in 5 min, every ~${cad ?? '?'}s, OI ladder present.`, 'feed', 0);
      });
    }
    if (m >= COPILOT_TIMES.zoneCheck && m < COPILOT_TIMES.close && premarketRows) {
      await once('zone', async () => {
        const plan = [...premarketRows].reverse().find(r => Number.isFinite(r.expectedSupport));
        if (!plan) { alert('morning', 'action', 'No pre-market plan today', 'Open PreMkt and generate the decision.', 'zone', 0); return; }
        const width = plan.expectedResistance - plan.expectedSupport;
        const issues = [];
        if (width < 50) issues.push(`zone ${plan.expectedSupport}–${plan.expectedResistance} is only ${width} pts`);
        if (Array.isArray(plan.chartsRead) && !plan.chartsRead.includes('OI_SNAPSHOT')) issues.push('the Sensibull OI chart was not read');
        if (Number.isFinite(plan.chartCoverage) && plan.chartCoverage < 4) issues.push(`${plan.chartCoverage}/4 charts readable`);
        if (plan.provisional) issues.push('the latest plan is still provisional (charts only)');
        if (walls && (plan.expectedSupport < walls.floor - 60 || plan.expectedResistance > walls.ceiling + 60)) {
          issues.push(`live walls ${walls.floor}/${walls.ceiling} differ from the plan`);
        }
        alert('morning', issues.length ? 'warn' : 'info', issues.length ? 'Pre-market plan needs a look' : 'Pre-market plan looks sane',
          issues.length ? issues.join(' · ') : `zone ${plan.expectedSupport}–${plan.expectedResistance} (${width} pts), ${plan.headline ?? ''}`, 'zone', 0);
      });
    }
    if (m >= COPILOT_TIMES.eod) {
      await once('eod', async () => {
        const path = writeEod();
        alert('eod', 'info', 'End-of-day report written', path, 'eod', 0);
      });
    }
  }

  /** Replays the day's confirmed setups (every one) for the EOD report. */
  function replayDay() {
    const st = initialSetupState();
    const out = [];
    const dayBars = toMinuteBars(ticks);
    for (const b of dayBars) {
      const w = wallsAt(ticks, b.t + 59_999, b.c);
      if (!w) continue;
      for (const ev of stepWallSetup(st, b, w, params)) {
        const mm = istMinutes(ev.t);
        if (ev.stage === 'CONFIRMED' && ev.plan && mm >= COPILOT_TIMES.signalFrom && mm <= COPILOT_TIMES.signalUntil) {
          out.push({ ev, out: scorePlan(ev.plan, ev.t, dayBars) });
        }
      }
    }
    return out;
  }

  function writeEod() {
    const manual = (() => { try { return read('manual', { date: day, limit: 0 }); } catch { return []; } })();
    const trades = manual.filter(r => r.event === 'TRADE');
    const tickets = manual.filter(r => r.event === 'TICKET');
    const replay = replayDay();
    const failures = events.filter(e => e.stage === 'FAILED');
    const sum = list => Math.round(list.reduce((a, s) => a + s.out.points, 0) * 10) / 10;
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const dayBars = toMinuteBars(ticks);
    const hi = dayBars.length ? Math.max(...dayBars.map(b => b.h)) : null;
    const lo = dayBars.length ? Math.min(...dayBars.map(b => b.l)) : null;
    const dataAlerts = alerts.filter(a => a.kind === 'data' || a.kind === 'morning');
    const lines = [
      `# Co-pilot end of day — ${day}`,
      '',
      `Written ${istTimeStr(now())} IST by Nifty50Ops. Facts from ticks.jsonl (${ticks.length} ticks), manual.jsonl and copilot.jsonl. No predictions, no parameter changes.`,
      '',
      '## Market',
      `- Range ${lo ?? '?'} – ${hi ?? '?'} (${hi && lo ? Math.round(hi - lo) : '?'} pts), ${ticks.filter(t => t.oiLadder).length}/${ticks.length} ticks with an OI ladder, median refresh ${cadenceSec(ticks, ticks.length) ?? '?'}s.`,
      `- 5-minute trend at the close: ${fiveMinuteTrend(toFiveMinuteBars(dayBars).slice(0, -1))}.`,
      '',
      '## Your trades (Manual tab)',
      ...(trades.length
        ? trades.map(r => `- ${r.view ?? '?'} ${r.strike ?? ''} ${r.optionType ?? ''} ${r.entryTime}→${r.exitTime} · ₹${r.gross} gross${r.charges ? `, net ₹${Math.round((r.gross - r.charges) * 100) / 100}` : ''} · Nifty ${r.excursion?.spotIn ?? '?'}→${r.excursion?.spotOut ?? '?'} · best ${r.excursion?.mfe ?? '?'} / worst ${r.excursion?.mae ?? '?'} pts · feelings ${JSON.stringify(r.feelings ?? {})}`)
        : [`- none saved${tickets.length ? ` (${tickets.length} ticket(s) logged: paste the Kite lines in the Manual tab to complete them)` : ''}`]),
      '',
      '## PAPER shadow (your system, mechanical: first confirmed setup, room ≥ 30, wall defended)',
      shadow
        ? `- ${shadow.side} ${shadow.entryTime} entry ${shadow.entry}, stop ${shadow.stop}, target ${shadow.target} → ${shadow.status === 'CLOSED' ? `${shadow.result} ${shadow.points >= 0 ? '+' : ''}${shadow.points} pts at ${shadow.exitTime}` : 'still open at report time'}`
        : '- no qualifying setup today',
      '',
      '## Every confirmed setup (replay, spot points, stop before target)',
      replay.length
        ? `- ${replay.length} signals · win ${pct(replay.filter(s => s.out.points > 0).length, replay.length)}% · net ${sum(replay)} pts · defended walls ${sum(replay.filter(s => s.ev.plan.wallDefended === true))} pts · undefended ${sum(replay.filter(s => s.ev.plan.wallDefended === false))} pts`
        : '- none',
      ...replay.slice(0, 20).map(s => `  - ${istTimeStr(s.ev.t).slice(0, 5)} ${s.ev.side} wall ${s.ev.plan.wall} entry ${s.ev.plan.entry} → ${s.out.result} ${s.out.points >= 0 ? '+' : ''}${s.out.points}${s.ev.plan.roomOk ? '' : ' (room<30)'}${s.ev.plan.wallDefended === false ? ' (undefended)' : ''}`),
      '',
      '## Walls that failed',
      failures.length ? failures.map(f => `- ${istTimeStr(f.t).slice(0, 5)} ${f.wall} (${f.side}) · ${f.note}`).join('\n') : '- none',
      '',
      '## Data and morning checks',
      dataAlerts.length ? dataAlerts.map(a => `- ${a.time} ${a.title}: ${a.message}`).join('\n') : '- no data alerts',
      '',
      '_One day is not evidence. The 6-day replay of 2026-11-27 showed no mechanical edge (49% win, −297 pts); keep judging the system on many days._',
      ''
    ];
    return writeFile('copilot-eod.md', lines.join('\n'), day);
  }

  function status() {
    const t = now();
    const last = ticks[ticks.length - 1];
    const lastEvent = side => [...events].reverse().find(e => e.side === side) ?? null;
    return {
      asOf: t,
      day,
      spot: last?.spot ?? null,
      lastTickAgeSec: last ? Math.round((t - last.t) / 1000) : null,
      cadenceSec: cadenceSec(ticks),
      ladder: Boolean(last?.oiLadder),
      walls,
      stages: {
        long: { stage: setup.long.stage, wall: setup.long.wall, last: lastEvent('LONG') },
        short: { stage: setup.short.stage, wall: setup.short.wall, last: lastEvent('SHORT') }
      },
      trend5m: fiveMinuteTrend(toFiveMinuteBars(bars).slice(0, -1)),
      events: events.slice(-40),
      alerts: alerts.slice(-60),
      shadow,
      watched,
      ticksToday: ticks.length,
      checksDone: [...done],
      pulse: pulses[pulses.length - 1] ?? null,
      pulses: pulses.slice(-30)
    };
  }

  /** Notifications from the agent and daemon (preflight, watchdog, debrief) shown in the app. */
  function inbox(title, message) {
    const d = istDateStr(now());
    if (d !== day) resetDay(d);
    return alert('ops', /🚨|FAILED|NOT/.test(title) ? 'action' : 'info', String(title).slice(0, 80), String(message).slice(0, 600), `ops:${title}:${message}`, 60_000);
  }

  return { onState, tickClock, status, writeEod, inbox, _internals: { get ticks() { return ticks; } } };
}

/** The server process's single co-pilot. */
export const copilot = createCopilot();
