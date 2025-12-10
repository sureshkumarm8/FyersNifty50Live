
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List, PieChart, BrainCircuit } from 'lucide-react';
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { OptionChain } from './components/OptionChain';
import { CumulativeView } from './components/CumulativeView';
import { SentimentHistory } from './components/SentimentHistory';
import { SettingsModal } from './components/SettingsModal';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote, MarketSnapshot } from './types';
import { fetchQuotes, getNiftyOptionSymbols } from './services/fyersService';
import { NIFTY50_SYMBOLS, REFRESH_INTERVAL_MS, NIFTY_WEIGHTAGE, NIFTY_INDEX_SYMBOL } from './constants';

type ViewMode = 'dashboard' | 'options' | 'cumulative' | 'analyzer';

const App: React.FC = () => {
  // --- State ---
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    const saved = localStorage.getItem('fyers_creds');
    return saved ? JSON.parse(saved) : { appId: '', accessToken: '' };
  });

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Data State
  const [stocks, setStocks] = useState<EnrichedFyersQuote[]>([]);
  const [optionQuotes, setOptionQuotes] = useState<EnrichedFyersQuote[]>([]);
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null);
  const [historyLog, setHistoryLog] = useState<MarketSnapshot[]>([]);

  // Selection & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'symbol', direction: 'asc' });

  // Refs for Tracking Changes
  const prevStocksRef = useRef<Record<string, FyersQuote>>({});
  const initialStocksRef = useRef<Record<string, FyersQuote>>({});
  const prevOptionsRef = useRef<Record<string, FyersQuote>>({});
  const initialOptionsRef = useRef<Record<string, FyersQuote>>({});

  // --- Helpers ---
  const saveCredentials = (newCreds: FyersCredentials) => {
    setCredentials(newCreds);
    localStorage.setItem('fyers_creds', JSON.stringify(newCreds));
    setError(null);
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // --- Data Enrichment Logic (Reuse for both stocks and options) ---
  const enrichData = (
      currentData: FyersQuote[], 
      prevRef: React.MutableRefObject<Record<string, FyersQuote>>, 
      initialRef: React.MutableRefObject<Record<string, FyersQuote>>,
      isStock: boolean
  ): EnrichedFyersQuote[] => {
      return currentData.map(curr => {
        const prev = prevRef.current[curr.symbol];
        
        if (!initialRef.current[curr.symbol]) {
           initialRef.current[curr.symbol] = curr;
        }
        const initial = initialRef.current[curr.symbol];

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
              if (prev.total_buy_qty !== 0) bid_qty_chg_p = (bid_qty_chg_1m / prev.total_buy_qty) * 100;
           }
           if (curr.total_sell_qty !== undefined && prev.total_sell_qty !== undefined) {
              ask_qty_chg_1m = curr.total_sell_qty - prev.total_sell_qty;
              if (prev.total_sell_qty !== 0) ask_qty_chg_p = (ask_qty_chg_1m / prev.total_sell_qty) * 100;
           }
           if (bid_qty_chg_p !== undefined && ask_qty_chg_p !== undefined) {
              net_strength_1m = bid_qty_chg_p - ask_qty_chg_p;
           }
        }

        // Day Calc
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
        
        // Stock Specific: Weight
        let weight, index_contribution;
        if (isStock) {
            const symbolKey = curr.short_name || curr.symbol.replace('NSE:', '').replace('-EQ', '');
            weight = NIFTY_WEIGHTAGE[symbolKey] || 0.1; 
            index_contribution = curr.chp * weight;
        }

        prevRef.current[curr.symbol] = curr;

        return {
          ...curr,
          bid_qty_chg_1m, bid_qty_chg_p,
          ask_qty_chg_1m, ask_qty_chg_p,
          net_strength_1m,
          initial_total_buy_qty: initial?.total_buy_qty,
          initial_total_sell_qty: initial?.total_sell_qty,
          bid_chg_day_p, ask_chg_day_p, day_net_strength,
          weight, index_contribution
        };
      });
  };

  // --- Snapshot Calculation ---
  const calculateSnapshot = (
      stocksData: EnrichedFyersQuote[], 
      optionsData: EnrichedFyersQuote[], 
      ltp: number,
      ptsChg: number
  ) => {
      // 1. Overall Sentiment (Weighted Breadth)
      let bullishW = 0, bearishW = 0, totalW = 0;
      let adv = 0, dec = 0;
      let totalStockBuy = 0, totalStockSell = 0;

      stocksData.forEach(s => {
          const w = s.weight || 0.1;
          if (s.ch >= 0) { bullishW += w; adv++; } else { bearishW += w; dec++; }
          totalW += w;
          totalStockBuy += s.total_buy_qty || 0;
          totalStockSell += s.total_sell_qty || 0;
      });
      const overallSent = totalW > 0 ? (bullishW - bearishW) / totalW * 100 : 0;
      
      // Stock Sentiment (Demand Ratio)
      const stockSent = totalStockSell > 0 ? ((totalStockBuy - totalStockSell) / totalStockSell) * 100 : 0;

      // 2. Options Data
      let callBuy = 0, callSell = 0, putBuy = 0, putSell = 0;
      let callOI = 0, putOI = 0;

      optionsData.forEach(o => {
          const isCE = o.symbol.endsWith('CE');
          if (isCE) {
              callBuy += o.total_buy_qty || 0;
              callSell += o.total_sell_qty || 0;
              callOI += o.oi || 0;
          } else {
              putBuy += o.total_buy_qty || 0;
              putSell += o.total_sell_qty || 0;
              putOI += o.oi || 0;
          }
      });

      // Call Sentiment (Net Demand %)
      const callSent = callSell > 0 ? ((callBuy - callSell) / callSell) * 100 : 0;
      
      // Put Sentiment (Net Demand %)
      const putSent = putSell > 0 ? ((putBuy - putSell) / putSell) * 100 : 0;

      // PCR (OI Based)
      const pcr = callOI > 0 ? putOI / callOI : 0;

      // Options Sentiment (Relative strength of Call Demand vs Put Demand)
      const optionsSent = callSent - putSent;

      const snapshot: MarketSnapshot = {
          time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          niftyLtp: ltp,
          ptsChg: ptsChg,
          overallSent,
          adv, dec,
          stockSent,
          callSent,
          putSent,
          pcr,
          optionsSent,
          callsBuyQty: callBuy,
          callsSellQty: callSell,
          putsBuyQty: putBuy,
          putsSellQty: putSell
      };

      setHistoryLog(prev => {
          const updated = [...prev, snapshot];
          if (updated.length > 60) updated.shift(); // Keep last 60 mins
          return updated;
      });
  };


  const refreshData = useCallback(async () => {
    if (!credentials.appId || !credentials.accessToken) {
       if(stocks.length === 0) setError("Please configure API credentials");
       return;
    }

    try {
      if (stocks.length === 0) setIsLoading(true);
      
      // 1. Fetch Stocks
      const rawStocks = await fetchQuotes(NIFTY50_SYMBOLS, credentials);
      const enrichedStocks = enrichData(rawStocks, prevStocksRef, initialStocksRef, true);
      setStocks(enrichedStocks);

      // 2. Fetch Index & Options
      // Fetch Index to get LTP
      const indexQuote = await fetchQuotes([NIFTY_INDEX_SYMBOL], credentials);
      const idx = indexQuote[0];
      if (idx) {
          setNiftyLtp(idx.lp);
          
          // Generate Option Symbols
          const optSymbols = getNiftyOptionSymbols(idx.lp);
          // Fetch Option Quotes
          const rawOptions = await fetchQuotes(optSymbols, credentials);
          const enrichedOptions = enrichData(rawOptions, prevOptionsRef, initialOptionsRef, false);
          setOptionQuotes(enrichedOptions);

          // 3. Take Snapshot
          calculateSnapshot(enrichedStocks, enrichedOptions, idx.lp, idx.ch);
      }

      setLastUpdated(Date.now());
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [credentials]); // Dependencies minimized to avoid loops


  // --- Effects ---
  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshData]);

  // --- Filtered Stocks for Dashboard ---
  const filteredAndSortedStocks = useMemo(() => {
    let data = [...stocks];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => s.symbol.toLowerCase().includes(q) || (s.short_name && s.short_name.toLowerCase().includes(q)));
    }
    data.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      if (aValue === undefined || bValue === undefined) return 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      if (typeof aValue === 'number' && typeof bValue === 'number') return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      return 0;
    });
    return data;
  }, [stocks, searchQuery, sortConfig]);

  return (
    <div className="h-screen bg-gray-950 flex flex-col text-gray-100 overflow-hidden">
      
      {/* Navbar (Fixed) */}
      <header className="flex-none bg-gray-900 border-b border-gray-800 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedStock(null)}>
               <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                 <Activity size={24} className="text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Nifty50 AI Agent</h1>
                 <h1 className="text-xl font-bold tracking-tight text-white sm:hidden">Nifty50</h1>
               </div>
             </div>

             {/* Navigation Tabs */}
             {!selectedStock && (
                <div className="flex bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
                   <button onClick={() => setViewMode('dashboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                      <List size={16} /> Stocks
                   </button>
                   <button onClick={() => setViewMode('cumulative')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'cumulative' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                      <PieChart size={16} /> Summary
                   </button>
                   <button onClick={() => setViewMode('options')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'options' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                      <BarChart3 size={16} /> Options
                   </button>
                   <button onClick={() => setViewMode('analyzer')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'analyzer' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                      <BrainCircuit size={16} /> AI Analyzer
                   </button>
                </div>
             )}
          </div>

          <div className="flex items-center gap-4">
             {!selectedStock && viewMode === 'dashboard' && (
               <div className="hidden md:flex items-center bg-gray-800 rounded-full px-4 py-1.5 border border-gray-700">
                  <Search size={16} className="text-gray-500 mr-2" />
                  <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-48 text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
             )}
            <div className="text-right hidden sm:block">
                 <p className="text-xs text-gray-500">Last Updated</p>
                 <p className="text-sm font-mono text-gray-300">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}</p>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {error && (
          <div className="flex-none px-4 pt-4">
            <div className="bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-lg flex items-center gap-4">
                 <AlertCircle size={18} className="text-red-500 shrink-0" />
                 <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {selectedStock ? (
           <div className="flex-1 p-4 overflow-hidden">
               <StockDetail symbol={selectedStock} credentials={credentials} onBack={() => setSelectedStock(null)} />
           </div>
        ) : viewMode === 'analyzer' ? (
           <div className="flex-1 p-4 overflow-hidden">
               <SentimentHistory history={historyLog} />
           </div>
        ) : viewMode === 'options' ? (
           <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <OptionChain quotes={optionQuotes} niftyLtp={niftyLtp} lastUpdated={lastUpdated ? new Date(lastUpdated) : null} isLoading={isLoading} />
           </div>
        ) : viewMode === 'cumulative' ? (
           <div className="flex-1 overflow-y-auto">
              <CumulativeView data={stocks} />
           </div>
        ) : (
           /* DASHBOARD */
           <>
             <div className="flex-none p-4 pb-0">
               {stocks.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                     {/* Existing Stats Cards */}
                     <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Trend</p>
                        <div className="flex items-end gap-2 mt-1">
                           <span className="text-2xl font-bold text-green-500">{stocks.filter(s => s.ch >= 0).length}</span>
                           <span className="text-gray-600">/</span>
                           <span className="text-2xl font-bold text-red-500">{stocks.filter(s => s.ch < 0).length}</span>
                        </div>
                     </div>
                     <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                           <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                           <p className="text-white mt-1 font-medium flex items-center gap-2">
                               <span className={`relative inline-flex rounded-full h-3 w-3 ${error ? 'bg-red-500' : 'bg-green-500'}`}></span>
                               {error ? 'Error' : 'Live'}
                           </p>
                        </div>
                        <button onClick={() => refreshData()} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors">
                           <RefreshCw size={18} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                     </div>
                  </div>
               )}
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
               <StockTable data={filteredAndSortedStocks} sortConfig={sortConfig} onSort={handleSort} onSelect={setSelectedStock} isLoading={isLoading} />
             </div>
           </>
        )}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onSave={saveCredentials} currentCreds={credentials} />
    </div>
  );
};

export default App;
