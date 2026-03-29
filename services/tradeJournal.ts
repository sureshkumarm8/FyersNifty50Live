/**
 * TRADE JOURNAL SERVICE
 * Persistent storage and analytics for trade history
 */

import { dbService } from './db';

export interface Trade {
  id: string;
  timestamp: number;
  symbol: string;
  strikePrice: number;
  optionType: 'CE' | 'PE';
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercent: number;
  commission: number;
  netPnl: number;
  exitReason: 'TARGET' | 'STOPLOSS' | 'MANUAL' | 'EOD' | 'TRAILING';
  setup: TradeSetupInfo;
  execution: TradeExecutionInfo;
  maxAdverseExcursion: number; // MAE - worst drawdown during trade
  maxFavorableExcursion: number; // MFE - best profit during trade
  tags: string[];
  notes?: string;
}

export interface TradeSetupInfo {
  signalConfidence: number;
  entryReason: string[];
  marketCondition: string;
  volatility: number;
  trendAlignment: boolean;
  riskReward: number;
}

export interface TradeExecutionInfo {
  slippage: number;
  fillTime: number; // milliseconds to fill
  holdTime: number; // milliseconds in trade
  maxProfit: number;
  maxLoss: number;
  targetHit: boolean;
  stopLossHit: boolean;
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  avgWinLossRatio: number;
  largestWin: number;
  largestLoss: number;
  totalPnl: number;
  totalCommission: number;
  netPnl: number;
  expectancy: number; // Expected value per trade
  profitFactor: number; // Gross profit / Gross loss
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgHoldTime: number; // minutes
  avgMAE: number;
  avgMFE: number;
}

export interface DailyStats {
  date: string;
  trades: number;
  pnl: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
}

/**
 * TRADE JOURNAL CLASS
 */
export class TradeJournal {
  private trades: Trade[] = [];
  private dbKey = 'trade_journal';

  constructor() {
    this.loadFromDB();
  }

  /**
   * LOAD TRADES FROM INDEXEDDB
   */
  private async loadFromDB() {
    try {
      await dbService.init();
      const stored = await dbService.getItem(this.dbKey);
      if (stored) {
        this.trades = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load trade journal:', e);
    }
  }

  /**
   * SAVE TRADES TO INDEXEDDB
   */
  private async saveToDB() {
    try {
      await dbService.setItem(this.dbKey, JSON.stringify(this.trades));
    } catch (e) {
      console.error('Failed to save trade journal:', e);
    }
  }

  /**
   * ADD NEW TRADE
   */
  public async addTrade(trade: Trade) {
    this.trades.push(trade);
    await this.saveToDB();
  }

  /**
   * GET ALL TRADES
   */
  public getAllTrades(): Trade[] {
    return [...this.trades].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * GET TRADES BY DATE RANGE
   */
  public getTradesByDateRange(startDate: Date, endDate: Date): Trade[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return this.trades.filter(t => t.timestamp >= start && t.timestamp <= end);
  }

  /**
   * GET TRADES BY TAG
   */
  public getTradesByTag(tag: string): Trade[] {
    return this.trades.filter(t => t.tags.includes(tag));
  }

  /**
   * GET TODAY'S TRADES
   */
  public getTodayTrades(): Trade[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getTradesByDateRange(today, tomorrow);
  }

  /**
   * CALCULATE OVERALL STATISTICS
   */
  public calculateStats(trades?: Trade[]): TradeStats {
    const data = trades || this.trades;
    
    if (data.length === 0) {
      return this.getEmptyStats();
    }

    const winners = data.filter(t => t.netPnl > 0);
    const losers = data.filter(t => t.netPnl < 0);

    const totalPnl = data.reduce((sum, t) => sum + t.pnl, 0);
    const totalCommission = data.reduce((sum, t) => sum + t.commission, 0);
    const netPnl = data.reduce((sum, t) => sum + t.netPnl, 0);

    const grossProfit = winners.reduce((sum, t) => sum + t.netPnl, 0);
    const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.netPnl, 0));

    const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;

    const winRate = (winners.length / data.length) * 100;
    const expectancy = (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss);
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Sharpe Ratio calculation
    const returns = data.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

    // Max Drawdown
    let peak = 0;
    let maxDD = 0;
    let runningPnl = 0;
    
    data.forEach(t => {
      runningPnl += t.netPnl;
      if (runningPnl > peak) peak = runningPnl;
      const dd = peak - runningPnl;
      if (dd > maxDD) maxDD = dd;
    });

    const maxDrawdownPercent = peak > 0 ? (maxDD / peak) * 100 : 0;

    // Average hold time
    const avgHoldTime = data.reduce((sum, t) => sum + t.execution.holdTime, 0) / data.length / 60000;

    return {
      totalTrades: data.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate,
      avgWin,
      avgLoss,
      avgWinLossRatio: avgLoss > 0 ? avgWin / avgLoss : 0,
      largestWin: winners.length > 0 ? Math.max(...winners.map(t => t.netPnl)) : 0,
      largestLoss: losers.length > 0 ? Math.min(...losers.map(t => t.netPnl)) : 0,
      totalPnl,
      totalCommission,
      netPnl,
      expectancy,
      profitFactor,
      sharpeRatio,
      maxDrawdown: maxDD,
      maxDrawdownPercent,
      avgHoldTime,
      avgMAE: data.reduce((sum, t) => sum + t.maxAdverseExcursion, 0) / data.length,
      avgMFE: data.reduce((sum, t) => sum + t.maxFavorableExcursion, 0) / data.length
    };
  }

