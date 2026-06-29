// API Endpoint: Fetch Paytm Market Data
// Uses PaytmClient to fetch live market data, option chains, etc.

import PaytmClient from '../../services/paytmClient';
import { sessionManager } from '../../services/paytmSessionManager';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'POST') {
      return handlePost(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[PaytmMarketData] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * GET - Fetch live market data or other market info
 */
async function handleGet(req: any, res: any) {
  const { sessionId, action, mode, preferences, type, symbol, expiry } = req.query;

  if (!sessionId) {
    return res.status(400).json({
      error: 'sessionId query parameter required',
    });
  }

  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session not found or expired',
    });
  }

  if (session.status !== 'completed') {
    return res.status(401).json({
      success: false,
      error: 'Session not authenticated',
    });
  }

  try {
    const client = new PaytmClient(
      process.env.PAYTM_API_KEY || 'ebb89582a5214f3bbf93fa7f7866ce28',
      process.env.PAYTM_API_SECRET || 'd145b65bf63c4c83a67d19d7bf3b70a7'
    );

    // Set tokens from session
    client.setAccessToken(session.accessToken!);
    client.setPublicAccessToken(session.publicAccessToken!);
    client.setReadAccessToken(session.readAccessToken!);

    // Handle different actions
    if (action === 'live-data' && mode && preferences) {
      const data = await client.getLiveMarketData(mode, preferences);
      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (action === 'option-chain' && type && symbol && expiry) {
      const data = await client.getOptionChain(type, symbol, expiry);
      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (action === 'positions') {
      const data = await client.getPositions();
      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (action === 'holdings') {
      const data = await client.getHoldings();
      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (action === 'user-details') {
      const data = await client.getUserDetails();
      return res.status(200).json({
        success: true,
        data,
      });
    }

    return res.status(400).json({
      error: 'Invalid action parameter',
      validActions: ['live-data', 'option-chain', 'positions', 'holdings', 'user-details'],
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market data',
    });
  }
}

/**
 * POST - Fetch live market data or perform market operations
 */
async function handlePost(req: any, res: any) {
  const { sessionId, action, securityIds, mode, type, symbol, expiry, ...otherParams } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      error: 'sessionId is required',
    });
  }

  const session = sessionManager.getSession(sessionId);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Session not found or expired',
    });
  }

  if (session.status !== 'completed') {
    return res.status(401).json({
      success: false,
      error: 'Session not authenticated',
    });
  }

  try {
    const client = new PaytmClient(
      process.env.PAYTM_API_KEY || 'ebb89582a5214f3bbf93fa7f7866ce28',
      process.env.PAYTM_API_SECRET || 'd145b65bf63c4c83a67d19d7bf3b70a7'
    );

    client.setAccessToken(session.accessToken!);
    client.setPublicAccessToken(session.publicAccessToken!);
    client.setReadAccessToken(session.readAccessToken!);

    // Handle different actions
    if (action === 'live-data' && securityIds) {
      const preferences = Array.isArray(securityIds) ? securityIds.join(',') : securityIds;
      const data = await client.getLiveMarketData(mode || 'FULL', preferences);
      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (action === 'option-chain') {
      const data = await client.getOptionChain(type!, symbol!, expiry!);
      return res.status(200).json({
        success: true,
        data,
      });
    }

    if (action === 'user-details') {
      const data = await client.getUserDetails();
      return res.status(200).json({
        success: true,
        data,
      });
    }

    return res.status(400).json({
      error: 'Invalid action or missing parameters',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market data',
    });
  }
}
