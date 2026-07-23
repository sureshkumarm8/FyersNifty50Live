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
import { EnhancedSignalGenerator, EnhancedSignal } from '../services/enhancedSignalGenerator';
import { getNextExpiryDate, getFormattedExpiryDate } from '../constants/niftyExpiryDates';
import { getMarketTimeInfo, formatDelay } from '../utils/marketTime';

type TradeMode = 'PAPER' | 'LIVE';
type SystemStatus = 'IDLE' | 'MONITORING' | 'SIGNAL_GENERATED' | 'IN_TRADE' | 'PAUSED';
type ActiveTab = 'momentum' | 'sniper';

interface UnifiedAutoTradeProps {
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  aiEnabled: boolean;
}

interface StrategyState {
  status: SystemStatus;
  isMonitoring: boolean;
  currentSignal: TradingSignal | null;
  tradeSetup: TradeSetup | null;
  activePositions: Position[];
}

interface SystemState {
  tradingMode: TradeMode;
  activeTab: ActiveTab;
  momentum: StrategyState;
  sniper: StrategyState;
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
  // console.log('[AutoTrade] Component render at', new Date().toLocaleTimeString(), 'stocks:', stocks?.length, 'history:', historyLog?.length);
  // Main State - Persisted in localStorage
  const [state, setState] = useState<SystemState>(() => {
    try {
      const saved = localStorage.getItem('autotrade_state');
      return saved ? JSON.parse(saved) : {
        tradingMode: 'PAPER',
        activeTab: 'momentum',
        momentum: {
          status: 'IDLE',
          isMonitoring: false,
          currentSignal: null,
          tradeSetup: null,
          activePositions: []
        },
        sniper: {
          status: 'IDLE',
          isMonitoring: false,
          currentSignal: null,
          tradeSetup: null,
          activePositions: []
        }
      };
    } catch {
      return {
        tradingMode: 'PAPER',
        activeTab: 'momentum',
        momentum: {
          status: 'IDLE',
          isMonitoring: false,
          currentSignal: null,
          tradeSetup: null,
          activePositions: []
        },
        sniper: {
          status: 'IDLE',
          isMonitoring: false,
          currentSignal: null,
          tradeSetup: null,
          activePositions: []
        }
      };
    }
  });

