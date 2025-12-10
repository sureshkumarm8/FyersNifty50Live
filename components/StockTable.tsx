import React from 'react';
import { EnrichedFyersQuote, SortConfig, SortField } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StockTableProps {
  data: EnrichedFyersQuote[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  onSelect: (symbol: string) => void;
  isLoading: boolean;
}

const formatNumber = (num: number | undefined, decimals: number = 2) => {
  if (num === undefined || num === null) return '--';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
    { label: 'Symbol', field: 'symbol', align: 'left', width: 'w-48' },
    { label: 'LTP', field: 'lp', align: 'right' },
    { label: 'Chg', field: null, align: 'right' },
    { label: 'Chg%', field: 'chp', align: 'right' },
    { label: 'Total Bid Qty', field: 'total_buy_qty', align: 'right' },
    { label: 'Bid Chg (1m)', field: null, align: 'right' },
    { label: 'Total Ask Qty', field: 'total_sell_qty', align: 'right' },
    { label: 'Ask Chg %', field: null, align: 'right' },
    { label: 'Time', field: 'tt', align: 'right' },
  ];

  if (isLoading && data.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
     return (
        <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400 space-y-4 border border-dashed border-gray-700 rounded-lg bg-gray-900/50 mt-4">
           <p className="text-lg">No data available.</p>
        </div>
     )
  }

  return (
    <div className="overflow-x-auto w-full bg-gray-900 border border-gray-800 rounded-xl shadow-xl">
      <table className="w-full text-sm whitespace-nowrap">
        <thead className="bg-gray-950 text-gray-400 border-b border-gray-800 sticky top-0 z-10">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className={`px-4 py-4 font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-${header.align} ${header.width || ''}`}
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
        <tbody className="divide-y divide-gray-800/50">
          {data.map((stock) => {
            const isPositive = stock.ch >= 0;
            const TextColor = isPositive ? 'text-green-500' : 'text-red-500';
            const BgHover = 'hover:bg-gray-800/50 cursor-pointer';

            return (
              <tr 
                key={stock.symbol} 
                className={`${BgHover} transition-colors`}
                onClick={() => onSelect(stock.symbol)}
              >
                <td className="px-4 py-3 font-semibold text-white">
                  {stock.short_name || stock.symbol}
                  <span className="block text-xs text-gray-500 font-normal mt-0.5">{stock.exchange}</span>
                </td>
                
                <td className={`px-4 py-3 text-right font-mono text-base ${TextColor}`}>
                   {formatNumber(stock.lp)}
                </td>

                <td className={`px-4 py-3 text-right font-mono ${TextColor}`}>
                   {formatNumber(Math.abs(stock.ch))}
                </td>

                <td className={`px-4 py-3 text-right font-mono font-medium ${TextColor}`}>
                   {formatNumber(Math.abs(stock.chp))}%
                </td>

                {/* Total Bid Qty */}
                <td className="px-4 py-3 text-right text-blue-300 font-mono">
                  {formatQty(stock.total_buy_qty)}
                </td>

                {/* Bid Qty Change 1m */}
                <td className={`px-4 py-3 text-right font-mono ${stock.bid_qty_chg_1m && stock.bid_qty_chg_1m >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.bid_qty_chg_1m ? (stock.bid_qty_chg_1m > 0 ? '+' : '') + formatQty(stock.bid_qty_chg_1m) : '-'}
                </td>

                {/* Total Ask Qty */}
                <td className="px-4 py-3 text-right text-red-300 font-mono">
                  {formatQty(stock.total_sell_qty)}
                </td>

                {/* Ask Qty % Change */}
                <td className={`px-4 py-3 text-right font-mono ${stock.ask_qty_chg_p && stock.ask_qty_chg_p >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                   {stock.ask_qty_chg_p ? (stock.ask_qty_chg_p > 0 ? '+' : '') + formatNumber(stock.ask_qty_chg_p) + '%' : '-'}
                </td>

                <td className="px-4 py-3 text-right text-gray-500 font-mono text-xs">
                  {formatTime(stock.tt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
