// Vercel Cron Job: Fetch live market data every minute during market hours
export const config = { maxDuration: 60 };

const NIFTY50_SECURITY_IDS = [
  10666, 11536, 11915, 11184, 10940, 11483, 11532, 11195, 10447, 11723,
  14977, 11630, 11194, 10604, 12691, 11194, 10940, 11915, 11536, 10666
];

async function fetchPayTMData(accessToken) {
  const preferences = NIFTY50_SECURITY_IDS.map(id => `NSE:${id}:EQUITY`).join(',');
  const url = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(preferences)}`;

  const response = await fetch(url, {
    headers: { 'x-jwt-token': accessToken, 'Accept': 'application/json' }
  });

  if (!response.ok) throw new Error(`PayTM API failed: ${response.status}`);
  return await response.json();
}

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    const marketStart = 9 * 60 + 17;
    const marketEnd = 15 * 60 + 30;
    const isMarketHours = currentMinutes >= marketStart && currentMinutes <= marketEnd;

    if (!isMarketHours && process.env.VITE_BYPASS_MARKET_HOURS !== 'true') {
      return res.status(200).json({ skipped: true, message: 'Outside market hours' });
    }

    const data = await fetchPayTMData(process.env.VITE_PAYTM_ACCESS_TOKEN);
    
    // Store in Edge Config or KV (you'll need to set this up)
    // For now, we'll just return success
    return res.status(200).json({
      success: true,
      timestamp: Date.now(),
      recordCount: data?.data?.length || 0
    });

  } catch (error) {
    console.error('[cron]', error);
    return res.status(500).json({ error: error.message });
  }
}
