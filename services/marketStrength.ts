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
 * 09:17 IST — two minutes after the open, the earliest point at which the
 * depth book is genuinely formed. Chosen so the dashboard carries a Strength
 * reading through the opening session, which is when it is most wanted.
 *
 * Pre-market the book is a stub and must never be the baseline. On 2026-09-16
 * the app was opened at 08:24 with a 6.58M call bid book which filled to
 * 46.38M by 09:17 purely because the market opened — anchoring there makes
 * every Day% read +605% before a single real trade. On 2026-09-22 at 09:10
 * every Nifty constituent had one side of its book at exactly 0, which is what
 * blanked Day Net Strength for all 48.
 *
 * KNOWN BIAS, measured, deliberately accepted: the bid:ask ratio decays for
 * roughly the first 45 minutes and then plateaus (16-09: 7.18 -> 4.11, 17-09:
 * 6.30 -> 3.91). Anchoring inside that decay puts a structural downward slope
 * through the session. Measured drift in Call Str by anchor time:
 *
 *     anchor    16-09      17-09
 *     09:20     -57.0      -45.4
 *     09:45     -19.3      -33.4
 *     10:00     -21.3       +4.0
 *
 * So an 09:17 anchor trades a known negative bias for coverage of the opening
 * session. Read Strength CHANGES rather than levels before ~10:00, and do not
 * compare a 09:30 level against a 14:30 level.
 */
export const BASELINE_ANCHOR_MINUTES = 9 * 60 + 17;

/** True once the clock is far enough past the open that the book is real. */
export function isBaselineAnchorable(now: Date = new Date()): boolean {
  return istMinutesOf(now) >= BASELINE_ANCHOR_MINUTES;
}

/**
 * A baseline quote is only usable when BOTH sides of its book have depth.
 *
 * Pre-open the exchange reports a half-formed book: on 2026-09-22 at 09:10
 * every Nifty constituent had one side at exactly 0 and the other in the tens
 * — ADANIENT was buy=0 / sell=61 against a real book of ~100k a quarter hour
 * later, which renders as askDay% = 163,803%. Because Day Net Strength needs
 * both sides, it came out blank for all 48 stocks.
 *
 * Refusing such a baseline leaves every Day column empty until a real book
 * exists, which is the honest reading — the alternative is a five-figure
 * percentage that looks like a measurement.
 */
export function isUsableBaseline(
  buy: number | undefined,
  sell: number | undefined
): boolean {
  return Number.isFinite(buy) && (buy as number) > 0
    && Number.isFinite(sell) && (sell as number) > 0;
}

/**
 * Should this symbol's baseline be captured from this quote, right now?
 *
 * Anchoring is per symbol rather than one clock tick for the whole universe.
 * A single wholesale anchor is what let a half-formed book through: at the
 * anchor instant some symbols have depth and some do not, and the ones that
 * do not get a stub frozen in for the rest of the day. Per symbol, a straggler
 * simply waits for its own next beat and anchors a few seconds later.
 */
export function shouldAnchorSymbol(
  buy: number | undefined,
  sell: number | undefined,
  now: Date = new Date()
): boolean {
  return isBaselineAnchorable(now) && isUsableBaseline(buy, sell);
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
