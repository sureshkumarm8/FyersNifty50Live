// API endpoint to get cached market data
// Frontend calls this instead of PayTM directly

let cachedData = null;

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data from cron-fetch cache
    // Note: In production, you'd use Redis/Vercel KV for shared state
    // For now, return a message directing to use direct API
    
    const paytmToken = process.env.PAYTM_ACCESS_TOKEN;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!paytmToken) {
      return res.status(503).json({
        success: false,
        error: 'Service not configured',
        message: 'Backend token not set'
      });
    }

    // Check if there's a query to force refresh
    if (req.query.refresh === 'true') {
      // Fetch fresh data
      const NIFTY50_SECURITY_IDS = [
        '11536', '11723', '3499', '3456', '11630', '11915', '3063', '11532',
        '4668', '4717', '1330', '13611', '5258', '4963', '16675', '2885',
        '11483', '6364', '13538', '14977', '1922', '16669', '10447', '526',
        '15083', '4592', '1660', '1270', '14299', '4749', '5247', '4960'
      ];

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

      const stockData = await stockResponse.json();

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

      cachedData = {
        stocks: stockData,
        niftyLTP,
        timestamp: Date.now()
      };
    }

    if (!cachedData) {
      return res.status(503).json({
        success: false,
        error: 'No cached data available',
        message: 'Cron job has not run yet or cache expired'
      });
    }

    const dataAge = Date.now() - cachedData.timestamp;
    
    return res.status(200).json({
      success: true,
      data: cachedData,
      meta: {
        cached: true,
        age: dataAge,
        ageMinutes: Math.floor(dataAge / 60000)
      }
    });

  } catch (error) {
    console.error('[market-data] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
