
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { EnrichedFyersQuote, MarketSnapshot } from '../types';
import { 
  Crosshair, Zap, TrendingUp, TrendingDown, 
  AlertTriangle, Target, RefreshCw, Shield, 
  BrainCircuit, BarChart2, Layers, Activity,
  History, Eye, Clock, Trash2
} from 'lucide-react';

interface AIQuantDeckProps {
  stocks: EnrichedFyersQuote[];
  historyLog: MarketSnapshot[];
  niftyLtp: number | null;
  optionQuotes: EnrichedFyersQuote[];
  apiKey?: string;
}

// Structured Response Interface
interface StrategySignal {
  market_condition: "TRENDING_UP" | "TRENDING_DOWN" | "SIDEWAYS" | "VOLATILE";
  signal: "LONG" | "SHORT" | "NO_TRADE";
  confidence_score: number; // 0 to 100
  primary_reason: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  suggested_trade: {
    instrument: "NIFTY OPTIONS";
    strategy_type: "BUY_CALL" | "BUY_PUT" | "BULL_SPREAD" | "BEAR_SPREAD" | "IRON_CONDOR";
    ideal_strike: string;
    stop_loss_ref: number;
    target_ref: number;
  };
  hidden_anomaly: {
    detected: boolean;
    stock_symbol: string;
    description: string;
  };
}

interface AnalysisRecord {
    id: string;
    timestamp: number;
    timeStr: string;
    signal: StrategySignal;
}

