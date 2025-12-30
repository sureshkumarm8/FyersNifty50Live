
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MarketSnapshot, EnrichedFyersQuote, TradingSystemProtocol, SniperAnalysis, PivotPoints } from '../types';
import { Crosshair, ShieldAlert, CheckCircle, XCircle, Search, Target, Zap, Activity, Play, Lock, AlertTriangle, Volume2 } from 'lucide-react';

interface SniperScopeProps {
  snapshot: MarketSnapshot;
  niftyLtp: number | null;
  stocks: EnrichedFyersQuote[]; // Passed for breadth/heavyweight context
  apiKey?: string;
  pivots: PivotPoints | null;
}

const DEFAULT_PROTOCOL: TradingSystemProtocol = {
    name: "Default Protocol",
    steps: [],
    rules: []
};

export const SniperScope: React.FC<SniperScopeProps> = ({ snapshot, niftyLtp, stocks, apiKey, pivots }) => {
  const [protocol, setProtocol] = useState<TradingSystemProtocol>(DEFAULT_PROTOCOL);
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<SniperAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user_trading_protocol');
    if (saved) {
      try {
        setProtocol(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load protocol");
      }
    }
  }, []);

  // Audio Announce
  const announce = (text: string) => {
     if (!soundEnabled || !window.speechSynthesis) return;
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.rate = 1.0;
     window.speechSynthesis.speak(utterance);
  };

  const runSniperScan = async () => {
    if (!apiKey) {
        setError("API Key missing. Please add it in Settings.");
        return;
    }
    if (!snapshot || !niftyLtp) {
        setError("Market data waiting...");
        return;
    }

    setIsScanning(true);
    setAnalysis(null);
    setError(null);

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare Context
        const heavyweights = stocks
            .filter(s => ['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS'].some(k => s.symbol.includes(k)))
            .map(s => `${s.short_name}: ${s.chp?.toFixed(2)}% (NetStr: ${s.day_net_strength?.toFixed(1)}%)`)
            .join(', ');

        const marketContext = {
            current_time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            nifty_ltp: niftyLtp,
            change_pts: snapshot.ptsChg,
            overall_sentiment: snapshot.overallSent,
            option_flow_net: (snapshot.callsBuyQty - snapshot.callsSellQty) - (snapshot.putsBuyQty - snapshot.putsSellQty),
            pcr: snapshot.pcr,
            heavyweights_status: heavyweights,
            momentum_1m: snapshot.stockSent,
            pivot_structure: pivots ? {
                pivot: pivots.pivot,
                r1: pivots.r1,
                s1: pivots.s1,
                cpr: `${pivots.cpr_bc}-${pivots.cpr_tc}`,
                location: niftyLtp > pivots.r1 ? "ABOVE_R1" : niftyLtp < pivots.s1 ? "BELOW_S1" : "INSIDE_RANGE"
            } : 'Not Available'
        };

        const systemInstruction = `
            You are a Trading Execution Algo. Your job is to strictly enforce the user's "Trading System Protocol" against the current market data.
            
            USER PROTOCOL:
            ${JSON.stringify(protocol)}

            CURRENT MARKET DATA:
            ${JSON.stringify(marketContext)}

            TASK:
            1. Check the 'current_time' against protocol steps. Which step are we in?
            2. Check if market conditions (Sentiment, Flow, PCR, Heavyweights, Pivot Structure) match the protocol's entry criteria.
            3. Check if any "Cardinal Rules" are being violated.
            4. If conditions align, calculate trade parameters (Entry, SL, Targets) based on Nifty LTP.
               - Stop Loss should be logical (e.g., 20-30 pts away or below support like S1/Pivot).
               - Risk/Reward minimum 1:1.5.

            OUTPUT JSON SCHEMA:
            {
                "decision": "EXECUTE" | "WAIT" | "ABORT",
                "rationale": "Short, punchy reason based on rules.",
                "matched_step": "e.g., 09:45 Entry Window",
                "trade_setup": {
                    "direction": "CALL" | "PUT",
                    "entry_zone": "e.g., 24500-24510",
                    "stop_loss": number,
                    "target_1": number,
                    "target_2": number,
                    "rr_ratio": number
                } (OR null if WAIT/ABORT),
                "compliance_check": [
                    { "rule": "Rule description", "status": "PASS" | "FAIL" }
                ]
            }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Scan market for entry trigger.",
            config: {
                responseMimeType: "application/json",
                systemInstruction
            }
        });

        const result = JSON.parse(response.text || "{}");
        setAnalysis(result);

        // TTS
        if (result.decision === 'EXECUTE') {
            announce(`Sniper Triggered. Buy ${result.trade_setup.direction}. Stop Loss ${result.trade_setup.stop_loss}`);
        } else if (result.decision === 'ABORT') {
            announce("Scan complete. Protocol Aborted.");
        } else {
            announce("Conditions not met. Waiting.");
        }

    } catch (e: any) {
        setError(e.message || "Scan failed");
    } finally {
        setIsScanning(false);
    }
  };

  const renderSafeString = (val: any) => {
       if (typeof val === 'object') return JSON.stringify(val);
       return String(val || '');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 max-w-6xl mx-auto w-full gap-6">
       
       {/* Header */}
       <div className="flex justify-between items-end shrink-0">
           <div>
               <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                   <Crosshair className="text-red-500 animate-pulse" size={32} /> 
                   SNIPER <span className="text-red-500">SCOPE</span>
               </h1>
               <div className="flex items-center gap-3 mt-1">
                   <p className="text-xs text-slate-400 font-mono">
                       Protocol-Driven Execution Engine
                   </p>
                   <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-1 rounded ${soundEnabled ? 'text-green-400 bg-green-900/20' : 'text-slate-500 bg-slate-800'}`}>
                       <Volume2 size={12} />
                   </button>
               </div>
           </div>
           
           <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Protocol</div>
                <div className="text-blue-300 font-bold text-sm bg-blue-900/20 px-3 py-1 rounded border border-blue-500/20">
                    {renderSafeString(protocol.name)}
                </div>
           </div>
       </div>

       {/* Main Display */}
       <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
            
            {/* Left: The Radar / Scanner */}
            <div className="flex flex-col gap-6">
                
                {/* HUD Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="glass-panel p-3 rounded-xl text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Nifty LTP</div>
                        <div className="text-xl font-black text-white">{niftyLtp?.toLocaleString() || '--'}</div>
                    </div>
                    <div className="glass-panel p-3 rounded-xl text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Sentiment</div>
                        <div className={`text-xl font-black ${snapshot?.overallSent > 0 ? 'text-bull' : 'text-bear'}`}>
                            {snapshot?.overallSent.toFixed(1)}%
                        </div>
                    </div>
                    <div className="glass-panel p-3 rounded-xl text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Net Flow</div>
                        <div className={`text-xl font-black ${snapshot?.optionsSent > 0 ? 'text-bull' : 'text-bear'}`}>
                            {snapshot?.optionsSent.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Scan Button & Visual */}
                <div className="flex-1 glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group border border-slate-700">
                    {/* Radar Animation Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <div className={`w-[300px] h-[300px] border border-red-500/30 rounded-full ${isScanning ? 'animate-ping' : ''}`}></div>
                        <div className={`absolute w-[200px] h-[200px] border border-red-500/30 rounded-full ${isScanning ? 'animate-ping animation-delay-500' : ''}`}></div>
                        <div className={`absolute w-[100px] h-[100px] border border-red-500/30 rounded-full ${isScanning ? 'animate-ping animation-delay-1000' : ''}`}></div>
                        {/* Crosshairs */}
                        <div className="absolute w-full h-[1px] bg-red-500/20"></div>
                        <div className="absolute h-full w-[1px] bg-red-500/20"></div>
                    </div>

                    <button 
                        onClick={runSniperScan}
                        disabled={isScanning}
                        className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${isScanning ? 'bg-slate-900 scale-95 border-4 border-red-500/50' : 'bg-gradient-to-br from-red-600 to-rose-800 hover:scale-105 hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-500'}`}
                    >
                        {isScanning ? (
                            <Activity size={48} className="text-red-500 animate-pulse" />
                        ) : (
                            <Target size={48} className="text-white mb-2" />
                        )}
                        <span className="text-lg font-black text-white tracking-widest">
                            {isScanning ? 'SCANNING' : 'ENGAGE'}
                        </span>
                    </button>

                    {error && (
                        <div className="absolute bottom-4 text-red-400 text-xs bg-red-900/50 px-3 py-1 rounded border border-red-500/30">
                            {error}
                        </div>
                    )}
                </div>

                {/* Compliance Checklist Preview */}
                <div className="glass-panel p-4 rounded-xl">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldAlert size={14} /> Protocol Compliance
                    </h3>
                    <div className="space-y-2">
                        {analysis?.compliance_check ? (
                            analysis.compliance_check.map((check, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300">{check.rule}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${check.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {check.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-xs italic text-center py-2">Run scan to check rules.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Right: The Target Solution */}
            <div className="flex flex-col gap-4">
                
                {/* Pivot Structure Context */}
                {pivots && (
                    <div className="glass-panel p-3 rounded-xl flex justify-between items-center bg-slate-900/40">
                         <div className="text-xs font-bold text-slate-500 uppercase">Structure</div>
                         <div className="flex gap-4 text-xs font-mono">
                             <span className="text-slate-400">S1: <span className="text-white">{Math.round(pivots.s1)}</span></span>
                             <span className="text-blue-400">P: <span className="text-white">{Math.round(pivots.pivot)}</span></span>
                             <span className="text-slate-400">R1: <span className="text-white">{Math.round(pivots.r1)}</span></span>
                         </div>
                    </div>
                )}

                {analysis ? (
                    <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-right duration-500">
                        
                        {/* Decision Card */}
                        <div className={`p-6 rounded-2xl border-l-8 shadow-2xl ${analysis.decision === 'EXECUTE' ? 'bg-emerald-900/20 border-l-emerald-500' : analysis.decision === 'WAIT' ? 'bg-yellow-900/20 border-l-yellow-500' : 'bg-red-900/20 border-l-red-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold opacity-70 mb-1">AI Verdict</div>
                                    <h2 className={`text-4xl font-black tracking-tighter ${analysis.decision === 'EXECUTE' ? 'text-emerald-400' : analysis.decision === 'WAIT' ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {analysis.decision}
                                    </h2>
                                </div>
                                <div className="text-right">
                                     <div className="text-[10px] uppercase font-bold opacity-70 mb-1">Step</div>
                                     <div className="text-xs font-mono bg-slate-900/50 px-2 py-1 rounded">
                                         {analysis.matched_step}
                                     </div>
                                </div>
                            </div>
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                {analysis.rationale}
                            </p>
                        </div>

                        {/* Trade Setup Card (Only if Execute) */}
                        {analysis.trade_setup && (
                            <div className="flex-1 glass-panel rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Zap size={100} />
                                </div>

                                <div className="flex items-center gap-2 mb-6">
                                    <span className={`px-3 py-1 rounded text-sm font-black ${analysis.trade_setup.direction === 'CALL' ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                                        BUY {analysis.trade_setup.direction}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        RR: 1:{analysis.trade_setup.rr_ratio}
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                        <span className="text-slate-400 text-xs uppercase font-bold">Entry Zone</span>
                                        <span className="text-2xl font-mono font-bold text-white">{analysis.trade_setup.entry_zone}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Stop Loss</div>
                                            <div className="text-xl font-mono font-bold text-red-400">{analysis.trade_setup.stop_loss}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Target 1</div>
                                            <div className="text-xl font-mono font-bold text-emerald-400">{analysis.trade_setup.target_1}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Target 2 (Runner)</div>
                                        <div className="text-xl font-mono font-bold text-emerald-300">{analysis.trade_setup.target_2}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!analysis.trade_setup && (
                            <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center text-slate-500 opacity-60">
                                <Lock size={48} className="mb-2" />
                                <p className="text-sm font-mono">Trade parameters locked.</p>
                                <p className="text-xs">Conditions not met for entry.</p>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800">
                        <Search size={64} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-500">Awaiting Scan</h3>
                        <p className="text-xs text-slate-600 max-w-xs text-center mt-2">
                            Engage the Sniper Scope to compare live data against your "{protocol.name}".
                        </p>
                    </div>
                )}

            </div>
       </div>
    </div>
  );
};
