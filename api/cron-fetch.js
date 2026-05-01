// External Cron Endpoint - Called by cron-job.org every minute
// Saves data to Upstash Redis for persistent storage

import { Redis } from '@upstash/redis';

const NIFTY50_SECURITY_IDS = [
  '11536', '11723', '3499', '3456', '11630', '11915', '3063', '11532',
  '4668', '4717', '1330', '13611', '5258', '4963', '16675', '2885',
  '11483', '6364', '13538', '14977', '1922', '16669', '10447', '526',
  '15083', '4592', '1660', '1270', '14299', '4749', '5247', '4960'
];

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
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

    // Fetch Nifty Index LTP
    const indexResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:26000:INDEX',
      {
        headers: {
          'x-jwt-token': paytmToken,
          'Accept': 'application/json'
        }
      }
    );

    const indexData = await indexResponse.json();
    const niftyLTP = indexData?.data?.[0]?.lp || null;

    const duration = Date.now() - startTime;
    
    // Save to Redis for persistent storage
    const snapshot = {
      timestamp: Date.now(),
      istTime: istString,
      niftyLTP,
      stocks: stockData?.data || [],
      stockCount: stockData?.data?.length || 0,
      duration
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
