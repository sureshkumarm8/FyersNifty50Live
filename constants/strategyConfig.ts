/**
 * STRATEGY CONFIGURATION LOADER & VERSION TRACKER
 * Hash-stamped frozen strategy parameters (Milestone M7)
 */

import strategyV1 from '../config/strategy.v1.json';

export const CONFIG_VERSION = 'v1-bd5a65d2';

export interface StrategyConfig {
  name: string;
  schemaVersion: string;
  frozenAt: string;
  sniper: {
    downloadStart: string;
    entryStart: string;
    reviewBy: string;
    trailStart: string;
    hardStop: string;
    standDown: string;
    targetPoints: number;
    stopPoints: number;
    itmPoints: number;
    strikeStep: number;
    minEngineConfidence: number;
    zoneBuffer: number;
    minZoneWidth: number;
    comfortableZoneWidth: number;
    rangePadFraction: number;
  };
  momentum: {
    minConfidence: number;
    minPathEfficiency: number;
    cooldownMinutes: number;
    lossCooldownMinutes: number;
    maxDailyTrades: number;
    maxConsecutiveLosses: number;
    maxDailyLoss: number;
    minNetRiskReward: number;
    confirmationMinutes: number;
    maxSnapshotAgeMs: number;
    maxVisionAgeMs: number;
  };
  risk: {
    maxLots: number;
    defaultLots: number;
    spreadSlippagePoints: number;
    syntheticFallbackFlag: boolean;
  };
}

export const ACTIVE_STRATEGY: StrategyConfig = strategyV1 as StrategyConfig;

/**
 * Calculates realistic paper fills at live option LTP ± half spread from the feed.
 * Falls back to estimateOptionPremium only when quotes are absent, tagging synthetic: true.
 */
export function getRealisticFillPrice(
  quote: { ltp?: number; buyPrice?: number; sellPrice?: number; bid?: number; ask?: number } | null | undefined,
  side: 'BUY' | 'SELL',
  fallbackPrice: number
): { fillPrice: number; synthetic: boolean; spread: number } {
  if (!quote || typeof quote.ltp !== 'number' || quote.ltp <= 0) {
    return {
      fillPrice: fallbackPrice,
      synthetic: true,
      spread: 0
    };
  }

  const bid = quote.buyPrice ?? quote.bid ?? 0;
  const ask = quote.sellPrice ?? quote.ask ?? 0;

  if (bid > 0 && ask > 0 && ask >= bid) {
    const spread = ask - bid;
    const fillPrice = side === 'BUY' ? ask : bid;
    return {
      fillPrice: Math.round(fillPrice * 100) / 100,
      synthetic: false,
      spread
    };
  }

  // If bid/ask not provided individually but ltp exists, apply realistic half-spread slippage (default 0.5 pt)
  const defaultSpread = 0.5;
  const slippage = side === 'BUY' ? defaultSpread / 2 : -(defaultSpread / 2);
  const fillPrice = Math.max(0.05, quote.ltp + slippage);

  return {
    fillPrice: Math.round(fillPrice * 100) / 100,
    synthetic: false,
    spread: defaultSpread
  };
}
