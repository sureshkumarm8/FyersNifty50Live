
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MarketSnapshot, EnrichedFyersQuote, TradingSystemProtocol, SniperAnalysis, PivotPoints } from '../types';
import { Crosshair, ShieldAlert, CheckCircle, XCircle, Search, Target, Zap, Activity, Play, Lock, AlertTriangle, Volume2, History, Clock, ChevronDown, StopCircle, PauseCircle, Trash2, Eye } from 'lucide-react';

interface SniperScopeProps {
  snapshot: MarketSnapshot;
  niftyLtp: number | null;
  stocks: EnrichedFyersQuote[]; // Passed for breadth/heavyweight context
  apiKey?: string;
  pivots: PivotPoints | null;
}

interface SniperHistoryRecord extends SniperAnalysis {
    id: number;
    timestamp: number;
    timeStr: string;
}

const DEFAULT_PROTOCOL: TradingSystemProtocol = {
    name: "Default Protocol",
    steps: [],
    rules: []
};

const INTERVAL_OPTIONS = [
    { label: '10 Seconds', value: 10000 },
    { label: '30 Seconds', value: 30000 },
    { label: '1 Minute', value: 60000 },
    { label: '2 Minutes', value: 120000 },
];

export const SniperScope: React.FC<SniperScopeProps> = ({ snapshot, niftyLtp, stocks, apiKey, pivots }) => {
  const [protocol, setProtocol] = useState<TradingSystemProtocol>(DEFAULT_PROTOCOL);
  const [isScanning, setIsScanning] = useState(false); // Validating/Fetching state
  const [isLooping, setIsLooping] = useState(false);   // Auto-Scan Active state
  const [scanInterval, setScanInterval] = useState(30000);
  
  const [analysis, setAnalysis] = useState<SniperAnalysis | null>(null);
  const [history, setHistory] = useState<SniperHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Refs for accessing fresh data inside interval closure
  const snapshotRef = useRef(snapshot);
  const niftyLtpRef = useRef(niftyLtp);
  const stocksRef = useRef(stocks);
  const pivotsRef = useRef(pivots);
  const protocolRef = useRef(protocol);

  useEffect(() => {
    snapshotRef.current = snapshot;
    niftyLtpRef.current = niftyLtp;
    stocksRef.current = stocks;
    pivotsRef.current = pivots;
  }, [snapshot, niftyLtp, stocks, pivots]);

  useEffect(() => {
    const saved = localStorage.getItem('user_trading_protocol');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProtocol(parsed);
        protocolRef.current = parsed;
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
        setIsLooping(false);
        return;
    }
    
    // Use Refs for data to ensure loop has latest values
    const snap = snapshotRef.current;
    const ltp = niftyLtpRef.current;
    const currentStocks = stocksRef.current;
    const currentPivots = pivotsRef.current;
    const currentProtocol = protocolRef.current;

    if (!snap || !ltp) {
        // Silent return if data not ready yet in loop, or error if manual
        if(!isLooping) setError("Market data waiting...");
        return;
    }

    setIsScanning(true);
    // Do not clear analysis immediately in loop to avoid flickering
    setError(null);

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare Context
        const heavyweights = currentStocks
            .filter(s => ['HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'TCS'].some(k => s.symbol.includes(k)))
            .map(s => `${s.short_name}: ${s.chp?.toFixed(2)}% (NetStr: ${s.day_net_strength?.toFixed(1)}%)`)
            .join(', ');

        const marketContext = {
            current_time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            nifty_ltp: ltp,
            change_pts: snap.ptsChg,
            overall_sentiment: snap.overallSent,
            option_flow_net: (snap.callsBuyQty - snap.callsSellQty) - (snap.putsBuyQty - snap.putsSellQty),
            pcr: snap.pcr,
            heavyweights_status: heavyweights,
            momentum_1m: snap.stockSent,
            pivot_structure: currentPivots ? {
                pivot: currentPivots.pivot,
                r1: currentPivots.r1,
                s1: currentPivots.s1,
                cpr: `${currentPivots.cpr_bc}-${currentPivots.cpr_tc}`,
                location: ltp > currentPivots.r1 ? "ABOVE_R1" : ltp < currentPivots.s1 ? "BELOW_S1" : "INSIDE_RANGE"
            } : 'Not Available'
        };

        const systemInstruction = `
            You are a Trading Execution Algo. Your job is to strictly enforce the user's "Trading System Protocol" against the current market data.
            
            USER PROTOCOL:
            ${JSON.stringify(currentProtocol)}

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

        // Add to History
        const record: SniperHistoryRecord = {
            ...result,
            id: Date.now(),
            timestamp: Date.now(),
            timeStr: new Date().toLocaleTimeString('en-IN')
        };
        setHistory(prev => [record, ...prev]);

        // TTS (Only announce distinct changes or executions to avoid spam)
        if (result.decision === 'EXECUTE') {
            announce(`Sniper Triggered. Buy ${result.trade_setup.direction}. Stop Loss ${result.trade_setup.stop_loss}`);
            // If execute, maybe stop looping? User can decide. For now, keep looping but user might want to stop manually.
        } 
        
    } catch (e: any) {
        console.error("Scan Error", e);
        setError(e.message || "Scan failed");
    } finally {
        setIsScanning(false);
    }
  };

  // Interval Logic
  useEffect(() => {
      let timer: any;
      if (isLooping) {
          runSniperScan(); // Run immediately on start
          timer = setInterval(runSniperScan, scanInterval);
      }
      return () => clearInterval(timer);
  }, [isLooping, scanInterval]);

  const toggleLoop = () => {
      if (isLooping) {
          setIsLooping(false);
          setIsScanning(false);
      } else {
          setIsLooping(true);
      }
  };

  const clearHistory = () => {
      if (confirm("Clear scan history?")) setHistory([]);
  };

  const renderSafeString = (val: any) => {
       if (typeof val === 'object') return JSON.stringify(val);
       return String(val || '');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 max-w-7xl mx-auto w-full gap-6">
       
       {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end shrink-0 gap-4">
           <div>
               <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                   <Crosshair className="text-red-500 animate-pulse" size={32} /> 
                   SNIPER <span className="text-red-500">SCOPE</span>
               </h1>
               <div className="flex items-center gap-3 mt-1">
                   <p className="text-xs text-slate-400 font-mono">
                       Protocol-Driven Execution Engine
                   </p>
                   <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-1 rounded ${soundEnabled ? 'text-green-400 bg-green-900/20' : 'text-slate-500 bg-slate-800'}`} title="Toggle Voice Announcements">
                       <Volume2 size={12} />
                   </button>
               </div>
           </div>
           
           <div className="flex items-center gap-4">
                <div className="glass-panel p-1 rounded-lg flex items-center bg-slate-900/50">
                    <Clock size={14} className="ml-2 text-slate-400" />
                    <select 
                        value={scanInterval} 
                        onChange={(e) => setScanInterval(Number(e.target.value))}
                        className="bg-transparent text-xs text-white font-bold p-2 focus:outline-none cursor-pointer"
                        disabled={isLooping}
                    >
                        {INTERVAL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Protocol</div>
                    <div className="text-blue-300 font-bold text-sm bg-blue-900/20 px-3 py-1 rounded border border-blue-500/20 truncate max-w-[150px]">
                        {renderSafeString(protocol.name)}
                    </div>
                </div>
           </div>
       </div>

       {/* Main Display (Grid) */}
       <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar pr-2">
            
            {/* Left: Scanner Control */}
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

                {/* Radar Visual & Toggle Button */}
                <div className="flex-1 glass-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group border border-slate-700 min-h-[300px]">
                    {/* Radar Animation Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <div className={`w-[300px] h-[300px] border border-red-500/30 rounded-full ${isLooping || isScanning ? 'animate-ping duration-[3s]' : ''}`}></div>
                        <div className={`absolute w-[200px] h-[200px] border border-red-500/30 rounded-full ${isLooping || isScanning ? 'animate-ping animation-delay-500 duration-[2s]' : ''}`}></div>
                        <div className={`absolute w-[100px] h-[100px] border border-red-500/30 rounded-full ${isLooping || isScanning ? 'animate-ping animation-delay-1000 duration-[1s]' : ''}`}></div>
                        {/* Crosshairs */}
                        <div className="absolute w-full h-[1px] bg-red-500/20"></div>
                        <div className="absolute h-full w-[1px] bg-red-500/20"></div>
                    </div>

                    <button 
                        onClick={toggleLoop}
                        className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                            isLooping 
                            ? 'bg-slate-900 border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                            : 'bg-gradient-to-br from-red-600 to-rose-800 hover:scale-105 hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-500'
                        }`}
                    >
                        {isScanning ? (
                            <Activity size={48} className="text-red-500 animate-pulse" />
                        ) : isLooping ? (
                            <div className="animate-pulse">
                                <PauseCircle size={48} className="text-red-500 mb-2 mx-auto" />
                                <span className="text-xs text-red-400 font-mono block">AUTO-SCAN ON</span>
                            </div>
                        ) : (
                            <Target size={48} className="text-white mb-2" />
                        )}
                        
                        {!isScanning && (
                            <span className={`text-lg font-black tracking-widest ${isLooping ? 'text-red-500' : 'text-white'}`}>
                                {isLooping ? 'STOP' : 'ENGAGE'}
                            </span>
                        )}
                    </button>

                    <div className="absolute bottom-4 flex flex-col items-center gap-1">
                        {isLooping && (
                             <span className="text-[10px] text-slate-400 font-mono animate-pulse">
                                 Scanning every {scanInterval/1000}s
                             </span>
                        )}
                        {error && (
                            <div className="text-red-400 text-xs bg-red-900/50 px-3 py-1 rounded border border-red-500/30">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Compliance Checklist Preview */}
                <div className="glass-panel p-4 rounded-xl">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShieldAlert size={14} /> Protocol Compliance
                    </h3>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
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
                            <p className="text-slate-500 text-xs italic text-center py-2">Start scan to check rules.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Right: The Result & History */}
            <div className="flex flex-col gap-4">
                
                {/* Structure Context */}
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

                {/* Active Analysis Card */}
                {analysis ? (
                    <div className="flex-none animate-in slide-in-from-right duration-500">
                        {/* Decision Card */}
                        <div className={`p-6 rounded-2xl border-l-8 shadow-2xl mb-4 ${analysis.decision === 'EXECUTE' ? 'bg-emerald-900/20 border-l-emerald-500' : analysis.decision === 'WAIT' ? 'bg-yellow-900/20 border-l-yellow-500' : 'bg-red-900/20 border-l-red-500'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold opacity-70 mb-1">Latest Verdict</div>
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

                        {/* Trade Setup Details */}
                        {analysis.trade_setup ? (
                            <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
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
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 opacity-60">
                                <Lock size={32} className="mb-2" />
                                <p className="text-xs">No active trade setup.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-none glass-panel rounded-2xl flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 h-[300px]">
                        <Search size={64} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-slate-500">Awaiting Scan</h3>
                        <p className="text-xs text-slate-600 max-w-xs text-center mt-2">
                            Engage the Sniper Scope to compare live data against your "{protocol.name}".
                        </p>
                    </div>
                )}

                {/* History Log (Bottom of Right Column) */}
                <div className="flex-1 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden min-h-[250px]">
                    <div className="px-4 py-3 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <History size={14} className="text-slate-400" />
                             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scan History</h3>
                        </div>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-slate-600 hover:text-red-400 transition-colors" title="Clear History">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {history.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-600 text-xs italic">
                                No scans recorded yet.
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-900/30 text-slate-500 sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-4 py-2">Time</th>
                                        <th className="px-4 py-2">Verdict</th>
                                        <th className="px-4 py-2">Step</th>
                                        <th className="px-4 py-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-2 font-mono text-slate-400">{rec.timeStr}</td>
                                            <td className="px-4 py-2 font-bold">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${rec.decision === 'EXECUTE' ? 'bg-emerald-500/20 text-emerald-400' : rec.decision === 'WAIT' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {rec.decision}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-slate-300 max-w-[150px] truncate" title={rec.matched_step}>{rec.matched_step}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button 
                                                    onClick={() => setAnalysis(rec)}
                                                    className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white transition-colors"
                                                    title="View Snapshot"
                                                >
                                                    <Eye size={14} />
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
    </div>
  );
};
