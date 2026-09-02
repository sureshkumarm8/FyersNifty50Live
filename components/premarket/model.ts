/**
 * Pre-Market domain model.
 *
 * The four screenshots, their prompts and weights, the shapes the vision models
 * produce and the decision they roll up into. Split out of PreMarketAnalyzer so
 * the presentational components can be typed without importing the screen (and
 * creating a cycle).
 */

import React from 'react';
import { Activity, CalendarDays, Layers, Timer } from 'lucide-react';
import { SniperPlaybook } from '../../services/sniperPlaybook';

// The pre-market workflow is built around four specific screenshots. Each one
// answers a different question, so each gets its own slot, prompt and weight
// instead of a generic "upload some charts" bucket.
// ---------------------------------------------------------------------------

export type ChartSlotId = 'DAILY_1Y' | 'INTRADAY_1M' | 'OI_SNAPSHOT' | 'MULTI_OI';

export interface SlotConfig {
  id: ChartSlotId;
  label: string;
  short: string;
  emoji: string;
  purpose: string;
  capture: string;
  weight: number;
  accent: {
    text: string; border: string; bg: string; ring: string; chip: string; button: string;
  };
  /** Filename hints used to auto-assign a dropped screenshot. */
  match: RegExp;
  /**
   * True when the screenshot is only valid for the session it was taken in.
   * A yesterday-old OI snapshot is worse than no OI snapshot.
   */
  freshnessCritical: boolean;
  prompt: string;
}

export const JSON_CONTRACT = `This read feeds a strict intraday system that trades NIFTY options only between
09:25 and 10:15 IST, buying at support or selling at resistance for a fixed 30-point target.
Only levels within roughly 300 points of the latest price are useful to it.

Reply with ONLY a JSON object, no prose, no markdown fence:
{
  "bias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": <0-100 integer>,
  "summary": "<one sentence, max 25 words>",
  "lastPrice": <the latest/closing NIFTY level visible on the chart, or null>,
  "supports": [<index levels as plain numbers, nearest to price first>],
  "resistances": [<index levels as plain numbers, nearest to price first>],
  "notes": ["<max 3 short observations>"]
}
If the chart is unreadable or has no price scale, say so in "summary" and return empty level arrays
rather than inventing numbers. A wrong level is far more damaging than a missing one.`;

export const CHART_SLOTS: SlotConfig[] = [
  {
    id: 'DAILY_1Y',
    label: 'Nifty 50 · Daily (1 Year)',
    short: 'Daily 1Y',
    emoji: '🗓️',
    purpose: 'Positional trend & the major levels that frame the whole year',
    capture: 'Day candles, ~1 year of history, full price scale visible',
    weight: 0.2,
    accent: {
      text: 'text-amber-300', border: 'border-amber-500/40', bg: 'from-amber-500/10 to-orange-500/5',
      ring: 'ring-amber-500/40', chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      button: 'bg-amber-600 hover:bg-amber-500'
    },
    // "yesterday"/"today" contain "day", so intraday hints veto the daily slot
    match: /^(?!.*(intraday|yesterday|yday|today|1m\b|1min|minute)).*(daily|day|1y|1yr|year|eod|positional|swing)/i,
    freshnessCritical: false,
    prompt: `You are a technical analyst reading a NIFTY 50 DAILY candlestick chart covering roughly one year.
Determine the primary (positional) trend, the stage of the move, and the major swing highs/lows that act as support and resistance near the latest price.
Report index levels as plain numbers (e.g. 24850, not "24.8k").
${JSON_CONTRACT}`
  },
  {
    id: 'INTRADAY_1M',
    label: 'Nifty 50 · 1-Min Intraday',
    short: '1-Min',
    emoji: '⏱️',
    purpose: 'Where the last session closed and how momentum was handed over',
    capture: '1-minute candles for yesterday and/or today, full session visible',
    weight: 0.3,
    accent: {
      text: 'text-cyan-300', border: 'border-cyan-500/40', bg: 'from-cyan-500/10 to-blue-500/5',
      ring: 'ring-cyan-500/40', chip: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      button: 'bg-cyan-600 hover:bg-cyan-500'
    },
    match: /^(?!.*(multi|oi|open.?interest)).*(1m|1min|minute|intraday|today|yday|yesterday|scalp|tick)/i,
    freshnessCritical: true,
    prompt: `You are a technical analyst reading a NIFTY 50 1-MINUTE INTRADAY chart of the most recent session(s).
Focus on the latest session: opening range, session high/low, where the last hour closed, momentum handover into the next open, and any pattern (trend day, range, reversal, breakout).
Report index levels as plain numbers.
${JSON_CONTRACT}`
  },
  {
    id: 'OI_SNAPSHOT',
    label: 'Sensibull · Open Interest by Strike',
    short: 'OI Walls',
    emoji: '🧱',
    purpose: 'Where option writers have parked the walls for the coming session',
    capture: 'Sensibull OI bar chart, current expiry, strikes around spot',
    weight: 0.3,
    accent: {
      text: 'text-purple-300', border: 'border-purple-500/40', bg: 'from-purple-500/10 to-fuchsia-500/5',
      ring: 'ring-purple-500/40', chip: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      button: 'bg-purple-600 hover:bg-purple-500'
    },
    // Anything mentioning "multi" belongs to the multi-strike slot instead
    match: /^(?!.*(multi|change|buildup|build.?up)).*(oi|open.?interest|option.?chain|sensibull|strike)/i,
    freshnessCritical: true,
    prompt: `You are an options analyst reading a SENSIBULL OPEN INTEREST chart (call OI vs put OI per strike) for the NIFTY 50 current expiry.
Identify the strikes carrying the largest CALL open interest (resistance walls) and the largest PUT open interest (support walls), the resulting expected trading range, and whether positioning leans bullish (put writing dominant) or bearish (call writing dominant).
Put the highest PUT-OI strikes in "supports" and the highest CALL-OI strikes in "resistances", as plain numbers, strongest first.
${JSON_CONTRACT}`
  },
  {
    id: 'MULTI_OI',
    label: 'Sensibull · Multi-Strike OI (Intraday Build-up)',
    short: 'Multi OI',
    emoji: '🕸️',
    purpose: 'Which side is actively adding or unwinding positions right now',
    capture: 'Sensibull multi-strike OI chart, several strikes plotted over time',
    weight: 0.2,
    accent: {
      text: 'text-pink-300', border: 'border-pink-500/40', bg: 'from-pink-500/10 to-rose-500/5',
      ring: 'ring-pink-500/40', chip: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
      button: 'bg-pink-600 hover:bg-pink-500'
    },
    match: /(multi|oi.?change|buildup|build.?up)/i,
    freshnessCritical: true,
    prompt: `You are an options analyst reading a SENSIBULL MULTI-STRIKE OPEN INTEREST chart, where OI for several NIFTY 50 strikes is plotted over time.
Decide the dominant build-up: put writing / call unwinding (bullish), call writing / put unwinding (bearish), short covering, or long unwinding. Name the strikes being defended or attacked and whether the walls are shifting up or down.
Put strikes with rising put OI in "supports" and strikes with rising call OI in "resistances", as plain numbers.
Add the build-up type as the first entry of "notes".
${JSON_CONTRACT}`
  }
];

