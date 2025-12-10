import React, { useMemo } from 'react';
import { EnrichedFyersQuote } from '../types';
import { TrendingUp, TrendingDown, Activity, Scale, ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react';

interface CumulativeViewProps {
  data: EnrichedFyersQuote[];
}

const formatQty = (qty: number) => {
    if (qty >= 10000000) return `${(qty / 10000000).toFixed(2)} Cr`;
    if (qty >= 100000) return `${(qty / 100000).toFixed(2)} L`;
    return qty.toLocaleString('en-IN');
};

const formatPercent = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const CumulativeView: React.FC<CumulativeViewProps> = ({ data }) => {
  
  // --- Aggregation Logic ---
  const stats = useMemo(() => {
    const initialStats = {
      totalBuyQty: 0,
      totalSellQty: 0,
      initialBuyQty: 0,
      initialSellQty: 0,
      bidChg1mAbs: 0,
      askChg1mAbs: 0,
      advances: 0,
      declines: 0,
      neutral: 0,
    };

    if (data.length === 0) return initialStats;

    return data.reduce((acc, curr) => {
       const buy = curr.total_buy_qty || 0;
       const sell = curr.total_sell_qty || 0;
       
       acc.totalBuyQty += buy;
       acc.totalSellQty += sell;
       
       acc.initialBuyQty += (curr.initial_total_buy_qty || 0);
       acc.initialSellQty += (curr.initial_total_sell_qty || 0);

       acc.bidChg1mAbs += (curr.bid_qty_chg_1m || 0);
       acc.askChg1mAbs += (curr.ask_qty_chg_1m || 0);

       if (curr.ch > 0) acc.advances++;
       else if (curr.ch < 0) acc.declines++;
       else acc.neutral++;

       return acc;
    }, initialStats);
  }, [data]);

  // --- Derived Metrics ---

  // 1. Market Sentiment (Buy vs Sell Ratio)
  const totalVolume = stats.totalBuyQty + stats.totalSellQty;
  const buyRatio = totalVolume > 0 ? (stats.totalBuyQty / totalVolume) * 100 : 50;
  const sellRatio = 100 - buyRatio;
  
  // 2. Day Weighted Changes
  const dayBidChgP = stats.initialBuyQty > 0 
    ? ((stats.totalBuyQty - stats.initialBuyQty) / stats.initialBuyQty) * 100 
    : 0;
  const dayAskChgP = stats.initialSellQty > 0 
    ? ((stats.totalSellQty - stats.initialSellQty) / stats.initialSellQty) * 100 
    : 0;
  const dayNetStrength = dayBidChgP - dayAskChgP;

  // 3. 1 Minute Weighted Changes
  // Prev = Current - Change
  const prevBuy1m = stats.totalBuyQty - stats.bidChg1mAbs;
  const prevSell1m = stats.totalSellQty - stats.askChg1mAbs;

  const minBidChgP = prevBuy1m > 0 ? (stats.bidChg1mAbs / prevBuy1m) * 100 : 0;
  const minAskChgP = prevSell1m > 0 ? (stats.askChg1mAbs / prevSell1m) * 100 : 0;
  const minNetStrength = minBidChgP - minAskChgP;

  // 4. Top Movers
  const gainers = [...data].sort((a, b) => b.chp - a.chp).slice(0, 5);
  const losers = [...data].sort((a, b) => a.chp - b.chp).slice(0, 5);


  return (
    <div className="flex flex-col gap-6 p-2 sm:p-4 max-w-7xl mx-auto w-full">
       
       {/* Row 1: Market Breadth & Sentiment */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Market Breadth */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 size={16} /> Market Breadth
             </h3>
             <div className="flex items-center justify-between mt-2">
                <div className="text-center">
                   <p className="text-3xl font-bold text-green-500">{stats.advances}</p>
                   <p className="text-xs text-gray-500 mt-1">Advances</p>
                </div>
                <div className="text-center">
                   <p className="text-3xl font-bold text-gray-400">{stats.neutral}</p>
                   <p className="text-xs text-gray-500 mt-1">Neutral</p>
                </div>
                <div className="text-center">
                   <p className="text-3xl font-bold text-red-500">{stats.declines}</p>
                   <p className="text-xs text-gray-500 mt-1">Declines</p>
                </div>
             </div>
             {/* Simple Bar */}
             <div className="flex h-2 w-full mt-6 rounded-full overflow-hidden bg-gray-800">
                <div className="bg-green-500" style={{ width: `${(stats.advances / data.length) * 100}%` }}></div>
                <div className="bg-gray-600" style={{ width: `${(stats.neutral / data.length) * 100}%` }}></div>
                <div className="bg-red-500" style={{ width: `${(stats.declines / data.length) * 100}%` }}></div>
             </div>
          </div>

          {/* Buying Pressure */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowUpRight size={80} className="text-blue-500" />
             </div>
             <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Total Buy Quantity</h3>
             <p className="text-3xl font-mono font-bold text-white mt-2">{formatQty(stats.totalBuyQty)}</p>
             
             <div className="mt-4 flex items-center gap-4">
                <div>
                   <p className="text-[10px] text-gray-500 uppercase">Day Change</p>
                   <p className={`font-mono text-sm font-medium ${dayBidChgP >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(dayBidChgP)}
                   </p>
                </div>
                <div className="h-6 w-[1px] bg-gray-800"></div>
                <div>
                   <p className="text-[10px] text-gray-500 uppercase">1m Change</p>
                   <p className={`font-mono text-sm font-medium ${minBidChgP >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(minBidChgP)}
                   </p>
                </div>
             </div>
          </div>

          {/* Selling Pressure */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowDownRight size={80} className="text-red-500" />
             </div>
             <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Total Sell Quantity</h3>
             <p className="text-3xl font-mono font-bold text-white mt-2">{formatQty(stats.totalSellQty)}</p>
             
             <div className="mt-4 flex items-center gap-4">
                <div>
                   <p className="text-[10px] text-gray-500 uppercase">Day Change</p>
                   <p className={`font-mono text-sm font-medium ${dayAskChgP >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatPercent(dayAskChgP)}
                   </p>
                </div>
                <div className="h-6 w-[1px] bg-gray-800"></div>
                <div>
                   <p className="text-[10px] text-gray-500 uppercase">1m Change</p>
                   <p className={`font-mono text-sm font-medium ${minAskChgP >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatPercent(minAskChgP)}
                   </p>
                </div>
             </div>
          </div>

       </div>

       {/* Row 2: Net Strength Gauges */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Day Net Strength */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2">
                   <Activity size={18} className="text-purple-400" /> 
                   Net Strength (Day)
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${dayNetStrength > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                   {formatPercent(dayNetStrength)}
                </span>
             </div>
             
             {/* Comparison Bar */}
             <div className="relative pt-6 pb-2">
                <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-800 relative">
                   {/* Center Line */}
                   <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10"></div>
                   
                   <div 
                      className="bg-blue-500 transition-all duration-500" 
                      style={{ width: `${buyRatio}%` }} 
                   />
                   <div 
                      className="bg-red-500 transition-all duration-500" 
                      style={{ width: `${sellRatio}%` }} 
                   />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 font-mono">
                   <span>Bids: {buyRatio.toFixed(1)}%</span>
                   <span>Asks: {sellRatio.toFixed(1)}%</span>
                </div>
             </div>
          </div>

          {/* 1m Net Strength */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2">
                   <Scale size={18} className="text-orange-400" /> 
                   Net Strength (1m)
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${minNetStrength > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                   {formatPercent(minNetStrength)}
                </span>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-gray-950 rounded p-3 text-center border border-gray-800">
                   <p className="text-xs text-gray-500">Bid Momentum</p>
                   <p className={`font-mono font-bold ${minBidChgP > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {formatPercent(minBidChgP)}
                   </p>
                </div>
                <div className="bg-950 rounded p-3 text-center border border-gray-800">
                   <p className="text-xs text-gray-500">Ask Momentum</p>
                   <p className={`font-mono font-bold ${minAskChgP > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {formatPercent(minAskChgP)}
                   </p>
                </div>
             </div>
          </div>
       </div>

       {/* Row 3: Top Movers Lists */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
          
          {/* Top Gainers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
             <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
                <TrendingUp size={18} className="text-green-500" />
                <h3 className="font-bold text-gray-200">Top Gainers</h3>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-800">
                      {gainers.map(stock => (
                         <tr key={stock.symbol} className="hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-gray-300">{stock.short_name}</td>
                            <td className="px-4 py-3 text-right font-mono text-white">{stock.lp.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono text-green-500 font-bold">+{stock.chp.toFixed(2)}%</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Top Losers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
             <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2">
                <TrendingDown size={18} className="text-red-500" />
                <h3 className="font-bold text-gray-200">Top Losers</h3>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                   <tbody className="divide-y divide-gray-800">
                      {losers.map(stock => (
                         <tr key={stock.symbol} className="hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-gray-300">{stock.short_name}</td>
                            <td className="px-4 py-3 text-right font-mono text-white">{stock.lp.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono text-red-500 font-bold">{stock.chp.toFixed(2)}%</td>
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
