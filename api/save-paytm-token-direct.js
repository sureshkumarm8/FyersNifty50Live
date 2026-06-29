// Save Paytm token directly from embedded generator
// Called from TokenGeneratorModal component via postMessage

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // Enable CORS for embedded generator
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
    const { accessToken, source, timestamp } = req.body;

    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required and must be a string',
      });
    }

    // Validate token format (JWT-like)
    if (!accessToken.includes('.')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token format',
      });
    }

    console.log('[SaveToken] Saving Paytm token', {
      source: source || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      tokenLength: accessToken.length,
    });

    // Save to Redis with 24-hour expiry
    await redis.set('paytm:access_token', accessToken, { ex: 86400 });

    // Also save metadata
    await redis.set(
      'paytm:token_metadata',
      JSON.stringify({
        source: source || 'embedded-generator',
        savedAt: timestamp || new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
      { ex: 86400 }
    );

    return res.status(200).json({
      success: true,
      message: 'Token saved successfully',
      expires_in: '24 hours',
      next_refresh: '8:00 AM IST (automatic)',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SaveToken] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to save token',
    });
  }
}
