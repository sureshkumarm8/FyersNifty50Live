/**
 * MY SYSTEM AUTOTRADE - PROFESSIONAL EDITION
 * "Nifty Sniper: The Office Protocol"
 * 
 * Strategy: Capture 30 points between 09:25-10:15 AM IST
 * Entry: ITM options at support/resistance
 * Exit: +30pts target, -30pts stop, or 10:15 AM hard stop
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, X, Eye, Brain, Zap, Target, Clock, TrendingUp, TrendingDown,
  Activity, AlertCircle, CheckCircle, DollarSign, BarChart2, Settings as SettingsIcon
} from 'lucide-react';
import { FyersCredentials, EnrichedFyersQuote, MarketSnapshot, PivotPoints } from '../types';
import { TradingEngine, TradingSignal } from '../services/tradingEngine';
import { OrderManager, Position, Order } from '../services/orderManager';
import { tradeJournal, Trade } from '../services/tradeJournal';
import { getNextExpiryDate, getFormattedExpiryDate } from '../constants/niftyExpiryDates';

type SystemPhase = 'IDLE' | 'DOWNLOAD' | 'ENTRY_WINDOW' | 'IN_TRADE' | 'CLOSED';
type TradeMode = 'PAPER' | 'LIVE';

interface SystemState {
  phase: SystemPhase;
  isMonitoring: boolean;
  tradingMode: TradeMode;
  dailyTradeExecuted: boolean;
}

interface ZoneSetup {
  support: number;
  resistance: number;
  fiveMinHigh: number;
  fiveMinLow: number;
  openType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT';
  currentZone: 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'NEUTRAL';
}

interface TradeSetup {
  strikePrice: number;
  optionType: 'CE' | 'PE';
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  confidence: number;
  reasoning: string[];
  expiryDate: string;
  itmAmount: number;
}

interface ActiveTrade {
  setup: TradeSetup;
  position?: Position;
  entryTime: number;
  maxGain: number;
  maxLoss: number;
  currentPnl: number;
  currentPrice: number;
}

interface MySystemAutoTradeProps {
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots?: PivotPoints | null;
  aiEnabled?: boolean;
}

const MySystemAutoTrade: React.FC<MySystemAutoTradeProps> = ({
  credentials,
  stocks,
  niftyLtp,
  historyLog,
  pivots,
  aiEnabled = true
}) => {
  // State Management
  const [systemState, setSystemState] = useState<SystemState>({
    phase: 'IDLE',
    isMonitoring: false,
    tradingMode: 'PAPER',
    dailyTradeExecuted: false
  });

  const [zones, setZones] = useState<ZoneSetup | null>(null);
  const [tradeSetup, setTradeSetup] = useState<TradeSetup | null>(null);
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [closedTrade, setClosedTrade] = useState<Trade | null>(null);

  // Services
  const tradingEngineRef = useRef<TradingEngine | null>(null);
  const orderManagerRef = useRef<OrderManager | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services
  useEffect(() => {
    if (!tradingEngineRef.current) {
      const initialCapital = 100000; // ₹1 lakh
      tradingEngineRef.current = new TradingEngine(initialCapital, {
        maxCapitalPerTrade: 5, // 5% per trade for aggressive MySystem
        maxDailyLoss: 3000, // ₹3000 max loss per day
        maxDrawdown: 10,
        maxPositions: 1, // Only 1 position for MySystem
        minRiskReward: 1.0, // 1:1 R:R for MySystem
        maxLeverage: 3
      });
    }

    if (!orderManagerRef.current) {
      orderManagerRef.current = new OrderManager(
        credentials,
        systemState.tradingMode === 'PAPER'
      );
    }
  }, [credentials, systemState.tradingMode]);

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setAnalysisLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  }, []);

  // Get current IST time
  const getISTTime = useCallback(() => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    return {
      hours: istTime.getHours(),
      minutes: istTime.getMinutes(),
      timeValue: istTime.getHours() * 100 + istTime.getMinutes()
    };
  }, []);

  // Determine system phase based on time
  const determinePhase = useCallback((): SystemPhase => {
    if (!systemState.isMonitoring) return 'IDLE';
    if (systemState.dailyTradeExecuted) return 'CLOSED';
    if (activeTrade) return 'IN_TRADE';

    const { timeValue } = getISTTime();

    if (timeValue >= 915 && timeValue < 925) return 'DOWNLOAD';
    if (timeValue >= 925 && timeValue < 1015) return 'ENTRY_WINDOW';
    if (timeValue >= 1015) return 'CLOSED';

    return 'IDLE';
  }, [systemState.isMonitoring, systemState.dailyTradeExecuted, activeTrade, getISTTime]);

  // PHASE 1: DOWNLOAD (09:15-09:25)
  const runDownloadPhase = useCallback(() => {
    if (!niftyLtp || historyLog.length < 5) return;

    addLog('📊 DOWNLOAD PHASE: Analyzing market structure...');

    // Get first 5-10 minute data
    const recent10Min = historyLog.slice(-10);
    const fiveMinHigh = Math.max(...recent10Min.map(s => s.niftyLtp));
    const fiveMinLow = Math.min(...recent10Min.map(s => s.niftyLtp));

    // Get latest snapshot for real-time sentiment
    const latest = recent10Min[recent10Min.length - 1];

    // Determine support/resistance (50-point buffers)
    const support = Math.round((fiveMinLow - 50) / 50) * 50;
    const resistance = Math.round((fiveMinHigh + 50) / 50) * 50;

    // Determine open type
    const openPrice = recent10Min[0].niftyLtp;
    let openType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT' = 'FLAT';
    
    if (pivots) {
      const prevClose = pivots.pivot;
      if (openPrice > prevClose + 30) openType = 'GAP_UP';
      else if (openPrice < prevClose - 30) openType = 'GAP_DOWN';
    }

    // Determine current zone
    let currentZone: 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'NEUTRAL' = 'NEUTRAL';
    if (niftyLtp <= support + 30) currentZone = 'NEAR_SUPPORT';
    else if (niftyLtp >= resistance - 30) currentZone = 'NEAR_RESISTANCE';

    setZones({
      support,
      resistance,
      fiveMinHigh,
      fiveMinLow,
      openType,
      currentZone
    });

    // Log rich market insights
    addLog(`📍 Zones: Support=${support}, Resistance=${resistance}, Range=${resistance - support}pts`);
    addLog(`📈 Open: ${openType} | Zone: ${currentZone} | LTP: ${niftyLtp.toFixed(0)}`);
    addLog(`📊 Market: ADV=${latest.adv} DEC=${latest.dec} | Breadth=${latest.overallSent.toFixed(1)}%`);
    addLog(`📉 Options: PCR=${latest.pcr.toFixed(2)} | Sent=${latest.optionsSent.toFixed(1)}%`);
    addLog(`💹 Calls: Buy=${(latest.callsBuyQty / 1000000).toFixed(1)}M Sell=${(latest.callsSellQty / 1000000).toFixed(1)}M`);
    addLog(`💹 Puts: Buy=${(latest.putsBuyQty / 1000000).toFixed(1)}M Sell=${(latest.putsSellQty / 1000000).toFixed(1)}M`);
    addLog(`✅ Download complete. Waiting for entry window (09:25)...`);
  }, [niftyLtp, historyLog, pivots, addLog]);

  // PHASE 2: ENTRY WINDOW (09:25-10:15)
  const runEntryWindow = useCallback(() => {
    if (!zones || !niftyLtp || tradeSetup || activeTrade) return;
    if (!tradingEngineRef.current) return;

    // Check if we're near a zone
    if (zones.currentZone === 'NEUTRAL') {
      addLog('⏸️  Waiting for price to reach support/resistance zone...');
      return;
    }

    // Generate signal using TradingEngine
    const signal = tradingEngineRef.current.generateSignal(
      niftyLtp,
      historyLog,
      stocks,
      pivots
    );

    // MySystem requires high confidence (>75%)
    if (signal.confidence < 75) {
      addLog(`⚠️ Signal confidence too low: ${signal.confidence}% (need >75%)`);
      return;
    }

    // Determine trade direction based on zone
    let direction: 'LONG' | 'SHORT';
    let optionType: 'CE' | 'PE';
    let reasoning: string[] = [];

    if (zones.currentZone === 'NEAR_SUPPORT' && signal.direction !== 'SHORT') {
      direction = 'LONG';
      optionType = 'CE';
      reasoning.push('Price near support zone');
      reasoning.push('Bullish reversal expected');
    } else if (zones.currentZone === 'NEAR_RESISTANCE' && signal.direction !== 'LONG') {
      direction = 'SHORT';
      optionType = 'PE';
      reasoning.push('Price near resistance zone');
      reasoning.push('Bearish reversal expected');
    } else {
      addLog('⚠️ Signal direction conflicts with zone play. Waiting...');
      return;
    }

    // Calculate ITM strike (200-300 points)
    const atmStrike = Math.round(niftyLtp / 50) * 50;
    const itmAmount = 250; // 250 points ITM
    const strikePrice = direction === 'LONG' 
      ? atmStrike - itmAmount 
      : atmStrike + itmAmount;

    // MySystem: Fixed 30 points target and stop loss
    const targetPoints = 30;
    const stopLossPoints = 30;

    // Get expiry date
    const nextExpiry = getNextExpiryDate();
    const expiryDate = nextExpiry ? getFormattedExpiryDate(nextExpiry) : 'N/A';

    // Estimate option price (simplified - would need real option chain)
    const estimatedOptionPrice = itmAmount + (niftyLtp - strikePrice);
    const entryPrice = Math.max(estimatedOptionPrice, itmAmount * 0.5);
    const targetPrice = entryPrice + targetPoints;
    const stopLossPrice = entryPrice - stopLossPoints;

    reasoning.push(...signal.reasons);
    reasoning.push(`ITM: ${itmAmount} points`);
    reasoning.push(`Target: +30pts, Stop: -30pts`);

    const setup: TradeSetup = {
      strikePrice,
      optionType,
      direction,
      entryPrice,
      targetPrice,
      stopLossPrice,
      confidence: signal.confidence,
      reasoning,
      expiryDate,
      itmAmount
    };

    setTradeSetup(setup);
    addLog(`🎯 SETUP READY: ${strikePrice} ${optionType} @ ₹${entryPrice.toFixed(2)}`);
    addLog(`📊 Confidence: ${signal.confidence}%, R:R = 1:1`);
  }, [zones, niftyLtp, historyLog, stocks, pivots, tradeSetup, activeTrade, addLog]);

  // Execute Trade
  const executeTrade = useCallback(async () => {
    if (!tradeSetup || !orderManagerRef.current || !niftyLtp) return;

    addLog('🚀 Executing trade...');

    try {
      // Calculate quantity
      const quantity = 1; // MySystem: 1 lot for simplicity

      // Place order
      const symbol = `NSE:NIFTY${tradeSetup.expiryDate}${tradeSetup.strikePrice}${tradeSetup.optionType}`;
      const result = await orderManagerRef.current.placeOrder(
        symbol,
        'BUY',
        quantity,
        'MARKET',
        tradeSetup.entryPrice
      );

      if (!result.success) {
        addLog(`❌ Order failed: ${result.message}`);
        return;
      }

      addLog(`✅ Order placed successfully! ID: ${result.orderId}`);

      // Create active trade
      setActiveTrade({
        setup: tradeSetup,
        entryTime: Date.now(),
        maxGain: 0,
        maxLoss: 0,
        currentPnl: 0,
        currentPrice: tradeSetup.entryPrice
      });

      setTradeSetup(null);
      addLog('📈 IN TRADE - Monitoring position...');

    } catch (error: any) {
      addLog(`❌ Error executing trade: ${error.message}`);
    }
  }, [tradeSetup, niftyLtp, addLog]);

  // PHASE 3: Monitor Active Trade
  const monitorActiveTrade = useCallback(async () => {
    if (!activeTrade || !niftyLtp || !orderManagerRef.current) return;

    const { timeValue } = getISTTime();
    const setup = activeTrade.setup;

    // Simulate option price movement (in real scenario, fetch from option chain)
    const underlyingMove = niftyLtp - (setup.direction === 'LONG' 
      ? setup.strikePrice + setup.itmAmount 
      : setup.strikePrice - setup.itmAmount);
    
    const currentOptionPrice = setup.entryPrice + underlyingMove;
    const pnl = currentOptionPrice - setup.entryPrice;

    // Update active trade metrics
    setActiveTrade(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentPrice: currentOptionPrice,
        currentPnl: pnl,
        maxGain: Math.max(prev.maxGain, pnl),
        maxLoss: Math.min(prev.maxLoss, pnl)
      };
    });

    // Check exit conditions
    let shouldExit = false;
    let exitReason: 'TARGET' | 'STOPLOSS' | 'EOD' | 'MANUAL' = 'MANUAL';

    // Target hit (+30 points)
    if (currentOptionPrice >= setup.targetPrice) {
      shouldExit = true;
      exitReason = 'TARGET';
      addLog(`🎯 TARGET HIT! +30 points at ₹${currentOptionPrice.toFixed(2)}`);
    }

    // Stop loss hit (-30 points)
    if (currentOptionPrice <= setup.stopLossPrice) {
      shouldExit = true;
      exitReason = 'STOPLOSS';
      addLog(`🛑 STOP LOSS HIT! -30 points at ₹${currentOptionPrice.toFixed(2)}`);
    }

    // Hard stop at 10:15 AM
    if (timeValue >= 1015) {
      shouldExit = true;
      exitReason = 'EOD';
      addLog(`⏰ HARD STOP (10:15 AM) - Forcing exit at ₹${currentOptionPrice.toFixed(2)}`);
    }

    if (shouldExit) {
      await exitTrade(exitReason, currentOptionPrice);
    }
  }, [activeTrade, niftyLtp, getISTTime, addLog]);

  // Exit Trade
  const exitTrade = useCallback(async (
    reason: 'TARGET' | 'STOPLOSS' | 'EOD' | 'MANUAL',
    exitPrice: number
  ) => {
    if (!activeTrade || !orderManagerRef.current || !tradingEngineRef.current) return;

    const setup = activeTrade.setup;
    const holdTime = Date.now() - activeTrade.entryTime;
    const pnl = exitPrice - setup.entryPrice;
    const pnlPercent = (pnl / setup.entryPrice) * 100;

    // Close position
    await orderManagerRef.current.closeAllPositions();

    // Create trade record
    const trade: Trade = {
      id: `TRADE-${Date.now()}`,
      timestamp: activeTrade.entryTime,
      symbol: `NIFTY ${setup.strikePrice} ${setup.optionType}`,
      strikePrice: setup.strikePrice,
      optionType: setup.optionType,
      side: setup.direction,
      entryPrice: setup.entryPrice,
      exitPrice,
      quantity: 1,
      entryTime: activeTrade.entryTime,
      exitTime: Date.now(),
      pnl,
      pnlPercent,
      commission: 40, // Flat ₹40 per trade
      netPnl: pnl - 40,
      exitReason: reason,
      setup: {
        signalConfidence: setup.confidence,
        entryReason: setup.reasoning,
        marketCondition: 'MY_SYSTEM',
        volatility: 0,
        trendAlignment: true,
        riskReward: 1.0
      },
      execution: {
        slippage: 0,
        fillTime: 1000,
        holdTime,
        maxProfit: activeTrade.maxGain,
        maxLoss: activeTrade.maxLoss,
        targetHit: reason === 'TARGET',
        stopLossHit: reason === 'STOPLOSS'
      },
      maxAdverseExcursion: Math.abs(activeTrade.maxLoss),
      maxFavorableExcursion: activeTrade.maxGain,
      tags: ['MySystem', 'OfficeProtocol'],
      notes: `Exit: ${reason}`
    };

    // Save to journal
    await tradeJournal.addTrade(trade);

    // Update engine equity
    tradingEngineRef.current.updateEquity(trade.netPnl);

    setClosedTrade(trade);
    setActiveTrade(null);
    setSystemState(prev => ({ ...prev, phase: 'CLOSED', dailyTradeExecuted: true }));

    addLog(`✅ Trade closed: ${reason} | P&L: ₹${trade.netPnl.toFixed(2)}`);
  }, [activeTrade, addLog]);

  // Main monitoring loop
  useEffect(() => {
    if (!systemState.isMonitoring) return;

    const phase = determinePhase();
    setSystemState(prev => ({ ...prev, phase }));

    // Run analysis every minute (aligned with data refresh)
    monitorIntervalRef.current = setInterval(() => {
      const currentPhase = determinePhase();
      setSystemState(prev => ({ ...prev, phase: currentPhase }));

      if (currentPhase === 'DOWNLOAD') {
        runDownloadPhase();
      } else if (currentPhase === 'ENTRY_WINDOW') {
        runEntryWindow();
      } else if (currentPhase === 'IN_TRADE') {
        monitorActiveTrade();
      }
    }, 60000); // Every 1 minute to match data refresh

    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    };
  }, [systemState.isMonitoring, determinePhase, runDownloadPhase, runEntryWindow, monitorActiveTrade]);

  // Toggle monitoring
  const toggleMonitoring = () => {
    setSystemState(prev => ({ ...prev, isMonitoring: !prev.isMonitoring }));
    if (!systemState.isMonitoring) {
      addLog('🟢 Monitoring started - MySystem activated');
    } else {
      addLog('🔴 Monitoring stopped');
    }
  };

  // Toggle trading mode
  const toggleTradingMode = () => {
    setSystemState(prev => ({
      ...prev,
      tradingMode: prev.tradingMode === 'PAPER' ? 'LIVE' : 'PAPER'
    }));
    if (orderManagerRef.current) {
      orderManagerRef.current.setPaperTrading(systemState.tradingMode === 'LIVE');
    }
  };

  // Reset for next day
  const resetDaily = () => {
    setSystemState({
      phase: 'IDLE',
      isMonitoring: false,
      tradingMode: systemState.tradingMode,
      dailyTradeExecuted: false
    });
    setZones(null);
    setTradeSetup(null);
    setActiveTrade(null);
    setClosedTrade(null);
    setAnalysisLog([]);
    addLog('🔄 System reset for new trading day');
  };

  return (
    <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none glass-header border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="text-yellow-400" size={24} />
              MySystem AutoTrade
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              systemState.phase === 'DOWNLOAD' ? 'bg-blue-500/20 text-blue-300' :
              systemState.phase === 'ENTRY_WINDOW' ? 'bg-yellow-500/20 text-yellow-300' :
              systemState.phase === 'IN_TRADE' ? 'bg-green-500/20 text-green-300' :
              systemState.phase === 'CLOSED' ? 'bg-purple-500/20 text-purple-300' :
              'bg-slate-500/20 text-slate-300'
            }`}>
              {systemState.phase}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Trading Mode Toggle */}
            <button
              onClick={toggleTradingMode}
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                systemState.tradingMode === 'PAPER'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-red-500/20 border-red-500 text-red-300'
              }`}
            >
              {systemState.tradingMode === 'PAPER' ? '📝 PAPER' : '🔴 LIVE'}
            </button>

            {/* Monitoring Toggle */}
            <button
              onClick={toggleMonitoring}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                systemState.isMonitoring
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {systemState.isMonitoring ? <Pause size={18} /> : <Play size={18} />}
              {systemState.isMonitoring ? 'Monitoring' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        
        {/* Real-Time Market Data Insights */}
        {historyLog.length > 0 && (
          <div className="glass-panel p-4 rounded-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Activity size={16} />
              Live Market Data (Updated Every Minute)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const latest = historyLog[historyLog.length - 1];
                return (
                  <>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-slate-500">Breadth</div>
                      <div className={`text-sm font-bold ${latest.overallSent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {latest.overallSent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-600">{latest.adv}↑ {latest.dec}↓</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-slate-500">Options</div>
                      <div className={`text-sm font-bold ${latest.optionsSent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {latest.optionsSent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-600">PCR: {latest.pcr.toFixed(2)}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-slate-500">Stock Flow</div>
                      <div className={`text-sm font-bold ${latest.stockSent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {latest.stockSent.toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-slate-500">Data Points</div>
                      <div className="text-sm font-bold text-blue-400">{historyLog.length}</div>
                      <div className="text-xs text-slate-600">Last: {latest.time}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Zones Card - DOWNLOAD Phase */}
        {zones && (
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="text-blue-400" size={20} />
              Market Zones
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase">Support</div>
                <div className="text-2xl font-bold text-green-400">{zones.support}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase">Resistance</div>
                <div className="text-2xl font-bold text-red-400">{zones.resistance}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase">Open Type</div>
                <div className="text-sm font-bold text-white">{zones.openType}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase">Current Zone</div>
                <div className="text-sm font-bold text-yellow-400">{zones.currentZone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Trade Setup Card - ENTRY_WINDOW Phase */}
        {tradeSetup && (
          <div className="glass-panel p-6 rounded-xl border-2 border-yellow-500/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="text-yellow-400" size={20} />
              Setup Ready
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Strike</div>
                  <div className="text-xl font-bold text-white">
                    {tradeSetup.strikePrice} {tradeSetup.optionType}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Direction</div>
                  <div className={`text-xl font-bold ${
                    tradeSetup.direction === 'LONG' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tradeSetup.direction}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Entry Price</div>
                  <div className="text-xl font-bold text-white">₹{tradeSetup.entryPrice.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Confidence</div>
                  <div className="text-xl font-bold text-blue-400">{tradeSetup.confidence}%</div>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="text-green-400 font-bold">Target</div>
                  <div className="text-white">₹{tradeSetup.targetPrice.toFixed(2)} (+30pts)</div>
                </div>
                <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="text-red-400 font-bold">Stop Loss</div>
                  <div className="text-white">₹{tradeSetup.stopLossPrice.toFixed(2)} (-30pts)</div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-2">Reasoning:</div>
                {tradeSetup.reasoning.map((reason, idx) => (
                  <div key={idx} className="text-sm text-slate-300">• {reason}</div>
                ))}
              </div>

              <button
                onClick={executeTrade}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
              >
                🚀 Execute Trade Now
              </button>
            </div>
          </div>
        )}

        {/* Active Trade Card - IN_TRADE Phase */}
        {activeTrade && (
          <div className="glass-panel p-6 rounded-xl border-2 border-green-500/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="text-green-400 animate-pulse" size={20} />
              Trade Active
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Entry</div>
                  <div className="text-lg font-bold text-slate-300">
                    ₹{activeTrade.setup.entryPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Current</div>
                  <div className="text-2xl font-bold text-white">
                    ₹{activeTrade.currentPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">P&L</div>
                  <div className={`text-2xl font-bold ${
                    activeTrade.currentPnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activeTrade.currentPnl >= 0 ? '+' : ''}₹{activeTrade.currentPnl.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-green-500/10 rounded-lg p-3">
                  <div className="text-xs text-green-400">Max Gain</div>
                  <div className="text-lg font-bold text-white">₹{activeTrade.maxGain.toFixed(2)}</div>
                </div>
                <div className="flex-1 bg-red-500/10 rounded-lg p-3">
                  <div className="text-xs text-red-400">Max Loss</div>
                  <div className="text-lg font-bold text-white">₹{activeTrade.maxLoss.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">Progress to Target (+30pts)</span>
                  <span className="text-white font-bold">
                    {Math.min(100, (activeTrade.currentPnl / 30) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (activeTrade.currentPnl / 30) * 100))}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => exitTrade('MANUAL', activeTrade.currentPrice)}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-500 transition-all"
              >
                Exit Manually
              </button>
            </div>
          </div>
        )}

        {/* Closed Trade Card - CLOSED Phase */}
        {closedTrade && (
          <div className="glass-panel p-6 rounded-xl border-2 border-purple-500/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="text-purple-400" size={20} />
              Trade Closed
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Exit Reason</div>
                  <div className="text-lg font-bold text-white">{closedTrade.exitReason}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Net P&L</div>
                  <div className={`text-3xl font-bold ${
                    closedTrade.netPnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {closedTrade.netPnl >= 0 ? '+' : ''}₹{closedTrade.netPnl.toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                onClick={resetDaily}
                className="w-full bg-slate-700 text-white font-bold py-3 rounded-lg hover:bg-slate-600 transition-all"
              >
                🔄 Reset for Next Day
              </button>
            </div>
          </div>
        )}

        {/* Analysis Log */}
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
            <BarChart2 size={16} />
            Analysis Feed
          </h3>
          <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
            {analysisLog.map((log, idx) => (
              <div key={idx} className="text-xs font-mono text-slate-300 py-1 border-b border-slate-800">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySystemAutoTrade;
