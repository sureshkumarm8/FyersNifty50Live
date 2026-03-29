/**
 * PATTERN MINER SERVICE
 * 
 * Analyzes historical data to discover recurring market patterns
 * - Scans archives for similar setups
 * - Calculates pattern reliability and outcomes
 * - Stores learned patterns in IndexedDB
 */

import { dbService } from './db';
import { DailyArchive, MarketSnapshot, Pattern, PatternConditions, PatternOutcome } from '../types';

export class PatternMiner {
  
  /**
   * Analyze a specific day and find patterns
   */
  async analyzeDay(date: string): Promise<Pattern[]> {
    const archive = await dbService.getArchive(date);
    if (!archive) return [];
    
    const patterns: Pattern[] = [];
    
    // Pattern 1: Morning Reversal (9:30-10:30)
    const morningReversal = this.detectMorningReversal(archive);
    if (morningReversal) patterns.push(morningReversal);
    
    // Pattern 2: Trend Continuation
    const trendContinuation = this.detectTrendContinuation(archive);
    if (trendContinuation) patterns.push(trendContinuation);
    
    // Save discovered patterns
    for (const pattern of patterns) {
      await this.updateOrCreatePattern(pattern);
    }
    
    return patterns;
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
   * Private: Detect Morning Reversal pattern
   */
  private detectMorningReversal(archive: DailyArchive): Pattern | null {
    const snapshots = archive.snapshots;
    if (snapshots.length < 75) return null; // Need at least 75 minutes
    
    // Get morning window (9:30-10:30 = index 15 to 75)
    const morningSnaps = snapshots.slice(15, 75);
    if (morningSnaps.length === 0) return null;
    
    const firstSnap = morningSnaps[0];
    const lastSnap = morningSnaps[morningSnaps.length - 1];
    
    // Detect reversal: Sentiment goes from -30 to +30
    if (firstSnap.overallSent < -30 && lastSnap.overallSent > 30) {
      const sentimentShift = lastSnap.overallSent - firstSnap.overallSent;
      const priceMove = lastSnap.niftyLtp - firstSnap.niftyLtp;
      
      // Calculate next hour move
      const elevenThirtySnap = snapshots[120]; // 11:30 AM
      const nextHourMove = elevenThirtySnap ? elevenThirtySnap.niftyLtp - lastSnap.niftyLtp : 0;
      
      return {
        id: `morning_reversal_${archive.date}`,
        name: 'Morning Reversal',
        description: 'Sentiment reverses from bearish to bullish in first hour',
        timestamps: [new Date(archive.date).getTime()],
        conditions: {
          timeWindow: '09:30-10:30',
          sentimentShift,
          niftyMoveRange: { min: priceMove - 10, max: priceMove + 10 }
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
}

// Singleton instance
export const patternMiner = new PatternMiner();
