import React from 'react';
import { FyersQuote, SortConfig, SortField } from '../types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StockTableProps {
  data: FyersQuote[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  isLoading: boolean;
}

const formatNumber = (num: number, decimals: number = 2) => {
  if (typeof num !== 'number') return '--';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatVolume = (vol: number) => {
  if (!vol) return '--';
  if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)}Cr`;
  if (vol >= 100000) return `${(vol / 100000).toFixed(2)}L`;
  return vol.toLocaleString('en-IN');
};

const formatTime = (timestamp: number | string) => {
  if (!timestamp) return '--:--';
  const ts = Number(timestamp);
  if (isNaN(ts)) return '--:--';

  // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
  const date = new Date(ts > 10000000000 ? ts : ts * 1000);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const StockTable: React.FC<StockTableProps> = ({ data, sortConfig, onSort, isLoading }) => {
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <div className="w-4 h-4" />; // Placeholder
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const headers: { label: string; field: SortField | null; align: 'left' | 'right'; width?: string }[] = [
    { label: 'Symbol', field: 'symbol', align: 'left', width: 'w-48' },
    { label: 'LTP', field: 'lp', align: 'right' },
    { label: 'Chg', field: null, align: 'right' },
    { label: 'Chg%', field: 'chp', align: 'right' },
    { label: 'Bid', field: 'bid', align: 'right' },
    { label: 'Ask', field: 'ask', align: 'right' },
    { label: 'Open', field: 'open_price', align: 'right' },
    { label: 'High', field: 'high_price', align: 'right' },
    { label: 'Low', field: 'low_price', align: 'right' },
    { label: 'Prev. Cl', field: 'prev_close_price', align: 'right' },
    { label: 'Volume', field: 'volume', align: 'right' },
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
           <p className="text-sm">Check your settings or connection.</p>
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
            const BgHover = 'hover:bg-gray-800/50';

            return (
              <tr key={stock.symbol} className={`${BgHover} transition-colors`}>
                <td className="px-4 py-3 font-semibold text-white">
                  {stock.short_name || stock.symbol}
                  <span className="block text-xs text-gray-500 font-normal mt-0.5">{stock.exchange}</span>
                </td>
                
                <td className={`px-4 py-3 text-right font-mono text-base ${TextColor}`}>
                   {formatNumber(stock.lp)}
                </td>

                <td className={`px-4 py-3 text-right font-mono ${TextColor}`}>
                   <div className="flex items-center justify-end gap-1">
                      {stock.ch > 0 ? <ArrowUp size={12}/> : stock.ch < 0 ? <ArrowDown size={12}/> : <Minus size={12} />}
                      {formatNumber(Math.abs(stock.ch))}
                   </div>
                </td>

                <td className={`px-4 py-3 text-right font-mono font-medium ${TextColor}`}>
                   {formatNumber(Math.abs(stock.chp))}%
                </td>

                <td className="px-4 py-3 text-right text-gray-300 font-mono">
                  {formatNumber(stock.bid)}
                </td>

                <td className="px-4 py-3 text-right text-gray-300 font-mono">
                  {formatNumber(stock.ask)}
                </td>

                <td className="px-4 py-3 text-right text-gray-400 font-mono">
                  {formatNumber(stock.open_price)}
                </td>

                <td className="px-4 py-3 text-right text-gray-400 font-mono">
                  {formatNumber(stock.high_price)}
                </td>

                <td className="px-4 py-3 text-right text-gray-400 font-mono">
                  {formatNumber(stock.low_price)}
                </td>

                <td className="px-4 py-3 text-right text-gray-500 font-mono">
                  {formatNumber(stock.prev_close_price)}
                </td>

                <td className="px-4 py-3 text-right text-gray-300 font-mono">
                  {formatVolume(stock.volume)}
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