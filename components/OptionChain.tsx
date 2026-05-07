
import React, { useMemo } from 'react';
import { SortConfig, SortField, EnrichedFyersQuote } from '../types';
import { StockTable } from './StockTable';
import { Target, Zap, Clock } from 'lucide-react';
import { getNextExpiryDate, getFormattedExpiryDate } from '../constants/niftyExpiryDates';

interface OptionChainProps {
  quotes: EnrichedFyersQuote[];
  niftyLtp: number | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  onSelect: (symbol: string) => void;
}

export const OptionChain: React.FC<OptionChainProps> = ({ quotes, niftyLtp, lastUpdated, isLoading, onSelect }) => {
  
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

  // Get next expiry date from static calendar
  const nextExpiry = useMemo(() => getNextExpiryDate(), []);
  
  // Check if we have no valid options data
  const hasNoData = quotes.length === 0 || quotes.every(q => q.lp === 0 && q.volume === 0);
  const hasValidData = quotes.length > 0 && quotes.some(q => q.lp > 0 || q.volume > 0);
  
  // Debug logging
  React.useEffect(() => {
    console.log(`[OptionChain] Received ${quotes.length} quotes, hasNoData: ${hasNoData}, hasValidData: ${hasValidData}`);
    if (quotes.length > 0) {
      console.log('[OptionChain] First 3 quotes:', quotes.slice(0, 3));
    }
  }, [quotes, hasNoData, hasValidData]);

  // --- Sorting & Filtering Logic (Client Side) ---
  const sortedQuotes = useMemo(() => {
    const data = [...quotes];
    
    console.log(`[OptionChain] Sorting ${data.length} quotes by ${sortConfig.field} ${sortConfig.direction}`);
    
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

    console.log(`[OptionChain] Sorted result: ${data.length} quotes`);
    return data;
  }, [quotes, sortConfig]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      
      {/* Warning Banner for Outdated Data */}
      {hasNoData && !isLoading && (
        <div className="flex-none mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-amber-500 mt-1 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-amber-400 font-bold mb-1">Option Contracts Outdated</h3>
              <p className="text-amber-200/80 text-sm mb-2">
                The option security IDs in your file are from an expired contract week.
                Download the latest CSV and regenerate.
              </p>
              <div className="text-xs text-amber-300/60 space-y-1 font-mono">
                <p>📥 Step 1: Download from PayTM Developer Console</p>
                <p>🔧 Step 2: <code className="bg-black/30 px-2 py-0.5 rounded">node scripts/generateWeeklyOptions.cjs</code></p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* HUD Header Stats (Fixed) */}
      <div className="flex-none mb-4">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-0 shadow-2xl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl"></div>

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Target className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">NIFTY 50 Spot</h2>
                            {lastUpdated && (
                                <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-400 border border-green-500/20">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                    </span>
                                    LIVE
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                                {niftyLtp?.toLocaleString('en-IN') || '--'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                                {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none flex flex-col items-end px-4 py-2 rounded-lg bg-slate-950/30 border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1 mb-1">
                            <Clock size={10} /> Expiry Date
                        </span>
                        <span className="text-sm font-bold text-blue-200">
                          {nextExpiry ? getFormattedExpiryDate(nextExpiry) : 'N/A'}
                        </span>
                        <span className="text-[9px] text-slate-600 mt-0.5">
                          {nextExpiry?.type}
                        </span>
                    </div>
                    <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
                    <div className="flex-1 sm:flex-none flex items-center gap-2 text-xs text-slate-400">
                        <Zap size={14} className="text-yellow-500" />
                        <span>ATM ± 20 Strikes</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Table (Scrolling) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-800 bg-slate-900/40">
        <StockTable 
          data={sortedQuotes}
          sortConfig={sortConfig}
          onSort={handleSort}
          onSelect={onSelect} 
          isLoading={isLoading && quotes.length === 0}
        />
      </div>
    </div>
  );
};
