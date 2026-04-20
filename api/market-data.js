// Vercel Serverless Function: Fetch and cache market data
// Path: api/market-data.js

import { kv } from '@vercel/kv';

const CACHE_KEY = 'nifty50_live_data';
const CACHE_TTL = 60; // 60 seconds cache

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Try to get cached data first
    const cached = await kv.get(CACHE_KEY);
    
    if (cached) {
      console.log('[market-data] Returning cached data');
      return res.status(200).json({
        success: true,
        cached: true,
        timestamp: cached.timestamp,
        data: cached.data
      });
    }

    // If no cache, return error (data should be populated by cron)
    return res.status(503).json({
      success: false,
      error: 'Market data not available. Cron job may not have run yet.',
      message: 'Please wait for market hours (9:17 AM IST onwards)'
    });

  } catch (error) {
    console.error('[market-data] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
