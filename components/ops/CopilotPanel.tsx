/**
 * Co-pilot panel (Nifty50Ops tab) and the app-wide toast for its alerts.
 * Reads GET /api/ops/copilot; never writes anything. Alerts are in-app only.
 */
import React, { useEffect, useRef, useState } from 'react';

export interface CopilotAlert { id: string; at: number; time: string; kind: string; severity: 'info' | 'warn' | 'action'; title: string; message: string; quiet?: boolean }

/** Market hours on the client too, so an older server's after-hours alerts never pop up. */
const inMarketHours = (ms: number) => {
  const d = new Date(new Date(ms).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const m = d.getHours() * 60 + d.getMinutes();
  return d.getDay() !== 0 && d.getDay() !== 6 && m >= 9 * 60 + 15 && m <= 15 * 60 + 30;
};
export const isLiveAlert = (a: CopilotAlert) => !a.quiet && inMarketHours(a.at);
interface SetupEvent { t: number; side: string; stage: string; wall: number; spot: number; note: string; plan?: any }
export interface CopilotStatus {
  asOf: number;
  spot: number | null;
  lastTickAgeSec: number | null;
  cadenceSec: number | null;
  ladder: boolean;
  walls: { floor: number | null; floorOIChangePct: number | null; ceiling: number | null; ceilingOIChangePct: number | null } | null;
  stages: { long: { stage: string; wall: number | null; last: SetupEvent | null }; short: { stage: string; wall: number | null; last: SetupEvent | null } };
  trend5m: string;
  events: SetupEvent[];
  alerts: CopilotAlert[];
  shadow: any;
  watched: any;
  ticksToday: number;
  checksDone?: string[];
  pulse?: PulseView | null;
  pulses?: PulseView[];
}

export interface PulseView {
  t: number; spot: number; move1: number | null; move5: number | null;
  flow: 'BULLISH' | 'BEARISH' | 'RANGE' | 'UNWINDING' | 'QUIET' | 'UNKNOWN';
  putsBelowL: number | null; callsAboveL: number | null;
  top5m: { strike: number; side: 'PE' | 'CE'; changeL: number; nowL: number }[];
  top1m: { strike: number; side: 'PE' | 'CE'; changeL: number; nowL: number }[];
  adv: number | null; dec: number | null; advChange5: number | null;
  pcr: number | null; pcrChange5: number | null; sent: number | null; sentChange5: number | null;
  drivers1m: { s: string; pts: number }[]; leadersDay: { s: string; pts: number }[];
  headline: string; lines: string[];
}

export async function fetchCopilot(): Promise<CopilotStatus | null> {
  try {
    const r = await fetch('/api/ops/copilot', { cache: 'no-store' });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const SEV: Record<string, string> = {
  info: 'border-slate-700 bg-slate-900/80 text-slate-200',
  warn: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  action: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100'
};
const STAGE: Record<string, string> = {
  IDLE: 'text-slate-500', AT_WALL: 'text-amber-300', STALLING: 'text-amber-200', TURNING: 'text-sky-300', CONFIRMED: 'text-emerald-300', FAILED: 'text-rose-300'
};
const hm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

export const CopilotPanel: React.FC<{ active: boolean }> = ({ active }) => {
  const [s, setS] = useState<CopilotStatus | null>(null);
  useEffect(() => {
    if (!active) return;
    let stop = false;
    const load = () => fetchCopilot().then(x => { if (!stop) setS(x); });
    load();
    const id = window.setInterval(load, 5_000);
    return () => { stop = true; window.clearInterval(id); };
  }, [active]);

  if (!s) return <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 text-xs text-slate-500">Co-pilot: waiting for the server…</div>;
  const w = s.walls;
  const side = (label: string, x: CopilotStatus['stages']['long'], wall: number | null | undefined, chg: number | null | undefined) => (
    <div className="flex-1 min-w-[180px] rounded-lg border border-white/5 bg-slate-950/50 p-2">
      <div className="flex justify-between text-[11px] text-slate-400"><span>{label}</span><b className={STAGE[x.stage] ?? 'text-slate-300'}>{x.stage}</b></div>
      <div className="text-lg font-black text-white">{wall ?? '—'}</div>
      <div className="text-[11px] text-slate-400">writers {chg === null || chg === undefined ? '?' : `${chg > 0 ? '+' : ''}${chg}%`}{s.spot && wall ? ` · ${Math.round(Math.abs(s.spot - wall))} pts away` : ''}</div>
      {x.last && <div className="mt-1 text-[11px] text-slate-300">{hm(x.last.t)} {x.last.stage}: {x.last.note}</div>}
    </div>
  );
  const sh = s.shadow;
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/60 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
        <b className="text-sm text-white font-sans">Co-pilot</b>
        <span className="text-slate-300">Nifty {s.spot ?? '—'}</span>
        <span className={s.lastTickAgeSec !== null && s.lastTickAgeSec <= 60 ? 'text-emerald-300' : 'text-rose-300'}>tick {s.lastTickAgeSec ?? '?'}s ago</span>
        <span className={s.cadenceSec !== null && s.cadenceSec <= 45 ? 'text-emerald-300' : 'text-amber-300'}>every {s.cadenceSec ?? '?'}s</span>
        <span className={s.ladder ? 'text-emerald-300' : 'text-rose-300'}>OI {s.ladder ? 'live' : 'missing'}</span>
        <span className="text-slate-400">5m {s.trend5m}</span>
        <span className="text-slate-500">{s.ticksToday} ticks today</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {side('LONG off floor', s.stages.long, w?.floor, w?.floorOIChangePct)}
        {side('SHORT off ceiling', s.stages.short, w?.ceiling, w?.ceilingOIChangePct)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/5 bg-slate-950/50 p-2 text-slate-300">
          <div className="text-slate-400 mb-1">Your logged trade (Manual tab)</div>
          {s.watched ? (
            <div className="font-mono">{s.watched.side} entry {s.watched.entry ?? '?'} · stop {s.watched.stop ?? '?'} · target {s.watched.target ?? '?'}
              {s.watched.trail !== null && s.watched.trail !== undefined && <> · trail {s.watched.trail}</>} · {s.watched.status}{s.watched.targetHit ? ' · target hit' : ''}</div>
          ) : <div className="text-slate-500">none logged today (use "I took this trade" on the Manual tab)</div>}
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-950/50 p-2 text-slate-300">
          <div className="text-slate-400 mb-1">PAPER shadow of your system (no orders)</div>
          {sh ? (
            <div className="font-mono">{sh.side} {sh.entryTime?.slice(0, 5)} @ {sh.entry} · stop {sh.stop} · tgt {sh.target} · {sh.status === 'CLOSED' ? <b className={sh.points >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{sh.result} {sh.points >= 0 ? '+' : ''}{sh.points} pts</b> : 'OPEN'}</div>
          ) : <div className="text-slate-500">no qualifying setup yet (confirmed, room ≥ 30, wall defended, 09:30–14:45)</div>}
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto space-y-1">
        {[...s.alerts].filter(isLiveAlert).reverse().slice(0, 30).map(a => (
          <div key={a.id} className={`rounded-md border px-2 py-1 text-[11px] ${SEV[a.severity] ?? SEV.info}`}>
            <span className="text-slate-400 font-mono mr-2">{a.time.slice(0, 5)}</span><b>{a.title}</b> <span className="opacity-80">· {a.message}</span>
          </div>
        ))}
        {!s.alerts.length && <div className="text-[11px] text-slate-500">No alerts today.</div>}
      </div>
    </div>
  );
};

/** App-wide toasts for new warn/action co-pilot alerts. In-app only. */
export const CopilotToasts: React.FC = () => {
  const [toasts, setToasts] = useState<CopilotAlert[]>([]);
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      const s = await fetchCopilot();
      if (stop || !s) return;
      if (seen.current === null) { seen.current = new Set(s.alerts.map(a => a.id)); return; } // don't replay the backlog
      const fresh = s.alerts.filter(a => !seen.current!.has(a.id) && a.severity !== 'info' && isLiveAlert(a));
      s.alerts.forEach(a => seen.current!.add(a.id));
      if (fresh.length) setToasts(t => [...t, ...fresh].slice(-4));
    };
    load();
    const id = window.setInterval(load, 10_000);
    return () => { stop = true; window.clearInterval(id); };
  }, []);
  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => setToasts(t => t.slice(1)), 12_000);
    return () => window.clearTimeout(id);
  }, [toasts]);
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map(a => (
        <button key={a.id} onClick={() => setToasts(t => t.filter(x => x.id !== a.id))}
          className={`text-left rounded-lg border px-3 py-2 text-xs shadow-xl ${SEV[a.severity] ?? SEV.info}`}>
          <div className="font-bold">{a.title}</div>
          <div className="opacity-80">{a.message}</div>
          <div className="mt-1 text-[10px] text-slate-400">{a.time.slice(0, 5)} · Nifty50Ops co-pilot · click to dismiss</div>
        </button>
      ))}
    </div>
  );
};

