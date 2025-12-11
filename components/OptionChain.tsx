import React, { useMemo } from 'react';
import { SortConfig, SortField, EnrichedFyersQuote } from '../types';
import { StockTable } from './StockTable';

interface OptionChainProps {
  quotes: EnrichedFyersQuote[];
  niftyLtp: number | null;
  lastUpdated: Date | null;
  isLoading: boolean;
}

export const OptionChain: React.FC<OptionChainProps> = ({ quotes, niftyLtp, lastUpdated, isLoading }) => {
  
  // Sort State
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    field: 'symbol',
    direction: 'asc',
  });

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // --- Sorting & Filtering Logic (Client Side) ---
  const sortedQuotes = useMemo(() => {
    const data = [...quotes];
    
    data.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
         return sortConfig.direction === 'asc' 
           ? aValue.localeCompare(bValue) 
           : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }
      return 0;
    });

    return data;
  }, [quotes, sortConfig]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Header Stats (Fixed) */}
      <div className="flex-none mb-4 bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
         <div>
            <h2 className="text-gray-400 text-sm font-semibold uppercase">NIFTY 50 Spot</h2>
            <div className="flex items-baseline gap-3 mt-1">
               <span className="text-3xl font-bold text-white">{niftyLtp?.toLocaleString('en-IN') || '--'}</span>
               {lastUpdated && (
                 <span className="text-xs text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                 </span>
               )}
            </div>
            <p className="text-xs text-blue-400 mt-1">Expiry: Upcoming Tuesday</p>
         </div>
         
         <div className="flex items-center gap-4">
            {/* Action buttons if needed */}
         </div>
      </div>

      {/* Table (Scrolling) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <StockTable 
          data={sortedQuotes}
          sortConfig={sortConfig}
          onSort={handleSort}
          onSelect={() => {}} 
          isLoading={isLoading && quotes.length === 0}
        />
      </div>
    </div>
  );
};