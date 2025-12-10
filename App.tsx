import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Settings, RefreshCw, Activity, Search } from 'lucide-react';
import { StockTable } from './components/StockTable';
import { SettingsModal } from './components/SettingsModal';
import { FyersCredentials, FyersQuote, SortConfig, SortField } from './types';
import { fetchQuotes } from './services/fyersService';
import { NIFTY50_SYMBOLS, REFRESH_INTERVAL_MS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    const saved = localStorage.getItem('fyers_creds');
    return saved ? JSON.parse(saved) : { appId: '', accessToken: '', isDemoMode: true };
  });

  const [stocks, setStocks] = useState<FyersQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'symbol',
    direction: 'asc',
  });

  // --- Helpers ---
  const saveCredentials = (newCreds: FyersCredentials) => {
    setCredentials(newCreds);
    localStorage.setItem('fyers_creds', JSON.stringify(newCreds));
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const refreshData = useCallback(async () => {
    // Avoid multiple concurrent fetches
    if (!credentials.isDemoMode && (!credentials.appId || !credentials.accessToken)) {
       // Only clear if we were showing something else before
       if(stocks.length === 0) setError("Please configure API credentials in Settings");
       return;
    }

    try {
      // Don't show loading spinner on background refreshes if we already have data
      if (stocks.length === 0) setIsLoading(true);
      
      const quotes = await fetchQuotes(NIFTY50_SYMBOLS, credentials);
      setStocks(quotes);
      setLastUpdated(Date.now());
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [credentials]); // Intentionally exclude 'stocks' to prevent dep loop

  // --- Effects ---
  
  // Initial load and Polling
  useEffect(() => {
    refreshData();
    
    const intervalId = setInterval(refreshData, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshData]);

  // --- Derived State ---
  const filteredAndSortedStocks = useMemo(() => {
    let data = [...stocks];

    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(s => 
        s.symbol.toLowerCase().includes(q) || 
        (s.short_name && s.short_name.toLowerCase().includes(q))
      );
    }

    // Sort
    data.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      // Handle strings (symbol)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
         return sortConfig.direction === 'asc' 
           ? aValue.localeCompare(bValue) 
           : bValue.localeCompare(aValue);
      }
      
      // Handle numbers
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
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Nifty50 Live</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                 {credentials.isDemoMode && <span className="bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded border border-blue-800">DEMO MODE</span>}
                 <span>{stocks.length} Symbols</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Search */}
             <div className="hidden md:flex items-center bg-gray-800 rounded-full px-4 py-1.5 border border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <Search size={16} className="text-gray-500 mr-2" />
                <input 
                   type="text" 
                   placeholder="Search stock..." 
                   className="bg-transparent border-none outline-none text-sm w-48 placeholder-gray-500 text-white"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-sm font-mono text-gray-300">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--:--'}
              </p>
            </div>

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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800/50 text-red-200 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"/> 
               {error}
            </span>
            <button onClick={() => setIsSettingsOpen(true)} className="text-sm underline hover:text-white">Configure</button>
          </div>
        )}

        {/* Dashboard Stats (Optional Summary Row) */}
        {!error && stocks.length > 0 && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase font-semibold">Market Trend</p>
                 <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">
                       {stocks.filter(s => s.ch >= 0).length}
                    </span>
                    <span className="text-sm text-green-500 mb-1">Advanced</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-2xl font-bold text-white">
                       {stocks.filter(s => s.ch < 0).length}
                    </span>
                    <span className="text-sm text-red-500 mb-1">Declined</span>
                 </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                 <p className="text-xs text-gray-500 uppercase font-semibold">Top Gainer</p>
                 <div className="mt-1">
                    {(() => {
                       const top = [...stocks].sort((a,b) => b.chp - a.chp)[0];
                       if(!top) return null;
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
                       if(!bottom) return null;
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
                       <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live
                    </p>
                 </div>
                 <button onClick={() => refreshData()} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors">
                    <RefreshCw size={18} className="text-gray-400" />
                 </button>
              </div>
           </div>
        )}

        {/* Search Mobile */}
        <div className="md:hidden mb-4">
             <div className="flex items-center bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
                <Search size={18} className="text-gray-500 mr-2" />
                <input 
                   type="text" 
                   placeholder="Search stock..." 
                   className="bg-transparent border-none outline-none text-sm w-full text-white"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
        </div>

        {/* Data Table */}
        <StockTable 
           data={filteredAndSortedStocks} 
           sortConfig={sortConfig} 
           onSort={handleSort}
           isLoading={isLoading}
        />
        
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