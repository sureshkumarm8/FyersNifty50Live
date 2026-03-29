import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain, Play, Pause, Eye, X, RefreshCw, Flame, BarChart2, Activity,
  TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Zap, Clock, Volume2
} from 'lucide-react';
import { FyersCredentials, EnrichedFyersQuote, MarketSnapshot } from '../types';

interface LiveAnalysis {
  timestamp: number;
  ltp: number;
  action: string; // What should happen now
  confidence: number;
  reason: string;
  thoughtProcess: string; // 1-2 liner thought process
  recommendation: 'LONG' | 'SHORT' | 'HOLD' | 'EXIT' | 'SCALP';
  signal: number; // -100 to +100 (bearish to bullish)
  zone: 'BREAKOUT' | 'SUSTAIN' | 'HOLD' | 'CONSOLIDATING';
  oi_bias: 'STRONG_CALL' | 'STRONG_PUT' | 'NEUTRAL';
  momentum: number; // 1m momentum %
  trend: string; // SHORT, MEDIUM, LONG trend
}

interface TradeExecution {
  entryTime: number;
  entryPrice: number;
  signal: 'LONG' | 'SHORT';
  strikePrice: number;
  optionType: 'CE' | 'PE';
  currentLtp: number;
  gainPoints: number;
  maxGain: number;
  maxLoss: number;
  timeElapsed: number;
  status: 'MONITORING' | 'READY_EXIT' | 'STRONG_HOLD' | 'CLOSED';
  exitReason?: string;
}

