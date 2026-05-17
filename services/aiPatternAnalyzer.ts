/**
 * AI PATTERN ANALYZER
 * 
 * Enhances existing pattern system with AI reasoning
 * Uses Gemini/Groq/Claude APIs to analyze patterns and make predictions
 */

import { callAI } from './aiProvider';
import { patternMiner } from './patternMiner';
import { FyersCredentials, MarketSnapshot, Pattern, DailyArchive } from '../types';

export class AIPatternAnalyzer {
  
  /**
   * Get AI-powered prediction using existing patterns
   */
  async getAIPrediction(
    credentials: FyersCredentials,
    currentSnapshot: MarketSnapshot
  ): Promise<{
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    confidence: number;
    reasoning: string;
    expectedMove: number;
    supportingPatterns: Pattern[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    
    if (!credentials.aiEnabled) {
      throw new Error('AI is not enabled in settings');
    }
    
    // Use existing pattern matching
    const matchedPatterns = await patternMiner.matchPatterns(currentSnapshot);
    const similarDays = await patternMiner.findSimilarSetups(currentSnapshot, 15);
    
    // Build prompt with pattern data
    const prompt = this.buildPromptFromPatterns(
      currentSnapshot,
      matchedPatterns,
      similarDays
    );
    
    // Let AI reason about patterns
    const systemInstruction = `You are an expert Nifty 50 trader analyzing pattern-based market data.
Analyze the provided patterns and historical similarities to predict market direction.
Focus on probability and risk management. Be concise and data-driven.
Always respond in valid JSON format.`;
    
    try {
      const aiResponse = await callAI(
        credentials,
        systemInstruction,
        prompt,
        { jsonMode: true }
      );
      
      const decision = JSON.parse(aiResponse);
      
      return {
        direction: decision.direction || 'SIDEWAYS',
        confidence: Math.min(Math.max(decision.confidence || 50, 0), 100),
        reasoning: decision.reasoning || 'Insufficient data for analysis',
        expectedMove: decision.expectedMove || 0,
        supportingPatterns: matchedPatterns,
        riskLevel: decision.riskLevel || 'MEDIUM'
      };
    } catch (error) {
      console.error('AI prediction failed:', error);
      
      // Fallback to pattern-based prediction
      return this.getFallbackPrediction(matchedPatterns, similarDays);
    }
  }
  
  /**
   * Build intelligent prompt from patterns
   */
  private buildPromptFromPatterns(
    current: MarketSnapshot,
    patterns: Pattern[],
    similarDays: DailyArchive[]
  ): string {
    
    // Format pattern matches
    const patternSummary = patterns.length > 0 
      ? patterns.map(p => `
        • ${p.name} (${p.confidence}% confidence)
          - Conditions: ${p.conditions.timeWindow || 'Any time'}
          - Historical Outcome: ${p.outcome.nextHourMove > 0 ? '+' : ''}${p.outcome.nextHourMove.toFixed(0)} pts
          - Reliability: ${p.outcome.reliability.toFixed(0)}%
          - Sample Size: ${p.outcome.sampleSize} occurrences
          - Last Seen: ${p.lastSeen}
      `).join('\n')
      : 'No matching patterns found';
    
    // Format similar historical days
    const similarDaysSummary = similarDays.length > 0
      ? similarDays.slice(0, 5).map((day, i) => {
          const move = day.summary.close - day.summary.open;
          return `
        ${i + 1}. ${day.date}
           - Open: ${day.summary.open.toFixed(0)} | Close: ${day.summary.close.toFixed(0)}
           - Move: ${move > 0 ? '+' : ''}${move.toFixed(0)} pts (${((move / day.summary.open) * 100).toFixed(2)}%)
           - Sentiment: ${day.summary.dominantSentiment.toFixed(0)}
           - PCR: ${day.summary.avgPCR.toFixed(2)}
           - Range: ${day.summary.range.toFixed(0)} pts
          `;
        }).join('\n')
      : 'No similar historical days found';
    
    // Calculate current momentum
    const momentum = current.ptsChg > 0 ? 'Upward' : current.ptsChg < 0 ? 'Downward' : 'Flat';
    
    return `
CURRENT MARKET STATE (${new Date(current.timestamp).toLocaleString('en-IN')}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nifty LTP: ${current.niftyLtp}
• Change: ${current.ptsChg > 0 ? '+' : ''}${current.ptsChg} pts (${current.niftyChangePercent?.toFixed(2) || 0}%)
• Momentum: ${momentum}
• Overall Sentiment: ${current.overallSent} (${current.overallSent > 0 ? 'Bullish' : 'Bearish'})
• Stock Sentiment: ${current.stockSent}
• Option Sentiment: ${current.optionSent}
• PCR: ${current.pcr.toFixed(2)} (${current.pcr > 1.2 ? 'High Puts' : current.pcr < 0.8 ? 'High Calls' : 'Balanced'})
• Bullish Stocks: ${current.bullishCount} | Bearish: ${current.bearishCount}
• Net Bias: ${(current.bullishCount || 0) - (current.bearishCount || 0)} (${((current.bullishCount || 0) - (current.bearishCount || 0)) > 0 ? 'Bullish' : 'Bearish'})

MATCHED PATTERNS FROM PATTERN LIBRARY (${patterns.length}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${patternSummary}

SIMILAR HISTORICAL DAYS (Top 5 from archives):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${similarDaysSummary}

ANALYSIS TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Based on:
1. Current market state (sentiment, PCR, momentum)
2. Matched patterns from pattern library
3. Similar historical day outcomes

Predict the market direction for the next 30-60 minutes.

Consider:
- Pattern reliability and sample size
- Consistency across similar historical days
- Current market sentiment and momentum alignment
- Risk factors (volatility, divergences)

Respond ONLY in this exact JSON format:
{
  "direction": "UP" | "DOWN" | "SIDEWAYS",
  "confidence": 75,
  "expectedMove": 30,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": "Brief 2-3 sentence explanation based on the patterns and data"
}
`;
  }
  
  /**
   * Get pattern explanation with AI
   */
  async explainPattern(
    credentials: FyersCredentials,
    pattern: Pattern
  ): Promise<string> {
    
    if (!credentials.aiEnabled) {
      return 'AI is not enabled. Enable AI in settings to get pattern explanations.';
    }
    
    const prompt = `
Explain this trading pattern to a trader:

Pattern Name: ${pattern.name}
Description: ${pattern.description}
Confidence Score: ${pattern.confidence}%
Time Window: ${pattern.conditions.timeWindow || 'Any time'}
Historical Outcome: ${pattern.outcome.nextHourMove > 0 ? '+' : ''}${pattern.outcome.nextHourMove.toFixed(0)} points
Reliability: ${pattern.outcome.reliability.toFixed(0)}%
Occurrences: ${pattern.occurrences} times
Last Seen: ${pattern.lastSeen}

Provide a concise 3-4 sentence explanation covering:
1. What this pattern indicates about market behavior
2. Trading strategy for this pattern (entry/exit)
3. Key risk factors to watch

Keep it actionable and clear.
`;
    
    try {
      return await callAI(
        credentials,
        'You are a trading pattern expert. Explain patterns clearly and actionably.',
        prompt
      );
    } catch (error) {
      console.error('Pattern explanation failed:', error);
      return `Pattern: ${pattern.name} - ${pattern.description}. Historical outcome: ${pattern.outcome.nextHourMove > 0 ? '+' : ''}${pattern.outcome.nextHourMove.toFixed(0)} points with ${pattern.outcome.reliability.toFixed(0)}% reliability.`;
    }
  }
  
  /**
   * Compare similar historical days with AI analysis
   */
  async compareSimilarDays(
    credentials: FyersCredentials,
    current: MarketSnapshot,
    similarDays: DailyArchive[]
  ): Promise<string> {
    
    if (!credentials.aiEnabled || similarDays.length === 0) {
      return 'No analysis available';
    }
    
    const daysSummary = similarDays.slice(0, 3).map((day, i) => {
      const move = day.summary.close - day.summary.open;
      return `
Day ${i + 1}: ${day.date}
- Move: ${move > 0 ? '+' : ''}${move.toFixed(0)} pts
- Sentiment: ${day.summary.dominantSentiment.toFixed(0)}
- Range: ${day.summary.range.toFixed(0)} pts
      `;
    }).join('\n');
    
    const prompt = `
Current Market: Nifty ${current.niftyLtp}, Sentiment ${current.overallSent}, PCR ${current.pcr.toFixed(2)}

Similar Historical Days:
${daysSummary}

Analyze these similar days and provide:
1. Common pattern across these days
2. Most likely outcome for today based on similarities
3. Key differences to watch

Keep it brief (3-4 sentences).
`;
    
    try {
      return await callAI(
        credentials,
        'You are a market analyst comparing historical patterns.',
        prompt
      );
    } catch (error) {
      console.error('Similar days comparison failed:', error);
      return 'Unable to analyze similar days at this time.';
    }
  }
  
  /**
   * Fallback prediction when AI fails
   */
  private getFallbackPrediction(
    patterns: Pattern[],
    similarDays: DailyArchive[]
  ): {
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    confidence: number;
    reasoning: string;
    expectedMove: number;
    supportingPatterns: Pattern[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    
    // Use pattern consensus
    if (patterns.length > 0) {
      const avgExpectedMove = patterns.reduce((sum, p) => sum + p.outcome.nextHourMove, 0) / patterns.length;
      const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      
      return {
        direction: avgExpectedMove > 10 ? 'UP' : avgExpectedMove < -10 ? 'DOWN' : 'SIDEWAYS',
        confidence: Math.min(avgConfidence, 70), // Cap at 70% for fallback
        reasoning: `Based on ${patterns.length} pattern match(es). AI prediction unavailable, using pattern statistics.`,
        expectedMove: avgExpectedMove,
        supportingPatterns: patterns,
        riskLevel: 'MEDIUM'
      };
    }
    
    // Use similar days
    if (similarDays.length > 0) {
      const avgMove = similarDays.reduce((sum, d) => sum + (d.summary.close - d.summary.open), 0) / similarDays.length;
      
      return {
        direction: avgMove > 10 ? 'UP' : avgMove < -10 ? 'DOWN' : 'SIDEWAYS',
        confidence: 55,
        reasoning: `Based on ${similarDays.length} similar historical day(s). AI prediction unavailable.`,
        expectedMove: avgMove,
        supportingPatterns: [],
        riskLevel: 'MEDIUM'
      };
    }
    
    // No data available
    return {
      direction: 'SIDEWAYS',
      confidence: 30,
      reasoning: 'Insufficient pattern and historical data for prediction. AI unavailable.',
      expectedMove: 0,
      supportingPatterns: [],
      riskLevel: 'HIGH'
    };
  }
}

// Singleton instance
export const aiPatternAnalyzer = new AIPatternAnalyzer();
