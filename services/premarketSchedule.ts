/**
 * When the pre-market decision is allowed to be treated as final.
 *
 * The chart screenshots are captured the previous evening, so a verdict built
 * from them alone describes *yesterday's* structure. Issuing "STAND ASIDE — no
 * trade today" from that data is a guess about a session that has not started:
 * the levels have not been re-anchored to today's open, so the measured room
 * between the walls is meaningless.
 *
 * The decision is therefore re-cut at fixed checkpoints, each with strictly
 * better information than the last, and is only ever final once the market has
 * actually opened.
 */
import { istMinutes } from './sniperPlaybook';

export type DecisionBasis = 'CHARTS_ONLY' | 'PREOPEN' | 'LIVE_OPEN' | 'INTRADAY';

/** Pre-open call auction is well underway and indicative prices are meaningful. */
export const PREOPEN_MINS = 9 * 60 + 10;
/** The bell. First real prints. */
export const OPEN_MINS = 9 * 60 + 15;
/** Enough live prints to re-anchor levels against a real range. */
export const INTRADAY_MINS = 9 * 60 + 20;

/** A re-cut is only worth it once price has moved far enough to change the zone. */
export const SPOT_DRIFT_TRIGGER = 40;

const ORDER: DecisionBasis[] = ['CHARTS_ONLY', 'PREOPEN', 'LIVE_OPEN', 'INTRADAY'];
const rank = (b: DecisionBasis): number => Math.max(0, ORDER.indexOf(b));

export const BASIS_LABEL: Record<DecisionBasis, string> = {
  CHARTS_ONLY: 'Charts only · pre-open',
  PREOPEN: 'Pre-open auction · 09:10',
  LIVE_OPEN: 'Live open · 09:15',
  INTRADAY: 'Live market'
};

export const BASIS_NOTE: Record<DecisionBasis, string> = {
  CHARTS_ONLY:
    'Built from last session\'s charts. Levels are not yet anchored to today\'s open — this verdict is provisional and will be re-cut at 09:10 and 09:15.',
  PREOPEN:
    'Re-cut against the pre-open auction price. Still provisional: the auction indicates the open, it does not set the day\'s range.',
  LIVE_OPEN: 'Re-cut on the real opening price. Levels are now anchored to today.',
  INTRADAY: 'Re-anchored to live price.'
};

/** The best basis obtainable at this moment. */
export function basisFor(now: Date = new Date()): DecisionBasis {
  const m = istMinutes(now);
  if (m < PREOPEN_MINS) return 'CHARTS_ONLY';
  if (m < OPEN_MINS) return 'PREOPEN';
  if (m < INTRADAY_MINS) return 'LIVE_OPEN';
  return 'INTRADAY';
}

/**
 * A verdict is only trustworthy once it has seen a real price from today.
 * Anything built before the open is a plan, not a decision.
 */
export const isProvisional = (basis: DecisionBasis | undefined): boolean =>
  !basis || basis === 'CHARTS_ONLY' || basis === 'PREOPEN';

/**
 * The basis a stored decision should be rebuilt at, or null when it is already
 * current. Checkpoints never run backwards, so a decision generated at 09:16
 * is not re-cut as a pre-open one.
 */
export function dueRevalidation(
  current: DecisionBasis | undefined,
  now: Date = new Date()
): DecisionBasis | null {
  const want = basisFor(now);
  const have: DecisionBasis = current ?? 'CHARTS_ONLY';
  // Past 09:20 the clock stops driving re-cuts; price drift takes over. But a
  // decision that never saw the open still owes us one live re-cut.
  if (want === 'INTRADAY') return rank(have) < rank('LIVE_OPEN') ? 'INTRADAY' : null;
  return rank(want) > rank(have) ? want : null;
}

/**
 * After the open, a decision whose anchor price has drifted far enough is
 * stale regardless of the clock: the zone it measured no longer surrounds
 * price, which is exactly the case that produces a bogus "no room" blocker.
 */
export function driftRevalidationDue(
  decisionSpot: number | undefined | null,
  liveSpot: number | undefined | null,
  now: Date = new Date()
): boolean {
  if (!decisionSpot || !liveSpot) return false;
  if (istMinutes(now) < OPEN_MINS) return false;
  return Math.abs(liveSpot - decisionSpot) >= SPOT_DRIFT_TRIGGER;
}
