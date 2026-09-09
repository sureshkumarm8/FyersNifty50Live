/**
 * OPTION PREMIUM ESTIMATE — for paper fills only.
 *
 * Paper trades are placed as MARKET orders, which carry no price, and neither
 * AutoTrade panel subscribes to option quotes. Without an entry premium the
 * simulated position fills at zero and every percentage P&L becomes infinite,
 * so a paper trade would "hit target" the instant it opened.
 *
 * This is a deliberately simple approximation, not a pricing model: intrinsic
 * value plus an extrinsic bump that is largest at the money and decays as the
 * strike moves away. It is calibrated for near-expiry weekly Nifty options and
 * exists purely so simulated P&L moves in a believable range. It must never be
 * used for anything involving real money.
 */

/** Typical at-the-money extrinsic value, in points, for a weekly Nifty option. */
const ATM_EXTRINSIC = 80;

/** Controls how quickly extrinsic value falls away from the money. */
const DECAY_POINTS = 250;

export function estimateOptionPremium(
  spot: number,
  strike: number,
  optionType: 'CE' | 'PE'
): number {
  if (!isFinite(spot) || !isFinite(strike) || spot <= 0) return ATM_EXTRINSIC;

  const intrinsic =
    optionType === 'CE' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);

  const moneyness = Math.abs(spot - strike) / DECAY_POINTS;
  const extrinsic = ATM_EXTRINSIC * Math.exp(-(moneyness * moneyness));

  // A premium can never be zero or negative, however deep the strike sits.
  return Math.max(1, Math.round((intrinsic + extrinsic) * 20) / 20);
}
