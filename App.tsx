
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Settings, RefreshCw, Activity, Search, AlertCircle, BarChart3, List, PieChart, Clock, Zap, Moon, Pause, Play, Download, Bot, BrainCircuit, TrendingUp, Layers, Brain, Sparkles, Eye, GraduationCap } from 'lucide-react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import UnifiedAutoTrade from './components/UnifiedAutoTrade';
import PatternDashboard from './components/PatternDashboard';
import VisionAnalysis from './components/VisionAnalysis';
import PaperTrading from './components/PaperTrading';
import OpeningPilot from './components/OpeningPilot';
import { FyersCredentials, FyersQuote, SortConfig, SortField, EnrichedFyersQuote, MarketSnapshot, ViewMode, SessionHistoryMap, SessionCandle, SectorMetric, PivotPoints } from './types';
import { fetchQuotes, getNiftyOptionSymbols, fetchYesterdayOHLC } from './services/fyersService';
import { fetchPayTMStocks, fetchPayTMOptions, getNifty50SecurityIds, fetchNiftyIndexLTP, fetchPayTMFromRedis } from './services/paytmService';
import { NIFTY50_SYMBOLS, REFRESH_OPTIONS, NIFTY_WEIGHTAGE, NIFTY_INDEX_SYMBOL, SECTOR_MAPPING } from './constants';
import { dbService } from './services/db';
import { scheduleBackground } from './services/heartbeat';
import { lifecycleManager } from './services/lifecycleManager';
import { downloadCSV } from './services/csv';
import { getMarketTimeInfo, formatDelay } from './utils/marketTime';
import { apiCallTracker, APIStats, callAI } from './services/aiProvider';
import { istMinutesOf } from './services/sniperEngine';
import { dayStrength, isUsableBaseline, shouldAnchorSymbol } from './services/marketStrength';

// Declare global window cache for PayTM options
declare global {
  interface Window {
    __PAYTM_OPTIONS_CACHE__?: FyersQuote[];
  }
}

/**
 * One snapshot per minute, newest first. Keyed by minute rather than by object
 * identity so the same minute arriving from IndexedDB, Redis and the live poll
 * collapses into a single entry instead of three.
 */
const minuteKey = (s: MarketSnapshot): string =>
  Number.isFinite(s?.timestamp) && s.timestamp > 0
    ? String(Math.floor(s.timestamp / 60000))
    : String(s?.time || '').substring(0, 5);

