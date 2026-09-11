/**
 * AI QUANT INSIGHT — the Cockpit's read on the market, refreshed every minute.
 *
 * Two independent opinions are shown side by side and then reconciled:
 *
 *   OUR SYSTEM  EnhancedSignalGenerator, scored off the same `historyLog` and
 *               with the same call the AutoTrade engines make. That is deliberate
 *               — a Cockpit that scored the market its own way would eventually
 *               disagree with the engine actually placing the trades, and the
 *               number on screen would stop meaning anything.
 *
 *   VISION      The latest chart-reading run from the local vision sidecar. It is
 *               optional: in a deployed build the sidecar is unreachable and this
 *               column degrades to a quiet note rather than an error.
 *
 * The agreement banner between them is the point of the panel. A high-confidence
 * signal that vision contradicts is exactly the trade worth hesitating over.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, Camera, CheckCircle2, Eye,
  Gauge, Minus, RefreshCw, ShieldAlert, Target
} from 'lucide-react';
import { MarketSnapshot, PivotPoints, VisionRun } from '../types';
import { EnhancedSignal, EnhancedSignalGenerator } from '../services/enhancedSignalGenerator';
import { visionService } from '../services/visionService';
import { CollapseToggle, useCollapsed } from './ui/collapse';

/** How often the panel re-scores the market. */
const REFRESH_MS = 60_000;

interface Props {
  historyLog: MarketSnapshot[];
  niftyLtp: number | null;
  pivots?: PivotPoints | null;
}

const fmt = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');

