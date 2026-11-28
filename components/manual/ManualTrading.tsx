/**
 * MANUAL TRADING — the decision cockpit for the trader's own wall trades.
 *
 *   Decision        one word + one line: what your system sees right now (never advice)
 *   Wall map        per-strike put/call OI around price, floor/ceiling, writers' change
 *   Setup steppers  at wall → stalling → turning → confirmed, for each side
 *   On track?       your record vs your 75% goal and your rules, honest about sample size
 *   Plan the trade  the 5-line checklist that checks itself, with a risk/reward bar
 *   Trail · events  trail once the target is hit; today's setup timeline
 *   Journal         paste Kite's Executed lines → trade, best/worst move, journal row
 *
 * Read-only towards the engines and the broker. Writes only the `manual` journal
 * stream and a per-day trade counter in localStorage.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MarketSnapshot } from '../../types';
import { parseOiLadder, wallContext } from '../../services/oiWalls';
import {
  Bar, SetupEvent, WallsAt, fiveMinuteTrend, initialSetupState, stepWallSetup, toFiveMinuteBars, toMinuteBars, trailLevel
} from '../../services/wallSetup';
import { DEFAULT_CHARGES, Product, Side, checkTicket } from '../../services/tradeTicket';
import { Feelings, journalRow, measureExcursion, pairRoundTrips, parseExecutedOrders } from '../../services/manualJournal';
import { deriveManualDecision, marketPhase, onTrack, RecordTrade, Tone } from '../../services/manualDecision';
import { fetchOpsState } from '../../services/opsClient';
import { logJournal } from '../../services/journal';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const istDay = (t = Date.now()) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
const istMin = (t: number) => { const [h, m] = hhmm(t).split(':').map(Number); return h * 60 + m; };
const istWeekday = (t = Date.now()) => new Date(new Date(t).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getDay();
const fmt = (x: number | null | undefined, d = 0) => (x === null || x === undefined || !Number.isFinite(x) ? '—' : x.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }));
const rupees = (x: number) => `${x < 0 ? '−' : '+'}₹${Math.abs(x).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
};

const TONE: Record<Tone, { ring: string; glow: string; text: string; chip: string; dot: string }> = {
  slate: { ring: 'border-slate-700/80', glow: 'from-slate-500/10', text: 'text-slate-200', chip: 'bg-slate-700/60 text-slate-200', dot: 'bg-slate-400' },
  sky: { ring: 'border-sky-500/40', glow: 'from-sky-500/15', text: 'text-sky-200', chip: 'bg-sky-500/20 text-sky-200', dot: 'bg-sky-400' },
  amber: { ring: 'border-amber-500/40', glow: 'from-amber-500/15', text: 'text-amber-200', chip: 'bg-amber-500/20 text-amber-200', dot: 'bg-amber-400' },
  emerald: { ring: 'border-emerald-500/50', glow: 'from-emerald-500/20', text: 'text-emerald-200', chip: 'bg-emerald-500/20 text-emerald-200', dot: 'bg-emerald-400' },
  rose: { ring: 'border-rose-500/45', glow: 'from-rose-500/15', text: 'text-rose-200', chip: 'bg-rose-500/20 text-rose-200', dot: 'bg-rose-400' },
  violet: { ring: 'border-violet-500/45', glow: 'from-violet-500/20', text: 'text-violet-200', chip: 'bg-violet-500/20 text-violet-200', dot: 'bg-violet-400' }
};
const STEPS = ['AT_WALL', 'STALLING', 'TURNING', 'CONFIRMED'] as const;
const STEP_LABEL: Record<string, string> = { AT_WALL: 'At wall', STALLING: 'Stalling', TURNING: 'Turning', CONFIRMED: 'Confirmed' };

function beep(freq: number) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.start(); o.stop(ctx.currentTime + 0.5);
  } catch { /* audio blocked until the page has been clicked */ }
}
function notify(title: string, body: string) {
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body }); } catch { /* ignore */ }
}
function nextOpenLabel(now = Date.now()) {
  const wd = istWeekday(now), m = istMin(now);
  let add = m < 9 * 60 + 15 && wd >= 1 && wd <= 5 ? 0 : 1;
  let d = (wd + add) % 7;
  while (d === 0 || d === 6) { add++; d = (wd + add) % 7; }
  return `Opens ${add === 0 ? 'today' : add === 1 ? 'tomorrow' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]} 09:15`;
}

