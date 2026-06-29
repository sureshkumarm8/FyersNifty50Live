// API Endpoint: Generate Session and Login URL for Paytm
// This replaces the external liveQuotesData app - full OAuth flow

import PaytmClient from '../../services/paytmClient';
import { sessionManager } from '../../services/paytmSessionManager';

const PAYTM_API_KEY = process.env.PAYTM_API_KEY || 'ebb89582a5214f3bbf93fa7f7866ce28';
const PAYTM_API_SECRET = process.env.PAYTM_API_SECRET || 'd145b65bf63c4c83a67d19d7bf3b70a7';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    console.error('[PaytmGenerate] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * GET - Returns session status or retrieves user details
 */
async function handleGet(req: any, res: any) {
  const { sessionId, action } = req.query;

  if (action === 'user-details' && sessionId) {
    // Get user details if logged in
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired',
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Session not completed. User token not available.',
        status: session.status,
      });
    }

    try {
      const client = new PaytmClient(PAYTM_API_KEY, PAYTM_API_SECRET);
      client.setAccessToken(session.accessToken!);
      client.setPublicAccessToken(session.publicAccessToken!);
      client.setReadAccessToken(session.readAccessToken!);

      const userDetails = await client.getUserDetails();

      return res.status(200).json({
        success: true,
        userDetails,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch user details',
      });
    }
  }

  if (sessionId) {
    // Check session status
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired',
      });
    }

    return res.status(200).json({
      success: true,
      status: session.status,
      broker: session.broker,
      expiresIn: Math.max(0, session.expiresAt - Date.now()),
    });
  }

  return res.status(400).json({
    error: 'sessionId query parameter required',
  });
}

/**
 * POST - Create new session or complete OAuth flow
 */
async function handlePost(req: any, res: any) {
  const { action, sessionId, requestToken, redirectUrl } = req.body;

  // Action 1: Initiate new login session
  if (action === 'init-session' || !sessionId) {
    const session = sessionManager.createSession('paytm');
    const client = new PaytmClient(PAYTM_API_KEY, PAYTM_API_SECRET);
    const loginUrl = client.getLoginUrl(session.stateKey!);

    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      loginUrl,
      stateKey: session.stateKey,
      message: 'Open loginUrl in browser for OTP authentication',
    });
  }

  // Action 2: Exchange request token for access tokens
  if (action === 'complete-auth' && sessionId && requestToken) {
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or expired',
      });
    }

    try {
      console.log('[PaytmGenerate] Exchanging request token for access token');

      const client = new PaytmClient(PAYTM_API_KEY, PAYTM_API_SECRET);
      const tokenResponse = await client.generateSession(requestToken);

      // Update session with tokens
      sessionManager.completeSession(
        sessionId,
        tokenResponse.access_token,
        tokenResponse.public_access_token,
        tokenResponse.read_access_token
      );

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        accessToken: tokenResponse.access_token,
        publicAccessToken: tokenResponse.public_access_token,
        readAccessToken: tokenResponse.read_access_token,
        expiresIn: '24 hours',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sessionManager.failSession(sessionId, errorMessage);

      return res.status(400).json({
        success: false,
        error: 'Failed to exchange request token',
        details: errorMessage,
      });
    }
  }

  // Action 3: Direct token input (for testing/fallback)
  if (action === 'verify-token' && sessionId) {
    const { accessToken, publicAccessToken, readAccessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        error: 'accessToken is required',
      });
    }

    try {
      // Verify tokens work by fetching user details
      const client = new PaytmClient(PAYTM_API_KEY, PAYTM_API_SECRET);
      client.setAccessToken(accessToken);
      if (publicAccessToken) client.setPublicAccessToken(publicAccessToken);
      if (readAccessToken) client.setReadAccessToken(readAccessToken);

      await client.getUserDetails();

      // Store tokens in session
      sessionManager.completeSession(
        sessionId,
        accessToken,
        publicAccessToken || accessToken,
        readAccessToken || accessToken
      );

      return res.status(200).json({
        success: true,
        message: 'Tokens verified and stored',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Token verification failed. Tokens may be invalid or expired.',
      });
    }
  }

  return res.status(400).json({
    error: 'Invalid request parameters',
    hint: 'Use action: "init-session", "complete-auth", or "verify-token"',
  });
}
