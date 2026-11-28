/**
 * WALL SETUP - the trader's manual read as a state machine.
 *
 * The trade that works (2026-11-25, 2026-11-27) is: price reaches an OI wall,
 * the move into it stalls, a higher low (or lower high) prints, then price
 * breaks the bar that made the extreme. The trade that hurts (2026-11-26) is
 * the same idea entered on the spike before any of that happened. And a wall
 * is not a guarantee: on 2026-11-27 the 25850 put wall had +120% new writing
 * and broke inside five minutes.
 *
 * Two independent trackers run on completed 1-minute bars:
 *   LONG  off the floor   (nearest significant put wall below spot)
 *   SHORT off the ceiling (nearest significant call wall above spot)
 *
 *   IDLE -> AT_WALL -> STALLING -> TURNING -> CONFIRMED
 *                \-------------------------> FAILED (close beyond wall -/+ failBuffer)
 *
 * CONFIRMED carries a plan in Nifty points: entry (the confirming close), stop
 * (wall -/+ failBuffer), target (+targetPts, or 5 short of the next wall when
 * that is closer) and the room. It never places an order.
 *
 * Pure module: no React, no I/O, no clock. Bars in, events out.
 */

export type Side = 'LONG' | 'SHORT';
export type Stage = 'IDLE' | 'AT_WALL' | 'STALLING' | 'TURNING' | 'CONFIRMED' | 'FAILED';

export interface Bar {
  /** Bar start, epoch ms. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  /** Samples that built this bar; 1-2 means the high/low are approximate. */
  n: number;
}

/** The walls in force at a bar's close. */
export interface WallsAt {
  floor: number | null;
  floorOIChangePct: number | null;
  ceiling: number | null;
  ceilingOIChangePct: number | null;
}

export interface SetupParams {
  /** Within this many points of the wall counts as "at the wall". */
  nearPts: number;
  /** A close this far beyond the wall means it failed. */
  failBuffer: number;
  /** A new extreme smaller than this still counts as stalling. */
  stallTolerance: number;
  /** The planned move. */
  targetPts: number;
  /** Price this far away from the wall, unconfirmed, ends the watch. */
  leaveBuffer: number;
  /**
   * The confirming close must also be this far off the extreme. With 1-minute
   * snapshot bars the extreme bar's high can equal its low, so "through the
   * break level" alone would confirm on the first uptick.
   */
  minBounce: number;
}

export const DEFAULT_SETUP_PARAMS: SetupParams = {
  nearPts: 25,
  failBuffer: 5,
  stallTolerance: 2,
  targetPts: 30,
  leaveBuffer: 15,
  minBounce: 10
};

export interface SetupPlan {
  side: Side;
  wall: number;
  entry: number;
  stop: number;
  target: number;
  /** Target capped by the next wall in the path. */
  targetCapped: boolean;
  /** Points to the next wall in the path at confirmation; null when unknown. */
  room: number | null;
  risk: number;
  reward: number;
  /** Writers at the wall were adding (positive OI change) at confirmation. */
  wallDefended: boolean | null;
  /** Your rule: skip when the room to the next wall is under the target. */
  roomOk: boolean;
}

export interface SetupEvent {
  t: number;
  side: Side;
  stage: Stage;
  spot: number;
  wall: number;
  note: string;
  plan?: SetupPlan;
}

interface Tracker {
  stage: Stage;
  wall: number | null;
  /** Most extreme price reached at the wall (low for LONG, high for SHORT). */
  extreme: number | null;
  /** High (LONG) / low (SHORT) of the bar that made the extreme: the level to break. */
  breakLevel: number | null;
  barsSinceExtreme: number;
  turned: boolean;
}

export interface SetupState {
  long: Tracker;
  short: Tracker;
  /** Completed 1-minute bars, oldest first (kept short). */
  bars: Bar[];
}

const fresh = (): Tracker => ({ stage: 'IDLE', wall: null, extreme: null, breakLevel: null, barsSinceExtreme: 0, turned: false });

export function initialSetupState(): SetupState {
  return { long: fresh(), short: fresh(), bars: [] };
}

/** Group ticks into 1-minute bars (IST minute boundaries are the same as UTC ones). */
export function toMinuteBars(ticks: { t: number; spot: number }[]): Bar[] {
  const bars: Bar[] = [];
  for (const { t, spot } of ticks) {
    if (!Number.isFinite(spot) || spot <= 0) continue;
    const start = Math.floor(t / 60_000) * 60_000;
    const last = bars[bars.length - 1];
    if (last && last.t === start) {
      last.h = Math.max(last.h, spot);
      last.l = Math.min(last.l, spot);
      last.c = spot;
      last.n++;
    } else {
      bars.push({ t: start, o: spot, h: spot, l: spot, c: spot, n: 1 });
    }
  }
  return bars;
}

