import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Target, Shield,
  Brain, Zap, RefreshCw, Play, Pause, BarChart3, Eye, EyeOff, Crosshair,
  ArrowUp, ArrowDown, Calendar, DollarSign, Percent, Volume2, Activity, ChevronRight
} from 'lucide-react';
import { FyersCredentials, EnrichedFyersQuote, MarketSnapshot, StrategySignal, PivotPoints } from '../types';

interface AutoTradeState {
  status: 'idle' | 'monitoring' | 'analyzing' | 'entry_triggered' | 'in_trade' | 'exit_triggered' | 'closed';
  tradeActive: boolean;
  dailyTradeExecuted: boolean;
  executionTime: number | null;
}

interface TradeSetup {
  signal: 'LONG' | 'SHORT' | 'NONE';
  strikePrice: number;
  optionType: 'CE' | 'PE';
  entryPrice: number;
  entryLtp: number;
  targetPrice: number;
  stopLossPrice: number;
  expiryDate: string;
  confidence: number;
  reasoning: string;
  itmAmount: number;
  marketCondition: string;
}

interface TradeExecution {
  setup: TradeSetup;
  executedAt: number;
  executedPrice?: number;
  exitedAt?: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  exitReason?: 'TARGET' | 'STOPLOSS' | 'MANUAL' | 'EOD';
}

interface AutoTradeProps {
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  aiEnabled: boolean;
  quantAnalysis: StrategySignal | null;
}

