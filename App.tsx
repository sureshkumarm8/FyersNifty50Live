
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List, PieChart, Clock, Zap, Moon, Pause, Play, Download, Bot, BrainCircuit } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { OptionChain } from './components/OptionChain';
import { CumulativeView } from './components/CumulativeView';
import { SentimentHistory } from './components/SentimentHistory';
import { SettingsScreen } from './components/SettingsScreen';
import { AIView } from './components/AIView';
import { AIQuantDeck } from './components/AIQuantDeck';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote, MarketSnapshot, ViewMode, SessionHistoryMap, SessionCandle, AnalysisRecord, StrategySignal } from './types';
import { fetchQuotes, getNiftyOptionSymbols } from './services/fyersService';
import { NIFTY50_SYMBOLS, REFRESH_OPTIONS, NIFTY_WEIGHTAGE, NIFTY_INDEX_SYMBOL } from './constants';
import { dbService } from './services/db';
import { downloadCSV } from './services/csv';

const App: React.FC = () => {
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    try {
      const saved = localStorage.getItem('fyers_creds');
      return saved ? JSON.parse(saved) : { appId: '', accessToken: '', refreshInterval: REFRESH_OPTIONS[3].value };
    } catch (e) {
      return { appId: '', accessToken: '', refreshInterval: REFRESH_OPTIONS[3].value };
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [error, setError] = useState<string | null>(null);
  const [marketStatusMsg, setMarketStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false); // New flag for DB hydration
  const [isPaused, setIsPaused] = useState(false); // Manual fetch pause
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const [stocks, setStocks] = useState<EnrichedFyersQuote[]>([]);
  const [optionQuotes, setOptionQuotes] = useState<EnrichedFyersQuote[]>([]);
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null);
  
  // Data States
  const [historyLog, setHistoryLog] = useState<MarketSnapshot[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryMap>({});

  // AI Quant State (Lifted)
  const [quantAnalysis, setQuantAnalysis] = useState<StrategySignal | null>(null);
  const [quantHistory, setQuantHistory] = useState<AnalysisRecord[]>([]);
  const [isQuantAnalyzing, setIsQuantAnalyzing] = useState(false);
  const [quantError, setQuantError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'symbol', direction: 'asc' });
  const prevViewModeRef = useRef<ViewMode>('summary');

  const prevStocksRef = useRef<Record<string, FyersQuote>>({});
  const initialStocksRef = useRef<Record<string, FyersQuote>>({});
  const prevOptionsRef = useRef<Record<string, FyersQuote>>({});
  const initialOptionsRef = useRef<Record<string, FyersQuote>>({});
  
  const prevNiftyLtpRef = useRef<number | null>(null);

  // --- 1. Database Hydration (On Mount) ---
  useEffect(() => {
    const initData = async () => {
        try {
            await dbService.init();
            
            const today = new Date().toDateString();
            const savedDate = await dbService.getLastDate();

            if (savedDate === today) {
                // Same day: Restore state
                const snaps = await dbService.getSnapshots();
                const sessions = await dbService.getAllSessionData();
                setHistoryLog(snaps);
                setSessionHistory(sessions);
            } else {
                // New day: Clear DB
                await dbService.clearAll();
                await dbService.setLastDate(today);
            }
        } catch (e) {
            console.error("DB Init Failed", e);
        } finally {
            setIsDbLoaded(true);
        }
    };
    initData();
  }, []);

  // --- 1.1 Quant History Hydration ---
  useEffect(() => {
    const today = new Date().toDateString();
    const key = `quant_history_${today}`;
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            setQuantHistory(parsed);
            if (parsed.length > 0) {
                setQuantAnalysis(parsed[0].signal);
            }
        }
    } catch (e) {
        console.error("Failed to load quant history", e);
    }
  }, []);

  // --- 2. Database Persistence (Debounced) ---
  
  // Save Snapshots
  useEffect(() => {
      if (!isDbLoaded || historyLog.length === 0) return;
      
      const lastSnap = historyLog[historyLog.length - 1];
      if (lastSnap) {
          dbService.saveSnapshot(lastSnap).catch(e => console.error("Failed to save snapshot", e));
      }
  }, [historyLog, isDbLoaded]);

  // Save Session Data
  useEffect(() => {
    if (!isDbLoaded) return;
    
    // Increased timeout to 8 seconds to prevent rapid overwrites during dual-fetch (stocks + options)
    const timer = setTimeout(() => {
        // Saving 150+ items can be heavy, do it in a non-blocking way if possible
        const entries = Object.entries(sessionHistory);
        if(entries.length === 0) return;

        // Save sequentially or in chunks to avoid locking UI
        entries.forEach(([symbol, candlesVal]) => {
            const candles = candlesVal as SessionCandle[];
            if (candles && candles.length > 0) {
                 dbService.saveStockSession(symbol, candles).catch(console.error);
            }
        });
    }, 8000); 

    return () => clearTimeout(timer);
  }, [sessionHistory, isDbLoaded]);

  // Save Quant History
  useEffect(() => {
      const today = new Date().toDateString();
      const key = `quant_history_${today}`;
      try {
        localStorage.setItem(key, JSON.stringify(quantHistory));
      } catch (e) {
          console.error("Failed to save quant history", e);
      }
  }, [quantHistory]);

  const saveCredentials = (newCreds: FyersCredentials) => {
    setCredentials(newCreds); 
    try {
        localStorage.setItem('fyers_creds', JSON.stringify(newCreds));
    } catch (e) {
        setError("Failed to save credentials to local storage.");
    }
    setError(null);
    setMarketStatusMsg(null);
  };

  const handleSetViewMode = (mode: ViewMode) => {
    if (mode === 'settings' && viewMode !== 'settings') {
      prevViewModeRef.current = viewMode;
    }
    setViewMode(mode);
    setSelectedStock(null); // Close overlay when navigation changes
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const updateSessionHistory = (quotes: EnrichedFyersQuote[]) => {
      if (!isDbLoaded) return; 

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
           // If we have history from DB, use the first candle
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
          bid_qty_chg_1m,
          bid_qty_chg_p,
          ask_qty_chg_1m,
          ask_qty_chg_p,
          net_strength_1m,
          bid_chg_day_p,
          ask_chg_day_p,
          day_net_strength,
          initial_total_buy_qty: initial.total_buy_qty,
          initial_total_sell_qty: initial.total_sell_qty,
          lp_chg_1m_p,
          lp_chg_day_p,
          weight,
          index_contribution
        };
      });
  };

  const refreshData = useCallback(async () => {
    if (!credentials.appId || !credentials.accessToken || !isDbLoaded) return;

    setIsLoading(true);

    if (!credentials.bypassMarketHours) {
        const now = new Date();
        const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const istDate = new Date(istString);
        
        const day = istDate.getDay(); 
        const hour = istDate.getHours();
        const min = istDate.getMinutes();
        const timeVal = hour * 100 + min;

        const isWeekday = day >= 1 && day <= 5;
        const isOpen = timeVal >= 900 && timeVal <= 1545;

        if (!isWeekday || !isOpen) {
            setMarketStatusMsg("Market Closed (09:00 - 15:45 IST)");
            setIsLoading(false);
            return;
        }
    }

    try {
      const stockData = await fetchQuotes(NIFTY50_SYMBOLS, credentials);
      if (stockData.length === 0) return;

      const indexQuote = await fetchQuotes([NIFTY_INDEX_SYMBOL], credentials);
      const niftyLtpVal = indexQuote.length > 0 ? indexQuote[0].lp : 0;
      setNiftyLtp(niftyLtpVal);

      const enrichedStocks = enrichData(stockData, prevStocksRef, initialStocksRef, true);
      setStocks(enrichedStocks);
      updateSessionHistory(enrichedStocks);

      // --- Option Chain Logic ---
      if (niftyLtpVal > 0) {
          const optionSymbols = getNiftyOptionSymbols(niftyLtpVal);
          const rawOptions = await fetchQuotes(optionSymbols, credentials);
          const enrichedOptions = enrichData(rawOptions, prevOptionsRef, initialOptionsRef, false);
          setOptionQuotes(enrichedOptions);
          updateSessionHistory(enrichedOptions);
          
          // --- Market Snapshot for History Log ---
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
          const prevLtp = prevNiftyLtpRef.current || niftyLtpVal;
          const ptsChg = niftyLtpVal - prevLtp;
          prevNiftyLtpRef.current = niftyLtpVal;

          const adv = enrichedStocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
          const dec = enrichedStocks.filter(s => (s.lp_chg_day_p || 0) < 0).length;
          
          let totalWeight = 0, bullishWeight = 0, bearishWeight = 0;
          let stockBuyDelta = 0, stockSellDelta = 0;

          enrichedStocks.forEach(s => {
              const w = s.weight || 0;
              const chg = s.lp_chg_day_p || 0;
              totalWeight += w;
              if (chg > 0) bullishWeight += w;
              if (chg < 0) bearishWeight += w;
              
              stockBuyDelta += (s.total_buy_qty || 0) - (s.initial_total_buy_qty || 0);
              stockSellDelta += (s.total_sell_qty || 0) - (s.initial_total_sell_qty || 0);
          });

          const overallSent = totalWeight > 0 ? ((bullishWeight - bearishWeight) / totalWeight) * 100 : 0;
          const stockSent = stockSellDelta !== 0 ? ((stockBuyDelta - stockSellDelta) / Math.abs(stockSellDelta)) * 100 : 0;

          // Option Aggregations
          let callsBuyQty = 0, callsSellQty = 0, putsBuyQty = 0, putsSellQty = 0;
          let callsOI = 0, putsOI = 0;
          let callBuyDelta = 0, callSellDelta = 0, putBuyDelta = 0, putSellDelta = 0;

          enrichedOptions.forEach(o => {
              if (o.symbol.endsWith('CE')) {
                  callsBuyQty += o.total_buy_qty || 0;
                  callsSellQty += o.total_sell_qty || 0;
                  callsOI += o.oi || 0;
                  callBuyDelta += (o.total_buy_qty || 0) - (o.initial_total_buy_qty || 0);
                  callSellDelta += (o.total_sell_qty || 0) - (o.initial_total_sell_qty || 0);
              } else {
                  putsBuyQty += o.total_buy_qty || 0;
                  putsSellQty += o.total_sell_qty || 0;
                  putsOI += o.oi || 0;
                  putBuyDelta += (o.total_buy_qty || 0) - (o.initial_total_buy_qty || 0);
                  putSellDelta += (o.total_sell_qty || 0) - (o.initial_total_sell_qty || 0);
              }
          });

          const pcr = callsOI > 0 ? putsOI / callsOI : 0;
          const callSent = callSellDelta !== 0 ? ((callBuyDelta - callSellDelta) / Math.abs(callSellDelta)) * 100 : 0;
          const putSent = putSellDelta !== 0 ? ((putBuyDelta - putSellDelta) / Math.abs(putSellDelta)) * 100 : 0;
          const optionsSent = callSent - putSent;

          const lastLogTime = historyLog.length > 0 ? historyLog[historyLog.length - 1].time : '';
          const currentMin = timeStr.substring(0, 5); 
          const lastLogMin = lastLogTime.substring(0, 5);

          if (currentMin !== lastLogMin) {
              const snapshot: MarketSnapshot = {
                  time: timeStr,
                  timestamp: Date.now(),
                  niftyLtp: niftyLtpVal,
                  ptsChg,
                  overallSent,
                  adv,
                  dec,
                  stockSent,
                  callSent,
                  putSent,
                  pcr,
                  optionsSent,
                  callsBuyQty,
                  callsSellQty,
                  putsBuyQty,
                  putsSellQty
              };
              setHistoryLog(prev => [...prev, snapshot]);
          }
      }

      setLastUpdated(Date.now());
      setError(null);
      setMarketStatusMsg(null);
    } catch (err: any) {
      if (err.message.includes("Market Hours") || err.message.includes("Test Mode")) {
          setMarketStatusMsg(err.message);
      } else {
          setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [credentials, isDbLoaded, historyLog, sessionHistory]); 

  // Stable Interval Logic
  const refreshDataRef = useRef(refreshData);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  useEffect(() => {
    if (isDbLoaded && credentials.appId && credentials.accessToken && !isPaused) {
      refreshDataRef.current();
      
      const intervalId = setInterval(() => {
          if (refreshDataRef.current) {
              refreshDataRef.current();
          }
      }, credentials.refreshInterval || 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [isDbLoaded, credentials.appId, credentials.accessToken, isPaused, credentials.refreshInterval]);

  // --- AI Quant Logic (Executed at App Level) ---
  const runQuantAnalysis = async () => {
    if (isQuantAnalyzing || !credentials.googleApiKey) return;
    setIsQuantAnalyzing(true);
    setQuantError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: credentials.googleApiKey });
      
      // Prepare Context
      const last15Mins = historyLog.slice(-15);
      const latest = last15Mins[last15Mins.length - 1];
      
      const topFlow = stocks
          .sort((a,b) => (b.day_net_strength || 0) - (a.day_net_strength || 0))
          .slice(0, 3)
          .map(s => `${s.short_name}(NetStr:${s.day_net_strength?.toFixed(1)}%)`);

      const dataContext = JSON.stringify({
         nifty_ltp: niftyLtp,
         snapshot: {
            time: latest?.time,
            overall_sentiment_weighted: latest?.overallSent,
            option_sentiment: latest?.optionsSent,
            pcr: latest?.pcr,
            net_call_flow: latest?.callsBuyQty - latest?.callsSellQty,
            net_put_flow: latest?.putsBuyQty - latest?.putsSellQty
         },
         trend_history_last_15m: last15Mins.map(s => ({ t: s.time, ltp: s.niftyLtp, sent: s.overallSent })),
         top_flow_stocks: topFlow
      });

      const systemInstruction = `
        You are an elite Algorithmic Trader. Analyze the JSON market data provided.
        
        RULES:
        1. "overall_sentiment_weighted" is the most important metric. > 20 is Bullish, < -20 is Bearish.
        2. "option_sentiment" confirms the trend. If Divergence exists (Price Up, Option Sent Down), signal caution.
        3. PCR > 1.2 is Oversold/Support (Bullish), < 0.6 is Overbought/Resistance (Bearish) usually, but check trend.
        
        OUTPUT FORMAT:
        Return ONLY valid JSON matching this schema:
        {
          "market_condition": "TRENDING_UP" | "TRENDING_DOWN" | "SIDEWAYS" | "VOLATILE",
          "signal": "LONG" | "SHORT" | "NO_TRADE",
          "confidence_score": number (0-100),
          "primary_reason": "Short string explaining the main driver",
          "risk_level": "LOW" | "MEDIUM" | "HIGH",
          "suggested_trade": {
            "instrument": "NIFTY OPTIONS",
            "strategy_type": "BUY_CALL" | "BUY_PUT" | "BULL_SPREAD" | "BEAR_SPREAD" | "IRON_CONDOR",
            "ideal_strike": "e.g., 24500 CE",
            "stop_loss_ref": number (Nifty Spot Level),
            "target_ref": number (Nifty Spot Level)
          },
          "hidden_anomaly": {
            "detected": boolean,
            "stock_symbol": "Stock Name or None",
            "description": "Short description of flow divergence if any"
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze this market data: ${dataContext}`,
        config: { 
            responseMimeType: "application/json",
            systemInstruction 
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      const newRecord: AnalysisRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          timeStr: new Date().toLocaleTimeString(),
          signal: result
      };

      setQuantAnalysis(result);
      setQuantHistory(prev => [newRecord, ...prev]);

    } catch (e: any) {
      setQuantError(e.message);
    } finally {
      setIsQuantAnalyzing(false);
    }
  };

  const handleClearQuantHistory = () => {
    if(confirm("Clear today's analysis history?")) {
        setQuantHistory([]);
        setQuantAnalysis(null);
    }
  };

  // --- Filtering & Sorting for Summary View ---
  const sortedStocks = useMemo(() => {
    const filtered = stocks.filter(s => 
       s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (s.short_name && s.short_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === undefined || bValue === undefined) return 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
         return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    return filtered;
  }, [stocks, searchQuery, sortConfig]);

  if (!isDbLoaded) {
      return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 text-blue-500 gap-4">
              <Zap className="animate-bounce" size={48} />
              <h1 className="text-xl font-bold text-white">Hydrating Data...</h1>
              <p className="text-slate-500 text-sm">Loading session history from database</p>
          </div>
      );
  }

  if (!credentials.appId && viewMode !== 'settings') {
     return (
        <SettingsScreen 
           onBack={() => {}} 
           onSave={saveCredentials} 
           currentCreds={credentials} 
        />
     );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      
      {/* --- Top Navigation Bar --- */}
      <header className="flex-none p-4 pb-2 z-20">
        <div className="glass-header rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-white/5">
           
           <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
               <div className="flex items-center gap-2">
                   <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                      <Activity className="text-white" size={20} />
                   </div>
                   <div>
                       <h1 className="text-lg font-black text-white leading-none tracking-tight">NIFTY50<span className="text-blue-500">.AI</span></h1>
                       <p className="text-[10px] text-slate-400 font-mono">LIVE TERMINAL</p>
                   </div>
               </div>
           </div>

           {/* View Switcher (Desktop/Tablet) */}
           <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto w-full md:w-auto">
               <button onClick={() => handleSetViewMode('summary')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'summary' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <PieChart size={14} /> <span className="hidden sm:inline">Cockpit</span>
               </button>
               <button onClick={() => handleSetViewMode('stocks')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'stocks' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <List size={14} /> Stocks
               </button>
               <button onClick={() => handleSetViewMode('options')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'options' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Zap size={14} /> Options
               </button>
               <button onClick={() => handleSetViewMode('history')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'history' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Clock size={14} /> History
               </button>
               <button onClick={() => handleSetViewMode('quant')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'quant' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <BrainCircuit size={14} /> Quant
               </button>
               <button onClick={() => handleSetViewMode('ai')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'ai' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Bot size={14} /> Chat
               </button>
           </div>

           <div className="flex items-center gap-2 w-full md:w-auto justify-end">
               {error && (
                   <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                       <AlertCircle size={14} />
                       <span className="truncate max-w-[150px]">{error}</span>
                   </div>
               )}
               {quantError && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                       <AlertCircle size={14} />
                       <span className="truncate max-w-[150px]">Quant: {quantError}</span>
                   </div>
               )}
               {marketStatusMsg && (
                   <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs">
                       <Moon size={14} />
                       <span className="truncate max-w-[150px]">{marketStatusMsg}</span>
                   </div>
               )}

               <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`p-2 rounded-lg border border-white/10 transition-all ${isPaused ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                  title={isPaused ? "Resume Live Fetch" : "Pause Live Fetch"}
               >
                   {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
               </button>

               <button 
                  onClick={() => refreshData()}
                  disabled={isLoading || isPaused} 
                  className={`p-2 rounded-lg border border-white/10 transition-all ${isLoading ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-blue-400 shadow-lg'}`}
               >
                   <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
               </button>
               <button 
                  onClick={() => handleSetViewMode('settings')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-all shadow-lg"
               >
                   <Settings size={18} />
               </button>
           </div>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        
        {viewMode === 'settings' && (
            <div className="absolute inset-0 z-50 bg-slate-950">
                <SettingsScreen 
                    onBack={() => handleSetViewMode(prevViewModeRef.current)} 
                    onSave={saveCredentials} 
                    currentCreds={credentials} 
                />
            </div>
        )}

        {selectedStock && (
            <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
                <StockDetail 
                    symbol={selectedStock} 
                    credentials={credentials} 
                    onBack={() => setSelectedStock(null)} 
                    sessionData={sessionHistory[selectedStock]}
                />
            </div>
        )}

        {viewMode === 'summary' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <CumulativeView 
                  data={stocks} 
                  latestSnapshot={historyLog[historyLog.length-1]}
                  historyLog={historyLog}
                  onNavigate={handleSetViewMode}
                  onSelectStock={setSelectedStock}
                  marketStatus={marketStatusMsg}
                  quantAnalysis={quantAnalysis}
                  isQuantAnalyzing={isQuantAnalyzing}
                  onRunQuantAnalysis={runQuantAnalysis}
               />
            </div>
        )}

        {viewMode === 'stocks' && (
            <div className="flex flex-col h-full px-4 pb-4">
                <div className="mb-4 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search Nifty 50 stocks..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => downloadCSV(sortedStocks, 'nifty50_stocks')}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                        title="Export Stocks to CSV"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                    <div className="text-xs text-slate-500 font-mono hidden sm:block">
                        {sortedStocks.length} Symbols
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <StockTable 
                        data={sortedStocks} 
                        sortConfig={sortConfig} 
                        onSort={handleSort} 
                        onSelect={setSelectedStock}
                        isLoading={isLoading && stocks.length === 0}
                    />
                </div>
            </div>
        )}

        {viewMode === 'options' && (
            <div className="flex flex-col h-full px-4 pb-4 relative">
                <div className="absolute top-0 right-8 z-30">
                     <button 
                        onClick={() => downloadCSV(optionQuotes, 'nifty50_options')}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-b-lg text-xs text-slate-300 transition-colors shadow-lg backdrop-blur-sm"
                        title="Export Options Chain"
                    >
                        <Download size={12} />
                        <span>CSV</span>
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <OptionChain 
                        quotes={optionQuotes} 
                        niftyLtp={niftyLtp}
                        lastUpdated={lastUpdated ? new Date(lastUpdated) : null}
                        isLoading={isLoading}
                        onSelect={setSelectedStock}
                    />
                </div>
            </div>
        )}

        {viewMode === 'history' && (
            <div className="flex flex-col h-full px-4 pb-4 relative">
                 <div className="absolute top-0 right-8 z-30">
                     <button 
                        onClick={() => downloadCSV(historyLog, 'market_history_log')}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-b-lg text-xs text-slate-300 transition-colors shadow-lg backdrop-blur-sm"
                        title="Export History Log"
                    >
                        <Download size={12} />
                        <span>CSV</span>
                    </button>
                </div>
                <SentimentHistory 
                    history={historyLog} 
                    apiKey={credentials.googleApiKey}
                />
            </div>
        )}
        
        {viewMode === 'quant' && (
            <div className="flex flex-col h-full px-4 pb-4 overflow-hidden">
                <AIQuantDeck 
                   analysis={quantAnalysis}
                   history={quantHistory}
                   isAnalyzing={isQuantAnalyzing}
                   onRunAnalysis={runQuantAnalysis}
                   onClearHistory={handleClearQuantHistory}
                   onSelectAnalysis={setQuantAnalysis}
                   apiKey={credentials.googleApiKey}
                />
            </div>
        )}

        {viewMode === 'ai' && (
            <div className="flex flex-col h-full px-4 pb-4 overflow-hidden">
                <AIView 
                   stocks={stocks}
                   niftyLtp={niftyLtp}
                   historyLog={historyLog}
                   optionQuotes={optionQuotes}
                   apiKey={credentials.googleApiKey}
                />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
