/**
 * MOMENTUM PANEL — multi-factor intraday signal engine.
 *
 * A different animal from the Sniper: it runs all session, has no fixed point
 * target, sizes off a risk:reward ratio and can take several trades. It exists
 * for the days the Office Protocol stands aside.
 *
 * It owns its own OrderManager, log, positions and statistics. Nothing here is
 * read from — or written to — the Sniper panel.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BarChart3, Gauge, Pause, Play, Settings2, TrendingDown, TrendingUp, Waves, Zap
} from 'lucide-react';
import { FyersCredentials, MarketSnapshot, PivotPoints } from '../../types';
import { OrderManager, Position } from '../../services/orderManager';
import { EnhancedSignal, EnhancedSignalGenerator } from '../../services/enhancedSignalGenerator';
import { getNextExpiryDate } from '../../constants/niftyExpiryDates';
import { isMarketLive } from '../../services/marketSession';
import { estimateOptionPremium } from '../../services/optionPricing';
import { istDayKey } from '../../services/sniperEngine';
import { PaperExitReason, paperTradingEngine } from '../../services/paperTradingService';
import { Card, LogEntry, LogFeed, Meter, Pill, PositionsTable, Stat, Toggle, inr } from './shared';
import AutoTradeHistory from './AutoTradeHistory';

const LOT_SIZE = 75;
const SETTINGS_KEY = 'momentum_settings';
const SESSION_KEY = 'momentum_session';
const OM_KEY = 'momentum_orderbook';
/** EnhancedSignalGenerator returns NEUTRAL below this, so there is no point scanning. */
const MIN_HISTORY = 5;
const SCAN_MS = 30_000;

interface MomentumSettings {
  minConfidence: number;
  lots: number;
  /** Auto-execute with real money. Deliberately separate from the paper flag. */
  autoExecute: boolean;
  /** Auto-execute on paper. On by default — this is what makes the engine trade. */
  autoPaperExecute: boolean;
  /** Start the scan loop by itself at the opening bell. */
  autoStart: boolean;
  itmOffset: number;
  /** Exit once the option premium gains this %. */
  targetPct: number;
  stopPct: number;
}

const DEFAULT_SETTINGS: MomentumSettings = {
  minConfidence: 70,
  lots: 1,
  autoExecute: false,
  autoPaperExecute: true,
  autoStart: true,
  itmOffset: 0,
  targetPct: 25,
  stopPct: 15
};

function loadSettings(): MomentumSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    // Field-by-field validation, not a blind spread: a saved `null` would
    // otherwise survive the merge and turn every quantity into 0.
    const num = (v: unknown, fallback: number, min: number, max: number) =>
      typeof v === 'number' && isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
    // The two new flags default ON for anyone whose settings predate them —
    // `=== true` would leave every existing user with a silent engine.
    const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
    return {
      minConfidence: num(parsed.minConfidence, DEFAULT_SETTINGS.minConfidence, 50, 95),
      lots: num(parsed.lots, DEFAULT_SETTINGS.lots, 1, 20),
      itmOffset: num(parsed.itmOffset, DEFAULT_SETTINGS.itmOffset, 0, 500),
      targetPct: num(parsed.targetPct, DEFAULT_SETTINGS.targetPct, 5, 100),
      stopPct: num(parsed.stopPct, DEFAULT_SETTINGS.stopPct, 5, 60),
      autoExecute: parsed.autoExecute === true,
      autoPaperExecute: bool(parsed.autoPaperExecute, true),
      autoStart: bool(parsed.autoStart, true)
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Everything the panel would otherwise lose on a browser refresh.
 *
 * Reloading the page is the reflex fix for a stalled feed; before this it also
 * wiped the running flag, the log, the day's statistics and — worse — the entry
 * metadata that drives every open position's target and stop.
 */
/**
 * What the engine knew when it opened a position.
 *
 * `entry` and `direction` drive the running P&L mark. The rest exists so the
 * exit can explain itself against the thesis that opened the trade — a closed
 * row that says only "stop −15%" tells you nothing about whether the setup was
 * wrong or merely early.
 */
interface MomentumEntry {
  entry: number;
  direction: 'LONG' | 'SHORT';
  strike?: number;
  optionType?: 'CE' | 'PE';
  confidence?: number;
  strength?: string;
  fill?: number;
  at?: number;
}

interface MomentumSession {
  day: string;
  running: boolean;
  stats: { trades: number; wins: number; pnl: number };
  log: LogEntry[];
  entries: Record<string, MomentumEntry>;
}

const EMPTY_SESSION: MomentumSession = {
  day: istDayKey(Date.now()),
  running: false,
  stats: { trades: 0, wins: 0, pnl: 0 },
  log: [],
  entries: {}
};

function loadSession(): MomentumSession {
  const today = istDayKey(Date.now());
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { ...EMPTY_SESSION, day: today };
    const parsed = JSON.parse(raw) as Partial<MomentumSession>;
    if (!parsed || parsed.day !== today) return { ...EMPTY_SESSION, day: today };
    return {
      day: today,
      running: parsed.running === true,
      stats: parsed.stats ?? { trades: 0, wins: 0, pnl: 0 },
      log: parsed.log ?? [],
      entries: parsed.entries ?? {}
    };
  } catch {
    return { ...EMPTY_SESSION, day: today };
  }
}

