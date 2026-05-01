// Vercel Serverless Function - Auto-fetch market data every minute
// Triggered by Vercel Cron Job

const NIFTY50_SECURITY_IDS = [
  '11536', '11723', '3499', '3456', '11630', '11915', '3063', '11532',
  '4668', '4717', '1330', '13611', '5258', '4963', '16675', '2885',
  '11483', '6364', '13538', '14977', '1922', '16669', '10447', '526',
  '15083', '4592', '1660', '1270', '14299', '4749', '5247', '4960',
  '2885', '1922', '11536', '11723', '3499', '11630', '11915', '3063',
  '11532', '4668', '4717', '1330', '13611', '5258', '4963', '16675'
];

// In-memory cache (persists during function warm state)
let cachedData = null;
let lastFetchTime = 0;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Security: Verify cron secret (optional but recommended)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Invalid cron secret' 
    });
  }

  try {
    // Check if market hours bypass is enabled
    const bypassMarketHours = process.env.BYPASS_MARKET_HOURS === 'true';

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

    if (!bypassMarketHours && (!isWeekday || !isMarketHours)) {
      return res.status(200).json({
        success: true,
        message: 'Market closed - No fetch performed',
        marketClosed: true,
        currentTime: istString,
        cached: cachedData ? true : false
      });
    }

    // Get PayTM token from environment
    const paytmToken = process.env.PAYTM_ACCESS_TOKEN;
    
    if (!paytmToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'PayTM token not configured. Set PAYTM_ACCESS_TOKEN env variable.' 
      });
    }

    console.log(`[Cron] Fetching market data at ${istString}`);

    // 1. Fetch Nifty 50 stocks
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
      throw new Error(`PayTM stocks API error: ${stockResponse.status} ${stockResponse.statusText}`);
    }

    const stockData = await stockResponse.json();

    // 2. Fetch Nifty Index LTP
    const indexResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:26000:INDEX',
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );

    if (!indexResponse.ok) {
      throw new Error(`PayTM index API error: ${indexResponse.status}`);
    }

    const indexData = await indexResponse.json();
    const niftyLTP = indexData?.data?.[0]?.lp || null;

    // 3. Fetch Nifty Options
    let optionsData = null;
    if (niftyLTP) {
      const atmStrike = Math.round(niftyLTP / 50) * 50;
      const strikes = [];
      for (let i = -10; i <= 10; i++) {
        strikes.push(atmStrike + (i * 50));
      }

      // Get nearest Thursday expiry
      const today = new Date();
      const daysUntilThursday = (4 - today.getDay() + 7) % 7 || 7;
      const thursday = new Date(today);
      thursday.setDate(today.getDate() + daysUntilThursday);
      const expiryStr = thursday.toISOString().split('T')[0].replace(/-/g, '');

      const optionPrefs = strikes.flatMap(strike => [
        `NFO:NIFTY${expiryStr}${strike}CE:OPTIDX`,
        `NFO:NIFTY${expiryStr}${strike}PE:OPTIDX`
      ]).join(',');

      const optionsResponse = await fetch(
        `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(optionPrefs)}`,
        {
          headers: {
            'x-jwt-token': paytmToken,
            'Accept': 'application/json'
          }
        }
      );

      if (optionsResponse.ok) {
        optionsData = await optionsResponse.json();
      }
    }

    // 4. Cache the data
    cachedData = {
      stocks: stockData,
      options: optionsData,
      niftyLTP,
      timestamp: Date.now(),
      fetchDuration: Date.now() - startTime,
      istTime: istString
    };
    lastFetchTime = Date.now();

    console.log(`[Cron] ✅ Fetch successful - Nifty: ${niftyLTP}, Duration: ${cachedData.fetchDuration}ms`);

    return res.status(200).json({
      success: true,
      message: 'Data fetched successfully',
      data: {
        niftyLTP,
        stockCount: stockData?.data?.length || 0,
        optionCount: optionsData?.data?.length || 0,
        timestamp: cachedData.timestamp,
        duration: cachedData.fetchDuration,
        istTime: istString
      }
    });

  } catch (error) {
    console.error('[Cron] ❌ Fetch error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: Date.now(),
      cached: cachedData ? true : false
    });
  }
}

// Export cached data getter for other API routes
export function getCachedData() {
  return cachedData;
}

export function getLastFetchTime() {
  return lastFetchTime;
}
