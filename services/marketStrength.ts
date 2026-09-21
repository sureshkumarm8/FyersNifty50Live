/**
 * MARKET STRENGTH — the single definition of order-book pressure.
 *
 * Every "Str" column in the history log (Stk Str, Call Str, Put Str, Opt Str)
 * answers one question: has the resting bid book grown faster than the resting
 * ask book since the session opened? The dashboard already answered it correctly
 * per symbol (`day_net_strength` in App.tsx) and in the table footer
 * (`totalBidChgDayP - totalAskChgDayP` in StockTable.tsx), both of which divide
 * the change by the SESSION-OPEN level.
 *
 * The history snapshot used to divide by the *delta* instead:
 *
 *     (buyDelta - sellDelta) / |sellDelta|
 *
 * `sellDelta` starts at exactly zero and oscillates around it all session, so
 * the column had a pole. On 2026-09-21 the put sell book drifted back through
 * its opening level and Put Str printed +40,055% off a 1% move in the underlying
 * quantity — and Opt Str, being Call Str - Put Str, inherited it doubled.
 *
 * Dividing by the opening level removes the pole: that denominator is a large
 * positive constant for the whole session. Note the result is NOT bounded to
 * ±100 — an ask book that triples reads -200% — but it degrades smoothly
 * instead of exploding. Measured range on 2026-09-21 options: [-62, +52].
 */

import { istMinutesOf } from './sniperEngine';

/**
 * 10:00 IST. The baseline must not be captured before this.
 *
 * Two separate reasons, both measured on real session logs:
 *
 * 1. Pre-market the book is a stub. On 2026-09-16 the app was opened at 08:24
 *    with a 6.58M call bid book, which filled to 46.38M by 09:17 purely because
 *    the market opened. Anchoring there makes every Day% read +605% before a
 *    single real trade — and, because the ask book shrinks below its pre-market
 *    level and later grows back through it, it is what manufactured the
 *    divide-by-zero in the old delta-denominator formula.
 *
 * 2. The bid:ask ratio decays hard for the first ~45 minutes and then plateaus
 *    (16-09: 7.18 -> 4.11, 17-09: 6.30 -> 3.91, both flat thereafter). That
 *    decay is book structure, not market direction, and anchoring inside it
 *    bakes a false downward slope into the whole day. Measured session drift in
 *    Call Str by anchor time:
 *
 *        anchor    16-09      17-09
 *        09:20     -57.0      -45.4
 *        09:45     -19.3      -33.4
 *        10:00     -21.3       +4.0
 *
 *    -57 is the size of the entire real signal range, so a 09:20 anchor is
 *    mostly measuring its own baseline. Only two sessions had usable pre-10:00
 *    data, so treat 10:00 as the best available estimate rather than a fitted
 *    optimum — but it beat 09:20 on both, and the mechanism explains why.
 *
 * The cost is real: no Strength reading before 10:00. That is the honest
 * answer, not a gap — before the book settles these columns cannot separate
 * structure from signal.
 */
export const BASELINE_ANCHOR_MINUTES = 10 * 60;

/** True once the clock is far enough past the open that the book is real. */
export function isBaselineAnchorable(now: Date = new Date()): boolean {
  return istMinutesOf(now) >= BASELINE_ANCHOR_MINUTES;
}

/**
 * Session change % of one side of the book against its opening level.
 * Returns 0 when there is no usable baseline, which is the honest reading
 * before the session is anchored — not a neutral signal, just no data yet.
 */
export function sideChangePct(current: number, initial: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(initial) || initial <= 0) return 0;
  return ((current - initial) / initial) * 100;
}

/**
 * Day Strength — bid change % minus ask change %, the same formula the stock
 * table shows per symbol. Positive means resting demand has grown faster than
 * resting supply since the open.
 */
export function dayStrength(
  buyNow: number,
  buyInitial: number,
  sellNow: number,
  sellInitial: number
): number {
  return sideChangePct(buyNow, buyInitial) - sideChangePct(sellNow, sellInitial);
}
