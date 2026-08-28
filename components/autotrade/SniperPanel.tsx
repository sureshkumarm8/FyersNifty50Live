/**
 * SNIPER PANEL — "Nifty Sniper: The Office Protocol"
 *
 * A mission console for exactly one trade a day, taken between 09:25 and 09:45,
 * managed to a hard stop at 10:15.
 *
 * This panel shares NOTHING with the Momentum panel: its own OrderManager, its
 * own log, its own positions, its own day statistics. The two strategies can
 * never show each other's numbers.
 *
 * All protocol rules live in services/sniperEngine.ts so they are unit tested
 * rather than tangled into rendering.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, Crosshair, Lock, Pause, Play, Timer } from 'lucide-react';
import { FyersCredentials, MarketSnapshot, PivotPoints } from '../../types';
import { OrderManager, Position } from '../../services/orderManager';
import { EnhancedSignalGenerator } from '../../services/enhancedSignalGenerator';
import { imageStorageService } from '../../services/imageStorage';
import { SNIPER, SniperPlaybook } from '../../services/sniperPlaybook';
import {
  OpeningRange, SniperEvaluation, SniperSetup, buildOpeningRange, checkExit,
  evaluate, istDayKey, istMinutesOf, phaseLabelOf, ENTRY_OPEN, ENTRY_CLOSE,
  HARD_STOP, MARKET_OPEN
} from '../../services/sniperEngine';
import { getNextExpiryDate } from '../../constants/niftyExpiryDates';
import { BlockList, Card, LogEntry, LogFeed, Meter, Pill, PositionsTable, Stat, inr } from './shared';
import { Handoff, HandoffBoard, RangeBoard, SetupBoard, fmt } from './SniperViews';

const LOTS_KEY = 'sniper_lots';
const DAY_KEY = 'sniper_day_state';
const LOT_SIZE = 75;

interface DayState {
  day: string;
  tradeTaken: boolean;
  pointsCaptured: number | null;
  exitReason: string | null;
  entrySymbol: string | null;
  /**
   * The live setup is persisted, not just held in memory: a refresh mid-trade
   * would otherwise orphan the +30/-30 and 10:15 exit rules while the position
   * stayed open.
   */
  setup: SniperSetup | null;
}

const freshDay = (day: string): DayState => ({
  day,
  tradeTaken: false,
  pointsCaptured: null,
  exitReason: null,
  entrySymbol: null,
  setup: null
});

function loadDayState(): DayState {
  const today = istDayKey(Date.now());
  try {
    const raw = localStorage.getItem(DAY_KEY);
    if (!raw) return freshDay(today);
    const parsed = JSON.parse(raw) as Partial<DayState>;
    // A yesterday flag must never block today's trade.
    if (!parsed || parsed.day !== today) return freshDay(today);
    return { ...freshDay(today), ...parsed, day: today };
  } catch {
    return freshDay(today);
  }
}

interface Props {
  credentials: FyersCredentials;
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  tradingMode: 'PAPER' | 'LIVE';
}

const mmss = (mins: number | null) => (mins == null ? '—' : `${mins}m`);

