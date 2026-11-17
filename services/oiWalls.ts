/**
 * OI WALLS - the per-strike open-interest read a trader takes from Sensibull's
 * "OI vs strike" chart, computed from the option quotes the app already polls.
 *
 * The aggregate callsOI / putsOI on a snapshot cannot say WHERE the writers
 * sit, and that is the whole of the read: the largest call OI above spot is
 * the ceiling, the largest put OI below spot is the floor. Logging these every
 * snapshot is what makes the wall-reclaim idea backtestable at all - the
 * archive before this held only totals.
 *
 * Pure module: no React, no I/O.
 */

export interface OiWalls {
  /** Strike with the largest call OI at or above spot. */
  callWall: number | null;
  callWallOI: number;
  /** Strike with the largest put OI at or below spot. */
  putWall: number | null;
  putWallOI: number;
  /**
   * Compact per-strike ladder, ATM ± `ladderReach`, ascending:
   * "strike:putOI/callOI;..." with OI in lakhs to one decimal.
   */
  oiLadder: string;
}

export interface OptionOiQuote {
  symbol: string;
  oi?: number;
}

/** "NSE:NIFTY-25300-CE" -> { strike: 25300, type: 'CE' }. */
export function parseOptionSymbol(symbol: string): { strike: number; type: 'CE' | 'PE' } | null {
  const m = /NIFTY-(\d+(?:\.\d+)?)-(CE|PE)$/.exec(symbol || '');
  return m ? { strike: Number(m[1]), type: m[2] as 'CE' | 'PE' } : null;
}

const lakhs = (oi: number) => (oi / 1e5).toFixed(1);

export function computeOiWalls(
  options: OptionOiQuote[],
  spot: number,
  ladderReach = 500,
  strikeStep = 50
): OiWalls {
  const byStrike = new Map<number, { callOI: number; putOI: number }>();
  for (const o of options) {
    const parsed = parseOptionSymbol(o.symbol);
    if (!parsed) continue;
    const row = byStrike.get(parsed.strike) ?? { callOI: 0, putOI: 0 };
    if (parsed.type === 'CE') row.callOI += o.oi || 0;
    else row.putOI += o.oi || 0;
    byStrike.set(parsed.strike, row);
  }

  let callWall: number | null = null, callWallOI = 0;
  let putWall: number | null = null, putWallOI = 0;
  for (const [strike, row] of byStrike) {
    if (strike >= spot && row.callOI > callWallOI) {
      callWall = strike;
      callWallOI = row.callOI;
    }
    if (strike <= spot && row.putOI > putWallOI) {
      putWall = strike;
      putWallOI = row.putOI;
    }
  }

  const atm = Math.round(spot / strikeStep) * strikeStep;
  const oiLadder = [...byStrike.entries()]
    .filter(([strike]) => Math.abs(strike - atm) <= ladderReach)
    .sort((a, b) => a[0] - b[0])
    .map(([strike, row]) => `${strike}:${lakhs(row.putOI)}/${lakhs(row.callOI)}`)
    .join(';');

  return { callWall, callWallOI, putWall, putWallOI, oiLadder };
}