/** Group 1-minute bars into 5-minute bars. */
export function toFiveMinuteBars(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  for (const b of bars) {
    const start = Math.floor(b.t / 300_000) * 300_000;
    const last = out[out.length - 1];
    if (last && last.t === start) {
      last.h = Math.max(last.h, b.h);
      last.l = Math.min(last.l, b.l);
      last.c = b.c;
      last.n += b.n;
    } else out.push({ ...b, t: start });
  }
  return out;
}

/**
 * The monitor plan's H2 rule on the last three completed 5-minute bars:
 * DOWN = lower highs and lower lows, UP = higher highs and higher lows.
 */
export function fiveMinuteTrend(completed5m: Bar[]): 'UP' | 'DOWN' | 'RANGE' {
  if (completed5m.length < 3) return 'RANGE';
  const [a, b, c] = completed5m.slice(-3);
  if (c.h < b.h && b.h < a.h && c.l < b.l && b.l < a.l) return 'DOWN';
  if (c.h > b.h && b.h > a.h && c.l > b.l && b.l > a.l) return 'UP';
  return 'RANGE';
}

function plan(side: Side, wall: number, entry: number, walls: WallsAt, p: SetupParams, oiChange: number | null): SetupPlan {
  const sign = side === 'LONG' ? 1 : -1;
  const nextWall = side === 'LONG' ? walls.ceiling : walls.floor;
  const room = nextWall === null ? null : Math.round(Math.abs(nextWall - entry) * 10) / 10;
  let target = entry + sign * p.targetPts;
  let targetCapped = false;
  // The next wall must lie ahead of the entry; one at or behind it (price is
  // already through it) gives no cap. A cap closer than 5 pts is no trade at all:
  // keep the full target and let roomOk say so (2026-11-20 10:22 had a "target"
  // behind a SHORT entry).
  const ahead = nextWall !== null && sign * (nextWall - entry) > 0;
  if (ahead && room !== null && room - 5 < p.targetPts && room - 5 >= 5) {
    target = nextWall! - sign * 5;
    targetCapped = true;
  }
  const stop = wall - sign * p.failBuffer;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    side,
    wall,
    entry: r1(entry),
    stop: r1(stop),
    target: r1(target),
    targetCapped,
    room,
    risk: r1(Math.abs(entry - stop)),
    reward: r1(Math.abs(target - entry)),
    wallDefended: oiChange === null ? null : oiChange > 0,
    roomOk: !ahead ? nextWall === null : room! >= p.targetPts
  };
}

function stepSide(tr: Tracker, side: Side, bar: Bar, walls: WallsAt, p: SetupParams): SetupEvent[] {
  const events: SetupEvent[] = [];
  const isLong = side === 'LONG';
  const sign = isLong ? 1 : -1;
  const liveWall = isLong ? walls.floor : walls.ceiling;
  const oiChange = isLong ? walls.floorOIChangePct : walls.ceilingOIChangePct;
  const emit = (stage: Stage, note: string, extra: Partial<SetupEvent> = {}) => {
    tr.stage = stage;
    events.push({ t: bar.t, side, stage, spot: bar.c, wall: tr.wall!, note, ...extra });
  };
  const reset = () => Object.assign(tr, fresh());

  // Terminal stages report once, then the tracker re-arms on the next bar.
  if (tr.stage === 'CONFIRMED' || tr.stage === 'FAILED') reset();

  if (tr.stage === 'IDLE') {
    if (liveWall === null) return events;
    // Distance from the wall, measured on the side the trade defends (above a floor, below a ceiling).
    const dist = sign * (bar.c - liveWall);
    if (dist >= -p.failBuffer && dist <= p.nearPts) {
      tr.wall = liveWall;
      tr.extreme = isLong ? bar.l : bar.h;
      tr.breakLevel = isLong ? bar.h : bar.l;
      tr.barsSinceExtreme = 0;
      tr.turned = false;
      const defended = oiChange === null ? '' : ` · writers ${oiChange > 0 ? '+' : ''}${oiChange}%`;
      emit('AT_WALL', `${isLong ? 'Floor' : 'Ceiling'} ${liveWall}: ${Math.round(Math.abs(bar.c - liveWall))} pts away${defended}`);
    }
    return events;
  }

  const wall = tr.wall!;
  // Failure: a close beyond the wall by the buffer.
  if (sign * (bar.c - wall) < -p.failBuffer) {
    emit('FAILED', `Closed ${Math.round(Math.abs(bar.c - wall))} pts ${isLong ? 'below' : 'above'} ${wall}: wall failed`);
    return events;
  }
  // Left the zone without confirming.
  if (sign * (bar.c - wall) > p.nearPts + p.leaveBuffer && !tr.turned) {
    reset();
    return events;
  }

  const newExtreme = isLong ? bar.l < tr.extreme! - p.stallTolerance : bar.h > tr.extreme! + p.stallTolerance;
  if (newExtreme) {
    tr.extreme = isLong ? bar.l : bar.h;
    tr.breakLevel = isLong ? bar.h : bar.l;
    tr.barsSinceExtreme = 0;
    tr.turned = false;
    if (tr.stage !== 'AT_WALL') tr.stage = 'AT_WALL';
    return events;
  }

  tr.barsSinceExtreme++;
  // Small new extremes (within tolerance) still move the reference, without resetting the stall count.
  if (isLong ? bar.l < tr.extreme! : bar.h > tr.extreme!) tr.extreme = isLong ? bar.l : bar.h;

  if (tr.stage === 'AT_WALL' && tr.barsSinceExtreme >= 1) {
    emit('STALLING', `No new ${isLong ? 'low' : 'high'} past ${Math.round(tr.extreme!)} for ${tr.barsSinceExtreme} min`);
  }

  // Turning: this bar's low is above the extreme (LONG) and it closed up from it.
  const turning = isLong ? bar.l > tr.extreme! && bar.c > tr.extreme! : bar.h < tr.extreme! && bar.c < tr.extreme!;
  if (!tr.turned && turning && tr.barsSinceExtreme >= 1) {
    tr.turned = true;
    emit('TURNING', `${isLong ? 'Higher low' : 'Lower high'} above ${Math.round(tr.extreme!)}; break level ${Math.round(tr.breakLevel!)}`);
  }

  // Confirmation: a close through the bar that made the extreme.
  if (tr.turned && sign * (bar.c - tr.breakLevel!) > 0 && sign * (bar.c - tr.extreme!) >= p.minBounce) {
    const pl = plan(side, wall, bar.c, walls, p, oiChange);
    emit('CONFIRMED', `Closed ${Math.round(bar.c)} through ${Math.round(tr.breakLevel!)}`, { plan: pl });
  }
  return events;
}