const AutoTrade: React.FC<AutoTradeProps> = ({
  credentials,
  stocks,
  niftyLtp,
  historyLog,
  pivots,
  aiEnabled,
  quantAnalysis
}) => {
  const [autoTradeState, setAutoTradeState] = useState<AutoTradeState>({
    status: 'idle',
    tradeActive: false,
    dailyTradeExecuted: false,
    executionTime: null
  });

  const [tradeSetup, setTradeSetup] = useState<TradeSetup | null>(null);
  const [execution, setExecution] = useState<TradeExecution | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');

  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [nextExpiryDate, setNextExpiryDate] = useState<string>('');
  const [currentLtp, setCurrentLtp] = useState<number>(niftyLtp || 0);
  const [tradeMetrics, setTradeMetrics] = useState({
    maxGain: 0,
    maxLoss: 0,
    runupLtp: 0,
    drawdownLtp: 0
  });

  const monitoringRef = useRef(isMonitoring);
  const tradeSetupRef = useRef(tradeSetup);
  const executionRef = useRef(execution);
  const analysisCountRef = useRef(0);
  const lastAnalysisTimeRef = useRef(0);
  const marketCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if market is closed (NSE closes at 3:30 PM IST)
  const isMarketClosed = useCallback((): boolean => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const day = istTime.getDay();

    // Market closed on weekends (0=Sunday, 6=Saturday)
    if (day === 0 || day === 6) return true;

    // Market closes at 3:30 PM (15:30) IST
    if (hours > 15 || (hours === 15 && minutes >= 30)) return true;

    // Market opens at 9:15 AM (09:15) IST
    if (hours < 9 || (hours === 9 && minutes < 15)) return true;

    return false;
  }, []);

  useEffect(() => {
    monitoringRef.current = isMonitoring;
    tradeSetupRef.current = tradeSetup;
    executionRef.current = execution;
  }, [isMonitoring, tradeSetup, execution]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setAnalysisLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  }, []);

  // Market close monitoring
  useEffect(() => {
    marketCheckIntervalRef.current = setInterval(() => {
      if (isMarketClosed()) {
        setMarketStatus('CLOSED');
        if (isMonitoring) {
          setIsMonitoring(false);
          addLog('🛑 Market Close - AutoTrade Stopped');
          if (execution && execution.exitedAt === undefined) {
            addLog('⚠️ Pending trade marked as EOD exit');
          }
        }
      } else {
        setMarketStatus('OPEN');
      }
    }, 30000);

    return () => {
      if (marketCheckIntervalRef.current) clearInterval(marketCheckIntervalRef.current);
    };
  }, [isMonitoring, isMarketClosed, execution, addLog]);

  // Calculate next Tuesday expiry (weekly or monthly last Tuesday)
  useEffect(() => {
    const today = new Date();
    const day = today.getDay();
    
    // Days until next Tuesday (2 = Tuesday)
    let daysUntilTuesday = (2 - day + 7) % 7;
    if (daysUntilTuesday === 0) daysUntilTuesday = 7; // If today is Tuesday, next Tuesday

    const nextTuesday = new Date(today);
    nextTuesday.setDate(nextTuesday.getDate() + daysUntilTuesday);

    // Check if this is the last Tuesday of the month (monthly expiry)
    const testDate = new Date(nextTuesday);
    testDate.setDate(testDate.getDate() + 7);
    const isLastTuesday = testDate.getMonth() !== nextTuesday.getMonth();

    const expiryType = isLastTuesday ? 'MONTHLY' : 'WEEKLY';
    setNextExpiryDate(nextTuesday.toISOString().split('T')[0]);
  }, []);

  // Multi-factor analysis for trade generation
  const generateTradeSetup = useCallback(async () => {
    if (!niftyLtp || historyLog.length < 10 || autoTradeState.dailyTradeExecuted) return;

    try {
      analysisCountRef.current++;
      const now = Date.now();

      // Throttle to once every 5 mins
      if (now - lastAnalysisTimeRef.current < 300000) return;
      lastAnalysisTimeRef.current = now;

      addLog(`📊 Analysis Cycle #${analysisCountRef.current} starting...`);

      // === PHASE 1: Momentum Analysis ===
      const last15 = historyLog.slice(-15);
      const latest = last15[last15.length - 1];
      const prev5 = last15[0];

      const priceMove = latest.niftyLtp - prev5.niftyLtp;
      const sentimentTrend = latest.overallSent;
      const optionsSentiment = latest.optionsSent;
      const pcr = latest.pcr;

      addLog(`📈 Price Movement: ${priceMove.toFixed(2)} pts | Sentiment: ${sentimentTrend.toFixed(2)}%`);

      // === PHASE 2: Risk/Reward Profile ===
      const volatility = calculateVolatility(historyLog);
      const atr = volatility * niftyLtp * 0.01; // Approximate ATR

      addLog(`🌪️  Volatility: ${volatility.toFixed(2)}% | ATR: ${atr.toFixed(2)} pts`);

      // === PHASE 3: Confluence Checks ===
      const pivotConfluence = pivots ? calculatePivotConfluence(niftyLtp, pivots) : 'NEUTRAL';
      const flowConfluence = Math.abs(optionsSentiment) > 30 ? 'CONFIRMED' : 'WEAK';
      const stockHealthScore = calculateStockHealth(stocks);

      addLog(`🎯 Pivot Level: ${pivotConfluence} | Flow: ${flowConfluence} | Stock Health: ${stockHealthScore}`);

      // === PHASE 4: Signal Generation ===
      let signal: 'LONG' | 'SHORT' | 'NONE' = 'NONE';
      let confidence = 0;
      let marketCond = 'NEUTRAL';

      // Bullish Setup: Positive momentum + Bullish sentiment + Strong PCR
      if (priceMove > 15 && sentimentTrend > 15 && optionsSentiment > 20 && pcr > 1.0) {
        signal = 'LONG';
        confidence = Math.min(75 + (priceMove / 50), 95);
        marketCond = 'STRONG_BULL';
        addLog('✅ BULLISH SETUP: Momentum + Sentiment + PCR Confluence');
      }
      // Bearish Setup: Negative momentum + Bearish sentiment + Low PCR
      else if (priceMove < -15 && sentimentTrend < -15 && optionsSentiment < -20 && pcr < 0.8) {
        signal = 'SHORT';
        confidence = Math.min(75 + Math.abs(priceMove / 50), 95);
        marketCond = 'STRONG_BEAR';
        addLog('✅ BEARISH SETUP: Momentum + Sentiment + PCR Confluence');
      }
      // Contrarian at Pivot Levels
      else if (pivotConfluence === 'SUPPORT' && Math.abs(priceMove) < 10 && Math.abs(optionsSentiment) > 25) {
        signal = 'LONG';
        confidence = 65;
        marketCond = 'REVERSAL_LONG';
        addLog('✅ REVERSAL AT SUPPORT');
      } else if (pivotConfluence === 'RESISTANCE' && Math.abs(priceMove) < 10 && Math.abs(optionsSentiment) > 25) {
        signal = 'SHORT';
        confidence = 65;
        marketCond = 'REVERSAL_SHORT';
        addLog('✅ REVERSAL AT RESISTANCE');
      }

      // Risk/Reward Check
      let riskRewardVal = 1.5;
      if (confidence > 0) {
        riskRewardVal = (atr * 2) / (atr * 1.5);
        if (riskRewardVal < 1.2) {
          signal = 'NONE';
          confidence = 0;
          addLog('❌ Poor Risk/Reward Ratio - Setup Rejected');
        }
      }

      // === PHASE 5: Strike Selection (ITM 200-300 points) ===
      if (signal !== 'NONE' && confidence > 60) {
        const strikeStep = 50;
        const atm = Math.round(niftyLtp / strikeStep) * strikeStep;
        
        let targetStrike: number;
        let itmAmount: number;

        if (signal === 'LONG') {
          // For Call buying, we want ITM (below current price) by 200-300 points
          targetStrike = atm - 250; // 250 points ITM
          itmAmount = niftyLtp - targetStrike;
        } else {
          // For Put buying, we want ITM (above current price) by 200-300 points
          targetStrike = atm + 250; // 250 points ITM
          itmAmount = targetStrike - niftyLtp;
        }

        // Calculate target and stop loss
        const targetMove = atr * 1.5; // 1.5 ATR as target
        const stopLossMove = atr * 0.75; // 0.75 ATR as stop loss

        const setup: TradeSetup = {
          signal,
          strikePrice: targetStrike,
          optionType: signal === 'LONG' ? 'CE' : 'PE',
          entryPrice: 0, // To be filled on execution
          entryLtp: niftyLtp,
          targetPrice: signal === 'LONG' ? niftyLtp + targetMove : niftyLtp - targetMove,
          stopLossPrice: signal === 'LONG' ? niftyLtp - stopLossMove : niftyLtp + stopLossMove,
          expiryDate: nextExpiryDate,
          confidence: Math.round(confidence),
          reasoning: `${marketCond} | ITM: ${itmAmount.toFixed(0)}pts | R/R: ${riskRewardVal.toFixed(2)}`,
          itmAmount,
          marketCondition: marketCond
        };

        setTradeSetup(setup);
        setAutoTradeState(prev => ({ ...prev, status: 'entry_triggered' }));
        addLog(`🎯 TRADE SETUP GENERATED: ${signal} ${setup.optionType} @ ${setup.strikePrice} | Conf: ${confidence.toFixed(0)}%`);
      } else if (signal === 'NONE') {
        setTradeSetup(null);
        setAutoTradeState(prev => ({ ...prev, status: 'monitoring' }));
        addLog('⏸️  No valid setup. Continuing to monitor...');
      }
    } catch (error) {
      addLog(`❌ Analysis Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [niftyLtp, historyLog, stocks, pivots, autoTradeState.dailyTradeExecuted, addLog, nextExpiryDate]);

  // Volatility calculator
  const calculateVolatility = (history: MarketSnapshot[]): number => {
    if (history.length < 5) return 0;

    const changes = [];
    for (let i = 1; i < Math.min(history.length, 20); i++) {
      const change = (history[i].niftyLtp - history[i - 1].niftyLtp) / history[i - 1].niftyLtp;
      changes.push(change);
    }

    if (changes.length === 0) return 0;

    const mean = changes.reduce((a, b) => a + b) / changes.length;
    const variance = changes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);

    return stdDev * 100;
  };

  // Pivot level confluence
  const calculatePivotConfluence = (ltp: number, pivots: PivotPoints): string => {
    const { r1, s1, r2, s2, pivot } = pivots;

    // Near Resistance
    if (ltp > r1 - 100 && ltp <= r1 + 100) return 'RESISTANCE';
    if (ltp > r2 - 150 && ltp <= r2 + 100) return 'RESISTANCE_2';

    // Near Support
    if (ltp < s1 + 100 && ltp >= s1 - 100) return 'SUPPORT';
    if (ltp < s2 + 150 && ltp >= s2 - 100) return 'SUPPORT_2';

    // Near Pivot
    if (ltp > pivot - 50 && ltp < pivot + 50) return 'PIVOT';

    return 'NEUTRAL';
  };

  // Stock health score
  const calculateStockHealth = (stocks: EnrichedFyersQuote[]): number => {
    if (stocks.length === 0) return 50;

    const bullishCount = stocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
    const bearishCount = stocks.filter(s => (s.lp_chg_day_p || 0) < 0).length;
    const avgNetStrength = stocks.reduce((sum, s) => sum + (s.day_net_strength || 0), 0) / stocks.length;

    const healthScore = 50 + ((bullishCount - bearishCount) / stocks.length) * 30 + (avgNetStrength / 2);
    return Math.round(Math.max(0, Math.min(100, healthScore)));
  };

  // Monitor trade after execution
  const monitorTrade = useCallback(() => {
    if (!execution || !tradeSetupRef.current) return;

    const setup = tradeSetupRef.current;
    const timeSinceEntry = Date.now() - execution.executedAt;
    const maxHoldTime = 6 * 60 * 60 * 1000; // 6 hours

    // Update metrics (hypothetical - in real scenario would use option prices)
    if (currentLtp) {
      const currentMove = setup.signal === 'LONG' ? currentLtp - setup.entryLtp : setup.entryLtp - currentLtp;
      const pnlPercent = ((currentMove) / setup.itmAmount) * 100;

      setTradeMetrics(prev => ({
        ...prev,
        maxGain: Math.max(prev.maxGain, Math.max(0, currentMove)),
        maxLoss: Math.min(prev.maxLoss, Math.min(0, currentMove)),
        runupLtp: setup.signal === 'LONG' ? Math.max(prev.runupLtp, currentLtp) : Math.min(prev.runupLtp, currentLtp),
        drawdownLtp: setup.signal === 'LONG' ? Math.min(prev.drawdownLtp, currentLtp) : Math.max(prev.drawdownLtp, currentLtp)
      }));

      // Check exit conditions
      let shouldExit = false;
      let exitReason: 'TARGET' | 'STOPLOSS' | 'EOD' | 'MANUAL' = 'MANUAL';

      // Target hit
      if (setup.signal === 'LONG' && currentLtp >= setup.targetPrice) {
        shouldExit = true;
        exitReason = 'TARGET';
        addLog(`✅ TARGET HIT at ${currentLtp.toFixed(2)} | Exit: ${setup.targetPrice.toFixed(2)}`);
      } else if (setup.signal === 'SHORT' && currentLtp <= setup.targetPrice) {
        shouldExit = true;
        exitReason = 'TARGET';
        addLog(`✅ TARGET HIT at ${currentLtp.toFixed(2)} | Exit: ${setup.targetPrice.toFixed(2)}`);
      }

      // Stop loss hit
      if (setup.signal === 'LONG' && currentLtp <= setup.stopLossPrice) {
        shouldExit = true;
        exitReason = 'STOPLOSS';
        addLog(`🛑 STOP LOSS HIT at ${currentLtp.toFixed(2)} | SL: ${setup.stopLossPrice.toFixed(2)}`);
      } else if (setup.signal === 'SHORT' && currentLtp >= setup.stopLossPrice) {
        shouldExit = true;
        exitReason = 'STOPLOSS';
        addLog(`🛑 STOP LOSS HIT at ${currentLtp.toFixed(2)} | SL: ${setup.stopLossPrice.toFixed(2)}`);
      }

      // EOD exit (3:15 PM IST = 15:15)
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hour = istTime.getHours();
      const minute = istTime.getMinutes();
      const timeVal = hour * 100 + minute;

      if (timeVal >= 1515) {
        shouldExit = true;
        exitReason = 'EOD';
        addLog(`⏱️  EOD - Market Closing. Exit at ${currentLtp.toFixed(2)}`);
      }

      if (shouldExit) {
        const pnl = setup.signal === 'LONG' 
          ? (currentLtp - setup.entryLtp) * 100 // Approximate
          : (setup.entryLtp - currentLtp) * 100;

        setExecution(prev => prev ? {
          ...prev,
          exitedAt: Date.now(),
          exitPrice: currentLtp,
          pnl: Math.round(pnl),
          pnlPercent: Math.round(pnlPercent * 100) / 100,
          exitReason
        } : null);

        setAutoTradeState(prev => ({
          ...prev,
          status: 'closed',
          tradeActive: false,
          dailyTradeExecuted: true
        }));
      }
    }
  }, [execution, currentLtp, addLog]);

  // Main monitoring loop
  useEffect(() => {
    if (!isMonitoring || niftyLtp === null) return;

    setCurrentLtp(niftyLtp);

    if (autoTradeState.tradeActive) {
      monitorTrade();
    } else if (!autoTradeState.dailyTradeExecuted && historyLog.length > 10) {
      generateTradeSetup();
    }
  }, [niftyLtp, historyLog, isMonitoring, autoTradeState, generateTradeSetup, monitorTrade]);

  // Execute trade
  const executeTradeSetup = () => {
    if (!tradeSetup) return;

    // Simulate entry price (in real scenario, would place actual order)
    const estimatedEntryPrice = tradeSetup.itmAmount * 0.3; // Rough estimate

    const exec: TradeExecution = {
      setup: tradeSetup,
      executedAt: Date.now(),
      executedPrice: estimatedEntryPrice
    };

    setExecution(exec);
    setAutoTradeState(prev => ({
      ...prev,
      status: 'in_trade',
      tradeActive: true,
      executionTime: Date.now()
    }));

    addLog(`🚀 TRADE EXECUTED: ${tradeSetup.signal} ${tradeSetup.optionType} @ ${tradeSetup.strikePrice} | Entry: ${estimatedEntryPrice.toFixed(2)}`);
  };

  const manualExit = () => {
    if (!execution) return;

    setExecution(prev => prev ? {
      ...prev,
      exitedAt: Date.now(),
      exitPrice: currentLtp,
      exitReason: 'EOD'
    } : null);

    setAutoTradeState(prev => ({
      ...prev,
      status: 'closed',
      tradeActive: false,
      dailyTradeExecuted: true
    }));

    addLog('⏹️  Manual exit executed');
  };

  const resetDaily = () => {
    setAutoTradeState({
      status: 'idle',
      tradeActive: false,
      dailyTradeExecuted: false,
      executionTime: null
    });
    setTradeSetup(null);
    setExecution(null);
    setTradeMetrics({ maxGain: 0, maxLoss: 0, runupLtp: 0, drawdownLtp: 0 });
    setAnalysisLog([]);
    analysisCountRef.current = 0;
    addLog('🔄 Daily session reset');
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${autoTradeState.tradeActive ? 'bg-green-500/20' : 'bg-slate-800'}`}>
            <Brain className={autoTradeState.tradeActive ? 'text-green-400' : 'text-slate-400'} size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AutoTrade.AI</h2>
            <p className="text-xs text-slate-400">One Trade Per Day | Precision Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Market Status */}
          <div className={`px-3 py-1 rounded-lg font-bold text-xs ${
            marketStatus === 'OPEN' 
              ? 'bg-green-600/20 border border-green-500/50 text-green-400' 
              : 'bg-red-600/20 border border-red-500/50 text-red-400'
          }`}>
            {marketStatus === 'OPEN' ? '🟢 OPEN' : '🔴 CLOSED'}
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Status</p>
            <p className={`text-sm font-bold ${
              autoTradeState.status === 'in_trade' ? 'text-green-400' :
              autoTradeState.status === 'entry_triggered' ? 'text-amber-400' :
              autoTradeState.status === 'closed' ? 'text-blue-400' :
              'text-slate-300'
            }`}>
              {autoTradeState.status.toUpperCase().replace(/_/g, ' ')}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              disabled={marketStatus === 'CLOSED'}
              className={`p-2 rounded-lg transition-all ${
                isMonitoring
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : marketStatus === 'CLOSED'
                  ? 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title={isMonitoring ? 'Pause Monitoring' : 'Resume Monitoring'}
            >
              {isMonitoring ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </button>

            {autoTradeState.dailyTradeExecuted && (
              <button
                onClick={resetDaily}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title="Reset Daily"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4">
        {/* Left: Trade Setup & Execution */}
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Current Setup */}
          {tradeSetup && (
            <div className="p-4 bg-slate-900/50 rounded-xl border border-blue-400/30 overflow-hidden flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crosshair className="text-blue-400" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white">Setup Ready</h3>
                    <p className="text-xs text-slate-400">Next Expiry: {nextExpiryDate}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  tradeSetup.signal === 'LONG' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {tradeSetup.signal} {tradeSetup.optionType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div>
                  <p className="text-slate-400 mb-1">Strike Price</p>
                  <p className="text-lg font-bold text-blue-400">{tradeSetup.strikePrice}</p>
                  <p className="text-[10px] text-slate-500">ITM: {tradeSetup.itmAmount.toFixed(0)}pts</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Confidence</p>
                  <p className="text-lg font-bold text-amber-400">{tradeSetup.confidence}%</p>
                  <p className="text-[10px] text-slate-500">{tradeSetup.marketCondition}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Target</p>
                  <p className="text-lg font-bold text-green-400">{tradeSetup.targetPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-1">Stop Loss</p>
                  <p className="text-lg font-bold text-red-400">{tradeSetup.stopLossPrice.toFixed(2)}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-3 bg-slate-800/50 p-2 rounded">
                📊 {tradeSetup.reasoning}
              </p>

              {!autoTradeState.tradeActive ? (
                <button
                  onClick={executeTradeSetup}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  Execute Trade Now
                </button>
              ) : (
                <button
                  onClick={manualExit}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <AlertCircle size={16} />
                  Manual Exit
                </button>
              )}
            </div>
          )}

          {/* Trade Execution Stats */}
          {execution && autoTradeState.tradeActive && (
            <div className="p-4 bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl border border-green-400/30 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                  <Activity className="animate-pulse" size={16} />
                  Trade Active
                </h3>
                <span className="text-xs text-slate-400">
                  {Math.round((Date.now() - execution.executedAt) / 60000)} min running
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400">Entry Price</p>
                  <p className="text-base font-bold text-white">{execution.executedPrice?.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400">Current LTP</p>
                  <p className="text-base font-bold text-blue-400">{currentLtp.toFixed(2)}</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400">Max Gain</p>
                  <p className="text-base font-bold text-green-400">{tradeMetrics.maxGain.toFixed(2)}pts</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400">Max Loss</p>
                  <p className="text-base font-bold text-red-400">{Math.abs(tradeMetrics.maxLoss).toFixed(2)}pts</p>
                </div>
              </div>

              <div className="w-full bg-slate-800/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((tradeMetrics.maxGain + 30) / 60) * 100)}%`
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Performance Bar</p>
            </div>
          )}

          {/* Analysis Log */}
          <div className="flex-1 p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock size={14} />
                Live Analysis Feed
              </h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1 hover:bg-slate-700 rounded transition-all"
              >
                {showDetails ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {analysisLog.length === 0 ? (
                <p className="text-xs text-slate-500 text-center mt-4">Waiting for market data...</p>
              ) : (
                analysisLog.map((log, i) => (
                  <p key={i} className="text-[11px] text-slate-400 font-mono leading-tight">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Stats & Closed Trades */}
        <div className="flex flex-col gap-4 flex-1 min-w-[300px] overflow-hidden">
          {/* Market Context */}
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30">
            <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
              <BarChart3 size={14} />
              Market Context
            </h3>
            {historyLog.length > 0 && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current LTP</span>
                  <span className="font-bold text-blue-400">{currentLtp.toFixed(2)}</span>
                </div>
                {historyLog.length > 1 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">1H Change</span>
                      <span className={`font-bold ${historyLog[historyLog.length - 1].niftyLtp - historyLog[Math.max(0, historyLog.length - 60)].niftyLtp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(historyLog[historyLog.length - 1].niftyLtp - historyLog[Math.max(0, historyLog.length - 60)].niftyLtp).toFixed(2)}pts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sentiment</span>
                      <span className={`font-bold ${historyLog[historyLog.length - 1].overallSent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {historyLog[historyLog.length - 1].overallSent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PCR</span>
                      <span className="font-bold text-amber-400">
                        {historyLog[historyLog.length - 1].pcr.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Closed Trade History */}
          {execution && autoTradeState.status === 'closed' && (
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                <CheckCircle size={14} />
                Trade Closed
              </h3>
              <div className="space-y-2 text-xs flex-1 overflow-y-auto">
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400 mb-1">Setup</p>
                  <p className="font-bold text-white">{execution.setup.signal} {execution.setup.optionType} @ {execution.setup.strikePrice}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 mb-1">Entry</p>
                    <p className="font-bold text-green-400">{execution.executedPrice?.toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 mb-1">Exit</p>
                    <p className="font-bold text-blue-400">{execution.exitPrice?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <p className="text-slate-400 mb-1">Exit Reason</p>
                  <p className={`font-bold ${
                    execution.exitReason === 'TARGET' ? 'text-green-400' :
                    execution.exitReason === 'STOPLOSS' ? 'text-red-400' :
                    'text-slate-300'
                  }`}>
                    {execution.exitReason}
                  </p>
                </div>
                {execution.pnl !== undefined && (
                  <div className={`p-2 rounded font-bold text-center ${execution.pnl > 0 ? 'bg-green-500/10 text-green-400' : execution.pnl < 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800/50 text-slate-300'}`}>
                    P&L: {execution.pnl} | {execution.pnlPercent?.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Summary */}
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30">
            <h3 className="text-xs font-bold text-slate-300 mb-2">Daily Summary</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Analysis Count</span>
                <span className="font-bold text-slate-300">{analysisCountRef.current}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trade Executed</span>
                <span className={`font-bold ${autoTradeState.dailyTradeExecuted ? 'text-green-400' : 'text-slate-500'}`}>
                  {autoTradeState.dailyTradeExecuted ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiry Date</span>
                <span className="font-bold text-slate-300">{nextExpiryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Strategy Type</span>
                <span className="font-bold text-amber-400">ITM Long</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoTrade;
