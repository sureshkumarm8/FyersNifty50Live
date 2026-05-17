/**
 * PATTERN MINER SERVICE
 * 
 * Analyzes historical data to discover recurring market patterns
 * - Scans archives for similar setups
 * - Calculates pattern reliability and outcomes
 * - Stores learned patterns in IndexedDB
 */

import { dbService } from './db';
import { DailyArchive, MarketSnapshot, Pattern, PatternConditions, PatternOutcome, FyersCredentials } from '../types';
import { callAI } from './aiProvider';

export class PatternMiner {
  
  /**
   * Analyze a specific day and find patterns (with AI option)
   */
  async analyzeDay(date: string, credentials?: FyersCredentials): Promise<Pattern[]> {
    const archive = await dbService.getArchive(date);
    if (!archive || !archive.snapshots || archive.snapshots.length < 30) return [];
    
    const patterns: Pattern[] = [];
    
    try {
      // If AI is enabled, use AI-powered pattern discovery
      if (credentials?.aiEnabled) {
        const aiPatterns = await this.discoverPatternsWithAI(archive, credentials);
        patterns.push(...aiPatterns);
      } else {
        // Fallback to traditional hardcoded pattern detection
        // Pattern 1: Morning Reversal
        const morningReversal = this.detectMorningReversal(archive);
        if (morningReversal) patterns.push(morningReversal);
        
        // Pattern 2: Trend Continuation
        const trendContinuation = this.detectTrendContinuation(archive);
        if (trendContinuation) patterns.push(trendContinuation);
        
        // Pattern 3: PCR Reversal
        const pcrReversal = this.detectPCRReversal(archive);
        if (pcrReversal) patterns.push(pcrReversal);
        
        // Pattern 4: Strong Opening
        const strongOpening = this.detectStrongOpening(archive);
        if (strongOpening) patterns.push(strongOpening);
        
        // Pattern 5: Sentiment Surge
        const sentimentSurge = this.detectSentimentSurge(archive);
        if (sentimentSurge) patterns.push(sentimentSurge);
      }
      
      // Save discovered patterns
      for (const pattern of patterns) {
        await this.updateOrCreatePattern(pattern);
      }
    } catch (error) {
      console.error(`Error analyzing day ${date}:`, error);
    }
    
    return patterns;
  }