/** Runs the wall-setup machine over today's snapshots. Pure function of the history. */
function runSetup(historyNewestFirst: MarketSnapshot[]) {
  const today = istDay();
  const ticks = historyNewestFirst
    .filter(s => typeof s.timestamp === 'number' && s.niftyLtp > 0 && istDay(s.timestamp!) === today && istMin(s.timestamp!) >= 9 * 60 && istMin(s.timestamp!) <= 15 * 60 + 30)
    .map(s => ({ t: s.timestamp!, spot: s.niftyLtp, oiLadder: s.oiLadder ?? null }))
    .reverse();
  const allBars = toMinuteBars(ticks).filter(b => istMin(b.t) >= 9 * 60 + 15);
  const currentMinute = Math.floor(Date.now() / 60_000) * 60_000;
  const bars = allBars.filter(b => b.t < currentMinute);
  const laddered = ticks.filter(t => t.oiLadder);
  const wallsAt = (t: number): WallsAt | null => {
    const hist: { timestamp: number; oiLadder: string }[] = [];
    for (let i = laddered.length - 1; i >= 0 && hist.length < 20; i--) {
      if (laddered[i].t <= t) hist.push({ timestamp: laddered[i].t, oiLadder: laddered[i].oiLadder! });
    }
    if (!hist.length || t - hist[0].timestamp > 5 * 60_000) return null;
    const spot = ticks.filter(x => x.t <= t).pop()?.spot;
    if (!spot) return null;
    const w = wallContext(hist, spot, 5);
    return { floor: w.floor, floorOIChangePct: w.floorOIChangePct, ceiling: w.ceiling, ceilingOIChangePct: w.ceilingOIChangePct };
  };
  const state = initialSetupState();
  const events: SetupEvent[] = [];
  let walls: WallsAt | null = null;
  for (const b of bars) {
    const w = wallsAt(b.t + 59_999);
    if (!w) continue;
    walls = w;
    events.push(...stepWallSetup(state, b, w));
  }
  const fives = toFiveMinuteBars(bars).filter(b => b.t + 300_000 <= currentMinute);
  return { state, events, walls, bars, trend: fiveMinuteTrend(fives), ticks, hasLadder: laddered.length > 0, lastLadder: laddered[laddered.length - 1]?.oiLadder ?? null };
}

// ---------------------------------------------------------------------------
// building blocks
// ---------------------------------------------------------------------------
const Card: React.FC<{ title?: React.ReactNode; right?: React.ReactNode; className?: string; children: React.ReactNode }> = ({ title, right, className = '', children }) => (
  <section className={`rounded-2xl border border-white/[0.06] bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${className}`}>
    {(title || right) && (
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</h2>
        {right}
      </div>
    )}
    {children}
  </section>
);

