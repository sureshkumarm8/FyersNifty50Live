/**
 * PROFESSIONAL TRADING ENGINE
 * Core algorithmic trading system with institutional-grade features
 */

import { EnrichedFyersQuote, MarketSnapshot, PivotPoints } from '../types';

// ==================== TYPES ====================

export interface TradingSignal {
  type: 'ENTRY' | 'EXIT' | 'HOLD';
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100
  strength: number; // -100 to +100
  timeframe: '1m' | '5m' | '15m' | '1h';
  timestamp: number;
  reasons: string[];
  metrics: SignalMetrics;
}

export interface SignalMetrics {
  momentum_1m: number;
  momentum_5m: number;
  volatility: number;
  volumeRatio: number;
  orderFlowImbalance: number;
  pivotDistance: number;
  ivRank?: number;
  deltaExposure?: number;
  // Enriched from MarketSnapshot data
  optionsSentiment?: number; // Call vs Put sentiment
  pcr?: number; // Put-Call Ratio
  breadthRatio?: number; // Advance/Decline ratio
  stockSentiment?: number; // Stock buy/sell pressure
}

export interface TradeSetup {
  signal: TradingSignal;
  instrument: InstrumentDetails;
  entry: OrderDetails;
  stopLoss: OrderDetails;
  target: OrderDetails[];
  riskReward: number;
  positionSize: number;
  maxLoss: number;
  expectedProfit: number;
}

export interface InstrumentDetails {
  symbol: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  expiry: string;
  underlyingLtp: number;
  optionLtp?: number;
  delta?: number;
  theta?: number;
  iv?: number;
  oi?: number;
}

export interface OrderDetails {
  price: number;
  type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  quantity: number;
  timestamp?: number;
}

export interface RiskLimits {
  maxCapitalPerTrade: number; // % of total capital
  maxDailyLoss: number; // Absolute amount
  maxDrawdown: number; // % from peak
  maxPositions: number;
  minRiskReward: number;
  maxLeverage: number;
}

// ==================== TRADING ENGINE CLASS ====================

export class TradingEngine {
  private riskLimits: RiskLimits;
  private dailyLoss: number = 0;
  private peakEquity: number = 0;
  private currentEquity: number = 0;
  private activePositions: number = 0;

  constructor(
    initialCapital: number,
    riskLimits?: Partial<RiskLimits>
  ) {
    this.currentEquity = initialCapital;
    this.peakEquity = initialCapital;
    
    this.riskLimits = {
      maxCapitalPerTrade: riskLimits?.maxCapitalPerTrade || 2, // 2% per trade
      maxDailyLoss: riskLimits?.maxDailyLoss || initialCapital * 0.03, // 3% daily
      maxDrawdown: riskLimits?.maxDrawdown || 10, // 10% drawdown
      maxPositions: riskLimits?.maxPositions || 2,
      minRiskReward: riskLimits?.minRiskReward || 1.5,
      maxLeverage: riskLimits?.maxLeverage || 3
    };
  }

  /**
   * MULTI-TIMEFRAME SIGNAL GENERATION
   */
  public generateSignal(
    niftyLtp: number,
    historyLog: MarketSnapshot[],
    stocks: EnrichedFyersQuote[],
    pivots?: PivotPoints | null
  ): TradingSignal {
    const metrics = this.calculateMetrics(niftyLtp, historyLog, stocks, pivots);
    const confidence = this.calculateConfidence(metrics);
    const strength = this.calculateStrength(metrics);
    const direction = strength > 15 ? 'LONG' : strength < -15 ? 'SHORT' : 'NEUTRAL';
    const reasons = this.generateReasons(metrics, direction);

    return {
      type: direction !== 'NEUTRAL' && confidence > 70 ? 'ENTRY' : 'HOLD',
      direction,
      confidence,
      strength,
      timeframe: '5m',
      timestamp: Date.now(),
      reasons,
      metrics
    };
  }

