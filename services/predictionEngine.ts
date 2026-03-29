/**
 * PREDICTION ENGINE
 * 
 * AI-powered prediction system for market forecasting
 * - Next-minute direction predictor
 * - Trade win probability calculator
 * - Anomaly detection system
 * - Dynamic stop-loss optimizer
 */

import { MarketSnapshot, EnrichedFyersQuote, PivotPoints, DailyArchive } from '../types';
import { dbService } from './db';
import { tradeJournal } from './tradeJournal';

export interface Prediction {
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number; // 0-100
  expectedMove: number; // Points
  timeframe: string; // "1 minute", "5 minutes", etc.
  factors: PredictionFactor[];
  timestamp: number;
}

export interface PredictionFactor {
  name: string;
  value: number;
  weight: number; // Contribution to prediction
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface TradeWinProbability {
  probability: number; // 0-100
  sampleSize: number; // How many similar trades
  avgPnL: number;
  avgDuration: number; // Minutes
  riskReward: number;
  confidence: number;
  similarTrades: any[]; // Historical trades
}

export interface Anomaly {
  type: 'PCR' | 'SENTIMENT' | 'VOLUME' | 'DIVERGENCE' | 'VOLATILITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  currentValue: number;
  normalRange: [number, number];
  stdDeviation: number;
  historicalContext?: string;
  suggestedAction?: string;
}

export interface OptimalStopLoss {
  recommendedSL: number; // Points
  confidence: number;
  reasoning: string;
  basedOn: {
    volatility: number;
    avgRange: number;
    historicalWinRate: number;
  };
}

export class PredictionEngine {
  
  /**
   * Predict next minute's market direction
   */
  async predictNextMove(context: {
    niftyLtp: number;
    marketSnapshot: MarketSnapshot;
    last5Minutes: MarketSnapshot[];
    stocks: EnrichedFyersQuote[];
    pivots: PivotPoints | null;
  }): Promise<Prediction> {
    const factors: PredictionFactor[] = [];
    
    // Factor 1: Sentiment Momentum
    if (context.last5Minutes.length >= 2) {
      const currentSent = context.marketSnapshot.overallSent;
      const prevSent = context.last5Minutes[context.last5Minutes.length - 2].overallSent;
      const sentMomentum = currentSent - prevSent;
      
      factors.push({
        name: 'Sentiment Momentum',
        value: sentMomentum,
        weight: 0.3,
        signal: sentMomentum > 5 ? 'BULLISH' : sentMomentum < -5 ? 'BEARISH' : 'NEUTRAL'
      });
    }
    
    // Factor 2: Option Flow
    const optionFlow = context.marketSnapshot.optionsSent;
    factors.push({
      name: 'Option Flow',
      value: optionFlow,
      weight: 0.25,
      signal: optionFlow > 20 ? 'BULLISH' : optionFlow < -20 ? 'BEARISH' : 'NEUTRAL'
    });
    
    // Factor 3: PCR Position
    const pcr = context.marketSnapshot.pcr;
    factors.push({
      name: 'PCR Position',
      value: pcr,
      weight: 0.15,
      signal: pcr > 1.2 ? 'BULLISH' : pcr < 0.8 ? 'BEARISH' : 'NEUTRAL'
    });
    
    // Factor 4: Price vs Pivot
    if (context.pivots) {
      const distToR1 = context.niftyLtp - context.pivots.r1;
      const distToS1 = context.niftyLtp - context.pivots.s1;
      
      let pivotSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      if (distToS1 < 20 && distToS1 > 0) pivotSignal = 'BULLISH'; // Near support
      if (distToR1 > -20 && distToR1 < 0) pivotSignal = 'BEARISH'; // Near resistance
      
      factors.push({
        name: 'Pivot Position',
        value: distToR1,
        weight: 0.15,
        signal: pivotSignal
      });
    }
    
    // Factor 5: Sector Strength
    const bullishStocks = context.stocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
    const bearishStocks = context.stocks.filter(s => (s.lp_chg_day_p || 0) < 0).length;
    const breadthRatio = (bullishStocks - bearishStocks) / context.stocks.length;
    
    factors.push({
      name: 'Market Breadth',
      value: breadthRatio * 100,
      weight: 0.15,
      signal: breadthRatio > 0.3 ? 'BULLISH' : breadthRatio < -0.3 ? 'BEARISH' : 'NEUTRAL'
    });
    
    // Calculate weighted score
    let bullishScore = 0;
    let bearishScore = 0;
    
    factors.forEach(f => {
      if (f.signal === 'BULLISH') bullishScore += f.weight;
      if (f.signal === 'BEARISH') bearishScore += f.weight;
    });
    
    const netScore = bullishScore - bearishScore;
    
    let direction: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
    let expectedMove = 0;
    
    if (netScore > 0.2) {
      direction = 'UP';
      expectedMove = 3 + (netScore * 10); // Scaled move
    } else if (netScore < -0.2) {
      direction = 'DOWN';
      expectedMove = -(3 + (Math.abs(netScore) * 10));
    }
    
    const confidence = Math.min(50 + Math.abs(netScore) * 100, 95);
    
    return {
      direction,
      confidence: Math.round(confidence),
      expectedMove: Math.round(expectedMove * 10) / 10,
      timeframe: '1 minute',
      factors,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate trade win probability based on historical data
   */
  async getTradeWinProbability(tradeSetup: {
    entryPrice: number;
    direction: 'LONG' | 'SHORT';
    strikePrice?: number;
    optionType?: 'CE' | 'PE';
    marketContext: {
      time: string;
      niftyLtp: number;
      sentiment: number;
      pcr: number;
      volatility: number;
    };
  }): Promise<TradeWinProbability> {
    // Get all historical trades
    const allTrades = tradeJournal.getAllTrades();
    
    // Filter similar trades
    const similarTrades = allTrades.filter(trade => {
      // Same direction
      if (trade.direction !== tradeSetup.direction) return false;
      
      // Similar market conditions
      const priceDiff = Math.abs(trade.entryPrice - tradeSetup.entryPrice);
      if (priceDiff > 100) return false;
      
      // Similar time of day (within 1 hour)
      const tradeHour = new Date(trade.entryTime).getHours();
      const setupHour = parseInt(tradeSetup.marketContext.time.split(':')[0]);
      if (Math.abs(tradeHour - setupHour) > 1) return false;
      
      return true;
    });
    
    if (similarTrades.length === 0) {
      // No historical data, return conservative estimate
      return {
        probability: 50,
        sampleSize: 0,
        avgPnL: 0,
        avgDuration: 0,
        riskReward: 1.0,
        confidence: 30,
        similarTrades: []
      };
    }
    
    // Calculate statistics
    const winners = similarTrades.filter(t => t.pnl > 0);
    const probability = (winners.length / similarTrades.length) * 100;
    const avgPnL = similarTrades.reduce((sum, t) => sum + t.pnl, 0) / similarTrades.length;
    const avgDuration = similarTrades.reduce((sum, t) => sum + (t.exitTime - t.entryTime), 0) / similarTrades.length / 60000; // Minutes
    
    // Calculate risk-reward
    const avgWin = winners.reduce((sum, t) => sum + t.pnl, 0) / Math.max(winners.length, 1);
    const losers = similarTrades.filter(t => t.pnl <= 0);
    const avgLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnl, 0) / Math.max(losers.length, 1));
    const riskReward = avgWin / Math.max(avgLoss, 1);
    
    // Confidence based on sample size
    const confidence = Math.min(30 + (similarTrades.length * 5), 90);
    
    return {
      probability: Math.round(probability),
      sampleSize: similarTrades.length,
      avgPnL: Math.round(avgPnL),
      avgDuration: Math.round(avgDuration),
      riskReward: Math.round(riskReward * 10) / 10,
      confidence,
      similarTrades: similarTrades.slice(0, 10) // Top 10
    };
  }

