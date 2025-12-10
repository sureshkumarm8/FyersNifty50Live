import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List } from 'lucide-react';
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { OptionChain } from './components/OptionChain';
import { SettingsModal } from './components/SettingsModal';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote } from './types';
import { fetchQuotes } from './services/fyersService';
import { NIFTY50_SYMBOLS, REFRESH_INTERVAL_MS } from './constants';

type ViewMode = 'dashboard' | 'options';

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
  // Key: symbol, Value: Previous Quote
  const prevStocksRef = useRef<Record<string, FyersQuote>>({});

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
    // Only refresh stocks if we are in dashboard view
    if (viewMode !== 'dashboard') return;

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
        
        let bid_qty_chg_1m = undefined;
        let ask_qty_chg_p = undefined;

        if (prev) {
           // Calc Change in Total Bid Qty
           if (curr.total_buy_qty !== undefined && prev.total_buy_qty !== undefined) {
              bid_qty_chg_1m = curr.total_buy_qty - prev.total_buy_qty;
           }

           // Calc % Change in Total Ask Qty
           if (curr.total_sell_qty !== undefined && prev.total_sell_qty !== undefined && prev.total_sell_qty !== 0) {
              ask_qty_chg_p = ((curr.total_sell_qty - prev.total_sell_qty) / prev.total_sell_qty) * 100;
           }
        }
        
        // Update Ref for next time
        prevStocksRef.current[curr.symbol] = curr;

        return {
          ...curr,
          bid_qty_chg_1m,
          ask_qty_chg_p
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
    <div className="min-h-screen bg-gray-950 flex flex-col text-gray-100">
      
      {/* Navbar */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedStock(null)}>
               <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                 <Activity size={24} className="text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-bold tracking-tight text-white">Nifty50 Live</h1>
               </div>
             </div>

             {/* Navigation Tabs */}
             {!selectedStock && (
                <div className="hidden sm:flex bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
                   <button 
                      onClick={() => setViewMode('dashboard')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                   >
                      <List size={16} />
                      Stocks
                   </button>
                   <button 
                      onClick={() => setViewMode('options')}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'options' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
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

            {viewMode === 'dashboard' && (
               <div className="text-right hidden sm:block">
                 <p className="text-xs text-gray-500">Last Updated</p>
                 <p className="text-sm font-mono text-gray-300">
                   {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}
                 </p>
               </div>
            )}

            <div className="h-8 w-[1px] bg-gray-800 mx-2"></div>

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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-900 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
               <AlertCircle size={18} className="text-red-500 shrink-0" />
               <span className="text-sm">{error}</span>
            </span>
          </div>
        )}

        {/* --- VIEW ROUTER --- */}
        
        {/* 1. STOCK DETAIL VIEW */}
        {selectedStock ? (
           <StockDetail 
              symbol={selectedStock} 
              credentials={credentials} 
              onBack={() => setSelectedStock(null)} 
           />
        ) : viewMode === 'options' ? (
           
           /* 2. OPTION CHAIN VIEW */
           <OptionChain credentials={credentials} />
           
        ) : (
           
           /* 3. DASHBOARD VIEW (Original) */
           <>
             {stocks.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

             <StockTable 
                data={filteredAndSortedStocks} 
                sortConfig={sortConfig} 
                onSort={handleSort}
                onSelect={setSelectedStock}
                isLoading={isLoading}
             />
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