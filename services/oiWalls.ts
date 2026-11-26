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

/** "25200:68.0/39.0;..." -> [{ strike, putOI, callOI }] with OI back in contracts. */
export function parseOiLadder(ladder: string | null | undefined): { strike: number; putOI: number; callOI: number }[] {
  return (ladder || '')
    .split(';')
    .map(part => /^(\d+(?:\.\d+)?):([\d.]+)\/([\d.]+)$/.exec(part.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map(m => ({ strike: Number(m[1]), putOI: Number(m[2]) * 1e5, callOI: Number(m[3]) * 1e5 }));
}

export interface WallRoom {
  /** The wall a trade in this direction runs into: puts below for SHORT, calls above for LONG. */
  wallStrike: number | null;
  wallOI: number;
  /** Points from spot to that wall; what is left of the move before writers defend. */
  room: number | null;
}

/**
 * The nearest strike in the trade's path whose OI is at least `minShare` of the
 * largest on that side of the ladder - the bar a trader's eye stops at on
 * Sensibull, which is often not the single biggest one further away
 * (2026-11-18: 25200 puts at 68L, 24 points below a short, while the largest
 * put wall sat at 25000).
 *
 * Logged on every Momentum entry so the room rule can be measured before it is
 * ever made a gate; the raw ladder is logged beside it so the definition can be
 * changed afterwards without losing the history.
 */
export function wallRoom(ladder: string | null | undefined, spot: number, direction: 'LONG' | 'SHORT', minShare = 0.5): WallRoom {
  const rows = parseOiLadder(ladder);
  const side = direction === 'SHORT'
    ? rows.filter(r => r.strike <= spot).map(r => ({ strike: r.strike, oi: r.putOI }))
    : rows.filter(r => r.strike >= spot).map(r => ({ strike: r.strike, oi: r.callOI }));
  const largest = Math.max(0, ...side.map(r => r.oi));
  if (largest <= 0) return { wallStrike: null, wallOI: 0, room: null };
  const wall = side
    .filter(r => r.oi >= largest * minShare)
    .sort((a, b) => Math.abs(a.strike - spot) - Math.abs(b.strike - spot))[0];
  return { wallStrike: wall.strike, wallOI: wall.oi, room: Math.round(Math.abs(spot - wall.strike) * 100) / 100 };
}

export interface WallContext {
  /** Nearest significant put wall at or below spot, and the points down to it. */
  floor: number | null;
  floorRoom: number | null;
  /** Put OI change at that strike over the lookback, %; positive means writers are adding. */
  floorOIChangePct: number | null;
  /** Nearest significant call wall at or above spot, and the points up to it. */
  ceiling: number | null;
  ceilingRoom: number | null;
  ceilingOIChangePct: number | null;
  /** Minutes between the two ladders compared; null when no earlier ladder exists. */
  comparedMinutes: number | null;
}

/**
 * Both walls around spot and whether their writers are adding or leaving.
 *
 * Logged by both engines so the trader's read - "price is at a wall the
 * writers are defending" - can be measured before it becomes a rule. On
 * 2026-11-19 both engines followed a SHORT 1-minute signal at a 25100 put wall
 * that gained ~20L in the minutes before, and Nifty rallied 127 points off it.
 *
 * `history` is newest-first, as the app keeps it.
 */
export function wallContext(
  history: { timestamp?: number; oiLadder?: string | null }[],
  spot: number,
  lookbackMinutes = 5
): WallContext {
  const laddered = history.filter(s => s.oiLadder && Number.isFinite(s.timestamp));
  const latest = laddered[0];
  const floor = wallRoom(latest?.oiLadder, spot, 'SHORT');
  const ceiling = wallRoom(latest?.oiLadder, spot, 'LONG');
  const earlier = latest
    ? laddered.find(s => s.timestamp! <= latest.timestamp! - lookbackMinutes * 60_000)
    : undefined;

  const change = (strike: number | null, side: 'putOI' | 'callOI') => {
    if (!earlier || strike === null) return null;
    const pick = (ladder: string | null | undefined) => parseOiLadder(ladder).find(r => r.strike === strike)?.[side];
    const now = pick(latest!.oiLadder), then = pick(earlier.oiLadder);
    return now === undefined || !then ? null : Math.round(((now - then) / then) * 1000) / 10;
  };

  return {
    floor: floor.wallStrike,
    floorRoom: floor.room,
    floorOIChangePct: change(floor.wallStrike, 'putOI'),
    ceiling: ceiling.wallStrike,
    ceilingRoom: ceiling.room,
    ceilingOIChangePct: change(ceiling.wallStrike, 'callOI'),
    comparedMinutes: earlier ? Math.round((latest!.timestamp! - earlier.timestamp!) / 60_000) : null
  };
}