export default CopilotPanel;

/** One poll of the co-pilot shared by the whole Nifty50Ops console. */
export function useCopilot(active: boolean, everyMs = 5_000): CopilotStatus | null {
  const [s, setS] = useState<CopilotStatus | null>(null);
  useEffect(() => {
    if (!active) return;
    let stop = false;
    const load = () => fetchCopilot().then(x => { if (!stop && x) setS(x); });
    load();
    const id = window.setInterval(load, everyMs);
    return () => { stop = true; window.clearInterval(id); };
  }, [active, everyMs]);
  return s;
}

const SCHEDULE: { id: string; at: string; until?: string; label: string; check?: string; alertKind?: string }[] = [
  { id: 'preflight', at: '08:45', label: 'Pre-flight: server, token, expiry, lot size', check: 'preflight' },
  { id: 'autopilot', at: '08:45', label: 'Autopilot: pull charts → analyse → build the plan (app)' },
  { id: 'charts', at: '08:55', label: 'Charts on disk; re-pull once if missing', check: 'charts' },
  { id: 'recut', at: '09:10', until: '10:30', label: 'Re-cut the plan at 09:10, 09:16 and on drift' },
  { id: 'feed', at: '09:05', label: 'Live feed: cadence, OI ladder, app tab', check: 'feed' },
  { id: 'zone', at: '09:20', label: 'Pre-market zone sanity vs live walls', check: 'zone' },
  { id: 'watch', at: '09:30', until: '14:45', label: 'Watch walls · confirm / fail setups' },
  { id: 'shadow', at: '09:30', until: '15:00', label: 'PAPER shadow of your wall system' },
  { id: 'eod', at: '15:40', label: 'End-of-day report', check: 'eod' }
];
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const istNowMin = () => { const [h, m] = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).split(':').map(Number); return h * 60 + m; };