const MySystemAutoTrade: React.FC<{
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots?: any;
  aiEnabled?: boolean;
}> = ({ credentials, stocks, niftyLtp, historyLog, aiEnabled = true }) => {
  const [logs, setLogs] = useState<LiveAnalysis[]>([]);
  const [currentLtp, setCurrentLtp] = useState(niftyLtp || 0);
  const [tradeExec, setTradeExec] = useState<TradeExecution | null>(null);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  
  const prevLtpRef = useRef<number>(0);
  const lastAnalysisRef = useRef<number>(0);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const addLog = useCallback((analysis: LiveAnalysis) => {
    setLogs(p => [analysis, ...p.slice(0, 299)]);
  }, []);

  // INTELLIGENT ANALYSIS ENGINE
  const performLiveAnalysis = useCallback(() => {
    if (historyLog.length < 2 || !niftyLtp) return;

    const now = Date.now();
    const latest = historyLog[historyLog.length - 1];
    const prev = historyLog[Math.max(0, historyLog.length - 2)];
    const prev5 = historyLog[Math.max(0, historyLog.length - 5)];
    
    // 1-minute momentum
    const momentum = ((latest.niftyLtp - prev.niftyLtp) / prev.niftyLtp) * 100;
    
    // 5-minute trend
    const trend5Min = ((latest.niftyLtp - prev5.niftyLtp) / prev5.niftyLtp) * 100;
    
    // Sentiment analysis
    const sentimentScore = latest.overallSent || 0; // -100 to +100
    const optionSent = latest.optionsSent || 0;
    const pcr = latest.pcr || 1;
    
    // Stock health (% bullish)
    const bullishStocks = stocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
    const stockHealth = (bullishStocks / Math.max(stocks.length, 1)) * 100;
    
    // Zone detection (using pivot or previous R/S)
    const prevSnapshot = historyLog[Math.max(0, historyLog.length - 60)];
    const estimated_r = (prevSnapshot?.niftyLtp || currentLtp) + 100;
    const estimated_s = (prevSnapshot?.niftyLtp || currentLtp) - 100;
    const dist_to_r = estimated_r - currentLtp;
    const dist_to_s = currentLtp - estimated_s;
    
    let zone: 'BREAKOUT' | 'SUSTAIN' | 'HOLD' | 'CONSOLIDATING';
    if (dist_to_r < 30 && dist_to_r > 0 && momentum > 0.5) zone = 'BREAKOUT';
    else if (dist_to_s < 30 && dist_to_s > 0 && momentum < -0.5) zone = 'SUSTAIN';
    else if (Math.abs(momentum) < 0.2) zone = 'CONSOLIDATING';
    else zone = 'HOLD';

    // OI Bias
    let oi_bias: 'STRONG_CALL' | 'STRONG_PUT' | 'NEUTRAL';
    if (latest.callsBuyQty && latest.putsBuyQty) {
      const callRatio = (latest.callsBuyQty / (latest.callsBuyQty + latest.putsBuyQty)) * 100;
      oi_bias = callRatio > 60 ? 'STRONG_CALL' : callRatio < 40 ? 'STRONG_PUT' : 'NEUTRAL';
    } else {
      oi_bias = 'NEUTRAL';
    }

    // Signal calculation (confluence of multiple factors)
    let signal = 0;
    signal += sentimentScore * 0.4; // 40% weight
    signal += optionSent * 0.3; // 30% weight
    signal += (stockHealth - 50) * 0.8; // 20% weight (0-100 mapped to -50 to +50)
    signal += (pcr < 0.9 ? 20 : pcr > 1.2 ? -20 : 0); // PCR bias
    signal = Math.max(-100, Math.min(100, signal)); // Clamp -100 to 100

    // Momentum boost
    if (momentum > 1.5 && signal > 0) signal = Math.min(100, signal + 15);
    if (momentum < -1.5 && signal < 0) signal = Math.max(-100, signal - 15);

    // Recommendation logic
    let recommendation: 'LONG' | 'SHORT' | 'HOLD' | 'EXIT' | 'SCALP';
    let confidence = Math.abs(signal);
    let action = '';
    let reason = '';
    let thoughtProcess = '';

    if (tradeExec) {
      // TRADE MONITORING
      const gain = currentLtp - tradeExec.entryPrice;
      const timeMin = (now - tradeExec.entryTime) / 60000;

      if (gain >= 30) {
        recommendation = 'EXIT';
        action = `🎯 TARGET +30 reached`;
        reason = 'Auto-exit: target achieved';
        thoughtProcess = `Profit target hit. Time to bank the win.`;
        confidence = 95;
      } else if (gain <= -30) {
        recommendation = 'EXIT';
        action = `🛑 STOP LOSS -30 hit`;
        reason = 'Auto-exit: loss limit';
        thoughtProcess = `Loss limit breached. Cut & move on to next setup.`;
        confidence = 95;
      } else if (timeMin > 75) {
        recommendation = 'EXIT';
        action = `⏰ HARD STOP 10:15 AM`;
        reason = 'Force exit: market close time';
        thoughtProcess = `Market closing soon. Reduce overnight risk.`;
        confidence = 90;
      } else if (gain >= 25) {
        if (timeMin <= 5) {
          recommendation = 'SCALP';
          action = `⚡ QUICK +25 STRONG - Hold +30`;
          reason = 'Fast gain = strong momentum';
          thoughtProcess = `Fast +25 = strong directional move. Let it run to +30.`;
          confidence = 85;
        } else {
          recommendation = 'SCALP';
          action = `🎯 Ready manual exit +25`;
          reason = 'Slow gain = take profit';
          thoughtProcess = `Slow +25 = losing momentum. Ready to exit with profit.`;
          confidence = 75;
        }
      } else {
        recommendation = 'HOLD';
        action = `📊 Monitoring | P&L: ${gain > 0 ? '+' : ''}${gain.toFixed(0)} | Time: ${timeMin.toFixed(0)}m`;
        reason = `Gain: ${gain.toFixed(0)}pts | Max: +${tradeExec.maxGain.toFixed(0)} / ${tradeExec.maxLoss.toFixed(0)}`;
        thoughtProcess = `No clear exit yet. Keep watching for target or SL hit.`;
        confidence = 50;
      }
    } else {
      // ENTRY DECISION
      if (zone === 'BREAKOUT' && signal > 40 && oi_bias === 'STRONG_CALL') {
        recommendation = 'LONG';
        action = `🚀 EXECUTE LONG CE @ ${Math.round((currentLtp / 100) * 100)}`;
        reason = `Breakout zone + ${signal.toFixed(0)} signal + CALL bias`;
        thoughtProcess = `Price at resistance + bullish signals + OI backing calls. Perfect setup for LONG.`;
        confidence = Math.min(90, 50 + Math.abs(signal));
      } else if (zone === 'SUSTAIN' && signal < -40 && oi_bias === 'STRONG_PUT') {
        recommendation = 'SHORT';
        action = `⬇️ EXECUTE SHORT PE @ ${Math.round((currentLtp / 100) * 100)}`;
        reason = `Sustain zone + ${signal.toFixed(0)} signal + PUT bias`;
        thoughtProcess = `Price at support + bearish signals + OI backing puts. Perfect setup for SHORT.`;
        confidence = Math.min(90, 50 + Math.abs(signal));
      } else if (Math.abs(signal) > 50 && zone !== 'CONSOLIDATING') {
        recommendation = signal > 0 ? 'LONG' : 'SHORT';
        action = signal > 0 ? `📈 Strong BUY signal` : `📉 Strong SELL signal`;
        reason = `Signal: ${signal.toFixed(0)} | Zone: ${zone}`;
        thoughtProcess = signal > 0 
          ? `Strong bullish confluence: sentiment + stocks + options all aligned.`
          : `Strong bearish confluence: sentiment + stocks + options all aligned.`;
        confidence = Math.min(80, 40 + Math.abs(signal));
      } else {
        recommendation = 'HOLD';
        action = `⏸️ Waiting for better setup`;
        reason = `Signal: ${signal.toFixed(0)} | Zone: ${zone} | No confluence yet`;
        thoughtProcess = `Signals mixed or weak. Better opportunities coming. Patience.`;
        confidence = 0;
      }
    }

    const analysis: LiveAnalysis = {
      timestamp: now,
      ltp: currentLtp,
      action,
      confidence: Math.round(confidence),
      reason,
      thoughtProcess,
      recommendation,
      signal: Math.round(signal),
      zone,
      oi_bias,
      momentum: Math.round(momentum * 100) / 100,
      trend: trend5Min > 1 ? '📈 UP' : trend5Min < -1 ? '📉 DOWN' : '➡️ SIDEWAYS'
    };

    addLog(analysis);

    // AUTO EXECUTE if enabled
    if (autoTradeEnabled && !tradeExec && confidence >= 70) {
      if ((recommendation === 'LONG' || recommendation === 'SHORT')) {
        executeAutoTrade(recommendation);
      }
    }

    // AUTO EXIT if trade is active
    if (tradeExec && recommendation === 'EXIT') {
      closeTrade(reason);
    }
  }, [historyLog, niftyLtp, stocks, currentLtp, tradeExec, autoTradeEnabled, addLog]);

  // Execute auto trade
  const executeAutoTrade = useCallback((signal: 'LONG' | 'SHORT') => {
    const strikeBase = Math.round(currentLtp / 100) * 100;
    const strike = signal === 'LONG' ? strikeBase - 200 : strikeBase + 200;

    const trade: TradeExecution = {
      entryTime: Date.now(),
      entryPrice: currentLtp,
      signal,
      strikePrice: strike,
      optionType: signal === 'LONG' ? 'CE' : 'PE',
      currentLtp: currentLtp,
      gainPoints: 0,
      maxGain: 0,
      maxLoss: 0,
      timeElapsed: 0,
      status: 'MONITORING'
    };

    setTradeExec(trade);
    addLog({
      timestamp: Date.now(),
      ltp: currentLtp,
      action: `💰 AUTO TRADE EXECUTED: ${signal} @ ${strike} ${signal === 'LONG' ? 'CE' : 'PE'}`,
      confidence: 95,
      reason: 'Auto-execution triggered by AI',
      thoughtProcess: signal === 'LONG' 
        ? `Bullish setup confirmed. Taking LONG trade with 200pt ITM CE.`
        : `Bearish setup confirmed. Taking SHORT trade with 200pt ITM PE.`,
      recommendation: 'HOLD',
      signal: signal === 'LONG' ? 75 : -75,
      zone: 'BREAKOUT',
      oi_bias: 'NEUTRAL',
      momentum: 0,
      trend: ''
    });
  }, [currentLtp, addLog]);

  // Close trade
  const closeTrade = useCallback((reason: string) => {
    if (tradeExec) {
      addLog({
        timestamp: Date.now(),
        ltp: currentLtp,
        action: `🏁 TRADE CLOSED: ${reason}`,
        confidence: 90,
        reason: `Final P&L: ${tradeExec.gainPoints > 0 ? '+' : ''}${tradeExec.gainPoints.toFixed(0)}pts`,
        thoughtProcess: tradeExec.gainPoints > 0 
          ? `Trade closed with ${tradeExec.gainPoints > 0 ? 'profit' : 'loss'}. Moving to next setup.`
          : `Trade closed with ${tradeExec.gainPoints > 0 ? 'profit' : 'loss'}. Moving to next setup.`,
        recommendation: 'HOLD',
        signal: 0,
        zone: 'HOLD',
        oi_bias: 'NEUTRAL',
        momentum: 0,
        trend: ''
      });
      setTradeExec(null);
    }
  }, [tradeExec, currentLtp, addLog]);

  // Monitor trade in real-time
  useEffect(() => {
    if (!tradeExec) return;

    const interval = setInterval(() => {
      setTradeExec(p => {
        if (!p || !niftyLtp) return p;
        const gain = niftyLtp - p.entryPrice;
        const time = (Date.now() - p.entryTime) / 1000;
        const timeMin = time / 60;

        let status: typeof p['status'] = 'MONITORING';
        if (gain >= 25 && timeMin <= 5) status = 'STRONG_HOLD';
        else if (gain >= 25) status = 'READY_EXIT';

        return {
          ...p,
          currentLtp: niftyLtp,
          gainPoints: gain,
          maxGain: Math.max(p.maxGain, gain),
          maxLoss: Math.min(p.maxLoss, gain),
          timeElapsed: time,
          status
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tradeExec, niftyLtp]);

  // Auto-run analysis every minute
  useEffect(() => {
    if (historyLog.length < 2) return;

    performLiveAnalysis();
    analysisIntervalRef.current = setInterval(performLiveAnalysis, 60000); // Every minute

    // Check market status every 30 seconds
    marketCheckIntervalRef.current = setInterval(() => {
      if (isMarketClosed()) {
        setMarketStatus('CLOSED');
        if (autoTradeEnabled) {
          setAutoTradeEnabled(false);
          setLogs(p => [{
            timestamp: Date.now(),
            ltp: currentLtp,
            action: '🛑 Market Close - Auto Trade Stopped',
            confidence: 0,
            reason: 'NSE market closed (3:30 PM IST)',
            thoughtProcess: 'Market closed. Disabling auto trade. All positions reviewed.',
            recommendation: 'HOLD',
            signal: 0,
            zone: 'CONSOLIDATING',
            oi_bias: 'NEUTRAL',
            momentum: 0,
            trend: 'N/A'
          }, ...p.slice(0, 299)]);
        }
      } else {
        setMarketStatus('OPEN');
      }
    }, 30000);

    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      if (marketCheckIntervalRef.current) clearInterval(marketCheckIntervalRef.current);
    };
  }, [historyLog, performLiveAnalysis, autoTradeEnabled, currentLtp, isMarketClosed]);

  useEffect(() => {
    if (niftyLtp) setCurrentLtp(niftyLtp);
  }, [niftyLtp]);

  const latestAnalysis = logs[0];

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 rounded-xl space-y-4 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-cyan-900 via-blue-900 to-purple-900 rounded-lg p-4 border border-cyan-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${autoTradeEnabled ? 'bg-green-600 animate-pulse shadow-lg shadow-green-500/50' : 'bg-slate-700'}`}>
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-cyan-400">MySystem Live Trading</h1>
              <p className="text-xs text-gray-300">AI-Powered Real-Time Trading Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Market Status */}
            <div className={`px-3 py-2 rounded-lg font-bold text-sm ${
              marketStatus === 'OPEN' 
                ? 'bg-green-600/20 border border-green-500/50 text-green-400' 
                : 'bg-red-600/20 border border-red-500/50 text-red-400'
            }`}>
              {marketStatus === 'OPEN' ? '🟢 Market Open' : '🔴 Market Closed'}
            </div>
            <button
              onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
              disabled={marketStatus === 'CLOSED'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                autoTradeEnabled
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/30'
                  : marketStatus === 'CLOSED'
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {autoTradeEnabled ? <Zap className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoTradeEnabled ? 'AUTO TRADING ON' : 'Start Auto Trading'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* LIVE METRICS */}
        <div className="lg:col-span-1 space-y-3">
          {/* Current Price */}
          <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50">
            <p className="text-xs text-gray-400 mb-1">Nifty LTP</p>
            <p className="text-3xl font-black text-cyan-400">{currentLtp.toFixed(0)}</p>
            {latestAnalysis && (
              <p className={`text-sm font-bold mt-2 ${latestAnalysis.momentum > 0 ? 'text-green-400' : latestAnalysis.momentum < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {latestAnalysis.momentum > 0 ? '📈' : latestAnalysis.momentum < 0 ? '📉' : '➡️'} {latestAnalysis.momentum > 0 ? '+' : ''}{latestAnalysis.momentum.toFixed(2)}% (1m)
              </p>
            )}
          </div>

          {/* Signal */}
          {latestAnalysis && (
            <div className={`rounded-lg p-4 border transition-all ${
              latestAnalysis.signal > 40 ? 'bg-green-900/30 border-green-500/50 shadow-lg shadow-green-500/20' :
              latestAnalysis.signal < -40 ? 'bg-red-900/30 border-red-500/50 shadow-lg shadow-red-500/20' :
              'bg-slate-800/70 border-slate-700/50'
            }`}>
              <p className="text-xs text-gray-400 mb-1">Signal Strength</p>
              <p className={`text-3xl font-black ${latestAnalysis.signal > 0 ? 'text-green-400' : latestAnalysis.signal < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {latestAnalysis.signal > 0 ? '+' : ''}{latestAnalysis.signal}
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${latestAnalysis.signal > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(latestAnalysis.signal), 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Zone & OI */}
          {latestAnalysis && (
            <div className="bg-slate-800/70 rounded-lg p-4 border border-slate-700/50">
              <div className="mb-3">
                <p className="text-xs text-gray-400">Zone</p>
                <p className={`text-lg font-bold ${
                  latestAnalysis.zone === 'BREAKOUT' ? 'text-yellow-400' :
                  latestAnalysis.zone === 'SUSTAIN' ? 'text-blue-400' :
                  latestAnalysis.zone === 'CONSOLIDATING' ? 'text-gray-400' :
                  'text-gray-500'
                }`}>
                  {latestAnalysis.zone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">OI Bias</p>
                <p className={`text-sm font-bold ${
                  latestAnalysis.oi_bias === 'STRONG_CALL' ? 'text-green-400' :
                  latestAnalysis.oi_bias === 'STRONG_PUT' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {latestAnalysis.oi_bias}
                </p>
              </div>
            </div>
          )}

          {/* Trade Active */}
          {tradeExec && (
            <div className={`rounded-lg p-4 border transition-all ${
              tradeExec.gainPoints >= 0
                ? 'bg-green-900/30 border-green-500/50'
                : 'bg-red-900/30 border-red-500/50'
            }`}>
              <p className="text-xs text-gray-400 mb-2">Active Trade</p>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-400">Entry:</span> <span className="font-bold">{tradeExec.entryPrice.toFixed(0)}</span></p>
                <p><span className="text-gray-400">Current:</span> <span className="font-bold">{tradeExec.currentLtp.toFixed(0)}</span></p>
                <p className={`font-bold ${tradeExec.gainPoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P&L: {tradeExec.gainPoints > 0 ? '+' : ''}{tradeExec.gainPoints.toFixed(0)}pts
                </p>
                <p><span className="text-gray-400">Time:</span> <span className="font-bold">{Math.round(tradeExec.timeElapsed / 60)}m</span></p>
              </div>
            </div>
          )}
        </div>

        {/* ANALYSIS FEED */}
        <div className="lg:col-span-3 space-y-4">
          {/* Latest Action Card */}
          {latestAnalysis && (
            <div className={`rounded-lg p-5 border-2 transition-all ${
              latestAnalysis.recommendation === 'LONG' ? 'bg-green-900/40 border-green-400/60' :
              latestAnalysis.recommendation === 'SHORT' ? 'bg-red-900/40 border-red-400/60' :
              latestAnalysis.recommendation === 'EXIT' ? 'bg-yellow-900/40 border-yellow-400/60' :
              latestAnalysis.recommendation === 'SCALP' ? 'bg-blue-900/40 border-blue-400/60' :
              'bg-slate-800/40 border-slate-600/60'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-black">{latestAnalysis.action}</p>
                  <p className="text-xs text-gray-300 mt-1">{latestAnalysis.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Confidence</p>
                  <p className="text-2xl font-black text-cyan-400">{latestAnalysis.confidence}%</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Trend</p>
                  <p className="font-bold">{latestAnalysis.trend}</p>
                </div>
                <div>
                  <p className="text-gray-400">Zone</p>
                  <p className="font-bold">{latestAnalysis.zone}</p>
                </div>
                <div>
                  <p className="text-gray-400">Signal</p>
                  <p className={`font-bold ${latestAnalysis.signal > 0 ? 'text-green-400' : 'text-red-400'}`}>{latestAnalysis.signal}</p>
                </div>
                <div>
                  <p className="text-gray-400">Momentum</p>
                  <p className={`font-bold ${latestAnalysis.momentum > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {latestAnalysis.momentum > 0 ? '+' : ''}{latestAnalysis.momentum.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Feed */}
          <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 max-h-80 overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" />
              Live Analysis Feed ({logs.length})
            </h3>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="text-xs border-l-2 border-cyan-500/30 pl-2 py-1 hover:border-cyan-500/60 transition-colors">
                  <p className="text-cyan-400 font-mono">{new Date(log.timestamp).toLocaleTimeString('en-IN', { hour12: false })}</p>
                  <p className="text-gray-200 font-semibold mt-0.5">{log.action}</p>
                  <p className="text-cyan-300/70 text-xs mt-1 leading-snug italic">{log.thoughtProcess}</p>
                  <p className="text-gray-500 text-xs mt-1">{log.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Trade Controls */}
          {!tradeExec && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => executeAutoTrade('LONG')}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
              >
                🟢 Manual LONG CE
              </button>
              <button
                onClick={() => executeAutoTrade('SHORT')}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
              >
                🔴 Manual SHORT PE
              </button>
            </div>
          )}

          {/* Trade Close Button */}
          {tradeExec && (
            <button
              onClick={() => closeTrade('Manual Exit')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
            >
              🏁 Close Trade Manually
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MySystemAutoTrade;
