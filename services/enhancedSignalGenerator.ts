/**
 * ENHANCED SIGNAL GENERATOR
 * Uses live historical data for better decision making
 * Analyzes trend, momentum, sentiment, and options flow
 */

import { MarketSnapshot } from '../types';

export interface EnhancedSignalMetrics {
  // Trend Analysis
  trend15m: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendStrength: number; // 0-100
  priceVelocity: number; // Points/minute
  
  // Sentiment Analysis
  broadSentiment: number; // -100 to +100 (overallSent)
  callPutRatio: number;
  optionFlow: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  optionFlowStrength: number; // 0-100
  
  // Momentum Indicators
  momentumScore: number; // -100 to +100
  accelerationRatio: number; // Change in velocity
  
  // Options Intelligence
  callBuyPressure: number; // -100 to +100
  putBuyPressure: number;
  oiExpanding: boolean; // True if OI increasing
  
  // Support/Resistance Detection
  support: number;
  resistance: number;
  
  // Volatility
  volatility: number; // % change over period
  volatilityTrend: 'EXPANDING' | 'CONTRACTING' | 'STABLE';
  
  // Confidence Score
  overallConfidence: number; // 0-100
  signalStrength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface EnhancedSignal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100
  metrics: EnhancedSignalMetrics;
  reasons: string[];
  timeframe: string;
  suggestedEntry: number;
  suggestedTarget: number;
  suggestedStopLoss: number;
  riskRewardRatio: number;
}

export class EnhancedSignalGenerator {
  /**
   * Generate enhanced signal using live historical data
   */
  static generateSignal(
    historyLog: MarketSnapshot[],
    pivotSupport: number,
    pivotResistance: number,
    currentNiftyLtp: number
  ): EnhancedSignal {
    if (historyLog.length < 5) {
      return {
        direction: 'NEUTRAL',
        confidence: 0,
        metrics: this.getEmptyMetrics(),
        reasons: ['Insufficient data'],
        timeframe: '5-minute',
        suggestedEntry: currentNiftyLtp,
        suggestedTarget: currentNiftyLtp,
        suggestedStopLoss: currentNiftyLtp,
        riskRewardRatio: 0,
      };
    }

    // Analyze different aspects
    const trendAnalysis = this.analyzeTrend(historyLog);
    const sentimentAnalysis = this.analyzeSentiment(historyLog);
    const momentumAnalysis = this.analyzeMomentum(historyLog);
    const optionsAnalysis = this.analyzeOptions(historyLog);
    const volatilityAnalysis = this.analyzeVolatility(historyLog);

    // Calculate support/resistance from history
    const srLevels = this.calculateSRLevels(historyLog, pivotSupport, pivotResistance);

    // Combine all signals
    const metrics: EnhancedSignalMetrics = {
      ...trendAnalysis,
      ...sentimentAnalysis,
      ...momentumAnalysis,
      ...optionsAnalysis,
      ...volatilityAnalysis,
      support: srLevels.support,
      resistance: srLevels.resistance,
      overallConfidence: 0, // Will calculate below
      signalStrength: 'WEAK',
    };

    // Generate direction and confidence
    const signalDecision = this.makeSignalDecision(metrics, currentNiftyLtp, srLevels);
    
    // Generate specific entry, target, stop levels
    const levels = this.calculateTradeLevels(
      signalDecision,
      currentNiftyLtp,
      srLevels,
      metrics
    );

    metrics.overallConfidence = signalDecision.confidence;
    metrics.signalStrength = this.getSignalStrength(signalDecision.confidence);

    return {
      direction: signalDecision.direction,
      confidence: signalDecision.confidence,
      metrics,
      reasons: signalDecision.reasons,
      timeframe: '5-minute',
      suggestedEntry: levels.entry,
      suggestedTarget: levels.target,
      suggestedStopLoss: levels.stopLoss,
      riskRewardRatio: Math.abs((levels.target - levels.entry) / (levels.entry - levels.stopLoss)),
    };
  }