interface Props {
  credentials: FyersCredentials;
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  tradingMode: 'PAPER' | 'LIVE';
  /** Lets the shell show that this panel is still working while its tab is hidden. */
  onStatus?: (status: { active: boolean; openPositions: number }) => void;
}

const fmt = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');

const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(0)}`;

/** A signed −100…+100 factor rendered as a centred bar. */
const FactorBar: React.FC<{ label: string; value: number; hint?: string }> = ({ label, value, hint }) => {
  const v = Math.max(-100, Math.min(100, value));
  const pos = v >= 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`tabular-nums font-semibold ${pos ? 'text-emerald-300' : 'text-rose-300'}`}>
          {signed(v)}
          {hint && <span className="ml-1 font-normal text-slate-600">{hint}</span>}
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-slate-800">
        <div className="absolute left-1/2 top-0 h-1.5 w-px bg-slate-600" />
        <div
          className={`absolute top-0 h-1.5 rounded-full ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`}
          style={{ left: pos ? '50%' : `${50 - Math.abs(v) / 2}%`, width: `${Math.abs(v) / 2}%` }}
        />
      </div>
    </div>
  );
};

export const MomentumPanel: React.FC<Props> = ({
  credentials, niftyLtp, historyLog, pivots, tradingMode, onStatus
}) => {
  const [restored] = useState(loadSession);
  const [running, setRunning] = useState(restored.running);
  const [settings, setSettings] = useState<MomentumSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [signal, setSignal] = useState<EnhancedSignal | null>(null);
  const [log, setLog] = useState<LogEntry[]>(restored.log);
  const [positions, setPositions] = useState<Position[]>([]);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState(restored.stats);

  const orderRef = useRef<OrderManager | null>(null);
  /** Symbols with an exit order already in flight - the monitor ticks every 3s. */
  const exitingRef = useRef<Set<string>>(new Set());
  /** Guards the entry path against the auto-execute effect firing twice. */
  const enteringRef = useRef(false);
  const entryRef = useRef<Record<string, MomentumEntry>>(restored.entries);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const signalRef = useRef(signal);
  signalRef.current = signal;
  /**
   * Live inputs are read through a ref inside the scan. Depending on them
   * directly rebuilt the 30s interval on every incoming price tick, so the
   * timer was cleared before it could ever fire.
   */
  const inputsRef = useRef({ niftyLtp, historyLog, pivots });
  inputsRef.current = { niftyLtp, historyLog, pivots };
  /** Last warm-up state logged, so a stalled feed is reported once, not every tick. */
  const warmupRef = useRef('');

  const addLog = useCallback((text: string, level: LogEntry['level'] = 'info') => {
    setLog(prev => [{ ts: Date.now(), text, level }, ...prev].slice(0, 150));
  }, []);

  /**
   * One OrderManager per trading mode, restored from storage on mount.
   *
   * This used to be rebuilt — and `positions` cleared — whenever the
   * `credentials` object changed identity, which happens on every token
   * refresh, so a running position could vanish mid-session. PAPER and LIVE
   * keep separate books; switching between them is a deliberate reset.
   */
  useEffect(() => {
    const om = new OrderManager(credentials, tradingMode === 'PAPER', `${OM_KEY}_${tradingMode}`);
    orderRef.current = om;
    exitingRef.current = new Set();
    setPositions(om.getPositions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradingMode]);

  // Fresher tokens, same book.
  useEffect(() => {
    orderRef.current?.updateCredentials(credentials);
  }, [credentials]);

  // Mirror everything a reload would otherwise destroy.
  useEffect(() => {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          day: istDayKey(Date.now()),
          running,
          stats,
          log,
          entries: entryRef.current
        })
      );
    } catch {
      /* storage disabled — this session still works, it just will not survive */
    }
  }, [running, stats, log, positions]);

  useEffect(() => {
    onStatus?.({ active: running, openPositions: positions.length });
  }, [running, positions.length, onStatus]);

  /**
   * Auto-start at the opening bell.
   *
   * A one-second clock drives the check, so the day key is latched the moment we
   * start: without it this effect would immediately re-start an engine the user
   * had just stopped. Pressing Stop writes today's key here for the same reason.
   */
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Restored as "already claimed today" when the engine was running before a
  // reload, so the market-close stand-down still fires for this session.
  const autoStartedDayRef = useRef<string | null>(restored.running ? istDayKey(Date.now()) : null);
  useEffect(() => {
    if (!settings.autoStart) return;
    const now = new Date(clock);
    const today = istDayKey(clock);
    const live = isMarketLive(now);

    if (live && !running && autoStartedDayRef.current !== today) {
      autoStartedDayRef.current = today;
      setRunning(true);
      addLog('🔔 Market open — momentum auto-started, scanning every 30s.', 'good');
      return;
    }
    if (!live && running && autoStartedDayRef.current === today) {
      setRunning(false);
      addLog('🌙 Market closed — momentum stopped.', 'info');
    }
  }, [settings.autoStart, running, clock, addLog]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const expiry = useMemo(() => {
    const e = getNextExpiryDate();
    if (!e) return '';
    const d = new Date(e.date);
    return `${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  const proposal = useMemo(() => {
    if (!signal || signal.direction === 'NEUTRAL' || !niftyLtp) return null;
    const isLong = signal.direction === 'LONG';
    const atm = Math.round(niftyLtp / 50) * 50;
    const strike = isLong ? atm - settings.itmOffset : atm + settings.itmOffset;
    return {
      strike,
      optionType: isLong ? ('CE' as const) : ('PE' as const),
      symbol: `NIFTY${expiry}${strike}${isLong ? 'CE' : 'PE'}`,
      qty: settings.lots * LOT_SIZE
    };
  }, [signal, niftyLtp, settings.itmOffset, settings.lots, expiry]);

  // --- analysis loop --------------------------------------------------------
  const analyse = useCallback(() => {
    const { niftyLtp: ltp, historyLog: history, pivots: piv } = inputsRef.current;
    if (!ltp) {
      addLog('No Nifty price yet.', 'warn');
      return;
    }
    if (history.length < MIN_HISTORY) {
      // Say *why* it is stuck. A count that never moves means snapshots are not
      // arriving, which is a data problem, not a warm-up problem.
      const newest = history[0]?.timestamp ?? 0;
      const ageMin = newest ? Math.floor((Date.now() - newest) / 60000) : -1;
      const stalled = ageMin >= 2;
      const key = `${history.length}:${stalled}`;
      if (warmupRef.current !== key) {
        warmupRef.current = key;
        addLog(
          stalled
            ? `⚠️ History stalled at ${history.length}/${MIN_HISTORY} — newest snapshot is ${ageMin}m old. Snapshots are not arriving, so momentum cannot signal.`
            : `Building history — ${history.length}/${MIN_HISTORY} snapshots (~${MIN_HISTORY - history.length} min to first signal).`,
          stalled ? 'bad' : 'warn'
        );
      }
      return;
    }
    warmupRef.current = '';
    const s = EnhancedSignalGenerator.generateSignal(
      history,
      piv?.s1 ?? ltp - 50,
      piv?.r1 ?? ltp + 50,
      ltp
    );
    setSignal(s);
    if (s.direction !== 'NEUTRAL' && s.confidence >= settingsRef.current.minConfidence) {
      addLog(
        `${s.direction === 'LONG' ? '📈' : '📉'} ${s.direction} · ${s.confidence.toFixed(0)}% · ${s.metrics.signalStrength} · R:R ${s.riskRewardRatio.toFixed(2)}`,
        'good'
      );
    }
  }, [addLog]);

  useEffect(() => {
    if (!running) return;
    analyse();
    const id = window.setInterval(analyse, SCAN_MS);
    return () => window.clearInterval(id);
  }, [running, analyse]);

  // --- paper ledger mirror --------------------------------------------------

  /**
   * Momentum fills are written into the Paper Trading book, tagged MOMENTUM.
   *
   * The Sniper has mirrored its trades for a while; this engine did not, so
   * every momentum trade was invisible in the ledger. The equity curve, the win
   * rate and the expectancy on the Paper screen therefore described the Sniper
   * and hand-placed trades only, while silently omitting the engine that takes
   * the most trades of the three.
   *
   * Only PAPER-mode fills are mirrored. The book runs on simulated capital, so
   * posting a real fill into it would draw down money it never held.
   */
  const tradingModeRef = useRef(tradingMode);
  tradingModeRef.current = tradingMode;

  const journalEntry = useCallback(
    (
      symbol: string,
      strike: number,
      optionType: 'CE' | 'PE',
      fill: number,
      spot: number,
      s: EnhancedSignal
    ) => {
      if (tradingModeRef.current !== 'PAPER') {
        addLog('📒 Live fill — not written to the paper ledger (it tracks simulated capital only).', 'info');
        return;
      }
      const { targetPct, stopPct, minConfidence, lots } = settingsRef.current;
      const tags = [
        'AUTOTRADE',
        'MOMENTUM',
        s.direction,
        `CONF-${s.confidence.toFixed(0)}`,
        s.metrics.signalStrength
      ];
      const entryReason = [
        `Momentum took ${s.direction} via the ${strike} ${optionType} at ₹${fill.toFixed(2)}, ` +
          `with Nifty at ${fmt(spot)}.`,
        `The multi-factor signal read ${s.confidence.toFixed(0)}% confidence (${s.metrics.signalStrength}), ` +
          `clearing the ${minConfidence}% threshold, at a risk:reward of ${s.riskRewardRatio.toFixed(2)}.`,
        `Signal levels: entry ${fmt(s.suggestedEntry)}, target ${fmt(s.suggestedTarget)}, ` +
          `stop ${fmt(s.suggestedStopLoss)}.`,
        `Plan: exit on premium +${targetPct}% or −${stopPct}%.`,
        ...(s.reasons?.length ? [`Factors: ${s.reasons.slice(0, 6).join(' · ')}`] : [])
      ].join('\n');

      paperTradingEngine
        .openExternal({
          symbol,
          displayName: `NIFTY ${strike} ${optionType}`,
          strike,
          optionType,
          lots,
          entryPrice: fill,
          spot,
          tags,
          strategy: 'MOMENTUM',
          entryReason,
          notes: `Momentum ${s.direction} ${optionType} at ${fmt(spot)} · ${s.confidence.toFixed(0)}% · ${
            s.reasons?.[0] ?? ''
          }`
        })
        .then(r =>
          addLog(
            r.ok ? `📒 Logged to Paper Trading — tagged ${tags.join(', ')}` : `📒 Paper log skipped — ${r.message}`,
            r.ok ? 'info' : 'warn'
          )
        )
        .catch(() => addLog('📒 Could not write this trade to the paper ledger.', 'warn'));
    },
    [addLog]
  );

  /**
   * Close the mirrored position, preserving the engine's own wording.
   *
   * The paper book's five exit buckets are shared with manual trading, so the
   * precise trigger has to travel alongside the bucket or it is lost.
   */
  const journalExit = useCallback(
    (symbol: string, premium: number, reason: string, pnl: number, pnlPercent: number) => {
      if (tradingModeRef.current !== 'PAPER') return;
      const r = reason.toLowerCase();
      const mapped: PaperExitReason = r.includes('target')
        ? 'TARGET'
        : r.includes('stop')
          ? 'STOPLOSS'
          : r.includes('market close') || r.includes('eod')
            ? 'EOD'
            : 'MANUAL';

      const meta = entryRef.current[symbol];
      const spot = inputsRef.current.niftyLtp;
      const drift =
        meta && spot != null ? (spot - meta.entry) * (meta.direction === 'LONG' ? 1 : -1) : null;
      const { targetPct, stopPct } = settingsRef.current;

      const exitNote = [
        `Exited at ₹${premium.toFixed(2)} — ${reason} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}% on premium).`,
        drift != null
          ? `Nifty moved ${drift >= 0 ? '+' : ''}${drift.toFixed(1)} points from the ${fmt(meta!.entry)} entry.`
          : '',
        mapped === 'TARGET'
          ? `The +${targetPct}% premium target was reached, so the engine banked it.`
          : mapped === 'STOPLOSS'
            ? `The −${stopPct}% premium stop was breached; the engine cuts without waiting for a recovery.`
            : mapped === 'EOD'
              ? 'Closed at the end of the session — nothing is carried overnight.'
              : 'Closed by hand from the Momentum panel.',
        `Booked ${inr(pnl)} on the broker book.`
      ]
        .filter(Boolean)
        .join(' ');

      paperTradingEngine
        .closeExternal(symbol, premium, mapped, spot, exitNote)
        .then(res => {
          if (res.ok) addLog(`📒 Paper ledger updated — ${res.message}`, 'info');
        })
        .catch(() => addLog('📒 Could not close this trade in the paper ledger.', 'warn'));
    },
    [addLog]
  );

  // --- execution ------------------------------------------------------------
  const execute = useCallback(async () => {
    const om = orderRef.current;
    const s = signalRef.current;
    if (!om || !s || !proposal || !niftyLtp) return;
    // `busy` is React state and lands a render later; the auto-execute effect can
    // re-fire before it does, so only a ref reliably prevents a duplicate order.
    if (enteringRef.current) return;
    enteringRef.current = true;
    setBusy(true);
    try {
      const fill = estimateOptionPremium(niftyLtp, proposal.strike, proposal.optionType);
      const res = await om.placeOrder(proposal.symbol, 'BUY', proposal.qty, 'MARKET', undefined, undefined, fill);
      if (res.success) {
        entryRef.current[proposal.symbol] = {
          entry: niftyLtp,
          direction: s.direction as 'LONG' | 'SHORT',
          strike: proposal.strike,
          optionType: proposal.optionType,
          confidence: s.confidence,
          strength: s.metrics.signalStrength,
          fill,
          at: Date.now()
        };
        setPositions(om.getPositions());
        setStats(p => ({ ...p, trades: p.trades + 1 }));
        addLog(`✅ Bought ${proposal.symbol} × ${proposal.qty} at spot ${fmt(niftyLtp)}`, 'good');
        journalEntry(proposal.symbol, proposal.strike, proposal.optionType, fill, niftyLtp, s);
      } else {
        addLog(`❌ Order rejected: ${res.message ?? 'unknown error'}`, 'bad');
      }
    } finally {
      enteringRef.current = false;
      setBusy(false);
    }
  }, [proposal, niftyLtp, addLog, journalEntry]);

  const closeSymbol = useCallback(
    async (symbol: string, reason: string) => {
      const om = orderRef.current;
      if (!om) return;
      const pos = om.getPositions().find(p => p.symbol === symbol);
      if (!pos || exitingRef.current.has(symbol)) return;
      exitingRef.current.add(symbol);
      setBusy(true);
      try {
        const res = await om.placeOrder(symbol, pos.side === 'LONG' ? 'SELL' : 'BUY', Math.abs(pos.quantity), 'MARKET');
        if (res.success) {
          addLog(`🚪 Closed ${symbol} — ${reason} · ${inr(pos.pnl)}`, pos.pnl >= 0 ? 'good' : 'bad');
          setStats(p => ({ ...p, wins: p.wins + (pos.pnl > 0 ? 1 : 0), pnl: p.pnl + pos.pnl }));
          // Journal before the metadata is dropped — the exit note is built from it.
          journalExit(symbol, pos.ltp ?? pos.avgPrice, reason, pos.pnl, pos.pnlPercent);
          delete entryRef.current[symbol];
        } else {
          addLog(`❌ Exit rejected: ${res.message ?? 'unknown error'}`, 'bad');
        }
        setPositions(om.getPositions());
      } finally {
        exitingRef.current.delete(symbol);
        setBusy(false);
      }
    },
    [addLog, journalExit]
  );

  // --- position monitoring --------------------------------------------------
  useEffect(() => {
    if (!running || !niftyLtp) return;
    const id = window.setInterval(() => {
      const om = orderRef.current;
      if (!om) return;
      const open = om.getPositions();
      if (open.length === 0) {
        setPositions(prev => (prev.length ? [] : prev));
        return;
      }
      open.forEach(p => {
        const meta = entryRef.current[p.symbol];
        if (!meta) return;
        const drift = (niftyLtp - meta.entry) * (meta.direction === 'LONG' ? 1 : -1);
        const premium = Math.max(1, p.avgPrice + drift * 0.5);
        om.updatePositionPnL(p.symbol, premium);
        // Keep the ledger's unrealised P&L and its high/low-water marks in step,
        // so the MFE/MAE on the closed row reflects the whole trade rather than
        // just the entry and exit prices. The engine never exits on these marks.
        if (tradingModeRef.current === 'PAPER') paperTradingEngine.markExternal(p.symbol, premium);
      });
      const refreshed = om.getPositions();
      const { targetPct, stopPct } = settingsRef.current;
      refreshed.forEach(p => {
        if (p.pnlPercent >= targetPct) closeSymbol(p.symbol, `target +${targetPct}%`);
        else if (p.pnlPercent <= -stopPct) closeSymbol(p.symbol, `stop −${stopPct}%`);
      });
      setPositions(om.getPositions());
    }, 3000);
    return () => window.clearInterval(id);
  }, [running, niftyLtp, closeSymbol]);

  // --- auto execute ---------------------------------------------------------
  // Paper and live have separate switches: enabling hands-off paper trading must
  // never quietly authorise the same engine to spend real money.
  const autoExecuteOn = tradingMode === 'PAPER' ? settings.autoPaperExecute : settings.autoExecute;
  useEffect(() => {
    if (!running || !autoExecuteOn || busy || enteringRef.current) return;
    if (!signal || signal.direction === 'NEUTRAL') return;
    if (signal.confidence < settings.minConfidence) return;
    if (positions.length > 0) return;
    addLog(`🤖 Auto-execute (${tradingMode}) — the signal qualifies.`, 'warn');
    execute();
  }, [
    running, autoExecuteOn, settings.minConfidence, signal, positions.length, busy,
    tradingMode, execute, addLog
  ]);

  const qualifies = !!signal && signal.direction !== 'NEUTRAL' && signal.confidence >= settings.minConfidence;
  const m = signal?.metrics;

  return (
    <div className="space-y-4">
      {/* ---- header ---- */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-sky-300/70">
              <Waves className="h-3.5 w-3.5" /> Multi-factor momentum
            </div>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-100">
              {signal ? (
                <span className={signal.direction === 'LONG' ? 'text-emerald-300' : signal.direction === 'SHORT' ? 'text-rose-300' : 'text-slate-400'}>
                  {signal.direction}
                </span>
              ) : (
                <span className="text-slate-500">NO SIGNAL</span>
              )}
            </h2>
            <p className="mt-1 max-w-xl text-xs text-slate-400">
              Runs all session on 15-minute trend, breadth, option flow, momentum and volatility. Independent of the
              Sniper — separate orders, separate P&amp;L.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Pill tone={settings.autoStart ? 'good' : 'muted'}>
                {settings.autoStart ? 'Auto-start ON' : 'Auto-start OFF'}
              </Pill>
              <Pill tone={autoExecuteOn ? (tradingMode === 'LIVE' ? 'bad' : 'good') : 'muted'}>
                {autoExecuteOn ? `Auto-execute ON · ${tradingMode}` : `Auto-execute OFF · ${tradingMode}`}
              </Pill>
              <Pill tone={historyLog.length >= MIN_HISTORY ? 'good' : 'warn'}>
                {historyLog.length >= MIN_HISTORY
                  ? `History ${historyLog.length}`
                  : `Warming up ${historyLog.length}/${MIN_HISTORY}`}
              </Pill>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(s => !s)}
              className="rounded-xl border border-slate-700 p-2.5 text-slate-400 transition hover:bg-slate-800"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                // Claim today for the manual choice so the auto-start effect,
                // which re-runs every second, cannot immediately restart it.
                autoStartedDayRef.current = istDayKey(Date.now());
                setRunning(r => !r);
                addLog(running ? '⏸️ Momentum stopped.' : '▶️ Momentum started — scanning every 30s.', 'info');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                running ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-sky-500 text-sky-950 hover:bg-sky-400'
              }`}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Confidence" value={signal ? `${signal.confidence.toFixed(0)}%` : '—'} sub={signal?.metrics.signalStrength} />
          <Stat label="Risk : reward" value={signal ? signal.riskRewardRatio.toFixed(2) : '—'} />
          <Stat label="Open" value={positions.length} sub={`${settings.lots} lot${settings.lots > 1 ? 's' : ''} per entry`} />
          <Stat
            label="Session P&L"
            value={inr(stats.pnl)}
            tone={stats.pnl >= 0 ? 'good' : 'bad'}
            sub={`${stats.trades} trades · ${stats.trades ? Math.round((stats.wins / stats.trades) * 100) : 0}% win`}
          />
        </div>
      </div>

      {showSettings && (
        <Card title="Momentum settings" icon={<Settings2 className="h-4 w-4 text-sky-400" />}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ['minConfidence', 'Minimum confidence %', 50, 95],
                ['lots', 'Lots per entry', 1, 20],
                ['itmOffset', 'ITM offset (points)', 0, 500],
                ['targetPct', 'Target (premium %)', 5, 100],
                ['stopPct', 'Stop (premium %)', 5, 60]
              ] as const
            ).map(([key, label, min, max]) => (
              <label key={key} className="block">
                <span className="text-[11px] text-slate-500">{label}</span>
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={settings[key]}
                  onChange={e =>
                    setSettings(s => ({ ...s, [key]: Math.max(min, Math.min(max, Number(e.target.value) || min)) }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
            <Toggle
              label="Auto-start at market open"
              hint="Begins the 30s scan loop at 09:15 IST without anyone pressing Start."
              checked={settings.autoStart}
              onChange={v => setSettings(s => ({ ...s, autoStart: v }))}
            />
            <Toggle
              label="Auto-execute on PAPER"
              hint="Buys automatically whenever a signal clears the confidence threshold."
              checked={settings.autoPaperExecute}
              onChange={v => setSettings(s => ({ ...s, autoPaperExecute: v }))}
            />
            <Toggle
              label="Auto-execute on LIVE"
              hint="Real money, placed with no confirmation. Off unless you say otherwise."
              checked={settings.autoExecute}
              onChange={v => setSettings(s => ({ ...s, autoExecute: v }))}
              danger
            />
            <p className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
              Currently in <span className="font-semibold text-slate-200">{tradingMode}</span> mode — auto-execute is{' '}
              <span className={autoExecuteOn ? 'font-semibold text-emerald-300' : 'font-semibold text-slate-300'}>
                {autoExecuteOn ? 'ON' : 'OFF'}
              </span>
              . Entries still need ≥ {settings.minConfidence}% confidence and no open position.
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- factor breakdown ---- */}
        <Card title="Factor breakdown" icon={<BarChart3 className="h-4 w-4 text-sky-400" />}>
          {!m ? (
            <p className="py-8 text-center text-xs text-slate-500">Start the engine to score the market.</p>
          ) : (
            <div className="space-y-3">
              <FactorBar
                label={`15-min trend · ${m.trend15m}`}
                value={m.trendStrength * (m.trend15m === 'BEARISH' ? -1 : m.trend15m === 'NEUTRAL' ? 0 : 1)}
              />
              <FactorBar label="Market breadth" value={m.broadSentiment} />
              <FactorBar
                label={`Option flow · ${m.optionFlow}`}
                value={m.optionFlowStrength * (m.optionFlow === 'BEARISH' ? -1 : m.optionFlow === 'NEUTRAL' ? 0 : 1)}
              />
              <FactorBar label="Momentum score" value={m.momentumScore} />
              <FactorBar label="Call buy pressure" value={m.callBuyPressure} />
              <FactorBar label="Put buy pressure" value={m.putBuyPressure} />

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Stat label="Volatility" value={`${m.volatility.toFixed(1)}%`} sub={m.volatilityTrend} />
                <Stat label="Velocity" value={`${m.priceVelocity.toFixed(1)} pts/min`} sub={m.oiExpanding ? 'OI expanding' : 'OI flat'} />
                <Stat label="Support" value={fmt(m.support)} tone="good" />
                <Stat label="Resistance" value={fmt(m.resistance)} tone="bad" />
              </div>
            </div>
          )}
        </Card>

        {/* ---- the trade ---- */}
        <Card
          title="Proposed trade"
          icon={<Zap className="h-4 w-4 text-sky-400" />}
          right={<Pill tone={tradingMode === 'LIVE' ? 'bad' : 'info'}>{tradingMode}</Pill>}
        >
          {!signal || signal.direction === 'NEUTRAL' ? (
            <p className="py-8 text-center text-xs text-slate-500">
              {running ? 'Market is neutral — nothing worth taking.' : 'Engine is stopped.'}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    signal.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {signal.direction === 'LONG' ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-black text-slate-100">
                    BUY {fmt(proposal?.strike)} {proposal?.optionType}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">
                    {proposal?.symbol} · {proposal?.qty} qty
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Gauge className="h-3 w-3" /> Confidence vs threshold ({settings.minConfidence}%)
                  </span>
                  <span className={qualifies ? 'text-emerald-300' : 'text-amber-300'}>
                    {signal.confidence.toFixed(0)}%
                  </span>
                </div>
                <Meter value={signal.confidence} tone={qualifies ? 'bg-emerald-400' : 'bg-amber-400'} height="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Stat label="Entry (spot)" value={fmt(signal.suggestedEntry)} />
                <Stat label="Target" value={fmt(signal.suggestedTarget)} tone="good" />
                <Stat label="Stop" value={fmt(signal.suggestedStopLoss)} tone="bad" />
              </div>

              <ul className="space-y-1 text-xs text-slate-400">
                {signal.reasons.slice(0, 6).map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>

              <button
                onClick={execute}
                disabled={busy || !running || !qualifies || positions.length > 0}
                className="w-full rounded-xl bg-sky-500 py-3.5 text-sm font-bold text-sky-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {!running
                  ? 'Start the engine to enable execution'
                  : positions.length > 0
                    ? 'Position already open'
                    : !qualifies
                      ? `Below the ${settings.minConfidence}% threshold`
                      : `Execute — exit at +${settings.targetPct}% / −${settings.stopPct}% premium`}
              </button>
            </div>
          )}
        </Card>
      </div>

      <Card title="Momentum positions" icon={<Activity className="h-4 w-4 text-sky-400" />}>
        <PositionsTable positions={positions} onClose={s => closeSymbol(s, 'manual exit')} busy={busy} />
      </Card>

      <AutoTradeHistory strategy="MOMENTUM" tradingMode={tradingMode} />

      <Card title="Momentum log" icon={<Waves className="h-4 w-4 text-sky-400" />}>
        <LogFeed entries={log} emptyHint="Start the engine to begin scanning." />
      </Card>
    </div>
  );
};

export default MomentumPanel;
