// API endpoint to get historical market data from Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 500, latest = false } = req.query;

    // If only latest snapshot requested
    if (latest === 'true') {
      const latestSnapshot = await redis.get('snapshot:latest');
      
      if (!latestSnapshot) {
        return res.status(404).json({
          success: false,
          error: 'No data available yet'
        });
      }

      return res.status(200).json({
        success: true,
        data: typeof latestSnapshot === 'string' ? JSON.parse(latestSnapshot) : latestSnapshot
      });
    }

    // Get all snapshots from sorted set
    const timestamps = await redis.zrange('snapshots:index', 0, -1, { rev: true });
    
    if (!timestamps || timestamps.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No historical data available'
      });
    }

    // Limit the number of snapshots
    const limitNum = Math.min(parseInt(limit), 1000);
    const timestampsToFetch = timestamps.slice(0, limitNum);

    // Fetch all snapshots
    const pipeline = redis.pipeline();
    timestampsToFetch.forEach(ts => {
      pipeline.get(`snapshot:${ts}`);
    });
    
    const snapshots = await pipeline.exec();
    
    // Parse and filter valid snapshots
    const history = snapshots
      .filter(s => s !== null)
      .map(s => typeof s === 'string' ? JSON.parse(s) : s);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (error) {
    console.error('[History API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