  /**
   * CALCULATE COMPREHENSIVE METRICS
   * Uses ALL available market data from historyLog
   */
  private calculateMetrics(
    niftyLtp: number,
    historyLog: MarketSnapshot[],
    stocks: EnrichedFyersQuote[],
    pivots?: PivotPoints | null
  ): SignalMetrics {
    const len = historyLog.length;
    if (len < 15) {
      return this.getDefaultMetrics();
    }

    const latest = historyLog[len - 1];
    const prev1 = historyLog[Math.max(0, len - 2)];
    const prev5 = historyLog[Math.max(0, len - 6)];
    const prev15 = historyLog[Math.max(0, len - 16)];

    // === MOMENTUM ANALYSIS ===
    const momentum_1m = ((latest.niftyLtp - prev1.niftyLtp) / prev1.niftyLtp) * 100;
    const momentum_5m = ((latest.niftyLtp - prev5.niftyLtp) / prev5.niftyLtp) * 100;

    // === VOLATILITY (Realized Vol) ===
    const volatility = this.calculateVolatility(historyLog.slice(-20));

    // === VOLUME ANALYSIS (Using actual snapshot data) ===
    const recentVolumes = historyLog.slice(-20).map(s => 
      (s.callsBuyQty || 0) + (s.callsSellQty || 0) + (s.putsBuyQty || 0) + (s.putsSellQty || 0)
    );
    const avgVolume = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
    const currentVolume = (latest.callsBuyQty || 0) + (latest.callsSellQty || 0) + 
                          (latest.putsBuyQty || 0) + (latest.putsSellQty || 0);
    const volumeRatio = avgVolume > 0 ? (currentVolume / avgVolume) : 1;

    // === ORDER FLOW IMBALANCE (Using stock bid/ask data) ===
    const orderFlowImbalance = this.calculateOrderFlowImbalance(stocks);

    // === OPTIONS SENTIMENT (Call vs Put sentiment) ===
    const optionsSentiment = latest.optionsSent || 0; // (callSent - putSent)
    
    // === PCR ANALYSIS ===
    const pcr = latest.pcr || 1;
    const pcrSignal = pcr > 1.2 ? 10 : pcr < 0.8 ? -10 : 0; // PCR contribution
    
    // === BREADTH ANALYSIS (Advance/Decline) ===
    const breadthRatio = latest.adv > 0 ? (latest.adv - latest.dec) / (latest.adv + latest.dec) : 0;
    const breadthStrength = breadthRatio * 100; // -100 to +100

    // === STOCK SENTIMENT ===
    const stockSentiment = latest.stockSent || 0; // (Buy-Sell)/Sell %

    // === PIVOT DISTANCE ===
    const pivotDistance = pivots ? this.calculatePivotDistance(niftyLtp, pivots) : 0;

    return {
      momentum_1m,
      momentum_5m,
      volatility,
      volumeRatio,
      orderFlowImbalance,
      pivotDistance,
      // Additional enrichment using snapshot data
      optionsSentiment,
      pcr,
      breadthRatio,
      stockSentiment
    };
  }