  /**
   * Analyze 15-minute trend from historical data
   */
  private static analyzeTrend(historyLog: MarketSnapshot[]) {
    if (historyLog.length < 3) {
      return {
        trend15m: 'NEUTRAL' as const,
        trendStrength: 0,
        priceVelocity: 0,
      };
    }

    // Get last 3 candles for trend (15 minutes of data)
    const recent = historyLog.slice(0, 3).reverse(); // Most recent first
    const prices = recent.map(h => h.niftyLtp);
    
    // Calculate price changes
    const change1 = prices[1] - prices[0];
    const change2 = prices[2] - prices[1];
    const totalChange = prices[2] - prices[0];

    // Calculate velocity (points per minute, assuming 5-min candles)
    const priceVelocity = totalChange / 10; // Over 10 minutes

    // Determine trend
    let trend15m: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let trendStrength = 0;

    if (totalChange > 10) {
      trend15m = 'BULLISH';
      trendStrength = Math.min(100, Math.abs(totalChange) / 2); // 10pts = 50 strength
    } else if (totalChange < -10) {
      trend15m = 'BEARISH';
      trendStrength = Math.min(100, Math.abs(totalChange) / 2);
    } else {
      trendStrength = 20; // Consolidation
    }

    return {
      trend15m,
      trendStrength,
      priceVelocity,
    };
  }

  /**
   * Analyze sentiment from advanced indicators
   */
  private static analyzeSentiment(historyLog: MarketSnapshot[]) {
    const latest = historyLog[0];
    const prev = historyLog[1];

    // Broad market sentiment (-100 to +100)
    const broadSentiment = latest.overallSent || 0;
    
    // Call-Put Ratio (higher = more bullish)
    const callPutRatio = latest.pcr ? 1 / latest.pcr : 0;
    
    // Option sentiment
    const optionFlow = latest.optionsSent || 0; // (Call Sent - Put Sent)
    let optionFlowDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let optionFlowStrength = Math.abs(optionFlow);

    if (optionFlow > 10) {
      optionFlowDirection = 'BULLISH';
      optionFlowStrength = Math.min(100, optionFlow);
    } else if (optionFlow < -10) {
      optionFlowDirection = 'BEARISH';
      optionFlowStrength = Math.min(100, Math.abs(optionFlow));
    }

    // Call buy pressure vs Put buy pressure
    const totalCallFlow = (latest.callsBuyQty || 0) + (latest.callsSellQty || 0) || 1;
    const totalPutFlow = (latest.putsBuyQty || 0) + (latest.putsSellQty || 0) || 1;
    
    const callBuyPressure = ((latest.callsBuyQty || 0) - (latest.callsSellQty || 0)) / totalCallFlow * 100;
    const putBuyPressure = ((latest.putsBuyQty || 0) - (latest.putsSellQty || 0)) / totalPutFlow * 100;

    return {
      broadSentiment,
      callPutRatio,
      optionFlow: optionFlowDirection,
      optionFlowStrength,
      callBuyPressure: Math.min(100, Math.max(-100, callBuyPressure)),
      putBuyPressure: Math.min(100, Math.max(-100, putBuyPressure)),
    };
  }

  /**
   * Analyze momentum from price changes and velocity
   */
  private static analyzeMomentum(historyLog: MarketSnapshot[]) {
    if (historyLog.length < 2) {
      return {
        momentumScore: 0,
        accelerationRatio: 0,
      };
    }

    // Calculate momentum score based on recent price changes
    const recent = historyLog.slice(0, 5).reverse();
    let momentumScore = 0;
    let accelerationRatio = 0;

    if (recent.length >= 2) {
      const velocities: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        velocities.push(recent[i].niftyLtp - recent[i - 1].niftyLtp);
      }

      // Momentum = average velocity
      momentumScore = (velocities.reduce((a, b) => a + b, 0) / velocities.length) * 10;
      momentumScore = Math.min(100, Math.max(-100, momentumScore));

      // Acceleration = change in velocity
      if (velocities.length >= 2) {
        const accelChange = velocities[velocities.length - 1] - velocities[0];
        accelerationRatio = accelChange > 0 ? 50 : -50; // Simplified
      }
    }