  const [currentSignal, setCurrentSignal] = useState<TradingSignal | null>(null);
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [tradeStats, setTradeStats] = useState<TradeStats | null>(null);
  const [analysisLog, setAnalysisLog] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('autotrade_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [accountStatus, setAccountStatus] = useState({
    currentEquity: 100000,
    peakEquity: 100000,
    dailyLoss: 0,
    currentDrawdown: 0,
    canTrade: true
  });

  // Sniper Strategy Specific State
  const [sniperZones, setSniperZones] = useState<SniperZone | null>(null);
  const [sniperDailyTradeExecuted, setSniperDailyTradeExecuted] = useState(false);
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(() => {
    const saved = localStorage.getItem('autotrade_auto_execute');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Refs for sniper state to avoid recreating callbacks
  const sniperZonesRef = useRef(sniperZones);
  const sniperDailyTradeExecutedRef = useRef(sniperDailyTradeExecuted);
  
  useEffect(() => {
    sniperZonesRef.current = sniperZones;
    sniperDailyTradeExecutedRef.current = sniperDailyTradeExecuted;
  }, [sniperZones, sniperDailyTradeExecuted]);

  // AI Prediction State
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [winProbability, setWinProbability] = useState<TradeWinProbability | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  // Service Refs
  const engineRef = useRef<TradingEngine | null>(null);
  const orderManagerRef = useRef<OrderManager | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountRef = useRef(true);
  const autoExecuteTriggeredRef = useRef(false);
  const lastAICallRef = useRef<number>(0);
  
  // Track component lifecycle
  useEffect(() => {
    // console.log('[AutoTrade] Component MOUNTED');
    return () => {
      // console.log('[AutoTrade] Component UNMOUNTED');
    };
  }, []);
  
  // Refs for frequently changing props to prevent runAnalysis recreation
  const stocksRef = useRef(stocks);
  const historyLogRef = useRef(historyLog);
  const pivotsRef = useRef(pivots);
  const niftyLtpRef = useRef(niftyLtp);
  
  // Update refs when props change
  useEffect(() => {
    stocksRef.current = stocks;
    historyLogRef.current = historyLog;
    pivotsRef.current = pivots;
    niftyLtpRef.current = niftyLtp;
  }, [stocks, historyLog, pivots, niftyLtp]);

  // Add log function
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setAnalysisLog(prev => {
      const newLogs = [`[${timestamp}] ${message}`, ...prev.slice(0, 49)];
      localStorage.setItem('autotrade_logs', JSON.stringify(newLogs));
      return newLogs;
    });
  }, []);

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

  // Restore monitoring state message on mount
  useEffect(() => {
    if (isFirstMountRef.current && state && state.momentum && state.sniper && (state.momentum.isMonitoring || state.sniper.isMonitoring)) {
      const strategies = [];
      if (state.momentum.isMonitoring) strategies.push('Momentum');
      if (state.sniper.isMonitoring) strategies.push('Sniper');
      addLog(`🔄 AutoTrade restored - ${strategies.join(' & ')} monitoring active`);
      isFirstMountRef.current = false;
    }
  }, [state.momentum?.isMonitoring, state.sniper?.isMonitoring, addLog]);

  // Auto-start monitoring during market hours on app load
  useEffect(() => {
    if (!credentials.bypassMarketHours && isFirstMountRef.current && state && state.momentum && state.sniper) {
      if (!state.momentum.isMonitoring && !state.sniper.isMonitoring) {
        const marketInfo = getMarketTimeInfo();
        
        // Auto-start both if app loads during market hours (9:17 AM - 3:35 PM IST)
        if (marketInfo.isWeekday && marketInfo.timeVal >= 917 && marketInfo.timeVal <= 1535) {
          addLog('🔔 Market hours detected - Auto-starting both strategies');
          setState(prev => ({ 
            ...prev, 
            momentum: { ...prev.momentum, isMonitoring: true, status: 'MONITORING' },
            sniper: { ...prev.sniper, isMonitoring: true, status: 'MONITORING' }
          }));
        }
      }
    }
  }, [credentials.bypassMarketHours, state.momentum?.isMonitoring, state.sniper?.isMonitoring, addLog]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('autotrade_state', JSON.stringify(state));
  }, [state]);

  // Strategy: MOMENTUM - Enhanced Multi-factor Analysis with Historical Data
  const runMomentumAnalysis = useCallback(() => {
    const nifty = niftyLtpRef.current;
    const history = historyLogRef.current;
    const currentPivots = pivotsRef.current;
    const currentStocks = stocksRef.current;
    
    if (!nifty || !history || history.length < 5) {
      if (!nifty) addLog('⚠️ [MOMENTUM] No Nifty LTP available');
      else addLog(`⏳ [MOMENTUM] Waiting for more historical data (${history.length}/5)`);
      return;
    }

    addLog('🔍 [MOMENTUM] Analyzing with live historical data...');

    // Generate enhanced signal using historical data
    const enhancedSignal = EnhancedSignalGenerator.generateSignal(
      history,
      currentPivots?.s1 || nifty - 50,
      currentPivots?.r1 || nifty + 50,
      nifty
    );

    // Convert enhanced signal to UI format
    const signal: TradingSignal = {
      signal: enhancedSignal.direction,
      confidence: enhancedSignal.confidence,
      direction: enhancedSignal.direction,
      reason: enhancedSignal.reasons.join(' | '),
      entryPrice: enhancedSignal.suggestedEntry,
      targetPrice: enhancedSignal.suggestedTarget,
      stopLossPrice: enhancedSignal.suggestedStopLoss,
      metrics: {
        momentum_1m: enhancedSignal.metrics.momentumScore,
        momentum_5m: enhancedSignal.metrics.trendStrength,
        volatility: enhancedSignal.metrics.volatility,
        volumeRatio: enhancedSignal.metrics.callPutRatio,
        orderFlowImbalance: enhancedSignal.metrics.broadSentiment,
        optionsSentiment: enhancedSignal.metrics.optionFlowStrength * (enhancedSignal.metrics.optionFlow === 'BULLISH' ? 1 : -1),
      },
      reasons: [
        `Trend: ${enhancedSignal.metrics.trend15m} (${enhancedSignal.metrics.trendStrength.toFixed(0)}%)`,
        `Sentiment: ${enhancedSignal.metrics.broadSentiment.toFixed(0)}%`,
        `Options: ${enhancedSignal.metrics.optionFlow} (${enhancedSignal.metrics.optionFlowStrength.toFixed(0)})`,
        `Momentum: ${enhancedSignal.metrics.momentumScore.toFixed(0)}`,
        `Volatility: ${enhancedSignal.metrics.volatility.toFixed(0)}% (${enhancedSignal.metrics.volatilityTrend})`,
        `Support: ${enhancedSignal.metrics.support.toFixed(0)} | Resistance: ${enhancedSignal.metrics.resistance.toFixed(0)}`,
        `R:R = ${enhancedSignal.riskRewardRatio.toFixed(2)}`,
      ],
    };

    if (enhancedSignal.direction !== 'NEUTRAL' && enhancedSignal.confidence >= 65) {
      setState(prev => ({
        ...prev,
        momentum: { ...prev.momentum, currentSignal: signal, status: 'SIGNAL_GENERATED' }
      }));
      
      const strength = enhancedSignal.metrics.signalStrength;
      const color = enhancedSignal.direction === 'LONG' ? '📈' : '📉';
      addLog(`${color} [MOMENTUM] ${enhancedSignal.direction} Signal (${strength}) | Confidence: ${enhancedSignal.confidence.toFixed(0)}%`);
      
      enhancedSignal.reasons.forEach(r => addLog(`  • ${r}`));
    } else {
      addLog(`⏸️ [MOMENTUM] No strong signal (${enhancedSignal.direction})`);
    }
  }, [addLog]);

  // Strategy: SNIPER - Enhanced Office Hour 30pt Strategy with Historical Data
  const runSniperAnalysis = useCallback(() => {
    const nifty = niftyLtpRef.current;
    const history = historyLogRef.current;
    const currentPivots = pivotsRef.current;
    const zones = sniperZonesRef.current;
    const tradeSetup = state.sniper.tradeSetup;
    const dailyTradeExecuted = sniperDailyTradeExecutedRef.current;
    
    if (!nifty || !history || history.length < 3) {
      addLog('⚠️ [SNIPER] Insufficient data (need 3+ candles)');
      return;
    }
    if (dailyTradeExecuted) return;

    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hour = istTime.getHours();
    const min = istTime.getMinutes();
    const timeValue = hour * 100 + min;

    // Phase 1: Download phase (09:15-09:35)
    if (timeValue >= 915 && timeValue < 935 && !zones) {
      const firstCandles = history.slice(0, 10);
      
      // Use historical highs/lows for accurate zones
      const highs = firstCandles.map(c => c.niftyLtp);
      const lows = firstCandles.map(c => c.niftyLtp);
      
      const fiveMinHigh = Math.max(...highs);
      const fiveMinLow = Math.min(...lows);
      const openPrice = firstCandles[0]?.niftyLtp || nifty;
      const prevClose = currentPivots?.dayLow || nifty - 100;
      
      const support = currentPivots?.s1 || (fiveMinLow - 20);
      const resistance = currentPivots?.r1 || (fiveMinHigh + 20);
      
      let openType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT' = 'FLAT';
      if (openPrice > prevClose + 20) openType = 'GAP_UP';
      else if (openPrice < prevClose - 20) openType = 'GAP_DOWN';

      const zones: any = {
        support,
        resistance,
        fiveMinHigh,
        fiveMinLow,
        openType,
        currentZone: 'NEUTRAL'
      };

      setSniperZones(zones);
      addLog(`✅ [SNIPER] Download phase complete`);
      addLog(`  📊 High: ${fiveMinHigh.toFixed(0)} | Low: ${fiveMinLow.toFixed(0)} | Range: ${(fiveMinHigh - fiveMinLow).toFixed(0)}pts`);
      addLog(`  🔐 Support: ${support.toFixed(0)} | Resistance: ${resistance.toFixed(0)} | Type: ${openType}`);
    }

    // Fallback: If zones not set by 9:35, use historical analysis
    if (timeValue >= 935 && timeValue < 1015 && !zones) {
      if (currentPivots) {
        const enhancedAnalysis = EnhancedSignalGenerator.generateSignal(
          history,
          currentPivots.s1,
          currentPivots.r1,
          nifty
        );

        const zones: any = {
          support: enhancedAnalysis.metrics.support,
          resistance: enhancedAnalysis.metrics.resistance,
          fiveMinHigh: nifty + 50,
          fiveMinLow: nifty - 50,
          openType: 'FLAT',
          currentZone: 'NEUTRAL'
        };
        setSniperZones(zones);
        addLog(`🔄 [SNIPER] Using enhanced historical analysis for zones`);
        addLog(`  📊 Volatility: ${enhancedAnalysis.metrics.volatility.toFixed(0)}% | Trend: ${enhancedAnalysis.metrics.trend15m}`);
      }
    }

    // Phase 2: Entry window (09:25-10:15) with enhanced decision making
    if (timeValue >= 925 && timeValue <= 1015 && zones && !tradeSetup) {
      const distToSupport = Math.abs(nifty - zones.support);
      const distToResistance = Math.abs(nifty - zones.resistance);
      
      let zone: 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'NEUTRAL' = 'NEUTRAL';
      if (distToSupport < 30) zone = 'NEAR_SUPPORT';
      else if (distToResistance < 30) zone = 'NEAR_RESISTANCE';

      zones.currentZone = zone;
      
      // Log every 2 minutes
      if (min % 2 === 0) {
        const rangeText = `Range: ${(distToSupport + distToResistance).toFixed(0)}pts`;
        addLog(`👁️ [SNIPER] ${nifty.toFixed(0)} | Zone: ${zone} | S:${distToSupport.toFixed(0)} R:${distToResistance.toFixed(0)} | ${rangeText}`);
      }

      if (zone === 'NEAR_SUPPORT' || zone === 'NEAR_RESISTANCE') {
        // Use enhanced analysis for better entry decision
        const enhancedSignal = EnhancedSignalGenerator.generateSignal(
          history,
          zones.support,
          zones.resistance,
          nifty
        );

        // Only trade if enhanced signal aligns with zone proximity
        const shouldTrade = (zone === 'NEAR_SUPPORT' && enhancedSignal.direction === 'LONG') ||
                          (zone === 'NEAR_RESISTANCE' && enhancedSignal.direction === 'SHORT');

        if (shouldTrade && enhancedSignal.confidence >= 55) {
          const isCallSetup = zone === 'NEAR_SUPPORT';
          const strikeStep = 50;
          const atm = Math.round(nifty / strikeStep) * strikeStep;
          const itmStrike = isCallSetup ? atm - 100 : atm + 100;
          
          const setup: TradeSetup = {
            strikePrice: itmStrike,
            optionType: isCallSetup ? 'CE' : 'PE',
            direction: 'LONG',
            entryPrice: nifty,
            targetPrice: isCallSetup ? nifty + 30 : nifty - 30,
            stopLossPrice: isCallSetup ? nifty - 30 : nifty + 30,
            confidence: enhancedSignal.confidence,
            reasoning: [
              `${zone} + ${enhancedSignal.metrics.trend15m} trend`,
              `Volatility: ${enhancedSignal.metrics.volatility.toFixed(0)}%`,
              `Sentiment: ${enhancedSignal.metrics.broadSentiment.toFixed(0)}%`,
              `Options: ${enhancedSignal.metrics.optionFlow}`,
            ],
            expiryDate: getFormattedExpiryDate(getNextExpiryDate()),
            itmAmount: 100
          };

          setState(prev => ({
            ...prev,
            sniper: { ...prev.sniper, tradeSetup: setup, status: 'SIGNAL_GENERATED' }
          }));
          
          addLog(`🎯 [SNIPER] Setup: ${setup.optionType} ${setup.strikePrice} | Target: ±30pts | Conf: ${enhancedSignal.confidence.toFixed(0)}%`);
          addLog(`  📈 Volatility: ${enhancedSignal.metrics.volatility.toFixed(0)}% | Sentiment: ${enhancedSignal.metrics.broadSentiment.toFixed(0)}%`);
          
          // Trigger auto-execute flag
          if (autoExecuteEnabled && !autoExecuteTriggeredRef.current) {
            autoExecuteTriggeredRef.current = true;
            addLog('⚡ Auto-execute will trigger in 1 second...');
          }
        }
      }
    }

    // Phase 3: Hard stop at 10:15
    if (timeValue > 1015 && state.sniper.activePositions.length > 0) {
      addLog('⏰ [SNIPER] 10:15 AM - Force closing positions');
      handleCloseAllPositions('sniper');
    }
  }, [addLog, autoExecuteEnabled, state.sniper.tradeSetup, state.sniper.activePositions]);

  // Unified Analysis Runner - runs both strategies
  const runAnalysis = useCallback(async () => {
    if (state.momentum.isMonitoring) {
      runMomentumAnalysis();
    }
    
    if (state.sniper.isMonitoring) {
      runSniperAnalysis();
    }
    
    // Run AI predictions if enabled
    const nifty = niftyLtpRef.current;
    const history = historyLogRef.current;
    const currentStocks = stocksRef.current;
    const currentPivots = pivotsRef.current;
    
    if (aiEnabled && nifty && history.length >= 5) {
      // Throttle AI calls to once per 30 seconds
      const now = Date.now();
      if (now - lastAICallRef.current < 30000) {
        return;
      }
      lastAICallRef.current = now;
      
      const latest = history[0];
      
      try {
        const prediction = await predictionEngine.predictNextMove({
          niftyLtp: nifty,
          marketSnapshot: latest,
          last5Minutes: history.slice(-5),
          stocks: currentStocks,
          pivots: currentPivots
        });
        setCurrentPrediction(prediction);
        
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
  }, [state.momentum.isMonitoring, state.sniper.isMonitoring, runMomentumAnalysis, runSniperAnalysis, aiEnabled, addLog]);
  
  // Calculate win probability when signal is generated
  useEffect(() => {
    const momentumSetup = state.momentum.currentSignal;
    const sniperSetup = state.sniper.tradeSetup;
    
    if ((momentumSetup || sniperSetup) && aiEnabled) {
      const setup = momentumSetup || sniperSetup;
      if (!setup) return;
      
      const nifty = niftyLtpRef.current;
      const history = historyLogRef.current;
      if (!nifty) return;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      predictionEngine.getTradeWinProbability({
        entryPrice: setup.entryPrice,
        direction: setup.direction,
        strikePrice: setup.strikePrice,
        optionType: setup.optionType,
        marketContext: {
          time: currentTime,
          niftyLtp: nifty,
          sentiment: history[0]?.overallSent || 0,
          pcr: history[0]?.pcr || 1,
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
  }, [state.momentum.currentSignal, state.sniper.tradeSetup, aiEnabled, addLog]);

  // Monitoring Loop - runs both strategies independently
  useEffect(() => {
    const isAnyMonitoring = state.momentum.isMonitoring || state.sniper.isMonitoring;
    
    if (!isAnyMonitoring) {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      return;
    }

    // Get market time info
    const marketInfo = getMarketTimeInfo();

    // Don't start monitoring before 9:17 AM IST unless bypass is enabled
    if (marketInfo.isBeforeMarketStart && !credentials.bypassMarketHours) {
      // Schedule monitoring to start at 9:17 AM IST
      const delayTime = formatDelay(marketInfo.delayUntil917);
      const strategies = [];
      if (state.momentum.isMonitoring) strategies.push('Momentum');
      if (state.sniper.isMonitoring) strategies.push('Sniper');
      addLog(`⏰ ${strategies.join(' & ')} monitoring scheduled at 9:17 AM IST (in ${delayTime})`);
      
      const timeoutId = setTimeout(() => {
        const strategies = [];
        if (state.momentum.isMonitoring) strategies.push('Momentum');
        if (state.sniper.isMonitoring) strategies.push('Sniper');
        addLog(`🔔 9:17 AM IST - Starting ${strategies.join(' & ')} monitoring`);
        runAnalysis();
        
        monitorIntervalRef.current = setInterval(() => {
          runAnalysis();
        }, 60000);
      }, marketInfo.delayUntil917);
      
      return () => {
        clearTimeout(timeoutId);
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current);
          monitorIntervalRef.current = null;
        }
      };
    } else {
      // Normal behavior: start immediately
      const strategies = [];
      if (state.momentum.isMonitoring) strategies.push('Momentum');
      if (state.sniper.isMonitoring) strategies.push('Sniper');
      addLog(`🚀 Started monitoring with ${strategies.join(' & ')} strategies`);
      runAnalysis();
      
      monitorIntervalRef.current = setInterval(() => {
        runAnalysis();
      }, 60000); // Every 1 minute to match data refresh

      return () => {
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current);
          monitorIntervalRef.current = null;
        }
      };
    }
  }, [state.momentum.isMonitoring, state.sniper.isMonitoring, runAnalysis, credentials.bypassMarketHours, addLog]);

  const handleExecuteTrade = async (strategy: 'momentum' | 'sniper') => {
    if (!orderManagerRef.current) return;

    const setup = strategy === 'sniper' ? state.sniper.tradeSetup : state.momentum.currentSignal;
    if (!setup) return;

    setState(prev => ({
      ...prev,
      [strategy]: { ...prev[strategy], status: 'IN_TRADE' }
    }));
    addLog(`📤 [${strategy.toUpperCase()}] Executing ${state.tradingMode} trade...`);

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
        setState(prev => ({
          ...prev,
          [strategy]: { ...prev[strategy], activePositions: [...prev[strategy].activePositions, result.position!] }
        }));
        addLog(`✅ [${strategy.toUpperCase()}] Position opened: ${result.position.symbol}`);

        if (strategy === 'sniper') {
          setSniperDailyTradeExecuted(true);
        }
      } else {
        addLog(`❌ [${strategy.toUpperCase()}] Trade failed: ${result.message}`);
        setState(prev => ({ ...prev, [strategy]: { ...prev[strategy], status: 'MONITORING' } }));
      }
    } catch (error: any) {
      addLog(`❌ [${strategy.toUpperCase()}] Error: ${error.message}`);
      setState(prev => ({ ...prev, [strategy]: { ...prev[strategy], status: 'MONITORING' } }));
    }
  };

  const handleCloseAllPositions = async (strategy?: 'momentum' | 'sniper') => {
    if (!orderManagerRef.current) return;

    const strategies = strategy ? [strategy] : [];
    if (!strategy) {
      if (state.momentum.activePositions.length > 0) strategies.push('momentum');
      if (state.sniper.activePositions.length > 0) strategies.push('sniper');
    }

    if (strategies.length === 0) return;

    for (const strat of strategies) {
      const positions = state[strat].activePositions;
      if (positions.length === 0) continue;

      addLog(`🔄 [${strat.toUpperCase()}] Closing all positions...`);
      const results = await orderManagerRef.current.closeAllPositions(positions);
      
      results.forEach(r => {
        addLog(r.success ? `✅ [${strat.toUpperCase()}] Position closed` : `❌ [${strat.toUpperCase()}] ${r.message}`);
      });
      
      setState(prev => ({
        ...prev,
        [strat]: { ...prev[strat], activePositions: [], status: 'IDLE' }
      }));
    }
  };

  const toggleMonitoring = (strategy: 'momentum' | 'sniper') => {
    setState(prev => ({
      ...prev,
      [strategy]: {
        ...prev[strategy],
        isMonitoring: !prev[strategy].isMonitoring,
        status: !prev[strategy].isMonitoring ? 'MONITORING' : 'IDLE'
      }
    }));
  };

  // Auto-execute effect - runs after handleExecuteTrade is defined
  useEffect(() => {
    if (autoExecuteTriggeredRef.current && autoExecuteEnabled) {
      const timer = setTimeout(() => {
        addLog('⚡ Auto-executing Sniper trade now...');
        handleExecuteTrade('sniper');
        autoExecuteTriggeredRef.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.sniper.status, autoExecuteEnabled]);

  return (
    <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Header with Tab Selector */}
      <div className="flex-none glass-header border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-blue-400" size={24} />
              AutoTrade Pro
            </h1>
            
            {/* Strategy Tabs - Switch between full-screen views */}
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10 gap-1">
              <button
                onClick={() => setState(prev => ({ ...prev, activeTab: 'momentum' }))}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                  state.activeTab === 'momentum'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Brain size={14} />
                Momentum
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, activeTab: 'sniper' }))}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${
                  state.activeTab === 'sniper'
                    ? 'bg-yellow-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap size={14} />
                Sniper
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setState(prev => ({ ...prev, tradingMode: 'PAPER' }))}
                disabled={state.momentum.isMonitoring || state.sniper.isMonitoring}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  state.tradingMode === 'PAPER'
                    ? 'bg-green-600 text-white'
                    : 'text-slate-400 hover:text-white disabled:opacity-50'
                }`}
              >
                PAPER
              </button>
              <button
                onClick={() => {
                  if (credentials.liveOrdersEnabled) {
                    setState(prev => ({ ...prev, tradingMode: 'LIVE' }));
                  } else {
                    alert('Live orders are disabled. Enable in Settings → Configuration → Live Trading');
                  }
                }}
                disabled={(state.momentum.isMonitoring || state.sniper.isMonitoring) || !credentials.liveOrdersEnabled}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  state.tradingMode === 'LIVE'
                    ? 'bg-red-600 text-white animate-pulse'
                    : credentials.liveOrdersEnabled 
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 cursor-not-allowed opacity-40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!credentials.liveOrdersEnabled ? 'Enable Live Orders in Settings first' : ''}
              >
                LIVE {!credentials.liveOrdersEnabled && '🔒'}
              </button>
            </div>

            {/* Status Badge - Only active tab */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              state.activeTab === 'momentum'
                ? state.momentum.status === 'IN_TRADE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  state.momentum.status === 'MONITORING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-slate-800 text-slate-400 border border-white/10'
                : state.sniper.status === 'IN_TRADE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  state.sniper.status === 'MONITORING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-slate-800 text-slate-400 border border-white/10'
            }`}>
              <Activity size={14} className={state.activeTab === 'momentum' ? (state.momentum.isMonitoring ? 'animate-pulse' : '') : (state.sniper.isMonitoring ? 'animate-pulse' : '')} />
              {state.activeTab === 'momentum' ? state.momentum.status : state.sniper.status}
            </div>

            {/* Monitor Toggle - Only active tab */}
            <button
              onClick={() => toggleMonitoring(state.activeTab)}
              disabled={!niftyLtp}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${
                state.activeTab === 'momentum'
                  ? state.momentum.isMonitoring
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50'
                  : state.sniper.isMonitoring
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg disabled:opacity-50'
              }`}
            >
              {state.activeTab === 'momentum'
                ? state.momentum.isMonitoring ? <Pause size={16} /> : <Play size={16} />
                : state.sniper.isMonitoring ? <Pause size={16} /> : <Play size={16} />
              }
              {state.activeTab === 'momentum'
                ? state.momentum.isMonitoring ? 'Stop' : 'Start'
                : state.sniper.isMonitoring ? 'Stop' : 'Start'
              }
            </button>

            {/* Auto-Execute Toggle - Only for Sniper */}
            {state.activeTab === 'sniper' && (
              <button
                onClick={() => {
                  const newValue = !autoExecuteEnabled;
                  setAutoExecuteEnabled(newValue);
                  localStorage.setItem('autotrade_auto_execute', JSON.stringify(newValue));
                  addLog(newValue ? '⚡ Auto-execute enabled (Sniper)' : '⏸️ Auto-execute disabled');
                }}
                disabled={state.sniper.isMonitoring}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border ${
                  autoExecuteEnabled
                    ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                    : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Auto-execute Sniper trades when signal is generated"
              >
                <Zap size={12} className={autoExecuteEnabled ? 'animate-pulse' : ''} />
                {autoExecuteEnabled ? 'AUTO' : 'MANUAL'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen Tab Content */}
      <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">
          
        {/* MOMENTUM TAB - Full Screen */}
        {state.activeTab === 'momentum' && (
          <>
            {/* Current Signal */}
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Target size={16} />
                MOMENTUM - Current Signal
              </h2>
              
              {state.momentum.currentSignal ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`text-2xl font-black ${
                      state.momentum.currentSignal.signal === 'LONG' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {state.momentum.currentSignal.signal === 'LONG' ? '📈 LONG' : '📉 SHORT'}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Confidence</div>
                      <div className="text-xl font-bold text-white">{state.momentum.currentSignal.confidence}%</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">{state.momentum.currentSignal.reason}</div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                    <div>
                      <div className="text-xs text-slate-500">Entry</div>
                      <div className="text-sm font-bold text-white">{state.momentum.currentSignal.entryPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Target</div>
                      <div className="text-sm font-bold text-green-400">{state.momentum.currentSignal.targetPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Stop</div>
                      <div className="text-sm font-bold text-red-400">{state.momentum.currentSignal.stopLossPrice.toFixed(2)}</div>
                    </div>
                  </div>
                  {state.momentum.status === 'SIGNAL_GENERATED' && (
                    <button
                      onClick={() => handleExecuteTrade('momentum')}
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
                    >
                      Execute {state.tradingMode} Trade - Momentum
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Monitoring market for Momentum opportunities...</p>
                </div>
              )}
            </div>

            {/* Active Positions - Momentum */}
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Activity size={16} />
                Active Positions - Momentum ({state.momentum.activePositions.length})
              </h2>
              
              {state.momentum.activePositions.length > 0 ? (
                <div className="space-y-2">
                  {state.momentum.activePositions.map(pos => (
                    <div key={pos.id} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-blue-300">{pos.symbol}</div>
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
                          <div className="text-slate-500">P&L %</div>
                          <div className={pos.unrealizedPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {(pos.unrealizedPnLPercent || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Activity size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active Momentum positions</p>
                </div>
              )}
              
              {state.momentum.activePositions.length > 0 && (
                <button
                  onClick={() => handleCloseAllPositions('momentum')}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                >
                  Close All Momentum Positions
                </button>
              )}
            </div>
          </>
        )}

        {/* SNIPER TAB - Full Screen */}
        {state.activeTab === 'sniper' && (
          <>
            {/* Current Setup */}
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Target size={16} />
                SNIPER - Current Setup
              </h2>
              
              {state.sniper.tradeSetup ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-yellow-400">
                      🎯 {state.sniper.tradeSetup.optionType} {state.sniper.tradeSetup.strikePrice}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">ITM</div>
                      <div className="text-xl font-bold text-white">₹{state.sniper.tradeSetup.itmAmount}</div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {state.sniper.tradeSetup.reasoning.join(' • ')}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                    <div>
                      <div className="text-xs text-slate-500">Entry Zone</div>
                      <div className="text-sm font-bold text-white">{state.sniper.tradeSetup.entryPrice.toFixed(0)}</div>
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
                  {state.sniper.status === 'SIGNAL_GENERATED' && (
                    <button
                      onClick={() => handleExecuteTrade('sniper')}
                      className="w-full mt-4 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg"
                    >
                      Execute {state.tradingMode} Trade - Sniper
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for 09:25-10:15 AM IST entry window...</p>
                </div>
              )}
            </div>

            {/* Active Positions - Sniper */}
            <div className="glass-panel rounded-xl p-4">
              <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <Activity size={16} />
                Active Positions - Sniper ({state.sniper.activePositions.length})
              </h2>
              
              {state.sniper.activePositions.length > 0 ? (
                <div className="space-y-2">
                  {state.sniper.activePositions.map(pos => (
                    <div key={pos.id} className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-yellow-300">{pos.symbol}</div>
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
                          <div className="text-slate-500">P&L %</div>
                          <div className={pos.unrealizedPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {(pos.unrealizedPnLPercent || 0).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Activity size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active Sniper positions</p>
                </div>
              )}
              
              {state.sniper.activePositions.length > 0 && (
                <button
                  onClick={() => handleCloseAllPositions('sniper')}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                >
                  Close All Sniper Positions
                </button>
              )}
            </div>
          </>
        )}

        {/* Analysis Log */}
        <div className="glass-panel rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
            <Eye size={16} />
            Analysis Feed ({analysisLog.length})
          </h2>
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

export default UnifiedAutoTrade;