export const SniperPanel: React.FC<Props> = ({ credentials, niftyLtp, historyLog, pivots, tradingMode }) => {
  const [armed, setArmed] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [range, setRange] = useState<OpeningRange | null>(null);
  const [evaluation, setEvaluation] = useState<SniperEvaluation | null>(null);
  const [dayState, setDayState] = useState<DayState>(loadDayState);
  const [activeSetup, setActiveSetup] = useState<SniperSetup | null>(() => loadDayState().setup);
  const [playbook, setPlaybook] = useState<SniperPlaybook | null>(null);
  const [lots, setLots] = useState(() => Number(localStorage.getItem(LOTS_KEY)) || 1);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  const orderRef = useRef<OrderManager | null>(null);
  /** Guards the exit path: the monitor ticks every second and the close is async. */
  const exitingRef = useRef(false);
  const latest = useRef({ niftyLtp, historyLog, pivots });
  latest.current = { niftyLtp, historyLog, pivots };
  const setupRef = useRef<SniperSetup | null>(null);
  setupRef.current = activeSetup;
  const dayRef = useRef(dayState);
  dayRef.current = dayState;

  const addLog = useCallback((text: string, level: LogEntry['level'] = 'info') => {
    setLog(prev => [{ ts: Date.now(), text, level }, ...prev].slice(0, 150));
  }, []);

  // --- services -------------------------------------------------------------
  useEffect(() => {
    orderRef.current = new OrderManager(credentials, tradingMode === 'PAPER');
    setPositions([]);
  }, [credentials, tradingMode]);

  useEffect(() => {
    localStorage.setItem(LOTS_KEY, String(lots));
  }, [lots]);

  const persistDay = useCallback((next: DayState) => {
    setDayState(next);
    try {
      localStorage.setItem(DAY_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — the in-memory flag still guards this session */
    }
  }, []);

  // Roll the one-trade-per-day lock over at IST midnight.
  useEffect(() => {
    const today = istDayKey(tick);
    if (dayState.day !== today) persistDay(freshDay(today));
  }, [tick, dayState.day, persistDay]);

  // --- pre-market handoff ---------------------------------------------------
  const loadPlaybook = useCallback(async () => {
    try {
      const saved = await imageStorageService.loadState<{ playbook?: SniperPlaybook; generatedAt?: number }>(
        'preMarketDecision'
      );
      if (saved?.playbook && saved.generatedAt && istDayKey(saved.generatedAt) === istDayKey(Date.now())) {
        setPlaybook(saved.playbook);
        addLog(`📋 Pre-market plan loaded — ${saved.playbook.verdictHeadline}`, 'info');
      } else {
        setPlaybook(null);
      }
    } catch {
      setPlaybook(null);
    }
  }, [addLog]);

  useEffect(() => {
    loadPlaybook();
  }, [loadPlaybook]);

  // --- one-second clock so every countdown is honest ------------------------
  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /**
   * Countdowns need a one-second clock, but re-scoring the signal engine that
   * often is pure waste. This coarse tick changes once every ten seconds.
   */
  const slowTick = Math.floor(tick / 10_000);

  // --- the Download: lock the 09:15–09:25 range ------------------------------
  useEffect(() => {
    const now = new Date();
    const prevClose =
      historyLog.length > 0 && isFinite(historyLog[0].ptsChg)
        ? historyLog[0].niftyLtp - historyLog[0].ptsChg
        : null;
    const built = buildOpeningRange(historyLog, prevClose, now);
    if (!built) return;
    setRange(prev => {
      if (prev && prev.high === built.high && prev.low === built.low && prev.samples === built.samples) {
        return prev;
      }
      return built;
    });
  }, [historyLog, slowTick]);

  const rangeLockedRef = useRef(false);
  useEffect(() => {
    if (!range || rangeLockedRef.current) return;
    if (istMinutesOf(new Date(tick)) < ENTRY_OPEN) return;
    rangeLockedRef.current = true;
    addLog(
      `🔒 Range locked — high ${fmt(range.high)} / low ${fmt(range.low)} → support ${fmt(range.support)}, resistance ${fmt(range.resistance)} (${range.openType.replace('_', ' ')})`,
      'good'
    );
  }, [range, tick, addLog]);

  // --- live evaluation ------------------------------------------------------
  const expiry = useMemo(() => {
    const e = getNextExpiryDate();
    if (!e) return '';
    const d = new Date(e.date);
    return `${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  // The protocol needs a direction opinion. It is derived here, from this
  // panel's own data, and is never read from the Momentum panel.
  const liveSignal = useMemo(() => {
    void slowTick;
    if (!niftyLtp || historyLog.length < 5) {
      return { direction: 'NEUTRAL' as const, confidence: 0, reasons: [] as string[] };
    }
    const s = EnhancedSignalGenerator.generateSignal(
      historyLog,
      range?.support ?? pivots?.s1 ?? niftyLtp - 50,
      range?.resistance ?? pivots?.r1 ?? niftyLtp + 50,
      niftyLtp
    );
    return { direction: s.direction, confidence: s.confidence, reasons: s.reasons };
  }, [slowTick, niftyLtp, historyLog, range, pivots]);

  useEffect(() => {
    const now = new Date(tick);
    const spot = niftyLtp;
    const { direction: signalDirection, confidence: signalConfidence, reasons: signalReasons } = liveSignal;

    setEvaluation(
      evaluate({
        now,
        spot,
        range,
        signalDirection,
        signalConfidence,
        signalReasons,
        hasOpenPosition: positions.length > 0,
        dailyTradeDone: dayState.tradeTaken,
        expiry
      })
    );
  }, [tick, niftyLtp, range, liveSignal, positions.length, dayState.tradeTaken, expiry]);

  // --- position monitoring & the 10:15 hard stop ----------------------------
  const closeSymbol = useCallback(
    async (symbol: string, reason: string) => {
      const om = orderRef.current;
      if (!om) return;
      const pos = om.getPositions().find(p => p.symbol === symbol);
      if (!pos || exitingRef.current) return;
      exitingRef.current = true;
      setBusy(true);
      try {
        const res = await om.placeOrder(symbol, pos.side === 'LONG' ? 'SELL' : 'BUY', Math.abs(pos.quantity), 'MARKET');
        if (res.success) {
          addLog(`🚪 Exit ${symbol} — ${reason} · P&L ${inr(pos.pnl)}`, pos.pnl >= 0 ? 'good' : 'bad');
          persistDay({
            ...dayRef.current,
            pointsCaptured: setupRef.current
              ? Math.round(((niftyLtp ?? setupRef.current.entrySpot) - setupRef.current.entrySpot) *
                  (setupRef.current.direction === 'LONG' ? 1 : -1))
              : null,
            exitReason: reason,
            setup: null
          });
          setActiveSetup(null);
        } else {
          addLog(`❌ Exit rejected for ${symbol}: ${res.message ?? 'unknown error'}`, 'bad');
        }
        setPositions(om.getPositions());
      } finally {
        exitingRef.current = false;
        setBusy(false);
      }
    },
    [addLog, niftyLtp, persistDay]
  );

  useEffect(() => {
    const om = orderRef.current;
    if (!om) return;
    const open = om.getPositions();
    if (open.length === 0) {
      if (positions.length !== 0) setPositions([]);
      return;
    }

    // The hard stop is unconditional. Even with no setup in memory - a refresh,
    // a manually placed order - nothing may be held past 10:15.
    if (istMinutesOf(new Date(tick)) >= HARD_STOP) {
      closeSymbol(open[0].symbol, `${SNIPER.hardStop} hard stop`);
      return;
    }

    // Options premium is not tracked live here; the spot move drives the
    // protocol's +30 / -30 decision, exactly as the manual system does.
    const setup = setupRef.current;
    if (setup && niftyLtp) {
      const premium = Math.max(
        1,
        open[0].avgPrice + (niftyLtp - setup.entrySpot) * (setup.direction === 'LONG' ? 1 : -1) * SNIPER.itmDelta
      );
      open.forEach(p => om.updatePositionPnL(p.symbol, premium));
      const verdict = checkExit({ setup, spot: niftyLtp, now: new Date(tick) });
      if (verdict.exit) {
        const label =
          verdict.reason === 'TARGET'
            ? `target +${SNIPER.targetPoints} hit`
            : verdict.reason === 'STOP'
              ? `stop -${SNIPER.stopPoints} hit`
              : `${SNIPER.hardStop} hard stop`;
        closeSymbol(open[0].symbol, label);
        return;
      }
    }
    setPositions(om.getPositions());
  }, [tick, niftyLtp, closeSymbol, positions.length]);

  // --- execution ------------------------------------------------------------
  const execute = useCallback(async () => {
    const om = orderRef.current;
    const setup = evaluation?.setup;
    if (!om || !setup) return;
    if (dayRef.current.tradeTaken) {
      addLog('🛑 Blocked — today\'s single trade is already spent.', 'bad');
      return;
    }
    setBusy(true);
    try {
      const qty = lots * LOT_SIZE;
      const res = await om.placeOrder(setup.symbol, 'BUY', qty, 'MARKET');
      if (res.success) {
        setActiveSetup(setup);
        setPositions(om.getPositions());
        persistDay({ ...dayRef.current, tradeTaken: true, entrySymbol: setup.symbol, setup });
        addLog(
          `🎯 ENTERED ${setup.symbol} · ${qty} qty · spot ${fmt(setup.entrySpot)} → target ${fmt(setup.targetSpot)} / stop ${fmt(setup.stopSpot)}`,
          'good'
        );
      } else {
        addLog(`❌ Order rejected: ${res.message ?? 'unknown error'}`, 'bad');
      }
    } finally {
      setBusy(false);
    }
  }, [evaluation, lots, addLog, persistDay]);

  // --- derived view data ----------------------------------------------------
  const phase = evaluation?.phase ?? 'PRE_OPEN';
  const nowMins = istMinutesOf(new Date(tick));

  const banner = useMemo(() => {
    if (!evaluation) return { text: 'Initialising', tone: 'muted' as const, sub: '' };
    if (evaluation.mustExit) return { text: 'HARD STOP', tone: 'bad' as const, sub: 'Closing everything — 10:15 has passed.' };
    if (positions.length > 0)
      return { text: 'IN TRADE', tone: 'info' as const, sub: 'Managing the position. Target +30, stop −30, out by 10:15.' };
    if (dayState.tradeTaken)
      return { text: 'DAY COMPLETE', tone: 'muted' as const, sub: 'One trade taken. The protocol is finished for today.' };
    if (evaluation.canEnter)
      return { text: 'ARMED — TAKE IT', tone: 'good' as const, sub: 'Every gate is green. This is the trade.' };
    if (phase === 'ENTRY_WINDOW')
      return { text: 'WAITING', tone: 'warn' as const, sub: 'Inside the window, but the setup has not appeared.' };
    return { text: 'STAND DOWN', tone: 'muted' as const, sub: phaseLabelOf(phase) };
  }, [evaluation, positions.length, dayState.tradeTaken, phase]);

  const bannerCls = {
    good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_60px_-20px_rgba(16,185,129,0.8)]',
    bad: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    muted: 'border-slate-700 bg-slate-800/40 text-slate-300'
  }[banner.tone];

  const timeline = [
    { label: 'Download', from: MARKET_OPEN, to: ENTRY_OPEN, note: 'watch only' },
    { label: 'Entry', from: ENTRY_OPEN, to: ENTRY_CLOSE, note: 'the only window' },
    { label: 'Manage', from: ENTRY_CLOSE, to: HARD_STOP, note: 'no new trades' }
  ];

  // Does the live opening range agree with the levels read off last night's charts?
  const handoff = useMemo<Handoff | null>(() => {
    if (!playbook || !range) return null;
    const sDelta = Math.round(range.support - playbook.plannedSupport);
    const rDelta = Math.round(range.resistance - playbook.plannedResistance);
    const tight = Math.abs(sDelta) <= 40 && Math.abs(rDelta) <= 40;
    return { sDelta, rDelta, tight };
  }, [playbook, range]);

  return (
    <div className="space-y-4">
      {/* ---- command banner ---- */}
      <div className={`rounded-2xl border p-5 ${bannerCls}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">
              <Crosshair className="h-3.5 w-3.5" /> Office Protocol
            </div>
            <h2 className="mt-1 text-3xl font-black tracking-tight">{banner.text}</h2>
            <p className="mt-1 max-w-xl text-xs opacity-80">{banner.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setArmed(a => !a);
                addLog(armed ? '⏸️ Sniper monitoring paused.' : '▶️ Sniper monitoring armed.', 'info');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                armed
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
              }`}
            >
              {armed ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {armed ? 'Pause' : 'Arm'}
            </button>
          </div>
        </div>

        {/* countdowns */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="IST now" value={new Date(tick).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} />
          <Stat label="Entry opens in" value={mmss(evaluation?.minutesToEntry ?? null)} sub={SNIPER.entryStart} />
          <Stat
            label="No new entries in"
            value={mmss(evaluation?.minutesToNoNewEntries ?? null)}
            sub={SNIPER.reviewBy}
            tone={(evaluation?.minutesToNoNewEntries ?? 99) <= 5 ? 'warn' : 'default'}
          />
          <Stat
            label="Hard stop in"
            value={mmss(evaluation?.minutesToHardStop ?? null)}
            sub={SNIPER.hardStop}
            tone={(evaluation?.minutesToHardStop ?? 99) <= 10 ? 'bad' : 'default'}
          />
        </div>
      </div>

      {/* ---- phase timeline ---- */}
      <Card title="Protocol timeline" icon={<Timer className="h-4 w-4 text-emerald-400" />}>
        <div className="space-y-3">
          {timeline.map(t => {
            const active = nowMins >= t.from && nowMins < t.to;
            const done = nowMins >= t.to;
            const pct = active ? ((nowMins - t.from) / (t.to - t.from)) * 100 : done ? 100 : 0;
            return (
              <div key={t.label}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className={active ? 'font-semibold text-emerald-300' : done ? 'text-slate-500' : 'text-slate-400'}>
                    {t.label} <span className="text-slate-600">· {t.note}</span>
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {String(Math.floor(t.from / 60)).padStart(2, '0')}:{String(t.from % 60).padStart(2, '0')} —{' '}
                    {String(Math.floor(t.to / 60)).padStart(2, '0')}:{String(t.to % 60).padStart(2, '0')}
                  </span>
                </div>
                <Meter value={pct} tone={active ? 'bg-emerald-400' : done ? 'bg-slate-600' : 'bg-slate-800'} />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RangeBoard range={range} spot={niftyLtp} evaluation={evaluation} />
        <HandoffBoard playbook={playbook} handoff={handoff} onReload={loadPlaybook} />
      </div>

      <SetupBoard
        evaluation={evaluation}
        phase={phase}
        range={range}
        lots={lots}
        lotSize={LOT_SIZE}
        armed={armed}
        busy={busy}
        tradeTaken={dayState.tradeTaken}
        hasPosition={positions.length > 0}
        tradingMode={tradingMode}
        onLots={setLots}
        onExecute={execute}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sniper positions" icon={<Lock className="h-4 w-4 text-emerald-400" />}>
          <PositionsTable positions={positions} onClose={s => closeSymbol(s, 'manual exit')} busy={busy} />
          {positions.length > 0 && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              Auto-exit at +{SNIPER.targetPoints} / −{SNIPER.stopPoints} spot points, or {SNIPER.hardStop} — whichever
              comes first.
            </p>
          )}
        </Card>

        <Card title="Today" icon={<CalendarCheck className="h-4 w-4 text-emerald-400" />}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Trade used" value={dayState.tradeTaken ? '1 of 1' : '0 of 1'} tone={dayState.tradeTaken ? 'warn' : 'good'} />
            <Stat
              label="Spot points"
              value={dayState.pointsCaptured == null ? '—' : `${dayState.pointsCaptured > 0 ? '+' : ''}${dayState.pointsCaptured}`}
              tone={dayState.pointsCaptured == null ? 'default' : dayState.pointsCaptured >= 0 ? 'good' : 'bad'}
              sub={dayState.exitReason ?? undefined}
            />
          </div>
          {dayState.tradeTaken && (
            <button
              onClick={() => {
                persistDay(freshDay(istDayKey(Date.now())));
                addLog('🔓 Daily lock reset manually.', 'warn');
              }}
              className="mt-3 w-full rounded-lg border border-slate-700 py-2 text-[11px] text-slate-400 hover:bg-slate-800"
            >
              Reset daily lock (use only if the trade was cancelled)
            </button>
          )}
        </Card>
      </div>

      <Card title="Sniper log" icon={<Crosshair className="h-4 w-4 text-emerald-400" />}>
        <LogFeed entries={log} emptyHint="Arm the sniper to start the Download." />
      </Card>
    </div>
  );
};

export default SniperPanel;