/** Left rail of the console: who the agent is, what it is watching, and its run for today. */
export const AgentRail: React.FC<{ s: CopilotStatus | null; provider?: string | null; level?: number | null }> = ({ s, provider, level }) => {
  const nowMin = istNowMin();
  const [autopilot, setAutopilot] = useState(() => { try { return localStorage.getItem('premarket_autopilot') !== 'off'; } catch { return true; } });
  const toggleAutopilot = () => {
    const next = !autopilot;
    setAutopilot(next);
    try { localStorage.setItem('premarket_autopilot', next ? 'on' : 'off'); } catch { /* ignore */ }
  };
  const live = s?.lastTickAgeSec !== null && s?.lastTickAgeSec !== undefined && s.lastTickAgeSec <= 90;
  const done = new Set(s?.checksDone ?? []);
  const w = s?.walls;
  const badge = (stage?: string) => <b className={STAGE[stage ?? 'IDLE'] ?? 'text-slate-400'}>{stage ?? '—'}</b>;
  const sh = s?.shadow;
  return (
    <div className="space-y-3 text-[11px]">
      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-500/10 to-slate-900/40 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </span>
          <b className="text-sm text-slate-100">Nifty50Ops agent</b>
          <span className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">L{level ?? 1}</span>
        </div>
        <div className="mt-1 text-slate-400">{live ? 'Autonomous · watching the market' : 'Standing by · no live ticks'}{provider ? ` · ${provider}` : ''}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {['never places orders', 'never changes params', 'OTP stays yours', 'alerts in-app'].map(t => (
            <span key={t} className="rounded-full border border-white/10 px-1.5 py-px text-[9.5px] text-slate-400">{t}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-3 space-y-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Watching now</div>
        <div className="font-mono text-slate-200">Nifty {s?.spot ?? '—'} <span className={live ? 'text-emerald-300' : 'text-amber-300'}>· {s?.lastTickAgeSec ?? '?'}s</span></div>
        <div className="text-slate-400">refresh {s?.cadenceSec ?? '?'}s · OI {s?.ladder ? 'live' : 'missing'} · 5m {s?.trend5m ?? '—'}</div>
        <div className="flex justify-between"><span className="text-slate-400">Floor {w?.floor ?? '—'} <span className="text-slate-500">({w?.floorOIChangePct ?? '?'}%)</span></span>{badge(s?.stages.long.stage)}</div>
        <div className="flex justify-between"><span className="text-slate-400">Ceiling {w?.ceiling ?? '—'} <span className="text-slate-500">({w?.ceilingOIChangePct ?? '?'}%)</span></span>{badge(s?.stages.short.stage)}</div>
        <div className="border-t border-white/5 pt-1.5 text-slate-400">
          Your trade: {s?.watched ? <span className="text-slate-200">{s.watched.side} · stop {s.watched.stop ?? '?'} · tgt {s.watched.target ?? '?'}{s.watched.trail != null ? ` · trail ${s.watched.trail}` : ''} · {s.watched.status}</span> : <span className="text-slate-500">none logged</span>}
        </div>
        <div className="text-slate-400">
          PAPER shadow: {sh ? <span className={sh.status === 'CLOSED' ? (sh.points >= 0 ? 'text-emerald-300' : 'text-rose-300') : 'text-sky-300'}>{sh.side} @ {sh.entry}{sh.status === 'CLOSED' ? ` · ${sh.result} ${sh.points >= 0 ? '+' : ''}${sh.points}` : ' · open'}</span> : <span className="text-slate-500">no setup yet</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today's autonomous run</span>
          <button onClick={toggleAutopilot} title="Morning autopilot: pull charts, analyse and build the plan by itself"
            className={`rounded-full px-2 py-px text-[10px] font-bold ${autopilot ? 'bg-emerald-600/80 text-white' : 'bg-slate-800 text-slate-400'}`}>
            autopilot {autopilot ? 'ON' : 'OFF'}
          </button>
        </div>
        <ul className="space-y-1.5">
          {SCHEDULE.map(j => {
            const start = toMin(j.at), end = j.until ? toMin(j.until) : start + 10;
            if (j.id === 'autopilot' && !autopilot) return null;
            // Ticked only on evidence that it happened today, never by the clock alone.
            const titles = (s?.alerts ?? []).map(x => x.title);
            const evidence: Record<string, boolean> = {
              autopilot: titles.some(t => /Morning autopilot|Pre-market plan built/.test(t)),
              recut: titles.some(t => /Pre-market plan re-cut/.test(t)),
              watch: (s?.alerts ?? []).some(x => x.kind === 'setup'),
              shadow: Boolean(s?.shadow)
            };
            const finished = j.check ? done.has(j.check) : Boolean(evidence[j.id]) && nowMin >= start;
            const running = !finished && nowMin >= start && nowMin < end;
            const missed = !finished && !running && nowMin >= end;
            return (
              <li key={j.id} className="flex items-start gap-2" title={missed ? 'No record that this ran today' : undefined}>
                <span className={`mt-0.5 font-mono text-[10px] ${finished ? 'text-emerald-400' : running ? 'text-cyan-300' : missed ? 'text-slate-500' : 'text-slate-600'}`}>{finished ? '✓' : running ? '●' : missed ? '–' : '○'}</span>
                <span className="w-10 shrink-0 font-mono text-slate-500">{j.at}</span>
                <span className={finished ? 'text-slate-400' : running ? 'text-slate-100' : 'text-slate-500'}>{j.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

/** Right rail: the co-pilot's alerts, newest first. */
export const AlertsFeed: React.FC<{ s: CopilotStatus | null }> = ({ s }) => (
  <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-3">
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Agent alerts · market hours</div>
    <div className="space-y-1">
      {(s?.alerts ?? []).filter(isLiveAlert).slice().reverse().slice(0, 40).map(a => (
        <div key={a.id} className={`rounded-md border px-2 py-1 text-[11px] ${SEV[a.severity] ?? SEV.info}`}>
          <span className="mr-1.5 font-mono text-slate-400">{a.time.slice(0, 5)}</span><b>{a.title}</b>
          <div className="opacity-80">{a.message}</div>
        </div>
      ))}
      {!(s?.alerts ?? []).some(isLiveAlert) && <div className="text-[11px] text-slate-500">No alerts in market hours (09:15–15:30). Pre-market and after-close work is in the chat and the run list.</div>}
    </div>
  </div>
);


const FLOW_STYLE: Record<PulseView['flow'], { label: string; cls: string; dot: string }> = {
  BULLISH: { label: 'Bullish flow', cls: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40', dot: 'bg-emerald-400' },
  BEARISH: { label: 'Bearish flow', cls: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40', dot: 'bg-rose-400' },
  RANGE: { label: 'Range flow', cls: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/40', dot: 'bg-sky-400' },
  UNWINDING: { label: 'Unwinding', cls: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40', dot: 'bg-amber-400' },
  QUIET: { label: 'OI quiet', cls: 'bg-slate-700/50 text-slate-300', dot: 'bg-slate-400' },
  UNKNOWN: { label: 'No OI ladder', cls: 'bg-slate-800 text-slate-400', dot: 'bg-slate-600' }
};
const FLOW_MEANING: Record<PulseView['flow'], string> = {
  BULLISH: 'Put writers adding below price, call writers covering above.',
  BEARISH: 'Call writers adding above price, put writers covering below.',
  RANGE: 'Writers adding on both sides: price boxed between the walls.',
  UNWINDING: 'Writers covering on both sides: walls thinning, a break is easier.',
  QUIET: 'No meaningful OI change in the last ~5 minutes.',
  UNKNOWN: 'The snapshots carry no per-strike OI.'
};
const signed = (n: number | null, d = 1, unit = '') => (n === null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(d)}${unit}`);

/** Market Pulse: what changed this minute, in one glance. */
export const PulsePanel: React.FC<{ s: CopilotStatus | null }> = ({ s }) => {
  const p = s?.pulse ?? null;
  const list = (s?.pulses ?? []).slice().reverse().slice(0, 15);
  const live = p ? Date.now() - p.t < 3 * 60_000 : false;
  if (!p) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3 text-[12px] text-slate-500">
        <b className="text-slate-300">Market Pulse</b> · one brief per minute from 09:15 to 15:30: price move, which strikes' writers added or covered, breadth, PCR and the heavyweights moving Nifty.
      </div>
    );
  }
  const F = FLOW_STYLE[p.flow];
  const chip = (f: PulseView['top5m'][number]) => {
    const add = f.changeL > 0;
    const good = (f.side === 'PE' && add) || (f.side === 'CE' && !add); // support built / resistance removed
    return (
      <span key={`${f.strike}${f.side}`} className={`rounded-md px-1.5 py-0.5 font-mono text-[10.5px] ${good ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200'}`}>
        {f.strike} {f.side} {signed(f.changeL)}L
      </span>
    );
  };
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.06] to-slate-900/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex h-2 w-2">{live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />}<span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-cyan-400' : 'bg-slate-500'}`} /></span>
        <b className="text-[12px] uppercase tracking-[0.12em] text-cyan-200">Market Pulse</b>
        <span className="font-mono text-[11px] text-slate-400">{new Date(p.t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}{live ? '' : ' · last'}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${F.cls}`}>{F.label}</span>
        <span className="ml-auto font-mono text-sm font-black text-white">Nifty {p.spot.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {[
          ['1 min', signed(p.move1), p.move1],
          ['5 min', signed(p.move5), p.move5],
          ['puts ↓', signed(p.putsBelowL, 1, 'L'), p.putsBelowL],
          ['calls ↑', signed(p.callsAboveL, 1, 'L'), p.callsAboveL === null ? null : -p.callsAboveL],
          ['breadth', p.adv !== null ? `${p.adv}/${p.dec}` : '—', p.advChange5],
          ['PCR', p.pcr !== null ? p.pcr.toFixed(2) : '—', p.pcrChange5]
        ].map(([l, v, tone]) => (
          <div key={l as string} className="rounded-lg bg-slate-950/50 px-2 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">{l as string}</div>
            <div className={`font-mono text-[13px] font-bold ${tone === null || tone === undefined || tone === 0 ? 'text-slate-200' : (tone as number) > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{v as string}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-slate-400">{FLOW_MEANING[p.flow]} <span className="text-slate-600">Puts ↓ = put OI change below price; calls ↑ = call OI change above.</span></div>
      {(p.top5m.length > 0 || p.top1m.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500">
          <span>OI 5m</span>{p.top5m.map(chip)}
          {p.top1m.length > 0 && <><span className="ml-2">1m</span>{p.top1m.map(chip)}</>}
        </div>
      )}
      {(p.drivers1m.length > 0 || p.leadersDay.length > 0) && (
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
          {p.drivers1m.length > 0 && <span>Moving Nifty now: {p.drivers1m.map(d => <b key={d.s} className={d.pts >= 0 ? 'text-emerald-300' : 'text-rose-300'}> {d.s} {signed(d.pts)}</b>)}</span>}
          {p.leadersDay.length > 0 && <span>Today: {p.leadersDay.map(d => <b key={d.s} className={d.pts >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80'}> {d.s} {signed(d.pts)}</b>)}</span>}
        </div>
      )}
      {list.length > 1 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[10.5px] text-slate-500">last {list.length} minutes</summary>
          <div className="mt-1 max-h-40 space-y-0.5 overflow-y-auto font-mono text-[10.5px] custom-scrollbar">
            {list.map(x => (
              <div key={x.t} className="flex gap-2 text-slate-400">
                <span className="w-10 text-slate-500">{new Date(x.t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>
                <span className={`w-14 ${x.move1 === null ? '' : x.move1 > 0 ? 'text-emerald-300' : x.move1 < 0 ? 'text-rose-300' : ''}`}>{signed(x.move1)}</span>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${FLOW_STYLE[x.flow].dot}`} />
                <span className="truncate">{x.top5m[0] ? `${x.top5m[0].strike} ${x.top5m[0].side} ${signed(x.top5m[0].changeL)}L` : FLOW_STYLE[x.flow].label}{x.adv !== null ? ` · ${x.adv}/${x.dec}` : ''}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
