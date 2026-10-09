/**
 * DYNAMIC SMART TRAILING STOP ENGINE (BREAKEVEN + CHANDELIER)
 * -----------------------------------------------------------
 * Protects winning option positions by locking in gains as premium expands.
 *
 * Mechanics:
 * 1. Breakeven Lock:
 *    When option premium gains >= breakevenTriggerPct (default +12%),
 *    Stop Loss is automatically ratcheted up to Entry Cost + 1.5%.
 *    This converts the trade into a completely risk-free runner.
 *
 * 2. Trailing Ratchet:
 *    As premium continues climbing, Stop Loss trails behind peak premium
 *    at (Peak - trailOffsetPct).
 *    Crucially, Stop Loss is monotonic: it only ratchets UP, NEVER down.
 *
 * 3. Guaranteed Exit:
 *    If market pulls back and premium crosses <= currentTrailingStop,
 *    position immediately exits with profit banked.
 */

export interface TrailingStopConfig {
  enableTrailing: boolean;
  /** % gain on premium required to activate breakeven lock (default: 12%) */
  breakevenTriggerPct: number;
  /** % trailing distance behind the peak high-water premium (default: 8%) */
  trailOffsetPct: number;
  /** % profit buffer to lock above cost on breakeven (default: 1.5%) */
  breakevenBufferPct?: number;
}

export interface TrailingStopState {
  highWaterPremium: number;
  breakevenLocked: boolean;
  currentTrailingStop: number | null;
}

export const DEFAULT_TRAILING_CONFIG: TrailingStopConfig = {
  enableTrailing: true,
  breakevenTriggerPct: 12,
  trailOffsetPct: 8,
  breakevenBufferPct: 1.5
};

export function initTrailingState(entryPrice: number): TrailingStopState {
  return {
    highWaterPremium: Math.max(0, entryPrice),
    breakevenLocked: false,
    currentTrailingStop: null
  };
}

/**
 * Updates the trailing stop state based on the latest premium mark.
 * Pure function: never mutates arguments.
 */
export function evaluateTrailingStop(
  avgPrice: number,
  currentPremium: number,
  prevState: TrailingStopState,
  config: TrailingStopConfig = DEFAULT_TRAILING_CONFIG
): TrailingStopState {
  if (!config.enableTrailing || avgPrice <= 0) {
    return {
      highWaterPremium: Math.max(prevState.highWaterPremium, currentPremium),
      breakevenLocked: prevState.breakevenLocked,
      currentTrailingStop: prevState.currentTrailingStop
    };
  }

  const peak = Math.max(prevState.highWaterPremium || avgPrice, currentPremium);
  const gainFromEntryPct = ((peak - avgPrice) / avgPrice) * 100;

  let breakevenLocked = prevState.breakevenLocked;
  let nextTrailingStop = prevState.currentTrailingStop;

  const beBuffer = config.breakevenBufferPct ?? 1.5;

  if (gainFromEntryPct >= config.breakevenTriggerPct) {
    breakevenLocked = true;
    const beStop = avgPrice * (1 + beBuffer / 100);
    const trailStop = peak * (1 - config.trailOffsetPct / 100);
    const calculatedStop = Math.max(beStop, trailStop);

    // Stop loss can only ratchet UP, never down
    nextTrailingStop = nextTrailingStop !== null
      ? Math.max(nextTrailingStop, calculatedStop)
      : calculatedStop;
  }

  return {
    highWaterPremium: peak,
    breakevenLocked,
    currentTrailingStop: nextTrailingStop
  };
}

/**
 * Checks if current premium has breached the trailing stop.
 */
export function isTrailingStopTriggered(
  currentPremium: number,
  state: TrailingStopState
): boolean {
  if (!state.currentTrailingStop || state.currentTrailingStop <= 0) {
    return false;
  }
  return currentPremium <= state.currentTrailingStop;
}
