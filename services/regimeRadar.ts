/**
 * REGIME RADAR — what kind of market is this, and what does that imply?
 *
 * Volatility, trendiness and time-of-day change the odds far more reliably than
 * any directional signal in this dataset. A 20-point move at 09:20 is ordinary;
 * the same move at 13:00 is not. This module classifies the current moment into
 * a regime and reports what *measurably* followed that regime in the archive.
 *
 * Every threshold here is a quantile of the archive, not a number someone liked
 * the look of. If the archive shifts, the thresholds shift with it.
 */

import { FeaturePoint, LabelledPoint, FEATURE_NAMES } from './predictionModel';

export type VolState = 'calm' | 'normal' | 'active' | 'violent';
export type TrendState = 'trending' | 'mixed' | 'chopping';
export type TodBucket = 'open' | 'morning' | 'midday' | 'afternoon' | 'close';

const IDX = (name: string) => FEATURE_NAMES.indexOf(name);

/** Feature-space column indices, resolved once. */
const I_VOL10 = IDX('vol10');
const I_RET30 = IDX('ret30');

export interface RegimeThresholds {
  /** vol10 quantiles at 25/50/85 that separate calm|normal|active|violent. */
  vol: [number, number, number];
  /** Efficiency-ratio quantiles at 40/75 separating chopping|mixed|trending. */
  eff: [number, number];
}

export interface RegimeStats {
  samples: number;
  /** Median absolute move over the horizon, in points. */
  medAbsMove: number;
  /** 80th percentile absolute move — a realistic "how far can this go". */
  p80AbsMove: number;
  probUp: number;
  meanMove: number;
  /** Median absolute move across ALL archived moments, for comparison. */
  baseMedAbsMove: number;
  /** medAbsMove / baseMedAbsMove. >1 means this regime moves more than usual. */
  moveRatio: number;
}

export interface RegimeReading {
  ok: true;
  vol: VolState;
  trend: TrendState;
  tod: TodBucket;
  /** Raw efficiency ratio: how much of the recent motion was net directional. */
  efficiency: number;
  vol10: number;
  thresholds: RegimeThresholds;
  /** Forward stats measured on archived moments in the same vol+trend regime. */
  stats: Record<number, RegimeStats>;
  /** How this regime compares to the market at large, in plain language. */
  summary: string;
  /** Concrete, regime-specific guidance. */
  guidance: string;
}

export interface RegimeFailure {
  ok: false;
  reason: string;
}

/** `strict` is off, so boolean-literal discriminants need an explicit guard. */
export const isRegimeFailure = (r: RegimeReading | RegimeFailure): r is RegimeFailure => r.ok === false;