  /**
   * GET DAILY STATS
   */
  public getDailyStats(days: number = 30): DailyStats[] {
    const stats: DailyStats[] = [];
    const now = Date.now();

    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTrades = this.getTradesByDateRange(date, nextDate);
      
      if (dayTrades.length > 0) {
        const dayStats = this.calculateStats(dayTrades);
        stats.push({
          date: date.toISOString().split('T')[0],
          trades: dayTrades.length,
          pnl: dayStats.netPnl,
          winRate: dayStats.winRate,
          bestTrade: dayStats.largestWin,
          worstTrade: dayStats.largestLoss
        });
      }
    }

    return stats.reverse();
  }

  /**
   * GET WIN RATE BY SETUP TYPE
   */
  public getWinRateBySetup(): Record<string, { trades: number; winRate: number; avgPnl: number }> {
    const setupStats: Record<string, Trade[]> = {};

    this.trades.forEach(t => {
      const setupType = t.setup.marketCondition;
      if (!setupStats[setupType]) {
        setupStats[setupType] = [];
      }
      setupStats[setupType].push(t);
    });

    const result: Record<string, { trades: number; winRate: number; avgPnl: number }> = {};

    Object.entries(setupStats).forEach(([setup, trades]) => {
      const stats = this.calculateStats(trades);
      result[setup] = {
        trades: trades.length,
        winRate: stats.winRate,
        avgPnl: stats.netPnl / trades.length
      };
    });

    return result;
  }

  /**
   * EXPORT TO CSV
   */
  public exportToCSV(): string {
    const headers = [
      'Date',
      'Time',
      'Symbol',
      'Strike',
      'Type',
      'Side',
      'Entry',
      'Exit',
      'Qty',
      'P&L',
      'P&L%',
      'Commission',
      'Net P&L',
      'Exit Reason',
      'Hold Time (min)',
      'Confidence',
      'R:R'
    ];

    const rows = this.trades.map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      new Date(t.timestamp).toLocaleTimeString(),
      t.symbol,
      t.strikePrice,
      t.optionType,
      t.side,
      t.entryPrice.toFixed(2),
      t.exitPrice.toFixed(2),
      t.quantity,
      t.pnl.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.commission.toFixed(2),
      t.netPnl.toFixed(2),
      t.exitReason,
      (t.execution.holdTime / 60000).toFixed(1),
      t.setup.signalConfidence,
      t.setup.riskReward.toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }

  /**
   * DELETE TRADE
   */
  public async deleteTrade(tradeId: string) {
    this.trades = this.trades.filter(t => t.id !== tradeId);
    await this.saveToDB();
  }

  /**
   * CLEAR ALL TRADES
   */
  public async clearAll() {
    this.trades = [];
    await this.saveToDB();
  }

  private getEmptyStats(): TradeStats {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      avgWinLossRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      totalPnl: 0,
      totalCommission: 0,
      netPnl: 0,
      expectancy: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      avgHoldTime: 0,
      avgMAE: 0,
      avgMFE: 0
    };
  }
}

// Singleton instance
export const tradeJournal = new TradeJournal();
