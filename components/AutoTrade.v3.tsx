/**
 * AUTOTRADE - PROFESSIONAL EDITION
 * Advanced algorithmic trading system with real broker integration
 * 
 * Features:
 * - Multi-factor signal generation
 * - Kelly Criterion position sizing
 * - Circuit breakers & risk management
 * - Paper/Live trading modes
 * - Trade journal & analytics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, BarChart3, TrendingUp, TrendingDown, Target, Shield,
  DollarSign, Activity, AlertCircle, CheckCircle, Brain, Zap, Eye
} from 'lucide-react';
import { FyersCredentials, EnrichedFyersQuote, MarketSnapshot, PivotPoints } from '../types';
import { TradingEngine, TradingSignal, TradeSetup } from '../services/tradingEngine';
import { OrderManager, Position, Order } from '../services/orderManager';
import { tradeJournal, Trade, TradeStats } from '../services/tradeJournal';
import { getNextExpiryDate, getFormattedExpiryDate } from '../constants/niftyExpiryDates';

type TradeMode = 'PAPER' | 'LIVE';
type SystemStatus = 'IDLE' | 'MONITORING' | 'SIGNAL_GENERATED' | 'IN_TRADE' | 'PAUSED';

interface AutoTradeState {
  status: SystemStatus;
  tradingMode: TradeMode;
  isMonitoring: boolean;
}

interface AutoTradeProps {
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  aiEnabled: boolean;
}

const AutoTrade: React.FC<AutoTradeProps> = ({
  credentials,
  stocks,
  niftyLtp,
  historyLog,
  pivots,
  aiEnabled
}) => {
  const [state, setState] = useState<AutoTradeState>({
    status: 'IDLE',
    tradingMode: 'PAPER',
    isMonitoring: false
  });

  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [accountStatus, setAccountStatus] = useState({
    currentEquity: 100000,
    peakEquity: 100000,
    dailyLoss: 0,
    currentDrawdown: 0,
    canTrade: true
  });

  // Service Refs
  const engineRef = useRef<TradingEngine | null>(null);
  const orderManagerRef = useRef<OrderManager | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSignalTimeRef = useRef<number>(0);

  // Initialize services
  useEffect(() => {
    const initialCapital = 100000;
    
    if (!engineRef.current) {
      engineRef.current = new TradingEngine(initialCapital, {
        maxCapitalPerTrade: 2,
        maxDailyLoss: 3000,
        maxDrawdown: 10,
        maxPositions: 2,
        minRiskReward: 1.5,
        maxLeverage: 3
      });
    }

    if (!orderManagerRef.current) {
      orderManagerRef.current = new OrderManager(credentials, state.tradingMode === 'PAPER');
    }

    // Load trade stats
    const stats = tradeJournal.calculateStats();
    setTradeStats(stats);
    setRecentTrades(tradeJournal.getTodayTrades());
  }, [credentials, state.tradingMode]);

  // Add log
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setAnalysisLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  }, []);

  // Generate Trading Signal
  const analyzeMarket = useCallback(() => {
    if (!engineRef.current || !niftyLtp || historyLog.length < 15) return;

    const now = Date.now();
    // Throttle to once per minute
    if (now - lastSignalTimeRef.current < 60000) return;
    lastSignalTimeRef.current = now;

    const signal = engineRef.current.generateSignal(niftyLtp, historyLog, stocks, pivots);
    setCurrentSignal(signal);

    if (signal.type === 'ENTRY' && signal.confidence >= 70) {
      addLog(`🎯 ${signal.direction} Signal | Confidence: ${signal.confidence}%`);
      signal.reasons.forEach(r => addLog(`  • ${r}`));
      setState(prev => ({ ...prev, status: 'SIGNAL_GENERATED' }));
    } else {
      addLog(`📊 Analysis: ${signal.direction} (${signal.confidence}%) - Waiting for confluence`);
    }

    // Update account status
    const status = engineRef.current.getStatus();
    setAccountStatus(status);
  }, [niftyLtp, historyLog, stocks, pivots, addLog]);

  // Execute Trade from Signal
  const executeTrade = useCallback(async () => {
    if (!currentSignal || !orderManagerRef.current || !engineRef.current || !niftyLtp) return;

    try {
      addLog('🚀 Preparing trade execution...');

      // Calculate strike (ITM by 200-300 points)
      const atmStrike = Math.round(niftyLtp / 50) * 50;
      const itmAmount = 250;
      const strikePrice = currentSignal.direction === 'LONG'
        ? atmStrike - itmAmount
        : atmStrike + itmAmount;

      const optionType = currentSignal.direction === 'LONG' ? 'CE' : 'PE';

      // Estimate option price (simplified)
      const estimatedPrice = itmAmount + Math.abs(niftyLtp - strikePrice);
      const entryPrice = Math.max(estimatedPrice * 0.8, itmAmount * 0.5);

      // Calculate targets (2x ATR)
      const atr = currentSignal.metrics.volatility * niftyLtp * 0.01;
      const targetPoints = atr * 2;
      const stopPoints = atr * 1.5;

      const targetPrice = entryPrice + targetPoints;
      const stopLossPrice = entryPrice - stopPoints;
      const riskReward = targetPoints / stopPoints;

      // Calculate position size
      const positionSize = engineRef.current.calculatePositionSize(
        currentSignal,
        entryPrice,
        stopLossPrice,
        tradeStats?.winRate || 55,
        tradeStats?.avgWinLossRatio || 1.5
      );

      addLog(`💰 Position Size: ${positionSize} lots | R:R = ${riskReward.toFixed(2)}`);

      // Get expiry
      const nextExpiry = getNextExpiryDate();
      const expiryDate = nextExpiry ? nextExpiry.date : '';

      // Place order
      const symbol = `NSE:NIFTY${expiryDate}${strikePrice}${optionType}`;
      const result = await orderManagerRef.current.placeOrder(
        symbol,
        'BUY',
        positionSize,
        'MARKET',
        entryPrice
      );

      if (result.success) {
        addLog(`✅ Order placed: ${strikePrice} ${optionType} @ ₹${entryPrice.toFixed(2)}`);
        setState(prev => ({ ...prev, status: 'IN_TRADE' }));
        
        // Update positions
        const positions = orderManagerRef.current.getPositions();
        setActivePositions(positions);
      } else {
        addLog(`❌ Order failed: ${result.message}`);
      }

      setCurrentSignal(null);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    }
  }, [currentSignal, niftyLtp, tradeStats, addLog]);

  // Monitor Positions
  const monitorPositions = useCallback(async () => {
    if (!orderManagerRef.current || !niftyLtp) return;

    const positions = orderManagerRef.current.getPositions();
    setActivePositions(positions);

    // Update P&L for each position
    positions.forEach(pos => {
      orderManagerRef.current?.updatePositionPnL(pos.symbol, niftyLtp);
    });

    // Check exit conditions for positions
    // (In real scenario, would use actual option prices)
  }, [niftyLtp]);

  // Main monitoring loop
  useEffect(() => {
    if (!state.isMonitoring) {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      return;
    }

    // Run analysis every minute (aligned with data refresh)
    monitorIntervalRef.current = setInterval(() => {
      analyzeMarket();
      monitorPositions();
    }, 60000); // Every 1 minute to match app data collection

    // Initial run
    analyzeMarket();

    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    };
  }, [state.isMonitoring, analyzeMarket, monitorPositions]);

  // Toggle monitoring
  const toggleMonitoring = () => {
    setState(prev => ({
      ...prev,
      isMonitoring: !prev.isMonitoring,
      status: !prev.isMonitoring ? 'MONITORING' : 'IDLE'
    }));
    addLog(state.isMonitoring ? '🔴 Monitoring stopped' : '🟢 Monitoring started');
  };

  // Toggle trading mode
  const toggleTradingMode = () => {
    const newMode = state.tradingMode === 'PAPER' ? 'LIVE' : 'PAPER';
    setState(prev => ({ ...prev, tradingMode: newMode }));
    if (orderManagerRef.current) {
      orderManagerRef.current.setPaperTrading(newMode === 'PAPER');
    }
    addLog(`🔄 Switched to ${newMode} trading mode`);
  };

  // Close all positions
  const closeAllPositions = async () => {
    if (!orderManagerRef.current) return;
    
    if (!confirm('Close all open positions?')) return;

    addLog('🛑 Closing all positions...');
    const results = await orderManagerRef.current.closeAllPositions();
    results.forEach(r => {
      addLog(r.success ? '✅ Position closed' : `❌ ${r.message}`);
    });
    setActivePositions([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none glass-header border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="text-purple-400" size={24} />
              AutoTrade Pro
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              state.status === 'MONITORING' ? 'bg-blue-500/20 text-blue-300' :
              state.status === 'SIGNAL_GENERATED' ? 'bg-yellow-500/20 text-yellow-300' :
              state.status === 'IN_TRADE' ? 'bg-green-500/20 text-green-300' :
              'bg-slate-500/20 text-slate-300'
            }`}>
              {state.status}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Trading Mode */}
            <button
              onClick={toggleTradingMode}
              disabled={state.isMonitoring}
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                state.tradingMode === 'PAPER'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-red-500/20 border-red-500 text-red-300'
              } ${state.isMonitoring ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {state.tradingMode === 'PAPER' ? '📝 PAPER' : '🔴 LIVE'}
            </button>

            {/* Start/Stop */}
            <button
              onClick={toggleMonitoring}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                state.isMonitoring
                  ? 'bg-red-600 text-white'
                  : 'bg-green-600 text-white'
              }`}
            >
              {state.isMonitoring ? <Pause size={18} /> : <Play size={18} />}
              {state.isMonitoring ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        
        {/* Real-Time Market Metrics Dashboard */}
        {currentSignal && (
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Activity size={16} />
              Live Market Metrics (Analyzed Every Minute)
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Mom 1m</div>
                <div className={`text-sm font-bold ${currentSignal.metrics.momentum_1m >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentSignal.metrics.momentum_1m.toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Mom 5m</div>
                <div className={`text-sm font-bold ${currentSignal.metrics.momentum_5m >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentSignal.metrics.momentum_5m.toFixed(2)}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Volatility</div>
                <div className="text-sm font-bold text-yellow-400">
                  {currentSignal.metrics.volatility.toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Vol Ratio</div>
                <div className="text-sm font-bold text-blue-400">
                  {currentSignal.metrics.volumeRatio.toFixed(2)}x
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Order Flow</div>
                <div className={`text-sm font-bold ${currentSignal.metrics.orderFlowImbalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentSignal.metrics.orderFlowImbalance.toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <div className="text-xs text-slate-500">Opt Sent</div>
                <div className={`text-sm font-bold ${(currentSignal.metrics.optionsSentiment || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(currentSignal.metrics.optionsSentiment || 0).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 text-center">
              Using {historyLog.length} data points collected every minute
            </div>
          </div>
        )}
        
        {/* Account Status */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500">Equity</div>
            <div className="text-xl font-bold text-white">₹{accountStatus.currentEquity.toLocaleString()}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500">Daily Loss</div>
            <div className="text-xl font-bold text-red-400">₹{accountStatus.dailyLoss.toFixed(0)}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500">Drawdown</div>
            <div className="text-xl font-bold text-yellow-400">{accountStatus.currentDrawdown.toFixed(1)}%</div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500">Positions</div>
            <div className="text-xl font-bold text-blue-400">{activePositions.length}</div>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500">Status</div>
            <div className={`text-sm font-bold ${accountStatus.canTrade ? 'text-green-400' : 'text-red-400'}`}>
              {accountStatus.canTrade ? '✅ Active' : '🚫 Blocked'}
            </div>
          </div>
        </div>

        {/* Current Signal */}
        {currentSignal && currentSignal.type === 'ENTRY' && (
          <div className="glass-panel p-6 rounded-xl border-2 border-yellow-500/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" size={20} />
              Trade Signal Generated
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Direction</div>
                  <div className={`text-2xl font-bold ${
                    currentSignal.direction === 'LONG' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentSignal.direction}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="text-2xl font-bold text-blue-400">{currentSignal.confidence}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Strength</div>
                  <div className="text-2xl font-bold text-white">{currentSignal.strength.toFixed(0)}</div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <div className="text-xs text-slate-500 font-bold uppercase">Signal Reasons:</div>
                {currentSignal.reasons.map((reason, idx) => (
                  <div key={idx} className="text-sm text-slate-300">• {reason}</div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={executeTrade}
                  disabled={!accountStatus.canTrade}
                  className={`py-3 rounded-lg font-bold transition-all ${
                    accountStatus.canTrade
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Execute Trade
                </button>
                <button
                  onClick={() => setCurrentSignal(null)}
                  className="py-3 rounded-lg font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Positions */}
        {activePositions.length > 0 && (
          <div className="glass-panel p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-green-400" size={20} />
                Active Positions ({activePositions.length})
              </h3>
              <button
                onClick={closeAllPositions}
                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500"
              >
                Close All
              </button>
            </div>
            <div className="space-y-3">
              {activePositions.map((pos, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-500">Symbol</div>
                      <div className="text-sm font-bold text-white">{pos.symbol}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Avg Price</div>
                      <div className="text-sm font-bold text-slate-300">₹{pos.avgPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">LTP</div>
                      <div className="text-sm font-bold text-white">₹{pos.ltp.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">P&L</div>
                      <div className={`text-lg font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade Statistics */}
        {tradeStats && tradeStats.totalTrades > 0 && (
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="text-purple-400" size={20} />
              Performance Analytics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-500">Total Trades</div>
                <div className="text-2xl font-bold text-white">{tradeStats.totalTrades}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Win Rate</div>
                <div className="text-2xl font-bold text-green-400">{tradeStats.winRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Net P&L</div>
                <div className={`text-2xl font-bold ${tradeStats.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ₹{tradeStats.netPnl.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Profit Factor</div>
                <div className="text-2xl font-bold text-blue-400">{tradeStats.profitFactor.toFixed(2)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500">Avg Win</div>
                <div className="text-lg font-bold text-green-400">₹{tradeStats.avgWin.toFixed(0)}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500">Avg Loss</div>
                <div className="text-lg font-bold text-red-400">₹{tradeStats.avgLoss.toFixed(0)}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-xs text-slate-500">Expectancy</div>
                <div className="text-lg font-bold text-white">₹{tradeStats.expectancy.toFixed(0)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Log */}
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
            <Eye size={16} />
            Analysis Feed ({analysisLog.length})
          </h3>
          <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
            {analysisLog.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">
                Start monitoring to see live analysis
              </div>
            )}
            {analysisLog.map((log, idx) => (
              <div key={idx} className="text-xs font-mono text-slate-300 py-1 border-b border-slate-800/50">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoTrade;