  /**
   * Scan for market anomalies
   */
  async scanAnomalies(currentSnapshot: MarketSnapshot, lookbackDays: number = 30): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Get historical data for baseline
    const archives = await dbService.getArchives(lookbackDays);
    if (archives.length === 0) return anomalies;
    
    // Calculate normal ranges
    const allPCRs = archives.map(a => a.summary.avgPCR);
    const allSentiments = archives.map(a => a.summary.dominantSentiment);
    const allRanges = archives.map(a => a.summary.range);
    
    const pcrMean = this.mean(allPCRs);
    const pcrStd = this.stdDev(allPCRs, pcrMean);
    
    const sentMean = this.mean(allSentiments);
    const sentStd = this.stdDev(allSentiments, sentMean);
    
    const rangeMean = this.mean(allRanges);
    const rangeStd = this.stdDev(allRanges, rangeMean);
    
    // Check PCR Anomaly
    const pcrZScore = Math.abs((currentSnapshot.pcr - pcrMean) / pcrStd);
    if (pcrZScore > 2) {
      anomalies.push({
        type: 'PCR',
        severity: pcrZScore > 3 ? 'HIGH' : 'MEDIUM',
        message: `PCR ratio is ${currentSnapshot.pcr.toFixed(2)} (${pcrZScore.toFixed(1)}σ ${currentSnapshot.pcr > pcrMean ? 'above' : 'below'} normal)`,
        currentValue: currentSnapshot.pcr,
        normalRange: [pcrMean - 2 * pcrStd, pcrMean + 2 * pcrStd],
        stdDeviation: pcrZScore,
        historicalContext: currentSnapshot.pcr > pcrMean ? 'Extreme Put buying - Potential support' : 'Extreme Call buying - Potential resistance',
        suggestedAction: currentSnapshot.pcr > pcrMean ? 'Consider LONG positions' : 'Consider SHORT positions'
      });
    }
    