  /**
   * AI-Powered Pattern Discovery
   * Uses AI to identify patterns from market data
   */
  private async discoverPatternsWithAI(
    archive: DailyArchive,
    credentials: FyersCredentials
  ): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    
    try {
      // Prepare data summary for AI
      const dataSummary = this.prepareDataSummary(archive);
      
      // Build prompt for AI pattern discovery
      const prompt = `
Analyze this Nifty 50 trading day data and identify recurring patterns:

DATE: ${archive.date}

MARKET SUMMARY:
• Opening: ${archive.summary.open.toFixed(0)}
• Closing: ${archive.summary.close.toFixed(0)}
• Day Move: ${(archive.summary.close - archive.summary.open).toFixed(0)} points
• High: ${archive.summary.high.toFixed(0)}
• Low: ${archive.summary.low.toFixed(0)}
• Range: ${archive.summary.range.toFixed(0)} points
• Dominant Sentiment: ${archive.summary.dominantSentiment.toFixed(0)}
• Avg PCR: ${archive.summary.avgPCR.toFixed(2)}

KEY MOMENTS (Sampled every 15 minutes):
${dataSummary}

YOUR TASK:
Identify 2-3 significant trading patterns from this day's data.

For each pattern, provide:
1. Pattern name (short, descriptive)
2. Pattern description (what happened)
3. Time window (when it occurred)
4. Key conditions (sentiment, price move, PCR levels)
5. Outcome (what happened next)
6. Expected move (in points)

Focus on:
- Significant sentiment shifts
- Price reversals or continuations
- Opening/closing behaviors
- PCR changes indicating option sentiment
- Volume/momentum surges

Respond in JSON array format:
[
  {
    "name": "Pattern Name",
    "description": "What the pattern indicates",
    "timeWindow": "HH:MM-HH:MM",
    "sentimentShift": 45.5,
    "priceMove": 32.5,
    "pcrRange": [0.95, 1.15],
    "nextHourMove": 25.0,
    "duration": 60,
    "significance": "HIGH" | "MEDIUM" | "LOW"
  }
]

Only identify patterns with clear outcomes. If no significant patterns, return empty array [].
`;

      const systemInstruction = `You are an expert technical analyst specializing in Nifty 50 intraday patterns.
Analyze market data to identify recurring, tradeable patterns.
Be precise and focus on actionable patterns with clear conditions.`;

      const aiResponse = await callAI(
        credentials,
        systemInstruction,
        prompt,
        { jsonMode: true }
      );

      const aiPatterns = JSON.parse(aiResponse);
      
      // Convert AI-discovered patterns to Pattern objects
      for (const aiPattern of aiPatterns) {
        if (aiPattern.significance === 'LOW') continue; // Skip low significance
        
        const pattern: Pattern = {
          id: `ai_${aiPattern.name.toLowerCase().replace(/\s+/g, '_')}_${archive.date}`,
          name: `AI: ${aiPattern.name}`,
          description: aiPattern.description,
          timestamps: [new Date(archive.date).getTime()],
          conditions: {
            timeWindow: aiPattern.timeWindow,
            sentimentShift: aiPattern.sentimentShift,
            niftyMoveRange: aiPattern.priceMove ? {
              min: aiPattern.priceMove - 15,
              max: aiPattern.priceMove + 15
            } : undefined,
            pcrRange: aiPattern.pcrRange
          },
          outcome: {
            nextHourMove: aiPattern.nextHourMove || 0,
            reliability: 0,
            sampleSize: 1,
            avgDuration: aiPattern.duration || 60
          },
          confidence: aiPattern.significance === 'HIGH' ? 65 : 55,
          lastSeen: archive.date,
          occurrences: 1
        };
        
        patterns.push(pattern);
      }
      
      console.log(`✅ AI discovered ${patterns.length} patterns for ${archive.date}`);
      
    } catch (error) {
      console.error('AI pattern discovery failed:', error);
      // Fallback to traditional detection if AI fails
      const morningReversal = this.detectMorningReversal(archive);
      if (morningReversal) patterns.push(morningReversal);
    }
    
