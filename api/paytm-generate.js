// API Endpoint: Generate Session and Login URL for Paytm
// Full OAuth flow implementation

const PAYTM_API_KEY = process.env.PAYTM_API_KEY || 'ebb89582a5214f3bbf93fa7f7866ce28';
const PAYTM_API_SECRET = process.env.PAYTM_API_SECRET || 'd145b65bf63c4c83a67d19d7bf3b70a7';

// Simple session storage (in-memory)
const sessions = new Map();

module.exports = async function handler(req, res) {
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
      error: error.message || 'Internal server error',
    });
  }
};

async function handleGet(req, res) {
  const { sessionId, action } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter required' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found or expired' });
  }

  return res.status(200).json({
    success: true,
    status: session.status,
    broker: session.broker,
    expiresIn: Math.max(0, session.expiresAt - Date.now()),
  });
}

async function handlePost(req, res) {
  const { action, sessionId, requestToken } = req.body;
  const crypto = require('crypto');

  // Action 1: Initiate new login session
  if (action === 'init-session' || !sessionId) {
    const newSessionId = crypto.randomBytes(16).toString('hex');
    const stateKey = crypto.randomBytes(16).toString('hex');

    sessions.set(newSessionId, {
      sessionId: newSessionId,
      status: 'pending',
      broker: 'paytm',
      timestamp: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      stateKey,
    });

    const loginUrl = `https://login.paytmmoney.com/merchant-login?apiKey=${PAYTM_API_KEY}&state=${stateKey}`;

    return res.status(200).json({
      success: true,
      sessionId: newSessionId,
      loginUrl,
      stateKey,
      message: 'Open loginUrl in browser for OTP authentication',
    });
  }

  // Action 2: Exchange request token for access tokens
  if (action === 'complete-auth' && sessionId && requestToken) {
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found or expired' });
    }

    try {
      console.log('[PaytmGenerate] Exchanging request token for access token');

      const response = await fetch('https://developer.paytmmoney.com/accounts/v2/gettoken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: PAYTM_API_KEY,
          request_token: requestToken,
          api_secret_key: PAYTM_API_SECRET,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        session.status = 'completed';
        session.accessToken = data.access_token;
        session.publicAccessToken = data.public_access_token;
        session.readAccessToken = data.read_access_token;
        sessions.set(sessionId, session);

        return res.status(200).json({
          success: true,
          message: 'Authentication successful',
          accessToken: data.access_token,
          publicAccessToken: data.public_access_token,
          readAccessToken: data.read_access_token,
          expiresIn: '24 hours',
        });
      } else {
        throw new Error(data.message || 'Failed to generate token');
      }
    } catch (error) {
      session.status = 'failed';
      session.errorMessage = error.message;
      sessions.set(sessionId, session);

      return res.status(400).json({
        success: false,
        error: 'Failed to exchange request token',
        details: error.message,
      });
    }
  }

  return res.status(400).json({
    error: 'Invalid request parameters',
    hint: 'Use action: "init-session" or "complete-auth"',
  });
}
