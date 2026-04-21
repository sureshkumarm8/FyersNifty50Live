// GitHub Actions calls this every minute to fetch and store data server-side

const NIFTY50_SECURITY_IDS = [
  10666, 11536, 11915, 11184, 10940, 11483, 11532, 11195, 10447, 11723,
  14977, 11630, 11194, 10604, 12691, 11028, 11630, 11532, 10940, 11915,
  11536, 10666, 11483, 11195, 11723, 14977, 11194, 10604, 10447, 11630,
  11184, 11532, 10940, 11915, 11536, 10666, 11483, 11195, 11723, 14977,
  11194, 10604, 10447, 11630, 11184, 11532, 10940, 11915, 11536, 10666
];

export const config = { maxDuration: 60 };

async function fetchPayTMData(accessToken) {
  const preferences = NIFTY50_SECURITY_IDS.map(id => `NSE:${id}:EQUITY`).join(',');
  const url = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(preferences)}`;

  const response = await fetch(url, {
    headers: { 'x-jwt-token': accessToken, 'Accept': 'application/json' }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayTM API failed: ${response.status} - ${text}`);
  }

  return await response.json();
}

async function fetchNiftyIndex(accessToken) {
  const url = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:26000:INDEX`;

  const response = await fetch(url, {
    headers: { 'x-jwt-token': accessToken, 'Accept': 'application/json' }
  });

  if (response.ok) {
    return await response.json();
  }
  return null;
}

export default async function handler(req, res) {
  // Verify authorization from GitHub Actions
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[cron] Fetching market data...');
    
    // Check market hours
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    const marketStart = 9 * 60 + 17; // 9:17 AM
    const marketEnd = 15 * 60 + 30;  // 3:30 PM
    const isMarketHours = currentMinutes >= marketStart && currentMinutes <= marketEnd;
    const bypassMarketHours = process.env.VITE_BYPASS_MARKET_HOURS === 'true';

    if (!isMarketHours && !bypassMarketHours) {
      console.log('[cron] Outside market hours, skipping');
      return res.status(200).json({
        success: true,
        skipped: true,
        message: 'Outside market hours',
        time: istTime.toLocaleTimeString('en-IN')
      });
    }

    // Fetch data from PayTM
    const accessToken = process.env.VITE_PAYTM_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('VITE_PAYTM_ACCESS_TOKEN not configured');
    }

    const [stocksData, indexData] = await Promise.all([
      fetchPayTMData(accessToken),
      fetchNiftyIndex(accessToken)
    ]);

    const marketData = {
      timestamp: Date.now(),
      istTime: istTime.toLocaleString('en-IN'),
      stocks: stocksData,
      index: indexData,
      fetchedAt: new Date().toISOString()
    };

    // Store data server-side (POST to /api/market-data)
    const storeUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/market-data`;
    const storeResponse = await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify(marketData)
    });

    if (!storeResponse.ok) {
      console.error('[cron] Failed to store data:', await storeResponse.text());
    }

    console.log('[cron] Market data fetched and stored successfully');

    return res.status(200).json({
      success: true,
      cached: true,
      timestamp: marketData.timestamp,
      recordCount: stocksData?.data?.length || 0
    });

  } catch (error) {
    console.error('[cron] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