/** `preferred` wins any collision - it is the fresher/live-derived copy. */
const mergeSnapshots = (preferred: MarketSnapshot[], incoming: MarketSnapshot[]): MarketSnapshot[] => {
  const byMinute = new Map<string, MarketSnapshot>();
  for (const s of [...incoming, ...preferred]) {
    const k = s && minuteKey(s);
    if (k) byMinute.set(k, s);
  }
  return Array.from(byMinute.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

const isTodayIST = (timestamp: number): boolean => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
  const opts = { timeZone: 'Asia/Kolkata' } as const;
  return new Date(timestamp).toLocaleDateString('en-IN', opts) === new Date().toLocaleDateString('en-IN', opts);
};

const App: React.FC = () => {
  const [credentials, setCredentials] = useState<FyersCredentials>(() => {
    try {
      const saved = localStorage.getItem('fyers_creds');
      const parsed = saved ? JSON.parse(saved) : {
        appId: '',
        accessToken: '',
        refreshInterval: REFRESH_OPTIONS[2].value, // 30s — keeps snapshots inside the momentum guard's freshness window and enables live PayTM data
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
        refreshInterval: REFRESH_OPTIONS[2].value, // 30s (see above)
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
  const [pilotClock, setPilotClock] = useState(Date.now);
  useEffect(() => {
    if (viewMode !== 'opening-pilot' && viewMode !== 'premarket') return;
    setPilotClock(Date.now());
    const timer = setInterval(() => setPilotClock(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [viewMode]);
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
  const premarketHistory = useMemo(() => {
    const now = Date.now();
    const rows = historyLog.filter(s => Number.isFinite(s.timestamp) && s.timestamp! <= now && isTodayIST(s.timestamp!))
      .sort((a, b) => b.timestamp! - a.timestamp!);
    return rows[0]?.timestamp && now - rows[0].timestamp <= 90_000 ? rows : [];
  }, [historyLog, pilotClock]);
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
    cerebrasCalls: 0,
    ollamaCalls: 0,
    recentCalls: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'symbol', direction: 'asc' });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isDecoyMode, setIsDecoyMode] = useState(false);
  const prevViewModeRef = useRef<ViewMode>('summary');

  const prevStocksRef = useRef<Record<string, FyersQuote>>({});
  const initialStocksRef = useRef<Record<string, FyersQuote>>({});
  const prevOptionsRef = useRef<Record<string, FyersQuote>>({});
  const initialOptionsRef = useRef<Record<string, FyersQuote>>({});
  // Which symbols have taken a real post-open baseline. Tracked per symbol so a
  // contract whose book is still forming at 09:17 anchors on its own next beat
  // instead of freezing in a stub, and so a browser refresh at 14:00 restores
  // the morning anchor rather than re-anchoring to the afternoon book.
  const anchoredStockSymbolsRef = useRef<Set<string>>(new Set());
  const anchoredOptionSymbolsRef = useRef<Set<string>>(new Set());
  const baselineAnchoredRef = useRef(false);
  const optionBaselineAnchoredRef = useRef(false);

  const prevNiftyLtpRef = useRef<number | null>(null);
  const didFetchPivots = useRef(false);

  // Session baseline persistence: the initial buy/sell quantities per symbol are
  // the reference point every sentiment delta is measured against. They are
  // seeded once (market open / first fetch) and must survive a browser refresh,
  // or the deltas re-baseline at the refresh moment and read 0 for a beat.
  const baselineRestoredRef = useRef(false); // restore attempted once per mount
  const baselineReadyRef = useRef(false);    // gates fetching until restore done
  const baselineSavedDateRef = useRef<number>(0); // day the baseline was persisted

  // --- Live-refresh watchdog bookkeeping ------------------------------------
  // A single hung fetch used to wedge the loop for the rest of the session: the
  // only cure was a browser reload, which threw away every AutoTrade position.
  // These refs let a watchdog see a stalled cycle and restart it in place.
  const refreshInFlightRef = useRef(false);
  const refreshStartedAtRef = useRef(0);
  const lastUpdatedRef = useRef(Date.now());

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
                    
                    const stockSent = dayStrength(totalBuyQty, initialStockBuy, totalSellQty, initialStockSell);

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
                    
                    const pcr = callsOI > 0 ? putsOI / callsOI : 0;
                    const callSent = dayStrength(callsBuyQty, initialCallBuy, callsSellQty, initialCallSell);
                    const putSent = dayStrength(putsBuyQty, initialPutBuy, putsSellQty, initialPutSell);
                    const optionsSent = callSent - putSent;

                    // Weighted breadth, matching the live path. This used to be
                    // (stockSent * 0.7 + optionsSent * 0.3) — a different metric
                    // on a different scale from the one live trading produces,
                    // which is why replayed history could never reproduce live
                    // engine behaviour. Redis snapshots carry no per-stock
                    // weightage, so fall back to an equal-weighted count.
                    const advDecTotal = adv + dec;
                    const overallSent = advDecTotal > 0 ? ((adv - dec) / advDecTotal) * 100 : 0;
                    
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
                  
                  // Merge (never replace): a mid-session reload has already
                  // restored today's snapshots from IndexedDB, and Redis lagging
                  // a minute behind must not wipe them.
                  setHistoryLog(prev => mergeSnapshots(prev, redisSnapshots));
                  
                  // Initialize session history and refs from the OLDEST snapshot (last in array since newest-first)
                  if (redisSnapshots.length > 0 && filteredData[filteredData.length - 1]?.stocks) {
                    const oldestSnapshot = filteredData[filteredData.length - 1];
                    const oldestStocks = oldestSnapshot.stocks || [];
                    const oldestOptions = oldestSnapshot.options || [];
                    
                    console.log(`🔧 Initializing refs from oldest snapshot with ${oldestStocks.length} stocks and ${oldestOptions.length} options`);
                    
                    // Only seed when refs are still empty: a persisted baseline
                    // restored for today (see baseline restore effect) is
                    // authoritative and must not be clobbered by the oldest
                    // Redis snapshot.
                    if (Object.keys(initialStocksRef.current).length === 0) {
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
                    }

                    if (Object.keys(initialOptionsRef.current).length === 0) {
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
                    }
                    
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

  // Privacy Mode Keyboard Shortcut (Cmd+Shift+V or Ctrl+Shift+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'v') {
        e.preventDefault();
        setIsPrivacyMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // --- 1b. Restore today's snapshots from IndexedDB -------------------------
  // Every snapshot is written to IndexedDB below, but nothing ever read it back,
  // so a mid-session reload started from an empty history. The trading engines
  // need 5 snapshots before they will emit a signal at all, which left them
  // blind (and unable to place any trade) for five minutes after every refresh.
  const historyRestoredRef = useRef(false);
  useEffect(() => {
    if (!isDbLoaded || historyRestoredRef.current) return;
    historyRestoredRef.current = true;
    (async () => {
      try {
        const saved = await dbService.getSnapshots();
        const today = (saved || []).filter(s => s && isTodayIST(s.timestamp));
        if (today.length === 0) return;
        setHistoryLog(prev => {
          const merged = mergeSnapshots(prev, today);
          return merged.length > prev.length ? merged : prev;
        });
        // Seed the spot from the newest restored snapshot so a reload does not
        // report "No Nifty price yet" for a full refresh cycle. Production on
        // 2026-09-22 spent 10:33:50-10:34:24 and 10:37:08-10:37:55 in that
        // state, blind, because niftyLtp starts null and only the next
        // successful fetch fills it. This is a stale price by construction, so
        // it is only a bridge — the momentum guard's own 90s freshness check
        // still rejects it if the feed does not come back.
        const newest = today.reduce((a, b) => (b.timestamp > a.timestamp ? b : a), today[0]);
        if (newest?.niftyLtp > 0) {
          setNiftyLtp(prev => (prev && prev > 0 ? prev : newest.niftyLtp));
        }
        console.log(`💾 Restored ${today.length} snapshot(s) for today from IndexedDB`);
      } catch (e) {
        console.warn('[History] Local snapshot restore failed:', e);
      }
    })();
  }, [isDbLoaded]);

  // --- 1c. Restore the session baseline (initial buy/sell qty per symbol) -----
  // Runs before the fetch loop is allowed to start (refreshData waits on
  // baselineReadyRef). If today's baseline is found, the seeding guards
  // (`length === 0`) are already satisfied, so deltas continue from the SAME
  // reference instead of re-seeding at the refresh moment. finally always marks
  // the attempt done so a genuine first launch (no stored baseline) still fetches.
  useEffect(() => {
    if (!isDbLoaded || baselineRestoredRef.current) return;
    baselineRestoredRef.current = true;
    (async () => {
      try {
        const base = await dbService.getMeta('session_baseline');
        if (base && isTodayIST(base.savedAt) && base.stocks && Object.keys(base.stocks).length > 0) {
          initialStocksRef.current = base.stocks;
          prevStocksRef.current = { ...base.stocks };
          if (Array.isArray(base.anchoredStocks)) {
            anchoredStockSymbolsRef.current = new Set(base.anchoredStocks);
            baselineAnchoredRef.current = anchoredStockSymbolsRef.current.size > 0;
          }
          if (base.options && Object.keys(base.options).length > 0) {
            initialOptionsRef.current = base.options;
            prevOptionsRef.current = { ...base.options };
            if (Array.isArray(base.anchoredOptions)) {
              anchoredOptionSymbolsRef.current = new Set(base.anchoredOptions);
              optionBaselineAnchoredRef.current = anchoredOptionSymbolsRef.current.size > 0;
            }
          }
          baselineSavedDateRef.current = base.savedAt; // already persisted for today
          console.log(`♻️ Restored session baseline: ${Object.keys(base.stocks).length} stocks, ${Object.keys(base.options || {}).length} options`);
        }
      } catch (e) {
        console.warn('[Baseline] restore failed:', e);
      } finally {
        baselineReadyRef.current = true;
      }
    })();
  }, [isDbLoaded]);

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

  /**
   * Capture the session baseline for any symbol that does not have one yet and
   * whose book is now genuinely formed. Returns how many were newly anchored.
   * Idempotent: a symbol anchored earlier today is left alone.
   */
  const anchorBaselines = (
      quotes: FyersQuote[],
      initialRef: React.MutableRefObject<Record<string, FyersQuote>>,
      anchoredRef: React.MutableRefObject<Set<string>>
  ): number => {
      const now = new Date();
      let anchored = 0;
      quotes.forEach(q => {
          if (!q.symbol || anchoredRef.current.has(q.symbol)) return;
          if (!shouldAnchorSymbol(q.total_buy_qty, q.total_sell_qty, now)) return;
          initialRef.current[q.symbol] = q;
          anchoredRef.current.add(q.symbol);
          anchored++;
      });
      return anchored;
  };

  const enrichData = (
      currentData: FyersQuote[],
      prevRef: React.MutableRefObject<Record<string, FyersQuote>>, 
      initialRef: React.MutableRefObject<Record<string, FyersQuote>>,
      isStock: boolean,
      // Symbols holding a real post-open baseline. Day-since-open columns are
      // computed only for these: a pre-open baseline is a stub, and measuring
      // against it produces five-figure percentages that read as signal.
      // Membership is per symbol because the stragglers are the whole problem —
      // at any single instant some books are formed and some are not.
      anchoredSymbols: Set<string> = new Set()
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
            // Both sides must have depth or the whole baseline is rejected:
            // a half-formed pre-open book (one side 0, the other in the tens)
            // renders as a five-figure Day% that looks like a measurement.
            // See isUsableBaseline.
            const baselineUsable = anchoredSymbols.has(curr.symbol)
                && isUsableBaseline(initial.total_buy_qty, initial.total_sell_qty);
            if (baselineUsable && curr.total_buy_qty !== undefined) {
                bid_chg_day_p = ((curr.total_buy_qty - initial.total_buy_qty!) / initial.total_buy_qty!) * 100;
            }
            if (baselineUsable && curr.total_sell_qty !== undefined) {
                ask_chg_day_p = ((curr.total_sell_qty - initial.total_sell_qty!) / initial.total_sell_qty!) * 100;
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

    // Wait until the persisted session baseline has been restored, so the first
    // post-refresh fetch computes deltas against the same reference instead of
    // re-seeding a fresh (zero) baseline. Becomes ready within ms of isDbLoaded.
    if (!baselineReadyRef.current) {
      console.log('⏳ [App] Waiting for session baseline restore...');
      return;
    }

    // Re-entry guard. Without it a slow cycle stacks on the next tick and the
    // two races each other; with a stale-lock release, a cycle that never
    // settles can no longer own the lock forever.
    const cycleInterval = credentials.refreshInterval || 60000;
    if (refreshInFlightRef.current) {
      const age = Date.now() - refreshStartedAtRef.current;
      if (age < Math.max(cycleInterval * 2, 45000)) {
        console.warn(`⏭️ [Refresh] Previous cycle still running (${Math.round(age / 1000)}s) — skipping this tick.`);
        return;
      }
      console.warn(`🧹 [Refresh] Previous cycle wedged for ${Math.round(age / 1000)}s — forcing a new one.`);
    }
    refreshInFlightRef.current = true;
    refreshStartedAtRef.current = Date.now();

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
        // Pre-open data is useful from 09:00; the closing bell is 15:30 IST.
        const isOpen = timeVal >= 900 && timeVal <= 1530;

        if (!isWeekday || !isOpen) {
            setMarketStatusMsg("Market Closed (09:00 - 15:30 IST)");
            if (stocks.length > 0) {
               setIsLoading(false);
               refreshInFlightRef.current = false;
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
      
      // Never overwrite a good price with 0: a single failed/partial fetch beat
      // returns niftyLtpVal = 0, and blanking the shared spot makes AutoTrade log
      // "No Nifty price yet" even though the History view still shows continuous
      // data. Keep the last good price and let the momentum guard's snapshot
      // freshness check (90s) govern staleness instead.
      if (niftyLtpVal > 0) setNiftyLtp(niftyLtpVal);

      // Anchor each stock's baseline independently, at the first beat at/after
      // 09:17 where that symbol's own book has depth on both sides. Symbols
      // already anchored today are never re-anchored, so the morning reference
      // holds for the whole session. See shouldAnchorSymbol.
      const newlyAnchoredStocks = anchorBaselines(stockData, initialStocksRef, anchoredStockSymbolsRef);
      if (newlyAnchoredStocks > 0) {
        // Force the persist block below to rewrite the stored baseline, which
        // otherwise only writes once a day and would keep the pre-open stub.
        baselineSavedDateRef.current = 0;
        baselineAnchoredRef.current = anchoredStockSymbolsRef.current.size > 0;
        console.log(`⚓ Anchored ${newlyAnchoredStocks} stock baselines (${anchoredStockSymbolsRef.current.size}/${stockData.length} total)`);
      }

      const enrichedStocks = enrichData(stockData, prevStocksRef, initialStocksRef, true, anchoredStockSymbolsRef.current);
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
          // Same per-symbol anchor as the stock book; see the note at that site.
          const newlyAnchoredOptions = anchorBaselines(rawOptions, initialOptionsRef, anchoredOptionSymbolsRef);
          if (newlyAnchoredOptions > 0) {
            baselineSavedDateRef.current = 0;
            optionBaselineAnchoredRef.current = anchoredOptionSymbolsRef.current.size > 0;
            console.log(`⚓ Anchored ${newlyAnchoredOptions} option baselines (${anchoredOptionSymbolsRef.current.size}/${rawOptions.length} total)`);
          }
          const enrichedOptions = enrichData(rawOptions, prevOptionsRef, initialOptionsRef, false, anchoredOptionSymbolsRef.current);
          console.log(`[App] Enriched ${enrichedOptions.length} options, setting to state`);
          setOptionQuotes(enrichedOptions);
          updateSessionHistory(enrichedOptions);

          // Persist the session baseline once per day so a refresh can restore it
          // and continue the same deltas. The initial refs are stable after
          // seeding, so this writes a single time per session (and again the next
          // trading day, when isTodayIST(savedAt) turns false).
          if (Object.keys(initialStocksRef.current).length > 0 && !isTodayIST(baselineSavedDateRef.current)) {
            baselineSavedDateRef.current = Date.now();
            dbService.setMeta('session_baseline', {
              savedAt: Date.now(),
              // Persisted so a refresh restores the morning anchor rather than
              // re-anchoring to whatever the book looks like at refresh time.
              anchoredStocks: [...anchoredStockSymbolsRef.current],
              anchoredOptions: [...anchoredOptionSymbolsRef.current],
              stocks: initialStocksRef.current,
              options: initialOptionsRef.current,
            }).catch(e => console.warn('[Baseline] persist failed:', e));
          }

          // --- Market Snapshot ---
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
          const prevLtp = prevNiftyLtpRef.current || niftyLtpVal;
          const ptsChg = niftyLtpVal - prevLtp;
          prevNiftyLtpRef.current = niftyLtpVal;

          const adv = enrichedStocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
          const dec = enrichedStocks.filter(s => (s.lp_chg_day_p || 0) < 0).length;
          
          let totalWeight = 0, bullishWeight = 0, bearishWeight = 0;
          // Session-open levels are accumulated alongside the current levels:
          // every "Str" column divides by the open, never by the delta.
          let stockBuyQty = 0, stockSellQty = 0;
          let initialStockBuyQty = 0, initialStockSellQty = 0;

          enrichedStocks.forEach(s => {
              const w = s.weight || 0;
              const chg = s.lp_chg_day_p || 0;
              totalWeight += w;
              if (chg > 0) bullishWeight += w;
              if (chg < 0) bearishWeight += w;

              // Only anchored symbols contribute: a stock still carrying a
              // pre-open stub would otherwise inflate the aggregate the same
              // way it inflated its own row.
              if (anchoredStockSymbolsRef.current.has(s.symbol)) {
                  stockBuyQty += s.total_buy_qty || 0;
                  stockSellQty += s.total_sell_qty || 0;
                  initialStockBuyQty += s.initial_total_buy_qty || 0;
                  initialStockSellQty += s.initial_total_sell_qty || 0;
              }
          });

          const overallSent = totalWeight > 0 ? ((bullishWeight - bearishWeight) / totalWeight) * 100 : 0;
          const stockSent = dayStrength(stockBuyQty, initialStockBuyQty, stockSellQty, initialStockSellQty);

          // Option Aggregations
          let callsBuyQty = 0, callsSellQty = 0, putsBuyQty = 0, putsSellQty = 0;
          let callsOI = 0, putsOI = 0;
          let initialCallBuyQty = 0, initialCallSellQty = 0;
          let initialPutBuyQty = 0, initialPutSellQty = 0;

          // Current and baseline must cover exactly the same contracts or the
          // ratio is meaningless, so Strength uses its own anchored-only sums.
          // The callsBuyQty/putsBuyQty columns stay full totals — they are
          // reported levels, not a ratio.
          let anchCallBuy = 0, anchCallSell = 0, anchPutBuy = 0, anchPutSell = 0;

          enrichedOptions.forEach(o => {
              const anchored = anchoredOptionSymbolsRef.current.has(o.symbol);
              if (o.symbol.endsWith('CE')) {
                  callsBuyQty += o.total_buy_qty || 0;
                  callsSellQty += o.total_sell_qty || 0;
                  callsOI += o.oi || 0;
                  if (anchored) {
                      anchCallBuy += o.total_buy_qty || 0;
                      anchCallSell += o.total_sell_qty || 0;
                      initialCallBuyQty += o.initial_total_buy_qty || 0;
                      initialCallSellQty += o.initial_total_sell_qty || 0;
                  }
              } else {
                  putsBuyQty += o.total_buy_qty || 0;
                  putsSellQty += o.total_sell_qty || 0;
                  putsOI += o.oi || 0;
                  if (anchored) {
                      anchPutBuy += o.total_buy_qty || 0;
                      anchPutSell += o.total_sell_qty || 0;
                      initialPutBuyQty += o.initial_total_buy_qty || 0;
                      initialPutSellQty += o.initial_total_sell_qty || 0;
                  }
              }
          });

          const pcr = callsOI > 0 ? putsOI / callsOI : 0;
          const callSent = dayStrength(anchCallBuy, initialCallBuyQty, anchCallSell, initialCallSellQty);
          const putSent = dayStrength(anchPutBuy, initialPutBuyQty, anchPutSell, initialPutSellQty);
          const optionsSent = callSent - putSent;

          // Check if we need to add a new snapshot (newest first, so check [0])
          // Append on ELAPSED TIME, not on crossing a minute boundary.
          //
          // The boundary rule silently dropped a row whenever a fetch beat was
          // slow or failed: the minute ticked over with no snapshot, and the
          // next beat saw a new minute and carried on, leaving a permanent
          // hole. Production on 2026-09-22 logged 143s, 155s and 180s holes in
          // one twenty-minute stretch, and the momentum guard rejects a window
          // containing them — it denied two setups that had already cleared the
          // score threshold (10:35:57 at 68.2 and 10:43:30 at 69.6).
          //
          // 55s rather than 60s so a beat arriving slightly early still counts;
          // at a 30s refresh that yields one row per minute as intended, and
          // after a stall the very next beat writes a row instead of waiting
          // for the next boundary.
          const lastLogTs = historyLog.length > 0 ? historyLog[0].timestamp : 0;
          const sinceLastLog = Number.isFinite(lastLogTs) && lastLogTs > 0
            ? Date.now() - lastLogTs
            : Number.POSITIVE_INFINITY;
          const dueForSnapshot = sinceLastLog >= 55_000;

          // On refresh / first launch the baseline refs (initial_* quantities)
          // are freshly seeded, so every delta-based metric is 0 for one beat —
          // adv/dec = 0/0, overallSent = 0, all *Sent = 0. Don't pollute history
          // (and the momentum guard) with that all-zero row; skip it and let the
          // next beat, which carries real breadth/flow deltas, continue the
          // series from the previous real values. Live market data always has
          // some advancing/declining stocks, so adv===0 && dec===0 reliably
          // marks the zero-baseline beat.
          const isZeroBaseline = adv === 0 && dec === 0;

          if (dueForSnapshot && !isZeroBaseline) {
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
              // Merge (dedupe-by-minute + re-sort by timestamp) instead of a raw
              // prepend: the client-stamped live snapshot must not interleave with
              // server-stamped (cron) snapshots, or the momentum guard sees
              // duplicate/out-of-order timestamps and refuses to trade.
              setHistoryLog(prev => mergeSnapshots([snapshot], prev));
          }
      }

      setLastUpdated(Date.now());
      lastUpdatedRef.current = Date.now();
      setError(null);
      setMarketStatusMsg(null);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      if (message.includes("Market Hours") || message.includes("Test Mode")) {
          setMarketStatusMsg(message);
      } else {
          setError(message);
      }
    } finally {
      refreshInFlightRef.current = false;
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
          
          // Start regular interval after first call. Worker-driven so it keeps
          // fetching when the tab/window/app is backgrounded (main-thread timers
          // are throttled to ~1/min when hidden).
          console.log(`⏰ Setting up background heartbeat with ${credentials.refreshInterval}ms refresh rate`);
          const stop = scheduleBackground(() => {
            if (refreshDataRef.current) {
              refreshDataRef.current();
            }
          }, credentials.refreshInterval || 30000);

          // Store cleanup for the outer effect teardown.
          (timeoutId as any).stopInterval = stop;
        }, marketInfo.delayUntil917);

        return () => {
          clearTimeout(timeoutId);
          if ((timeoutId as any).stopInterval) {
            (timeoutId as any).stopInterval();
          }
        };
      } else {
        // Normal behavior: call immediately and set up interval
        console.log('🚀 Starting live data fetch');
        refreshDataRef.current();
        
        console.log(`⏰ Setting up background heartbeat with ${credentials.refreshInterval}ms refresh rate`);
        // Worker-driven so fetching continues when the tab/window/app is hidden.
        const stop = scheduleBackground(() => {
          if (refreshDataRef.current) {
            refreshDataRef.current();
          }
        }, credentials.refreshInterval || 30000);

        return () => stop();
      }
    }
  }, [configLoaded, isDbLoaded, credentials.appId, credentials.accessToken, credentials.paytmAccessToken, credentials.dataProvider, isPaused, credentials.refreshInterval, credentials.bypassMarketHours]);

  /**
   * LIVE-DATA WATCHDOG.
   *
   * The interval above lives inside an effect, so anything that tears that
   * effect down — or a cycle that never settles, or a long task that starves
   * the timer — silently ends the live feed for the rest of the session. The
   * only cure was a browser reload, and a reload wiped every AutoTrade
   * position, log line and statistic with it.
   *
   * This watchdog is mounted once, for the life of the page, with no
   * dependencies: nothing in the render tree can unmount it. It does not fetch
   * on a schedule of its own — it only notices that no successful refresh has
   * landed for well over one interval and restarts the cycle in place.
   */
  const watchdogCfgRef = useRef({ enabled: false, intervalMs: 60000 });
  watchdogCfgRef.current = {
    enabled: Boolean(
      configLoaded &&
      isDbLoaded &&
      !isPaused &&
      (credentials.dataProvider === 'paytm'
        ? credentials.paytmAccessToken
        : credentials.appId && credentials.accessToken)
    ),
    intervalMs: credentials.refreshInterval || 60000
  };

  useEffect(() => {
    const CHECK_MS = 10_000;
    let lastKickAt = 0;

    const kick = (why: string) => {
      const { enabled, intervalMs } = watchdogCfgRef.current;
      if (!enabled || refreshInFlightRef.current) return;

      // `lastUpdatedRef` starts at mount time, so a cold start gets one full
      // grace window before the watchdog steps in and we never double-fetch.
      const since = Date.now() - lastUpdatedRef.current;
      const grace = Math.max(intervalMs * 2, 45_000);
      if (since < grace) return;
      // Back off between rescues. A refresh that legitimately returns without
      // new data (market closed) must not turn this into a 10-second poll.
      if (Date.now() - lastKickAt < grace) return;
      lastKickAt = Date.now();

      console.warn(
        `🐕 [Watchdog] No live data for ${Math.round(since / 1000)}s (${why}) — restarting the refresh cycle.`
      );
      refreshDataRef.current?.();
    };

    // Worker-driven so the watchdog itself keeps checking while the tab is hidden.
    const stop = scheduleBackground(() => kick('periodic check'), CHECK_MS);

    // A tab that was throttled or backgrounded comes back stale; catch it up the
    // moment it is looked at rather than on the next interval boundary.
    const onVisible = () => {
      if (document.visibilityState === 'visible') kick('tab became visible');
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);


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
               {!isPrivacyMode && (
               <div className="flex items-center gap-2">
                   <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                      <Activity className="text-white" size={20} />
                   </div>
                   <div>
                       <h1 className="text-lg font-black text-white leading-none tracking-tight">NIFTY50<span className="text-blue-500">.AI</span></h1>
                       <p className="text-[10px] text-slate-400 font-mono">LIVE TERMINAL</p>
                   </div>
               </div>
               )}
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
               <button onClick={() => handleSetViewMode('vision')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'vision' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Eye size={14} /> Vision
               </button>
               <button onClick={() => handleSetViewMode('paper')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'paper' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <GraduationCap size={14} /> Paper
               </button>
               <button onClick={() => handleSetViewMode('opening-pilot')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === 'opening-pilot' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                   <Activity size={14} /> Opening Pilot
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
        {/* Keyed by view so switching screens clears a previous crash, and so a
            single broken screen never blanks the whole dashboard. */}
        <ErrorBoundary label={viewMode}>
        
        {isPrivacyMode && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
                <div className="text-center space-y-4">
                    <div className="inline-block p-3 bg-slate-800/50 border border-slate-700/30 rounded">
                        <div className="relative w-8 h-8">
                            <div className="absolute inset-0 border-2 border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-transparent border-t-slate-500 rounded-full animate-spin"></div>
                        </div>
                    </div>
                    <h1 className="text-sm font-normal text-slate-500">loading...</h1>
                    <p className="text-slate-600 max-w-xs text-xs">syncing</p>
                </div>

                <div className="space-y-3 w-full max-w-xs">
                    <button
                        onClick={() => setIsDecoyMode(!isDecoyMode)}
                        className={`w-full py-2 px-3 rounded text-xs border transition-all ${
                            isDecoyMode 
                                ? 'bg-slate-800 text-slate-400 border-slate-700' 
                                : 'bg-slate-800 hover:bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                    >
                        {isDecoyMode ? 'decoy: on' : 'background'}
                    </button>
                    
                    <button
                        onClick={() => setIsPrivacyMode(false)}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-800 border border-slate-700 rounded text-slate-400 transition-all text-xs"
                    >
                        close
                    </button>
                </div>

                <p className="text-xs text-slate-700 font-mono absolute bottom-4">
                    Cmd+Shift+V
                </p>
            </div>
        )}

        {isPrivacyMode && isDecoyMode && (
            <div className="absolute inset-0 z-40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center">
                <div className="space-y-8 text-center">
                    <div>
                        <h2 className="text-4xl font-bold text-slate-300 font-mono">9:32</h2>
                        <p className="text-slate-500 text-sm mt-2">Tuesday, 30 June 2026</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 max-w-xs">
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                            <div className="h-8 bg-slate-700/30 rounded-md mb-2"></div>
                            <p className="text-xs text-slate-500">Project A</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                            <div className="h-8 bg-slate-700/30 rounded-md mb-2"></div>
                            <p className="text-xs text-slate-500">Project B</p>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                            <div className="h-8 bg-slate-700/30 rounded-md mb-2"></div>
                            <p className="text-xs text-slate-500">Project C</p>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 max-w-xs">
                        <p className="text-slate-400 text-sm">Work in Progress</p>
                        <div className="mt-3 space-y-2">
                            <div className="h-2 bg-slate-700/30 rounded-full"></div>
                            <div className="h-2 bg-slate-700/30 rounded-full w-5/6"></div>
                            <div className="h-2 bg-slate-700/30 rounded-full w-4/5"></div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
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
                  pivots={pivots}
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

        {(viewMode === 'premarket' || (viewMode === 'opening-pilot' && istMinutesOf(new Date(pilotClock)) < 565)) && (
            <div className={viewMode === 'premarket' ? 'flex flex-col h-full px-4 pb-4 overflow-hidden' : 'hidden'} aria-hidden={viewMode !== 'premarket'}>
                <PreMarketAnalyzer
                   credentials={credentials}
                   aiEnabled={credentials.aiEnabled}
                   historyLog={premarketHistory}
                   stocks={stocks}
                />
            </div>
        )}

        {/* Keep UnifiedAutoTrade mounted to preserve running Sniper & Momentum processes
            across tab switches. Only hide with CSS, never unmount. */}
        <div className={viewMode === 'autotrade' ? 'flex flex-col h-full overflow-hidden' : 'hidden'} aria-hidden={viewMode !== 'autotrade'}>
            <UnifiedAutoTrade 
               credentials={credentials}
               stocks={stocks || []}
               niftyLtp={niftyLtp}
               historyLog={historyLog || []}
               pivots={pivots}
               aiEnabled={credentials.aiEnabled}
             />
        </div>

        {viewMode === 'patterns' && (
            <div className="flex flex-col h-full overflow-hidden">
                <PatternDashboard 
                   currentSnapshot={historyLog[0] || null}
                   niftyLtp={niftyLtp}
                   credentials={credentials}
                   historyLog={historyLog || []}
                />
            </div>
        )}

        {viewMode === 'vision' && (
            <div className="flex flex-col h-full overflow-hidden">
                <VisionAnalysis niftyLtp={niftyLtp} />
            </div>
        )}

        {viewMode === 'paper' && (
            <div className="flex flex-col h-full overflow-hidden">
                <PaperTrading
                    optionQuotes={optionQuotes}
                    niftyLtp={niftyLtp}
                    lastUpdated={lastUpdated}
                />
            </div>
        )}

        </ErrorBoundary>
        {/* Pilot exits keep monitoring across navigation, in their own error boundary. */}
        <div className={viewMode === 'opening-pilot' ? 'flex flex-col h-full overflow-hidden' : 'hidden'} aria-hidden={viewMode !== 'opening-pilot'}>
          <ErrorBoundary label="Opening Pilot">
            <OpeningPilot
              history={historyLog}
              quotes={optionQuotes}
              active={viewMode === 'opening-pilot'}
              feedPaused={isPaused}
              refreshInterval={credentials.refreshInterval || 60000}
              visionScreenActive={viewMode === 'vision'}
              onNavigate={handleSetViewMode}
              credentials={credentials}
            />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default App;
