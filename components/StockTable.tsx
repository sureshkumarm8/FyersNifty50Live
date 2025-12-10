
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
    if (num === undefined || num === null || isNaN(num)) return '--';
    const colorClass = num > 0 ? 'text-green-500' : num < 0 ? 'text-red-500' : 'text-gray-400';
    return <span className={colorClass}>{num > 0 ? '+' : ''}{num.toFixed(2)}%</span>;
};

const formatQty = (qty: number | undefined) => {
   if (qty === undefined || qty === null) return '--';
   return qty.toLocaleString('en-IN');
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
    if (sortConfig.field !== field) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const headers: { label: string; field: SortField | null; align: 'left' | 'right'; width?: string }[] = [
    { label: 'Symbol', field: 'symbol', align: 'left', width: 'w-40' },
    { label: 'LTP', field: 'lp', align: 'right' },
    { label: 'Chg%', field: 'chp', align: 'right' },
    
    { label: 'Total Bid', field: 'total_buy_qty', align: 'right' },
    { label: 'Bid 1m%', field: 'bid_qty_chg_p', align: 'right' },
    { label: 'Bid Day%', field: 'bid_chg_day_p', align: 'right' }, // NEW
    
    { label: 'Total Ask', field: 'total_sell_qty', align: 'right' },
    { label: 'Ask 1m%', field: 'ask_qty_chg_p', align: 'right' },
    { label: 'Ask Day%', field: 'ask_chg_day_p', align: 'right' }, // NEW
    
    { label: '1m Net%', field: 'net_strength_1m', align: 'right' }, 
    { label: 'Day Net%', field: 'day_net_strength', align: 'right' }, // NEW

    { label: 'Time', field: 'tt', align: 'right' },
  ];

  // Calculate Cumulative Totals
  const totals = useMemo(() => {
     if (data.length === 0) return null;

     return data.reduce((acc, curr) => {
        return {
           total_buy_qty: acc.total_buy_qty + (curr.total_buy_qty || 0),
           total_sell_qty: acc.total_sell_qty + (curr.total_sell_qty || 0),
           
           // Sum absolute changes to calculate weighted %
           bid_qty_chg_1m_abs: acc.bid_qty_chg_1m_abs + (curr.bid_qty_chg_1m || 0),
           ask_qty_chg_1m_abs: acc.ask_qty_chg_1m_abs + (curr.ask_qty_chg_1m || 0),

           initial_buy_qty: acc.initial_buy_qty + (curr.initial_total_buy_qty || 0),
           initial_sell_qty: acc.initial_sell_qty + (curr.initial_total_sell_qty || 0),
        };
     }, { 
        total_buy_qty: 0, 
        total_sell_qty: 0, 
        bid_qty_chg_1m_abs: 0, 
        ask_qty_chg_1m_abs: 0,
        initial_buy_qty: 0,
        initial_sell_qty: 0
    });
  }, [data]);

  // Derived Weighted percentages for Totals Row
  
  // 1 Minute Metrics (Weighted)
  // Logic: Sum of (Current - Prev) / Sum of Prev * 100
  const prevTotalBid1m = totals ? totals.total_buy_qty - totals.bid_qty_chg_1m_abs : 0;
  const totalBidChg1mP = prevTotalBid1m > 0 
    ? (totals!.bid_qty_chg_1m_abs / prevTotalBid1m) * 100
    : 0;

  const prevTotalAsk1m = totals ? totals.total_sell_qty - totals.ask_qty_chg_1m_abs : 0;
  const totalAskChg1mP = prevTotalAsk1m > 0
     ? (totals!.ask_qty_chg_1m_abs / prevTotalAsk1m) * 100 
     : 0;

  const totalNet1mP = totalBidChg1mP - totalAskChg1mP;

  // Day Metrics (Weighted)
  const totalBidChgDayP = totals && totals.initial_buy_qty > 0
    ? ((totals.total_buy_qty - totals.initial_buy_qty) / totals.initial_buy_qty) * 100
    : 0;

  const totalAskChgDayP = totals && totals.initial_sell_qty > 0
    ? ((totals.total_sell_qty - totals.initial_sell_qty) / totals.initial_sell_qty) * 100
    : 0;

  const totalNetDayP = totalBidChgDayP - totalAskChgDayP;


  if (isLoading && data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
     return (
        <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400 space-y-4 border border-dashed border-gray-800 rounded-xl">
           <p>No data available</p>
        </div>
     );
  }

  return (
    <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="bg-gray-950 text-gray-400 sticky top-0 z-10 shadow-sm uppercase text-xs font-semibold tracking-wider">
            {/* Totals Row */}
            {totals && (
               <tr className="bg-gray-900/90 text-gray-200 font-bold border-b border-gray-800 backdrop-blur-sm">
                 <td className="px-4 py-3 text-left text-blue-400">TOTALS</td>
                 <td className="px-4 py-3 text-right">--</td>
                 <td className="px-4 py-3 text-right">--</td>
                 
                 <td className="px-4 py-3 text-right font-mono text-gray-300">{formatQty(totals.total_buy_qty)}</td>
                 <td className="px-4 py-3 text-right font-mono">{formatPercent(totalBidChg1mP)}</td>
                 <td className="px-4 py-3 text-right font-mono">{formatPercent(totalBidChgDayP)}</td>
                 
                 <td className="px-4 py-3 text-right font-mono text-gray-300">{formatQty(totals.total_sell_qty)}</td>
                 <td className="px-4 py-3 text-right font-mono">{formatPercent(totalAskChg1mP)}</td>
                 <td className="px-4 py-3 text-right font-mono">{formatPercent(totalAskChgDayP)}</td>
                 
                 <td className="px-4 py-3 text-right font-mono border-l border-gray-800 bg-gray-900/50">{formatPercent(totalNet1mP)}</td>
                 <td className="px-4 py-3 text-right font-mono bg-gray-900/50">{formatPercent(totalNetDayP)}</td>
                 
                 <td className="px-4 py-3 text-right">--</td>
               </tr>
            )}

            {/* Column Headers */}
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors ${header.align === 'right' ? 'text-right' : 'text-left'} ${header.width || ''} ${header.label.includes('Net') ? 'border-l border-gray-800 bg-gray-900/30' : ''}`}
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
          <tbody className="divide-y divide-gray-800">
            {data.map((stock) => (
              <tr 
                key={stock.symbol} 
                className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
                onClick={() => onSelect(stock.symbol)}
              >
                <td className="px-4 py-3 font-medium text-white group-hover:text-blue-400 transition-colors">
                  {stock.short_name || stock.symbol}
                  <span className="block text-[10px] text-gray-500 font-normal">{stock.exchange}</span>
                </td>
                
                <td className="px-4 py-3 text-right font-mono text-gray-300">
                  {formatNumber(stock.lp)}
                </td>
                
                <td className={`px-4 py-3 text-right font-mono font-medium ${stock.chp >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stock.chp > 0 ? '+' : ''}{formatNumber(stock.chp)}%
                </td>

                {/* BID SECTION */}
                <td className="px-4 py-3 text-right font-mono text-blue-200/80">
                  {formatQty(stock.total_buy_qty)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatPercent(stock.bid_qty_chg_p)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-blue-900/10">
                  {formatPercent(stock.bid_chg_day_p)}
                </td>

                {/* ASK SECTION */}
                <td className="px-4 py-3 text-right font-mono text-red-200/80">
                  {formatQty(stock.total_sell_qty)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatPercent(stock.ask_qty_chg_p)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-red-900/10">
                  {formatPercent(stock.ask_chg_day_p)}
                </td>

                {/* NET SECTION */}
                <td className="px-4 py-3 text-right font-mono border-l border-gray-800 bg-gray-900/30">
                  {formatPercent(stock.net_strength_1m)}
                </td>
                <td className="px-4 py-3 text-right font-mono bg-gray-900/30 font-semibold">
                  {formatPercent(stock.day_net_strength)}
                </td>

                <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">
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
