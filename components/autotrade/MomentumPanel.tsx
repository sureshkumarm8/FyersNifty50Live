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
import { Card, LogEntry, LogFeed, Meter, Pill, PositionsTable, Stat, inr } from './shared';

const LOT_SIZE = 75;
const SETTINGS_KEY = 'momentum_settings';

interface MomentumSettings {
  minConfidence: number;
  lots: number;
  autoExecute: boolean;
  itmOffset: number;
  /** Exit once the option premium gains this %. */
  targetPct: number;
  stopPct: number;
}

const DEFAULT_SETTINGS: MomentumSettings = {
  minConfidence: 70,
  lots: 1,
  autoExecute: false,
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
    return {
      minConfidence: num(parsed.minConfidence, DEFAULT_SETTINGS.minConfidence, 50, 95),
      lots: num(parsed.lots, DEFAULT_SETTINGS.lots, 1, 20),
      itmOffset: num(parsed.itmOffset, DEFAULT_SETTINGS.itmOffset, 0, 500),
      targetPct: num(parsed.targetPct, DEFAULT_SETTINGS.targetPct, 5, 100),
      stopPct: num(parsed.stopPct, DEFAULT_SETTINGS.stopPct, 5, 60),
      autoExecute: parsed.autoExecute === true
    };
  } catch {
    return DEFAULT_SETTINGS;
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
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState<MomentumSettings>(loadSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [signal, setSignal] = useState<EnhancedSignal | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState({ trades: 0, wins: 0, pnl: 0 });

  const orderRef = useRef<OrderManager | null>(null);
  /** Symbols with an exit order already in flight - the monitor ticks every 3s. */
  const exitingRef = useRef<Set<string>>(new Set());
  const entryRef = useRef<Record<string, { entry: number; direction: 'LONG' | 'SHORT' }>>({});
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const signalRef = useRef(signal);
  signalRef.current = signal;

  const addLog = useCallback((text: string, level: LogEntry['level'] = 'info') => {
    setLog(prev => [{ ts: Date.now(), text, level }, ...prev].slice(0, 150));
  }, []);

  useEffect(() => {
    orderRef.current = new OrderManager(credentials, tradingMode === 'PAPER');
    entryRef.current = {};
    exitingRef.current = new Set();
    setPositions([]);
  }, [credentials, tradingMode]);

  useEffect(() => {
    onStatus?.({ active: running, openPositions: positions.length });
  }, [running, positions.length, onStatus]);

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
    if (!niftyLtp) {
      addLog('No Nifty price yet.', 'warn');
      return;
    }
    if (historyLog.length < 5) {
      addLog(`Building history — ${historyLog.length}/5 snapshots.`, 'warn');
      return;
    }
    const s = EnhancedSignalGenerator.generateSignal(
      historyLog,
      pivots?.s1 ?? niftyLtp - 50,
      pivots?.r1 ?? niftyLtp + 50,
      niftyLtp
    );
    setSignal(s);
    if (s.direction !== 'NEUTRAL' && s.confidence >= settingsRef.current.minConfidence) {
      addLog(
        `${s.direction === 'LONG' ? '📈' : '📉'} ${s.direction} · ${s.confidence.toFixed(0)}% · ${s.metrics.signalStrength} · R:R ${s.riskRewardRatio.toFixed(2)}`,
        'good'
      );
    }
  }, [niftyLtp, historyLog, pivots, addLog]);

  useEffect(() => {
    if (!running) return;
    analyse();
    const id = window.setInterval(analyse, 30_000);
    return () => window.clearInterval(id);
  }, [running, analyse]);

  // --- execution ------------------------------------------------------------
  const execute = useCallback(async () => {
    const om = orderRef.current;
    const s = signalRef.current;
    if (!om || !s || !proposal || !niftyLtp) return;
    setBusy(true);
    try {
      const res = await om.placeOrder(proposal.symbol, 'BUY', proposal.qty, 'MARKET');
      if (res.success) {
        entryRef.current[proposal.symbol] = { entry: niftyLtp, direction: s.direction as 'LONG' | 'SHORT' };
        setPositions(om.getPositions());
        setStats(p => ({ ...p, trades: p.trades + 1 }));
        addLog(`✅ Bought ${proposal.symbol} × ${proposal.qty} at spot ${fmt(niftyLtp)}`, 'good');
      } else {
        addLog(`❌ Order rejected: ${res.message ?? 'unknown error'}`, 'bad');
      }
    } finally {
      setBusy(false);
    }
  }, [proposal, niftyLtp, addLog]);

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
    [addLog]
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
        om.updatePositionPnL(p.symbol, Math.max(1, p.avgPrice + drift * 0.5));
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
  useEffect(() => {
    if (!running || !settings.autoExecute || busy) return;
    if (!signal || signal.direction === 'NEUTRAL') return;
    if (signal.confidence < settings.minConfidence) return;
    if (positions.length > 0) return;
    addLog('🤖 Auto-execute armed and the signal qualifies.', 'warn');
    execute();
  }, [running, settings.autoExecute, settings.minConfidence, signal, positions.length, busy, execute, addLog]);

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
            <label className="flex items-center gap-3 self-end rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5">
              <input
                type="checkbox"
                checked={settings.autoExecute}
                onChange={e => setSettings(s => ({ ...s, autoExecute: e.target.checked }))}
                className="h-4 w-4 accent-sky-500"
              />
              <span className="text-xs text-slate-300">
                Auto-execute
                {settings.autoExecute && tradingMode === 'LIVE' && (
                  <span className="ml-1 font-semibold text-rose-300">places real orders</span>
                )}
              </span>
            </label>
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

      <Card title="Momentum log" icon={<Waves className="h-4 w-4 text-sky-400" />}>
        <LogFeed entries={log} emptyHint="Start the engine to begin scanning." />
      </Card>
    </div>
  );
};

export default MomentumPanel;
