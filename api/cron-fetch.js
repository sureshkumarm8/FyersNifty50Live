// External Cron Endpoint - Called by cron-job.org every minute
// Saves data to Upstash Redis for persistent storage

import { Redis } from '@upstash/redis';

// Import mapping data
import { PAYTM_NIFTY50_MAP } from '../constants/paytmMappings.js';
import { NIFTY_WEEKLY_OPTIONS, CURRENT_EXPIRY_FORMATTED } from '../constants/niftyWeeklyOptions.js';

// Convert PayTM quote to FyersQuote format
function convertPayTMToFyersFormat(paytmQuote, mappingData, isOption = false) {
  const securityIdStr = paytmQuote.security_id.toString();
  
  let symbol = 'UNKNOWN';
  let shortName = 'UNKNOWN';
  let description = 'Unknown Security';
  let expiryDate = undefined;
  
  if (isOption) {
    // Find in options mapping
    const optInfo = NIFTY_WEEKLY_OPTIONS.find(o => o.security_id === securityIdStr);
    if (optInfo) {
      symbol = `NSE:NIFTY-${optInfo.strike}-${optInfo.type}`;
      shortName = `NIFTY ${optInfo.strike} ${optInfo.type}`;
      description = `NIFTY ${optInfo.strike} ${optInfo.type} ${CURRENT_EXPIRY_FORMATTED}`;
      expiryDate = CURRENT_EXPIRY_FORMATTED;
    }
  } else {
    // Find in stock mapping
    const stockInfo = Object.values(PAYTM_NIFTY50_MAP).find(s => s.security_id === securityIdStr);
    if (stockInfo) {
      symbol = `NSE:${stockInfo.symbol}`;
      shortName = stockInfo.symbol;
      description = stockInfo.name;
    }
  }
  
  return {
    symbol,
    short_name: shortName,
    exchange: 'NSE',
    expiry_date: expiryDate,
    description,
    original_name: shortName,
    fyToken: securityIdStr,
    tt: paytmQuote.last_trade_time || paytmQuote.last_update_time || Date.now(),
    
    lp: paytmQuote.last_price || 0,
    open_price: paytmQuote.ohlc?.open || 0,
    high_price: paytmQuote.ohlc?.high || 0,
    low_price: paytmQuote.ohlc?.low || 0,
    prev_close_price: paytmQuote.ohlc?.close || 0,
    volume: paytmQuote.volume_traded || 0,
    
    ch: paytmQuote.change_absolute || 0,
    chp: paytmQuote.change_percent || 0,
    
    total_buy_qty: paytmQuote.total_buy_quantity || 0,
    total_sell_qty: paytmQuote.total_sell_quantity || 0,
    bid: paytmQuote.depth?.buy?.[0]?.price || 0,
    ask: paytmQuote.depth?.sell?.[0]?.price || 0,
    spread: (paytmQuote.depth?.sell?.[0]?.price || 0) - (paytmQuote.depth?.buy?.[0]?.price || 0),
    
    oi: paytmQuote.oi || 0
  };
}