/** Advance both trackers by one completed 1-minute bar. */
export function stepWallSetup(
  state: SetupState,
  bar: Bar,
  walls: WallsAt,
  params: SetupParams = DEFAULT_SETUP_PARAMS
): SetupEvent[] {
  state.bars.push(bar);
  if (state.bars.length > 400) state.bars.splice(0, state.bars.length - 400);
  return [...stepSide(state.long, 'LONG', bar, walls, params), ...stepSide(state.short, 'SHORT', bar, walls, params)];
}

/**
 * Trail for an open position once it has made its target: the last completed
 * 1-minute bar's low - 5 (LONG) / high + 5 (SHORT), never loosened.
 */
export function trailLevel(side: Side, bars: Bar[], previous: number | null, buffer = 5): number | null {
  const last = bars[bars.length - 1];
  if (!last) return previous;
  const level = side === 'LONG' ? last.l - buffer : last.h + buffer;
  if (previous === null) return Math.round(level * 10) / 10;
  return Math.round((side === 'LONG' ? Math.max(previous, level) : Math.min(previous, level)) * 10) / 10;
}

export interface PlanOutcome {
  result: 'TARGET' | 'STOP' | 'TIMEOUT';
  exitT: number;
  exit: number;
  points: number;
  /** Best and worst spot excursion from entry during the hold, points. */
  mfe: number;
  mae: number;
  minutes: number;
}

/**
 * Walk a confirmed plan forward on 1-minute bars. The stop is checked before the
 * target inside each bar (the conservative order), and an unfinished trade is
 * marked at the close after `maxMinutes`.
 */
export function scorePlan(planned: SetupPlan, entryT: number, bars: Bar[], maxMinutes = 60): PlanOutcome {
  const sign = planned.side === 'LONG' ? 1 : -1;
  let mfe = 0, mae = 0;
  const after = bars.filter(b => b.t > entryT);
  for (const b of after) {
    const minutes = Math.round((b.t - entryT) / 60_000);
    const best = sign > 0 ? b.h - planned.entry : planned.entry - b.l;
    const worst = sign > 0 ? b.l - planned.entry : planned.entry - b.h;
    mfe = Math.max(mfe, best);
    mae = Math.min(mae, worst);
    const hitStop = sign > 0 ? b.l <= planned.stop : b.h >= planned.stop;
    const hitTarget = sign > 0 ? b.h >= planned.target : b.l <= planned.target;
    const r1 = (n: number) => Math.round(n * 10) / 10;
    if (hitStop) return { result: 'STOP', exitT: b.t, exit: planned.stop, points: r1(sign * (planned.stop - planned.entry)), mfe: r1(mfe), mae: r1(mae), minutes };
    if (hitTarget) return { result: 'TARGET', exitT: b.t, exit: planned.target, points: r1(sign * (planned.target - planned.entry)), mfe: r1(mfe), mae: r1(mae), minutes };
    if (minutes >= maxMinutes) return { result: 'TIMEOUT', exitT: b.t, exit: b.c, points: r1(sign * (b.c - planned.entry)), mfe: r1(mfe), mae: r1(mae), minutes };
  }
  const last = after[after.length - 1];
  return {
    result: 'TIMEOUT',
    exitT: last?.t ?? entryT,
    exit: last?.c ?? planned.entry,
    points: last ? Math.round(sign * (last.c - planned.entry) * 10) / 10 : 0,
    mfe: Math.round(mfe * 10) / 10,
    mae: Math.round(mae * 10) / 10,
    minutes: last ? Math.round((last.t - entryT) / 60_000) : 0
  };
}