export const AIQuantDeck: React.FC<AIQuantDeckProps> = ({ stocks, historyLog, niftyLtp, optionQuotes, apiKey }) => {
  const [analysis, setAnalysis] = useState<StrategySignal | null>(null);
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage on mount (per day key)
  useEffect(() => {
    const today = new Date().toDateString();
    const key = `quant_history_${today}`;
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    } catch (e) {
        console.error("Failed to load quant history", e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
      const today = new Date().toDateString();
      const key = `quant_history_${today}`;
      try {
        localStorage.setItem(key, JSON.stringify(history));
      } catch (e) {
          console.error("Failed to save quant history", e);
      }
  }, [history]);

  const runAnalysis = async () => {
    if (isAnalyzing || !apiKey) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // 1. Prepare Data Payload (Compact context)
      const last15Mins = historyLog.slice(-15);
      const latest = last15Mins[last15Mins.length - 1];
      
      // Top 3 Flow Drivers
      const topFlow = stocks
          .sort((a,b) => (b.day_net_strength || 0) - (a.day_net_strength || 0))
          .slice(0, 3)
          .map(s => `${s.short_name}(NetStr:${s.day_net_strength?.toFixed(1)}%)`);

      const dataContext = JSON.stringify({
         nifty_ltp: niftyLtp,
         snapshot: {
            time: latest?.time,
            overall_sentiment_weighted: latest?.overallSent,
            option_sentiment: latest?.optionsSent,
            pcr: latest?.pcr,
            net_call_flow: latest?.callsBuyQty - latest?.callsSellQty,
            net_put_flow: latest?.putsBuyQty - latest?.putsSellQty
         },
         trend_history_last_15m: last15Mins.map(s => ({ t: s.time, ltp: s.niftyLtp, sent: s.overallSent })),
         top_flow_stocks: topFlow
      });

      // 2. Strict System Instruction
      const systemInstruction = `
        You are an elite Algorithmic Trader. Analyze the JSON market data provided.
        
        RULES:
        1. "overall_sentiment_weighted" is the most important metric. > 20 is Bullish, < -20 is Bearish.
        2. "option_sentiment" confirms the trend. If Divergence exists (Price Up, Option Sent Down), signal caution.
        3. PCR > 1.2 is Oversold/Support (Bullish), < 0.6 is Overbought/Resistance (Bearish) usually, but check trend.
        
        OUTPUT FORMAT:
        Return ONLY valid JSON matching this schema:
        {
          "market_condition": "TRENDING_UP" | "TRENDING_DOWN" | "SIDEWAYS" | "VOLATILE",
          "signal": "LONG" | "SHORT" | "NO_TRADE",
          "confidence_score": number (0-100),
          "primary_reason": "Short string explaining the main driver",
          "risk_level": "LOW" | "MEDIUM" | "HIGH",
          "suggested_trade": {
            "instrument": "NIFTY OPTIONS",
            "strategy_type": "BUY_CALL" | "BUY_PUT" | "WAIT",
            "ideal_strike": "e.g., 24500 CE",
            "stop_loss_ref": number (Nifty Spot Level),
            "target_ref": number (Nifty Spot Level)
          },
          "hidden_anomaly": {
            "detected": boolean,
            "stock_symbol": "Stock Name or None",
            "description": "Short description of flow divergence if any"
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze this market data: ${dataContext}`,
        config: { 
            responseMimeType: "application/json",
            systemInstruction 
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      const newRecord: AnalysisRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          timeStr: new Date().toLocaleTimeString(),
          signal: result
      };

      setAnalysis(result);
      setHistory(prev => [newRecord, ...prev]);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => {
      if(confirm("Clear today's analysis history?")) {
          setHistory([]);
          setAnalysis(null);
      }
  };

  if (!apiKey) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Shield size={48} className="mb-4 text-slate-700" />
              <p>Please configure your Google AI API Key in Settings to use the Quant Deck.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 max-w-7xl mx-auto w-full gap-4">
       
       {/* Header / Control */}
       <div className="flex justify-between items-center shrink-0">
           <div>
               <h1 className="text-2xl font-black text-white flex items-center gap-2">
                   <BrainCircuit className="text-indigo-400" /> 
                   QUANT <span className="text-indigo-500">DECK</span>
               </h1>
               <p className="text-xs text-slate-400 font-mono">
                   AI-Powered Probability Engine & Signal Generator
               </p>
           </div>
           <button 
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
           >
               <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
               {isAnalyzing ? 'Computing...' : 'Run Scan'}
           </button>
       </div>

       {error && (
           <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2 shrink-0">
               <AlertTriangle size={16} /> {error}
           </div>
       )}

       <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Main Dashboard (Active Signal) */}
        {analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 shrink-0">
                
                {/* 1. The Signal Card */}
                <div className="lg:col-span-1 glass-panel p-1 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 shadow-2xl relative overflow-hidden group">
                    <div className={`absolute inset-0 opacity-10 blur-3xl transition-colors duration-1000 ${analysis.signal === 'LONG' ? 'bg-emerald-500' : analysis.signal === 'SHORT' ? 'bg-rose-500' : 'bg-yellow-500'}`}></div>
                    
                    <div className="relative z-10 p-6 flex flex-col h-full justify-between min-h-[250px]">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <Crosshair size={14} /> Alpha Signal
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${analysis.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                                    {analysis.risk_level} RISK
                                </span>
                            </div>
                            
                            <h2 className={`text-5xl font-black tracking-tighter mb-1 ${analysis.signal === 'LONG' ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : analysis.signal === 'SHORT' ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(251,113,133,0.5)]' : 'text-yellow-400'}`}>
                                {analysis.signal}
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${analysis.signal === 'LONG' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${analysis.confidence_score}%` }}></div>
                                </div>
                                <span className="text-sm font-bold text-white">{analysis.confidence_score}% Conf.</span>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                "{analysis.primary_reason}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Strategy Execution Card */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Trade Setup */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers size={16} className="text-blue-400"/> Trade Setup
                        </h3>
                        
                        <div className="flex-1 flex flex-col justify-center space-y-4">
                            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <span className="text-slate-400 text-sm">Strategy</span>
                                <span className="text-white font-bold">{analysis.suggested_trade.strategy_type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-white/5">
                                <span className="text-slate-400 text-sm">Target Strike</span>
                                <span className="text-yellow-400 font-mono font-bold text-lg">{analysis.suggested_trade.ideal_strike}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="text-center p-3 bg-rose-900/10 border border-rose-500/20 rounded-lg">
                                    <p className="text-[10px] text-rose-400 uppercase font-bold">Stop Loss (Spot)</p>
                                    <p className="text-white font-mono font-bold">{analysis.suggested_trade.stop_loss_ref}</p>
                                </div>
                                <div className="text-center p-3 bg-emerald-900/10 border border-emerald-500/20 rounded-lg">
                                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Target (Spot)</p>
                                    <p className="text-white font-mono font-bold">{analysis.suggested_trade.target_ref}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Market Context & Anomaly */}
                    <div className="flex flex-col gap-4">
                        <div className="glass-panel p-5 rounded-2xl flex-1">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BarChart2 size={14} /> Market Regime
                            </h3>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${analysis.market_condition.includes('UP') ? 'bg-emerald-500/20 text-emerald-400' : analysis.market_condition.includes('DOWN') ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700/50 text-slate-300'}`}>
                                    {analysis.market_condition.includes('UP') ? <TrendingUp size={24} /> : analysis.market_condition.includes('DOWN') ? <TrendingDown size={24} /> : <Activity size={24} />}
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{analysis.market_condition.replace('_', ' ')}</p>
                                    <p className="text-xs text-slate-400">Current volatility structure</p>
                                </div>
                            </div>
                        </div>

                        <div className={`glass-panel p-5 rounded-2xl flex-1 border-l-4 ${analysis.hidden_anomaly.detected ? 'border-l-purple-500 bg-purple-900/10' : 'border-l-slate-700'}`}>
                            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Zap size={14} /> Anomaly Radar
                            </h3>
                            {analysis.hidden_anomaly.detected ? (
                                <>
                                    <p className="text-white font-bold text-sm mb-1">{analysis.hidden_anomaly.stock_symbol} Detected</p>
                                    <p className="text-xs text-slate-300 leading-tight opacity-80">{analysis.hidden_anomaly.description}</p>
                                </>
                            ) : (
                                <p className="text-slate-500 text-sm">No significant flow anomalies detected in individual stocks.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-600 space-y-4 glass-panel rounded-2xl border-dashed border-slate-800 shrink-0">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                    <BrainCircuit size={64} className="relative text-slate-700" />
                </div>
                <p className="font-mono text-sm">Ready to analyze market data...</p>
                <button onClick={runAnalysis} className="px-6 py-2 bg-indigo-900/30 text-indigo-400 border border-indigo-500/30 rounded-full hover:bg-indigo-900/50 transition-all">
                    Start Engine
                </button>
            </div>
        )}

        {/* 3. History Table Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 glass-panel rounded-2xl border border-slate-800">
            <div className="px-5 py-3 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-slate-400">
                     <History size={16} />
                     <h3 className="text-xs font-bold uppercase tracking-widest">Session Analysis History</h3>
                 </div>
                 {history.length > 0 && (
                     <button onClick={clearHistory} className="text-slate-600 hover:text-red-400 transition-colors">
                         <Trash2 size={14} />
                     </button>
                 )}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 py-8">
                        <Clock size={24} className="mb-2 opacity-50" />
                        <p className="text-xs">No analysis run today.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/30 text-slate-500 uppercase text-[10px] font-bold sticky top-0 backdrop-blur-md">
                            <tr>
                                <th className="px-5 py-3">Time</th>
                                <th className="px-5 py-3">Signal</th>
                                <th className="px-5 py-3">Confidence</th>
                                <th className="px-5 py-3">Strategy</th>
                                <th className="px-5 py-3 hidden md:table-cell">Reason</th>
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((rec) => (
                                <tr key={rec.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-5 py-3 font-mono text-slate-400">{rec.timeStr}</td>
                                    <td className="px-5 py-3 font-bold">
                                        <span className={`px-2 py-1 rounded text-[10px] border ${rec.signal.signal === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : rec.signal.signal === 'SHORT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-700/30 text-slate-400 border-white/10'}`}>
                                            {rec.signal.signal}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${rec.signal.confidence_score > 70 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${rec.signal.confidence_score}%` }}></div>
                                            </div>
                                            <span className="text-xs font-mono">{rec.signal.confidence_score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-white font-medium">{rec.signal.suggested_trade.strategy_type.replace(/_/g, ' ')}</td>
                                    <td className="px-5 py-3 text-slate-400 text-xs hidden md:table-cell max-w-xs truncate" title={rec.signal.primary_reason}>
                                        {rec.signal.primary_reason}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button 
                                            onClick={() => setAnalysis(rec.signal)}
                                            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
