
import React, { useMemo, useState } from 'react';
import { EnrichedFyersQuote, MarketSnapshot, ViewMode, StrategySignal } from '../types';
import { TrendingUp, TrendingDown, Activity, Zap, Target, BrainCircuit, Loader2, Scale, Clock, Moon, AlertTriangle, Timer, Bot, Play, CheckCircle } from 'lucide-react';

interface CumulativeViewProps {
  data: EnrichedFyersQuote[];
  latestSnapshot?: MarketSnapshot;
  historyLog?: MarketSnapshot[];
  onNavigate: (mode: ViewMode) => void;
  onSelectStock: (symbol: string) => void;
  marketStatus?: string | null;
  // New AI Props
  quantAnalysis?: StrategySignal | null;
  isQuantAnalyzing?: boolean;
  onRunQuantAnalysis?: () => void;
}

const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (absVal >= 100000) return `${(val / 100000).toFixed(2)} L`;
    return val.toLocaleString('en-IN');
};

const formatNumber = (num: number, decimals = 1) => num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const formatPercent = (num: number) => {
    const isPos = num > 0;
    const isNeg = num < 0;
    const colorClass = isPos ? 'text-bull text-glow-green' : isNeg ? 'text-bear text-glow-red' : 'text-slate-400';
    return <span className={`font-mono font-bold ${colorClass}`}>{isPos ? '+' : ''}{num.toFixed(1)}%</span>;
};
const formatMillions = (num: number) => {
    const val = num / 1000000;
    return `${val.toFixed(2)}M`;
};


// --- Sparkline Component ---
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
    if (data.length < 2) return <div className={`h-[${height}px] w-full bg-slate-800/20 rounded`}></div>;
    
    const max = Math.max(...data, 0.1);
    const min = Math.min(...data, -0.1);
    const range = max - min;
    const width = 100;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height; 
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                vectorEffect="non-scaling-stroke"
                className="drop-shadow-md"
            />
            {min < 0 && max > 0 && (
                <line 
                    x1="0" 
                    y1={height - ((0 - min) / range) * height} 
                    x2="100" 
                    y2={height - ((0 - min) / range) * height} 
                    stroke="rgba(255,255,255,0.1)" 
                    strokeWidth="1" 
                    strokeDasharray="2" 
                />
            )}
        </svg>
    );
};

// Fallback Helper to parse HH:MM:SS to today's date object if timestamp missing
const parseTime = (timeStr: string) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
};

