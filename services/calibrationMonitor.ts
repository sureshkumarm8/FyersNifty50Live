/**
 * CALIBRATION MONITOR — is the stated confidence worth anything?
 *
 * A system that says "85% confident" and is right 85% of the time is useful
 * even when it is often wrong. A system that says 85% and is right 55% of the
 * time is worse than useless, because position size gets scaled by a number
 * that means nothing. This module compares claimed confidence against realised
 * frequency and reduces the answer to two numbers a trader can act on: the
 * reliability curve and the Brier score.
 */

import { AgentCall, GradingHorizon } from './agentScorecard';

export interface CalibrationBin {
  /** Inclusive lower bound of the claimed-confidence bucket, e.g. 70. */
  lo: number;
  hi: number;
  n: number;
  /** Mean confidence claimed inside this bucket. */
  claimed: number;
  /** Fraction actually correct. */
  actual: number;
  /** actual - claimed, in percentage points. Negative = overconfident. */
  gap: number;
}

export interface CalibrationReport {
  ok: true;
  bins: CalibrationBin[];
  /** Mean squared error of the probability forecast. Lower is better. */
  brier: number;
  /** Brier score of always predicting the base rate — the bar to beat. */
  brierBaseline: number;
  /** Positive means the confidence numbers add value over a constant guess. */
  skill: number;
  /** Mean (claimed - actual) across bins, weighted by n. Positive = overconfident. */
  overconfidence: number;
  graded: number;
  verdict: string;
}

export interface CalibrationFailure {
  ok: false;
  reason: string;
  graded: number;
}

/** `strict` is off, so boolean-literal discriminants need an explicit guard. */
export const isCalibrationFailure = (
  r: CalibrationReport | CalibrationFailure
): r is CalibrationFailure => r.ok === false;

const BINS: Array<[number, number]> = [
  [0, 55], [55, 65], [65, 75], [75, 85], [85, 101]
];

/** Minimum graded calls before a reliability curve means anything. */
export const MIN_GRADED = 30;

export function calibrationReport(
  calls: AgentCall[],
  horizon: GradingHorizon = 15
): CalibrationReport | CalibrationFailure {
  // Only decisive, graded calls can be scored: a HOLD has no direction to be
  // right or wrong about, and an ungraded call has no outcome yet.
  const graded = calls.filter(c => {
    const v = c.verdicts?.[horizon];
    return (v === 'win' || v === 'loss') && c.action !== 'HOLD';
  });

  if (graded.length < MIN_GRADED) {
    return {
      ok: false,
      reason: `Only ${graded.length} decisive graded calls at ${horizon}m. Need ${MIN_GRADED} before a reliability curve means anything — until then, treat every confidence number as unverified.`,
      graded: graded.length
    };
  }

  const correct = (c: AgentCall) => (c.verdicts[horizon] === 'win' ? 1 : 0);
  const baseRate = graded.reduce((s, c) => s + correct(c), 0) / graded.length;

  const bins: CalibrationBin[] = BINS.map(([lo, hi]) => {
    const inBin = graded.filter(c => c.claimedConfidence >= lo && c.claimedConfidence < hi);
    const claimed = inBin.length ? inBin.reduce((s, c) => s + c.claimedConfidence, 0) / inBin.length : 0;
    const actual = inBin.length ? inBin.reduce((s, c) => s + correct(c), 0) / inBin.length * 100 : 0;
    return { lo, hi, n: inBin.length, claimed, actual, gap: inBin.length ? actual - claimed : 0 };
  }).filter(b => b.n > 0);

  const brier =
    graded.reduce((s, c) => s + Math.pow(c.claimedConfidence / 100 - correct(c), 2), 0) / graded.length;
  const brierBaseline =
    graded.reduce((s, c) => s + Math.pow(baseRate - correct(c), 2), 0) / graded.length;

  const nTotal = bins.reduce((s, b) => s + b.n, 0);
  const overconfidence = nTotal
    ? bins.reduce((s, b) => s + (b.claimed - b.actual) * b.n, 0) / nTotal
    : 0;

  const verdict =
    brier >= brierBaseline
      ? `The confidence numbers carry no information — a constant ${(baseRate * 100).toFixed(0)}% guess scores better (Brier ${brierBaseline.toFixed(3)} vs ${brier.toFixed(3)}). Do not scale position size by them.`
      : overconfidence > 15
        ? `Systematically overconfident by ${overconfidence.toFixed(0)} points. The ranking has some value, but the stated numbers should be discounted heavily.`
        : overconfidence < -10
          ? `Underconfident by ${Math.abs(overconfidence).toFixed(0)} points — these calls land more often than they claim.`
          : `Reasonably calibrated (within ${Math.abs(overconfidence).toFixed(0)} points) and beating a constant guess. Confidence is usable for sizing.`;

  return {
    ok: true,
    bins,
    brier,
    brierBaseline,
    skill: brierBaseline > 0 ? (brierBaseline - brier) / brierBaseline : 0,
    overconfidence,
    graded: graded.length,
    verdict
  };
}
