// Paytm OAuth Token Generation - ESM version
// Includes: sessions management + config loading (all in one file for Vercel limit)

import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local for local development
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ==================== CONFIG MANAGER ====================
let cachedConfig = null;

function getConfig() {
  // Try environment variables (Vercel production + local development)
  if (process.env.PAYTM_API_KEY || process.env.PAYTM_API_SECRET) {
    if (!cachedConfig) {
      console.log('[Config] Using environment variables');
      cachedConfig = {
        paytm: {
          apiKey: process.env.PAYTM_API_KEY || '',
          apiSecret: process.env.PAYTM_API_SECRET || '',
        },
        fyers: {
          clientId: process.env.FYERS_CLIENT_ID || '',
          secretKey: process.env.FYERS_SECRET_KEY || '',
        },
      };
    }
    return cachedConfig;
  }
  
  // Fall back to local file (development only)
  try {
    if (cachedConfig) {
      return cachedConfig;
    }
    
    const configPath = join(__dirname, '..', 'api-keys-config.json');
    if (existsSync(configPath)) {
      console.log('[Config] Using local api-keys-config.json');
      cachedConfig = JSON.parse(readFileSync(configPath, 'utf8'));
      return cachedConfig;
    }
  } catch (error) {
    console.error('[Config] Error loading local config:', error.message);
  }
  
  console.warn('[Config] No config found. Set environment variables or create api-keys-config.json');
  return null;
}

function saveTokensToFile(broker, tokens) {
  try {
    const tokensPath = join(__dirname, '..', `paytm_tokens_${Date.now()}.json`);
    
    let config = getConfig();
    if (!config) config = {};
    
    if (!config[broker]) config[broker] = {};
    
    config[broker].tokens = {
      accessToken: tokens.accessToken,
      publicAccessToken: tokens.publicAccessToken,
      readAccessToken: tokens.readAccessToken,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    writeFileSync(tokensPath, JSON.stringify(config, null, 2));
    console.log(`[Config] Tokens saved to ${tokensPath}`);
    
    return true;
  } catch (error) {
    console.error('[Config] Error saving tokens:', error.message);
    return false;
  }
}

// ==================== SESSION STORAGE ====================
const sessions = new Map();

// ==================== HANDLER ====================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  console.log(`[PaytmGenerate] ${req.method} request received`);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'POST') {
      return handlePost(req, res);
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (error) {
    console.error('[PaytmGenerate] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
    }));
  }
}

async function handleGet(req, res) {
  const { sessionId } = req.query;

  if (!sessionId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'sessionId query parameter required' }));
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Session not found or expired' }));
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({
    success: true,
    status: session.status,
    broker: session.broker,
    expiresIn: Math.max(0, session.expiresAt - Date.now()),
  }));
}

async function handlePost(req, res) {
  const { action, sessionId, requestToken } = req.body;

  const currentConfig = getConfig();
  if (!currentConfig || !currentConfig.paytm) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: false,
      error: 'Paytm configuration not found',
      hint: 'Set PAYTM_API_KEY and PAYTM_API_SECRET environment variables'
    }));
  }

  // Action 1: Initialize session
  if (action === 'init-session' || (!action && !sessionId)) {
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
  if (action === 'complete-auth' && requestToken) {
    // The session is bookkeeping, not a credential — the Paytm exchange is
    // authenticated by the api key/secret checksum alone. On Vercel the init and
    // the completion routinely land on different lambdas, so refusing to proceed
    // without an in-memory session used to fail a login that was perfectly valid.
    const session = sessions.get(sessionId) || null;
    if (!session) {
      console.warn(`[PaytmGenerate] No in-memory session for ${sessionId} — continuing anyway`);
    }

    try {
      // Accept a bare token, a query string, or the whole redirect URL.
      const raw = String(requestToken).trim();
      const fromUrl = raw.match(/[?&#]?requestToken=([^&\s]+)/i);
      const trimmedToken = fromUrl ? decodeURIComponent(fromUrl[1]) : raw;

      console.log(`[PaytmGenerate] Exchanging request token for session: ${sessionId}`);
      console.log(`[PaytmGenerate] Request token length: ${trimmedToken.length}`);
      console.log(`[PaytmGenerate] API Key length: ${currentConfig.paytm.apiKey.length}`);
      console.log(`[PaytmGenerate] API Secret length: ${currentConfig.paytm.apiSecret.length}`);

      const checksum = crypto
        .createHash('sha256')
        .update(`${currentConfig.paytm.apiKey}${trimmedToken}${currentConfig.paytm.apiSecret}`)
        .digest('hex');

      console.log(`[PaytmGenerate] Checksum: ${checksum}`);

      const requestBody = {
        api_key: currentConfig.paytm.apiKey,
        request_token: trimmedToken,
        api_secret_key: currentConfig.paytm.apiSecret,
        checksum: checksum,
      };

      console.log(`[PaytmGenerate] Request body keys: ${Object.keys(requestBody).join(', ')}`);

      const paytmResponse = await fetch('https://developer.paytmmoney.com/accounts/v2/gettoken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-JWT-Token': currentConfig.paytm.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[PaytmGenerate] Paytm API response status: ${paytmResponse.status}`);

      const tokenData = await paytmResponse.json();
      console.log(`[PaytmGenerate] Response: ${JSON.stringify(tokenData).substring(0, 200)}`);

      if (tokenData.access_token) {
        console.log(`[PaytmGenerate] ✅ Token exchange successful`);

        if (session) {
          session.status = 'completed';
          session.accessToken = tokenData.access_token;
          session.publicAccessToken = tokenData.public_access_token;
          session.readAccessToken = tokenData.read_access_token;
          sessions.set(sessionId, session);
        }

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
      if (session) {
        session.status = 'failed';
        session.errorMessage = error.message;
        sessions.set(sessionId, session);
      }

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
