import React, { useMemo } from 'react';
import { EnrichedFyersQuote, MarketSnapshot, ViewMode } from '../types';
import { TrendingUp, TrendingDown, Activity, Zap, Compass, Target, BrainCircuit, Loader2 } from 'lucide-react';

interface CumulativeViewProps {
  data: EnrichedFyersQuote[];
  latestSnapshot?: MarketSnapshot;
  onNavigate: (mode: ViewMode) => void;
  onSelectStock: (symbol: string) => void;
}

const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    if (absVal >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (absVal >= 100000) return `${(val / 100000).toFixed(2)} L`;
    return val.toLocaleString('en-IN');
};

// --- Gauge Component ---
const Gauge: React.FC<{ value: number; label: string }> = ({ value, label }) => {
    // Value between 0 and 100
    const normalized = Math.min(Math.max(value, 0), 100);
    const rotation = (normalized / 100) * 180 - 90; // -90 to +90 degrees
    const color = normalized > 55 ? '#10b981' : normalized < 45 ? '#ef4444' : '#fbbf24';
    
    return (
        <div className="relative flex flex-col items-center justify-center pt-4 pb-0">
             <div className="relative w-48 h-24 overflow-hidden">
                 <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-slate-800 box-border"></div>
                 <div 
                   className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent box-border transition-all duration-1000 ease-out"
                   style={{ 
                       borderTopColor: color, 
                       borderRightColor: normalized > 50 ? color : 'transparent',
                       transform: `rotate(${rotation - 45}deg)` // Adjust for CSS border rotation quirks
                   }}
                 ></div>
                 <div className="absolute bottom-0 left-1/2 w-1 h-24 bg-slate-700 origin-bottom transform -translate-x-1/2" style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-lg shadow-white/50"></div>
                 </div>
             </div>
             <div className="text-center mt-[-10px] z-10">
                 <p className="text-3xl font-bold font-mono tracking-tighter" style={{ color }}>{normalized.toFixed(0)}%</p>
                 <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 font-semibold">{label}</p>
             </div>
        </div>
    );
};

