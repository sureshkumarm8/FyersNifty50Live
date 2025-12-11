
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List, PieChart, Clock, Zap, Moon } from 'lucide-react';
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { OptionChain } from './components/OptionChain';
import { CumulativeView } from './components/CumulativeView';
import { SentimentHistory } from './components/SentimentHistory';
import { SettingsScreen } from './components/SettingsScreen';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote, MarketSnapshot, ViewMode, SessionHistoryMap, SessionCandle } from './types';
import { fetchQuotes, getNiftyOptionSymbols } from './services/fyersService';
import { NIFTY50_SYMBOLS, REFRESH_OPTIONS, NIFTY_WEIGHTAGE, NIFTY_INDEX_SYMBOL } from './constants';

const HISTORY_STORAGE_KEY = 'nifty50_history_log';
const HISTORY_DATE_KEY = 'nifty50_history_date';
const SESSION_DATA_KEY = 'nifty50_session_data';

const App: React.FC = () => {
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    const saved = localStorage.getItem('fyers_creds');
    return saved ? JSON.parse(saved) : { appId: '', accessToken: '', refreshInterval: REFRESH_OPTIONS[3].value };
  });

  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [error, setError] = useState<string | null>(null);
  const [marketStatusMsg, setMarketStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const [stocks, setStocks] = useState<EnrichedFyersQuote[]>([]);
  const [optionQuotes, setOptionQuotes] = useState<EnrichedFyersQuote[]>([]);
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null);
  
  const [historyLog, setHistoryLog] = useState<MarketSnapshot[]>(() => {
      try {
          const savedDate = localStorage.getItem(HISTORY_DATE_KEY);
          const today = new Date().toDateString();
          if (savedDate === today) {
              const savedLog = localStorage.getItem(HISTORY_STORAGE_KEY);
              return savedLog ? JSON.parse(savedLog) : [];
          } else {
              localStorage.setItem(HISTORY_DATE_KEY, today);
              localStorage.removeItem(HISTORY_STORAGE_KEY);
              localStorage.removeItem(SESSION_DATA_KEY); 
              return [];
          }
      } catch (e) {
          return [];
      }
  });

  const [sessionHistory, setSessionHistory] = useState<SessionHistoryMap>(() => {
      try {
          const savedDate = localStorage.getItem(HISTORY_DATE_KEY);
          const today = new Date().toDateString();
          if (savedDate === today) {
              const saved = localStorage.getItem(SESSION_DATA_KEY);
              return saved ? JSON.parse(saved) : {};
          }
          return {};
      } catch (e) { return {}; }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'symbol', direction: 'asc' });
  const prevViewModeRef = useRef<ViewMode>('summary');

  const prevStocksRef = useRef<Record<string, FyersQuote>>({});
  const initialStocksRef = useRef<Record<string, FyersQuote>>({});
  const prevOptionsRef = useRef<Record<string, FyersQuote>>({});
  const initialOptionsRef = useRef<Record<string, FyersQuote>>({});
  
  const prevNiftyLtpRef = useRef<number | null>(null);

  useEffect(() => {
      if (historyLog.length > 0) {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyLog));
      }
  }, [historyLog]);

  useEffect(() => {
      const handler = setTimeout(() => {
          if (Object.keys(sessionHistory).length > 0) {
              try {
                  localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(sessionHistory));
              } catch(e) {
                  console.error("Storage quota exceeded", e);
              }
          }
      }, 2000);
      return () => clearTimeout(handler);
  }, [sessionHistory]);

  const saveCredentials = (newCreds: FyersCredentials) => {
    // Only update credentials, do not reset any other state
    setCredentials(newCreds); 
    localStorage.setItem('fyers_creds', JSON.stringify(newCreds));
    setError(null);
    setMarketStatusMsg(null);
  };

  const handleSetViewMode = (mode: ViewMode) => {
    // Before navigating TO settings, save where we came from.
    if (mode === 'settings' && viewMode !== 'settings') {
      prevViewModeRef.current = viewMode;
    }
    setViewMode(mode);
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const updateSessionHistory = (quotes: EnrichedFyersQuote[]) => {
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
      const nowTs = Date.now();

      setSessionHistory(prev => {
          const nextState = { ...prev };
          
          quotes.forEach(q => {
              if (!nextState[q.symbol]) {
                  nextState[q.symbol] = [];
              }
              
              const history = nextState[q.symbol];
              const lastEntry = history.length > 0 ? history[history.length - 1] : null;
              
              if (!lastEntry || lastEntry.time !== nowStr) {
                  const candle: SessionCandle = {
                      time: nowStr,
                      timestamp: nowTs,
                      lp: q.lp,
                      volume: q.volume,
                      chp: q.chp,
                      lp_chg_1m_p: q.lp_chg_1m_p || 0,
                      lp_chg_day_p: q.lp_chg_day_p || 0,
                      total_buy_qty: q.total_buy_qty || 0,
                      total_sell_qty: q.total_sell_qty || 0,
                      bid_qty_chg_p: q.bid_qty_chg_p || 0,
                      bid_chg_day_p: q.bid_chg_day_p || 0,
                      ask_qty_chg_p: q.ask_qty_chg_p || 0,
                      ask_chg_day_p: q.ask_chg_day_p || 0,
                      net_strength_1m: q.net_strength_1m || 0,
                      day_net_strength: q.day_net_strength || 0
                  };
                  
                  if (history.length > 400) history.shift();
                  history.push(candle);
              }
          });
          return nextState;
      });
  };

  const enrichData = (
      currentData: FyersQuote[], 
      prevRef: React.MutableRefObject<Record<string, FyersQuote>>, 
      initialRef: React.MutableRefObject<Record<string, FyersQuote>>,
      isStock: boolean
  ): EnrichedFyersQuote[] => {
      return currentData.map(curr => {
        const prev = prevRef.current[curr.symbol];
        
        // Load initial data from session history if available, otherwise set it
        if (!initialRef.current[curr.symbol]) {
           const sessionStartData = sessionHistory[curr.symbol]?.[0];
           if(sessionStartData) {
              initialRef.current[curr.symbol] = {
                 ...curr,
                 lp: sessionStartData.lp,
                 total_buy_qty: sessionStartData.total_buy_qty,
                 total_sell_qty: sessionStartData.total_sell_qty,
              };
           } else {
              initialRef.current[curr.symbol] = curr;
           }
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
        let lp_chg_1m_p = undefined;
        let lp_chg_day_p = undefined;

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
           if (curr.lp !== undefined && prev.lp !== undefined && prev.lp !== 0) {
              lp_chg_1m_p = ((curr.lp - prev.lp) / prev.lp) * 100;
           }
        }

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
            if (curr.lp !== undefined && initial.lp !== undefined && initial.lp !== 0) {
                lp_chg_day_p = ((curr.lp - initial.lp) / initial.lp) * 100;
            }
        }
        
        let weight, index_contribution;
        if (isStock) {
            const symbolKey = curr.short_name || curr.symbol.replace('NSE:', '').replace('-EQ', '');
            weight = NIFTY_WEIGHTAGE[symbolKey] || 0.1; 
            index_contribution = (lp_chg_day_p || 0) * weight;
        }

        prevRef.current[curr.symbol] = curr;

        return {
          ...curr,
          bid_qty_chg_1m, bid_qty_chg_p,
          ask_qty_chg_1m, ask_qty_chg_p,
          net_strength_1m,
          initial_total_buy_qty: initial?.total_buy_qty,
          initial_total_sell_qty: initial?.total_sell_qty,
          initial_lp: initial?.lp,
          bid_chg_day_p, ask_chg_day_p, day_net_strength,
          lp_chg_1m_p, lp_chg_day_p,
          weight, index_contribution
        };
      });
  };

  const calculateSnapshot = (stocksData: EnrichedFyersQuote[], optionsData: EnrichedFyersQuote[], ltp: number, ptsChg: number) => {
      let bullishW = 0, bearishW = 0, totalW = 0;
      let adv = 0, dec = 0;
      
      // Stock Strength Calculation (Weighted Average of Stock Net Strength)
      let weightedStockStrengthSum = 0;

      stocksData.forEach(s => {
          const w = s.weight || 0.1;
          const sessionChg = s.lp_chg_day_p || 0;
          
          if (sessionChg > 0.001) { bullishW += w; adv++; } 
          else if (sessionChg < -0.001) { bearishW += w; dec++; }
          totalW += w;

          const strength = s.day_net_strength || 0;
          weightedStockStrengthSum += (strength * w);
      });
      const overallSent = totalW > 0 ? (bullishW - bearishW) / totalW * 100 : 0;
      const stockSent = totalW > 0 ? weightedStockStrengthSum / totalW : 0;

      let callBuyTotal = 0, callSellTotal = 0, callBuyInit = 0, callSellInit = 0;
      let putBuyTotal = 0, putSellTotal = 0, putBuyInit = 0, putSellInit = 0;
      let callOI = 0, putOI = 0;

      optionsData.forEach(o => {
          const isCE = o.symbol.endsWith('CE');
          if (isCE) {
              callBuyTotal += o.total_buy_qty || 0;
              callSellTotal += o.total_sell_qty || 0;
              callBuyInit += o.initial_total_buy_qty || 0;
              callSellInit += o.initial_total_sell_qty || 0;
              callOI += o.oi || 0;
          } else {
              putBuyTotal += o.total_buy_qty || 0;
              putSellTotal += o.total_sell_qty || 0;
              putBuyInit += o.initial_total_buy_qty || 0;
              putSellInit += o.initial_total_sell_qty || 0;
              putOI += o.oi || 0;
          }
      });

      // Percent Change Logic: (Total - Init) / Init
      // Strength: BidChg% - AskChg%
      const getStrength = (buy: number, initBuy: number, sell: number, initSell: number) => {
          const buyChgP = initBuy > 0 ? ((buy - initBuy) / initBuy) * 100 : 0;
          const sellChgP = initSell > 0 ? ((sell - initSell) / initSell) * 100 : 0;
          return buyChgP - sellChgP;
      };

      const callSent = getStrength(callBuyTotal, callBuyInit, callSellTotal, callSellInit);
      const putSent = getStrength(putBuyTotal, putBuyInit, putSellTotal, putSellInit);
      
      const pcr = callOI > 0 ? putOI / callOI : 0;
      const optionsSent = callSent - putSent;

      // Calculate raw flows for display (in Millions)
      const callsBuyDelta = callBuyTotal - callBuyInit;
      const callsSellDelta = callSellTotal - callSellInit;
      const putsBuyDelta = putBuyTotal - putBuyInit;
      const putsSellDelta = putSellTotal - putSellInit;

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
          callsBuyQty: callsBuyDelta,
          callsSellQty: callsSellDelta,
          putsBuyQty: putsBuyDelta,
          putsSellQty: putsSellDelta
      };

      setHistoryLog(prev => {
          const updated = [...prev, snapshot];
          if (updated.length > 400) updated.shift(); 
          return updated;
      });
  };

  const isMarketOpen = () => {
     const now = new Date();
     const hours = now.getHours();
     const minutes = now.getMinutes();
     const day = now.getDay(); 
     if (day === 0 || day === 6) return false;
     const totalMinutes = (hours * 60) + minutes;
     const startMinutes = (9 * 60) + 17; 
     const endMinutes = (15 * 60) + 15;  
     return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
  };

  const refreshData = useCallback(async () => {
    if (!credentials.appId || !credentials.accessToken) {
       if(stocks.length === 0) setError("Please configure API credentials");
       return;
    }

    const open = isMarketOpen();
    const bypass = credentials.bypassMarketHours;
    
    if (!open && !bypass) {
       setMarketStatusMsg("Market Closed (09:17 - 15:15)");
       if (stocks.length === 0 && !error) {
           setError("Market is closed. Enable 'Test Mode' in settings to fetch data anyway.");
       }
       return; 
    } else {
       setMarketStatusMsg(null);
    }

    try {
      if (stocks.length === 0) setIsLoading(true);
      const rawStocks = await fetchQuotes(NIFTY50_SYMBOLS, credentials);
      const enrichedStocks = enrichData(rawStocks, prevStocksRef, initialStocksRef, true);
      setStocks(enrichedStocks);

      const indexQuote = await fetchQuotes([NIFTY_INDEX_SYMBOL], credentials);
      const idx = indexQuote[0];
      if (idx) {
          setNiftyLtp(idx.lp);
          
          const prevLtp = prevNiftyLtpRef.current || idx.lp; 
          const nifty1MinChange = idx.lp - prevLtp;
          prevNiftyLtpRef.current = idx.lp;

          const optSymbols = getNiftyOptionSymbols(idx.lp);
          const rawOptions = await fetchQuotes(optSymbols, credentials);
          const enrichedOptions = enrichData(rawOptions, prevOptionsRef, initialOptionsRef, false);
          setOptionQuotes(enrichedOptions);
          
          calculateSnapshot(enrichedStocks, enrichedOptions, idx.lp, nifty1MinChange);
          
          updateSessionHistory([...enrichedStocks, ...enrichedOptions]);
      }
      setLastUpdated(Date.now());
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  useEffect(() => {
    const interval = credentials.refreshInterval || REFRESH_OPTIONS[3].value;
    refreshData();
    const intervalId = setInterval(refreshData, interval);
    return () => clearInterval(intervalId);
  }, [refreshData, credentials.refreshInterval]);

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

  if (viewMode === 'settings') {
    return <SettingsScreen 
              currentCreds={credentials} 
              onSave={saveCredentials} 
              onBack={() => handleSetViewMode(prevViewModeRef.current)} 
           />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative font-sans">
      
      <header className="flex-none glass-header z-30 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-auto sm:h-18 flex flex-col sm:flex-row items-center justify-between py-2 sm:py-3 gap-3 sm:gap-0">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
             <div className="flex items-center gap-3 cursor-pointer group self-start sm:self-center" onClick={() => setSelectedStock(null)}>
               <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                 <Zap size={20} className="text-white fill-white" />
               </div>
               <div>
                 <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                   NIFTY<span className="text-blue-500">50</span>.AI
                 </h1>
               </div>
               <button onClick={() => handleSetViewMode('settings')} className="ml-auto sm:hidden p-2 text-slate-400 hover:text-white rounded-lg"><Settings size={20} /></button>
             </div>

             {!selectedStock && (
                <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 backdrop-blur-md overflow-x-auto w-full sm:w-auto custom-scrollbar">
                   {[
                     { id: 'summary', icon: PieChart, label: 'Cockpit' },
                     { id: 'stocks', icon: List, label: 'Stocks' },
                     { id: 'options', icon: BarChart3, label: 'Options' },
                     { id: 'history', icon: Clock, label: 'History' }
                   ].map((tab) => (
                     <button 
                       key={tab.id}
                       onClick={() => handleSetViewMode(tab.id as ViewMode)} 
                       className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${viewMode === tab.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                     >
                        <tab.icon size={14} className={viewMode === tab.id ? 'animate-pulse' : ''} /> {tab.label}
                     </button>
                   ))}
                </div>
             )}
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end hidden sm:flex">
             {!selectedStock && viewMode === 'stocks' && (
               <div className="flex items-center bg-slate-900/50 rounded-full px-4 py-2 border border-white/10 focus-within:border-blue-500/50 focus-within:bg-slate-900/80 transition-all">
                  <Search size={16} className="text-slate-500 mr-2" />
                  <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-32 sm:w-48 text-white placeholder-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
             )}
            <div className="text-right hidden md:block">
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Latency</p>
                 <div className="flex items-center justify-end gap-2">
                    {marketStatusMsg ? (
                       <span className="flex items-center gap-1 text-xs font-mono text-yellow-400">
                          <Moon size={10} /> Market Closed
                       </span>
                    ) : (
                       <>
                         <span className="relative flex h-2 w-2">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                         </span>
                         <p className="text-xs font-mono text-slate-300">{lastUpdated ? 'Live' : 'Connecting...'}</p>
                       </>
                    )}
                 </div>
            </div>
            <button onClick={() => handleSetViewMode('settings')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        {error && (
          <div className="flex-none px-4 pt-2">
            <div className="glass-panel border-l-4 border-l-red-500 text-red-200 px-4 py-2 rounded-r-xl flex items-center gap-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                 <AlertCircle size={20} className="text-red-500 shrink-0 animate-bounce" />
                 <span className="text-xs sm:text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {selectedStock ? (
           <div className="flex-1 p-2 sm:p-6 overflow-hidden animate-in slide-in-from-right duration-300">
               <StockDetail 
                  symbol={selectedStock} 
                  credentials={credentials} 
                  onBack={() => setSelectedStock(null)} 
                  sessionData={sessionHistory[selectedStock]} 
               />
           </div>
        ) : viewMode === 'history' ? (
           <div className="flex-1 p-2 sm:p-6 overflow-hidden animate-in fade-in duration-300">
               <SentimentHistory history={historyLog} />
           </div>
        ) : viewMode === 'options' ? (
           <div className="flex-1 p-2 sm:p-6 overflow-hidden flex flex-col animate-in fade-in duration-300">
              <OptionChain quotes={optionQuotes} niftyLtp={niftyLtp} lastUpdated={lastUpdated ? new Date(lastUpdated) : null} isLoading={isLoading} onSelect={setSelectedStock} />
           </div>
        ) : viewMode === 'summary' ? (
           <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-300">
              <CumulativeView 
                data={stocks} 
                latestSnapshot={historyLog.length > 0 ? historyLog[historyLog.length - 1] : undefined} 
                historyLog={historyLog}
                onNavigate={handleSetViewMode}
                onSelectStock={setSelectedStock}
                marketStatus={marketStatusMsg} 
              />
           </div>
        ) : (
           <>
             <div className="flex-none p-2 sm:p-6 pb-0 animate-in fade-in duration-300">
               {stocks.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-2 sm:mb-4">
                     <div className="glass-panel p-3 sm:p-4 rounded-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Activity size={40} />
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Breadth (Session)</p>
                        <div className="flex items-end gap-2 mt-2">
                           <span className="text-2xl sm:text-3xl font-bold text-bull text-glow-green">{stocks.filter(s => (s.lp_chg_day_p || 0) > 0.001).length}</span>
                           <span className="text-slate-600 text-lg sm:text-xl font-thin">/</span>
                           <span className="text-2xl sm:text-3xl font-bold text-bear text-glow-red">{stocks.filter(s => (s.lp_chg_day_p || 0) < -0.001).length}</span>
                        </div>
                     </div>
                  </div>
               )}
             </div>
             {/* Mobile Search Bar for Stocks View */}
             <div className="sm:hidden px-2 pb-2">
               <div className="flex items-center bg-slate-900/50 rounded-lg px-3 py-2 border border-white/10">
                   <Search size={16} className="text-slate-500 mr-2" />
                   <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-2 sm:p-6 pt-2 custom-scrollbar animate-in fade-in duration-500">
               <StockTable data={filteredAndSortedStocks} sortConfig={sortConfig} onSort={handleSort} onSelect={setSelectedStock} isLoading={isLoading} />
             </div>
           </>
        )}
      </main>
    </div>
  );
};

export default App;
