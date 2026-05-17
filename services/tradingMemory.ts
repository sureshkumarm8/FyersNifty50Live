/**
 * TRADING MEMORY SERVICE
 * 
 * Stores and learns from trading patterns and predictions
 * Acts as the "custom model" memory database
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TradingPattern {
  id: string;
  timestamp: number;
  marketState: {
    niftyLTP: number;
    sentiment: number;
    stockSent: number;
    optionSent: number;
    pcr: number;
    timeOfDay: string;
    volatility: number;
    bullishCount: number;
    bearishCount: number;
  };
  prediction: {
    direction: 'UP' | 'DOWN' | 'SIDEWAYS';
    confidence: number;
    expectedMove: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasoning: string;
  };
  outcome?: {
    actualMove: number;
    correct: boolean;
    profitLoss?: number;
    duration?: number;
  };
  features: string[];
}

interface TradingMemoryDB extends DBSchema {
  tradingPatterns: {
    key: string;
    value: TradingPattern;
    indexes: {
      'by-timestamp': number;
      'by-correct': boolean;
      'by-confidence': number;
    };
  };
}

export class TradingMemory {
  private dbName = 'FyersNifty50Live';
  private dbVersion = 3; // Increment version to add new store
  private db: IDBPDatabase<TradingMemoryDB> | null = null;
  
  /**
   * Initialize database
   */
  private async getDB(): Promise<IDBPDatabase<TradingMemoryDB>> {
    if (this.db) return this.db;
    
    this.db = await openDB<TradingMemoryDB>(this.dbName, this.dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create tradingPatterns store if it doesn't exist
        if (!db.objectStoreNames.contains('tradingPatterns')) {
          const store = db.createObjectStore('tradingPatterns', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
          store.createIndex('by-correct', 'outcome.correct');
          store.createIndex('by-confidence', 'prediction.confidence');
          console.log('✅ Created tradingPatterns object store');
        }
      }
    });
    
    return this.db;
  }
  
  /**
   * Save a trading pattern to memory
   */
  async savePattern(pattern: TradingPattern): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('tradingPatterns', pattern);
      console.log('✅ Pattern saved to memory:', pattern.id);
    } catch (error) {
      console.error('Failed to save pattern:', error);
      throw error;
    }
  }
  
  /**
   * Find similar patterns from memory
   */
  async findSimilarPatterns(
    currentState: {
      niftyLTP: number;
      sentiment: number;
      pcr: number;
      volatility?: number;
    },
    limit = 10
  ): Promise<TradingPattern[]> {
    try {
      const db = await this.getDB();
      const allPatterns = await db.getAll('tradingPatterns');
      
      // Calculate similarity scores
      const scored = allPatterns.map(pattern => ({
        pattern,
        score: this.calculateSimilarity(currentState, pattern.marketState)
      }));
      
      // Sort by similarity and return top matches
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.pattern);
    } catch (error) {
      console.error('Failed to find similar patterns:', error);
      return [];
    }
  }
  
  /**
   * Get patterns that were correct (for learning)
   */
  async getSuccessfulPatterns(minConfidence = 70): Promise<TradingPattern[]> {
    try {
      const db = await this.getDB();
      const allPatterns = await db.getAll('tradingPatterns');
      
      return allPatterns.filter(p => 
        p.outcome?.correct && 
        p.prediction.confidence >= minConfidence
      );
    } catch (error) {
      console.error('Failed to get successful patterns:', error);
      return [];
    }
  }
  
  /**
   * Get learning statistics
   */
  async getStats(): Promise<{
    totalPatterns: number;
    correctPredictions: number;
    accuracy: string;
    avgConfidence: string;
    recentAccuracy: string;
  }> {
    try {
      const db = await this.getDB();
      const allPatterns = await db.getAll('tradingPatterns');
      
      const withOutcomes = allPatterns.filter(p => p.outcome);
      const correct = withOutcomes.filter(p => p.outcome?.correct).length;
      const total = withOutcomes.length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      
      const avgConfidence = allPatterns.length > 0
        ? allPatterns.reduce((sum, p) => sum + p.prediction.confidence, 0) / allPatterns.length
        : 0;
      
      // Recent accuracy (last 20 predictions)
      const recent = withOutcomes.slice(-20);
      const recentCorrect = recent.filter(p => p.outcome?.correct).length;
      const recentAccuracy = recent.length > 0 ? (recentCorrect / recent.length) * 100 : 0;
      
      return {
        totalPatterns: allPatterns.length,
        correctPredictions: correct,
        accuracy: accuracy.toFixed(2),
        avgConfidence: avgConfidence.toFixed(2),
        recentAccuracy: recentAccuracy.toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalPatterns: 0,
        correctPredictions: 0,
        accuracy: '0',
        avgConfidence: '0',
        recentAccuracy: '0'
      };
    }
  }
  
  /**
   * Update pattern with actual outcome
   */
  async recordOutcome(
    patternId: string,
    actualMove: number,
    correct: boolean,
    profitLoss?: number
  ): Promise<void> {
    try {
      const db = await this.getDB();
      const pattern = await db.get('tradingPatterns', patternId);
      
      if (pattern) {
        pattern.outcome = {
          actualMove,
          correct,
          profitLoss,
          duration: Date.now() - pattern.timestamp
        };
        
        await db.put('tradingPatterns', pattern);
        console.log(`📊 Outcome recorded: ${correct ? '✅ Correct' : '❌ Wrong'} - Move: ${actualMove}`);
      }
    } catch (error) {
      console.error('Failed to record outcome:', error);
    }
  }
  
  /**
   * Clear old patterns (keep last 60 days)
   */
  async cleanupOldPatterns(): Promise<number> {
    try {
      const db = await this.getDB();
      const allPatterns = await db.getAll('tradingPatterns');
      
      const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
      const toDelete = allPatterns.filter(p => p.timestamp < sixtyDaysAgo);
      
      for (const pattern of toDelete) {
        await db.delete('tradingPatterns', pattern.id);
      }
      
      console.log(`🗑️ Cleaned up ${toDelete.length} old patterns`);
      return toDelete.length;
    } catch (error) {
      console.error('Failed to cleanup patterns:', error);
      return 0;
    }
  }
  
  /**
   * Calculate similarity between current state and historical pattern
   */
  private calculateSimilarity(
    current: { niftyLTP: number; sentiment: number; pcr: number; volatility?: number },
    historical: TradingPattern['marketState']
  ): number {
    
    const features = [
      Math.abs(current.sentiment - historical.sentiment) / 200,  // Max diff = 200
      Math.abs(current.pcr - historical.pcr) / 2,                // PCR typically 0-3
      Math.abs(current.niftyLTP - historical.niftyLTP) / 500,    // ±500 pts
      current.volatility !== undefined 
        ? Math.abs(current.volatility - historical.volatility) / 50 
        : 0
    ];
    
    // Calculate Euclidean distance
    const distance = Math.sqrt(features.reduce((sum, diff) => sum + diff * diff, 0));
    
    // Convert to similarity (0 = identical, 1 = very different)
    const similarity = 1 / (1 + distance);
    
    return similarity;
  }
  
  /**
   * Export patterns for analysis
   */
  async exportPatterns(): Promise<TradingPattern[]> {
    try {
      const db = await this.getDB();
      return await db.getAll('tradingPatterns');
    } catch (error) {
      console.error('Failed to export patterns:', error);
      return [];
    }
  }
}

// Singleton instance
export const tradingMemory = new TradingMemory();
