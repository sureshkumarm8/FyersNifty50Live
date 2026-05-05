// API endpoint to clear historical data from Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow GET, POST or DELETE
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed. Use GET, POST or DELETE.' });
  }

  // Optional: Add authentication to prevent unauthorized clearing
  const authSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  
  if (authSecret && authHeader !== `Bearer ${authSecret}`) {
    return res.status(401).json({ 
      error: 'Unauthorized. Provide Authorization header with admin secret.' 
    });
  }

  try {
    const { action = 'all' } = req.query;

    let deletedCount = 0;
    let message = '';

    switch (action) {
      case 'all':
        // Clear all snapshots
        const timestamps = await redis.zrange('snapshots:index', 0, -1);
        
        if (timestamps && timestamps.length > 0) {
          const pipeline = redis.pipeline();
          
          // Delete all snapshot data
          timestamps.forEach(ts => {
            pipeline.del(`snapshot:${ts}`);
          });
          
          // Delete the index
          pipeline.del('snapshots:index');
          
          // Delete latest snapshot
          pipeline.del('snapshot:latest');
          
          await pipeline.exec();
          deletedCount = timestamps.length;
        }
        
        message = `Cleared all ${deletedCount} snapshots from Redis`;
        console.log(`[Clear History] ${message}`);
        break;

      case 'today':
        // Clear only today's snapshots (last 8 hours)
        const now = Date.now();
        const eightHoursAgo = now - (8 * 60 * 60 * 1000);
        
        const allTimestamps = await redis.zrange('snapshots:index', 0, -1);
        const todayTimestamps = allTimestamps.filter(ts => parseInt(ts) >= eightHoursAgo);
        
        if (todayTimestamps.length > 0) {
          const pipeline = redis.pipeline();
          
          todayTimestamps.forEach(ts => {
            pipeline.del(`snapshot:${ts}`);
            pipeline.zrem('snapshots:index', ts);
          });
          
          await pipeline.exec();
          deletedCount = todayTimestamps.length;
        }
        
        message = `Cleared ${deletedCount} snapshots from today`;
        console.log(`[Clear History] ${message}`);
        break;

      case 'old':
        // Keep only last 100 snapshots, delete older ones
        const keepCount = 100;
        const allSnaps = await redis.zrange('snapshots:index', 0, -1, { rev: true });
        
        if (allSnaps.length > keepCount) {
          const toDelete = allSnaps.slice(keepCount);
          const pipeline = redis.pipeline();
          
          toDelete.forEach(ts => {
            pipeline.del(`snapshot:${ts}`);
            pipeline.zrem('snapshots:index', ts);
          });
          
          await pipeline.exec();
          deletedCount = toDelete.length;
        }
        
        message = `Deleted ${deletedCount} old snapshots (kept latest ${keepCount})`;
        console.log(`[Clear History] ${message}`);
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: all, today, or old' 
        });
    }

    return res.status(200).json({
      success: true,
      message,
      deletedCount,
      action
    });

  } catch (error) {
    console.error('[Clear History] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
