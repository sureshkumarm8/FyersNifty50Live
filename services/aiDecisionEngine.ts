/**
 * AI DECISION ENGINE
 * 
 * Core AI prediction system using existing APIs
 * Combines pattern memory with AI reasoning for smart predictions
 */

import { callAI } from './aiProvider';
import { tradingMemory } from './tradingMemory';
import { FyersCredentials, MarketSnapshot } from '../types';

export class AIDecisionEngine {
  
  /**
   * Make comprehensive AI prediction
   */
  async makePrediction(
    credentials: FyersCredentials,
    currentSnapshot: MarketSnapshot,
    historyLog: MarketSnapshot[]
  ): Promise<{
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    confidence: number;
    reasoning: string;
    expectedMove: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    supportingData: {
      similarPatterns: number;
      momentum: number;
      sentimentTrend: string;
    };
  }> {
    
    if (!credentials.aiEnabled) {
      throw new Error('AI is not enabled in settings');
    }
    
    // Step 1: Find similar historical patterns from memory
    const similarPatterns = await tradingMemory.findSimilarPatterns({
      niftyLTP: currentSnapshot.niftyLtp,
      sentiment: currentSnapshot.overallSent,
      pcr: currentSnapshot.pcr,
      volatility: Math.abs(currentSnapshot.ptsChg)
    }, 5);
    
    // Step 2: Get recent market context
    const recentContext = historyLog.slice(-30); // Last 30 minutes
    
    // Step 3: Build intelligent prompt
    const prompt = this.buildDecisionPrompt(
      currentSnapshot,
      recentContext,
      similarPatterns
    );
    
    // Step 4: Get AI decision
    const systemInstruction = `You are an expert Nifty 50 trader with years of experience.
Analyze the provided market data and historical patterns to make predictions.
Be concise and data-driven. Focus on probability, not certainty.
Always respond in valid JSON format.`;
    
    try {
      const aiResponse = await callAI(
        credentials,
        systemInstruction,
        prompt,
        { jsonMode: true }
      );
      
      const decision = JSON.parse(aiResponse);
      
      // Calculate supporting metrics
      const momentum = this.calculateMomentum(recentContext);
      const sentimentTrend = this.getSentimentTrend(recentContext);
      
      // Save prediction to memory for learning
      const predictionId = `pred_${Date.now()}`;
      await tradingMemory.savePattern({
        id: predictionId,
        timestamp: Date.now(),
        marketState: {
          niftyLTP: currentSnapshot.niftyLtp,
          sentiment: currentSnapshot.overallSent,
          stockSent: currentSnapshot.stockSent || 0,
          optionSent: currentSnapshot.optionSent || 0,
          pcr: currentSnapshot.pcr,
          timeOfDay: new Date(currentSnapshot.timestamp).toLocaleTimeString('en-IN', { hour12: false }),
          volatility: Math.abs(currentSnapshot.ptsChg),
          bullishCount: currentSnapshot.bullishCount || 0,
          bearishCount: currentSnapshot.bearishCount || 0
        },
        prediction: {
          direction: decision.direction || 'SIDEWAYS',
          confidence: Math.min(Math.max(decision.confidence || 50, 0), 100),
          expectedMove: decision.expectedMove || 0,
          riskLevel: decision.riskLevel || 'MEDIUM',
          reasoning: decision.reasoning || 'AI analysis based on market data'
        },
        features: this.extractFeatures(currentSnapshot, recentContext)
      });
      
      return {
        direction: decision.direction || 'SIDEWAYS',
        confidence: Math.min(Math.max(decision.confidence || 50, 0), 100),
        reasoning: decision.reasoning || 'Analysis based on current market conditions',
        expectedMove: decision.expectedMove || 0,
        riskLevel: decision.riskLevel || 'MEDIUM',
        supportingData: {
          similarPatterns: similarPatterns.length,
          momentum,
          sentimentTrend
        }
      };
    } catch (error) {
      console.error('AI prediction failed:', error);
      throw new Error('Failed to get AI prediction. Please try again.');
    }
  }
  
