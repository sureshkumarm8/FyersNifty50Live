/**
 * GAMMA EXPOSURE (GEX) & ZERO-GAMMA FLIP CALCULATOR
 * ---------------------------------------------------
 * Calculates real-time dealer gamma positioning across Nifty options strikes.
 * 
 * Mechanics:
 * - When Nifty is above the Zero-Gamma Flip level (Net GEX > 0 / Long Gamma regime):
 *   Market makers buy dips and sell rips to stay delta-neutral.
 *   This dampens volatility, creating mean-reverting chop.
 * - When Nifty is below the Zero-Gamma Flip level (Net GEX < 0 / Short Gamma regime):
 *   Market makers must sell into declines and buy into rallies to hedge.
 *   This amplifies volatility, accelerating one-way waterfall breakdowns or short squeezes.
 */

import { EnrichedFyersQuote, FyersQuote } from '../types';

export interface StrikeGex {
  strike: number;
  callOi: number;
  putOi: number;
  gamma: number;
  callGex: number; // In Crores or index-points equivalent
  putGex: number;
  netGex: number;
}

export interface GexProfile {
  spot: number;
  strikes: StrikeGex[];
  netGexTotal: number;
  zeroGammaFlipLevel: number | null;
  regime: 'LONG_GAMMA' | 'SHORT_GAMMA' | 'NEUTRAL';
  majorCallWallGex: number | null;
  majorPutWallGex: number | null;
  volatilityAtm: number;
}

/** Standard Normal Probability Density Function */
function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Approximate Black-Scholes Gamma
 * Gamma = N'(d1) / (S * sigma * sqrt(T))
 */
export function calculateGamma(
  spot: number,
  strike: number,
  timeToExpiryYears: number,
  iv: number = 0.13,
  riskFreeRate: number = 0.065
): number {
  if (spot <= 0 || strike <= 0 || timeToExpiryYears <= 0 || iv <= 0) return 0;
  
  const sqrtT = Math.sqrt(timeToExpiryYears);
  const d1 = (Math.log(spot / strike) + (riskFreeRate + 0.5 * iv * iv) * timeToExpiryYears) / (iv * sqrtT);
  const pdf = normalPdf(d1);
  return pdf / (spot * iv * sqrtT);
}

/**
 * Calculates GEX profile across available option chain quotes
 */
export function calculateGexProfile(
  quotes: (FyersQuote | EnrichedFyersQuote)[],
  spot: number,
  daysToExpiry: number = 2
): GexProfile {
  if (!spot || spot <= 0 || !quotes || quotes.length === 0) {
    return {
      spot: spot || 0,
      strikes: [],
      netGexTotal: 0,
      zeroGammaFlipLevel: null,
      regime: 'NEUTRAL',
      majorCallWallGex: null,
      majorPutWallGex: null,
      volatilityAtm: 0.13
    };
  }

  // Minimum time to expiry = 0.5 days (0.5 / 365) to avoid division by zero on expiry day
  const tYears = Math.max(0.5, daysToExpiry) / 365;
  const atmIv = 0.13; // 13% annualized baseline Nifty IV

  const strikeMap = new Map<number, { callOi: number; putOi: number }>();

  // Aggregate OI per strike
  for (const q of quotes) {
    const sym = q.symbol || '';
    const match = /(?:NIFTY|NSE:NIFTY).*?(\d{5})(CE|PE)$/i.exec(sym);
    if (!match) continue;

    const strike = parseInt(match[1], 10);
    const type = match[2].toUpperCase();
    const oi = q.oi || 0;

    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, { callOi: 0, putOi: 0 });
    }
    const cur = strikeMap.get(strike)!;
    if (type === 'CE') cur.callOi += oi;
    else if (type === 'PE') cur.putOi += oi;
  }

  const sortedStrikes = Array.from(strikeMap.keys()).sort((a, b) => a - b);
  const strikeGexList: StrikeGex[] = [];
  let netGexTotal = 0;

  for (const strike of sortedStrikes) {
    const { callOi, putOi } = strikeMap.get(strike)!;
    if (callOi === 0 && putOi === 0) continue;

    const gamma = calculateGamma(spot, strike, tYears, atmIv);
    // Spot^2 * 0.01 factor normalizes GEX to readable ₹ Crores / points scale
    const scale = (spot * spot * 0.01) / 1000000;
    const callGex = gamma * callOi * scale;
    const putGex = -gamma * putOi * scale; // Puts create negative dealer gamma
    const netGex = callGex + putGex;

    strikeGexList.push({
      strike,
      callOi,
      putOi,
      gamma,
      callGex,
      putGex,
      netGex
    });

    netGexTotal += netGex;
  }

  // Find Zero-Gamma Flip Level (where net cumulative GEX transitions from negative to positive)
  let zeroGammaFlipLevel: number | null = null;
  for (let i = 0; i < strikeGexList.length - 1; i++) {
    const s1 = strikeGexList[i];
    const s2 = strikeGexList[i + 1];
    if ((s1.netGex <= 0 && s2.netGex >= 0) || (s1.netGex >= 0 && s2.netGex <= 0)) {
      // Linear interpolation between the two strikes
      const diff = s2.netGex - s1.netGex;
      const factor = diff !== 0 ? Math.abs(s1.netGex) / Math.abs(diff) : 0.5;
      zeroGammaFlipLevel = Math.round(s1.strike + factor * (s2.strike - s1.strike));
      break;
    }
  }

  // Identify major call and put GEX concentration walls
  let maxCallGex = -1;
  let majorCallWall: number | null = null;
  let maxPutGex = 1;
  let majorPutWall: number | null = null;

  for (const s of strikeGexList) {
    if (s.callGex > maxCallGex) {
      maxCallGex = s.callGex;
      majorCallWall = s.strike;
    }
    if (s.putGex < maxPutGex) {
      maxPutGex = s.putGex;
      majorPutWall = s.strike;
    }
  }

  const regime: GexProfile['regime'] =
    netGexTotal > 15
      ? 'LONG_GAMMA'
      : netGexTotal < -15
        ? 'SHORT_GAMMA'
        : 'NEUTRAL';

  return {
    spot,
    strikes: strikeGexList,
    netGexTotal,
    zeroGammaFlipLevel,
    regime,
    majorCallWallGex: majorCallWall,
    majorPutWallGex: majorPutWall,
    volatilityAtm: atmIv
  };
}