const Pill: React.FC<{ ok: boolean | null; children: React.ReactNode; title?: string }> = ({ ok, children, title }) => (
  <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${ok === null ? 'bg-slate-800/80 text-slate-400' : ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${ok === null ? 'bg-slate-500' : ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />{children}
  </span>
);

/** Per-strike OI around price, like the Sensibull glance, with floor/ceiling and price marked. */
const WallMap: React.FC<{ ladder: string | null; spot: number | null; walls: WallsAt | null }> = ({ ladder, spot, walls }) => {
  const rows = useMemo(() => {
    const all = parseOiLadder(ladder);
    if (!all.length || spot === null) return [];
    const near = all.filter(r => Math.abs(r.strike - spot) <= 250).sort((a, b) => b.strike - a.strike);
    return near;
  }, [ladder, spot]);
  if (!rows.length) {
    return <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-800 text-[12px] text-slate-500">No OI ladder yet. The map appears with live data from 09:00.</div>;
  }
  const max = Math.max(...rows.map(r => Math.max(r.putOI, r.callOI)), 1);
  const priceIdx = rows.findIndex(r => r.strike < (spot ?? 0));
  return (
    <div className="space-y-[3px] font-mono text-[10.5px]">
      <div className="mb-1 grid grid-cols-[1fr_64px_1fr] text-[9.5px] uppercase tracking-wider text-slate-500">
        <span className="text-right pr-2">put OI · floor</span><span className="text-center">strike</span><span className="pl-2">call OI · ceiling</span>
      </div>
      {rows.map((r, i) => {
        const isFloor = walls?.floor === r.strike, isCeil = walls?.ceiling === r.strike;
        return (
          <React.Fragment key={r.strike}>
            {i === priceIdx && (
              <div className="relative my-1 flex items-center">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-950 shadow">NIFTY {fmt(spot)}</span>
              </div>
            )}
            <div className={`grid grid-cols-[1fr_64px_1fr] items-center rounded-md ${isFloor ? 'bg-emerald-500/[0.07] ring-1 ring-emerald-500/40' : isCeil ? 'bg-rose-500/[0.07] ring-1 ring-rose-500/40' : ''}`}>
              <div className="flex justify-end pr-2">
                <div className="relative h-3.5 w-full overflow-hidden rounded-l bg-slate-800/40">
                  <div className="absolute right-0 h-full rounded-l bg-gradient-to-l from-emerald-500/80 to-emerald-500/30" style={{ width: `${(r.putOI / max) * 100}%` }} />
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400">{(r.putOI / 1e5).toFixed(0)}L</span>
                </div>
              </div>
              <div className={`text-center font-bold ${isFloor ? 'text-emerald-300' : isCeil ? 'text-rose-300' : 'text-slate-300'}`}>
                {r.strike}
                {isFloor && <div className="text-[8.5px] font-semibold tracking-wider">FLOOR {walls?.floorOIChangePct !== null && walls?.floorOIChangePct !== undefined ? `${walls.floorOIChangePct > 0 ? '+' : ''}${walls.floorOIChangePct}%` : ''}</div>}
                {isCeil && <div className="text-[8.5px] font-semibold tracking-wider">CEILING {walls?.ceilingOIChangePct !== null && walls?.ceilingOIChangePct !== undefined ? `${walls.ceilingOIChangePct > 0 ? '+' : ''}${walls.ceilingOIChangePct}%` : ''}</div>}
              </div>
              <div className="pl-2">
                <div className="relative h-3.5 w-full overflow-hidden rounded-r bg-slate-800/40">
                  <div className="absolute left-0 h-full rounded-r bg-gradient-to-r from-rose-500/80 to-rose-500/30" style={{ width: `${(r.callOI / max) * 100}%` }} />
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9.5px] text-slate-400">{(r.callOI / 1e5).toFixed(0)}L</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** at wall → stalling → turning → confirmed, with failure shown in red. */
const Stepper: React.FC<{ label: string; wall: number | null; stage: string; last: SetupEvent | null }> = ({ label, wall, stage, last }) => {
  const failed = last?.stage === 'FAILED' && stage === 'IDLE';
  const shown = last?.stage === 'CONFIRMED' && stage === 'IDLE' ? 'CONFIRMED' : stage;
  const idx = STEPS.indexOf(shown as any);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold text-slate-300">{label}</span>
        <span className="font-mono text-[12px] font-bold text-slate-100">{wall ?? '—'}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`h-2 w-2 shrink-0 rounded-full ${failed ? 'bg-rose-500/70' : i <= idx ? (s === 'CONFIRMED' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-sky-400') : 'bg-slate-700'}`} />
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${failed ? 'bg-rose-500/40' : i < idx ? 'bg-sky-400/70' : 'bg-slate-800'}`} />}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-4 text-[9px] uppercase tracking-wider text-slate-500">
        {STEPS.map(s => <span key={s} className={s === shown ? 'text-slate-200' : ''}>{STEP_LABEL[s]}</span>)}
      </div>
      <div className={`mt-2 min-h-[16px] text-[11px] ${failed ? 'text-rose-300' : 'text-slate-400'}`}>
        {last ? `${hhmm(last.t)} · ${failed ? 'Wall failed — ' : ''}${last.note}` : 'No activity at this wall yet.'}
      </div>
    </div>
  );
};

/** stop ← entry → target, with the next wall marked, so the bet is visible before you click buy. */
const RRBar: React.FC<{ side: Side; entry: number | null; stop: number | null; target: number | null; wall: number | null }> = ({ side, entry, stop, target, wall }) => {
  if (entry === null || stop === null || target === null) {
    return <div className="rounded-lg border border-dashed border-slate-800 p-3 text-center text-[11px] text-slate-500">Enter entry, stop and target to see the bet.</div>;
  }
  const lo = Math.min(stop, target, entry, wall ?? entry) - 5, hi = Math.max(stop, target, entry, wall ?? entry) + 5;
  const pos = (x: number) => `${((x - lo) / (hi - lo)) * 100}%`;
  const left = Math.min(stop, entry), right = Math.max(stop, entry);
  const tl = Math.min(target, entry), tr = Math.max(target, entry);
  return (
    <div className="relative h-14">
      <div className="absolute top-6 h-2 w-full rounded-full bg-slate-800" />
      <div className="absolute top-6 h-2 rounded-full bg-rose-500/70" style={{ left: pos(left), width: `calc(${pos(right)} - ${pos(left)})` }} />
      <div className="absolute top-6 h-2 rounded-full bg-emerald-500/70" style={{ left: pos(tl), width: `calc(${pos(tr)} - ${pos(tl)})` }} />
      {[['stop', stop, 'text-rose-300'], ['entry', entry, 'text-white'], ['target', target, 'text-emerald-300']].map(([l, v, c]) => (
        <div key={l as string} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: pos(v as number) }}>
          <div className={`font-mono text-[10px] font-bold ${c}`}>{fmt(v as number)}</div>
          <div className="mx-auto mt-[3px] h-5 w-px bg-white/40" />
          <div className="text-[9px] uppercase tracking-wider text-slate-500">{l as string}</div>
        </div>
      ))}
      {wall !== null && (
        <div className="absolute top-4 -translate-x-1/2" style={{ left: pos(wall) }} title={`Next wall ${wall}`}>
          <div className="h-6 w-[3px] rounded bg-amber-400/80" />
        </div>
      )}
      <span className="absolute -bottom-0.5 right-0 text-[9px] text-amber-300/80">▌ next wall</span>
      <span className="sr-only">{side}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// screen
// ---------------------------------------------------------------------------
export const ManualTrading: React.FC<{ historyLog: MarketSnapshot[]; niftyLtp: number | null }> = ({ historyLog, niftyLtp }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 5_000); return () => clearInterval(id); }, []);
  const phase = marketPhase(istMin(now), istWeekday(now));
  const latest = historyLog[0];
  const liveToday = latest?.timestamp && istDay(latest.timestamp) === istDay(now);
  const spot = phase === 'CLOSED' ? null : (niftyLtp ?? latest?.niftyLtp ?? null);
  const setup = useMemo(() => runSetup(historyLog), [historyLog]);

  // data quality + Momentum context
  const [ops, setOps] = useState<any>(null);
  useEffect(() => {
    let stop = false;
    const tick = () => fetchOpsState().then(r => { if (!stop) setOps(r); }).catch(() => {});
    tick();
    const id = setInterval(tick, 15_000);
    return () => { stop = true; clearInterval(id); };
  }, []);
  const ageSec = latest?.timestamp ? Math.round((now - latest.timestamp) / 1000) : null;
  const gaps = historyLog.slice(0, 7).map((s, i, a) => (i && s.timestamp && a[i - 1].timestamp ? (a[i - 1].timestamp! - s.timestamp) / 1000 : null)).filter((g): g is number => g !== null).sort((a, b) => a - b);
  const cadence = gaps.length ? Math.round(gaps[Math.floor(gaps.length / 2)]) : null;
  const momentum = ops?.snapshot?.engines?.momentum;

  // your record
  const [record, setRecord] = useState<RecordTrade[] | null>(null);
  useEffect(() => {
    let stop = false;
    const load = () => fetch('/api/ops/manual-record', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(j => { if (!stop && j) setRecord(j.trades); }).catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => { stop = true; clearInterval(id); };
  }, []);
  const track = useMemo(() => onTrack(record ?? []), [record]);

  // alerts on fresh events (market hours only)
  const announced = useRef<Set<string>>(new Set());
  const [alertsOn, setAlertsOn] = useState(() => store.get('manual_alerts') === 'on');
  useEffect(() => {
    if (phase === 'CLOSED') return;
    const fresh = setup.events.filter(e => Date.now() - e.t < 3 * 60_000 && ['TURNING', 'CONFIRMED', 'FAILED'].includes(e.stage));
    for (const e of fresh) {
      const key = `${e.t}-${e.side}-${e.stage}`;
      if (announced.current.has(key)) continue;
      announced.current.add(key);
      logJournal('manual', { event: 'SETUP', side: e.side, stage: e.stage, wall: e.wall, spot: e.spot, note: e.note, plan: e.plan ?? null, barAt: e.t });
      if (!alertsOn) continue;
      beep(e.stage === 'CONFIRMED' ? 880 : e.stage === 'FAILED' ? 220 : 550);
      notify(`${e.side} ${e.stage} · ${e.wall}`, e.note);
    }
  }, [setup.events, alertsOn, phase]);
  const toggleAlerts = async () => {
    const next = !alertsOn;
    setAlertsOn(next);
    store.set('manual_alerts', next ? 'on' : 'off');
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch { /* ignore */ } }
    if (next) beep(660);
  };

  // ticket
  const lastConfirmed = [...setup.events].reverse().find(e => e.stage === 'CONFIRMED');
  const [side, setSide] = useState<Side>('LONG');
  const [product, setProduct] = useState<Product>('MIS');
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [target, setTarget] = useState('');
  const [premium, setPremium] = useState('');
  const [ppp, setPpp] = useState(() => store.get('manual_ppp') || '0.5');
  const [qty, setQty] = useState('65');
  const dayKey = `manual_trades_${istDay()}`;
  const [tradesToday, setTradesToday] = useState(() => Number(store.get(dayKey) || 0));
  const [loggedTrade, setLoggedTrade] = useState<{ side: Side; entry: number | null; stop: number | null; target: number | null } | null>(null);
  const num = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s)) ? null : Number(s));
  const w = setup.walls;
  const fillFromPlan = () => {
    if (lastConfirmed?.plan) {
      const p = lastConfirmed.plan;
      setSide(p.side); setEntry(String(spot ?? p.entry)); setStop(String(p.stop)); setTarget(String(p.target));
    } else if (spot) setEntry(String(spot));
  };
  const nextWall = side === 'LONG' ? w?.ceiling ?? null : w?.floor ?? null;
  const ticket = checkTicket({
    side, product, entry: num(entry) ?? spot ?? 0, stop: num(stop), target: num(target), nextWall,
    supportWall: side === 'LONG' ? w?.floor ?? null : w?.ceiling ?? null,
    supportWallOIChangePct: side === 'LONG' ? w?.floorOIChangePct ?? null : w?.ceilingOIChangePct ?? null,
    qty: num(qty) ?? 65, premiumPerPoint: num(ppp), premium: num(premium), charges: DEFAULT_CHARGES,
    tradesToday, maxTradesPerDay: 1, plannedPts: 30
  });
  const logEntry = () => {
    const n = tradesToday + 1;
    setTradesToday(n); store.set(dayKey, String(n)); store.set('manual_ppp', ppp);
    const e = num(entry) ?? spot;
    setLoggedTrade({ side, entry: e, stop: num(stop), target: num(target) });
    logJournal('manual', { event: 'TICKET', side, product, entry: e, stop: num(stop), target: num(target), premium: num(premium), premiumPerPoint: num(ppp), qty: num(qty), checks: ticket.checks, spot });
  };

  // trail
  const [trailOn, setTrailOn] = useState(false);
  const trailRef = useRef<number | null>(null);
  const trail = trailOn ? trailLevel(side, setup.bars, trailRef.current) : null;
  useEffect(() => { trailRef.current = trailOn ? trail : null; }, [trail, trailOn]);
  const trailHit = trail !== null && spot !== null && (side === 'LONG' ? spot <= trail : spot >= trail);

  // journal
  const [paste, setPaste] = useState('');
  const [charges, setCharges] = useState('');
  const [feel, setFeel] = useState<Feelings>({ before: null, worst: null, after: null, words: '' });
  const [stopUsed, setStopUsed] = useState('');
  const trips = useMemo(() => pairRoundTrips(parseExecutedOrders(paste)), [paste]);
  const rows = trips.map((t, i) => {
    const ex = measureExcursion(t, istDay(), setup.ticks);
    return { t, ex, row: journalRow(istDay(), i + 1, t, ex, { charges: num(charges), setup: '', stop: num(stopUsed), exitDriver: '', rulesKept: '', lesson: '', feelings: feel }) };
  });
  const [saved, setSaved] = useState(false);
  const saveJournal = () => {
    rows.forEach(r => logJournal('manual', { event: 'TRADE', ...r.t, excursion: r.ex, charges: num(charges), stop: num(stopUsed), feelings: feel, row: r.row }));
    const net = rows.reduce((a, r) => a + r.t.gross, 0) - (num(charges) ?? 0);
    store.set('manual_last_day', JSON.stringify({ day: istDay(), net: Math.round(net), trades: rows.length }));
    setSaved(true);
    setLoggedTrade(null);
  };
  const copyRows = () => { try { navigator.clipboard.writeText(rows.map(r => r.row).join('\n')); } catch { /* ignore */ } };

  // the decision
  const lastOf = (s: 'LONG' | 'SHORT') => [...setup.events].reverse().find(e => e.side === s) ?? null;
  const longLast = lastOf('LONG'), shortLast = lastOf('SHORT');
  const decision = deriveManualDecision({
    phase, spot, walls: liveToday ? w : null,
    long: { stage: setup.state.long.stage, last: longLast },
    short: { stage: setup.state.short.stage, last: shortLast },
    ageMs: { long: longLast ? now - longLast.t - 60_000 : Infinity, short: shortLast ? now - shortLast.t - 60_000 : Infinity },
    tradesToday, maxTrades: 1, watched: loggedTrade, nextOpenLabel: nextOpenLabel(now)
  });
  const T = TONE[decision.tone];
  const countdown = (() => {
    const m = istMin(now);
    const left = (to: number) => { const d = to - m; return d >= 60 ? `${Math.floor(d / 60)}h ${d % 60}m` : `${d}m`; };
    if (phase === 'CLOSED') return nextOpenLabel(now);
    if (phase === 'PRE_OPEN') return `Open in ${left(9 * 60 + 15)}`;
    if (phase === 'OPENING') return `Your window in ${left(9 * 60 + 30)}`;
    if (phase === 'WINDOW') return `Window closes in ${left(14 * 60 + 45)}`;
    return `Close in ${left(15 * 60 + 30)}`;
  })();

  const lastDay = (() => { try { return JSON.parse(store.get('manual_last_day') || 'null'); } catch { return null; } })();
  const showReminder = lastDay && lastDay.day !== istDay() && Math.abs(lastDay.net) >= 1500 && phase !== 'CLOSED';
  const input = 'w-full rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2 text-sm text-white outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20';
  const sev = (s: string) => (s === 'BLOCK' ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : s === 'WARN' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-200');

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-8 pt-1">
        {showReminder && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
            Last session ({lastDay.day}): {rupees(lastDay.net)} on {lastDay.trades} trade(s). Same size, same rules, one trade.
          </div>
        )}

        {/* 1 · the decision */}
        <section className={`relative overflow-hidden rounded-3xl border ${T.ring} bg-slate-950 p-5 sm:p-6`}>
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${T.glow} via-transparent to-transparent`} />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${T.chip}`}>{countdown}</span>
                <span className="text-[11px] text-slate-500">your system · one trade · ~30 pts · stop as a number</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className={`relative flex h-3 w-3`}>
                  {phase !== 'CLOSED' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${T.dot} opacity-50`} />}
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${T.dot}`} />
                </span>
                <h1 className={`text-3xl font-black tracking-tight sm:text-4xl ${T.text}`}>{decision.word}</h1>
              </div>
              <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate-200">{decision.line}</p>
              <p className="mt-2 text-[10.5px] text-slate-500">What your rules see — not advice. The mechanical setup showed no edge on its own; your judgement decides.</p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Nifty</div>
                <div className="font-mono text-3xl font-black text-white">{phase === 'CLOSED' ? '—' : fmt(spot, 1)}</div>
                <div className="text-[10.5px] text-slate-500">{phase === 'CLOSED' ? 'market closed' : ageSec !== null ? `${ageSec}s ago · 5m ${setup.trend}` : 'no tick'}</div>
              </div>
              <div className="flex flex-wrap gap-1.5 lg:justify-end">
                <Pill ok={phase === 'CLOSED' ? null : ageSec !== null && ageSec <= 60}>price {phase === 'CLOSED' ? 'closed' : `${ageSec ?? '?'}s`}</Pill>
                <Pill ok={phase === 'CLOSED' ? null : cadence !== null && cadence <= 45}>refresh {phase === 'CLOSED' ? '—' : `${cadence ?? '?'}s`}</Pill>
                <Pill ok={phase === 'CLOSED' ? null : setup.hasLadder}>OI {phase === 'CLOSED' ? '—' : setup.hasLadder ? 'live' : 'missing'}</Pill>
                <Pill ok={null} title="Context only; its entries came late in each tested session">Momentum {momentum?.state ?? '?'}</Pill>
                <button onClick={toggleAlerts} className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${alertsOn ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-300'}`}>alerts {alertsOn ? 'on' : 'off'}</button>
              </div>
            </div>
          </div>
        </section>

        {/* 2 · map + steppers | on track */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card title="Walls around price" right={<span className="text-[10px] text-slate-500">OI per strike · writers' change over ~5 min</span>}>
            <WallMap ladder={liveToday ? setup.lastLadder : null} spot={spot} walls={liveToday ? w : null} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Stepper label="LONG off the floor" wall={w?.floor ?? null} stage={setup.state.long.stage} last={longLast} />
              <Stepper label="SHORT off the ceiling" wall={w?.ceiling ?? null} stage={setup.state.short.stage} last={shortLast} />
            </div>
          </Card>

          <Card title="Am I on track?" right={<span className="text-[10px] text-slate-500">from your journal</span>}>
            {record === null ? (
              <div className="text-[12px] text-slate-500">Loading your record… (needs the restarted server)</div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-xl border ${TONE[track.tone].ring} bg-slate-950/50 p-3 text-[12.5px] leading-relaxed ${TONE[track.tone].text}`}>{track.verdict}</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['win rate', track.winRate === null ? '—' : `${track.winRate}%`, 'goal 75%'],
                    ['net', track.trades ? rupees(track.net) : '—', track.netComplete ? 'after charges' : 'some gross'],
                    ['rules kept', track.rulesPct === null ? '—' : `${track.rulesPct}%`, 'goal 80%+']
                  ].map(([l, v, s]) => (
                    <div key={l} className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-2.5">
                      <div className="text-[9.5px] uppercase tracking-wider text-slate-500">{l}</div>
                      <div className="mt-0.5 font-mono text-lg font-black text-white">{v}</div>
                      <div className="text-[9.5px] text-slate-500">{s}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-slate-500"><span>sample: {track.trades} of {track.sampleGoal} trades</span><span>avg captured {track.avgPts ?? '—'} pts</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: `${Math.min(100, (track.trades / track.sampleGoal) * 100)}%` }} /></div>
                </div>
                {track.workOn.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Work on:</span>
                    {track.workOn.map(x => <span key={x} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">{x}</span>)}
                  </div>
                )}
                <div className="space-y-1.5">
                  {(record ?? []).slice(0, 5).map(t => {
                    const money = t.net ?? t.gross;
                    return (
                      <div key={`${t.date}${(t as any).entryTime}`} className="flex items-center gap-2 rounded-lg bg-slate-950/40 px-2.5 py-1.5 text-[11.5px]">
                        <span className="w-[72px] font-mono text-slate-500">{t.date.slice(5)}</span>
                        <span className={`w-12 font-bold ${t.side === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}`}>{t.side ?? '?'}</span>
                        <span className="w-14 font-mono text-slate-300">{t.spotPts !== null ? `${t.spotPts > 0 ? '+' : ''}${t.spotPts}p` : '—'}</span>
                        <span className={`flex-1 font-mono font-bold ${money !== null && money >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{money !== null ? rupees(money) : '?'}{t.net === null && money !== null ? ' g' : ''}</span>
                        <span className="flex gap-0.5">
                          {Array.from({ length: t.rulesKept }).map((_, i) => <span key={`k${i}`} className="h-1.5 w-1.5 rounded-full bg-emerald-400" />)}
                          {Array.from({ length: t.rulesBroken }).map((_, i) => <span key={`b${i}`} className="h-1.5 w-1.5 rounded-full bg-rose-400" />)}
                        </span>
                        {t.exitDriver && <span className={`rounded px-1.5 text-[9.5px] font-bold ${t.exitDriver === 'PLAN' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{t.exitDriver}</span>}
                      </div>
                    );
                  })}
                  {!record?.length && <div className="text-[12px] text-slate-500">No trades yet. Save one from the journal below.</div>}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 3 · plan the trade | trail + today */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card title="Plan the trade" right={<button onClick={fillFromPlan} className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/5">use last confirmed setup</button>}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="grid grid-cols-2 gap-2.5 text-[10.5px] text-slate-400">
                <label className="col-span-2 flex gap-1.5">
                  {(['LONG', 'SHORT'] as Side[]).map(sd => (
                    <button key={sd} type="button" onClick={() => setSide(sd)}
                      className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${side === sd ? (sd === 'LONG' ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/50' : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/50') : 'bg-slate-900 text-slate-400'}`}>{sd}</button>
                  ))}
                  {(['MIS', 'NRML'] as Product[]).map(pr => (
                    <button key={pr} type="button" onClick={() => setProduct(pr)}
                      className={`w-16 rounded-lg py-2 text-[11px] font-bold transition ${product === pr ? (pr === 'MIS' ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/50' : 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/50') : 'bg-slate-900 text-slate-500'}`}>{pr}</button>
                  ))}
                </label>
                <label>Entry (Nifty)<input className={input} value={entry} placeholder={spot ? String(spot) : ''} onChange={e => setEntry(e.target.value)} /></label>
                <label>Qty<input className={input} value={qty} onChange={e => setQty(e.target.value)} /></label>
                <label>Stop (Nifty)<input className={`${input} ${num(stop) === null ? 'border-rose-500/40' : ''}`} value={stop} onChange={e => setStop(e.target.value)} /></label>
                <label>Target (Nifty)<input className={`${input} ${num(target) === null ? 'border-rose-500/40' : ''}`} value={target} onChange={e => setTarget(e.target.value)} /></label>
                <label>Premium now<input className={input} value={premium} onChange={e => setPremium(e.target.value)} /></label>
                <label title="How far the premium moves per Nifty point for this strike; measure it, it changes day to day">₹ per Nifty pt<input className={input} value={ppp} onChange={e => setPpp(e.target.value)} /></label>
              </div>
              <div className="space-y-3">
                <RRBar side={side} entry={num(entry) ?? spot} stop={num(stop)} target={num(target)} wall={nextWall} />
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['risk', ticket.risk !== null ? `${ticket.risk} pts` : '—'],
                    ['reward', ticket.reward !== null ? `${ticket.reward} pts` : '—'],
                    ['R:R', ticket.rr ?? '—']
                  ].map(([l, v]) => (
                    <div key={l as string} className="rounded-lg bg-slate-950/50 p-2"><div className="text-[9px] uppercase tracking-wider text-slate-500">{l}</div><div className="font-mono text-sm font-bold text-white">{v}</div></div>
                  ))}
                </div>
                {ticket.netIfTarget !== null && (
                  <div className="rounded-lg bg-slate-950/50 p-2.5 text-[11px] text-slate-300">
                    After ~₹{DEFAULT_CHARGES} charges: <b className="text-emerald-300">{rupees(ticket.netIfTarget)}</b> at target · <b className="text-rose-300">{rupees(ticket.netIfStop!)}</b> at stop
                    {ticket.breakEvenWinRate !== null && <> · break-even win rate <b>{ticket.breakEvenWinRate}%</b></>}
                    {ticket.premiumStop !== null && <div className="mt-0.5 text-slate-500">premium stop ≈ {ticket.premiumStop} · target ≈ {ticket.premiumTarget}</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ticket.checks.map(c => (
                <span key={c.id + c.message} className={`rounded-lg border px-2 py-1 text-[11px] ${sev(c.severity)}`}>{c.severity === 'OK' ? '✓' : c.severity === 'WARN' ? '!' : '✕'} {c.message}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button disabled={!ticket.ok || phase === 'CLOSED'} onClick={logEntry}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${ticket.ok && phase !== 'CLOSED' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] hover:brightness-110' : 'cursor-not-allowed bg-slate-800 text-slate-500'}`}>
                {phase === 'CLOSED' ? 'Market closed' : ticket.ok ? 'I took this trade · log the plan' : 'Fix the ✕ items first'}
              </button>
              <span className="text-[11px] text-slate-500">trades today {tradesToday}/1 · you place the order in Kite</span>
            </div>
          </Card>

          <div className="space-y-4">
            <Card title="Trail">
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-300">
                <button onClick={() => setTrailOn(!trailOn)} disabled={phase === 'CLOSED'} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${trailOn ? 'bg-sky-500 text-sky-950' : 'bg-slate-800 text-slate-300 disabled:opacity-50'}`}>{trailOn ? 'trailing' : 'target hit → start trail'}</button>
                {trail !== null ? (
                  <span className="font-mono">trail <b className="text-white">{fmt(trail)}</b> <span className="text-slate-500">(last 1-min {side === 'LONG' ? 'low − 5' : 'high + 5'})</span>{trailHit && <b className="ml-2 text-rose-300">TRAIL HIT · exit</b>}</span>
                ) : <span className="text-slate-500">Moves only one way; exit when price closes through it.</span>}
              </div>
            </Card>
            <Card title="Today" right={<span className="text-[10px] text-slate-500">{setup.events.length} setup events</span>}>
              <div className="max-h-64 space-y-1 overflow-y-auto custom-scrollbar">
                {[...setup.events].reverse().slice(0, 40).map((e, i) => (
                  <div key={i} className="flex gap-2 text-[11px]">
                    <span className="w-10 shrink-0 font-mono text-slate-500">{hhmm(e.t)}</span>
                    <span className={`w-16 shrink-0 font-bold ${e.stage === 'CONFIRMED' ? 'text-emerald-300' : e.stage === 'FAILED' ? 'text-rose-300' : e.stage === 'TURNING' ? 'text-sky-300' : 'text-amber-300'}`}>{STEP_LABEL[e.stage] ?? e.stage}</span>
                    <span className="text-slate-400">{e.side} {e.wall} · {e.note}</span>
                  </div>
                ))}
                {!setup.events.length && <div className="text-[12px] text-slate-500">{phase === 'CLOSED' ? 'Market closed. Setup events appear here during the session.' : 'Nothing yet today.'}</div>}
              </div>
            </Card>
          </div>
        </div>

        {/* 4 · journal */}
        <details className="group rounded-2xl border border-white/[0.06] bg-slate-900/50 p-4" open={rows.length > 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Journal · paste Kite's Executed lines</span>
            <span className="text-[10px] text-slate-500 group-open:hidden">open</span>
          </summary>
          <div className="mt-3 space-y-2">
            <textarea className={`${input} h-24 font-mono text-[11px]`} value={paste} onChange={e => { setPaste(e.target.value); setSaved(false); }} placeholder="09:42:07  SELL  NIFTY 1st w DEC 25750 CE NFO  NRML  65 / 65  236.15  COMPLETE" />
            <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-400 md:grid-cols-5">
              <label>Charges ₹ (contract note)<input className={input} value={charges} onChange={e => setCharges(e.target.value)} /></label>
              <label>Stop you used (Nifty)<input className={input} value={stopUsed} onChange={e => setStopUsed(e.target.value)} /></label>
              {(['before', 'worst', 'after'] as const).map(k => (
                <label key={k}>Feeling {k} · 1 calm – 5 panicky
                  <select className={input} value={feel[k] ?? ''} onChange={e => setFeel({ ...feel, [k]: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">?</option>{[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <input className={input} placeholder="a word or two (calm, hope, FOMO, relief…)" value={feel.words} onChange={e => setFeel({ ...feel, words: e.target.value })} />
            {rows.map((r, i) => (
              <div key={i} className="rounded-lg bg-slate-950/50 p-2.5 font-mono text-[11.5px] text-slate-300">
                {r.t.view} {r.t.strike} {r.t.optionType} · {r.t.entryTime}→{r.t.exitTime} · {r.t.entryPrice}→{r.t.exitPrice} × {r.t.qty} = <b className={r.t.gross >= 0 ? 'text-emerald-300' : 'text-rose-300'}>₹{r.t.gross}</b>
                {' '}· Nifty {r.ex.spotIn ?? '?'}→{r.ex.spotOut ?? '?'} · best {r.ex.mfe ?? '?'} / worst {r.ex.mae ?? '?'} pts
                {r.t.product !== 'MIS' && <span className="text-amber-300"> · {r.t.product}</span>}
              </div>
            ))}
            {rows.length > 0 && (
              <div className="flex gap-2">
                <button onClick={saveJournal} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-950">{saved ? 'saved ✓' : 'save to journal'}</button>
                <button onClick={copyRows} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200">copy markdown row</button>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
};

export default ManualTrading;
