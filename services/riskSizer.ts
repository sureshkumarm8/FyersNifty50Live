/**
 * RISK SIZER — turn the one thing the model is actually good at into a trade.
 *
 * Validation showed direction is not predictable at these horizons, but the
 * calibrated volatility band is: it covers 78-81% of outcomes in every
 * volatility regime. A band that reliable is precisely what stop placement and
 * position sizing need, so this module spends the model's real skill where it
 * pays rather than on a direction call it cannot support.
 *
 * The stop is derived from the band, not from a round number. A 30-point stop
 * is reckless in a calm market and guaranteed to be hit in a violent one; the
 * same stop expressed in sigma is neither.
 */

import { RegimeReading } from './regimeRadar';

export interface RiskInputs {
  /** Account capital available for this trade, in rupees. */
  capital: number;
  /** Fraction of capital risked per trade, e.g. 0.01 for 1%. */
  riskPerTrade: number;
  /** Rupee value of a 1-point Nifty move for one lot (lot size x 1). */
  pointValue: number;
  /** The 80% half-band from the forecast, in points. */
  bandPts: number;
  /** Horizon the band was computed for. */
  horizon: number;
  spot: number;
}

export interface RiskPlan {
  ok: true;
  /** Stop distance in points — wide enough to survive normal noise. */
  stopPts: number;
  /** Target distance in points, set to keep reward >= risk. */
  targetPts: number;
  rr: number;
  /** Whole lots to trade. */
  lots: number;
  /** Rupees at risk if the stop is hit. */
  riskAmount: number;
  /** Probability the stop is hit before the horizon, from the band. */
  probStopHit: number;
  longStop: number;
  longTarget: number;
  shortStop: number;
  shortTarget: number;
  notes: string[];
}

export interface RiskFailure {
  ok: false;
  reason: string;
}

/** `strict` is off, so boolean-literal discriminants need an explicit guard. */
export const isRiskFailure = (r: RiskPlan | RiskFailure): r is RiskFailure => r.ok === false;

/**
 * Stop at 1.0x the 80% half-band.
 *
 * The band already represents a 1.28-sigma move, so a stop here is hit by
 * roughly 10% of one-directional excursions before the horizon — tight enough
 * to be meaningful, wide enough that ordinary noise does not trigger it.
 */
const STOP_BAND_MULT = 1.0;
/** Target at 1.5x the stop, so a sub-50% hit rate can still be profitable. */
const TARGET_RR = 1.5;

export function planRisk(inputs: RiskInputs, regime?: RegimeReading): RiskPlan | RiskFailure {
  const { capital, riskPerTrade, pointValue, bandPts, spot, horizon } = inputs;

  if (!(capital > 0) || !(riskPerTrade > 0) || !(pointValue > 0)) {
    return { ok: false, reason: 'Capital, risk fraction and point value must all be positive.' };
  }
  if (!(bandPts > 0)) {
    return { ok: false, reason: 'No calibrated band available yet — run a forecast first.' };
  }

  const notes: string[] = [];
  let stopPts = bandPts * STOP_BAND_MULT;

  // In violent-and-directionless conditions the band is wide for a reason:
  // the market can reach any level without resolving anything.
  if (regime?.ok && regime.vol === 'violent' && regime.trend === 'chopping') {
    stopPts *= 1.15;
    notes.push('Stop widened 15% — violent and directionless conditions hit ordinary stops on noise alone.');
  }
  if (regime?.ok && regime.vol === 'calm' && regime.trend === 'trending') {
    stopPts *= 0.85;
    notes.push('Stop tightened 15% — calm trends historically retrace least.');
  }

  stopPts = Math.max(5, Math.round(stopPts * 10) / 10);
  const targetPts = Math.round(stopPts * TARGET_RR * 10) / 10;

  const riskBudget = capital * riskPerTrade;
  const riskPerLot = stopPts * pointValue;
  const lots = Math.floor(riskBudget / riskPerLot);

  if (lots < 1) {
    return {
      ok: false,
      reason: `A ${stopPts.toFixed(1)}-point stop risks ₹${Math.round(riskPerLot).toLocaleString('en-IN')} per lot, which exceeds your ₹${Math.round(riskBudget).toLocaleString('en-IN')} budget. Reduce the risk fraction or wait for a calmer regime.`
    };
  }

  // P(|move| > stop) under the calibrated band: the band is a 1.28-sigma level,
  // so sigma = band / 1.2816 and the two-sided exceedance follows.
  const sigma = bandPts / 1.2816;
  const z = stopPts / sigma;
  const probStopHit = Math.max(0, Math.min(1, 2 * (1 - normCdf(z))));

  if (regime?.ok) {
    const s = regime.stats[horizon] ?? regime.stats[30];
    if (s && s.p80AbsMove > 0 && targetPts > s.p80AbsMove) {
      notes.push(
        `Target of ${targetPts} pts exceeds the ${s.p80AbsMove.toFixed(0)}-pt move that only 20% of ${regime.vol}/${regime.trend} periods have historically reached. Consider taking profit earlier.`
      );
    }
  }

  return {
    ok: true,
    stopPts,
    targetPts,
    rr: TARGET_RR,
    lots,
    riskAmount: Math.round(lots * riskPerLot),
    probStopHit,
    longStop: spot - stopPts,
    longTarget: spot + targetPts,
    shortStop: spot + stopPts,
    shortTarget: spot - targetPts,
    notes
  };
}

/** Abramowitz-Stegun 26.2.17 normal CDF. */
function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}
