
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List, PieChart, Clock, Zap, Moon, Pause, Play, Download, Bot, BrainCircuit, TrendingUp, Layers, Brain, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { StockTable } from './components/StockTable';
import { StockDetail } from './components/StockDetail';
import { OptionChain } from './components/OptionChain';
import { CumulativeView } from './components/CumulativeView';
import { SentimentHistory } from './components/SentimentHistory';
import { SettingsScreen } from './components/SettingsScreen';
import { AIView } from './components/AIView';
import AILab from './components/AILab';
import { PreMarketAnalyzer } from './components/PreMarketAnalyzer';
import UnifiedAutoTrade from './components/UnifiedAutoTrade';
import PatternDashboard from './components/PatternDashboard';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote, MarketSnapshot, ViewMode, SessionHistoryMap, SessionCandle, SectorMetric, PivotPoints } from './types';
import { fetchQuotes, getNiftyOptionSymbols, fetchYesterdayOHLC } from './services/fyersService';
import { fetchPayTMStocks, fetchPayTMOptions, getNifty50SecurityIds, fetchNiftyIndexLTP, fetchPayTMFromRedis } from './services/paytmService';
import { NIFTY50_SYMBOLS, REFRESH_OPTIONS, NIFTY_WEIGHTAGE, NIFTY_INDEX_SYMBOL, SECTOR_MAPPING } from './constants';
import { dbService } from './services/db';
import { lifecycleManager } from './services/lifecycleManager';
import { downloadCSV } from './services/csv';
import { getMarketTimeInfo, formatDelay } from './utils/marketTime';
import { apiCallTracker, APIStats, callAI } from './services/aiProvider';

// Declare global window cache for PayTM options
declare global {
  interface Window {
    __PAYTM_OPTIONS_CACHE__?: FyersQuote[];
  }
}