    return patterns;
  }

  /**
   * Prepare data summary for AI analysis
   */
  private prepareDataSummary(archive: DailyArchive): string {
    const snapshots = archive.snapshots;
    const samples = [];
    
    // Sample every 15 minutes (15 snapshots)
    for (let i = 0; i < snapshots.length; i += 15) {
      const snap = snapshots[i];
      if (!snap) continue;
      
      const time = new Date(snap.timestamp).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      
      samples.push(
        `${time}: Nifty ${snap.niftyLtp} | Sentiment ${snap.overallSent} | PCR ${snap.pcr.toFixed(2)}`
      );
    }
    
    return samples.slice(0, 20).join('\n'); // Max 20 samples
  }

  /**
   * Find similar past market setups
   */
  async findSimilarSetups(currentSnapshot: MarketSnapshot, lookbackDays: number = 30): Promise<DailyArchive[]> {
    const archives = await dbService.getArchives(lookbackDays);
    
    const similar: DailyArchive[] = [];
    
    for (const archive of archives) {
      const similarity = this.calculateSimilarity(currentSnapshot, archive);
      if (similarity > 0.7) { // 70% similarity threshold
        similar.push(archive);
      }
    }
    
    return similar.sort((a, b) => {
      const simA = this.calculateSimilarity(currentSnapshot, a);
      const simB = this.calculateSimilarity(currentSnapshot, b);
      return simB - simA;
    });
  }

  /**
   * Get all learned patterns, sorted by confidence
   */
  async getAllPatterns(): Promise<Pattern[]> {
    const patterns = await dbService.getPatterns();
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if current market matches any known pattern
   */
  async matchPatterns(snapshot: MarketSnapshot): Promise<Pattern[]> {
    const allPatterns = await this.getAllPatterns();
    const matches: Pattern[] = [];
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    for (const pattern of allPatterns) {
      if (this.doesMatch(snapshot, pattern, currentTime)) {
        matches.push(pattern);
      }
    }
    
    return matches;
  }

  /**
   * Private: Detect Morning Reversal pattern (More lenient)
   */
  private detectMorningReversal(archive: DailyArchive): Pattern | null {
    const snapshots = archive.snapshots;
    if (snapshots.length < 30) return null;
    
    // Get morning window - first 60 minutes (flexible indexing)
    const morningLength = Math.min(60, snapshots.length);
    const morningSnaps = snapshots.slice(0, morningLength);
    if (morningSnaps.length < 10) return null;
    
    const firstSnap = morningSnaps[0];
    const lastSnap = morningSnaps[morningSnaps.length - 1];
    
    // More lenient: Sentiment shift of at least 40 points (can be +20 to +60, or -20 to -60)
    const sentimentShift = lastSnap.overallSent - firstSnap.overallSent;
    
    if (Math.abs(sentimentShift) > 40) {
      const priceMove = lastSnap.niftyLtp - firstSnap.niftyLtp;
      
      // Calculate next hour move if data available
      const nextHourIndex = Math.min(morningLength + 60, snapshots.length - 1);
      const nextHourSnap = snapshots[nextHourIndex];
      const nextHourMove = nextHourSnap ? nextHourSnap.niftyLtp - lastSnap.niftyLtp : priceMove;
      
      return {
        id: `morning_reversal_${archive.date}`,
        name: 'Morning Reversal',
        description: 'Strong sentiment shift in first hour',
        timestamps: [new Date(archive.date).getTime()],
        conditions: {
          timeWindow: '09:15-10:15',
          sentimentShift,
          niftyMoveRange: { min: priceMove - 20, max: priceMove + 20 }
        },
        outcome: {
          nextHourMove,
          reliability: 0,
          sampleSize: 1,
          avgDuration: 60
        },
        confidence: 50,
        lastSeen: archive.date,
        occurrences: 1
      };
    }
    
    return null;
  }

  /**
   * Private: Detect Trend Continuation pattern
   */
  private detectTrendContinuation(archive: DailyArchive): Pattern | null {
    const snapshots = archive.snapshots;
    if (snapshots.length < 120) return null;
    
    // Check if first 2 hours have consistent direction
    const firstHour = snapshots.slice(0, 60);
    const secondHour = snapshots.slice(60, 120);
    
    const firstHourMove = firstHour[firstHour.length - 1].niftyLtp - firstHour[0].niftyLtp;
    const secondHourMove = secondHour[secondHour.length - 1].niftyLtp - secondHour[0].niftyLtp;
    
    // Same direction and significant move
    if (Math.sign(firstHourMove) === Math.sign(secondHourMove) && Math.abs(firstHourMove) > 30) {
      return {
        id: `trend_continuation_${archive.date}`,
        name: 'Trend Continuation',
        description: 'Strong directional move continues for multiple hours',
        timestamps: [new Date(archive.date).getTime()],
        conditions: {
          timeWindow: '09:15-11:15',
          niftyMoveRange: { min: Math.abs(firstHourMove) - 10, max: Math.abs(firstHourMove) + 10 }
        },
        outcome: {
          nextHourMove: secondHourMove,
          reliability: 0,
          sampleSize: 1,
          avgDuration: 120
        },
        confidence: 60,
        lastSeen: archive.date,
        occurrences: 1
      };
    }
    
    return null;
  }

  /**
   * Private: Calculate similarity between snapshot and archive
   */
  private calculateSimilarity(snapshot: MarketSnapshot, archive: DailyArchive): number {
    const summary = archive.summary;
    
    let score = 0;
    let factors = 0;
    
    // Compare opening price
    if (Math.abs(snapshot.niftyLtp - summary.open) < 50) {
      score += 0.3;
    }
    factors++;
    
    // Compare sentiment
    if (Math.abs(snapshot.overallSent - summary.dominantSentiment) < 20) {
      score += 0.3;
    }
    factors++;
    
    // Compare PCR
    if (Math.abs(snapshot.pcr - summary.avgPCR) < 0.3) {
      score += 0.2;
    }
    factors++;
    
    // Compare volatility (range)
    const currentRange = Math.abs(snapshot.ptsChg);
    if (Math.abs(currentRange - summary.range) < 30) {
      score += 0.2;
    }
    factors++;
    
    return score;
  }

  /**
   * Private: Check if snapshot matches pattern conditions
   */
  private doesMatch(snapshot: MarketSnapshot, pattern: Pattern, currentTime: string): boolean {
    const conditions = pattern.conditions;
    
    // Check time window
    if (conditions.timeWindow) {
      const [start, end] = conditions.timeWindow.split('-');
      if (currentTime < start || currentTime > end) {
        return false;
      }
    }
    
    // Check nifty move range
    if (conditions.niftyMoveRange) {
      const move = snapshot.ptsChg;
      if (move < conditions.niftyMoveRange.min || move > conditions.niftyMoveRange.max) {
        return false;
      }
    }
    
    // Check sentiment shift
    if (conditions.sentimentShift) {
      // This would need historical comparison - simplified for now
      if (Math.abs(snapshot.overallSent) < Math.abs(conditions.sentimentShift) * 0.5) {
        return false;
      }
    }
    
    // Check PCR range
    if (conditions.pcrRange) {
      if (snapshot.pcr < conditions.pcrRange[0] || snapshot.pcr > conditions.pcrRange[1]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Private: Update existing pattern or create new one
   */
  private async updateOrCreatePattern(newPattern: Pattern): Promise<void> {
    const existing = await dbService.getPattern(newPattern.id);
    
    if (existing) {
      // Update existing pattern
      const updated: Pattern = {
        ...existing,
        timestamps: [...existing.timestamps, ...newPattern.timestamps],
        occurrences: existing.occurrences + 1,
        lastSeen: newPattern.lastSeen,
        outcome: {
          nextHourMove: (existing.outcome.nextHourMove * existing.occurrences + newPattern.outcome.nextHourMove) / (existing.occurrences + 1),
          reliability: this.calculateReliability(existing, newPattern),
          sampleSize: existing.outcome.sampleSize + 1,
          avgDuration: (existing.outcome.avgDuration * existing.occurrences + newPattern.outcome.avgDuration) / (existing.occurrences + 1)
        },
        confidence: this.calculateConfidence(existing.occurrences + 1, this.calculateReliability(existing, newPattern))
      };
      
      await dbService.savePattern(updated);
    } else {
      // Save new pattern
      await dbService.savePattern(newPattern);
    }
  }

  /**
   * Private: Calculate pattern reliability
   */
  private calculateReliability(existing: Pattern, newPattern: Pattern): number {
    // Simplified: % of positive outcomes
    const totalSamples = existing.outcome.sampleSize + 1;
    const positiveOutcomes = Math.abs(existing.outcome.nextHourMove) > 30 ? existing.outcome.sampleSize : 0;
    const newPositive = Math.abs(newPattern.outcome.nextHourMove) > 30 ? 1 : 0;
    
    return ((positiveOutcomes + newPositive) / totalSamples) * 100;
  }

  /**
   * Private: Calculate pattern confidence
   */
  private calculateConfidence(occurrences: number, reliability: number): number {
    // Confidence increases with occurrences and reliability
    const occurrenceFactor = Math.min(occurrences / 10, 1); // Cap at 10 occurrences
    return Math.min(reliability * occurrenceFactor, 95);
  }

  /**
   * Private: Detect PCR Reversal pattern
   */
  private detectPCRReversal(archive: DailyArchive): Pattern | null {
    const snapshots = archive.snapshots;
    if (snapshots.length < 30) return null;
    
    const midLength = Math.min(60, Math.floor(snapshots.length / 2));
    const firstHalf = snapshots.slice(0, midLength);
    const secondHalf = snapshots.slice(midLength, Math.min(midLength * 2, snapshots.length));
    
    if (firstHalf.length < 10 || secondHalf.length < 10) return null;
    
    const avgPCRFirst = firstHalf.reduce((sum, s) => sum + s.pcr, 0) / firstHalf.length;
    const avgPCRSecond = secondHalf.reduce((sum, s) => sum + s.pcr, 0) / secondHalf.length;
    
    // PCR reversal: Goes from >1.2 to <0.9 or vice versa
    if ((avgPCRFirst > 1.2 && avgPCRSecond < 0.9) || (avgPCRFirst < 0.9 && avgPCRSecond > 1.2)) {
      const firstSnap = firstHalf[0];
      const lastSnap = secondHalf[secondHalf.length - 1];
      const priceMove = lastSnap.niftyLtp - firstSnap.niftyLtp;
      
      return {
        id: `pcr_reversal_${archive.date}`,
        name: 'PCR Reversal',
        description: 'Put-Call Ratio shows major shift in options sentiment',
        timestamps: [new Date(archive.date).getTime()],
        conditions: {
          pcrRange: [Math.min(avgPCRFirst, avgPCRSecond), Math.max(avgPCRFirst, avgPCRSecond)]
        },
        outcome: {
          nextHourMove: priceMove,
          reliability: 0,
          sampleSize: 1,
          avgDuration: 120
        },
        confidence: 50,
        lastSeen: archive.date,
        occurrences: 1
      };
    }
    
    return null;
  }

  /**
   * Private: Detect Strong Opening pattern
   */
  private detectStrongOpening(archive: DailyArchive): Pattern | null {
    const snapshots = archive.snapshots;
    if (snapshots.length < 15) return null;
    
    const openingSnaps = snapshots.slice(0, 15); // First 15 minutes
    const firstSnap = openingSnaps[0];
    const fifteenMinSnap = openingSnaps[openingSnaps.length - 1];
    
    const openingMove = fifteenMinSnap.niftyLtp - firstSnap.niftyLtp;
    
    // Strong opening: >25 points move in first 15 minutes
    if (Math.abs(openingMove) > 25) {
      const nextHourIndex = Math.min(60, snapshots.length - 1);
      const nextHourSnap = snapshots[nextHourIndex];
      const continuationMove = nextHourSnap ? nextHourSnap.niftyLtp - fifteenMinSnap.niftyLtp : openingMove;
      
      return {
        id: `strong_opening_${archive.date}`,
        name: 'Strong Opening',
        description: 'Powerful directional move in first 15 minutes',
        timestamps: [new Date(archive.date).getTime()],
        conditions: {
          timeWindow: '09:15-09:30',
          niftyMoveRange: { min: Math.abs(openingMove) - 10, max: Math.abs(openingMove) + 10 }
        },
        outcome: {
          nextHourMove: continuationMove,
          reliability: 0,
          sampleSize: 1,
          avgDuration: 60
        },
        confidence: 50,
        lastSeen: archive.date,
        occurrences: 1
      };
    }
    
    return null;
  }

  /**
   * Private: Detect Sentiment Surge pattern
   */
  private detectSentimentSurge(archive: DailyArchive): Pattern | null {
    const snapshots = archive.snapshots;
    if (snapshots.length < 20) return null;
    
    // Check for sudden sentiment surge (>50 points change in 20 minutes)
    for (let i = 0; i < snapshots.length - 20; i++) {
      const startSnap = snapshots[i];
      const endSnap = snapshots[i + 20];
      
      const sentimentChange = Math.abs(endSnap.overallSent - startSnap.overallSent);
      
      if (sentimentChange > 50) {
        const priceMove = endSnap.niftyLtp - startSnap.niftyLtp;
        const nextIndex = Math.min(i + 40, snapshots.length - 1);
        const nextSnap = snapshots[nextIndex];
        const followThrough = nextSnap ? nextSnap.niftyLtp - endSnap.niftyLtp : priceMove;
        
        return {
          id: `sentiment_surge_${archive.date}`,
          name: 'Sentiment Surge',
          description: 'Rapid sentiment change indicates strong momentum',
          timestamps: [new Date(archive.date).getTime()],
          conditions: {
            sentimentShift: sentimentChange * (endSnap.overallSent > startSnap.overallSent ? 1 : -1)
          },
          outcome: {
            nextHourMove: followThrough,
            reliability: 0,
            sampleSize: 1,
            avgDuration: 20
          },
          confidence: 50,
          lastSeen: archive.date,
          occurrences: 1
        };
      }
    }
    
    return null;
  }
}

// Singleton instance
export const patternMiner = new PatternMiner();