    // Check Sentiment Anomaly
    const sentZScore = Math.abs((currentSnapshot.overallSent - sentMean) / sentStd);
    if (sentZScore > 2) {
      anomalies.push({
        type: 'SENTIMENT',
        severity: sentZScore > 3 ? 'HIGH' : 'MEDIUM',
        message: `Sentiment at ${currentSnapshot.overallSent.toFixed(1)} (${sentZScore.toFixed(1)}σ ${currentSnapshot.overallSent > sentMean ? 'above' : 'below'} normal)`,
        currentValue: currentSnapshot.overallSent,
        normalRange: [sentMean - 2 * sentStd, sentMean + 2 * sentStd],
        stdDeviation: sentZScore,
        historicalContext: currentSnapshot.overallSent > sentMean ? 'Extreme bullishness' : 'Extreme bearishness',
        suggestedAction: sentZScore > 3 ? 'Potential reversal zone' : 'Trend may continue'
      });
    }
    
    // Check Price-Sentiment Divergence
    const priceChange = currentSnapshot.ptsChg;
    const sentimentDirection = currentSnapshot.overallSent > 0 ? 1 : -1;
    const priceDirection = priceChange > 0 ? 1 : -1;
    
    if (sentimentDirection !== priceDirection && Math.abs(currentSnapshot.overallSent) > 30 && Math.abs(priceChange) > 20) {
      anomalies.push({
        type: 'DIVERGENCE',
        severity: 'HIGH',
        message: `Price-Sentiment divergence: Price ${priceChange > 0 ? 'UP' : 'DOWN'} but sentiment ${currentSnapshot.overallSent > 0 ? 'bullish' : 'bearish'}`,
        currentValue: priceChange,
        normalRange: [-20, 20],
        stdDeviation: 2.5,
        historicalContext: 'Divergence often precedes reversal',
        suggestedAction: 'Watch for reversal or sentiment catch-up'
      });
    }
    
    return anomalies;
  }

  /**
   * Optimize stop-loss based on current volatility
   */
  async optimizeStopLoss(currentVolatility: number, lookbackDays: number = 30): Promise<OptimalStopLoss> {
    const archives = await dbService.getArchives(lookbackDays);
    
    if (archives.length === 0) {
      return {
        recommendedSL: 30,
        confidence: 50,
        reasoning: 'Default 30-point SL (insufficient historical data)',
        basedOn: {
          volatility: currentVolatility,
          avgRange: 0,
          historicalWinRate: 0
        }
      };
    }
    
    // Group archives by volatility regime
    const avgVolatility = this.mean(archives.map(a => a.summary.volatility));
    const isHighVol = currentVolatility > avgVolatility * 1.2;
    const isLowVol = currentVolatility < avgVolatility * 0.8;
    
    // Get trades from similar volatility regime
    const relevantTrades = tradeJournal.getAllTrades().filter(trade => {
      const tradeDate = new Date(trade.entryTime).toDateString();
      const archive = archives.find(a => a.date === tradeDate);
      if (!archive) return false;
      
      const tradeVol = archive.summary.volatility;
      if (isHighVol) return tradeVol > avgVolatility * 1.2;
      if (isLowVol) return tradeVol < avgVolatility * 0.8;
      return true; // Normal volatility
    });
    
    // Calculate optimal SL
    let recommendedSL = 30;
    if (isHighVol) {
      recommendedSL = 45; // Wider SL in high volatility
    } else if (isLowVol) {
      recommendedSL = 20; // Tighter SL in low volatility
    }
    
    // Calculate win rate with this SL
    const avgRange = this.mean(archives.map(a => a.summary.range));
    const winRate = relevantTrades.length > 0 
      ? relevantTrades.filter(t => t.pnl > 0).length / relevantTrades.length 
      : 0.5;
    
    return {
      recommendedSL,
      confidence: relevantTrades.length > 5 ? 75 : 50,
      reasoning: `${isHighVol ? 'High' : isLowVol ? 'Low' : 'Normal'} volatility regime - ${recommendedSL}pt SL recommended`,
      basedOn: {
        volatility: currentVolatility,
        avgRange: Math.round(avgRange),
        historicalWinRate: Math.round(winRate * 100)
      }
    };
  }

  /**
   * Get prediction accuracy stats
   */
  async getPredictionAccuracy(): Promise<{
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    avgConfidence: number;
  }> {
    // This would track predictions vs actual outcomes
    // Simplified version for now
    const predictions = this.getPredictionHistory();
    
    const total = predictions.length;
    const correct = predictions.filter(p => p.wasCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    const avgConfidence = total > 0 
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / total 
      : 0;
    
    return {
      totalPredictions: total,
      correctPredictions: correct,
      accuracy: Math.round(accuracy),
      avgConfidence: Math.round(avgConfidence)
    };
  }

  /**
   * Store prediction for later validation
   */
  storePrediction(prediction: Prediction, actualOutcome?: { direction: 'UP' | 'DOWN' | 'SIDEWAYS'; move: number }) {
    const key = `predictions_${new Date().toDateString()}`;
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        prediction,
        actualOutcome,
        wasCorrect: actualOutcome ? actualOutcome.direction === prediction.direction : undefined
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to store prediction:', e);
    }
  }

  /**
   * Get prediction history for accuracy calculation
   */
  private getPredictionHistory(): any[] {
    const today = new Date().toDateString();
    const key = `predictions_${today}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private stdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// Singleton instance
export const predictionEngine = new PredictionEngine();
