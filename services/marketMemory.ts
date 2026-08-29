/**
 * MARKET MEMORY — case-based reasoning over your own archived sessions.
 *
 * Rather than asking a model to assert what happens next, this asks a question
 * a trader can actually check: "when the market last looked like this, what
 * followed?" It searches every archived minute for the nearest neighbours of the
 * current moment in the same 16-dimension standardized feature space the
 * forecast model was trained in, and reports the *distribution* of what
 * happened next.
 *
 * Three deliberate design choices keep it honest:
 *
 *  - Neighbours from within `EXCLUSION_MINUTES` of the query are discarded.
 *    Adjacent minutes are near-identical by construction, so without this the
 *    engine would mostly rediscover the last half hour and call it evidence.
 *  - Every result is reported against the unconditional base rate. If the
 *    analogues say 55% up and the archive says 54% up regardless, the analogues
 *    have told you nothing, and the panel says so.
 *  - Significance is tested before anything is presented as a finding.
 */

import {
  LabelledPoint,
  FeaturePoint,
  FEATURE_NAMES,
  MODEL_HORIZONS
} from './predictionModel';

/** Neighbours this close in time to the query are structurally duplicated. */
export const EXCLUSION_MINUTES = 90;

/**
 * Minimum separation between two *selected* analogues.
 *
 * Without this the result set fills up with adjacent minutes of the same
 * episode — 13:15, 13:16, 13:25 of one afternoon are one event, not three
 * observations. Counting them separately would inflate the sample size and make
 * the significance test far too eager. Selection is therefore greedy: walk
 * outward from the closest match and keep a candidate only if it is at least
 * this far from everything already accepted.
 */
export const MIN_SEPARATION_MINUTES = 45;

/**
 * Relative importance of each feature when judging "similar market".
 * Volatility state, breadth-free sentiment and the intraday clock dominate;
 * absolute session drift is downweighted because a similar shape at a different
 * absolute level is still a good analogue.
 */
const DEFAULT_WEIGHTS: Record<string, number> = {
  ret5: 1, ret15: 1, ret30: 0.8,
  vol10: 1.4, vol30: 1.2,
  sent: 1.2, sentSlope5: 1, sentSlope15: 0.8,
  pcrDev: 1, pcrChg5: 0.8, pcrChg15: 0.6,
  todFrac: 1.3, todVol: 0.6,
  rangePos: 1, sessionRet: 0.4, z30: 1.1
};

const weightVector = (): number[] => FEATURE_NAMES.map(n => DEFAULT_WEIGHTS[n] ?? 1);

export interface Analogue {
  t: number;
  /** "YYYY-MM-DD HH:MM" of the historical moment. */
  label: string;
  distance: number;
  /** 0-1, 1 being an identical market state. */
  similarity: number;
  ltp: number;
  sent: number;
  pcr: number;
  forward: Record<number, number>;
}

export interface HorizonOutcome {
  horizon: number;
  samples: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  /** Share of analogues that rose. */
  probUp: number;
  /** Share of ALL archived moments that rose — the honest comparison. */
  baseProbUp: number;
  /** probUp minus baseProbUp, in percentage points. */
  edgePts: number;
  /** True only when the analogue set differs from base rate beyond noise. */
  significant: boolean;
  /** Two-proportion z score behind `significant`. */
  z: number;
}

export interface MemoryResult {
  ok: true;
  analogues: Analogue[];
  outcomes: HorizonOutcome[];
  /** Archived moments searched. */
  searched: number;
  /** Plain-language read of whether the analogues carry information. */
  verdict: string;
}

export interface MemoryFailure {
  ok: false;
  reason: string;
  searched: number;
}

/** `strict` is off, so boolean-literal discriminants need an explicit guard. */
export const isMemoryFailure = (r: MemoryResult | MemoryFailure): r is MemoryFailure => r.ok === false;

const quantile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

const fmt = (t: number) => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * Two-proportion z test: does the analogue up-rate differ from the base rate by
 * more than sampling noise?
 */