// Complete Nifty50 Security IDs from paytmMappings.ts
const NIFTY50_SECURITY_IDS = [
  '3351',  // SUNPHARMA
  '11536', // TCS
  '10940', // DIVISLAB
  '3787',  // WIPRO
  '13538', // TECHM
  '1922',  // KOTAKBANK
  '5900',  // AXISBANK
  '25',    // ADANIENT
  '694',   // CIPLA
  '10604', // BHARTIARTL
  '526',   // BPCL
  '11532', // ULTRACEMCO
  '547',   // BRITANNIA
  '2475',  // ONGC
  '1348',  // HEROMOTOCO
  '14977', // POWERGRID
  '1594',  // INFY
  '7229',  // HCLTECH
  '3045',  // SBIN
  '2885',  // RELIANCE
  '10999', // MARUTI
  '2031',  // M&M
  '21808', // SBILIFE
  '1232',  // GRASIM
  '11723', // JSWSTEEL
  '467',   // HDFCLIFE
  '11483', // LT
  '15083', // ADANIPORTS
  '1363',  // HINDALCO
  '5258',  // INDUSINDBK
  '157',   // APOLLOHOSP
  '3506',  // TITAN
  '1660',  // ITC
  '16669', // BAJAJ-AUTO
  '20374', // COALINDIA
  '910',   // EICHERMOT
  '3432',  // TATACONSUM
  '236',   // ASIANPAINT
  '4963',  // ICICIBANK
  '1394',  // HINDUNILVR
  '11630', // NTPC
  '1333',  // HDFCBANK
  '3499',  // TATASTEEL
  '16675', // BAJAJFINSV
  '17963', // NESTLEIND
  '881',   // DRREDDY
  '4306',  // SHRIRAMFIN
  '317'    // BAJFINANCE
];

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Optional: Security check with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }

  try {
    // Check market hours (IST timezone)
    const now = new Date();
    const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istString);
    
    const day = istDate.getDay();
    const hour = istDate.getHours();
    const min = istDate.getMinutes();
    const timeVal = hour * 100 + min;

    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = timeVal >= 917 && timeVal <= 1515;

    // Allow bypass for testing
    const bypassMarketHours = process.env.BYPASS_MARKET_HOURS === 'true';

    if (!bypassMarketHours && (!isWeekday || !isMarketHours)) {
      return res.status(200).json({
        success: true,
        message: 'Market closed - No fetch performed',
        marketClosed: true,
        currentTime: istString
      });
    }

    // SMART CHECK: Is frontend active? (Check heartbeat flag)
    try {
      const frontendActive = await redis.get('frontend_active');
      
      if (frontendActive) {
        const flagAge = Date.now() - parseInt(frontendActive);
        const ageSeconds = Math.round(flagAge / 1000);
        
        console.log(`[Cron] 🚫 Frontend is active (heartbeat ${ageSeconds}s ago) - Skipping fetch`);
        return res.status(200).json({
          success: true,
          message: 'Frontend is active - Cron skipped',
          skipped: true,
          reason: 'frontend_active',
          frontendHeartbeatAge: ageSeconds,
          currentTime: istString
        });
      } else {
        console.log(`[Cron] ✅ No frontend detected - Cron will fetch data`);
      }
    } catch (flagCheckError) {
      console.log('[Cron] Could not check frontend flag, proceeding:', flagCheckError.message);
    }

    // Get PayTM token from environment
    const paytmToken = process.env.PAYTM_ACCESS_TOKEN;
    
    if (!paytmToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'PayTM token not configured. Set PAYTM_ACCESS_TOKEN in Vercel env.' 
      });
    }

    console.log(`[Cron] Fetching market data at ${istString}`);

    // Fetch Nifty 50 stocks
    const stockPreferences = NIFTY50_SECURITY_IDS.map(id => `NSE:${id}:EQUITY`).join(',');
    const stockResponse = await fetch(
      `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(stockPreferences)}`,
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );

    if (!stockResponse.ok) {
      throw new Error(`PayTM stocks API error: ${stockResponse.status}`);
    }

    const stockData = await stockResponse.json();

    // Fetch Nifty Index LTP (Security ID 13 = NIFTY 50 INDEX)
    const indexResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:13:INDEX',
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );

    const indexData = await indexResponse.json();
    const niftyLTP = indexData?.data?.[0]?.last_price || indexData?.data?.[0]?.lp || null;

    // Fetch Options data (ATM ± 1000 points) - DYNAMIC DISCOVERY
    let optionsData = null;
    if (niftyLTP && niftyLTP > 0) {
      try {
        const atmStrike = Math.round(niftyLTP / 50) * 50;
        const strikeRange = 20; // ±1000 points
        const minStrike = atmStrike - (strikeRange * 50);
        const maxStrike = atmStrike + (strikeRange * 50);
        
        // Try to get current week's options from Redis cache (populated by discover-options API)
        let currentWeekOptions = await redis.get('options:current_week');
        let needsDiscovery = false;
        
        if (!currentWeekOptions) {
          console.log('[Cron] ⚠️ No cached options found - needs discovery');
          needsDiscovery = true;
        } else {
          const cacheData = typeof currentWeekOptions === 'string' 
            ? JSON.parse(currentWeekOptions) 
            : currentWeekOptions;
          
          // Check if expiry has passed
          const expiryDate = new Date(cacheData.expiry);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);
          
          if (expiryDate < today) {
            console.log(`[Cron] ⚠️ Cached options expired on ${cacheData.expiry} - needs discovery`);
            needsDiscovery = true;
          } else {
            console.log(`[Cron] ✅ Using cached options (expiry: ${cacheData.expiry}, count: ${cacheData.count})`);
            currentWeekOptions = cacheData;
          }
        }
        
        // Auto-discover if needed
        if (needsDiscovery) {
          console.log('[Cron] 🔄 Triggering automatic options discovery...');
          try {
            // Import and call discover-options logic inline
            const { NIFTY_EXPIRY_DATES } = await import('../constants/niftyExpiryDates.js');
            
            // Get next expiry
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let nextExpiry = null;
            
            for (const expiry of NIFTY_EXPIRY_DATES) {
              const expiryDate = new Date(expiry.date);
              expiryDate.setHours(0, 0, 0, 0);
              if (expiryDate >= today) {
                nextExpiry = expiry.date;
                console.log(`[Cron] Next expiry: ${nextExpiry} (${expiry.dayOfWeek})`);
                break;
              }
            }
            
            if (!nextExpiry) {
              throw new Error('No future expiry found in calendar');
            }
            
            // Fetch CSV and parse options
            console.log('[Cron] Fetching PayTM options CSV...');
            const csvResponse = await fetch('https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv');
            if (!csvResponse.ok) throw new Error(`CSV fetch failed: ${csvResponse.status}`);
            
            const csvText = await csvResponse.text();
            const lines = csvText.split('\n');
            const options = [];
            
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              const parts = line.split(',');
              if (parts.length < 6) continue;
              
              const securityId = parts[0]?.trim();
              const symbol = parts[1]?.trim();
              const strike = parseFloat(parts[3]);
              const expiry = parts[4]?.trim();
              
              if (symbol?.toUpperCase().includes('NIFTY') && 
                  expiry === nextExpiry &&
                  !isNaN(strike) &&
                  strike >= minStrike && 
                  strike <= maxStrike &&
                  securityId) {
                
                const type = symbol.toUpperCase().includes('CE') ? 'CE' : 
                            symbol.toUpperCase().includes('PE') ? 'PE' : null;
                
                if (type) {
                  options.push({ security_id: securityId, strike, type, symbol });
                }
              }
            }
            
            options.sort((a, b) => {
              if (a.strike !== b.strike) return a.strike - b.strike;
              return a.type === 'CE' ? -1 : 1;
            });
            
            console.log(`[Cron] ✅ Discovered ${options.length} options for ${nextExpiry}`);
            
            // Cache the discovered options
            const cacheData = {
              expiry: nextExpiry,
              discoveredAt: new Date().toISOString(),
              atmStrike,
              niftyLTP,
              strikeRange: { min: minStrike, max: maxStrike },
              options,
              count: options.length
            };
            
            await redis.set('options:current_week', JSON.stringify(cacheData), { ex: 604800 });
            currentWeekOptions = cacheData;
            
          } catch (discoveryError) {
            console.error('[Cron] ❌ Discovery failed:', discoveryError.message);
            console.log('[Cron] Falling back to static constants');
            const { NIFTY_WEEKLY_OPTIONS } = await import('../constants/niftyWeeklyOptions.js');
            currentWeekOptions = { options: NIFTY_WEEKLY_OPTIONS };
          }
        }
        
        // Filter options for ATM range
        const filteredOptions = currentWeekOptions.options.filter(opt => 
          opt.strike >= minStrike && opt.strike <= maxStrike
        );
        const optionIds = filteredOptions.map(opt => opt.security_id);
        
        if (optionIds.length > 0) {
          const optionPreferences = optionIds.map(id => `NSE:${id}:INDEX_OPT`).join(',');
          const optionsResponse = await fetch(
            `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(optionPreferences)}`,
            {
              headers: {
                'x-jwt-token': paytmToken,
                'Accept': 'application/json'
              }
            }
          );
          
          if (optionsResponse.ok) {
            const optData = await optionsResponse.json();
            optionsData = optData?.data || [];
            console.log(`[Cron] Fetched ${optionsData.length} options contracts`);
          }
        }
      } catch (optError) {
        console.error('[Cron] Options fetch error:', optError.message);
        // Continue without options data
      }
    }

    const duration = Date.now() - startTime;
    
    // Convert raw PayTM data to FyersQuote format for consistency
    const convertedStocks = (stockData?.data || [])
      .filter(quote => quote.found !== false)
      .map(quote => convertPayTMToFyersFormat(quote, PAYTM_NIFTY50_MAP, false));
    
    const convertedOptions = (optionsData || [])
      .filter(quote => quote.found !== false)
      .map(quote => convertPayTMToFyersFormat(quote, NIFTY_WEEKLY_OPTIONS, true));
    
    console.log(`[Cron] Converted ${convertedStocks.length} stocks and ${convertedOptions.length} options to FyersQuote format`);
    
    // Save to Redis for persistent storage (now in consistent format!)
    const snapshot = {
      timestamp: Date.now(),
      istTime: istString,
      niftyLTP,
      stocks: convertedStocks,  // Now in FyersQuote format
      options: convertedOptions, // Now in FyersQuote format
      stockCount: convertedStocks.length,
      optionsCount: convertedOptions.length,
      duration,
      source: 'cron'  // Mark that this data came from cron job
    };
    
    try {
      // Save current snapshot with timestamp as key
      await redis.set(`snapshot:${snapshot.timestamp}`, JSON.stringify(snapshot), {
        ex: 86400 // Expire after 24 hours
      });
      
      // Add to sorted set for easy retrieval (score = timestamp)
      await redis.zadd('snapshots:index', {
        score: snapshot.timestamp,
        member: snapshot.timestamp.toString()
      });
      
      // Keep only last 500 snapshots in index (~ 8 hours of data)
      await redis.zremrangebyrank('snapshots:index', 0, -501);
      
      // Save latest snapshot for quick access
      await redis.set('snapshot:latest', JSON.stringify(snapshot));
      
      console.log(`[Cron] 💾 Saved to Redis - Key: snapshot:${snapshot.timestamp}`);
    } catch (redisError) {
      console.error('[Cron] ⚠️ Redis save failed:', redisError.message);
      // Continue even if Redis fails
    }
    
    console.log(`[Cron] ✅ Fetch successful - Nifty: ${niftyLTP}, Duration: ${duration}ms`);

    return res.status(200).json({
      success: true,
      message: 'Data fetched and saved successfully',
      data: {
        niftyLTP,
        stockCount: stockData?.data?.length || 0,
        optionsCount: optionsData?.length || 0,
        timestamp: snapshot.timestamp,
        duration,
        istTime: istString,
        saved: true
      }
    });

  } catch (error) {
    console.error('[Cron] ❌ Fetch error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    });
  }
}
