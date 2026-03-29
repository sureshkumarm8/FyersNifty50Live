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

    // Momentum calculations
    const momentum_1m = ((latest.niftyLtp - prev1.niftyLtp) / prev1.niftyLtp) * 100;
    const momentum_5m = ((latest.niftyLtp - prev5.niftyLtp) / prev5.niftyLtp) * 100;

    // Volatility (standard deviation of returns)
    const volatility = this.calculateVolatility(historyLog.slice(-20));

    // Volume ratio (current vs average)
    const avgVolume = historyLog.slice(-20).reduce((sum, s) => sum + (s.volumeTrend || 0), 0) / 20;
    const volumeRatio = avgVolume > 0 ? ((latest.volumeTrend || 0) / avgVolume) : 1;

    // Order flow imbalance (from bid/ask quantities)
    const orderFlowImbalance = this.calculateOrderFlowImbalance(stocks);

    // Distance from pivots
    const pivotDistance = pivots ? this.calculatePivotDistance(niftyLtp, pivots) : 0;

    return {
      momentum_1m,
      momentum_5m,
      volatility,
      volumeRatio,
      orderFlowImbalance,
      pivotDistance
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
   */
  private calculateConfidence(metrics: SignalMetrics): number {
    let score = 50; // Base confidence

    // Momentum alignment (1m and 5m in same direction)
    if (metrics.momentum_1m * metrics.momentum_5m > 0) {
      score += 15;
    }

    // Strong momentum
    if (Math.abs(metrics.momentum_5m) > 0.3) {
      score += 10;
    }

    // Volume confirmation
    if (metrics.volumeRatio > 1.2) {
      score += 10;
    }

    // Order flow alignment
    if (Math.abs(metrics.orderFlowImbalance) > 5) {
      score += 10;
    }

    // Low volatility (more predictable)
    if (metrics.volatility < 15) {
      score += 5;
    }

    // Near pivot level (higher probability reversal)
    if (metrics.pivotDistance < 0.5) {
      score += 10;
    }

    return Math.min(95, Math.max(10, score));
  }

  /**
   * STRENGTH SCORE (-100 to +100)
   */
  private calculateStrength(metrics: SignalMetrics): number {
    let strength = 0;

    // Momentum contribution (40%)
    strength += metrics.momentum_5m * 8;

    // Order flow contribution (30%)
    strength += metrics.orderFlowImbalance * 0.3;

    // Volume contribution (20%)
    strength += (metrics.volumeRatio - 1) * 20;

    // Volatility penalty (10%)
    if (metrics.volatility > 20) {
      strength -= 10;
    }

    return Math.max(-100, Math.min(100, strength));
  }

  /**
   * GENERATE HUMAN-READABLE REASONS
   */
  private generateReasons(metrics: SignalMetrics, direction: string): string[] {
    const reasons: string[] = [];

    if (Math.abs(metrics.momentum_5m) > 0.3) {
      reasons.push(`Strong ${direction === 'LONG' ? 'bullish' : 'bearish'} momentum (${metrics.momentum_5m.toFixed(2)}%)`);
    }

    if (metrics.volumeRatio > 1.3) {
      reasons.push(`Above average volume (${(metrics.volumeRatio * 100).toFixed(0)}%)`);
    }

    if (Math.abs(metrics.orderFlowImbalance) > 10) {
      const side = metrics.orderFlowImbalance > 0 ? 'Buy' : 'Sell';
      reasons.push(`${side} pressure in order flow (${metrics.orderFlowImbalance.toFixed(1)}%)`);
    }

    if (metrics.pivotDistance < 0.5) {
      reasons.push(`Near key pivot level`);
    }

    if (metrics.volatility > 25) {
      reasons.push(`⚠️ High volatility (${metrics.volatility.toFixed(1)}%)`);
    }

    return reasons.length > 0 ? reasons : ['No strong confluence'];
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
      pivotDistance: 0
    };
  }
}