const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(0)}`;

/** A signed −100…+100 factor drawn as a centred bar, as on the Momentum panel. */
const FactorBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const v = Math.max(-100, Math.min(100, isFinite(value) ? value : 0));
  const pos = v >= 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`font-mono font-bold ${pos ? 'text-emerald-300' : 'text-rose-300'}`}>{signed(v)}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-slate-800">
        <div className="absolute left-1/2 top-0 h-1.5 w-px bg-slate-600" />
        <div
          className={`absolute top-0 h-1.5 rounded-full transition-all duration-500 ${pos ? 'bg-emerald-400' : 'bg-rose-400'}`}
          style={{ left: pos ? '50%' : `${50 - Math.abs(v) / 2}%`, width: `${Math.abs(v) / 2}%` }}
        />
      </div>
    </div>
  );
};

const Level: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-white/5 bg-slate-900/50 px-3 py-2">
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`mt-0.5 font-mono text-sm font-bold ${tone || 'text-slate-200'}`}>{value}</p>
  </div>
);

/** Maps a vision bias onto the same LONG / SHORT / NEUTRAL vocabulary our engine uses. */
const biasDirection = (bias?: string): 'LONG' | 'SHORT' | 'NEUTRAL' => {
  if (bias === 'bullish') return 'LONG';
  if (bias === 'bearish') return 'SHORT';
  return 'NEUTRAL';
};

export const QuantInsightPanel: React.FC<Props> = ({ historyLog, niftyLtp, pivots }) => {
  const [signal, setSignal] = useState<EnhancedSignal | null>(null);
  const [scoredAt, setScoredAt] = useState<number | null>(null);
  const [vision, setVision] = useState<VisionRun | null>(null);
  const [visionOffline, setVisionOffline] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [collapsed, toggleCollapsed] = useCollapsed('cockpit_quant_collapsed');

  // The inputs are read through a ref so the once-a-minute schedule is driven by
  // the clock alone. Depending on `historyLog` directly would re-arm the timer on
  // every incoming snapshot, and the panel would then never actually refresh.
  const inputs = useRef({ historyLog, niftyLtp, pivots });
  inputs.current = { historyLog, niftyLtp, pivots };

  const score = useCallback(() => {
    const { historyLog: log, niftyLtp: ltp, pivots: p } = inputs.current;
    if (!ltp || log.length < 5) {
      setSignal(null);
      return;
    }
    setSignal(
      EnhancedSignalGenerator.generateSignal(log, p?.s1 ?? ltp - 50, p?.r1 ?? ltp + 50, ltp)
    );
    setScoredAt(Date.now());
  }, []);

  const pullVision = useCallback(async () => {
    try {
      const latest = await visionService.getLatest();
      setVision(latest);
      setVisionOffline(false);
    } catch {
      // The sidecar is local-only; unreachable is a normal state, not a failure.
      setVisionOffline(true);
    }
  }, []);

  const refresh = useCallback(() => {
    score();
    pullVision();
  }, [score, pullVision]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  // A separate one-second clock so the "next refresh in" countdown stays honest
  // without re-scoring the market every tick.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secsToRefresh = scoredAt
    ? Math.max(0, Math.ceil((REFRESH_MS - (now - scoredAt)) / 1000))
    : null;

  const verdict = useMemo(() => {
    if (!signal || signal.direction === 'NEUTRAL') {
      return {
        text: signal ? 'NO EDGE' : 'WARMING UP',
        tone: 'text-slate-400',
        ring: 'border-slate-700',
        icon: <Minus size={22} />
      };
    }
    return signal.direction === 'LONG'
      ? {
          text: 'LONG',
          tone: 'text-emerald-300',
          ring: 'border-emerald-500/40',
          icon: <ArrowUpRight size={22} />
        }
      : {
          text: 'SHORT',
          tone: 'text-rose-300',
          ring: 'border-rose-500/40',
          icon: <ArrowDownRight size={22} />
        };
  }, [signal]);

  const v = vision?.analysis?.parsed ?? null;

  /** Do our engine and the chart-reader actually agree? */
  const consensus = useMemo(() => {
    if (!signal || !v || !v.readable) return null;
    const visionDir = biasDirection(v.bias);
    if (signal.direction === 'NEUTRAL' || visionDir === 'NEUTRAL') {
      return {
        state: 'partial' as const,
        text: 'One side is undecided — treat any entry as discretionary.',
        cls: 'border-slate-600/40 bg-slate-700/20 text-slate-300',
        icon: <Minus size={14} />
      };
    }
    return signal.direction === visionDir
      ? {
          state: 'agree' as const,
          text: `Both the signal engine and the chart read say ${signal.direction}.`,
          cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
          icon: <CheckCircle2 size={14} />
        }
      : {
          state: 'conflict' as const,
          text: `Conflict — engine says ${signal.direction}, charts read ${v.bias}. Stand aside.`,
          cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
          icon: <ShieldAlert size={14} />
        };
  }, [signal, v]);

  const m = signal?.metrics;

  return (
    <div className="glass-panel rounded-xl border border-indigo-500/20 bg-indigo-900/5 px-4 py-3">
      {/* ---- header ---- */}
      <div className="flex items-center gap-2">
        <div className="rounded-md bg-indigo-500/20 p-1 text-indigo-300 shrink-0">
          <Bot size={13} />
        </div>
        <h2 className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-indigo-200">
          AI Quant Insight
        </h2>

        {/* Collapsed summary — the verdict stays readable without expanding. */}
        {collapsed && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className={`font-mono text-sm font-black tracking-tight ${verdict.tone}`}>{verdict.text}</span>
            {signal && signal.direction !== 'NEUTRAL' && (
              <span className="font-mono text-[10px] text-slate-400">{signal.confidence.toFixed(0)}%</span>
            )}
            {v && (
              <span
                className={`hidden sm:inline rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  v.bias === 'bullish'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : v.bias === 'bearish'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-slate-600/40 bg-slate-700/20 text-slate-300'
                }`}
              >
                vision {v.bias}
              </span>
            )}
            {consensus && (
              <span className={`hidden md:inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${consensus.cls}`}>
                {consensus.state}
              </span>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 ${collapsed ? '' : 'ml-auto'}`}>
          {!collapsed && (
            <span className="hidden sm:inline rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
              Same engine as AutoTrade
            </span>
          )}
          <span className="font-mono text-[10px] text-slate-500">
            {secsToRefresh == null ? '—' : `${secsToRefresh}s`}
          </span>
          <button
            onClick={refresh}
            title="Re-score now"
            className="rounded-lg border border-white/10 p-1 text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            <RefreshCw size={12} />
          </button>
          <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} label="AI Quant Insight" />
        </div>
      </div>

      {!collapsed && (
      <div className="mt-3">
      {/* ---- consensus banner ---- */}
      {consensus && (
        <div className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium ${consensus.cls}`}>
          {consensus.icon}
          {consensus.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ================= COLUMN 1 — the verdict ================= */}
        <div className="space-y-3">
          <div className={`rounded-xl border bg-slate-900/40 p-3 ${verdict.ring}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">System verdict</p>
                <h3 className={`font-mono text-2xl font-black tracking-tight ${verdict.tone}`}>{verdict.text}</h3>
              </div>
              <span className={verdict.tone}>{verdict.icon}</span>
            </div>

            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Confidence</span>
                <span className="font-mono font-bold text-slate-200">
                  {signal ? `${signal.confidence.toFixed(0)}%` : '—'}
                  {m && <span className="ml-1 font-normal text-slate-500">{m.signalStrength}</span>}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    (signal?.confidence ?? 0) >= 70
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-300'
                      : (signal?.confidence ?? 0) >= 50
                        ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                        : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.min(signal?.confidence ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Level label="Entry" value={fmt(signal?.suggestedEntry ?? niftyLtp)} />
            <Level
              label="Risk : reward"
              value={signal ? signal.riskRewardRatio.toFixed(2) : '—'}
              tone={(signal?.riskRewardRatio ?? 0) >= 1.5 ? 'text-emerald-300' : 'text-slate-200'}
            />
            <Level label="Target" value={fmt(signal?.suggestedTarget)} tone="text-emerald-300" />
            <Level label="Stop loss" value={fmt(signal?.suggestedStopLoss)} tone="text-rose-300" />
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              <Target size={11} /> Why
            </p>
            {signal && signal.reasons.length > 0 ? (
              <ul className="space-y-1">
                {signal.reasons.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-300">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500">
                Collecting snapshots — the engine needs at least 5 before it will score the market.
              </p>
            )}
          </div>
        </div>

        {/* ================= COLUMN 2 — the factors ================= */}
        <div className="space-y-2">
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
            <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              <Gauge size={11} /> Factor breakdown
            </p>
            {!m ? (
              <p className="py-4 text-center text-[11px] text-slate-500">No score yet.</p>
            ) : (
              <div className="space-y-2.5">
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
              </div>
            )}
          </div>

          {m && (
            <div className="grid grid-cols-2 gap-2">
              <Level label="Support" value={fmt(m.support)} tone="text-emerald-300" />
              <Level label="Resistance" value={fmt(m.resistance)} tone="text-rose-300" />
              <Level label="Velocity" value={`${signed(m.priceVelocity)} pt/m`} />
              <Level label="Volatility" value={`${m.volatility.toFixed(2)}%`} tone="text-amber-300" />
              <Level label="Vol trend" value={m.volatilityTrend} />
              <Level label="OI" value={m.oiExpanding ? 'EXPANDING' : 'FLAT'} />
            </div>
          )}
        </div>

        {/* ================= COLUMN 3 — the chart reader ================= */}
        <div className="space-y-2">
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                <Eye size={11} /> Vision chart read
              </p>
              {v && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                    v.bias === 'bullish'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : v.bias === 'bearish'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                        : 'border-slate-600/40 bg-slate-700/20 text-slate-300'
                  }`}
                >
                  {v.bias} · {v.confidence}%
                </span>
              )}
            </div>

            {visionOffline ? (
              <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-[11px] text-slate-400">
                <Camera size={13} className="mt-0.5 shrink-0 text-slate-500" />
                <span>
                  The vision capture engine is offline — it only runs locally. The verdict on the left is unaffected;
                  it is scored from the live history feed.
                </span>
              </div>
            ) : !v ? (
              <p className="py-4 text-center text-[11px] text-slate-500">Waiting for the first chart capture…</p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] leading-snug text-slate-300">{v.combined_view || v.price_action}</p>

                <div className="grid grid-cols-2 gap-2">
                  <Level label="Supports" value={v.supports?.slice(0, 2).join(' / ') || '—'} tone="text-emerald-300" />
                  <Level
                    label="Resistances"
                    value={v.resistances?.slice(0, 2).join(' / ') || '—'}
                    tone="text-rose-300"
                  />
                  <Level label="Max call OI" value={v.highest_call_oi_strike || '—'} />
                  <Level label="Max put OI" value={v.highest_put_oi_strike || '—'} />
                </div>

                {v.expected_range && (
                  <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-300/70">Expected range</p>
                    <p className="mt-0.5 font-mono text-xs font-bold text-indigo-200">{v.expected_range}</p>
                  </div>
                )}

                {v.watch_for?.length > 0 && (
                  <div>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Watch for</p>
                    <ul className="space-y-1">
                      {v.watch_for.slice(0, 3).map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-300">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {v.risks?.length > 0 && (
                  <div>
                    <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-500/80">
                      <AlertTriangle size={10} /> Risks
                    </p>
                    <ul className="space-y-1">
                      {v.risks.slice(0, 2).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-200/80">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="pt-1 text-[9px] text-slate-600">
                  Captured {vision?.finishedAt ? new Date(vision.finishedAt).toLocaleTimeString('en-IN', { hour12: false }) : '—'}
                  {vision?.analysis?.model ? ` · ${vision.analysis.model}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};

export default QuantInsightPanel;
