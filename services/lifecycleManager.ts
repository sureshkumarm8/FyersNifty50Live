/**
 * DATA LIFECYCLE MANAGER
 * 
 * Manages the daily lifecycle of trading data:
 * - Morning setup: Archive yesterday, clear today
 * - EOD cleanup: Archive today, mine patterns, save CSV
 * - Auto-scheduling via background workers
 */

import { dbService } from './db';
import { DailyArchive, DailySummary, DailyMetadata, MarketSnapshot, SessionHistoryMap } from '../types';
import { tradeJournal } from './tradeJournal';
import { downloadCSV } from './csv';

export class DataLifecycleManager {
  private autoArchiveInterval: NodeJS.Timeout | null = null;
  private onArchiveCallback?: (message: string) => void;

  /**
   * Set callback for archive notifications
   */
  setArchiveCallback(callback: (message: string) => void): void {
    this.onArchiveCallback = callback;
  }

  /**
   * Morning Setup Routine
   * Runs automatically when new day is detected
   */
  async morningSetup(): Promise<{
    isNewDay: boolean;
    previousClose: number | null;
    archivedDate: string | null;
    snapshotCount: number;
  }> {
    console.log('🌅 Running morning setup...');
    
    const today = new Date().toDateString();
    const yesterday = this.getYesterday();
    
    // Step 1: Check if we have yesterday's data to archive
    const yesterdaySnapshots = await dbService.getTodaySnapshots();
    let archivedDate: string | null = null;
    let snapshotCount = 0;
    
    if (yesterdaySnapshots.length > 0) {
      console.log(`📦 Archiving ${yesterday}: ${yesterdaySnapshots.length} snapshots`);
      
      const yesterdaySession = await dbService.getTodaySession();
      const archive = await this.createDailyArchive(yesterday, yesterdaySnapshots, yesterdaySession);
      
      await dbService.archiveDailyData(yesterday, archive);
      archivedDate = yesterday;
      snapshotCount = yesterdaySnapshots.length;
      
      console.log(`✅ Archived ${yesterday}`);
    }
    
    // Step 2: Clear TODAY's stores (fresh start)
    await dbService.clearTodayStores();
    console.log('✅ Today\'s session reset - Clean slate');
    
    // Step 3: Set metadata
    await dbService.setMeta('current_session_date', today);
    await dbService.setMeta('session_start', Date.now());
    
    // Step 4: Get previous close
    const lastArchive = await dbService.getArchive(yesterday);
    const previousClose = lastArchive?.summary.close || null;
    
    // Step 5: Cleanup old archives (keep last 90 days)
    const deletedCount = await dbService.pruneOldArchives(90);
    if (deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedCount} old archive(s)`);
    }
    
    console.log('✅ Morning setup complete');
    
    return {
      isNewDay: true,
      previousClose,
      archivedDate,
      snapshotCount
    };
  }

  /**
   * End of Day Cleanup
   * Archives today's data and runs pattern mining
   */
  async endOfDayCleanup(): Promise<void> {
    console.log('🌙 Running EOD cleanup...');
    
    const today = new Date().toDateString();
    
    // Step 1: Get all today's data
    const todaySnapshots = await dbService.getTodaySnapshots();
    const todaySession = await dbService.getTodaySession();
    
    if (todaySnapshots.length === 0) {
      console.log('⚠️ No data to archive');
      if (this.onArchiveCallback) {
        this.onArchiveCallback('⚠️ No data to archive today');
      }
      return;
    }
    
    // Step 2: Create archive
    const archive = await this.createDailyArchive(today, todaySnapshots, todaySession);
    
    // Step 3: Save archive to IndexedDB
    await dbService.archiveDailyData(today, archive);
    console.log(`✅ Archived ${today}: ${todaySnapshots.length} snapshots`);
    
    // Step 4: Auto-save CSV with sentiment & momentum history
    this.autoSaveDailyCSV(today, todaySnapshots);
    
    // Notify user
    if (this.onArchiveCallback) {
      this.onArchiveCallback(`📦 Archived ${today} - ${todaySnapshots.length} snapshots saved for pattern building`);
    }
    
    // Step 5: Pattern mining will be done separately by PatternMiner
    
    console.log('✅ EOD cleanup complete');
  }

  /**
   * Create Daily Archive from snapshots and session data
   */
  private async createDailyArchive(
    date: string, 
    snapshots: MarketSnapshot[], 
    sessionData: SessionHistoryMap
  ): Promise<DailyArchive> {
    const summary = this.calculateDailySummary(snapshots, sessionData);
    const metadata = await this.calculateDailyMetadata(snapshots);
    
    return {
      date,
      snapshots,
      sessionData,
      summary,
      metadata
    };
  }

  /**
   * Calculate daily summary statistics
   */
  private calculateDailySummary(snapshots: MarketSnapshot[], sessionData: SessionHistoryMap): DailySummary {
    if (snapshots.length === 0) {
      return {
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        totalVolume: 0,
        dominantSentiment: 0,
        avgPCR: 0,
        topPerformer: '',
        worstPerformer: '',
        range: 0,
        volatility: 0
      };
    }
    
    const prices = snapshots.map(s => s.niftyLtp);
    const open = snapshots[0].niftyLtp;
    const close = snapshots[snapshots.length - 1].niftyLtp;
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    
    // Calculate volatility (standard deviation)
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);
    
    // Average sentiment and PCR
    const avgSentiment = snapshots.reduce((sum, s) => sum + s.overallSent, 0) / snapshots.length;
    const avgPCR = snapshots.reduce((sum, s) => sum + s.pcr, 0) / snapshots.length;
    
    // Find top/worst performers from session data
    let topPerformer = '';
    let worstPerformer = '';
    let maxGain = -Infinity;
    let maxLoss = Infinity;
    
    Object.entries(sessionData).forEach(([symbol, candles]) => {
      if (candles.length > 0) {
        const firstCandle = candles[0];
        const lastCandle = candles[candles.length - 1];
        const change = ((lastCandle.lp - firstCandle.lp) / firstCandle.lp) * 100;
        
        if (change > maxGain) {
          maxGain = change;
          topPerformer = symbol;
        }
        if (change < maxLoss) {
          maxLoss = change;
          worstPerformer = symbol;
        }
      }
    });
    
    return {
      open,
      high,
      low,
      close,
      totalVolume: 0, // Can be enhanced with actual volume data
      dominantSentiment: avgSentiment,
      avgPCR,
      topPerformer,
      worstPerformer,
      range,
      volatility
    };
  }

  /**
   * Calculate daily metadata (trades, P&L, etc.)
   */
  private async calculateDailyMetadata(snapshots: MarketSnapshot[]): Promise<DailyMetadata> {
    const todayTrades = tradeJournal.getTodayTrades();
    const stats = tradeJournal.calculateStats();
    
    return {
      totalTrades: todayTrades.length,
      pnl: stats?.totalPnL || 0,
      winRate: stats?.winRate || 0,
      patterns: [] // Will be filled by PatternMiner
    };
  }

  /**
   * Setup auto-archive at market close (3:45 PM IST)
   */
  setupAutoArchive(): void {
    // Check every minute if it's time to archive
    this.autoArchiveInterval = setInterval(async () => {
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hour = istTime.getHours();
      const min = istTime.getMinutes();
      
      // 3:45 PM IST (15:45)
      if (hour === 15 && min === 45) {
        console.log('🕐 Auto-archive triggered at 3:45 PM');
        try {
          await this.endOfDayCleanup();
        } catch (error) {
          console.error('❌ Auto-archive failed:', error);
        }
      }
    }, 60000); // Check every minute
    
    console.log('⏰ Auto-archive scheduled for 3:45 PM IST');
  }

  /**
   * Stop auto-archive
   */
  stopAutoArchive(): void {
    if (this.autoArchiveInterval) {
      clearInterval(this.autoArchiveInterval);
      this.autoArchiveInterval = null;
      console.log('⏹️ Auto-archive stopped');
    }
  }

  /**
   * Get yesterday's date string
   */
  private getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  }

  /**
   * Check if today is a new trading day
   */
  async isNewTradingDay(): Promise<boolean> {
    const today = new Date().toDateString();
    const savedDate = await dbService.getMeta('current_session_date');
    return savedDate !== today;
  }

  /**
   * Auto-save daily CSV with sentiment & momentum history
   */
  private autoSaveDailyCSV(date: string, snapshots: MarketSnapshot[]): void {
    try {
      // Prepare CSV data with sentiment and momentum
      const csvData = snapshots.map((snapshot, index) => ({
        timestamp: new Date(snapshot.timestamp).toISOString(),
        time: new Date(snapshot.timestamp).toLocaleTimeString('en-IN', { hour12: false }),
        niftyLTP: snapshot.niftyLtp,
        change: snapshot.niftyChange || 0,
        changePercent: snapshot.niftyChangePercent || 0,
        sentiment: snapshot.overallSent || 0,
        pcr: snapshot.pcr || 0,
        callOI: snapshot.callOI || 0,
        putOI: snapshot.putOI || 0,
        vix: snapshot.vix || 0,
        bullishStocks: snapshot.bullishCount || 0,
        bearishStocks: snapshot.bearishCount || 0,
        advanceDecline: (snapshot.bullishCount || 0) - (snapshot.bearishCount || 0),
        momentum: index > 0 ? snapshot.niftyLtp - snapshots[index - 1].niftyLtp : 0,
        cumulativeMomentum: snapshots.slice(0, index + 1).reduce((sum, s, i) => {
          if (i === 0) return 0;
          return sum + (s.niftyLtp - snapshots[i - 1].niftyLtp);
        }, 0)
      }));

      // Format date for filename
      const dateObj = new Date(date);
      const dateStr = dateObj.toISOString().slice(0, 10);
      
      // Auto-download CSV
      downloadCSV(csvData, `nifty_sentiment_momentum_${dateStr}`);
      
      console.log(`✅ CSV auto-saved: ${csvData.length} records for ${date}`);
    } catch (error) {
      console.error('Failed to auto-save CSV:', error);
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<{
    totalDays: number;
    oldestDate: string | null;
    newestDate: string | null;
    totalSnapshots: number;
  }> {
    const archives = await dbService.getAllArchives();
    
    if (archives.length === 0) {
      return {
        totalDays: 0,
        oldestDate: null,
        newestDate: null,
        totalSnapshots: 0
      };
    }
    
    const sorted = archives.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const totalSnapshots = archives.reduce((sum, a) => sum + a.snapshots.length, 0);
    
    return {
      totalDays: archives.length,
      oldestDate: sorted[0].date,
      newestDate: sorted[sorted.length - 1].date,
      totalSnapshots
    };
  }
}

// Singleton instance
export const lifecycleManager = new DataLifecycleManager();