export const SLOT_BY_ID: Record<ChartSlotId, SlotConfig> = CHART_SLOTS.reduce((acc, slot) => {
  acc[slot.id] = slot;
  return acc;
}, {} as Record<ChartSlotId, SlotConfig>);

export const SLOT_ICONS: Record<ChartSlotId, React.ElementType> = {
  DAILY_1Y: CalendarDays,
  INTRADAY_1M: Timer,
  OI_SNAPSHOT: Layers,
  MULTI_OI: Activity
};

export interface ChartVerdict {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  summary: string;
  supports: number[];
  resistances: number[];
  notes: string[];
  /** Latest index level the model could read off the chart, when available. */
  lastPrice?: number;
  /** False when the model answered in prose and the verdict was inferred. */
  structured: boolean;
  raw: string;
}

export interface ChartEntry {
  slot: ChartSlotId;
  data: string;
  fileName: string;
  uploadedAt: number;
  analyzedAt?: number;
  verdict?: ChartVerdict;
  error?: string;
}

export interface PendingImage {
  id: string;
  data: string;
  fileName: string;
}

export interface ChartContribution {
  slot: ChartSlotId;
  label: string;
  short: string;
  emoji: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  weight: number;
  summary: string;
}

export interface PreMarketDecision {
  /** Shape version - see DECISION_SCHEMA. */
  schema: number;
  generatedAt: number;
  generatedAtStr: string;
  spot: number;
  spotSource: 'LIVE' | 'MANUAL' | 'CHARTS';
  expectedRange: number;
  chartCoverage: number;
  chartBias: number | null;
  marketBias: number | null;
  agreement: number;
  contributions: ChartContribution[];
  openSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentStrength: number;
  scenarios: {
    flat: { probability: number; description: string };
    gapUp: { probability: number; description: string };
    gapDown: { probability: number; description: string };
  };
  confidence: number;
  supports: number[];
  resistances: number[];
  expectedResistance: number;
  expectedSupport: number;
  primaryBias: 'LONG' | 'SHORT' | 'NEUTRAL';
  biasStrength: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason: string;
  tradePlan: string[];
  aiSummary: string;
  /** The Office Protocol translation of everything above. */
  playbook: SniperPlaybook;
  staleCharts: string[];
}

/**
 * A session-sensitive screenshot goes stale quickly. Capturing the OI chart
 * after yesterday's close and using it this morning is fine (~14h); using
 * yesterday morning's capture is not.
 */
export const STALE_AFTER_MS = 18 * 60 * 60 * 1000;
export const isStale = (uploadedAt: number, now: number) => now - uploadedAt > STALE_AFTER_MS;

export const IMAGE_KEY = (slot: ChartSlotId) => `premarket:${slot}`;
export const META_STATE_KEY = 'preMarketChartMeta';
export const DECISION_STATE_KEY = 'preMarketDecision';
/**
 * Bumped whenever PreMarketDecision changes shape, so a plan saved by an older
 * build is discarded instead of being rendered against the current UI.
 */
export const DECISION_SCHEMA = 4;

/**
 * Vision models sometimes answer "I cannot read this chart" in a perfectly
 * valid JSON envelope. Those verdicts must not be treated as real input.
 */
export const isUnreadable = (verdict: ChartVerdict) =>
  verdict.confidence <= 15 ||
  /cannot|can not|unable|not (visible|provided|clear)|no (chart|data|image)|insufficient/i.test(verdict.summary);

export const biasClasses = (bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL') =>
  bias === 'BULLISH'
    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
    : bias === 'BEARISH'
    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
    : 'bg-slate-600/20 text-slate-300 border-slate-600/50';
