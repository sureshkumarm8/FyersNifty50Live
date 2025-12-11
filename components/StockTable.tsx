
import React, { useMemo } from 'react';
import { EnrichedFyersQuote, SortConfig, SortField } from '../types';
import { ArrowUp, ArrowDown, BarChart2, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StockTableProps {
  data: EnrichedFyersQuote[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  onSelect: (symbol: string) => void;
  isLoading: boolean;
}

const formatNumber = (num: number | undefined, decimals: number = 2) => {
  if (num === undefined || num === null || isNaN(num)) return '--';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const PercentBadge = ({ val, highlight = false }: { val: number | undefined, highlight?: boolean }) => {
    if (val === undefined || val === null || isNaN(val)) return <span className="text-slate-600">--</span>;
    const isPos = val > 0;
    const isNeg = val < 0;
    
    // Base colors
    const bgClass = isPos ? 'bg-emerald-500/10' : isNeg ? 'bg-rose-500/10' : 'bg-slate-800/50';
    const textClass = isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-slate-400';
    const borderClass = isPos ? 'border-emerald-500/20' : isNeg ? 'border-rose-500/20' : 'border-transparent';
    
    // Highlight adds a glow/border for key metrics
    const glowClass = highlight 
        ? (isPos ? 'shadow-[0_0_10px_rgba(16,185,129,0.1)]' : isNeg ? 'shadow-[0_0_10px_rgba(244,63,94,0.1)]' : '') 
        : '';

    return (
        <div className={`inline-flex items-center justify-end px-2 py-1 rounded-md border ${bgClass} ${borderClass} ${glowClass} min-w-[60px]`}>
            <span className={`font-mono text-xs font-bold ${textClass}`}>
                {isPos ? '+' : ''}{val.toFixed(2)}%
            </span>
        </div>
    );
};

const formatQty = (qty: number | undefined) => {
   if (qty === undefined || qty === null) return '--';
   return <span className="text-slate-400 font-mono tracking-tight text-[11px]">{qty.toLocaleString('en-IN')}</span>;
};

const formatTime = (timestamp: number | string) => {
  if (!timestamp) return '--:--';
  const ts = Number(timestamp);
  if (isNaN(ts)) return '--:--';
  const date = new Date(ts > 10000000000 ? ts : ts * 1000);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const StockTable: React.FC<StockTableProps> = ({ data, sortConfig, onSort, onSelect, isLoading }) => {
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <div className="w-3 h-3 opacity-0" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-400" /> : <ArrowDown size={12} className="text-blue-400" />;
  };

  // Define Headers with precise styling
  const headers: { label: string; field: SortField | null; align: 'left' | 'right'; width?: string; highlight?: boolean; responsive?: string; icon?: React.ElementType }[] = [
    { label: 'Symbol', field: 'symbol', align: 'left', width: 'w-32 sm:w-48' },
    { label: 'LTP', field: 'lp', align: 'right' },
    { label: '1m %', field: 'lp_chg_1m_p', align: 'right', highlight: true },
    { label: 'Day %', field: 'lp_chg_day_p', align: 'right' },
    { label: 'Vol', field: 'volume', align: 'right', responsive: 'hidden md:table-cell', icon: BarChart2 },
    
    { label: 'Total Bid', field: 'total_buy_qty', align: 'right', responsive: 'hidden lg:table-cell' },
    { label: 'Bid 1m%', field: 'bid_qty_chg_p', align: 'right', responsive: 'hidden md:table-cell' },
    { label: 'Bid Day%', field: 'bid_chg_day_p', align: 'right', responsive: 'hidden lg:table-cell' }, 
    
    { label: 'Total Ask', field: 'total_sell_qty', align: 'right', responsive: 'hidden lg:table-cell' },
    { label: 'Ask 1m%', field: 'ask_qty_chg_p', align: 'right', responsive: 'hidden md:table-cell' },
    { label: 'Ask Day%', field: 'ask_chg_day_p', align: 'right', responsive: 'hidden lg:table-cell' }, 
    
    { label: '1m Net Str', field: 'net_strength_1m', align: 'right', highlight: true, icon: Activity }, 
    { label: 'Day Strength', field: 'day_net_strength', align: 'right' }, 

    { label: 'Time', field: 'tt', align: 'right', responsive: 'hidden md:table-cell' },
  ];

  const totals = useMemo(() => {
     if (data.length === 0) return null;
     return data.reduce((acc, curr) => {
        const w = curr.weight || 0.1;
        return {
           total_buy_qty: acc.total_buy_qty + (curr.total_buy_qty || 0),
           total_sell_qty: acc.total_sell_qty + (curr.total_sell_qty || 0),
           bid_qty_chg_1m_abs: acc.bid_qty_chg_1m_abs + (curr.bid_qty_chg_1m || 0),
           ask_qty_chg_1m_abs: acc.ask_qty_chg_1m_abs + (curr.ask_qty_chg_1m || 0),
           initial_buy_qty: acc.initial_buy_qty + (curr.initial_total_buy_qty || 0),
           initial_sell_qty: acc.initial_sell_qty + (curr.initial_total_sell_qty || 0),
           weighted_lp_1m: acc.weighted_lp_1m + ((curr.lp_chg_1m_p || 0) * w),
           weighted_lp_day: acc.weighted_lp_day + ((curr.lp_chg_day_p || 0) * w),
           weighted_net_strength: acc.weighted_net_strength + ((curr.day_net_strength || 0) * w),
           total_volume: acc.total_volume + (curr.volume || 0),
           total_weight: acc.total_weight + w,
        };
     }, { total_buy_qty: 0, total_sell_qty: 0, bid_qty_chg_1m_abs: 0, ask_qty_chg_1m_abs: 0, initial_buy_qty: 0, initial_sell_qty: 0, weighted_lp_1m: 0, weighted_lp_day: 0, weighted_net_strength: 0, total_volume: 0, total_weight: 0 });
  }, [data]);

  const prevTotalBid1m = totals ? totals.total_buy_qty - totals.bid_qty_chg_1m_abs : 0;
  const totalBidChg1mP = prevTotalBid1m > 0 ? (totals!.bid_qty_chg_1m_abs / prevTotalBid1m) * 100 : 0;
  const prevTotalAsk1m = totals ? totals.total_sell_qty - totals.ask_qty_chg_1m_abs : 0;
  const totalAskChg1mP = prevTotalAsk1m > 0 ? (totals!.ask_qty_chg_1m_abs / prevTotalAsk1m) * 100 : 0;
  const totalNet1mP = totalBidChg1mP - totalAskChg1mP;
  const totalBidChgDayP = totals && totals.initial_buy_qty > 0 ? ((totals.total_buy_qty - totals.initial_buy_qty) / totals.initial_buy_qty) * 100 : 0;
  const totalAskChgDayP = totals && totals.initial_sell_qty > 0 ? ((totals.total_sell_qty - totals.initial_sell_qty) / totals.initial_sell_qty) * 100 : 0;
  
  const weightedDayStr = totals && totals.total_weight > 0 ? totals.weighted_net_strength / totals.total_weight : 0;
  const weightedLp1m = totals && totals.total_weight > 0 ? totals.weighted_lp_1m / totals.total_weight : 0;
  const weightedLpDay = totals && totals.total_weight > 0 ? totals.weighted_lp_day / totals.total_weight : 0;

  if (isLoading && data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[300px]">
         <div className="relative">
             <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
             </div>
         </div>
      </div>
    );
  }

  if (data.length === 0) {
     return (
        <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 space-y-4 glass-panel rounded-xl">
           <Activity size={40} className="text-slate-700" />
           <p className="font-mono uppercase tracking-widest text-xs">Awaiting Data Feed...</p>
        </div>
     );
  }

  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative border border-slate-800">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-xs sm:text-sm border-collapse whitespace-nowrap">
          <thead className="glass-header text-slate-500 sticky top-0 z-20 uppercase text-[10px] font-bold tracking-wider">
            {totals && (
               <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md border-b border-blue-500/20 shadow-lg relative z-20">
                 <td className="px-4 py-3 text-left font-bold border-r border-white/5 sticky left-0 z-20 bg-slate-900/95 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        <span className="text-blue-200">MARKET AGGREGATE</span>
                    </div>
                 </td>
                 <td className="px-4 py-3 text-right"></td>
                 <td className="px-4 py-3 text-right"><PercentBadge val={weightedLp1m} /></td>
                 <td className="px-4 py-3 text-right"><PercentBadge val={weightedLpDay} /></td>
                 <td className="px-4 py-3 text-right hidden md:table-cell text-slate-300 font-mono">{formatQty(totals.total_volume)}</td>
                 
                 <td className="px-4 py-3 text-right border-l border-white/5 hidden lg:table-cell text-slate-400">{formatQty(totals.total_buy_qty)}</td>
                 <td className="px-4 py-3 text-right hidden md:table-cell"><PercentBadge val={totalBidChg1mP} /></td>
                 <td className="px-4 py-3 text-right hidden lg:table-cell"><PercentBadge val={totalBidChgDayP} /></td>
                 
                 <td className="px-4 py-3 text-right border-l border-white/5 hidden lg:table-cell text-slate-400">{formatQty(totals.total_sell_qty)}</td>
                 <td className="px-4 py-3 text-right hidden md:table-cell"><PercentBadge val={totalAskChg1mP} /></td>
                 <td className="px-4 py-3 text-right hidden lg:table-cell"><PercentBadge val={totalAskChgDayP} /></td>
                 
                 <td className="px-4 py-3 text-right border-l border-white/10 bg-slate-800/30"><PercentBadge val={totalNet1mP} highlight /></td>
                 <td className="px-4 py-3 text-right bg-slate-800/30"><PercentBadge val={weightedDayStr} highlight /></td>
                 <td className="px-4 py-3 text-right hidden md:table-cell"></td>
               </tr>
            )}
            <tr className="bg-slate-950/80">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 cursor-pointer hover:text-white transition-colors border-b border-white/5 ${header.align === 'right' ? 'text-right' : 'text-left'} ${header.width || ''} ${header.highlight ? 'bg-white/5 text-blue-200/80' : ''} ${header.field === 'symbol' ? 'sticky left-0 bg-slate-950 z-30' : ''} ${header.responsive || ''}`}
                  onClick={() => header.field && onSort(header.field)}
                >
                  <div className={`flex items-center gap-1 ${header.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {header.icon && <header.icon size={10} className="text-slate-600" />}
                    {header.label}
                    {header.field && getSortIcon(header.field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-slate-900/10">
            {data.map((stock) => (
              <tr 
                key={stock.symbol} 
                className="group hover:bg-slate-800/60 transition-all duration-200 cursor-pointer relative"
                onClick={() => onSelect(stock.symbol)}
              >
                {/* Active Indicator Bar moved inside the first cell for correct alignment */}
                <td className="px-4 py-3 font-semibold text-slate-200 group-hover:text-blue-300 transition-colors border-r border-white/5 bg-slate-900/80 sticky left-0 z-10 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex flex-col relative z-10 pl-1">
                      <span>{stock.short_name || stock.symbol}</span>
                      <span className="text-[9px] text-slate-600 font-mono font-normal uppercase tracking-widest group-hover:text-slate-500">{stock.exchange}</span>
                  </div>
                </td>
                
                <td className="px-4 py-3 text-right font-mono text-white text-sm font-bold tracking-tight">
                  {formatNumber(stock.lp)}
                </td>
                
                <td className="px-4 py-3 text-right border-l border-white/5 border-r border-white/5 bg-white/[0.02]">
                   <PercentBadge val={stock.lp_chg_1m_p} />
                </td>
                <td className="px-4 py-3 text-right border-r border-white/5">
                   <PercentBadge val={stock.lp_chg_day_p} />
                </td>

                <td className="px-4 py-3 text-right hidden md:table-cell opacity-80 group-hover:opacity-100 transition-opacity">
                  {formatQty(stock.volume)}
                </td>

                <td className="px-4 py-3 text-right border-l border-white/5 hidden lg:table-cell opacity-60">
                  {formatQty(stock.total_buy_qty)}
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                   <PercentBadge val={stock.bid_qty_chg_p} />
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                   <PercentBadge val={stock.bid_chg_day_p} />
                </td>

                <td className="px-4 py-3 text-right border-l border-white/5 hidden lg:table-cell opacity-60">
                  {formatQty(stock.total_sell_qty)}
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                   <PercentBadge val={stock.ask_qty_chg_p} />
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                   <PercentBadge val={stock.ask_chg_day_p} />
                </td>

                {/* Net Strength with Heatmap style border */}
                <td className={`px-4 py-3 text-right border-l border-white/10 border-r border-white/10 font-bold bg-slate-800/20`}>
                   <div className="flex justify-end">
                       <PercentBadge val={stock.net_strength_1m} highlight />
                   </div>
                </td>
                <td className="px-4 py-3 text-right bg-slate-800/20">
                    <div className="flex justify-end">
                        <PercentBadge val={stock.day_net_strength} />
                    </div>
                </td>

                <td className="px-4 py-3 text-right font-mono text-slate-600 text-[10px] hidden md:table-cell group-hover:text-slate-400">
                  {formatTime(stock.tt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