    return {
      momentumScore: Math.min(100, Math.max(-100, momentumScore)),
      accelerationRatio,
    };
  }

  /**
   * Analyze options flow intelligence
   */
  private static analyzeOptions(historyLog: MarketSnapshot[]) {
    const latest = historyLog[0];
    const prev = historyLog[1];

    // OI expansion detection
    const callOIChange = (latest.callsOI || 0) - (prev?.callsOI || 0);
    const putOIChange = (latest.putsOI || 0) - (prev?.putsOI || 0);
    const netOIChange = callOIChange + putOIChange;

    const oiExpanding = netOIChange > 0;

    return {
      oiExpanding,
    };
  }

  /**
   * Analyze volatility trends
   */
  private static analyzeVolatility(historyLog: MarketSnapshot[]) {
    if (historyLog.length < 3) {
      return {
        volatility: 0,
        volatilityTrend: 'STABLE' as const,
      };
    }

    const recent = historyLog.slice(0, 3).reverse();
    const prices = recent.map(h => h.niftyLtp);
    
    // Calculate range
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    
    // Volatility as % of average price
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
    const volatility = (range / avgPrice) * 100;

    // Volatility trend
    const prev3 = historyLog.slice(3, 6).reverse();
    const prevPrices = prev3.map(h => h.niftyLtp);
    const prevRange = Math.max(...prevPrices) - Math.min(...prevPrices);
    
    let volatilityTrend: 'EXPANDING' | 'CONTRACTING' | 'STABLE' = 'STABLE';
    if (range > prevRange * 1.1) {
      volatilityTrend = 'EXPANDING';
    } else if (range < prevRange * 0.9) {
      volatilityTrend = 'CONTRACTING';
    }

    return {
      volatility: Math.min(100, volatility * 10),
      volatilityTrend,
    };
  }

  /**
   * Calculate support and resistance from historical levels
   */
  private static calculateSRLevels(
    historyLog: MarketSnapshot[],
    pivotSupport: number,
    pivotResistance: number
  ) {
    if (historyLog.length < 10) {
      return {
        support: pivotSupport,
        resistance: pivotResistance,
      };
    }

    // Get high and low from history
    const highs = historyLog.slice(0, 10).map(h => h.niftyLtp);
    const lows = historyLog.slice(0, 10).map(h => h.niftyLtp);
    
    const historyHigh = Math.max(...highs);
    const historyLow = Math.min(...lows);

    // Blend with pivot levels
    const support = Math.max(historyLow, pivotSupport * 0.98);
    const resistance = Math.min(historyHigh, pivotResistance * 1.02);

    return { support, resistance };
  }

  /**
   * Make final signal decision
   */
  private static makeSignalDecision(
    metrics: Omit<EnhancedSignalMetrics, 'overallConfidence' | 'signalStrength'>,
    currentPrice: number,
    srLevels: { support: number; resistance: number }
  ) {
    let bullishScore = 0;
    let bearishScore = 0;
    const reasons: string[] = [];

    // Trend weight: 30%
    if (metrics.trend15m === 'BULLISH') {
      bullishScore += metrics.trendStrength * 0.3;
      reasons.push(`Bullish trend (${metrics.trendStrength.toFixed(0)})`);
    } else if (metrics.trend15m === 'BEARISH') {
      bearishScore += metrics.trendStrength * 0.3;
      reasons.push(`Bearish trend (${metrics.trendStrength.toFixed(0)})`);
    }

    // Sentiment weight: 25%
    if (metrics.broadSentiment > 20) {
      bullishScore += (metrics.broadSentiment / 100) * 25;
      reasons.push(`Bullish sentiment (${metrics.broadSentiment.toFixed(0)}%)`);
    } else if (metrics.broadSentiment < -20) {
      bearishScore += (Math.abs(metrics.broadSentiment) / 100) * 25;
      reasons.push(`Bearish sentiment (${metrics.broadSentiment.toFixed(0)}%)`);
    }

    // Options flow weight: 25%
    if (metrics.optionFlow === 'BULLISH') {
      bullishScore += metrics.optionFlowStrength * 0.25;
      reasons.push(`Bullish options flow (${metrics.optionFlowStrength.toFixed(0)})`);
    } else if (metrics.optionFlow === 'BEARISH') {
      bearishScore += metrics.optionFlowStrength * 0.25;
      reasons.push(`Bearish options flow (${metrics.optionFlowStrength.toFixed(0)})`);
    }

    // Momentum weight: 20%
    if (metrics.momentumScore > 10) {
      bullishScore += (metrics.momentumScore / 100) * 20;
      reasons.push(`Positive momentum (${metrics.momentumScore.toFixed(0)})`);
    } else if (metrics.momentumScore < -10) {
      bearishScore += (Math.abs(metrics.momentumScore) / 100) * 20;
      reasons.push(`Negative momentum (${metrics.momentumScore.toFixed(0)})`);
    }

    // Price near support/resistance
    const distToSupport = Math.abs(currentPrice - srLevels.support);
    const distToResistance = Math.abs(currentPrice - srLevels.resistance);

    if (distToSupport < 20 && bullishScore > bearishScore) {
      bullishScore += 10;
      reasons.push(`Near support, potential reversal`);
    }
    if (distToResistance < 20 && bearishScore > bullishScore) {
      bearishScore += 10;
      reasons.push(`Near resistance, potential pullback`);
    }

    // Determine direction and confidence
    const diff = bullishScore - bearishScore;
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;

    if (diff > 20) {
      direction = 'LONG';
      confidence = Math.min(100, 50 + (diff / 2));
    } else if (diff < -20) {
      direction = 'SHORT';
      confidence = Math.min(100, 50 + (Math.abs(diff) / 2));
    } else {
      confidence = Math.max(0, 40 - (Math.abs(diff) / 2));
    }

    return {
      direction,
      confidence,
      reasons,
    };
  }

  /**
   * Calculate precise entry, target, and stop loss levels
   */
  private static calculateTradeLevels(
    signal: { direction: 'LONG' | 'SHORT' | 'NEUTRAL'; confidence: number },
    currentPrice: number,
    srLevels: { support: number; resistance: number },
    metrics: Omit<EnhancedSignalMetrics, 'overallConfidence' | 'signalStrength'>
  ) {
    if (signal.direction === 'NEUTRAL') {
      return {
        entry: currentPrice,
        target: currentPrice,
        stopLoss: currentPrice,
      };
    }

    const volatility = Math.max(15, metrics.volatility / 10); // In points
    const riskPoints = volatility * 1.5; // 1.5x volatility
    const rewardPoints = volatility * 2; // 2x volatility

    if (signal.direction === 'LONG') {
      // Entry on support break or current price
      const entry = Math.max(currentPrice - 10, srLevels.support + 5);
      const target = entry + rewardPoints;
      const stopLoss = entry - riskPoints;

      return {
        entry: Math.round(entry * 100) / 100,
        target: Math.round(target * 100) / 100,
        stopLoss: Math.round(Math.max(stopLoss, srLevels.support - 20) * 100) / 100,
      };
    } else {
      // SHORT
      const entry = Math.min(currentPrice + 10, srLevels.resistance - 5);
      const target = entry - rewardPoints;
      const stopLoss = entry + riskPoints;

      return {
        entry: Math.round(entry * 100) / 100,
        target: Math.round(target * 100) / 100,
        stopLoss: Math.round(Math.min(stopLoss, srLevels.resistance + 20) * 100) / 100,
      };
    }
  }

  private static getSignalStrength(confidence: number): 'WEAK' | 'MODERATE' | 'STRONG' {
    if (confidence >= 75) return 'STRONG';
    if (confidence >= 60) return 'MODERATE';
    return 'WEAK';
  }

  private static getEmptyMetrics(): Omit<EnhancedSignalMetrics, 'overallConfidence' | 'signalStrength'> {
    return {
      trend15m: 'NEUTRAL',
      trendStrength: 0,
      priceVelocity: 0,
      broadSentiment: 0,
      callPutRatio: 0,
      optionFlow: 'NEUTRAL',
      optionFlowStrength: 0,
      momentumScore: 0,
      accelerationRatio: 0,
      callBuyPressure: 0,
      putBuyPressure: 0,
      oiExpanding: false,
      support: 0,
      resistance: 0,
      volatility: 0,
      volatilityTrend: 'STABLE',
    };
  }
}

export default EnhancedSignalGenerator;