export const CumulativeView: React.FC<CumulativeViewProps> = ({ 
    data, 
    latestSnapshot, 
    historyLog = [], 
    onNavigate, 
    onSelectStock, 
    marketStatus,
    quantAnalysis,
    isQuantAnalyzing,
    onRunQuantAnalysis
}) => {
  const [decisionWindow, setDecisionWindow] = useState<number>(5); // Default 5 mins

  // --- Session Stats Calculation ---
  const stats = useMemo(() => {
    const initialStats = {
      bullishWeight: 0,
      bearishWeight: 0,
      totalWeight: 0,
      weightedBuyValue: 0,
      weightedSellValue: 0,
      weightedBuyMomemtum: 0,
      weightedSellMomentum: 0,
      total_buy_qty: 0,
      total_sell_qty: 0,
      weighted_lp_1m: 0,
      weighted_lp_day: 0,
    };

    if (data.length === 0) return initialStats;

    return data.reduce((acc, curr) => {
       const w = curr.weight || 0.1;
       const ltp = curr.lp || 0;
       const sessionChg = curr.lp_chg_day_p || 0;
       
       if (sessionChg > 0.001) acc.bullishWeight += w;
       else if (sessionChg < -0.001) acc.bearishWeight += w;
       acc.totalWeight += w;

       const deltaBuy = (curr.total_buy_qty || 0) - (curr.initial_total_buy_qty || 0);
       const deltaSell = (curr.total_sell_qty || 0) - (curr.initial_total_sell_qty || 0);
       const buyVal = deltaBuy * ltp;
       const sellVal = deltaSell * ltp;
       
       acc.weightedBuyValue += (buyVal * w);
       acc.weightedSellValue += (sellVal * w);

       const buyChgVal = (curr.bid_qty_chg_1m || 0) * ltp;
       const sellChgVal = (curr.ask_qty_chg_1m || 0) * ltp;
       acc.weightedBuyMomemtum += (buyChgVal * w);
       acc.weightedSellMomentum += (sellChgVal * w);

       acc.total_buy_qty += (curr.total_buy_qty || 0);
       acc.total_sell_qty += (curr.total_sell_qty || 0);
       acc.weighted_lp_1m += ((curr.lp_chg_1m_p || 0) * w);
       acc.weighted_lp_day += ((curr.lp_chg_day_p || 0) * w);

       return acc;
    }, initialStats);
  }, [data]);


  // --- Intelligent Decision Engine Logic ---
  const windowAnalysis = useMemo(() => {
      if (historyLog.length < 2) return null;
      
      const currentSnap = historyLog[historyLog.length - 1];
      const currentTs = currentSnap.timestamp || parseTime(currentSnap.time).getTime();
      
      // Target time we want to find
      const targetTime = currentTs - (decisionWindow * 60 * 1000);
      
      let pastSnap = historyLog[0];
      let foundIndex = 0;
      let effectiveDurationMins = 0;

      for (let i = historyLog.length - 2; i >= 0; i--) {
          const snapTs = historyLog[i].timestamp || parseTime(historyLog[i].time).getTime();
          const diffMins = (currentTs - snapTs) / 60000;
          
          if (diffMins >= decisionWindow) {
             pastSnap = historyLog[i];
             foundIndex = i;
             effectiveDurationMins = diffMins;
             break;
          }
          
          if (i === 0) {
             pastSnap = historyLog[0];
             foundIndex = 0;
             effectiveDurationMins = diffMins;
          }
      }

      // Calculate Deltas over the window
      const priceDelta = currentSnap.niftyLtp - pastSnap.niftyLtp;
      
      // Net Option Flow calculation: (Current Net - Past Net) gives the flow *during* the window
      const currentNetOpt = (currentSnap.callsBuyQty - currentSnap.callsSellQty) - (currentSnap.putsBuyQty - currentSnap.putsSellQty);
      const pastNetOpt = (pastSnap.callsBuyQty - pastSnap.callsSellQty) - (pastSnap.putsBuyQty - pastSnap.putsSellQty);
      const flowDelta = currentNetOpt - pastNetOpt;

      // Breadth Trend (Average Sentiment over the window vs End Sentiment)
      const windowSnaps = historyLog.slice(foundIndex);
      const avgSentiment = windowSnaps.reduce((sum, s) => sum + s.overallSent, 0) / windowSnaps.length;
      const sentimentTrend = currentSnap.overallSent - avgSentiment; // Rising or Falling breadth?

      // Scoring
      // 1. Price Score (-50 to 50): Is price moving significantly?
      const priceScore = Math.max(Math.min(priceDelta * 2, 50), -50);
      
      // 2. Flow Score (-50 to 50): Are options confirming?
      const flowScore = Math.max(Math.min((flowDelta / 100000) * 2, 50), -50); 
      
      // 3. Breadth Scalar (0.5 to 1.5): Multiplier based on breadth direction
      const breadthScalar = sentimentTrend > 0 ? 1.2 : sentimentTrend < 0 ? 0.8 : 1.0;

      const totalScore = (priceScore + flowScore) * breadthScalar;

      let prediction = "NEUTRAL";
      let color = "text-yellow-400";
      let desc = "Consolidation within this timeframe.";
      let signalClass = "bg-yellow-500/10 border-yellow-500/50";
      let divergence = false;

      // Divergence Logic: Price UP but Flow DOWN (or vice versa)
      if ((priceDelta > 5 && flowDelta < -50000) || (priceDelta < -5 && flowDelta > 50000)) {
          divergence = true;
      }

      if (totalScore > 40) {
          prediction = "STRONG BUY";
          color = "text-bull text-glow-green";
          desc = `Aggressive momentum in last ${effectiveDurationMins.toFixed(1)}m.`;
          signalClass = "bg-bull/20 border-bull/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
      } else if (totalScore > 15) {
          prediction = "BULLISH";
          color = "text-green-400";
          desc = "Positive flow and price action.";
          signalClass = "bg-green-500/10 border-green-500/50";
      } else if (totalScore < -40) {
          prediction = "STRONG SELL";
          color = "text-bear text-glow-red";
          desc = `Heavy selling pressure in last ${effectiveDurationMins.toFixed(1)}m.`;
          signalClass = "bg-bear/20 border-bear/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]";
      } else if (totalScore < -15) {
          prediction = "BEARISH";
          color = "text-red-400";
          desc = "Negative flow and price action.";
          signalClass = "bg-red-500/10 border-red-500/50";
      }

      if (divergence) {
          if (priceDelta > 0) {
             prediction = "TRAP / DIVERGENCE";
             desc = "Price rising but Option Flow is Bearish.";
             color = "text-orange-400";
             signalClass = "bg-orange-500/10 border-orange-500/50 animate-pulse";
          } else {
             prediction = "TRAP / DIVERGENCE";
             desc = "Price falling but Option Flow is Bullish.";
             color = "text-orange-400";
             signalClass = "bg-orange-500/10 border-orange-500/50 animate-pulse";
          }
      }
      
      // Determine if fallback warning is needed
      const isFallback = effectiveDurationMins < (decisionWindow * 0.8) && effectiveDurationMins > 0.1;

      return {
          prediction, color, desc, signalClass, divergence,
          priceDelta, flowDelta, sentimentTrend, totalScore,
          effectiveDurationMins, isFallback
      };

  }, [historyLog, decisionWindow]);


  if (data.length === 0) {
      if (marketStatus) {
          return (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500 p-4">
                  <Moon size={64} className="text-slate-500" />
                  <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Market is Closed</h2>
                      <p className="text-sm text-slate-400">{marketStatus}</p>
                  </div>
              </div>
          );
      }
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 p-4">
              <Loader2 size={48} className="text-blue-400 animate-spin" />
              <h2 className="text-2xl font-bold text-white mb-2">Initializing Cockpit...</h2>
          </div>
      );
  }

  // Session Stats (Legacy vars for non-decision UI)
  const bullishPct = stats.totalWeight > 0 ? (stats.bullishWeight / stats.totalWeight) * 100 : 0;
  const momentumNet = stats.weightedBuyMomemtum - stats.weightedSellMomentum;
  const weightedLpDay = stats.totalWeight > 0 ? stats.weighted_lp_day / stats.totalWeight : 0;

  const sparkData = historyLog.slice(-30);
  const flowData = sparkData.map(s => (s.callsBuyQty - s.callsSellQty) - (s.putsBuyQty - s.putsSellQty));
  const trendData = sparkData.map(s => s.overallSent);

  const indexMovers = [...data].sort((a, b) => (b.index_contribution || 0) - (a.index_contribution || 0));
  const topLifters = indexMovers.slice(0, 5);
  const topDraggers = indexMovers.reverse().slice(0, 5);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-2 sm:p-4 max-w-7xl mx-auto w-full pb-20 sm:pb-4">
       
       {/* Top Dashboard Row: Decision Engine + AI Insight */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* ALGORITHMIC DECISION ENGINE */}
           <div className={`lg:col-span-2 glass-panel p-4 sm:p-6 rounded-2xl relative overflow-visible transition-all duration-500 border-2 ${windowAnalysis?.signalClass || 'border-slate-800'}`}>
               <div className="flex flex-col md:flex-row gap-6">
                   <div className="flex-1 z-10">
                       <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-2">
                               <Activity size={18} className="text-blue-300" />
                               <h2 className="text-xs font-bold text-blue-200 uppercase tracking-widest">
                                 Algorithm Engine ({windowAnalysis && windowAnalysis.isFallback ? `${windowAnalysis.effectiveDurationMins.toFixed(1)}m` : `${decisionWindow}m`})
                               </h2>
                           </div>
                           
                           <div className="flex gap-2">
                                {windowAnalysis?.divergence && (
                                    <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded text-[10px] font-bold border border-yellow-400/30 animate-pulse mr-24 sm:mr-0">
                                        <AlertTriangle size={12} /> DIV
                                    </div>
                                )}
                           </div>
                       </div>
                       
                       <h1 className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${windowAnalysis?.color || 'text-slate-500'}`}>
                           {windowAnalysis?.prediction || 'INITIALIZING...'}
                       </h1>
                       <p className="text-slate-300 mt-2 text-xs sm:text-sm font-medium">
                           {windowAnalysis?.desc || 'Gathering sufficient market data...'}
                       </p>
                       
                       <div className="mt-4">
                           <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                               <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 z-10"></div>
                               <div 
                                    className={`h-full transition-all duration-1000 ease-out ${windowAnalysis && windowAnalysis.totalScore > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-300' : 'bg-gradient-to-r from-rose-500 to-red-600'}`} 
                                    style={{ 
                                        width: windowAnalysis ? `${Math.min(Math.abs(windowAnalysis.totalScore), 50)}%` : '0%',
                                        left: windowAnalysis && windowAnalysis.totalScore > 0 ? '50%' : `calc(50% - ${Math.min(Math.abs(windowAnalysis?.totalScore || 0), 50)}%)`
                                    }}
                               ></div>
                           </div>
                       </div>
                   </div>

                   {/* Window Stats */}
                   <div className="w-full md:w-48 flex flex-col gap-2 justify-center z-10 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 bg-slate-900/20 md:bg-transparent rounded-lg p-3 md:p-0 relative">
                       <div className="flex justify-end mb-2">
                           <select 
                               value={decisionWindow} 
                               onChange={(e) => setDecisionWindow(Number(e.target.value))}
                               className="bg-slate-900/90 text-slate-300 text-[10px] font-bold border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                           >
                               {[1, 3, 5, 10, 15, 30].map(m => (
                                   <option key={m} value={m}>{m}m Window</option>
                               ))}
                           </select>
                       </div>

                       <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400 flex items-center gap-1"><Timer size={10}/> Pts Chg</span>
                           <span className={`font-mono font-bold ${windowAnalysis && windowAnalysis.priceDelta >= 0 ? 'text-bull' : 'text-bear'}`}>
                               {windowAnalysis ? `${windowAnalysis.priceDelta > 0 ? '+' : ''}${windowAnalysis.priceDelta.toFixed(1)}` : '--'}
                           </span>
                       </div>
                       
                       <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400 flex items-center gap-1"><Target size={10}/> Flow</span>
                           <span className={`font-mono font-bold ${windowAnalysis && windowAnalysis.flowDelta >= 0 ? 'text-bull' : 'text-bear'}`}>
                                {windowAnalysis ? formatMillions(windowAnalysis.flowDelta) : '--'}
                           </span>
                       </div>
                   </div>
               </div>
           </div>

           {/* AI QUANT INSIGHT CARD */}
           <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group border border-indigo-500/20 bg-indigo-900/5">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BrainCircuit size={80} />
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
                                 <Bot size={16} />
                             </div>
                             <h2 className="text-xs font-bold text-indigo-200 uppercase tracking-widest">AI Quant Insight</h2>
                        </div>
                        {quantAnalysis && (
                             <span className="text-[10px] text-slate-500 font-mono">Last: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                    </div>

                    {quantAnalysis ? (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-2xl font-black tracking-tight ${quantAnalysis.signal === 'LONG' ? 'text-emerald-400' : quantAnalysis.signal === 'SHORT' ? 'text-rose-400' : 'text-yellow-400'}`}>
                                    {quantAnalysis.signal}
                                </span>
                                <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-800/50 rounded border border-white/5">
                                    {quantAnalysis.confidence_score}% Conf.
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-2">
                                {quantAnalysis.primary_reason}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <CheckCircle size={10} className="text-indigo-400" />
                                <span>Strategy: <span className="text-white">{quantAnalysis.suggested_trade.strategy_type.replace('_', ' ')}</span></span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs text-slate-500 mb-2">No AI analysis generated yet.</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onRunQuantAnalysis}
                    disabled={isQuantAnalyzing}
                    className={`mt-4 w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${isQuantAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
                >
                    {isQuantAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                    {isQuantAnalyzing ? 'Analyzing Market...' : 'Run AI Scan'}
                </button>
           </div>
       </div>

       {historyLog.length > 0 && (
          <div className="glass-panel rounded-xl overflow-hidden">
             <div className="px-4 py-3 bg-slate-900/50 border-b border-white/5 flex items-center gap-2">
                 <Clock size={16} className="text-blue-400" />
                 <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest">Recent Pulse (Last 5 Mins)</h3>
             </div>
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-xs sm:text-sm whitespace-nowrap text-center">
                  <thead className="bg-slate-900/30 text-slate-500 uppercase text-[10px] font-bold">
                     <tr>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2">Nifty</th>
                        <th className="px-3 py-2">Chg</th>
                        <th className="px-3 py-2 border-l border-white/5">Over. Sent</th>
                        <th className="px-3 py-2">Adv/Dec</th>
                        <th className="px-3 py-2">Stk Str</th>
                        <th className="px-3 py-2 border-l border-white/5">Call Str</th>
                        <th className="px-3 py-2">Put Str</th>
                        <th className="px-3 py-2">PCR</th>
                        <th className="px-3 py-2 bg-white/5">Opt Str</th>
                        <th className="px-3 py-2 border-l border-white/5">Calls Flow (M)</th>
                        <th className="px-3 py-2">Puts Flow (M)</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {historyLog.slice().reverse().slice(0, 5).map((snap, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                           <td className="px-3 py-2 text-left font-mono text-slate-300 font-bold bg-slate-900/30">{snap.time}</td>
                           <td className="px-3 py-2 font-mono text-slate-400">{formatNumber(snap.niftyLtp, 2)}</td>
                           <td className={`px-3 py-2 font-mono font-bold ${snap.ptsChg >= 0 ? 'text-bull' : 'text-bear'}`}>{snap.ptsChg > 0 ? '+' : ''}{snap.ptsChg.toFixed(1)}</td>
                           <td className={`px-3 py-2 border-l border-white/5 font-bold ${snap.overallSent >= 0 ? 'text-bull' : 'text-bear'}`}>{formatPercent(snap.overallSent)}</td>
                           <td className="px-3 py-2 font-mono"><span className="text-bull">{snap.adv}</span>/<span className="text-bear">{snap.dec}</span></td>
                           <td className="px-3 py-2">{formatPercent(snap.stockSent)}</td>
                           <td className="px-3 py-2 border-l border-white/5">{formatPercent(snap.callSent)}</td>
                           <td className="px-3 py-2">{formatPercent(snap.putSent)}</td>
                           <td className={`px-3 py-2 font-mono font-bold ${snap.pcr > 1 ? 'text-bull' : snap.pcr < 0.7 ? 'text-bear' : 'text-blue-200'}`}>{snap.pcr.toFixed(2)}</td>
                           <td className={`px-3 py-2 font-bold bg-white/5 ${snap.optionsSent >= 0 ? 'text-bull' : 'text-bear'}`}>{formatPercent(snap.optionsSent)}</td>
                           <td className="px-3 py-2 border-l border-white/5 font-mono text-[10px] opacity-80"><span className="text-bull">{formatMillions(snap.callsBuyQty)}</span>/<span className="text-bear">{formatMillions(snap.callsSellQty)}</span></td>
                           <td className="px-3 py-2 font-mono text-[10px] opacity-80"><span className="text-bull">{formatMillions(snap.putsBuyQty)}</span>/<span className="text-bear">{formatMillions(snap.putsSellQty)}</span></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div onClick={() => onNavigate('stocks')} className="glass-panel p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-all group">
               <div className="flex justify-between items-start mb-2">
                   <div>
                       <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Activity size={12}/> Weighted Breadth</p>
                       <p className={`text-2xl font-mono font-bold ${bullishPct > 50 ? 'text-bull' : 'text-bear'}`}>{bullishPct.toFixed(1)}%</p>
                   </div>
                   <div className={`px-2 py-1 rounded text-[10px] font-bold ${weightedLpDay >= 0 ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'}`}>{formatPercent(weightedLpDay)}</div>
               </div>
               <div className="h-10 w-full"><Sparkline data={trendData} color={bullishPct > 50 ? '#10b981' : '#ef4444'} /></div>
           </div>
           <div onClick={() => onNavigate('options')} className="glass-panel p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-all group">
               <div className="flex justify-between items-start mb-2">
                   <div>
                       <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Target size={12}/> Net Option Flow</p>
                       <div className="text-xl font-mono font-bold">{latestSnapshot?.optionsSent ? formatPercent(latestSnapshot.optionsSent) : '--'}</div>
                   </div>
                   <div className="text-right">
                        <p className="text-[10px] text-slate-500">PCR</p>
                        <p className={`text-sm font-mono font-bold ${latestSnapshot && latestSnapshot.pcr > 1 ? 'text-bull' : 'text-blue-200'}`}>{latestSnapshot?.pcr.toFixed(2) || '--'}</p>
                   </div>
               </div>
               <div className="h-10 w-full"><Sparkline data={flowData} color={latestSnapshot && latestSnapshot.optionsSent > 0 ? '#10b981' : '#ef4444'} /></div>
           </div>
           <div className="glass-panel p-4 rounded-xl flex flex-col justify-center">
               <div className="flex justify-between items-center mb-3">
                   <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1"><Zap size={12} className="text-yellow-400"/> Momentum (1m)</p>
                   <span className={`text-xs font-mono font-bold ${momentumNet > 0 ? 'text-bull' : 'text-bear'}`}>{formatValue(momentumNet)}</span>
               </div>
               <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden flex">
                   <div className="w-1/2 flex justify-end"><div className="h-full bg-bear rounded-l-full" style={{ width: `${Math.min(Math.abs(stats.weightedSellMomentum)/500000 * 100, 100)}%`, opacity: 0.8 }}></div></div>
                   <div className="w-1/2 flex justify-start"><div className="h-full bg-bull rounded-r-full" style={{ width: `${Math.min(Math.abs(stats.weightedBuyMomemtum)/500000 * 100, 100)}%`, opacity: 0.8 }}></div></div>
                   <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
               </div>
               <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-mono uppercase"><span>Sell Pressure</span><span>Buy Pressure</span></div>
           </div>
       </div>

       <div className="glass-panel rounded-xl overflow-hidden p-0">
           <div className="px-4 py-3 bg-slate-900/50 border-b border-white/5 flex items-center gap-2">
               <Scale size={14} className="text-purple-400" />
               <h3 className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Market Stats</h3>
           </div>
           <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-xs sm:text-sm whitespace-nowrap">
                   <thead className="bg-slate-900/30 text-slate-500 uppercase text-[9px] font-bold">
                       <tr>
                           <th className="px-3 py-2 text-left sticky left-0 bg-slate-900 z-10">Segment</th>
                           <th className="px-3 py-2 text-right text-bull-light">Buy Qty</th>
                           <th className="px-3 py-2 text-right text-bear-light">Sell Qty</th>
                           <th className="px-3 py-2 text-right">Net Qty</th>
                           <th className="px-3 py-2 text-right">Sentiment</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 font-mono text-xs">
                       <tr className="hover:bg-white/5 transition-colors">
                           <td className="px-3 py-2 font-bold text-slate-300 sticky left-0 bg-slate-900/90 backdrop-blur z-10 font-sans">Equity</td>
                           <td className="px-3 py-2 text-right text-slate-300">{formatValue(stats.total_buy_qty)}</td>
                           <td className="px-3 py-2 text-right text-slate-300">{formatValue(stats.total_sell_qty)}</td>
                           <td className={`px-3 py-2 text-right font-bold ${stats.total_buy_qty - stats.total_sell_qty > 0 ? 'text-bull' : 'text-bear'}`}>{formatValue(stats.total_buy_qty - stats.total_sell_qty)}</td>
                           <td className="px-3 py-2 text-right">{formatPercent(weightedLpDay)}</td>
                       </tr>
                       <tr className="hover:bg-white/5 transition-colors">
                           <td className="px-3 py-2 font-bold text-slate-300 sticky left-0 bg-slate-900/90 backdrop-blur z-10 font-sans">Opt CE</td>
                           <td className="px-3 py-2 text-right text-slate-300">{latestSnapshot ? formatValue(latestSnapshot.callsBuyQty) : '--'}</td>
                           <td className="px-3 py-2 text-right text-slate-300">{latestSnapshot ? formatValue(latestSnapshot.callsSellQty) : '--'}</td>
                           <td className={`px-3 py-2 text-right font-bold ${latestSnapshot && (latestSnapshot.callsBuyQty - latestSnapshot.callsSellQty) > 0 ? 'text-bull' : 'text-bear'}`}>{latestSnapshot ? formatValue(latestSnapshot.callsBuyQty - latestSnapshot.callsSellQty) : '--'}</td>
                           <td className={`px-3 py-2 text-right font-bold ${latestSnapshot && latestSnapshot.callSent > 0 ? 'text-bull' : 'text-bear'}`}>{latestSnapshot ? formatPercent(latestSnapshot.callSent) : '--'}</td>
                       </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                           <td className="px-3 py-2 font-bold text-slate-300 sticky left-0 bg-slate-900/90 backdrop-blur z-10 font-sans">Opt PE</td>
                           <td className="px-3 py-2 text-right text-slate-300">{latestSnapshot ? formatValue(latestSnapshot.putsBuyQty) : '--'}</td>
                           <td className="px-3 py-2 text-right text-slate-300">{latestSnapshot ? formatValue(latestSnapshot.putsSellQty) : '--'}</td>
                           <td className={`px-3 py-2 text-right font-bold ${latestSnapshot && (latestSnapshot.putsBuyQty - latestSnapshot.putsSellQty) > 0 ? 'text-bull' : 'text-bear'}`}>{latestSnapshot ? formatValue(latestSnapshot.putsBuyQty - latestSnapshot.putsSellQty) : '--'}</td>
                           <td className={`px-3 py-2 text-right font-bold ${latestSnapshot && latestSnapshot.putSent > 0 ? 'text-bull' : 'text-bear'}`}>{latestSnapshot ? formatPercent(latestSnapshot.putSent) : '--'}</td>
                       </tr>
                   </tbody>
               </table>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0">
          <div className="glass-card rounded-xl overflow-hidden flex flex-col">
             <div className="p-3 border-b border-white/5 bg-bull/10 flex items-center gap-2">
                <TrendingUp size={16} className="text-bull" />
                <h3 className="font-bold text-bull-light text-xs uppercase">Drivers (Bullish)</h3>
             </div>
             <div className="flex-1 overflow-auto max-h-60">
                <table className="w-full text-xs sm:text-sm">
                   <tbody className="divide-y divide-white/5">
                      {topLifters.map(stock => (
                         <tr key={stock.symbol} onClick={() => onSelectStock(stock.symbol)} className="hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="px-4 py-2 sm:py-3 text-slate-300 font-medium truncate max-w-[120px]">{stock.short_name}</td>
                            <td className="px-4 py-2 sm:py-3 text-right font-mono text-bull font-bold text-glow-green">+{stock.chp.toFixed(1)}%</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden flex flex-col">
             <div className="p-3 border-b border-white/5 bg-bear/10 flex items-center gap-2">
                <TrendingDown size={16} className="text-bear" />
                <h3 className="font-bold text-bear-light text-xs uppercase">Draggers (Bearish)</h3>
             </div>
             <div className="flex-1 overflow-auto max-h-60">
                <table className="w-full text-xs sm:text-sm">
                   <tbody className="divide-y divide-white/5">
                      {topDraggers.map(stock => (
                         <tr key={stock.symbol} onClick={() => onSelectStock(stock.symbol)} className="hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="px-4 py-2 sm:py-3 text-slate-300 font-medium truncate max-w-[120px]">{stock.short_name}</td>
                            <td className="px-4 py-2 sm:py-3 text-right font-mono text-bear font-bold text-glow-red">{stock.chp.toFixed(1)}%</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>

    </div>
  );
};

export default CumulativeView;
