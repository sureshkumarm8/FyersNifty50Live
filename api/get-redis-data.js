// API endpoint to fetch latest snapshot from Redis
// This allows the frontend to read data stored by the cron job
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  try {
    // Fetch the latest snapshot from Redis
    const latest = await redis.get('snapshot:latest');
    
    if (!latest) {
      return res.status(404).json({ 
        success: false, 
        error: 'No data available yet. Cron job may not have run.' 
      });
    }
    
    const snapshot = typeof latest === 'string' ? JSON.parse(latest) : latest;
    
    // Return the snapshot data
    return res.status(200).json({
      success: true,
      data: snapshot
    });
    
  } catch (error) {
    console.error('[Redis API] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
