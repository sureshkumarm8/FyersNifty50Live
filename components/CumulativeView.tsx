
import React, { useMemo, useState } from 'react';
import { EnrichedFyersQuote, MarketSnapshot, ViewMode, StrategySignal, SectorMetric } from '../types';
import { TrendingUp, TrendingDown, Activity, Zap, Target, BrainCircuit, Loader2, Scale, Clock, Moon, AlertTriangle, Timer, Bot, Play, CheckCircle, ArrowUp, ArrowDown, Minus, BarChart3, ListFilter } from 'lucide-react';

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
  sectors?: SectorMetric[];
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
    return <span className={`font-mono font-bold ${colorClass}`}>{isPos ? '+' : ''}{Math.abs(num).toFixed(1)}%</span>;
};
const formatMillions = (num: number) => {
    const val = num / 1000000;
    return `${val.toFixed(2)}M`;
};

// --- Advanced Chart Component ---
const AdvancedChart: React.FC<{ 
    data: MarketSnapshot[]; 
    width?: string; 
    height?: number 
}> = ({ data, width = "100%", height = 160 }) => {
    if (data.length < 2) return <div className={`h-[${height}px] w-full bg-slate-800/20 rounded flex items-center justify-center text-xs text-slate-600`}>Insufficient Data</div>;

    // 1. Prepare Data Series
    const prices = data.map(d => d.niftyLtp);
    const flows = data.map(d => d.optionsSent); // Net Option Flow % (-100 to 100)
    
    // 2. Calculate Scales (Normalize to 0-100 relative to SVG height)
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Flow is usually -100 to 100, but we scale based on max magnitude seen to keep it visible
    const maxFlowMag = Math.max(...flows.map(Math.abs), 10); // Min magnitude 10 to avoid blown up noise
    
    // 3. Generate SVG Paths
    const pointsCount = data.length;
    const stepX = 100 / (pointsCount - 1); // Percent width per step

    // Price Line Points
    const pricePoints = prices.map((p, i) => {
        const x = i * stepX;
        // Invert Y (0 is top)
        const y = 100 - ((p - minPrice) / priceRange) * 80 - 10; // Keep 10% padding top/bottom
        return `${x},${y}`;
    }).join(' ');

    // Flow Bars (Centered at 50% height?) No, let's put them as bars from center line
    // Or better: An Area chart at the bottom?
    // Let's do a dual-axis visual. Price is Line. Flow is Bars.
    
    return (
        <div className="relative w-full h-full select-none" style={{ height: `${height}px` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Defs for Gradients */}
                <defs>
                    <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Zero Line for Flow (Approx middle if using separate scale, but here let's put it at bottom overlay) */}
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2" />

                {/* Flow Bars (Visualized as simple vertical lines or rects) */}
                {flows.map((f, i) => {
                    const x = i * stepX;
                    const heightPercent = (Math.abs(f) / maxFlowMag) * 40; // Max 40% height
                    const isPos = f >= 0;
                    // Start from bottom (100) up
                    return (
                        <rect 
                            key={i}
                            x={x - (stepX/2)*0.8} 
                            y={100 - heightPercent} 
                            width={Math.max(stepX * 0.8, 0.5)} 
                            height={heightPercent} 
                            fill={isPos ? '#10b981' : '#ef4444'} 
                            opacity="0.3"
                            rx="0.5"
                        />
                    );
                })}

                {/* Price Line Shadow */}
                <polyline 
                    points={pricePoints} 
                    fill="none" 
                    stroke="rgba(0,0,0,0.5)" 
                    strokeWidth="4" 
                    className="drop-shadow-sm"
                />
                {/* Price Line Main */}
                <polyline 
                    points={pricePoints} 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-blue-400"
                    style={{ stroke: 'currentColor' }}
                />
                
                {/* End Dot */}
                <circle cx="100" cy={100 - ((prices[prices.length-1] - minPrice) / priceRange) * 80 - 10} r="1.5" fill="#fff" className="animate-pulse" />
            </svg>
            
            {/* Labels Overlay */}
            <div className="absolute top-1 left-2 text-[9px] text-blue-300/80 font-mono bg-slate-950/50 px-1 rounded">Price</div>
            <div className="absolute bottom-1 left-2 text-[9px] text-slate-500 font-mono">Flow Strength</div>
        </div>
    );
};

// --- History Mini Table ---
const HistorySnippet: React.FC<{ history: MarketSnapshot[] }> = ({ history }) => {
    // Show last 5 reversed
    const last5 = [...history].reverse().slice(0, 5);

    return (
        <div className="w-full">
            <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="text-[9px] uppercase font-bold text-slate-500 border-b border-white/5">
                    <tr>
                        <th className="pb-2 pl-2">Time</th>
                        <th className="pb-2 text-right">Nifty</th>
                        <th className="pb-2 text-right">Sent.</th>
                        <th className="pb-2 text-right">Flow</th>
                        <th className="pb-2 text-right pr-2">PCR</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {last5.map((row, i) => (
                        <tr key={row.timestamp || i} className="hover:bg-white/5 transition-colors">
                            <td className="py-2 pl-2 font-mono text-slate-400">{row.time}</td>
                            <td className="py-2 text-right font-mono font-medium text-white">{row.niftyLtp}</td>
                            <td className={`py-2 text-right font-bold ${row.overallSent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {row.overallSent > 0 ? '+' : ''}{Math.round(row.overallSent)}%
                            </td>
                            <td className={`py-2 text-right font-bold ${row.optionsSent > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {row.optionsSent > 0 ? '+' : ''}{Math.round(row.optionsSent)}%
                            </td>
                            <td className="py-2 text-right font-mono text-blue-200 pr-2">{row.pcr.toFixed(2)}</td>
                        </tr>
                    ))}
                    {last5.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-slate-600 italic">No data yet</td></tr>
                    )}
                </tbody>
            </table>
        </div>
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
    onRunQuantAnalysis,
    sectors = []
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

  const sparkData = historyLog.slice(-40); // Last 40 points for the chart
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

       {/* SECTOR HEATMAP BAR */}
       {sectors.length > 0 && (
           <div className="glass-panel rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={14} /> Sector Performance (Weighted)
                    </h3>
                </div>
                <div className="flex items-center gap-1 h-12 w-full rounded-lg overflow-hidden bg-slate-900/50">
                    {sectors.map(sec => {
                        const width = (sec.weight / 100) * 100; // Simplified scale
                        const isBull = sec.change_p > 0;
                        return (
                            <div 
                                key={sec.name} 
                                style={{ width: `${width}%` }} 
                                className={`h-full flex flex-col justify-center items-center relative group cursor-help border-r border-slate-950 ${isBull ? 'bg-emerald-500/20 hover:bg-emerald-500/40' : 'bg-rose-500/20 hover:bg-rose-500/40'} transition-all`}
                                title={`${sec.name}: ${sec.change_p.toFixed(2)}%`}
                            >
                                <span className={`text-[10px] font-bold ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>{sec.name}</span>
                                {width > 8 && <span className="text-[9px] text-slate-500">{sec.change_p.toFixed(2)}%</span>}
                            </div>
                        );
                    })}
                </div>
           </div>
       )}

       {/* --- NEW: TREND ANALYSIS BOARD (Revamped Visuals + History) --- */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* Left: Combined Trend Chart */}
           <div className="glass-panel p-5 rounded-2xl flex flex-col">
               <div className="flex justify-between items-start mb-4">
                   <div>
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                           <BarChart3 size={14} className="text-blue-400" /> Price vs Net Flow Divergence
                       </h3>
                       <p className="text-[10px] text-slate-500">Comparing Nifty Moves (Line) vs Option Intent (Bars)</p>
                   </div>
                   <div className="text-right">
                       <span className={`text-2xl font-black font-mono tracking-tight ${latestSnapshot?.niftyLtp || 0 > 0 ? 'text-white' : 'text-white'}`}>
                           {latestSnapshot?.niftyLtp?.toLocaleString() || '--'}
                       </span>
                   </div>
               </div>
               
               <div className="flex-1 bg-slate-900/30 rounded-xl border border-white/5 p-2">
                   <AdvancedChart data={sparkData} height={180} />
               </div>
           </div>

           {/* Right: History Log & Momentum */}
           <div className="flex flex-col gap-4">
                {/* Momentum Gauge Card */}
                <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 mb-1"><Zap size={12} className="text-yellow-400"/> Instant Momentum (1m)</p>
                        <span className={`text-xl font-mono font-bold ${momentumNet > 0 ? 'text-bull' : 'text-bear'}`}>
                            {formatValue(momentumNet)}
                        </span>
                    </div>
                    
                    <div className="flex-1 mx-6 relative h-3 bg-slate-800 rounded-full overflow-hidden">
                        {/* Center Marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white z-10"></div>
                        <div 
                            className={`absolute top-0 bottom-0 transition-all duration-500 ${momentumNet > 0 ? 'left-1/2 bg-bull' : 'right-1/2 bg-bear'}`} 
                            style={{ width: `${Math.min(Math.abs(momentumNet) / 2000000 * 50, 50)}%` }} // Normalized scale
                        ></div>
                    </div>
                    
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">PCR</p>
                        <p className={`text-lg font-mono font-bold ${latestSnapshot && latestSnapshot.pcr > 1 ? 'text-bull' : 'text-blue-200'}`}>
                            {latestSnapshot?.pcr.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Last 5 History Table */}
                <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <ListFilter size={12} /> Recent Trend Log (Last 5)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-slate-950/20">
                        <HistorySnippet history={historyLog} />
                    </div>
                </div>
           </div>
       </div>

       {/* Top Drivers/Draggers */}
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