function twoProportionZ(x1: number, n1: number, x2: number, n2: number): number {
  if (n1 === 0 || n2 === 0) return 0;
  const p1 = x1 / n1, p2 = x2 / n2;
  const p = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  return se === 0 ? 0 : (p1 - p2) / se;
}

export const marketMemory = {
  /**
   * Find the k nearest historical analogues of `query` within `history`.
   *
   * `history` should be the labelled series across every archived session;
   * `query` is the current moment.
   */
  search: (
    query: FeaturePoint,
    history: LabelledPoint[],
    k = 25,
    horizons: number[] = MODEL_HORIZONS
  ): MemoryResult | MemoryFailure => {
    const w = weightVector();
    const excludeMs = EXCLUSION_MINUTES * 60000;

    const candidates = history.filter(p => Math.abs(p.t - query.t) > excludeMs);
    if (candidates.length < k * 4) {
      return {
        ok: false,
        reason: `Not enough archived history to find analogues — ${candidates.length} comparable moments available, need at least ${k * 4}. Archive more sessions.`,
        searched: candidates.length
      };
    }

    const scored = candidates
      .map(p => {
        let d2 = 0;
        for (let j = 0; j < w.length; j++) {
          const diff = (p.z[j] - query.z[j]) * w[j];
          d2 += diff * diff;
        }
        return { p, d: Math.sqrt(d2) };
      })
      .sort((a, b) => a.d - b.d);

    // Greedy independent selection — see MIN_SEPARATION_MINUTES.
    const sepMs = MIN_SEPARATION_MINUTES * 60000;
    const top: Array<{ p: LabelledPoint; d: number }> = [];
    for (const cand of scored) {
      if (top.length >= k) break;
      if (top.every(sel => Math.abs(sel.p.t - cand.p.t) >= sepMs)) top.push(cand);
    }
    if (top.length < 8) {
      return {
        ok: false,
        reason: `Only ${top.length} independent analogues found. Archive more sessions before relying on this.`,
        searched: candidates.length
      };
    }
    const worst = top[top.length - 1].d || 1;

    const analogues: Analogue[] = top.map(({ p, d }) => ({
      t: p.t,
      label: fmt(p.t),
      distance: d,
      similarity: Math.max(0, 1 - d / (worst * 1.5)),
      ltp: p.ltp,
      sent: p.sent,
      pcr: p.pcr,
      forward: p.forward
    }));

    const outcomes: HorizonOutcome[] = horizons.map(h => {
      const moves = top.map(({ p }) => p.forward[h]).filter(v => Number.isFinite(v)) as number[];
      const baseMoves = candidates.map(p => p.forward[h]).filter(v => Number.isFinite(v)) as number[];
      const sorted = [...moves].sort((a, b) => a - b);

      const ups = moves.filter(v => v > 0).length;
      const baseUps = baseMoves.filter(v => v > 0).length;
      const probUp = moves.length ? ups / moves.length : 0;
      const baseProbUp = baseMoves.length ? baseUps / baseMoves.length : 0;
      const z = twoProportionZ(ups, moves.length, baseUps, baseMoves.length);

      return {
        horizon: h,
        samples: moves.length,
        median: quantile(sorted, 0.5),
        mean: moves.length ? moves.reduce((a, b) => a + b, 0) / moves.length : 0,
        p25: quantile(sorted, 0.25),
        p75: quantile(sorted, 0.75),
        probUp,
        baseProbUp,
        edgePts: (probUp - baseProbUp) * 100,
        significant: Math.abs(z) > 1.96 && moves.length >= 10,
        z
      };
    });

    const hits = outcomes.filter(o => o.significant);
    const verdict = hits.length === 0
      ? 'These analogues behave like the market at large — no directional information beyond the base rate. Use the spread as a range expectation, not a signal.'
      : `Analogue outcomes differ from the base rate at ${hits.map(o => `${o.horizon}m`).join(', ')} — the strongest is ${hits
          .slice()
          .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))[0].horizon}m. Treat as weak evidence, not a trigger.`;

    return { ok: true, analogues, outcomes, searched: candidates.length, verdict };
  }
};