const quantile = (sorted: number[], q: number): number => {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

/**
 * Efficiency ratio — net displacement divided by the motion that produced it.
 * Near 0 the market covered ground and came back (chop). Near 1 it went
 * somewhere and stayed (trend).
 */
const efficiencyOf = (vec: number[]): number => {
  const noise = vec[I_VOL10] * Math.sqrt(30);
  return noise <= 0 ? 0 : Math.min(3, Math.abs(vec[I_RET30]) / noise);
};

export const todBucketOf = (t: number): TodBucket => {
  const d = new Date(t);
  const mins = d.getHours() * 60 + d.getMinutes();
  if (mins < 9 * 60 + 45) return 'open';
  if (mins < 11 * 60 + 30) return 'morning';
  if (mins < 13 * 60) return 'midday';
  if (mins < 14 * 60 + 45) return 'afternoon';
  return 'close';
};

/** Derive vol/efficiency cut points from the archive itself. */
export function deriveThresholds(history: LabelledPoint[]): RegimeThresholds {
  const vols = history.map(p => p.vec[I_VOL10]).filter(Number.isFinite).sort((a, b) => a - b);
  const effs = history.map(p => efficiencyOf(p.vec)).filter(Number.isFinite).sort((a, b) => a - b);
  return {
    vol: [quantile(vols, 0.25), quantile(vols, 0.5), quantile(vols, 0.85)],
    eff: [quantile(effs, 0.4), quantile(effs, 0.75)]
  };
}

const classifyVol = (v: number, t: RegimeThresholds): VolState =>
  v < t.vol[0] ? 'calm' : v < t.vol[1] ? 'normal' : v < t.vol[2] ? 'active' : 'violent';

const classifyTrend = (e: number, t: RegimeThresholds): TrendState =>
  e < t.eff[0] ? 'chopping' : e < t.eff[1] ? 'mixed' : 'trending';

const GUIDANCE: Record<string, string> = {
  'calm|chopping': 'Tight, directionless. Range-bound tactics only — breakouts here fail more often than they run, and stops set at normal width will be hit by noise.',
  'calm|mixed': 'Quiet with a slight lean. Small size; wait for the range to resolve rather than anticipating it.',
  'calm|trending': 'A slow grind. Low volatility trends are the most reliable kind, but the payoff per unit of time is small — size for patience, not for a fast exit.',
  'normal|chopping': 'Ordinary two-way trade. Neither side is in control; fade the extremes of the recent range rather than chasing.',
  'normal|mixed': 'The default state of this market. Nothing here justifies an above-average position.',
  'normal|trending': 'Clean directional conditions with manageable risk. This is the regime worth committing to.',
  'active|chopping': 'Wide and wild with no follow-through — the worst combination. Large stops are required precisely where the direction is least knowable. Best avoided.',
  'active|mixed': 'Elevated movement, unresolved direction. Widen stops and cut size to keep risk constant.',
  'active|trending': 'Strong, fast movement. Real opportunity, but the band is wide — size down so a normal pullback does not stop you out.',
  'violent|chopping': 'Extreme volatility with no direction. Nothing is tradeable at normal size; stand aside.',
  'violent|mixed': 'Extreme volatility. Assume any level can be reached and any stop can be hit.',
  'violent|trending': 'Extreme, one-way movement. Historically the largest moves live here — and so do the largest reversals. Minimum size.'
};

export const regimeRadar = {
  read: (
    query: FeaturePoint,
    history: LabelledPoint[],
    horizons: number[] = [5, 15, 30]
  ): RegimeReading | RegimeFailure => {
    if (history.length < 500) {
      return { ok: false, reason: `Need at least 500 archived moments to define regimes, have ${history.length}.` };
    }

    const thresholds = deriveThresholds(history);
    const qVol = query.vec[I_VOL10];
    const qEff = efficiencyOf(query.vec);

    const vol = classifyVol(qVol, thresholds);
    const trend = classifyTrend(qEff, thresholds);
    const tod = todBucketOf(query.t);

    const peers = history.filter(
      p => classifyVol(p.vec[I_VOL10], thresholds) === vol && classifyTrend(efficiencyOf(p.vec), thresholds) === trend
    );

    const stats: Record<number, RegimeStats> = {};
    for (const h of horizons) {
      const moves = peers.map(p => p.forward[h]).filter(Number.isFinite) as number[];
      const baseAbs = history.map(p => p.forward[h]).filter(Number.isFinite).map(Math.abs).sort((a, b) => a - b);
      const abs = moves.map(Math.abs).sort((a, b) => a - b);
      const med = quantile(abs, 0.5);
      const baseMed = quantile(baseAbs, 0.5);
      stats[h] = {
        samples: moves.length,
        medAbsMove: med,
        p80AbsMove: quantile(abs, 0.8),
        probUp: moves.length ? moves.filter(v => v > 0).length / moves.length : 0,
        meanMove: moves.length ? moves.reduce((a, b) => a + b, 0) / moves.length : 0,
        baseMedAbsMove: baseMed,
        moveRatio: baseMed > 0 ? med / baseMed : 1
      };
    }

    const r30 = stats[30] ?? stats[horizons[horizons.length - 1]];
    const pct = Math.round(((r30?.moveRatio ?? 1) - 1) * 100);
    const summary =
      Math.abs(pct) < 10
        ? `Movement over the next 30 minutes has historically been typical for this market (${peers.length} comparable moments).`
        : pct > 0
          ? `This regime has historically moved ${pct}% further than average over 30 minutes (${peers.length} comparable moments) — widen expectations and stops accordingly.`
          : `This regime has historically moved ${Math.abs(pct)}% less than average over 30 minutes (${peers.length} comparable moments) — targets set at normal width are unlikely to be reached.`;

    return {
      ok: true,
      vol,
      trend,
      tod,
      efficiency: qEff,
      vol10: qVol,
      thresholds,
      stats,
      summary,
      guidance: GUIDANCE[`${vol}|${trend}`] ?? 'No guidance recorded for this regime.'
    };
  }
};
