// Paytm OAuth Token Generation - ESM version
import crypto from 'crypto';
import sessions from './_sessions.js';
import { getConfig, saveTokensToFile } from './_config.js';

export default async function handler(req, res) {
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
}

async function handleGet(req, res) {
  const { sessionId } = req.query;

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

  const currentConfig = getConfig();
  if (!currentConfig || !currentConfig.paytm) {
    return res.status(400).json({
      success: false,
      error: 'Paytm configuration not found',
      hint: 'Set PAYTM_API_KEY and PAYTM_API_SECRET environment variables'
    });
  }

  // Action 1: Initialize session
  if (action === 'init-session' || !sessionId) {
    const newSessionId = crypto.randomBytes(16).toString('hex');
    const stateKey = crypto.randomBytes(16).toString('hex');

    sessions.set(newSessionId, {
      sessionId: newSessionId,
      status: 'pending',
      broker: 'paytm',
      stateKey,
      timestamp: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const loginUrl = `https://login.paytmmoney.com/merchant-login?apiKey=${currentConfig.paytm.apiKey}&state=${stateKey}`;

    console.log(`[PaytmGenerate] Session created: ${newSessionId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      sessionId: newSessionId,
      loginUrl,
      stateKey,
      message: 'Open loginUrl in browser for OTP authentication',
    }));
    return;
  }

  // Action 2: Complete auth with request token
  if (action === 'complete-auth' && sessionId && requestToken) {
    const session = sessions.get(sessionId);

    if (!session) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Session not found or expired' }));
      return;
    }

    try {
      console.log(`[PaytmGenerate] Exchanging request token for session: ${sessionId}`);
      console.log(`[PaytmGenerate] Request token length: ${requestToken?.length || 0}`);

      const checksum = crypto
        .createHash('sha256')
        .update(`${currentConfig.paytm.apiKey}${requestToken}${currentConfig.paytm.apiSecret}`)
        .digest('hex');

      const paytmResponse = await fetch('https://developer.paytmmoney.com/accounts/v2/gettoken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-JWT-Token': currentConfig.paytm.apiKey,
        },
        body: JSON.stringify({
          api_key: currentConfig.paytm.apiKey,
          request_token: requestToken,
          api_secret_key: currentConfig.paytm.apiSecret,
          checksum: checksum,
        }),
      });

      console.log(`[PaytmGenerate] Paytm API response status: ${paytmResponse.status}`);

      const tokenData = await paytmResponse.json();

      if (tokenData.access_token) {
        console.log(`[PaytmGenerate] ✅ Token exchange successful`);

        session.status = 'completed';
        session.accessToken = tokenData.access_token;
        session.publicAccessToken = tokenData.public_access_token;
        session.readAccessToken = tokenData.read_access_token;
        sessions.set(sessionId, session);

        // Save tokens locally
        saveTokensToFile('paytm', {
          accessToken: tokenData.access_token,
          publicAccessToken: tokenData.public_access_token,
          readAccessToken: tokenData.read_access_token,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Authentication successful',
          accessToken: tokenData.access_token,
          publicAccessToken: tokenData.public_access_token,
          readAccessToken: tokenData.read_access_token,
          expiresIn: '24 hours',
        }));
        return;
      } else {
        throw new Error(tokenData.message || 'Failed to generate token');
      }
    } catch (error) {
      session.status = 'failed';
      session.errorMessage = error.message;
      sessions.set(sessionId, session);

      console.error(`[PaytmGenerate] Auth error: ${error.message}`);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to exchange request token',
        details: error.message,
      }));
      return;
    }
  }

  res.writeHead(400, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Invalid request parameters',
    hint: 'Use action: "init-session" or "complete-auth"',
  }));
}
