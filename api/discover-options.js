/**
 * Dynamic Options Discovery API
 * 
 * Automatically discovers current week's NIFTY options from PayTM
 * No hardcoded security_ids - always uses latest contracts
 * 
 * Features:
 * - Auto-detects next Thursday expiry (handles holidays)
 * - Fetches current week contracts from PayTM CSV
 * - Calculates ATM range dynamically based on Nifty LTP
 * - Caches results in Redis (7-day TTL)
 * - Returns ready-to-use options array
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

/**
 * Get next expiry date from official calendar (handles holidays & Tuesday expiry)
 * Uses same logic as generateWeeklyOptions.cjs
 */
async function getNextExpiryDate() {
  try {
    // Import the official expiry dates calendar
    const { NIFTY_EXPIRY_DATES } = await import('../constants/niftyExpiryDates.js');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find next expiry from the official calendar
    for (const expiry of NIFTY_EXPIRY_DATES) {
      const expiryDate = new Date(expiry.date);
      expiryDate.setHours(0, 0, 0, 0);
      
      if (expiryDate >= today) {
        console.log(`[Discover] Using official expiry: ${expiry.date} (${expiry.dayOfWeek})`);
        return expiry.date;
      }
    }
    
    // Fallback: Should never reach here if calendar is updated
    console.warn('[Discover] No future expiry found in calendar, using fallback');
    return null;
    
  } catch (error) {
    console.error('[Discover] Error reading expiry dates:', error);
    // Fallback to next Tuesday calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = today.getDay();
    const daysToTuesday = day <= 2 ? 2 - day : (7 - day) + 2;
    const nextTuesday = new Date(today);
    nextTuesday.setDate(today.getDate() + daysToTuesday);
    
    const year = nextTuesday.getFullYear();
    const month = String(nextTuesday.getMonth() + 1).padStart(2, '0');
    const date = String(nextTuesday.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${date}`;
  }
}

/**
 * Parse PayTM CSV and filter for current week NIFTY options
 */
function parseAndFilterOptions(csvText, expiryDate, minStrike, maxStrike) {
  const lines = csvText.split('\n');
  const options = [];
  
  console.log(`[Discover] Parsing CSV with ${lines.length} lines`);
  console.log(`[Discover] Target expiry: ${expiryDate}`);
  console.log(`[Discover] Strike range: ${minStrike} - ${maxStrike}`);
  
  // Expected CSV format:
  // security_id,symbol,company,strike,expiry,instrument
  // Example: 41562,NIFTY 12-MAY-26 21000 PE,Nifty 50,21000,2026-05-12,OPTSTK
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 6) continue;
    
    const securityId = parts[0]?.trim();
    const symbol = parts[1]?.trim();
    const strike = parseFloat(parts[3]);
    const expiry = parts[4]?.trim();
    
    // Filter criteria:
    // 1. Symbol contains NIFTY
    // 2. Expiry matches target date
    // 3. Strike in ATM range
    // 4. Valid security ID
    
    if (symbol?.toUpperCase().includes('NIFTY') && 
        expiry === expiryDate &&
        !isNaN(strike) &&
        strike >= minStrike && 
        strike <= maxStrike &&
        securityId) {
      
      // Determine CE or PE from symbol
      const type = symbol.toUpperCase().includes('CE') ? 'CE' : 
                   symbol.toUpperCase().includes('PE') ? 'PE' : null;
      
      if (type) {
        options.push({ 
          security_id: securityId, 
          strike, 
          type,
          symbol: symbol // Keep for reference
        });
      }
    }
  }
  
  // Sort by strike and type (CE first, then PE for same strike)
  options.sort((a, b) => {
    if (a.strike !== b.strike) return a.strike - b.strike;
    return a.type === 'CE' ? -1 : 1;
  });
  
  console.log(`[Discover] Found ${options.length} options matching criteria`);
  
  return options;
}

/**
 * Check if expiry date has passed
 */
function isExpired(expiryDate) {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  return expiry < today;
}

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    console.log('[Discover] Starting options discovery...');
    
    // Get PayTM token
    const paytmToken = process.env.PAYTM_ACCESS_TOKEN;
    if (!paytmToken) {
      return res.status(401).json({ 
        success: false,
        error: 'PayTM token not configured. Set PAYTM_ACCESS_TOKEN in environment.' 
      });
    }
    
    // Step 1: Check if we have valid cached options
    const forceRefresh = req.query.force === 'true';
    
    if (!forceRefresh) {
      const cached = await redis.get('options:current_week');
      
      if (cached) {
        const cacheData = typeof cached === 'string' ? JSON.parse(cached) : cached;
        
        if (!isExpired(cacheData.expiry)) {
          console.log(`[Discover] Using cached options (expiry: ${cacheData.expiry})`);
          
          return res.status(200).json({
            success: true,
            cached: true,
            expiry: cacheData.expiry,
            atmStrike: cacheData.atmStrike,
            options: cacheData.options,
            count: cacheData.options.length,
            discoveredAt: cacheData.discoveredAt,
            duration: Date.now() - startTime
          });
        } else {
          console.log(`[Discover] Cached options expired on ${cacheData.expiry}, refreshing...`);
        }
      }
    }
    
    // Step 2: Get Nifty 50 Index LTP for ATM calculation
    console.log('[Discover] Fetching Nifty 50 LTP...');
    const indexResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:13:INDEX',
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch Nifty LTP: ${indexResponse.status}`);
    }
    
    const indexData = await indexResponse.json();
    const niftyLTP = indexData?.data?.[0]?.last_price || indexData?.data?.[0]?.lp || 23000;
    
    console.log(`[Discover] Nifty 50 LTP: ${niftyLTP}`);
    
    // Step 3: Calculate ATM strike and range (±1000 points, ~20 strikes each side)
    const atmStrike = Math.round(niftyLTP / 50) * 50; // Round to nearest 50
    const strikeRange = 20; // 20 strikes on each side
    const minStrike = atmStrike - (strikeRange * 50);
    const maxStrike = atmStrike + (strikeRange * 50);
    
    console.log(`[Discover] ATM Strike: ${atmStrike}`);
    console.log(`[Discover] Strike Range: ${minStrike} to ${maxStrike}`);
    
    // Step 4: Get next expiry date from official calendar
    const nextExpiry = await getNextExpiryDate();
    
    if (!nextExpiry) {
      throw new Error('Could not determine next expiry date. Update niftyExpiryDates.ts calendar.');
    }
    
    console.log(`[Discover] Next expiry: ${nextExpiry}`);
    
    // Step 5: Fetch option security master CSV from PayTM
    console.log('[Discover] Fetching option security master CSV...');
    const csvResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv'
    );
    
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }
    
    const csvText = await csvResponse.text();
    
    // Step 6: Parse and filter options
    const currentWeekOptions = parseAndFilterOptions(csvText, nextExpiry, minStrike, maxStrike);
    
    if (currentWeekOptions.length === 0) {
      console.warn('[Discover] No options found! Check expiry date and CSV format.');
      
      return res.status(404).json({
        success: false,
        error: 'No options found for current week',
        expiry: nextExpiry,
        atmStrike,
        niftyLTP,
        strikeRange: { min: minStrike, max: maxStrike }
      });
    }
    
    // Step 7: Cache the results
    const cacheData = {
      expiry: nextExpiry,
      discoveredAt: new Date().toISOString(),
      atmStrike,
      niftyLTP,
      strikeRange: { min: minStrike, max: maxStrike },
      options: currentWeekOptions,
      count: currentWeekOptions.length
    };
    
    await redis.set('options:current_week', JSON.stringify(cacheData), { 
      ex: 604800 // 7 days TTL
    });
    
    console.log(`[Discover] ✅ Discovered ${currentWeekOptions.length} options`);
    console.log(`[Discover] Cached with expiry: ${nextExpiry}`);
    
    // Step 8: Return discovered options
    return res.status(200).json({
      success: true,
      cached: false,
      expiry: nextExpiry,
      atmStrike,
      niftyLTP,
      strikeRange: { min: minStrike, max: maxStrike },
      options: currentWeekOptions,
      count: currentWeekOptions.length,
      discoveredAt: cacheData.discoveredAt,
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[Discover] ❌ Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    });
  }
}
