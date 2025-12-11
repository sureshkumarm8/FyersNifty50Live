import React, { useMemo } from 'react';
import { EnrichedFyersQuote, SortConfig, SortField } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';

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

const formatPercent = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) return <span className="text-slate-600">--</span>;
    const isPos = num > 0;
    const isNeg = num < 0;
    const colorClass = isPos ? 'text-bull text-glow-green' : isNeg ? 'text-bear text-glow-red' : 'text-slate-400';
    return <span className={`font-mono font-bold ${colorClass}`}>{isPos ? '+' : ''}{num.toFixed(2)}%</span>;
};

const formatQty = (qty: number | undefined) => {
   if (qty === undefined || qty === null) return '--';
   return <span className="text-slate-300 tracking-tight">{qty.toLocaleString('en-IN')}</span>;
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

  const headers: { label: string; field: SortField | null; align: 'left' | 'right'; width?: string; highlight?: boolean; responsive?: string }[] = [
    { label: 'Symbol', field: 'symbol', align: 'left', width: 'w-32 sm:w-48' },
    { label: 'LTP', field: 'lp', align: 'right' },
    { label: '1m %', field: 'lp_chg_1m_p', align: 'right', highlight: true },
    { label: 'Sess %', field: 'lp_chg_day_p', align: 'right', responsive: 'hidden md:table-cell' },
    { label: 'Day %', field: 'chp', align: 'right', responsive: 'hidden sm:table-cell' },
    
    { label: 'Total Bid', field: 'total_buy_qty', align: 'right', responsive: 'hidden lg:table-cell' },
    { label: 'Bid 1m%', field: 'bid_qty_chg_p', align: 'right', highlight: true, responsive: 'hidden md:table-cell' },
    { label: 'Bid Day%', field: 'bid_chg_day_p', align: 'right', responsive: 'hidden lg:table-cell' }, 
    
    { label: 'Total Ask', field: 'total_sell_qty', align: 'right', responsive: 'hidden lg:table-cell' },
    { label: 'Ask 1m%', field: 'ask_qty_chg_p', align: 'right', highlight: true, responsive: 'hidden md:table-cell' },
    { label: 'Ask Day%', field: 'ask_chg_day_p', align: 'right', responsive: 'hidden lg:table-cell' }, 
    
    { label: '1m Net%', field: 'net_strength_1m', align: 'right', highlight: true }, 
    { label: 'Day Net%', field: 'day_net_strength', align: 'right', responsive: 'hidden sm:table-cell' }, 

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
           total_weight: acc.total_weight + w,
        };
     }, { total_buy_qty: 0, total_sell_qty: 0, bid_qty_chg_1m_abs: 0, ask_qty_chg_1m_abs: 0, initial_buy_qty: 0, initial_sell_qty: 0, weighted_lp_1m: 0, weighted_lp_day: 0, total_weight: 0 });
  }, [data]);

  const prevTotalBid1m = totals ? totals.total_buy_qty - totals.bid_qty_chg_1m_abs : 0;
  const totalBidChg1mP = prevTotalBid1m > 0 ? (totals!.bid_qty_chg_1m_abs / prevTotalBid1m) * 100 : 0;
  const prevTotalAsk1m = totals ? totals.total_sell_qty - totals.ask_qty_chg_1m_abs : 0;
  const totalAskChg1mP = prevTotalAsk1m > 0 ? (totals!.ask_qty_chg_1m_abs / prevTotalAsk1m) * 100 : 0;
  const totalNet1mP = totalBidChg1mP - totalAskChg1mP;
  const totalBidChgDayP = totals && totals.initial_buy_qty > 0 ? ((totals.total_buy_qty - totals.initial_buy_qty) / totals.initial_buy_qty) * 100 : 0;
  const totalAskChgDayP = totals && totals.initial_sell_qty > 0 ? ((totals.total_sell_qty - totals.initial_sell_qty) / totals.initial_sell_qty) * 100 : 0;
  const totalNetDayP = totalBidChgDayP - totalAskChgDayP;
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
           <p className="font-mono uppercase tracking-widest">System Offline / No Data</p>
        </div>
     );
  }

  return (
    <div className="w-full glass-panel rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-xs sm:text-sm border-collapse whitespace-nowrap">
          <thead className="glass-header text-slate-400 sticky top-0 z-20 uppercase text-[10px] font-bold tracking-widest">
            {totals && (
               <tr className="bg-slate-900/80 backdrop-blur text-slate-200 border-b border-white/10 shadow-lg">
                 <td className="px-4 py-4 text-left text-blue-400 font-bold border-r border-white/5 bg-blue-900/10 sticky left-0 z-10 backdrop-blur-md">MARKET AGGREGATE</td>
                 <td className="px-4 py-4 text-right"></td>
                 <td className="px-4 py-4 text-right bg-white/5 border-l border-white/5 border-r border-white/5">{formatPercent(weightedLp1m)}</td>
                 <td className="px-4 py-4 text-right bg-white/5 hidden md:table-cell">{formatPercent(weightedLpDay)}</td>
                 <td className="px-4 py-4 text-right hidden sm:table-cell"></td>
                 
                 <td className="px-4 py-4 text-right border-l border-white/5 hidden lg:table-cell">{formatQty(totals.total_buy_qty)}</td>
                 <td className="px-4 py-4 text-right bg-bull/5 border-l border-white/5 hidden md:table-cell">{formatPercent(totalBidChg1mP)}</td>
                 <td className="px-4 py-4 text-right bg-bull/5 hidden lg:table-cell">{formatPercent(totalBidChgDayP)}</td>
                 
                 <td className="px-4 py-4 text-right border-l border-white/5 hidden lg:table-cell">{formatQty(totals.total_sell_qty)}</td>
                 <td className="px-4 py-4 text-right bg-bear/5 border-l border-white/5 hidden md:table-cell">{formatPercent(totalAskChg1mP)}</td>
                 <td className="px-4 py-4 text-right bg-bear/5 hidden lg:table-cell">{formatPercent(totalAskChgDayP)}</td>
                 
                 <td className="px-4 py-4 text-right border-l border-white/5 bg-slate-800/50">{formatPercent(totalNet1mP)}</td>
                 <td className="px-4 py-4 text-right bg-slate-800/50 hidden sm:table-cell">{formatPercent(totalNetDayP)}</td>
                 <td className="px-4 py-4 text-right hidden md:table-cell"></td>
               </tr>
            )}
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${header.align === 'right' ? 'text-right' : 'text-left'} ${header.width || ''} ${header.highlight ? 'bg-white/5 text-blue-200' : ''} ${header.field === 'symbol' ? 'sticky left-0 bg-slate-900/90 z-10 backdrop-blur' : ''} ${header.responsive || ''}`}
                  onClick={() => header.field && onSort(header.field)}
                >
                  <div className={`flex items-center gap-1 ${header.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {header.label}
                    {header.field && getSortIcon(header.field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-slate-900/20">
            {data.map((stock) => (
              <tr 
                key={stock.symbol} 
                className="hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                onClick={() => onSelect(stock.symbol)}
              >
                <td className="px-4 py-3 font-semibold text-slate-200 group-hover:text-blue-400 transition-colors border-r border-white/5 bg-slate-900/30 sticky left-0 z-10 backdrop-blur-sm">
                  {stock.short_name || stock.symbol}
                  <span className="block text-[9px] text-slate-500 font-normal uppercase tracking-wider">{stock.exchange}</span>
                </td>
                
                <td className="px-4 py-3 text-right font-mono text-slate-300 group-hover:text-white">
                  {formatNumber(stock.lp)}
                </td>
                
                <td className="px-4 py-3 text-right font-mono bg-white/5 border-l border-white/5 border-r border-white/5">
                  {formatPercent(stock.lp_chg_1m_p)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-white/5 border-r border-white/5 hidden md:table-cell">
                  {formatPercent(stock.lp_chg_day_p)}
                </td>

                <td className="px-4 py-3 text-right font-mono font-medium hidden sm:table-cell">
                  {formatPercent(stock.chp)}
                </td>

                <td className="px-4 py-3 text-right font-mono text-bull-light border-l border-white/5 opacity-80 hidden lg:table-cell">
                  {formatQty(stock.total_buy_qty)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-bull/5 border-l border-white/5 hidden md:table-cell">
                  {formatPercent(stock.bid_qty_chg_p)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-bull/5 hidden lg:table-cell">
                  {formatPercent(stock.bid_chg_day_p)}
                </td>

                <td className="px-4 py-3 text-right font-mono text-bear-light border-l border-white/5 opacity-80 hidden lg:table-cell">
                  {formatQty(stock.total_sell_qty)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-bear/5 border-l border-white/5 hidden md:table-cell">
                  {formatPercent(stock.ask_qty_chg_p)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-bear/5 hidden lg:table-cell">
                  {formatPercent(stock.ask_chg_day_p)}
                </td>

                <td className="px-4 py-3 text-right font-mono border-l border-white/10 bg-slate-800/40 font-bold border-r border-white/10">
                  {formatPercent(stock.net_strength_1m)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-slate-800/40 text-slate-300 hidden sm:table-cell">
                  {formatPercent(stock.day_net_strength)}
                </td>

                <td className="px-4 py-3 text-right font-mono text-slate-600 text-[10px] hidden md:table-cell">
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