  /**
   * Build intelligent prompt with market data
   */
  private buildDecisionPrompt(
    current: MarketSnapshot,
    recentHistory: MarketSnapshot[],
    similarPatterns: any[]
  ): string {
    
    // Calculate momentum
    const momentum = this.calculateMomentum(recentHistory);
    const sentimentTrend = this.getSentimentTrend(recentHistory);
    
    // Format similar patterns
    const patternSummary = similarPatterns.length > 0
      ? similarPatterns.map((p, i) => {
          const outcome = p.outcome;
          return `
        ${i + 1}. ${new Date(p.timestamp).toLocaleString('en-IN')}
           - State: Nifty ${p.marketState.niftyLTP}, Sentiment ${p.marketState.sentiment}, PCR ${p.marketState.pcr.toFixed(2)}
           - Prediction: ${p.prediction.direction} (${p.prediction.confidence}% confidence)
           ${outcome ? `- Actual: ${outcome.correct ? '✅ Correct' : '❌ Wrong'} - Move: ${outcome.actualMove > 0 ? '+' : ''}${outcome.actualMove.toFixed(0)} pts` : '- Outcome: Pending'}
          `;
        }).join('\n')
      : 'No similar patterns in memory yet.';
    
    // Format recent price action
    const recentAction = this.formatRecentAction(recentHistory);
    
    return `
CURRENT MARKET STATE (${new Date(current.timestamp).toLocaleString('en-IN')}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nifty LTP: ${current.niftyLtp}
• Change: ${current.ptsChg > 0 ? '+' : ''}${current.ptsChg} pts (${current.niftyChangePercent?.toFixed(2) || 0}%)
• Overall Sentiment: ${current.overallSent} (${current.overallSent > 0 ? 'Bullish' : 'Bearish'})
• Stock Sentiment: ${current.stockSent || 0}
• Option Sentiment: ${current.optionSent || 0}
• PCR: ${current.pcr.toFixed(2)} (${current.pcr > 1.2 ? 'Bearish - High Puts' : current.pcr < 0.8 ? 'Bullish - High Calls' : 'Neutral'})
• Bullish Stocks: ${current.bullishCount || 0} | Bearish: ${current.bearishCount || 0}
• 30-min Momentum: ${momentum > 0 ? '📈' : '📉'} ${momentum > 0 ? '+' : ''}${momentum.toFixed(0)} pts
• Sentiment Trend: ${sentimentTrend}

SIMILAR HISTORICAL PATTERNS FROM MEMORY (${similarPatterns.length}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${patternSummary}

RECENT PRICE ACTION (Last 30 minutes):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recentAction}

ANALYSIS TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on:
1. Current market state (sentiment, PCR, momentum)
2. Similar historical patterns and their outcomes
3. Recent price action trend

Predict the market direction for the next 30-60 minutes.

Consider:
- Historical pattern outcomes and accuracy
- Current sentiment alignment with price action
- Risk factors (volatility, divergences, PCR extremes)
- Momentum strength and sustainability

Respond ONLY in this exact JSON format (no additional text):
{
  "direction": "UP" | "DOWN" | "SIDEWAYS",
  "confidence": 75,
  "expectedMove": 30,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "Brief 2-3 sentence explanation of your prediction"
}
`;
  }
  
  /**
   * Calculate momentum from recent history
   */
  private calculateMomentum(history: MarketSnapshot[]): number {
    if (history.length < 2) return 0;
    const first = history[0].niftyLtp;
    const last = history[history.length - 1].niftyLtp;
    return last - first;
  }
  
  /**
   * Get sentiment trend
   */
  private getSentimentTrend(history: MarketSnapshot[]): string {
    if (history.length < 10) return 'Insufficient data';
    
    const recent = history.slice(-10);
    const avgRecent = recent.reduce((sum, s) => sum + s.overallSent, 0) / recent.length;
    
    const older = history.slice(-20, -10);
    const avgOlder = older.reduce((sum, s) => sum + s.overallSent, 0) / older.length;
    
    const diff = avgRecent - avgOlder;
    
    if (diff > 10) return 'Accelerating Bullish';
    if (diff < -10) return 'Accelerating Bearish';
    if (Math.abs(diff) < 5) return 'Stable';
    return diff > 0 ? 'Slightly Bullish' : 'Slightly Bearish';
  }
  
  /**
   * Format recent action for prompt
   */
  private formatRecentAction(history: MarketSnapshot[]): string {
    const samples = history.filter((_, i) => i % 5 === 0).slice(-6); // Every 5 mins, last 30 mins
    if (samples.length === 0) return 'No recent data available';
    
    return samples.map(h => 
      `${new Date(h.timestamp).toLocaleTimeString('en-IN', { hour12: false })}: ${h.niftyLtp} (Sent: ${h.overallSent}, PCR: ${h.pcr.toFixed(2)})`
    ).join('\n');
  }
  
  /**
   * Extract features for pattern storage
   */
  private extractFeatures(current: MarketSnapshot, history: MarketSnapshot[]): string[] {
    const features: string[] = [];
    
    // Market state
    if (current.overallSent > 50) features.push('Strong Bullish Sentiment');
    if (current.overallSent < -50) features.push('Strong Bearish Sentiment');
    if (current.pcr > 1.3) features.push('High Put Buildup');
    if (current.pcr < 0.7) features.push('High Call Buildup');
    
    // Momentum
    const momentum = this.calculateMomentum(history);
    if (momentum > 50) features.push('Strong Upward Momentum');
    if (momentum < -50) features.push('Strong Downward Momentum');
    
    // Stock breadth
    const bullish = current.bullishCount || 0;
    const bearish = current.bearishCount || 0;
    if (bullish > bearish * 1.5) features.push('Broad Market Bullish');
    if (bearish > bullish * 1.5) features.push('Broad Market Bearish');
    
    return features;
  }
  
  /**
   * Record outcome for learning
   */
  async recordOutcome(
    predictionId: string,
    actualMove: number,
    correctPrediction: boolean,
    profitLoss?: number
  ): Promise<void> {
    await tradingMemory.recordOutcome(predictionId, actualMove, correctPrediction, profitLoss);
    console.log(`📊 Learning: ${correctPrediction ? '✅ Success' : '❌ Miss'} - Actual move: ${actualMove}`);
  }
}

// Singleton instance
export const aiDecisionEngine = new AIDecisionEngine();
