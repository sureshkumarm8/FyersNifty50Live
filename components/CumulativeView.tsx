
import React, { useMemo } from 'react';
import { EnrichedFyersQuote } from '../types';
import { TrendingUp, TrendingDown, Activity, Scale, ArrowUpRight, ArrowDownRight, BarChart2, DollarSign } from 'lucide-react';

interface CumulativeViewProps {
  data: EnrichedFyersQuote[];
}

const formatValue = (val: number) => {
    // Value in Crores usually
    const absVal = Math.abs(val);
    if (absVal >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (absVal >= 100000) return `${(val / 100000).toFixed(2)} L`;
    return val.toLocaleString('en-IN');
};

const formatPercent = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const CumulativeView: React.FC<CumulativeViewProps> = ({ data }) => {
  
  // --- Weighted Aggregation Logic ---
  const stats = useMemo(() => {
    const initialStats = {
      // Weighted Market Breadth
      bullishWeight: 0,
      bearishWeight: 0,
      totalWeight: 0,

      // Weighted Buying/Selling Pressure (Value * Weight)
      weightedBuyValue: 0, // Sum(BidQty * LTP * Weight)
      weightedSellValue: 0, // Sum(AskQty * LTP * Weight)
      
      // Momentum (Rate of Change in Value)
      weightedBuyMomemtum: 0, // Sum(BidQtyChange * LTP * Weight)
      weightedSellMomentum: 0, // Sum(AskQtyChange * LTP * Weight)
    };

    if (data.length === 0) return initialStats;

    return data.reduce((acc, curr) => {
       const w = curr.weight || 0.1;
       const ltp = curr.lp || 0;
       
       // 1. Breadth (Sentiment)
       if (curr.ch >= 0) acc.bullishWeight += w;
       else acc.bearishWeight += w;
       acc.totalWeight += w;

       // 2. Pressure (Weighted Value)
       const buyVal = (curr.total_buy_qty || 0) * ltp;
       const sellVal = (curr.total_sell_qty || 0) * ltp;
       
       acc.weightedBuyValue += (buyVal * w);
       acc.weightedSellValue += (sellVal * w);

       // 3. Momentum (1m Change in Value * Weight)
       // This shows if heavyweights are seeing fresh buying/selling
       const buyChgVal = (curr.bid_qty_chg_1m || 0) * ltp;
       const sellChgVal = (curr.ask_qty_chg_1m || 0) * ltp;

       acc.weightedBuyMomemtum += (buyChgVal * w);
       acc.weightedSellMomentum += (sellChgVal * w);

       return acc;
    }, initialStats);
  }, [data]);

  // --- Derived Metrics ---

  // Weighted Breadth
  const bullishPct = (stats.bullishWeight / stats.totalWeight) * 100;
  const bearishPct = 100 - bullishPct;

  // Weighted Value Pressure Ratio
  const totalValuePressure = stats.weightedBuyValue + stats.weightedSellValue;
  const buyPressureRatio = totalValuePressure > 0 ? (stats.weightedBuyValue / totalValuePressure) * 100 : 50;
  const sellPressureRatio = 100 - buyPressureRatio;

  // Weighted Momentum Indicators (Normalized to determine strength direction)
  const momentumNet = stats.weightedBuyMomemtum - stats.weightedSellMomentum;
  const momentumColor = momentumNet > 0 ? 'text-green-400' : 'text-red-400';

  // --- Top Movers based on INDEX CONTRIBUTION (Impact) ---
  // Not just % change, but (Chg% * Weight)
  const indexMovers = [...data].sort((a, b) => (b.index_contribution || 0) - (a.index_contribution || 0));
  const topLifters = indexMovers.slice(0, 5); // Positive Impact
  const topDraggers = indexMovers.reverse().slice(0, 5); // Negative Impact (re-reverse for display if needed, but here we want worst first)

  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 max-w-7xl mx-auto w-full">
       
       {/* Info Banner */}
       <div className="bg-blue-900/20 border border-blue-800/50 p-3 rounded-lg flex items-center gap-2 text-sm text-blue-200">
          <Activity size={16} />
          <span>
            <strong>Smart View:</strong> All metrics below are <strong>weighted</strong> by Nifty 50 stock weightage. 
            This reflects actual market impact rather than raw quantities.
          </span>
       </div>

       {/* Row 1: Weighted Market Breadth & Sentiment */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Weighted Breadth */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 size={16} /> Weighted Breadth
             </h3>
             <div className="flex items-center justify-between mt-2">
                <div className="text-center">
                   <p className="text-3xl font-bold text-green-500">{bullishPct.toFixed(0)}%</p>
                   <p className="text-xs text-gray-500 mt-1">Bullish Impact</p>
                </div>
                <div className="text-center">
                   <p className="text-3xl font-bold text-red-500">{bearishPct.toFixed(0)}%</p>
                   <p className="text-xs text-gray-500 mt-1">Bearish Impact</p>
                </div>
             </div>
             {/* Bar */}
             <div className="flex h-2 w-full mt-6 rounded-full overflow-hidden bg-gray-800">
                <div className="bg-green-500 transition-all duration-700" style={{ width: `${bullishPct}%` }}></div>
                <div className="bg-red-500 transition-all duration-700" style={{ width: `${bearishPct}%` }}></div>
             </div>
          </div>

          {/* Weighted Buying Pressure (Value Based) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowUpRight size={80} className="text-blue-500" />
             </div>
             <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Weighted Buy Pressure</h3>
             <div className="flex items-baseline gap-2">
                <p className="text-2xl font-mono font-bold text-white mt-2">
                  {buyPressureRatio.toFixed(1)}%
                </p>
                <span className="text-xs text-gray-500">of Total Weighted Value</span>
             </div>
             
             <div className="mt-4">
                 <p className="text-[10px] text-gray-500 uppercase">1m Weighted Momentum</p>
                 <p className={`font-mono text-sm font-medium ${stats.weightedBuyMomemtum > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                    {stats.weightedBuyMomemtum > 0 ? '+' : ''}{formatValue(stats.weightedBuyMomemtum)}
                 </p>
             </div>
          </div>

          {/* Weighted Selling Pressure (Value Based) */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowDownRight size={80} className="text-red-500" />
             </div>
             <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Weighted Sell Pressure</h3>
             <div className="flex items-baseline gap-2">
                <p className="text-2xl font-mono font-bold text-white mt-2">
                   {sellPressureRatio.toFixed(1)}%
                </p>
                <span className="text-xs text-gray-500">of Total Weighted Value</span>
             </div>
             
             <div className="mt-4">
                 <p className="text-[10px] text-gray-500 uppercase">1m Weighted Momentum</p>
                 <p className={`font-mono text-sm font-medium ${stats.weightedSellMomentum > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {stats.weightedSellMomentum > 0 ? '+' : ''}{formatValue(stats.weightedSellMomentum)}
                 </p>
             </div>
          </div>

       </div>

       {/* Row 2: Net Weighted Strength */}
       <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2">
                   <Activity size={18} className="text-purple-400" /> 
                   Net Weighted Momentum (1m)
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-bold bg-gray-800 ${momentumColor}`}>
                   {momentumNet > 0 ? 'BULLISH' : 'BEARISH'} ({formatValue(momentumNet)})
                </span>
             </div>
             <p className="text-xs text-gray-500 mb-4">
               Shows the net flow of weighted value in the last minute. Positive means heavyweights are seeing more buying interest.
             </p>
             
             {/* Center Zero Gauge */}
             <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden flex">
                 <div className="flex-1 flex justify-end border-r border-gray-700">
                    {momentumNet < 0 && (
                       <div 
                         className="h-full bg-red-500 opacity-80" 
                         style={{ width: `${Math.min(Math.abs(momentumNet) / 1000000, 100)}%` }} // Normalized visual
                       ></div>
                    )}
                 </div>
                 <div className="flex-1 flex justify-start">
                    {momentumNet > 0 && (
                       <div 
                         className="h-full bg-green-500 opacity-80"
                         style={{ width: `${Math.min(Math.abs(momentumNet) / 1000000, 100)}%` }} // Normalized visual
                       ></div>
                    )}
                 </div>
             </div>
       </div>

       {/* Row 3: Index Impact Lists */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          
          {/* Top Lifters */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
             <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" />
                <div>
                   <h3 className="font-bold text-gray-200">Top Index Lifters</h3>
                   <p className="text-[10px] text-gray-500">Highest Weighted Contribution</p>
                </div>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-800">
                      {topLifters.map(stock => (
                         <tr key={stock.symbol} className="hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-gray-300">
                               {stock.short_name}
                               <span className="ml-2 text-[10px] text-gray-500 bg-gray-800 px-1 rounded">
                                  {stock.weight}%
                               </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-green-500">
                               +{stock.chp.toFixed(2)}%
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-blue-300 font-bold">
                               {(stock.index_contribution || 0).toFixed(2)} pts
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Top Draggers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
             <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
                <TrendingDown size={18} className="text-red-500" />
                <div>
                   <h3 className="font-bold text-gray-200">Top Index Draggers</h3>
                   <p className="text-[10px] text-gray-500">Lowest Weighted Contribution</p>
                </div>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-800">
                      {topDraggers.map(stock => (
                         <tr key={stock.symbol} className="hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-gray-300">
                               {stock.short_name}
                               <span className="ml-2 text-[10px] text-gray-500 bg-gray-800 px-1 rounded">
                                  {stock.weight}%
                               </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-red-500">
                               {stock.chp.toFixed(2)}%
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-orange-400 font-bold">
                               {(stock.index_contribution || 0).toFixed(2)} pts
                            </td>
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