  /**
   * VOLATILITY CALCULATION (Realized Volatility)
   */
  private calculateVolatility(history: MarketSnapshot[]): number {
    if (history.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < history.length; i++) {
      const ret = Math.log(history[i].niftyLtp / history[i - 1].niftyLtp);
      returns.push(ret);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Annualized volatility (assuming 252 trading days, 375 minutes per day)
    return stdDev * Math.sqrt(375) * 100;
  }

  /**
   * ORDER FLOW IMBALANCE
   * Positive = More buyers, Negative = More sellers
   */
  private calculateOrderFlowImbalance(stocks: EnrichedFyersQuote[]): number {
    if (stocks.length === 0) return 0;

    const imbalances = stocks.map(s => {
      const bidQty = s.total_buy_qty || 0;
      const askQty = s.total_sell_qty || 0;
      const total = bidQty + askQty;
      return total > 0 ? ((bidQty - askQty) / total) * 100 : 0;
    });

    // Weighted average by stock weightage
    const weightedImbalance = stocks.reduce((sum, s, i) => {
      const weight = s.weight || (1 / stocks.length);
      return sum + (imbalances[i] * weight);
    }, 0);

    return weightedImbalance;
  }

  /**
   * PIVOT DISTANCE CALCULATION
   */
  private calculatePivotDistance(ltp: number, pivots: PivotPoints): number {
    const { pivot, r1, s1, r2, s2 } = pivots;

    // Calculate distance as % from nearest level
    const distances = [
      Math.abs(ltp - pivot),
      Math.abs(ltp - r1),
      Math.abs(ltp - s1),
      Math.abs(ltp - r2),
      Math.abs(ltp - s2)
    ];

    const minDistance = Math.min(...distances);
    return (minDistance / ltp) * 100; // Return as percentage
  }

  /**
   * CONFIDENCE SCORE CALCULATION
   * Enhanced to use ALL market snapshot data
   */
  private calculateConfidence(metrics: SignalMetrics): number {
    let score = 50; // Base confidence

    // === MOMENTUM ALIGNMENT (1m and 5m in same direction) ===
    if (metrics.momentum_1m * metrics.momentum_5m > 0) {
      score += 10;
      // Bonus if both strong
      if (Math.abs(metrics.momentum_1m) > 0.2 && Math.abs(metrics.momentum_5m) > 0.2) {
        score += 5;
      }
    }

    // === STRONG MOMENTUM ===
    if (Math.abs(metrics.momentum_5m) > 0.3) {
      score += 10;
    }

    // === VOLUME CONFIRMATION ===
    if (metrics.volumeRatio > 1.2) {
      score += 8;
    }
    // Exceptional volume
    if (metrics.volumeRatio > 1.5) {
      score += 5;
    }

    // === ORDER FLOW ALIGNMENT ===
    if (Math.abs(metrics.orderFlowImbalance) > 5) {
      score += 8;
    }
    // Strong order flow
    if (Math.abs(metrics.orderFlowImbalance) > 10) {
      score += 4;
    }

    // === OPTIONS SENTIMENT (Call vs Put) ===
    if (metrics.optionsSentiment !== undefined) {
      if (Math.abs(metrics.optionsSentiment) > 20) {
        score += 8; // Strong options positioning
      }
      if (Math.abs(metrics.optionsSentiment) > 40) {
        score += 4; // Exceptional options flow
      }
    }

    // === PCR CONFIRMATION ===
    if (metrics.pcr !== undefined) {
      // Bullish: High PCR (>1.2) suggests put buying = support
      // Bearish: Low PCR (<0.8) suggests call buying = resistance
      if (metrics.pcr > 1.2 || metrics.pcr < 0.8) {
        score += 6;
      }
    }

    // === BREADTH CONFIRMATION ===
    if (metrics.breadthRatio !== undefined) {
      // Strong breadth (>0.3) confirms momentum
      if (Math.abs(metrics.breadthRatio) > 0.3) {
        score += 6;
      }
      // Exceptional breadth (>0.5)
      if (Math.abs(metrics.breadthRatio) > 0.5) {
        score += 4;
      }
    }

    // === STOCK SENTIMENT ===
    if (metrics.stockSentiment !== undefined) {
      // Strong buying/selling in underlying stocks
      if (Math.abs(metrics.stockSentiment) > 10) {
        score += 5;
      }
    }

    // === LOW VOLATILITY (more predictable) ===
    if (metrics.volatility < 15) {
      score += 5;
    }
    // Penalize high volatility
    if (metrics.volatility > 30) {
      score -= 5;
    }

    // === NEAR PIVOT LEVEL (higher probability reversal) ===
    if (metrics.pivotDistance < 0.5) {
      score += 8;
    }

    return Math.min(95, Math.max(10, score));
  }

  /**
   * STRENGTH SCORE (-100 to +100)
   * Enhanced with multi-factor data
   */
  private calculateStrength(metrics: SignalMetrics): number {
    let strength = 0;

    // === MOMENTUM CONTRIBUTION (35%) ===
    strength += metrics.momentum_5m * 7; // 5-min trend
    strength += metrics.momentum_1m * 3.5; // 1-min momentum

    // === ORDER FLOW CONTRIBUTION (25%) ===
    strength += metrics.orderFlowImbalance * 0.25;

    // === OPTIONS SENTIMENT (20%) ===
    if (metrics.optionsSentiment !== undefined) {
      strength += metrics.optionsSentiment * 0.2;
    }

    // === STOCK SENTIMENT (10%) ===
    if (metrics.stockSentiment !== undefined) {
      strength += metrics.stockSentiment * 0.1;
    }

    // === BREADTH CONTRIBUTION (10%) ===
    if (metrics.breadthRatio !== undefined) {
      strength += metrics.breadthRatio * 10;
    }

    // === PCR ADJUSTMENT ===
    if (metrics.pcr !== undefined) {
      // High PCR (>1.2) = Bullish support
      // Low PCR (<0.8) = Bearish resistance
      if (metrics.pcr > 1.2) strength += 5;
      if (metrics.pcr < 0.8) strength -= 5;
    }

    // === VOLATILITY PENALTY ===
    if (metrics.volatility > 25) {
      strength -= 10;
    } else if (metrics.volatility > 20) {
      strength -= 5;
    }

    return Math.max(-100, Math.min(100, strength));
  }

  /**
   * GENERATE HUMAN-READABLE REASONS
   * Enhanced with ALL market data insights
   */
  private generateReasons(metrics: SignalMetrics, direction: string): string[] {
    const reasons: string[] = [];

    // === MOMENTUM ===
    if (Math.abs(metrics.momentum_5m) > 0.3) {
      reasons.push(`Strong ${direction === 'LONG' ? 'bullish' : 'bearish'} momentum (${metrics.momentum_5m.toFixed(2)}%)`);
    }
    
    if (metrics.momentum_1m * metrics.momentum_5m > 0 && Math.abs(metrics.momentum_1m) > 0.2) {
      reasons.push(`1m & 5m momentum aligned (${metrics.momentum_1m.toFixed(2)}%, ${metrics.momentum_5m.toFixed(2)}%)`);
    }

    // === VOLUME ===
    if (metrics.volumeRatio > 1.3) {
      reasons.push(`High volume: ${(metrics.volumeRatio * 100).toFixed(0)}% of average`);
    }

    // === ORDER FLOW ===
    if (Math.abs(metrics.orderFlowImbalance) > 10) {
      const side = metrics.orderFlowImbalance > 0 ? 'Buy' : 'Sell';
      reasons.push(`${side} pressure in order flow (${metrics.orderFlowImbalance.toFixed(1)}%)`);
    }

    // === OPTIONS DATA ===
    if (metrics.optionsSentiment !== undefined && Math.abs(metrics.optionsSentiment) > 25) {
      const bias = metrics.optionsSentiment > 0 ? 'Call' : 'Put';
      reasons.push(`Strong ${bias} buildup in options (${metrics.optionsSentiment.toFixed(1)}%)`);
    }

    // === PCR ===
    if (metrics.pcr !== undefined) {
      if (metrics.pcr > 1.2) {
        reasons.push(`High PCR (${metrics.pcr.toFixed(2)}) suggests put protection`);
      } else if (metrics.pcr < 0.8) {
        reasons.push(`Low PCR (${metrics.pcr.toFixed(2)}) suggests call buildup`);
      }
    }

    // === BREADTH ===
    if (metrics.breadthRatio !== undefined && Math.abs(metrics.breadthRatio) > 0.4) {
      const breadthDir = metrics.breadthRatio > 0 ? 'Bullish' : 'Bearish';
      reasons.push(`${breadthDir} breadth: ${(metrics.breadthRatio * 100).toFixed(0)}% stocks participating`);
    }

    // === STOCK SENTIMENT ===
    if (metrics.stockSentiment !== undefined && Math.abs(metrics.stockSentiment) > 15) {
      const sentDir = metrics.stockSentiment > 0 ? 'Buying' : 'Selling';
      reasons.push(`${sentDir} pressure in Nifty 50 stocks (${metrics.stockSentiment.toFixed(1)}%)`);
    }

    // === PIVOT LEVELS ===
    if (metrics.pivotDistance < 0.5) {
      reasons.push(`Near key pivot level (${metrics.pivotDistance.toFixed(2)}% away)`);
    }

    // === VOLATILITY ===
    if (metrics.volatility > 25) {
      reasons.push(`⚠️ High volatility environment (${metrics.volatility.toFixed(1)}%)`);
    } else if (metrics.volatility < 12) {
      reasons.push(`Low volatility - favorable for directional trades`);
    }

    return reasons.length > 0 ? reasons : ['Weak confluence - no clear setup'];
  }

  /**
   * POSITION SIZING (Kelly Criterion)
   */
  public calculatePositionSize(
    signal: TradingSignal,
    entryPrice: number,
    stopLossPrice: number,
    winRate: number = 0.55,
    avgWinLoss: number = 1.5
  ): number {
    // Risk per trade (fixed % of capital)
    const riskAmount = this.currentEquity * (this.riskLimits.maxCapitalPerTrade / 100);
    
    // Points risked
    const pointsRisk = Math.abs(entryPrice - stopLossPrice);
    
    // Quantity calculation
    const quantity = Math.floor(riskAmount / pointsRisk);

    // Apply Kelly Criterion for optimal sizing
    const kellyPercent = ((winRate * avgWinLoss) - (1 - winRate)) / avgWinLoss;
    const kellyFactor = Math.max(0.1, Math.min(kellyPercent, 0.25)); // Cap at 25%

    const finalQuantity = Math.max(1, Math.floor(quantity * kellyFactor));

    return finalQuantity;
  }

  /**
   * VALIDATE TRADE AGAINST RISK LIMITS
   */
  public validateTrade(setup: TradeSetup): { valid: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check daily loss limit
    if (this.dailyLoss >= this.riskLimits.maxDailyLoss) {
      reasons.push(`Daily loss limit reached (₹${this.dailyLoss.toFixed(2)})`);
    }

    // Check drawdown
    const currentDrawdown = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;
    if (currentDrawdown >= this.riskLimits.maxDrawdown) {
      reasons.push(`Max drawdown exceeded (${currentDrawdown.toFixed(2)}%)`);
    }

    // Check max positions
    if (this.activePositions >= this.riskLimits.maxPositions) {
      reasons.push(`Maximum positions limit reached (${this.activePositions})`);
    }

    // Check risk/reward
    if (setup.riskReward < this.riskLimits.minRiskReward) {
      reasons.push(`Poor risk/reward ratio (${setup.riskReward.toFixed(2)})`);
    }

    // Check confidence
    if (setup.signal.confidence < 70) {
      reasons.push(`Low confidence signal (${setup.signal.confidence}%)`);
    }

    return {
      valid: reasons.length === 0,
      reasons
    };
  }

  /**
   * UPDATE EQUITY & METRICS
   */
  public updateEquity(pnl: number) {
    this.currentEquity += pnl;
    
    if (pnl < 0) {
      this.dailyLoss += Math.abs(pnl);
    }

    if (this.currentEquity > this.peakEquity) {
      this.peakEquity = this.currentEquity;
    }
  }

  /**
   * RESET DAILY METRICS
   */
  public resetDailyMetrics() {
    this.dailyLoss = 0;
  }

  /**
   * GET CURRENT STATUS
   */
  public getStatus() {
    const currentDrawdown = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;
    
    return {
      currentEquity: this.currentEquity,
      peakEquity: this.peakEquity,
      dailyLoss: this.dailyLoss,
      currentDrawdown,
      activePositions: this.activePositions,
      riskLimits: this.riskLimits,
      canTrade: this.dailyLoss < this.riskLimits.maxDailyLoss && 
                currentDrawdown < this.riskLimits.maxDrawdown &&
                this.activePositions < this.riskLimits.maxPositions
    };
  }

  private getDefaultMetrics(): SignalMetrics {
    return {
      momentum_1m: 0,
      momentum_5m: 0,
      volatility: 0,
      volumeRatio: 1,
      orderFlowImbalance: 0,
      pivotDistance: 0,
      optionsSentiment: 0,
      pcr: 1,
      breadthRatio: 0,
      stockSentiment: 0
    };
  }
}