export const CumulativeView: React.FC<CumulativeViewProps> = ({ data, latestSnapshot, onNavigate, onSelectStock }) => {
  
  const stats = useMemo(() => {
    const initialStats = {
      bullishWeight: 0,
      bearishWeight: 0,
      totalWeight: 0,
      weightedBuyValue: 0,
      weightedSellValue: 0,
      weightedBuyMomemtum: 0,
      weightedSellMomentum: 0,
    };

    if (data.length === 0) return initialStats;

    return data.reduce((acc, curr) => {
       const w = curr.weight || 0.1;
       const ltp = curr.lp || 0;
       
       if (curr.ch >= 0) acc.bullishWeight += w;
       else acc.bearishWeight += w;
       acc.totalWeight += w;

       const buyVal = (curr.total_buy_qty || 0) * ltp;
       const sellVal = (curr.total_sell_qty || 0) * ltp;
       acc.weightedBuyValue += (buyVal * w);
       acc.weightedSellValue += (sellVal * w);

       const buyChgVal = (curr.bid_qty_chg_1m || 0) * ltp;
       const sellChgVal = (curr.ask_qty_chg_1m || 0) * ltp;
       acc.weightedBuyMomemtum += (buyChgVal * w);
       acc.weightedSellMomentum += (sellChgVal * w);

       return acc;
    }, initialStats);
  }, [data]);

  // If no data, show loading state immediately
  if (data.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                  <Loader2 size={64} className="text-blue-400 animate-spin relative z-10" />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Initializing Cockpit...</h2>
                  <p className="text-slate-400 max-w-md">Establishing secure connection to Fyers API Proxy. Waiting for live market data feed.</p>
              </div>
          </div>
      );
  }

  const bullishPct = stats.totalWeight > 0 ? (stats.bullishWeight / stats.totalWeight) * 100 : 0;
  const totalValuePressure = stats.weightedBuyValue + stats.weightedSellValue;
  const buyPressureRatio = totalValuePressure > 0 ? (stats.weightedBuyValue / totalValuePressure) * 100 : 0;
  
  const momentumNet = stats.weightedBuyMomemtum - stats.weightedSellMomentum;
  
  // AI Prediction Logic
  let prediction = "Analyzing...";
  let predictionColor = "text-slate-400";
  let predictionDesc = "Gathering sufficient momentum data for prediction...";
  
  if (momentumNet > 1000000 && bullishPct > 60) {
      prediction = "Strong Bullish";
      predictionColor = "text-bull text-glow-green";
      predictionDesc = "High buying momentum with broad market participation. Look for long entries.";
  } else if (momentumNet < -1000000 && bullishPct < 40) {
      prediction = "Strong Bearish";
      predictionColor = "text-bear text-glow-red";
      predictionDesc = "Significant selling pressure detected. Support levels may break.";
  } else if (momentumNet > 0 && bullishPct > 50) {
      prediction = "Mild Bullish";
      predictionColor = "text-green-400";
      predictionDesc = "Positive drift, but momentum is not explosive.";
  } else if (momentumNet < 0 && bullishPct < 50) {
      prediction = "Mild Bearish";
      predictionColor = "text-red-400";
      predictionDesc = "Negative drift, selling is present but controlled.";
  } else if (stats.totalWeight > 0) {
      prediction = "Neutral / Chop";
      predictionColor = "text-yellow-400";
      predictionDesc = "Market is consolidating. Wait for clear volume breakout.";
  }

  // Top Movers
  const indexMovers = [...data].sort((a, b) => (b.index_contribution || 0) - (a.index_contribution || 0));
  const topLifters = indexMovers.slice(0, 5);
  const topDraggers = indexMovers.reverse().slice(0, 5);

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
       
       {/* AI Prediction Header */}
       <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-500/30 transition-all"></div>
           <div className="flex items-start justify-between relative z-10">
               <div>
                   <div className="flex items-center gap-2 mb-1">
                       <BrainCircuit size={20} className="text-blue-400" />
                       <h2 className="text-sm font-bold text-blue-300 uppercase tracking-widest">AI Market Pulse</h2>
                   </div>
                   <h1 className={`text-4xl font-bold font-mono mt-2 ${predictionColor}`}>{prediction}</h1>
                   <p className="text-slate-400 mt-2 max-w-xl">{predictionDesc}</p>
               </div>
               <div className="text-right hidden sm:block">
                   <p className="text-xs text-slate-500 uppercase">Net Momentum (1m)</p>
                   <p className={`text-2xl font-mono font-bold ${momentumNet > 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}`}>
                       {momentumNet > 0 ? '+' : ''}{formatValue(momentumNet)}
                   </p>
               </div>
           </div>
       </div>

       {/* Gauges Row */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sentiment Gauge */}
          <div onClick={() => onNavigate('stocks')} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Compass size={16} /> Weighted Sentiment
              </h3>
              <Gauge value={bullishPct} label="Bullish Impact" />
          </div>

          {/* Pressure Gauge */}
          <div onClick={() => onNavigate('stocks')} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Activity size={16} /> Buy vs Sell Pressure
              </h3>
              <Gauge value={buyPressureRatio} label="Buy Value %" />
          </div>

          {/* Options Gauge */}
          <div onClick={() => onNavigate('options')} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Target size={16} /> Option Sentiment
              </h3>
               {/* Custom Linear Gauge for Options */}
               <div className="w-full px-4 mt-6">
                   <div className="flex justify-between text-xs font-mono font-bold mb-2">
                       <span className="text-bull">CALLS</span>
                       <span className="text-bear">PUTS</span>
                   </div>
                   {latestSnapshot ? (
                     <>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                            <div className="absolute inset-0 flex">
                                    <div className="h-full bg-bull shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700" style={{ width: `${latestSnapshot.callSent > 0 ? 50 + (latestSnapshot.callSent/2) : 50}%` }}></div>
                                    <div className="h-full bg-bear shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-700 flex-1"></div>
                            </div>
                            <div className="absolute top-0 bottom-0 w-1 bg-white left-1/2 -ml-0.5 z-10"></div>
                        </div>
                        <div className="text-center mt-3">
                            <p className={`text-xl font-bold font-mono ${latestSnapshot.optionsSent > 0 ? 'text-bull' : 'text-bear'}`}>
                                {latestSnapshot.optionsSent > 0 ? 'BULLISH' : 'BEARISH'}
                            </p>
                            <p className="text-xs text-slate-500">Net Option Flow</p>
                        </div>
                     </>
                   ) : (
                       <div className="h-16 flex items-center justify-center text-xs text-slate-500">
                           Waiting for Options Feed...
                       </div>
                   )}
               </div>
          </div>
       </div>

       {/* Flow Visualizer (Momentum Pipe) */}
       <div className="glass-panel p-6 rounded-2xl">
           <div className="flex items-center justify-between mb-4">
               <h3 className="text-slate-300 font-bold flex items-center gap-2">
                  <Zap size={18} className="text-yellow-400" /> 
                  Momentum Flow Scanner (1 min)
               </h3>
               <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">Live Stream</span>
           </div>
           
           <div className="relative h-12 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800 flex items-center px-2">
                {/* Center Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700 z-0"></div>
                
                {/* Bearish Flow (Left) */}
                <div className="flex-1 flex justify-end pr-2 z-10">
                    <div 
                      className="h-2 bg-gradient-to-l from-bear to-transparent rounded-l-full shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse"
                      style={{ width: `${Math.min(Math.abs(stats.weightedSellMomentum) / 500000, 100)}%` }}
                    ></div>
                </div>

                {/* Bullish Flow (Right) */}
                <div className="flex-1 flex justify-start pl-2 z-10">
                    <div 
                      className="h-2 bg-gradient-to-r from-bull to-transparent rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"
                      style={{ width: `${Math.min(Math.abs(stats.weightedBuyMomemtum) / 500000, 100)}%` }}
                    ></div>
                </div>
           </div>
           <div className="flex justify-between mt-2 text-xs font-mono text-slate-400">
               <span>Selling Pressure</span>
               <span>Buying Pressure</span>
           </div>
       </div>

       {/* Lists */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Lifters */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col">
             <div className="p-3 border-b border-white/5 bg-bull/10 flex items-center gap-2">
                <TrendingUp size={16} className="text-bull" />
                <h3 className="font-bold text-bull-light text-sm uppercase">Drivers (Bullish)</h3>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                   <tbody className="divide-y divide-white/5">
                      {topLifters.map(stock => (
                         <tr key={stock.symbol} onClick={() => onSelectStock(stock.symbol)} className="hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-slate-300 font-medium">{stock.short_name}</td>
                            <td className="px-4 py-3 text-right font-mono text-bull font-bold text-glow-green">+{stock.chp.toFixed(2)}%</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Draggers */}
          <div className="glass-card rounded-xl overflow-hidden flex flex-col">
             <div className="p-3 border-b border-white/5 bg-bear/10 flex items-center gap-2">
                <TrendingDown size={16} className="text-bear" />
                <h3 className="font-bold text-bear-light text-sm uppercase">Draggers (Bearish)</h3>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                   <tbody className="divide-y divide-white/5">
                      {topDraggers.map(stock => (
                         <tr key={stock.symbol} onClick={() => onSelectStock(stock.symbol)} className="hover:bg-white/5 cursor-pointer transition-colors">
                            <td className="px-4 py-3 text-slate-300 font-medium">{stock.short_name}</td>
                            <td className="px-4 py-3 text-right font-mono text-bear font-bold text-glow-red">{stock.chp.toFixed(2)}%</td>
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