const App: React.FC = () => {
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    try {
      const saved = localStorage.getItem('fyers_creds');
      const parsed = saved ? JSON.parse(saved) : { 
        appId: '', 
        accessToken: '', 
        refreshInterval: REFRESH_OPTIONS[3].value,
        dataProvider: 'paytm'
      };
      if (parsed.aiEnabled === undefined) parsed.aiEnabled = true;
      if (parsed.dataProvider === undefined) parsed.dataProvider = 'paytm';
      // Default all AI features to enabled by screen
      if (parsed.aiAutoTradeEnabled === undefined) parsed.aiAutoTradeEnabled = true;
      if (parsed.aiLabEnabled === undefined) parsed.aiLabEnabled = true;
      if (parsed.aiHistoryEnabled === undefined) parsed.aiHistoryEnabled = true;
      return parsed;
    } catch (e) {
      return { 
        appId: '', 
        accessToken: '', 
        refreshInterval: REFRESH_OPTIONS[3].value, 
        aiEnabled: true,
        dataProvider: 'paytm',
        aiAutoTradeEnabled: true,
        aiLabEnabled: true,
        aiHistoryEnabled: true
      };
    }
  });
  
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false); // New flag to track config loading

  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [error, setError] = useState<string | null>(null);
  const [quantError, setQuantError] = useState<string | null>(null);
  const [marketStatusMsg, setMarketStatusMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbLoaded, setIsDbLoaded] = useState(false); // New flag for DB hydration
  const [isPaused, setIsPaused] = useState(false); // Manual fetch pause
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const [stocks, setStocks] = useState<EnrichedFyersQuote[]>([]);
  const [sectors, setSectors] = useState<SectorMetric[]>([]); // New Sector State
  const [pivots, setPivots] = useState<PivotPoints | null>(null); // New Pivot State

  const [optionQuotes, setOptionQuotes] = useState<EnrichedFyersQuote[]>([]);
  const [niftyLtp, setNiftyLtp] = useState<number | null>(null);
  
  // Data States
  const [historyLog, setHistoryLog] = useState<MarketSnapshot[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryMap>({});
  const [quantHistory, setQuantHistory] = useState<any[]>([]);
  const [quantAnalysis, setQuantAnalysis] = useState<any>(null);

  const [apiStats, setApiStats] = useState<APIStats>({
    lastMinute: 0,
    last5Minutes: 0,
    lastHour: 0,
    today: 0,
    total: 0,
    avgDuration: 0,
    successRate: 0,
    geminiCalls: 0,
    groqCalls: 0,
    claudeCalls: 0,
    recentCalls: []
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
  const didFetchPivots = useRef(false);

  // --- 1. Database Hydration & Config Loading (On Mount) ---
  useEffect(() => {
    const initData = async () => {
        try {
            // Try to load encrypted config from backend first
            if (!credentials.paytmAccessToken) {
              setIsLoadingConfig(true);
              try {
                const { fetchEncryptedConfig } = await import('./utils/configLoader');
                const backendConfig = await fetchEncryptedConfig();
                
                if (backendConfig && backendConfig.paytmAccessToken) {
                  console.log('✅ Loaded encrypted config from backend');
                  // Don't overwrite user preferences like refreshInterval
                  // Only merge credentials (tokens and API keys)
                  const { refreshInterval, ...backendCredentials } = backendConfig;
                  const updatedCreds = { ...credentials, ...backendCredentials };
                  setCredentials(updatedCreds);
                  localStorage.setItem('fyers_creds', JSON.stringify(updatedCreds));
                }
              } catch (err) {
                console.log('ℹ️ Backend config not available, using localStorage');
              } finally {
                setIsLoadingConfig(false);
                setConfigLoaded(true); // Mark config as loaded (even if failed)
              }
            } else {
              setConfigLoaded(true); // Already have token
            }
            
            // Check if weekly options need update and trigger auto-discovery
            console.log('📅 Checking weekly options expiry...');
            try {
              const { checkOptionsExpiry } = await import('./utils/optionsAutoUpdate');
              const expiryCheck = checkOptionsExpiry();
              console.log('[Options]', expiryCheck.message);
              
              // Always trigger discovery on startup to ensure Redis cache is populated
              console.log('[Options] 🔄 Triggering automatic options discovery...');
              try {
                const discoverResponse = await fetch('/api/discover-options');
                if (discoverResponse.ok) {
                  const discoverData = await discoverResponse.json();
                  if (discoverData.success) {
                    console.log(`[Options] ✅ Discovered ${discoverData.count} contracts for ${discoverData.expiry}`);
                    if (discoverData.cached) {
                      console.log(`[Options] Using cached data from ${discoverData.discoveredAt}`);
                    }
                  }
                } else {
                  console.warn('[Options] Discovery API returned:', discoverResponse.status);
                }
              } catch (discoverErr) {
                console.warn('[Options] Discovery failed (will use fallback):', discoverErr);
              }
              
              if (expiryCheck.needsUpdate) {
                setMarketStatusMsg('⚠️ Weekly options expired! Auto-discovery attempted.');
              } else if (expiryCheck.daysUntilExpiry <= 2) {
                console.warn('[Options] Expiring soon:', expiryCheck.message);
              }
            } catch (err) {
              console.warn('[Options] Failed to check expiry:', err);
            }
            
            console.log('🔧 Initializing database...');
            await dbService.init();
            console.log('✅ Database initialized');
            
            // Load historical data from Redis (if available)
            console.log('🔍 Attempting to load history from Redis...');
            try {
              const historyResponse = await fetch('/api/get-history?limit=500');
              console.log('📡 Redis API response status:', historyResponse.status);
              
              if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                console.log('📦 Redis response:', historyData);
                
                if (historyData.success && historyData.data?.length > 0) {
                  // FILTER: Only use TODAY's data (IST timezone)
                  const todayIST = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
                  const filteredData = historyData.data.filter((snap: any) => {
                    const snapDateIST = new Date(snap.timestamp).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
                    return snapDateIST === todayIST;
                  });
                  
                  if (filteredData.length === 0) {
                    console.log(`⚠️ No snapshots found for today (${todayIST}), starting fresh`);
                    console.log('✅ Setting isDbLoaded = true');
                    setIsDbLoaded(true);
                    return; // Exit early, will fetch live data
                  }
                  
                  console.log(`📥 Loaded ${filteredData.length} snapshots from TODAY (${todayIST}), filtered from ${historyData.data.length} total`);
                  
                  // Get oldest snapshot for calculating deltas
                  const oldestSnap = filteredData[filteredData.length - 1];
                  const oldestStocks = oldestSnap?.stocks || [];
                  const oldestOptions = oldestSnap?.options || [];
                  
                  // Build initial totals from oldest snapshot
                  let initialStockBuy = 0, initialStockSell = 0;
                  oldestStocks.forEach((s: any) => {
                    initialStockBuy += s.total_buy_quantity || 0;
                    initialStockSell += s.total_sell_quantity || 0;
                  });
                  
                  let initialCallBuy = 0, initialCallSell = 0, initialPutBuy = 0, initialPutSell = 0;
                  oldestOptions.forEach((opt: any) => {
                    const isCE = (opt.symbol || '').includes('CE');
                    const isPE = (opt.symbol || '').includes('PE');
                    if (isCE) {
                      initialCallBuy += opt.total_buy_quantity || 0;
                      initialCallSell += opt.total_sell_quantity || 0;
                    } else if (isPE) {
                      initialPutBuy += opt.total_buy_quantity || 0;
                      initialPutSell += opt.total_sell_quantity || 0;
                    }
                  });
                  
                  console.log('📊 Initial values - Stock Buy:', initialStockBuy, 'Sell:', initialStockSell);
                  console.log('📊 Initial values - Call Buy:', initialCallBuy, 'Sell:', initialCallSell);
                  console.log('📊 Initial values - Put Buy:', initialPutBuy, 'Sell:', initialPutSell);
                  
                  // Convert Redis data to MarketSnapshot format (use filteredData instead of historyData.data)
                  const redisSnapshots: MarketSnapshot[] = filteredData.map((snap: any) => {
                    const stocks = snap.stocks || [];
                    const options = snap.options || [];
                    const niftyLTP = snap.niftyLTP || 0;
                    
                    // Calculate stock metrics
                    const adv = stocks.filter((s: any) => (s.change_percent || 0) > 0).length;
                    const dec = stocks.filter((s: any) => (s.change_percent || 0) < 0).length;
                    
                    // Calculate CURRENT stock totals
                    let totalBuyQty = 0, totalSellQty = 0;
                    stocks.forEach((s: any) => {
                      totalBuyQty += s.total_buy_quantity || 0;
                      totalSellQty += s.total_sell_quantity || 0;
                    });
                    
                    // Calculate stock DELTAS from initial
                    const stockBuyDelta = totalBuyQty - initialStockBuy;
                    const stockSellDelta = totalSellQty - initialStockSell;
                    const stockSent = stockSellDelta !== 0 ? ((stockBuyDelta - stockSellDelta) / Math.abs(stockSellDelta) * 100) : 0;
                    
                    // Calculate CURRENT options totals
                    let callsBuyQty = 0, callsSellQty = 0, callsOI = 0;
                    let putsBuyQty = 0, putsSellQty = 0, putsOI = 0;
                    
                    options.forEach((opt: any) => {
                      const isCE = (opt.symbol || '').includes('CE');
                      const isPE = (opt.symbol || '').includes('PE');
                      
                      if (isCE) {
                        callsBuyQty += opt.total_buy_quantity || 0;
                        callsSellQty += opt.total_sell_quantity || 0;
                        callsOI += opt.oi || 0;
                      } else if (isPE) {
                        putsBuyQty += opt.total_buy_quantity || 0;
                        putsSellQty += opt.total_sell_quantity || 0;
                        putsOI += opt.oi || 0;
                      }
                    });
                    
                    // Calculate options DELTAS from initial
                    const callBuyDelta = callsBuyQty - initialCallBuy;
                    const callSellDelta = callsSellQty - initialCallSell;
                    const putBuyDelta = putsBuyQty - initialPutBuy;
                    const putSellDelta = putsSellQty - initialPutSell;
                    
                    const pcr = callsOI > 0 ? putsOI / callsOI : 0;
                    const callSent = callSellDelta !== 0 ? ((callBuyDelta - callSellDelta) / Math.abs(callSellDelta) * 100) : 0;
                    const putSent = putSellDelta !== 0 ? ((putBuyDelta - putSellDelta) / Math.abs(putSellDelta) * 100) : 0;
                    const optionsSent = callSent - putSent;
                    
                    // Overall sentiment (weighted)
                    const overallSent = (stockSent * 0.7) + (optionsSent * 0.3);
                    
                    // Create proper MarketSnapshot
                    return {
                      timestamp: snap.timestamp,
                      time: new Date(snap.timestamp).toLocaleTimeString('en-IN', { hour12: false }),
                      niftyLtp: niftyLTP,
                      ptsChg: 0, // Will be recalculated
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
                      putsSellQty,
                      callsOI,
                      putsOI
                    };
                  });
                  
                  console.log('🔄 Converted snapshots:', redisSnapshots.length);
                  if (redisSnapshots.length > 0) {
                    console.log('📊 Oldest snapshot (should be ~0):', {
                      time: redisSnapshots[redisSnapshots.length - 1]?.time,
                      callSent: redisSnapshots[redisSnapshots.length - 1]?.callSent?.toFixed(2),
                      putSent: redisSnapshots[redisSnapshots.length - 1]?.putSent?.toFixed(2),
                      optionsSent: redisSnapshots[redisSnapshots.length - 1]?.optionsSent?.toFixed(2)
                    });
                    console.log('📊 Newest snapshot (should have values):', {
                      time: redisSnapshots[0]?.time,
                      callSent: redisSnapshots[0]?.callSent?.toFixed(2),
                      putSent: redisSnapshots[0]?.putSent?.toFixed(2),
                      pcr: redisSnapshots[0]?.pcr?.toFixed(2),
                      optionsSent: redisSnapshots[0]?.optionsSent?.toFixed(2)
                    });
                  }
                  
                  // Calculate ptsChg between snapshots
                  for (let i = 1; i < redisSnapshots.length; i++) {
                    redisSnapshots[i].ptsChg = redisSnapshots[i].niftyLtp - redisSnapshots[i-1].niftyLtp;
                  }
                  
                  // Set Redis data as the source of truth (replace, don't merge)
                  setHistoryLog(redisSnapshots);
                  
                  // Initialize session history and refs from the OLDEST snapshot (last in array since newest-first)
                  if (redisSnapshots.length > 0 && filteredData[filteredData.length - 1]?.stocks) {
                    const oldestSnapshot = filteredData[filteredData.length - 1];
                    const oldestStocks = oldestSnapshot.stocks || [];
                    const oldestOptions = oldestSnapshot.options || [];
                    
                    console.log(`🔧 Initializing refs from oldest snapshot with ${oldestStocks.length} stocks and ${oldestOptions.length} options`);
                    
                    // Data is now always in FyersQuote format - directly initialize refs
                    oldestStocks.forEach((stock: any) => {
                      if (stock.symbol) {
                        initialStocksRef.current[stock.symbol] = {
                          symbol: stock.symbol,
                          lp: stock.lp || 0,
                          total_buy_qty: stock.total_buy_qty || 0,
                          total_sell_qty: stock.total_sell_qty || 0,
                        } as FyersQuote;
                      }
                    });
                    
                    // Data is now always in FyersQuote format - directly initialize refs
                    oldestOptions.forEach((option: any) => {
                      if (option.symbol) {
                        initialOptionsRef.current[option.symbol] = {
                          symbol: option.symbol,
                          lp: option.lp || 0,
                          total_buy_qty: option.total_buy_qty || 0,
                          total_sell_qty: option.total_sell_qty || 0,
                        } as FyersQuote;
                      }
                    });
                    
                    console.log(`✅ Initialized ${Object.keys(initialStocksRef.current).length} stock refs and ${Object.keys(initialOptionsRef.current).length} option refs`);
                    if (Object.keys(initialStocksRef.current).length > 0) {
                      console.log('📝 Sample stock symbols:', Object.keys(initialStocksRef.current).slice(0, 3));
                    }
                    if (Object.keys(initialOptionsRef.current).length > 0) {
                      console.log('📝 Sample option symbols:', Object.keys(initialOptionsRef.current).slice(0, 3));
                    }
                    
                    // Build sessionHistory from TODAY's Redis snapshots
                    console.log('📊 Building sessionHistory from TODAY\'s Redis snapshots...');
                    const sessionHistoryMap: SessionHistoryMap = {};
                    
                    // Process snapshots in chronological order (oldest to newest) - use filteredData
                    for (let i = filteredData.length - 1; i >= 0; i--) {
                      const snap = filteredData[i];
                      const timeStr = new Date(snap.timestamp).toLocaleTimeString('en-IN', { hour12: false });
                      const stocks = snap.stocks || [];
                      const options = snap.options || [];
                      
                      // Process stocks - data is now always in FyersQuote format
                      stocks.forEach((stock: any) => {
                        const symbol = stock.symbol;
                        if (!symbol) return;
                        
                        if (!sessionHistoryMap[symbol]) {
                          sessionHistoryMap[symbol] = [];
                        }
                        
                        // Calculate day changes using initialRef
                        const initial = initialStocksRef.current[symbol];
                        const lp_chg_day_p = initial && initial.lp !== 0 
                          ? ((stock.lp - initial.lp) / initial.lp) * 100 
                          : 0;
                        const bid_chg_day_p = initial && initial.total_buy_qty !== 0
                          ? ((stock.total_buy_qty - initial.total_buy_qty) / initial.total_buy_qty) * 100
                          : 0;
                        const ask_chg_day_p = initial && initial.total_sell_qty !== 0
                          ? ((stock.total_sell_qty - initial.total_sell_qty) / initial.total_sell_qty) * 100
                          : 0;
                        const day_net_strength = bid_chg_day_p - ask_chg_day_p;
                        
                        sessionHistoryMap[symbol].push({
                          time: timeStr,
                          timestamp: snap.timestamp,
                          lp: stock.lp || 0,
                          volume: stock.volume || 0,
                          chp: stock.chp || 0,
                          lp_chg_1m_p: 0,
                          lp_chg_day_p,
                          total_buy_qty: stock.total_buy_qty || 0,
                          total_sell_qty: stock.total_sell_qty || 0,
                          bid_qty_chg_p: 0,
                          bid_chg_day_p,
                          ask_qty_chg_p: 0,
                          ask_chg_day_p,
                          net_strength_1m: 0,
                          day_net_strength
                        });
                      });
                      
                      // Process options - data is now always in FyersQuote format
                      options.forEach((option: any) => {
                        const symbol = option.symbol;
                        if (!symbol) return;
                        
                        if (!sessionHistoryMap[symbol]) {
                          sessionHistoryMap[symbol] = [];
                        }
                        
                        // Calculate day changes using initialRef
                        const initial = initialOptionsRef.current[symbol];
                        const lp_chg_day_p = initial && initial.lp !== 0 
                          ? ((option.lp - initial.lp) / initial.lp) * 100 
                          : 0;
                        const bid_chg_day_p = initial && initial.total_buy_qty !== 0
                          ? ((option.total_buy_qty - initial.total_buy_qty) / initial.total_buy_qty) * 100
                          : 0;
                        const ask_chg_day_p = initial && initial.total_sell_qty !== 0
                          ? ((option.total_sell_qty - initial.total_sell_qty) / initial.total_sell_qty) * 100
                          : 0;
                        const day_net_strength = bid_chg_day_p - ask_chg_day_p;
                        
                        sessionHistoryMap[symbol].push({
                          time: timeStr,
                          timestamp: snap.timestamp,
                          lp: option.lp || 0,
                          volume: option.volume || 0,
                          chp: option.chp || 0,
                          lp_chg_1m_p: 0,
                          lp_chg_day_p,
                          total_buy_qty: option.total_buy_qty || 0,
                          total_sell_qty: option.total_sell_qty || 0,
                          bid_qty_chg_p: 0,
                          bid_chg_day_p,
                          ask_qty_chg_p: 0,
                          ask_chg_day_p,
                          net_strength_1m: 0,
                          day_net_strength
                        });
                      });
                    }
                    
                    setSessionHistory(sessionHistoryMap);
                    const totalSymbols = Object.keys(sessionHistoryMap).length;
                    const sampleSymbol = Object.keys(sessionHistoryMap)[0];
                    const sampleCount = sessionHistoryMap[sampleSymbol]?.length || 0;
                    console.log(`✅ Built sessionHistory: ${totalSymbols} symbols, ~${sampleCount} candles each`);
                    
                    // Count stock vs option symbols
                    const stockSymbols = Object.keys(sessionHistoryMap).filter(s => !s.includes('CE') && !s.includes('PE'));
                    const optionSymbols = Object.keys(sessionHistoryMap).filter(s => s.includes('CE') || s.includes('PE'));
                    console.log(`📊 SessionHistory breakdown: ${stockSymbols.length} stocks, ${optionSymbols.length} options`);
                    if (optionSymbols.length > 0) {
                      console.log(`📊 Sample option history symbols:`, optionSymbols.slice(0, 3));
                      console.log(`📊 Sample option history length:`, sessionHistoryMap[optionSymbols[0]]?.length);
                    }
                  }
                  
                  console.log(`✅ Restored ${redisSnapshots.length} historical snapshots from Redis`);
                } else {
                  console.log('⚠️ Redis response successful but no data:', historyData);
                }
              } else {
                console.log('❌ Redis API returned non-OK status:', historyResponse.status);
              }
            } catch (err) {
              console.error('❌ Redis history load error:', err);
            }
            
            // Check if new trading day for archival purposes only
            const isNewDay = await lifecycleManager.isNewTradingDay();
            
            if (isNewDay) {
                // NEW DAY: Run morning setup (archives previous day)
                console.log('🌅 New trading day detected');
                const setupResult = await lifecycleManager.morningSetup();
                
                console.log('Morning Setup:', setupResult);
                
                // Show notification
                if (setupResult.archivedDate) {
                    setMarketStatusMsg(
                        `🌅 Good Morning! Archived ${setupResult.archivedDate} (${setupResult.snapshotCount} snapshots)`
                    );
                    setTimeout(() => setMarketStatusMsg(null), 5000);
                }
            }
            
            // Note: historyLog already populated from Redis above
            // All users see the same Redis data - no local IndexedDB override
            
            // Setup auto-archive (runs at 3:45 PM)
            lifecycleManager.setArchiveCallback((message) => {
                setMarketStatusMsg(message);
                setTimeout(() => setMarketStatusMsg(null), 8000);
            });
            lifecycleManager.setupAutoArchive();
            
        } catch (e) {
            console.error("❌ DB Init Failed", e);
            setError("Database initialization failed");
        } finally {
            console.log('✅ Setting isDbLoaded = true');
            setIsDbLoaded(true);
        }
    };
    
    // Add timeout safety - ensure loading screen doesn't hang forever
    const timeoutId = setTimeout(() => {
        console.warn('⚠️ Init timeout - forcing isDbLoaded = true');
        setIsDbLoaded(true);
    }, 5000); // 5 second timeout
    
    initData().finally(() => clearTimeout(timeoutId));
    
    // Cleanup on unmount
    return () => {
        clearTimeout(timeoutId);
        lifecycleManager.stopAutoArchive();
    };
  }, []);

  // Subscribe to API call tracker
  useEffect(() => {
    // Initialize with current stats
    setApiStats(apiCallTracker.getStats());
    
    const unsubscribe = apiCallTracker.subscribe((stats) => {
      setApiStats(stats);
    });
    return unsubscribe;
  }, []);


  // --- 1.2 Pivot Calculation (One-time) ---
  useEffect(() => {
     const initPivots = async () => {
        // Only works with Fyers (has history API)
        if (credentials.dataProvider === 'paytm' || !credentials.appId || !credentials.accessToken || didFetchPivots.current) return;
        didFetchPivots.current = true;
        
        try {
            const data = await fetchYesterdayOHLC(NIFTY_INDEX_SYMBOL, credentials);
            if (data) {
                const { high: h, low: l, close: c } = data;
                const p = (h + l + c) / 3;
                const bc = (h + l) / 2;
                const tc = (p - bc) + p;
                
                setPivots({
                    pivot: p,
                    r1: (2 * p) - l,
                    s1: (2 * p) - h,
                    r2: p + (h - l),
                    s2: p - (h - l),
                    cpr_bc: bc,
                    cpr_tc: tc,
                    dayHigh: h,
                    dayLow: l
                });
            }
        } catch (e) {
            console.error("Failed to calc pivots", e);
        }
     };
     initPivots();
  }, [credentials]);

  // --- 2. Database Persistence (Debounced) ---
  useEffect(() => {
      if (!isDbLoaded || historyLog.length === 0) return;
      
      // Save the latest snapshot (now at index 0 since data is newest-first)
      const latestSnap = historyLog[0];
      if (latestSnap) {
          dbService.saveSnapshot(latestSnap).catch(e => console.error("Failed to save snapshot", e));
      }
  }, [historyLog, isDbLoaded]);

  useEffect(() => {
    if (!isDbLoaded) return;
    const timer = setTimeout(() => {
        const entries = Object.entries(sessionHistory);
        if(entries.length === 0) return;
        entries.forEach(([symbol, candlesVal]) => {
            const candles = candlesVal as SessionCandle[];
            if (candles && candles.length > 0) {
                 dbService.saveStockSession(symbol, candles).catch(console.error);
            }
        });
    }, 8000); 
    return () => clearTimeout(timer);
  }, [sessionHistory, isDbLoaded]);


  const saveCredentials = (newCreds: FyersCredentials) => {
    console.log('💾 [App.tsx] saveCredentials called with refreshInterval:', newCreds.refreshInterval);
    setCredentials(newCreds); 
    try {
        localStorage.setItem('fyers_creds', JSON.stringify(newCreds));
        console.log('✅ [App.tsx] Credentials saved to localStorage');
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
    setSelectedStock(null); 
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
      // Debug: Log first few symbols to verify initialization
      if (currentData.length > 0 && Object.keys(initialRef.current).length > 0) {
        const firstSymbol = currentData[0].symbol;
        const hasInitial = !!initialRef.current[firstSymbol];
        if (!hasInitial) {
          console.warn(`⚠️ enrichData: Symbol "${firstSymbol}" not found in initialRef. Available:`, Object.keys(initialRef.current).slice(0, 3));
        }
      }
      
      return currentData.map(curr => {
        const prev = prevRef.current[curr.symbol];
        
        if (!initialRef.current[curr.symbol]) {
           console.warn(`⚠️ Missing initial for ${curr.symbol}, using current as fallback`);
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
        
        let weight, index_contribution, sector;
        if (isStock) {
            const symbolKey = curr.short_name || curr.symbol.replace('NSE:', '').replace('-EQ', '');
            weight = NIFTY_WEIGHTAGE[symbolKey] || 0.1; 
            index_contribution = (lp_chg_day_p || 0) * weight;
            sector = SECTOR_MAPPING[symbolKey] || 'OTHER';
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
          index_contribution,
          sector
        };
      });
  };

  const calculateSectors = (stocks: EnrichedFyersQuote[]) => {
      const sectMap: Record<string, SectorMetric> = {};
      
      stocks.forEach(s => {
          const name = s.sector || 'OTHER';
          if (!sectMap[name]) {
              sectMap[name] = { name, weight: 0, change_p: 0, contribution: 0, bullish_stocks: 0, bearish_stocks: 0 };
          }
          const m = sectMap[name];
          const w = s.weight || 0;
          m.weight += w;
          m.contribution += (s.index_contribution || 0);
          if ((s.lp_chg_day_p || 0) > 0) m.bullish_stocks++;
          else m.bearish_stocks++;
      });

      return Object.values(sectMap).map(m => ({
          ...m,
          change_p: m.weight > 0 ? m.contribution / m.weight : 0
      })).sort((a,b) => b.contribution - a.contribution);
  };

  const runFeedbackLoop = useCallback((currentLtp: number) => {
      setQuantHistory(prev => {
          const now = Date.now();
          let updated = false;
          const newHistory = prev.map(record => {
               // Feedback loop reduced to 5 mins (300000ms)
               if (!record.result && (now - record.timestamp > 300000)) { 
                   updated = true;
                   let result: 'WIN' | 'LOSS' | 'NEUTRAL' = 'NEUTRAL';
                   const entry = record.entryLtp || currentLtp; // Fallback
                   
                   if (record.signal.signal === 'LONG') {
                       if (currentLtp > entry + 5) result = 'WIN';
                       else if (currentLtp < entry - 5) result = 'LOSS';
                   } else if (record.signal.signal === 'SHORT') {
                       if (currentLtp < entry - 5) result = 'WIN';
                       else if (currentLtp > entry + 5) result = 'LOSS';
                   }

                   return { ...record, result, exitLtp: currentLtp };
               }
               return record;
          });
          return updated ? newHistory : prev;
      });
  }, []);

  const refreshData = useCallback(async () => {
    // Wait for config to load before fetching
    if (!configLoaded) {
      console.log('⏳ [App] Waiting for config to load...');
      return;
    }
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
    console.log(`\n🔄 ======== REFRESH DATA CALLED at ${timeStr} ========`);
    console.log(`📊 Refresh Interval Setting: ${credentials.refreshInterval}ms (${(credentials.refreshInterval || 60000) / 1000}s)`);
    
    // Check credentials based on provider
    const hasValidCredentials = credentials.dataProvider === 'paytm' 
      ? credentials.paytmAccessToken 
      : (credentials.appId && credentials.accessToken);
      
    if (!hasValidCredentials || !isDbLoaded) return;

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
            if (stocks.length > 0) {
               setIsLoading(false);
               return; 
            }
        }
    }

    try {
      // Use PayTM or Fyers based on dataProvider setting
      let stockData: FyersQuote[];
      let niftyLtpVal = 0;
      
      console.log(`📊 [App] Starting data fetch - Provider: ${credentials.dataProvider}`);
      
      if (credentials.dataProvider === 'paytm') {
        // Determine fetch strategy based on refresh interval
        // If user has fast refresh (< 60 seconds), fetch LIVE data
        // If user has slow refresh (>= 60 seconds) or default, use Redis cache
        const refreshIntervalValue = credentials.refreshInterval || 60000;
        const useLiveData = credentials.paytmAccessToken && refreshIntervalValue < 60000;
        
        console.log(`📊 [Fetch Strategy] refreshInterval: ${refreshIntervalValue}ms, useLiveData: ${useLiveData}, hasToken: ${!!credentials.paytmAccessToken}`);
        
        if (useLiveData) {
          console.log('🚀 [PayTM] Fast refresh mode - fetching LIVE data...');
          
          const [liveStocks, liveNiftyLTP] = await Promise.all([
            fetchPayTMStocks(credentials),
            fetchNiftyIndexLTP(credentials)
          ]);
          
          stockData = liveStocks;
          niftyLtpVal = liveNiftyLTP;
          console.log(`✅ [PayTM] LIVE: ${stockData.length} stocks, Nifty: ${niftyLtpVal}`);
          console.log(`✅ [LIVE Data Check] Sample timestamps:`, liveStocks.slice(0, 2).map(s => ({
            symbol: s.symbol,
            tt: s.tt,
            ttFormatted: s.tt ? new Date(Number(s.tt)).toLocaleTimeString() : 'N/A',
            ageSeconds: s.tt ? Math.round((Date.now() - Number(s.tt)) / 1000) : 'N/A'
          })));
          
          // Fetch and cache options
          let optionsData: any[] = [];
          if (niftyLtpVal > 0) {
            try {
              optionsData = await fetchPayTMOptions(niftyLtpVal, credentials);
              console.log(`✅ [PayTM] LIVE: ${optionsData.length} options`);
              window.__PAYTM_OPTIONS_CACHE__ = optionsData;
              
              // Initialize refs if needed
              if (Object.keys(initialOptionsRef.current).length === 0 && optionsData.length > 0) {
                console.log('🔧 [App] Initializing options refs from LIVE data');
                optionsData.forEach(opt => {
                  initialOptionsRef.current[opt.symbol] = opt;
                  prevOptionsRef.current[opt.symbol] = opt;
                });
              }
            } catch (optError) {
              console.warn('[PayTM] Options fetch failed:', optError);
            }
          }
          
          // Initialize stock refs if needed
          if (Object.keys(initialStocksRef.current).length === 0 && liveStocks.length > 0) {
            console.log('🔧 [App] Initializing stock refs from LIVE data');
            liveStocks.forEach(stock => {
              initialStocksRef.current[stock.symbol] = stock;
              prevStocksRef.current[stock.symbol] = stock;
            });
          }
          
          // Save to Redis in background (non-blocking)
          fetch('/api/save-redis-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              stocks: stockData, 
              options: optionsData, 
              niftyLTP: niftyLtpVal 
            })
          }).then(() => {
            console.log('💾 [Redis] Background save successful');
          }).catch(err => {
            console.warn('⚠️ [Redis] Background save failed (non-critical):', err.message);
          });
          
        } else if (credentials.paytmAccessToken) {
          console.log('🚀 [PayTM] Standard refresh mode - loading from Redis cache...');
          
          // Try Redis first for instant load
          const redisData = await fetchPayTMFromRedis();
          
          if (redisData && redisData.stocks.length > 0) {
            console.log(`📦 [Redis] Loaded: ${redisData.stocks.length} stocks, ${redisData.options?.length || 0} options, Nifty: ${redisData.niftyLTP}`);
            stockData = redisData.stocks;
            niftyLtpVal = redisData.niftyLTP;
            
            // Load options from Redis cache
            if (redisData.options && redisData.options.length > 0) {
              window.__PAYTM_OPTIONS_CACHE__ = redisData.options;
              console.log(`✅ [Redis] Options cache loaded: ${redisData.options.length} contracts`);
              console.log(`📊 [Redis] Sample option symbols:`, redisData.options.slice(0, 3).map(o => o.symbol));
              
              // Initialize refs for first-time options OR update if symbols don't match
              const needsInit = Object.keys(initialOptionsRef.current).length === 0;
              const firstCacheSymbol = redisData.options[0]?.symbol;
              const hasMatchingSymbol = firstCacheSymbol && initialOptionsRef.current[firstCacheSymbol];
              
              if (needsInit || !hasMatchingSymbol) {
                console.log('🔧 [App] Initializing options refs from Redis (needsInit:', needsInit, ', hasMatch:', hasMatchingSymbol, ')');
                redisData.options.forEach(opt => {
                  initialOptionsRef.current[opt.symbol] = opt;
                  prevOptionsRef.current[opt.symbol] = opt;
                });
                console.log(`✅ [App] Initialized ${Object.keys(initialOptionsRef.current).length} options refs`);
              } else {
                console.log('ℹ️ [App] Options refs already initialized, skipping');
              }
            }
            
            // Initialize stock refs if not already done
            const needsStockInit = Object.keys(initialStocksRef.current).length === 0;
            if (needsStockInit && redisData.stocks.length > 0) {
              console.log('🔧 [App] Initializing stock refs from Redis');
              redisData.stocks.forEach(stock => {
                initialStocksRef.current[stock.symbol] = stock;
                prevStocksRef.current[stock.symbol] = stock;
              });
              console.log(`✅ [App] Initialized ${Object.keys(initialStocksRef.current).length} stock refs`);
            }
            
            // Optionally: Fetch live data in background to update Redis (non-blocking)
            // This ensures next load is fresh without making user wait
            Promise.all([
              fetchPayTMStocks(credentials),
              fetchNiftyIndexLTP(credentials)
            ]).then(async ([liveStocks, liveNiftyLTP]) => {
              const liveOptions = liveNiftyLTP > 0 ? await fetchPayTMOptions(liveNiftyLTP, credentials) : [];
              
              // Save to Redis for next time
              fetch('/api/save-redis-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  stocks: liveStocks, 
                  options: liveOptions, 
                  niftyLTP: liveNiftyLTP 
                })
              }).then(() => {
                console.log('💾 [Redis] Background refresh successful');
              }).catch(err => {
                console.warn('⚠️ [Redis] Background refresh failed:', err.message);
              });
            }).catch(err => {
              console.warn('⚠️ [PayTM] Background live fetch failed (non-critical):', err.message);
            });
            
          } else {
            // No Redis data, fetch live (first load scenario)
            console.log('⚠️ [Redis] No cache available, fetching LIVE...');
            
            const [liveStocks, liveNiftyLTP] = await Promise.all([
              fetchPayTMStocks(credentials),
              fetchNiftyIndexLTP(credentials)
            ]);
            
            stockData = liveStocks;
            niftyLtpVal = liveNiftyLTP;
            console.log(`✅ [PayTM] LIVE: ${stockData.length} stocks, Nifty: ${niftyLtpVal}`);
            
            // Fetch options
            let optionsData: any[] = [];
            if (niftyLtpVal > 0) {
              try {
                optionsData = await fetchPayTMOptions(niftyLtpVal, credentials);
                console.log(`✅ [PayTM] LIVE: ${optionsData.length} options`);
                window.__PAYTM_OPTIONS_CACHE__ = optionsData;
                
                // Initialize refs for first-time options
                if (Object.keys(initialOptionsRef.current).length === 0 && optionsData.length > 0) {
                  console.log('🔧 [App] Initializing options refs');
                  optionsData.forEach(opt => {
                    initialOptionsRef.current[opt.symbol] = opt;
                    prevOptionsRef.current[opt.symbol] = opt;
                  });
                }
              } catch (optError) {
                console.warn('[PayTM] Options fetch failed:', optError);
              }
            }
            
            // Save to Redis in background (non-blocking, async)
            fetch('/api/save-redis-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                stocks: stockData, 
                options: optionsData, 
                niftyLTP: niftyLtpVal 
              })
            }).then(() => {
              console.log('💾 [Redis] Background save successful');
            }).catch(err => {
              console.warn('⚠️ [Redis] Background save failed (non-critical):', err.message);
            });
          }
        } else {
          // No token - must use Redis
          console.log('⚠️ [PayTM] No access token, using Redis only');
          const redisData = await fetchPayTMFromRedis();
          
          if (redisData && redisData.stocks.length > 0) {
            stockData = redisData.stocks;
            niftyLtpVal = redisData.niftyLTP;
            if (redisData.options && redisData.options.length > 0) {
              window.__PAYTM_OPTIONS_CACHE__ = redisData.options;
            }
          } else {
            throw new Error('No Redis data and no PayTM token available');
          }
        }
      } else {
        console.log('[App] Using Fyers API');
        stockData = await fetchQuotes(NIFTY50_SYMBOLS, credentials);
        console.log(`📊 [Mobile Debug] Fetched ${stockData.length} stocks from Fyers`);
        
        if (stockData.length === 0) {
          console.error('❌ [Mobile Debug] No stock data returned!');
          setIsLoading(false);
          return;
        }
        
        const indexQuote = await fetchQuotes([NIFTY_INDEX_SYMBOL], credentials);
        niftyLtpVal = indexQuote.length > 0 ? indexQuote[0].lp : 0;
      }
      
      setNiftyLtp(niftyLtpVal);

      const enrichedStocks = enrichData(stockData, prevStocksRef, initialStocksRef, true);
      console.log(`📊 [Mobile Debug] Enriched ${enrichedStocks.length} stocks, setting state...`);
      console.log(`📊 [Data Debug] Sample stock data:`, enrichedStocks.slice(0, 2).map(s => ({ 
        symbol: s.symbol, 
        lp: s.lp, 
        tt: s.tt,
        ttFormatted: s.tt ? new Date(Number(s.tt)).toLocaleTimeString() : 'N/A'
      })));
      setStocks(enrichedStocks);
      updateSessionHistory(enrichedStocks);

      // Calculate Sectors
      const sectorMetrics = calculateSectors(enrichedStocks);
      setSectors(sectorMetrics);
      
      // Run Feedback Loop
      if (niftyLtpVal > 0) runFeedbackLoop(niftyLtpVal);

      // --- Option Chain Logic ---
      if (niftyLtpVal > 0) {
          let rawOptions: FyersQuote[];
          
          if (credentials.dataProvider === 'paytm') {
            // In fast refresh mode (< 60s), always fetch live options
            // In standard mode (>= 60s), use Redis cache
            const shouldFetchLiveOptions = credentials.paytmAccessToken && (credentials.refreshInterval || 60000) < 60000;
            
            if (shouldFetchLiveOptions) {
              // Fast refresh: Fetch LIVE options every time
              console.log(`[App] Fast refresh mode - fetching LIVE options for Nifty: ${niftyLtpVal}`);
              try {
                rawOptions = await fetchPayTMOptions(niftyLtpVal, credentials);
                console.log(`[App] Fetched ${rawOptions.length} LIVE options from PayTM API`);
                // Update cache for other components that might use it
                window.__PAYTM_OPTIONS_CACHE__ = rawOptions;
              } catch (optError) {
                console.warn('[App] Failed to fetch live options:', optError);
                // Fallback to cache if live fetch fails
                rawOptions = window.__PAYTM_OPTIONS_CACHE__ || [];
              }
            } else if (window.__PAYTM_OPTIONS_CACHE__ && window.__PAYTM_OPTIONS_CACHE__.length > 0) {
              // Standard refresh: Use Redis cache
              console.log(`[App] Using ${window.__PAYTM_OPTIONS_CACHE__.length} options from Redis cache`);
              rawOptions = window.__PAYTM_OPTIONS_CACHE__;
            } else if (credentials.paytmAccessToken) {
              // Fallback: Fetch options if we have a valid token but no cache
              try {
                rawOptions = await fetchPayTMOptions(niftyLtpVal, credentials);
                console.log(`[App] Fetched ${rawOptions.length} options from PayTM API (cache miss)`);
                window.__PAYTM_OPTIONS_CACHE__ = rawOptions;
              } catch (optError) {
                console.warn('[App] Failed to fetch options data:', optError);
                rawOptions = []; // Continue without options data
              }
            } else {
              console.log('[App] Skipping options fetch - no PayTM token available');
              rawOptions = []; // Skip options if no token
            }
          } else {
            const optionSymbols = getNiftyOptionSymbols(niftyLtpVal);
            rawOptions = await fetchQuotes(optionSymbols, credentials);
          }
          
          console.log(`[App] Processing ${rawOptions.length} raw options for enrichment`);
          const enrichedOptions = enrichData(rawOptions, prevOptionsRef, initialOptionsRef, false);
          console.log(`[App] Enriched ${enrichedOptions.length} options, setting to state`);
          setOptionQuotes(enrichedOptions);
          updateSessionHistory(enrichedOptions);
          
          // --- Market Snapshot ---
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

          // Check if we need to add a new snapshot (newest first, so check [0])
          const lastLogTime = historyLog.length > 0 ? historyLog[0].time : '';
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
                  putsSellQty,
                  callsOI,
                  putsOI
              };
              // Add new snapshot at the beginning (newest first)
              setHistoryLog(prev => [snapshot, ...prev]);
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
  }, [credentials, isDbLoaded, historyLog, sessionHistory, stocks.length, runFeedbackLoop]); // Added runFeedbackLoop

  // Stable Interval Logic
  const refreshDataRef = useRef(refreshData);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  useEffect(() => {
    const hasValidCreds = credentials.dataProvider === 'paytm' 
      ? credentials.paytmAccessToken 
      : (credentials.appId && credentials.accessToken);
      
    console.log(`📊 [Mobile Debug] Auto-fetch check - isDbLoaded: ${isDbLoaded}, hasValidCreds: ${hasValidCreds}, isPaused: ${isPaused}, provider: ${credentials.dataProvider}`);
    console.log(`⏰ [Interval Debug] Current refreshInterval from credentials: ${credentials.refreshInterval}ms`);
      
    if (isDbLoaded && hasValidCreds && !isPaused) {
      // Get market time info
      const marketInfo = getMarketTimeInfo();
      
      console.log(`📊 [Mobile Debug] Market info - isBeforeStart: ${marketInfo.isBeforeMarketStart}, bypassMarketHours: ${credentials.bypassMarketHours}`);
      
      // Don't call API before 9:17 AM IST unless bypass is enabled
      if (marketInfo.isBeforeMarketStart && !credentials.bypassMarketHours) {
        // Schedule first call at 9:17 AM IST
        const delayTime = formatDelay(marketInfo.delayUntil917);
        
        console.log(`⏰ Config loaded before market start. First API call scheduled at 9:17 AM IST (in ${delayTime})`);
        setMarketStatusMsg(`⏰ First data fetch at 9:17 AM IST (in ${delayTime})`);
        
        const timeoutId = setTimeout(() => {
          console.log('🔔 9:17 AM IST reached - Starting live data fetch');
          setMarketStatusMsg(null);
          refreshDataRef.current();
          
          // Start regular interval after first call
          console.log(`⏰ Setting up interval (after market start delay) with ${credentials.refreshInterval}ms refresh rate`);
          const intervalId = setInterval(() => {
            if (refreshDataRef.current) {
              refreshDataRef.current();
            }
          }, credentials.refreshInterval || 30000);
          
          // Store intervalId for cleanup
          (timeoutId as any).intervalId = intervalId;
        }, marketInfo.delayUntil917);
        
        return () => {
          clearTimeout(timeoutId);
          if ((timeoutId as any).intervalId) {
            clearInterval((timeoutId as any).intervalId);
          }
        };
      } else {
        // Normal behavior: call immediately and set up interval
        console.log('🚀 Starting live data fetch');
        refreshDataRef.current();
        
        console.log(`⏰ Setting up interval with ${credentials.refreshInterval}ms refresh rate`);
        const intervalId = setInterval(() => {
          if (refreshDataRef.current) {
            refreshDataRef.current();
          }
        }, credentials.refreshInterval || 30000);
        
        return () => clearInterval(intervalId);
      }
    }
  }, [configLoaded, isDbLoaded, credentials.appId, credentials.accessToken, credentials.paytmAccessToken, credentials.dataProvider, isPaused, credentials.refreshInterval, credentials.bypassMarketHours]);


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

  // Check if user has configured credentials based on provider
  const hasCredentials = credentials.dataProvider === 'paytm' 
    ? credentials.paytmAccessToken 
    : credentials.appId;
  
  // Show loading state while fetching config from backend
  if (isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading configuration...</p>
        </div>
      </div>
    );
  }
    
  if (!hasCredentials && viewMode !== 'settings') {
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
           <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto w-full md:w-auto custom-scrollbar">
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
               <button onClick={() => handleSetViewMode('patterns')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'patterns' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Brain size={14} /> Patterns
               </button>
               <button onClick={() => handleSetViewMode('premarket')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'premarket' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <TrendingUp size={14} /> PreMkt
               </button>
               <button onClick={() => handleSetViewMode('autotrade')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'autotrade' ? 'bg-purple-600 text-white shadow-md animate-pulse' : 'text-slate-400 hover:text-white'}`}>
                   <Layers size={14} /> AutoTrade
               </button>
               <button onClick={() => handleSetViewMode('ai')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'ai' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Sparkles size={14} /> AI Lab
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

               {credentials.aiEnabled && apiStats.today > 0 && (
                   <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-300 text-xs font-mono">
                       <Bot size={12} />
                       AI: {apiStats.lastMinute}/min • {apiStats.today} today • {apiStats.avgDuration.toFixed(0)}ms
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
                  latestSnapshot={historyLog[0]}
                  historyLog={historyLog}
                  onNavigate={handleSetViewMode}
                  onSelectStock={setSelectedStock}
                  marketStatus={marketStatusMsg}
                  sectors={sectors}
                  aiEnabled={credentials.aiEnabled}
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
                    {stocks.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                            <AlertCircle size={48} />
                            <p>No stock data available</p>
                            <p className="text-xs">Check browser console for errors</p>
                        </div>
                    )}
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
                <SentimentHistory 
                    history={historyLog} 
                    credentials={credentials}
                    aiEnabled={credentials.aiEnabled}
                />
            </div>
        )}

        {viewMode === 'ai' && (
            <div className="flex flex-col h-full overflow-hidden">
                <AILab 
                   currentSnapshot={historyLog[0] || null}
                   niftyLtp={niftyLtp}
                   stocks={stocks}
                   historyLog={historyLog}
                />
            </div>
        )}

        {viewMode === 'premarket' && (
            <div className="flex flex-col h-full px-4 pb-4 overflow-hidden">
                <PreMarketAnalyzer 
                   credentials={credentials}
                   aiEnabled={credentials.aiEnabled}
                />
            </div>
        )}

        {viewMode === 'autotrade' && (
            <div className="flex flex-col h-full overflow-hidden">
                <UnifiedAutoTrade 
                   credentials={credentials}
                   stocks={stocks || []}
                   niftyLtp={niftyLtp}
                   historyLog={historyLog || []}
                   pivots={pivots}
                   aiEnabled={credentials.aiEnabled}
                />
            </div>
        )}

        {viewMode === 'patterns' && (
            <div className="flex flex-col h-full overflow-hidden">
                <PatternDashboard 
                   currentSnapshot={historyLog[0] || null}
                   niftyLtp={niftyLtp}
                   credentials={credentials}
                />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
