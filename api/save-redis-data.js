// Save data to Redis from frontend
// Called after frontend fetches live data
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { stocks, options, niftyLTP } = req.body;
    
    if (!stocks || !Array.isArray(stocks)) {
      return res.status(400).json({ error: 'Invalid stocks data' });
    }

    const snapshot = {
      timestamp: Date.now(),
      istTime: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      niftyLTP: niftyLTP || 0,
      stocks,
      options: options || [],
      stockCount: stocks.length,
      optionsCount: options?.length || 0,
      source: 'frontend'
    };

    // Save latest snapshot
    await redis.set('snapshot:latest', JSON.stringify(snapshot));
    
    // Also save with timestamp for history
    await redis.set(`snapshot:${snapshot.timestamp}`, JSON.stringify(snapshot), {
      ex: 86400 // Expire after 24 hours
    });
    
    // Add to sorted set for retrieval
    await redis.zadd('snapshots:index', {
      score: snapshot.timestamp,
      member: snapshot.timestamp.toString()
    });
    
    // Keep only last 500 snapshots
    await redis.zremrangebyrank('snapshots:index', 0, -501);

    // IMPORTANT: Set frontend_active flag (expires in 90 seconds)
    // This tells cron job that frontend is handling data fetching
    await redis.set('frontend_active', snapshot.timestamp, {
      ex: 90  // Auto-expires if frontend closes
    });

    console.log(`[Save Redis] ✅ Saved: ${stocks.length} stocks, ${options?.length || 0} options, Nifty: ${niftyLTP} (Frontend active)`);

    return res.status(200).json({
      success: true,
      message: 'Data saved to Redis',
      timestamp: snapshot.timestamp,
      stockCount: snapshot.stockCount,
      optionsCount: snapshot.optionsCount,
      frontendActive: true
    });

  } catch (error) {
    console.error('[Save Redis] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
