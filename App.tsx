import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List, PieChart } from 'lucide-react';
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { OptionChain } from './components/OptionChain';
import { CumulativeView } from './components/CumulativeView';
import { SettingsModal } from './components/SettingsModal';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote } from './types';
import { fetchQuotes } from './services/fyersService';
import { NIFTY50_SYMBOLS, REFRESH_INTERVAL_MS } from './constants';

type ViewMode = 'dashboard' | 'options' | 'cumulative';

const App: React.FC = () => {
  // --- State ---
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    const saved = localStorage.getItem('fyers_creds');
    return saved ? JSON.parse(saved) : { appId: '', accessToken: '' };
  });

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  const [stocks, setStocks] = useState<EnrichedFyersQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  
  // Store previous data to calculate 1min changes
  const prevStocksRef = useRef<Record<string, FyersQuote>>({});
  
  // Store INITIAL data for Day Session calculation
  const initialStocksRef = useRef<Record<string, FyersQuote>>({});

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'symbol',
    direction: 'asc',
  });

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

  const refreshData = useCallback(async () => {
    // Only refresh stocks if we are in dashboard OR cumulative view (both need stock data)
    if (viewMode === 'options') return;

    if (!credentials.appId || !credentials.accessToken) {
       if(stocks.length === 0) setError("Please configure API credentials in Settings");
       return;
    }

    try {
      if (stocks.length === 0) setIsLoading(true);
      
      const newQuotes = await fetchQuotes(NIFTY50_SYMBOLS, credentials);
      
      // Calculate changes based on previous data
      const enriched: EnrichedFyersQuote[] = newQuotes.map(curr => {
        const prev = prevStocksRef.current[curr.symbol];
        
        // Initialize Initial Reference if not exists (First data point of session)
        if (!initialStocksRef.current[curr.symbol]) {
           initialStocksRef.current[curr.symbol] = curr;
        }
        const initial = initialStocksRef.current[curr.symbol];

        let bid_qty_chg_1m = undefined;
        let bid_qty_chg_p = undefined;
        let ask_qty_chg_1m = undefined;
        let ask_qty_chg_p = undefined;
        let net_strength_1m = undefined;
        
        // Day Session Metrics
        let bid_chg_day_p = undefined;
        let ask_chg_day_p = undefined;
        let day_net_strength = undefined;

        // 1. Calculate 1 Minute Changes
        if (prev) {
           // BID
           if (curr.total_buy_qty !== undefined && prev.total_buy_qty !== undefined) {
              bid_qty_chg_1m = curr.total_buy_qty - prev.total_buy_qty;
              if (prev.total_buy_qty !== 0) {
                 bid_qty_chg_p = (bid_qty_chg_1m / prev.total_buy_qty) * 100;
              }
           }
           // ASK
           if (curr.total_sell_qty !== undefined && prev.total_sell_qty !== undefined) {
              ask_qty_chg_1m = curr.total_sell_qty - prev.total_sell_qty;
              if (prev.total_sell_qty !== 0) {
                 ask_qty_chg_p = (ask_qty_chg_1m / prev.total_sell_qty) * 100;
              }
           }
           // NET 1m
           if (bid_qty_chg_p !== undefined && ask_qty_chg_p !== undefined) {
              net_strength_1m = bid_qty_chg_p - ask_qty_chg_p;
           }
        }

        // 2. Calculate Day Session Changes (vs Initial)
        if (initial) {
            // BID Day %
            if (curr.total_buy_qty !== undefined && initial.total_buy_qty !== undefined && initial.total_buy_qty !== 0) {
                bid_chg_day_p = ((curr.total_buy_qty - initial.total_buy_qty) / initial.total_buy_qty) * 100;
            }
            // ASK Day %
            if (curr.total_sell_qty !== undefined && initial.total_sell_qty !== undefined && initial.total_sell_qty !== 0) {
                ask_chg_day_p = ((curr.total_sell_qty - initial.total_sell_qty) / initial.total_sell_qty) * 100;
            }
            // Net Day
            if (bid_chg_day_p !== undefined && ask_chg_day_p !== undefined) {
                day_net_strength = bid_chg_day_p - ask_chg_day_p;
            }
        }
        
        // Update Ref for next time
        prevStocksRef.current[curr.symbol] = curr;

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

      setStocks(enriched);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [credentials, viewMode]); 

  // --- Effects ---
  useEffect(() => {
    refreshData();
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshData]);

  // --- Derived State ---
  const filteredAndSortedStocks = useMemo(() => {
    let data = [...stocks];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        (s.short_name && s.short_name.toLowerCase().includes(q))
      );
    }

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
  }, [stocks, searchQuery, sortConfig]);

  // --- Render ---
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
                 <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Nifty50 Live</h1>
                 <h1 className="text-xl font-bold tracking-tight text-white sm:hidden">Nifty50</h1>
               </div>
             </div>

             {/* Navigation Tabs */}
             {!selectedStock && (
                <div className="flex bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
                   <button 
                      onClick={() => setViewMode('dashboard')}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                   >
                      <List size={16} />
                      Stocks
                   </button>
                   <button 
                      onClick={() => setViewMode('cumulative')}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'cumulative' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                   >
                      <PieChart size={16} />
                      Summary
                   </button>
                   <button 
                      onClick={() => setViewMode('options')}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${viewMode === 'options' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                   >
                      <BarChart3 size={16} />
                      Options
                   </button>
                </div>
             )}
          </div>

          <div className="flex items-center gap-4">
             {!selectedStock && viewMode === 'dashboard' && (
               <div className="hidden md:flex items-center bg-gray-800 rounded-full px-4 py-1.5 border border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <Search size={16} className="text-gray-500 mr-2" />
                  <input 
                     type="text" 
                     placeholder="Search..." 
                     className="bg-transparent border-none outline-none text-sm w-48 placeholder-gray-500 text-white"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
             )}

            {viewMode !== 'options' && (
               <div className="text-right hidden sm:block">
                 <p className="text-xs text-gray-500">Last Updated</p>
                 <p className="text-sm font-mono text-gray-300">
                   {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}
                 </p>
               </div>
            )}

            <div className="h-8 w-[1px] bg-gray-800 mx-2 hidden sm:block"></div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* Error Banner */}
        {error && (
          <div className="flex-none px-4 pt-4">
            <div className="bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                 <AlertCircle size={18} className="text-red-500 shrink-0" />
                 <span className="text-sm">{error}</span>
              </span>
            </div>
          </div>
        )}

        {/* --- VIEW ROUTER --- */}
        
        {/* 1. STOCK DETAIL VIEW (Full Height overlay) */}
        {selectedStock ? (
           <div className="flex-1 p-4 overflow-hidden">
               <StockDetail 
                  symbol={selectedStock} 
                  credentials={credentials} 
                  onBack={() => setSelectedStock(null)} 
               />
           </div>
        ) : viewMode === 'options' ? (
           
           /* 2. OPTION CHAIN VIEW */
           <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <OptionChain credentials={credentials} />
           </div>

        ) : viewMode === 'cumulative' ? (
            
           /* 3. CUMULATIVE SUMMARY VIEW */
           <div className="flex-1 overflow-y-auto">
              <CumulativeView data={stocks} />
           </div>

        ) : (
           
           /* 4. DASHBOARD VIEW (Stocks List) */
           <>
             {/* Fixed Stats Area (Non-scrolling) */}
             <div className="flex-none p-4 pb-0">
               {stocks.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                     <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Trend</p>
                        <div className="flex items-end gap-2 mt-1">
                           <span className="text-2xl font-bold text-green-500">{stocks.filter(s => s.ch >= 0).length}</span>
                           <span className="text-gray-600">/</span>
                           <span className="text-2xl font-bold text-red-500">{stocks.filter(s => s.ch < 0).length}</span>
                        </div>
                     </div>
                     
                     <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Top Gainer</p>
                        <div className="mt-1">
                           {(() => {
                              const top = [...stocks].sort((a,b) => b.chp - a.chp)[0];
                              if(!top) return <span className="text-gray-500">--</span>;
                              return (
                                 <>
                                    <p className="font-bold text-white truncate">{top.short_name || top.symbol}</p>
                                    <p className="text-green-500 font-mono text-sm">+{top.chp.toFixed(2)}%</p>
                                 </>
                              )
                           })()}
                        </div>
                     </div>

                      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Top Loser</p>
                        <div className="mt-1">
                           {(() => {
                              const bottom = [...stocks].sort((a,b) => a.chp - b.chp)[0];
                              if(!bottom) return <span className="text-gray-500">--</span>;
                              return (
                                 <>
                                    <p className="font-bold text-white truncate">{bottom.short_name || bottom.symbol}</p>
                                    <p className="text-red-500 font-mono text-sm">{bottom.chp.toFixed(2)}%</p>
                                 </>
                              )
                           })()}
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

             {/* Scrolling Table Area */}
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
               <StockTable 
                  data={filteredAndSortedStocks} 
                  sortConfig={sortConfig} 
                  onSort={handleSort}
                  onSelect={setSelectedStock}
                  isLoading={isLoading}
               />
             </div>
           </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={saveCredentials}
        currentCreds={credentials}
      />
    </div>
  );
};

export default App;