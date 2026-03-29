/**
 * UNIFIED AUTOTRADE - PROFESSIONAL TRADING SYSTEM
 * 
 * Combines multiple trading strategies in a single professional interface:
 * - MOMENTUM: Multi-factor algorithmic trading (original AutoTrade)
 * - SNIPER: 30-point office hour strategy (MySystem)
 * 
 * Features:
 * - Strategy switching with isolated state
 * - Paper/Live trading modes
 * - Real-time position monitoring
 * - Trade journal & analytics
 * - Risk management & circuit breakers
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, TrendingUp, TrendingDown, Target, Shield, Zap, Clock,
  DollarSign, Activity, AlertCircle, CheckCircle, Brain, Eye, BarChart3,
  Settings as SettingsIcon, Layers, Sparkles
} from 'lucide-react';
import { FyersCredentials, EnrichedFyersQuote, MarketSnapshot, PivotPoints } from '../types';
import { TradingEngine, TradingSignal, TradeSetup } from '../services/tradingEngine';
import { OrderManager, Position, Order } from '../services/orderManager';
import { tradeJournal, Trade, TradeStats } from '../services/tradeJournal';
import { predictionEngine, Prediction, TradeWinProbability, Anomaly } from '../services/predictionEngine';
import { getNextExpiryDate, getFormattedExpiryDate } from '../constants/niftyExpiryDates';

type Strategy = 'MOMENTUM' | 'SNIPER';
type TradeMode = 'PAPER' | 'LIVE';
type SystemStatus = 'IDLE' | 'MONITORING' | 'SIGNAL_GENERATED' | 'IN_TRADE' | 'PAUSED';

interface UnifiedAutoTradeProps {
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  aiEnabled: boolean;
}

interface SystemState {
  status: SystemStatus;
  strategy: Strategy;
  tradingMode: TradeMode;
  isMonitoring: boolean;
}

interface SniperZone {
  support: number;
  resistance: number;
  fiveMinHigh: number;
  fiveMinLow: number;
  openType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT';
  currentZone: 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'NEUTRAL';
}

const UnifiedAutoTrade: React.FC<UnifiedAutoTradeProps> = ({
  credentials,
  stocks,
  niftyLtp,
  historyLog,
  pivots,
  aiEnabled
}) => {
  // Main State
  const [state, setState] = useState<SystemState>({
    status: 'IDLE',
    strategy: 'MOMENTUM',
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

  // Sniper Strategy Specific State
  const [sniperZones, setSniperZones] = useState<SniperZone | null>(null);
  const [sniperTradeSetup, setSniperTradeSetup] = useState<TradeSetup | null>(null);
  const [sniperDailyTradeExecuted, setSniperDailyTradeExecuted] = useState(false);

  // AI Prediction State
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [winProbability, setWinProbability] = useState<TradeWinProbability | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  // Service Refs
  const engineRef = useRef<TradingEngine | null>(null);
  const orderManagerRef = useRef<OrderManager | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const stats = tradeJournal.calculateStats();
    setTradeStats(stats);
    setRecentTrades(tradeJournal.getTodayTrades());
  }, [credentials, state.tradingMode]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setAnalysisLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // Strategy: MOMENTUM - Multi-factor Analysis
  const runMomentumAnalysis = useCallback(() => {
    if (!niftyLtp || !engineRef.current) return;

    const latest = historyLog[historyLog.length - 1];
    if (!latest) return;

    addLog('🔍 Running Momentum analysis...');

    const signal = engineRef.current.generateSignal({
      niftyLtp,
      marketSnapshot: latest,
      pivots,
      stocks,
      historyLog
    });

    if (signal && signal.signal !== 'NO_TRADE') {
      setCurrentSignal(signal);
      setState(prev => ({ ...prev, status: 'SIGNAL_GENERATED' }));
      addLog(`📊 ${signal.signal} Signal | Confidence: ${signal.confidence}% | ${signal.reason}`);
    } else {
      addLog('⏸️ No trade opportunity detected');
    }
  }, [niftyLtp, historyLog, pivots, stocks, addLog]);

  // Strategy: SNIPER - Office Hour 30pt Strategy
  const runSniperAnalysis = useCallback(() => {
    if (!niftyLtp || sniperDailyTradeExecuted) return;

    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hour = istTime.getHours();
    const min = istTime.getMinutes();
    const timeValue = hour * 100 + min;

    // Phase 1: Download phase (09:15-09:25)
    if (timeValue >= 915 && timeValue < 925 && !sniperZones) {
      addLog('📥 SNIPER: Download phase - Calculating zones...');
      
      const firstCandles = historyLog.slice(0, 5);
      if (firstCandles.length >= 2) {
        const fiveMinHigh = Math.max(...firstCandles.map(c => c.niftyLtp));
        const fiveMinLow = Math.min(...firstCandles.map(c => c.niftyLtp));
        const openPrice = firstCandles[0]?.niftyLtp || niftyLtp;
        const prevClose = pivots?.dayLow || niftyLtp;
        
        const support = pivots?.s1 || (fiveMinLow - 20);
        const resistance = pivots?.r1 || (fiveMinHigh + 20);
        
        let openType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT' = 'FLAT';
        if (openPrice > prevClose + 20) openType = 'GAP_UP';
        else if (openPrice < prevClose - 20) openType = 'GAP_DOWN';

        const zones: SniperZone = {
          support,
          resistance,
          fiveMinHigh,
          fiveMinLow,
          openType,
          currentZone: 'NEUTRAL'
        };

        setSniperZones(zones);
        addLog(`✅ Zones set: Support ${support} | Resistance ${resistance} | Open: ${openType}`);
      }
    }

    // Phase 2: Entry window (09:25-10:15)
    if (timeValue >= 925 && timeValue <= 1015 && sniperZones && !sniperTradeSetup) {
      const distToSupport = Math.abs(niftyLtp - sniperZones.support);
      const distToResistance = Math.abs(niftyLtp - sniperZones.resistance);
      
      let zone: 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'NEUTRAL' = 'NEUTRAL';
      if (distToSupport < 30) zone = 'NEAR_SUPPORT';
      else if (distToResistance < 30) zone = 'NEAR_RESISTANCE';

      sniperZones.currentZone = zone;

      if (zone === 'NEAR_SUPPORT' || zone === 'NEAR_RESISTANCE') {
        const isCallSetup = zone === 'NEAR_SUPPORT';
        const strikeStep = 50;
        const atm = Math.round(niftyLtp / strikeStep) * strikeStep;
        const itmStrike = isCallSetup ? atm - 100 : atm + 100;
        
        const setup: TradeSetup = {
          strikePrice: itmStrike,
          optionType: isCallSetup ? 'CE' : 'PE',
          direction: 'LONG',
          entryPrice: niftyLtp,
          targetPrice: isCallSetup ? niftyLtp + 30 : niftyLtp - 30,
          stopLossPrice: isCallSetup ? niftyLtp - 30 : niftyLtp + 30,
          confidence: 75,
          reasoning: [`${zone} detected`, `ITM ${isCallSetup ? 'CALL' : 'PUT'} setup`],
          expiryDate: getFormattedExpiryDate(getNextExpiryDate()),
          itmAmount: 100
        };

        setSniperTradeSetup(setup);
        setState(prev => ({ ...prev, status: 'SIGNAL_GENERATED' }));
        addLog(`🎯 SNIPER Setup: ${setup.optionType} ${setup.strikePrice} | Target: ±30pts`);
      }
    }

    // Phase 3: Hard stop at 10:15
    if (timeValue > 1015 && activePositions.length > 0) {
      addLog('⏰ 10:15 AM - Force closing positions');
      handleCloseAllPositions();
    }
  }, [niftyLtp, sniperZones, sniperTradeSetup, sniperDailyTradeExecuted, historyLog, pivots, activePositions, addLog]);

  // Unified Analysis Runner (includes AI predictions)
  const runAnalysis = useCallback(async () => {
    if (state.strategy === 'MOMENTUM') {
      runMomentumAnalysis();
    } else {
      runSniperAnalysis();
    }
    
    // Run AI predictions if enabled
    if (aiEnabled && niftyLtp && historyLog.length >= 5) {
      const latest = historyLog[historyLog.length - 1];
      
      try {
        // Next-minute prediction
        const prediction = await predictionEngine.predictNextMove({
          niftyLtp,
          marketSnapshot: latest,
          last5Minutes: historyLog.slice(-5),
          stocks,
          pivots
        });
        setCurrentPrediction(prediction);
        
        // Anomaly detection
        const detectedAnomalies = await predictionEngine.scanAnomalies(latest, 30);
        if (detectedAnomalies.length > 0) {
          setAnomalies(detectedAnomalies);
          detectedAnomalies.forEach(anomaly => {
            if (anomaly.severity === 'HIGH') {
              addLog(`⚠️ ANOMALY: ${anomaly.message}`);
            }
          });
        }
      } catch (error) {
        console.error('Prediction error:', error);
      }
    }
  }, [state.strategy, runMomentumAnalysis, runSniperAnalysis, aiEnabled, niftyLtp, historyLog, stocks, pivots, addLog]);
  
  // Calculate win probability when signal is generated
  useEffect(() => {
    if ((currentSignal || sniperTradeSetup) && aiEnabled && niftyLtp) {
      const setup = state.strategy === 'SNIPER' ? sniperTradeSetup : currentSignal;
      if (!setup) return;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      predictionEngine.getTradeWinProbability({
        entryPrice: setup.entryPrice,
        direction: setup.direction,
        strikePrice: setup.strikePrice,
        optionType: setup.optionType,
        marketContext: {
          time: currentTime,
          niftyLtp,
          sentiment: historyLog[historyLog.length - 1]?.overallSent || 0,
          pcr: historyLog[historyLog.length - 1]?.pcr || 1,
          volatility: 0
        }
      }).then(prob => {
        setWinProbability(prob);
        if (prob.sampleSize > 0) {
          addLog(`🤖 AI Win Probability: ${prob.probability}% (based on ${prob.sampleSize} similar trades)`);
        }
      }).catch(err => {
        console.error('Win probability error:', err);
      });
    }
  }, [currentSignal, sniperTradeSetup, aiEnabled, niftyLtp, state.strategy, historyLog, addLog]);

  // Monitoring Loop
  useEffect(() => {
    if (state.isMonitoring && !monitorIntervalRef.current) {
      addLog(`🚀 Started monitoring with ${state.strategy} strategy`);
      runAnalysis();
      
      monitorIntervalRef.current = setInterval(() => {
        runAnalysis();
      }, 30000);
    } else if (!state.isMonitoring && monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
      addLog('⏸️ Monitoring paused');
    }

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
    };
  }, [state.isMonitoring, state.strategy, runAnalysis, addLog]);

  const handleExecuteTrade = async () => {
    if (!orderManagerRef.current) return;

    const setup = state.strategy === 'SNIPER' ? sniperTradeSetup : currentSignal;
    if (!setup) return;

    setState(prev => ({ ...prev, status: 'IN_TRADE' }));
    addLog(`📤 Executing ${state.tradingMode} trade...`);

    try {
      const result = await orderManagerRef.current.placeOrder({
        symbol: `NIFTY${setup.strikePrice}${setup.optionType}`,
        direction: setup.direction,
        quantity: 50,
        price: setup.entryPrice,
        stopLoss: setup.stopLossPrice,
        target: setup.targetPrice
      });

      if (result.success && result.position) {
        setActivePositions(prev => [...prev, result.position!]);
        addLog(`✅ Position opened: ${result.position.symbol}`);

        if (state.strategy === 'SNIPER') {
          setSniperDailyTradeExecuted(true);
        }
      } else {
        addLog(`❌ Trade failed: ${result.message}`);
        setState(prev => ({ ...prev, status: 'MONITORING' }));
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      setState(prev => ({ ...prev, status: 'MONITORING' }));
    }
  };

  const handleCloseAllPositions = async () => {
    if (!orderManagerRef.current || activePositions.length === 0) return;

    addLog('🔄 Closing all positions...');
    const results = await orderManagerRef.current.closeAllPositions(activePositions);
    
    results.forEach(r => {
      addLog(r.success ? '✅ Position closed' : `❌ ${r.message}`);
    });
    
    setActivePositions([]);
    setState(prev => ({ ...prev, status: 'IDLE' }));
  };

  const toggleMonitoring = () => {
    setState(prev => ({ 
      ...prev, 
      isMonitoring: !prev.isMonitoring,
      status: !prev.isMonitoring ? 'MONITORING' : 'IDLE'
    }));
  };

  const switchStrategy = (strategy: Strategy) => {
    if (state.isMonitoring) {
      addLog('⚠️ Stop monitoring before switching strategy');
      return;
    }
    setState(prev => ({ ...prev, strategy }));
    setCurrentSignal(null);
    setSniperTradeSetup(null);
    addLog(`🔄 Switched to ${strategy} strategy`);
  };

  return (
    <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none glass-header border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-blue-400" size={24} />
              AutoTrade Pro
            </h1>
            
            {/* Strategy Selector */}
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10 gap-1">
              <button
                onClick={() => switchStrategy('MOMENTUM')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  state.strategy === 'MOMENTUM'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="inline mr-1" size={14} />
                Momentum
              </button>
              <button
                onClick={() => switchStrategy('SNIPER')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  state.strategy === 'SNIPER'
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="inline mr-1" size={14} />
                Sniper
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setState(prev => ({ ...prev, tradingMode: 'PAPER' }))}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  state.tradingMode === 'PAPER'
                    ? 'bg-green-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PAPER
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, tradingMode: 'LIVE' }))}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  state.tradingMode === 'LIVE'
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LIVE
              </button>
            </div>

            {/* Status Badge */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              state.status === 'IN_TRADE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              state.status === 'MONITORING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-slate-800 text-slate-400 border border-white/10'
            }`}>
              <Activity size={14} className={state.isMonitoring ? 'animate-pulse' : ''} />
              {state.status}
            </div>

            {/* Monitor Toggle */}
            <button
              onClick={toggleMonitoring}
              disabled={!niftyLtp}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                state.isMonitoring
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50'
              }`}
            >
              {state.isMonitoring ? <Pause size={16} /> : <Play size={16} />}
              {state.isMonitoring ? 'Stop' : 'Start'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        
        {/* Left: Signal & Setup */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* Current Signal */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Target size={16} />
              Current Signal - {state.strategy} Strategy
            </h2>
            
            {state.strategy === 'MOMENTUM' && currentSignal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`text-2xl font-black ${
                    currentSignal.signal === 'LONG' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentSignal.signal === 'LONG' ? '📈 LONG' : '📉 SHORT'}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Confidence</div>
                    <div className="text-xl font-bold text-white">{currentSignal.confidence}%</div>
                  </div>
                </div>
                <div className="text-sm text-slate-300">{currentSignal.reason}</div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <div className="text-xs text-slate-500">Entry</div>
                    <div className="text-sm font-bold text-white">{currentSignal.entryPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Target</div>
                    <div className="text-sm font-bold text-green-400">{currentSignal.targetPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Stop</div>
                    <div className="text-sm font-bold text-red-400">{currentSignal.stopLossPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ) : state.strategy === 'SNIPER' && sniperTradeSetup ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-black text-yellow-400">
                    🎯 {sniperTradeSetup.optionType} {sniperTradeSetup.strikePrice}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">ITM</div>
                    <div className="text-xl font-bold text-white">₹{sniperTradeSetup.itmAmount}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  {sniperTradeSetup.reasoning.join(' • ')}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <div>
                    <div className="text-xs text-slate-500">Entry Zone</div>
                    <div className="text-sm font-bold text-white">{sniperTradeSetup.entryPrice.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Target</div>
                    <div className="text-sm font-bold text-green-400">+30pts</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Stop</div>
                    <div className="text-sm font-bold text-red-400">-30pts</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Eye size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Monitoring market for opportunities...</p>
                {state.strategy === 'SNIPER' && (
                  <p className="text-xs mt-1">Entry window: 09:25 - 10:15 AM IST</p>
                )}
              </div>
            )}

            {/* AI Win Probability */}
            {winProbability && winProbability.sampleSize > 0 && (currentSignal || sniperTradeSetup) && aiEnabled && (
              <div className="mt-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-xs font-bold text-purple-400">AI Analysis</span>
                  </div>
                  <div className="text-xl font-bold text-white">{winProbability.probability}%</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">Sample Size</div>
                    <div className="text-white font-bold">{winProbability.sampleSize}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Avg P&L</div>
                    <div className={`font-bold ${winProbability.avgPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{winProbability.avgPnL}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Risk:Reward</div>
                    <div className="text-white font-bold">{winProbability.riskReward.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Button */}
            {(currentSignal || sniperTradeSetup) && state.status === 'SIGNAL_GENERATED' && (
              <button
                onClick={handleExecuteTrade}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
              >
                Execute {state.tradingMode} Trade
              </button>
            )}
          </div>

          {/* Active Positions */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Activity size={16} />
              Active Positions ({activePositions.length})
            </h2>
            
            {activePositions.length > 0 ? (
              <div className="space-y-2">
                {activePositions.map(pos => (
                  <div key={pos.id} className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-white">{pos.symbol}</div>
                      <div className={`text-sm font-bold ${
                        pos.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Qty</div>
                        <div className="text-white">{pos.quantity}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Entry</div>
                        <div className="text-white">{pos.avgPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Current</div>
                        <div className="text-white">{pos.currentPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">P&L%</div>
                        <div className={pos.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {((pos.unrealizedPnL / (pos.avgPrice * pos.quantity)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleCloseAllPositions}
                  className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                >
                  Close All Positions
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                No active positions
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <BarChart3 size={16} />
              Today's Performance
            </h2>
            
            {tradeStats && recentTrades.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Trades</div>
                  <div className="text-xl font-bold text-white">{recentTrades.length}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Win Rate</div>
                  <div className="text-xl font-bold text-green-400">
                    {((tradeStats.winRate || 0) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">P&L</div>
                  <div className={`text-xl font-bold ${
                    (tradeStats.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {(tradeStats.totalPnL || 0) >= 0 ? '+' : ''}{(tradeStats.totalPnL || 0).toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Drawdown</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {accountStatus.currentDrawdown.toFixed(1)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 text-sm">
                No trades executed today
              </div>
            )}
          </div>

          {/* AI Predictions Panel */}
          {aiEnabled && currentPrediction && (
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                AI Prediction
              </h2>
              
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-lg font-black flex items-center gap-2 ${
                    currentPrediction.direction === 'UP' ? 'text-green-400' :
                    currentPrediction.direction === 'DOWN' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {currentPrediction.direction === 'UP' && <TrendingUp size={20} />}
                    {currentPrediction.direction === 'DOWN' && <TrendingDown size={20} />}
                    {currentPrediction.direction}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Confidence</div>
                    <div className="text-lg font-bold text-white">{currentPrediction.confidence}%</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-2">
                  Expected: {currentPrediction.expectedMove > 0 ? '+' : ''}{currentPrediction.expectedMove} pts in {currentPrediction.timeframe}
                </div>
                <div className="space-y-1 text-xs">
                  {currentPrediction.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-slate-500">{factor.name}</span>
                      <span className={
                        factor.signal === 'BULLISH' ? 'text-green-400' :
                        factor.signal === 'BEARISH' ? 'text-red-400' :
                        'text-slate-400'
                      }>
                        {factor.signal}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Anomaly Alerts */}
          {anomalies.length > 0 && (
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-orange-400" />
                Market Anomalies ({anomalies.length})
              </h2>
              
              <div className="space-y-2">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className={`border rounded-lg p-3 ${
                    anomaly.severity === 'HIGH' ? 'border-red-500/30 bg-red-500/5' :
                    anomaly.severity === 'MEDIUM' ? 'border-orange-500/30 bg-orange-500/5' :
                    'border-yellow-500/30 bg-yellow-500/5'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`text-xs px-2 py-0.5 rounded font-bold ${
                        anomaly.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                        anomaly.severity === 'MEDIUM' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {anomaly.severity}
                      </div>
                      <div className="text-xs text-slate-400">{anomaly.type}</div>
                    </div>
                    <div className="text-sm text-white mb-1">{anomaly.message}</div>
                    {anomaly.historicalContext && (
                      <div className="text-xs text-slate-500 mb-1">{anomaly.historicalContext}</div>
                    )}
                    {anomaly.suggestedAction && (
                      <div className="text-xs text-blue-400">💡 {anomaly.suggestedAction}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Analysis Log */}
        <div className="glass-panel rounded-xl p-4 flex flex-col">
          <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
            <Activity size={16} />
            System Log
          </h2>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 font-mono text-xs">
            {analysisLog.length > 0 ? (
              analysisLog.map((log, idx) => (
                <div key={idx} className={`p-2 rounded ${
                  log.includes('✅') ? 'bg-green-500/10 text-green-400' :
                  log.includes('❌') || log.includes('⚠️') ? 'bg-red-500/10 text-red-400' :
                  log.includes('🎯') || log.includes('📊') ? 'bg-blue-500/10 text-blue-400' :
                  'bg-slate-900/50 text-slate-400'
                }`}>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-600">
                System ready. Start monitoring to begin.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAutoTrade;
