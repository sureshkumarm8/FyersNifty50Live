
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote } from '../types';
import { fetchQuotes, getNiftyOptionSymbols } from '../services/fyersService';
import { REFRESH_INTERVAL_MS } from '../constants';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { StockTable } from './StockTable';

interface OptionChainProps {
  credentials: FyersCredentials;
}

export const OptionChain: React.FC<OptionChainProps> = ({ credentials }) => {
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null);
  const [optionQuotes, setOptionQuotes] = useState<EnrichedFyersQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Sort State
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'symbol',
    direction: 'asc',
  });

  // Track previous data for 1min change calculations
  const prevOptionsRef = useRef<Record<string, FyersQuote>>({});
  
  // Track Initial data for Day Session calculation
  const initialOptionsRef = useRef<Record<string, FyersQuote>>({});

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const fetchChain = async () => {
    if (!credentials.appId || !credentials.accessToken) {
       setError("Missing Credentials");
       return;
    }

    try {
      if(!niftyLtp) setLoading(true);

      // 1. Fetch Nifty Spot Price First
      const indexSymbol = "NSE:NIFTY50-INDEX";
      const indexQuote = await fetchQuotes([indexSymbol], credentials);
      
      if (!indexQuote || indexQuote.length === 0) {
        throw new Error("Failed to fetch Nifty Index Data");
      }
      
      const ltp = indexQuote[0].lp;
      setNiftyLtp(ltp);

      // 2. Generate Symbols for Upcoming Expiry (Targeting Tuesday)
      const symbols = getNiftyOptionSymbols(ltp);

      // 3. Fetch Option Quotes
      const rawQuotes = await fetchQuotes(symbols, credentials);
      
      // 4. Enrich Quotes with 1min Changes & Day Changes
      const enriched: EnrichedFyersQuote[] = rawQuotes.map(curr => {
        const prev = prevOptionsRef.current[curr.symbol];
        
        // Initialize Initial Reference if not exists
        if (!initialOptionsRef.current[curr.symbol]) {
           initialOptionsRef.current[curr.symbol] = curr;
        }
        const initial = initialOptionsRef.current[curr.symbol];

        let bid_qty_chg_1m = undefined;
        let bid_qty_chg_p = undefined;
        let ask_qty_chg_1m = undefined;
        let ask_qty_chg_p = undefined;
        let net_strength_1m = undefined;

        let bid_chg_day_p = undefined;
        let ask_chg_day_p = undefined;
        let day_net_strength = undefined;

        // 1 Minute Calc
        if (prev) {
           if (curr.total_buy_qty !== undefined && prev.total_buy_qty !== undefined) {
              bid_qty_chg_1m = curr.total_buy_qty - prev.total_buy_qty;
              if (prev.total_buy_qty !== 0) {
                 bid_qty_chg_p = (bid_qty_chg_1m / prev.total_buy_qty) * 100;
              }
           }
           if (curr.total_sell_qty !== undefined && prev.total_sell_qty !== undefined) {
              ask_qty_chg_1m = curr.total_sell_qty - prev.total_sell_qty;
              if (prev.total_sell_qty !== 0) {
                 ask_qty_chg_p = (ask_qty_chg_1m / prev.total_sell_qty) * 100;
              }
           }
           if (bid_qty_chg_p !== undefined && ask_qty_chg_p !== undefined) {
              net_strength_1m = bid_qty_chg_p - ask_qty_chg_p;
           }
        }

        // Day Session Calc
        if (initial) {
            if (curr.total_buy_qty !== undefined && initial.total_buy_qty !== undefined && initial.total_buy_qty !== 0) {
                bid_chg_day_p = ((curr.total_buy_qty - initial.total_buy_qty) / initial.total_buy_qty) * 100;
            }
            if (curr.total_sell_qty !== undefined && initial.total_sell_qty !== undefined && initial.total_sell_qty !== 0) {
                ask_chg_day_p = ((curr.total_sell_qty - initial.total_sell_qty) / initial.total_sell_qty) * 100;
            }
            if (bid_chg_day_p !== undefined && ask_chg_day_p !== undefined) {
                day_net_strength = bid_chg_day_p - ask_chg_day_p;
            }
        }
        
        // Update Ref for next time
        prevOptionsRef.current[curr.symbol] = curr;

        return {
          ...curr,
          bid_qty_chg_1m,
          bid_qty_chg_p,
          ask_qty_chg_1m,
          ask_qty_chg_p,
          net_strength_1m,
          
          initial_total_buy_qty: initial?.total_buy_qty,
          initial_total_sell_qty: initial?.total_sell_qty,
          bid_chg_day_p,
          ask_chg_day_p,
          day_net_strength
        };
      });

      setOptionQuotes(enriched);
      setLastUpdated(new Date());
      setError(null);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load Option Chain");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChain();
    const interval = setInterval(fetchChain, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // --- Sorting & Filtering Logic (Client Side) ---
  const sortedQuotes = useMemo(() => {
    const data = [...optionQuotes];
    
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
  }, [optionQuotes, sortConfig]);

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
            {error && (
               <div className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
               </div>
            )}
            <button 
              onClick={fetchChain} 
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
            >
               <RefreshCw size={20} className={`text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
         </div>
      </div>

      {/* Table (Scrolling) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <StockTable 
          data={sortedQuotes}
          sortConfig={sortConfig}
          onSort={handleSort}
          onSelect={() => {}} 
          isLoading={loading && optionQuotes.length === 0}
        />
      </div>
    </div>
  );
};
