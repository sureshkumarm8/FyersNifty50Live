
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local for local development
dotenv.config({ path: join(__dirname, '.env.local') });

// Config loader (same as api/paytm-generate.js)
let cachedConfig = null;

function getConfig() {
  if (process.env.PAYTM_API_KEY || process.env.PAYTM_API_SECRET) {
    if (!cachedConfig) {
      console.log('[Config] Using environment variables');
      cachedConfig = {
        paytm: {
          apiKey: process.env.PAYTM_API_KEY || '',
          apiSecret: process.env.PAYTM_API_SECRET || '',
        },
      };
    }
    return cachedConfig;
  }
  
  try {
    if (cachedConfig) return cachedConfig;
    const configPath = join(__dirname, 'api-keys-config.json');
    if (existsSync(configPath)) {
      console.log('[Config] Using local api-keys-config.json');
      cachedConfig = JSON.parse(readFileSync(configPath, 'utf8'));
      return cachedConfig;
    }
  } catch (error) {
    console.error('[Config] Error loading config:', error.message);
  }
  return null;
}

function saveTokensToFile(broker, tokens) {
  try {
    const tokensPath = join(__dirname, `paytm_tokens_${Date.now()}.json`);
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

const PORT = 5001; 
const LOCAL_MODE = process.env.LOCAL_MODE === 'true' || process.env.NODE_ENV === 'development';

// In-memory storage for local testing
const localStore = {
  history: [],
  sessionHistory: {},
  config: null,
  latestSnapshot: null
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const protocol = req.socket.encrypted ? 'https' : 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  const reqUrl = new URL(req.url, `${protocol}://${host}`);
  
  const authHeader = req.headers['authorization'];

  // Skip auth check in local mode or for local testing endpoints
  const isLocalEndpoint = reqUrl.pathname.startsWith('/api/get-history') || 
                          reqUrl.pathname.startsWith('/api/save-history') ||
                          reqUrl.pathname.startsWith('/api/get-config') ||
                          reqUrl.pathname.startsWith('/api/save-config') ||
                          reqUrl.pathname.startsWith('/api/clear-history') ||
                          reqUrl.pathname.startsWith('/api/paytm-generate') ||
                          reqUrl.pathname.startsWith('/api/paytm-market-data') ||
                          reqUrl.pathname.startsWith('/api/save-paytm-token-direct');

  if (!LOCAL_MODE && !isLocalEndpoint && !authHeader) {
     res.writeHead(401, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ error: 'Missing Authorization header' }));
     return;
  }

  // --- LOCAL TESTING ENDPOINTS ---
  
  // Get history from local storage
  if (reqUrl.pathname === '/api/get-history' && req.method === 'GET') {
    try {
      const { limit = 500, latest = false } = Object.fromEntries(reqUrl.searchParams);
      
      console.log(`[Local] Get history request - limit: ${limit}, latest: ${latest}`);

      if (latest === 'true') {
        if (!localStore.latestSnapshot) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No data available yet' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: localStore.latestSnapshot }));
        return;
      }

      if (localStore.history.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No historical data available' }));
        return;
      }

      const limitNum = Math.min(parseInt(limit), 1000);
      const data = localStore.history.slice(0, limitNum);
      
      console.log(`[Local] Returning ${data.length} history items`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: data.length, data }));
    } catch (err) {
      console.error('[Local] Get history error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Save history to local storage
  if (reqUrl.pathname === '/api/save-history' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Add to history (keep newest first)
        localStore.history.unshift(data);
        localStore.latestSnapshot = data;
        
        // Keep only last 1000 items
        if (localStore.history.length > 1000) {
          localStore.history = localStore.history.slice(0, 1000);
        }
        
        console.log(`[Local] Saved snapshot - total history: ${localStore.history.length}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: localStore.history.length }));
      } catch (err) {
        console.error('[Local] Save history error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Clear history
  if (reqUrl.pathname === '/api/clear-history' && req.method === 'POST') {
    try {
      const count = localStore.history.length;
      localStore.history = [];
      localStore.sessionHistory = {};
      localStore.latestSnapshot = null;
      
      console.log(`[Local] Cleared ${count} history items`);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: `Cleared ${count} items` }));
    } catch (err) {
      console.error('[Local] Clear history error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Get config
  if (reqUrl.pathname === '/api/get-config' && req.method === 'GET') {
    try {
      if (!localStore.config) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No config found' }));
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: localStore.config }));
    } catch (err) {
      console.error('[Local] Get config error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // Save config
  if (reqUrl.pathname === '/api/save-config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        localStore.config = JSON.parse(body);
        console.log('[Local] Saved config');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[Local] Save config error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- REDIS API PROXY (For local development with production data) ---
  if (reqUrl.pathname === '/api/get-redis-data' && req.method === 'GET') {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

      if (!redisUrl || !redisToken) {
        console.log('[Redis Proxy] Missing Redis credentials in environment');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Redis credentials not configured. Add UPSTASH_REDIS_REST_URL and TOKEN to .env.local' 
        }));
        return;
      }

      console.log('[Redis Proxy] Fetching snapshot:latest from Redis...');
      
      const response = await fetch(`${redisUrl}/get/snapshot:latest`, {
        headers: {
          'Authorization': `Bearer ${redisToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Redis returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        console.log('[Redis Proxy] No data in Redis yet');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'No data in Redis. Trigger cron: curl https://fyers-nifty50-live.vercel.app/api/cron-fetch' 
        }));
        return;
      }

      const snapshot = JSON.parse(data.result);
      console.log(`[Redis Proxy] ✅ Loaded snapshot - Stocks: ${snapshot.stockCount}, Options: ${snapshot.optionsCount || 0}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: snapshot }));
    } catch (err) {
      console.error('[Redis Proxy] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // --- QUOTES ROUTE (Using Quotes API - supports multiple symbols) ---
  if (reqUrl.pathname === '/api/quotes' && req.method === 'GET') {
    const symbols = reqUrl.searchParams.get('symbols');
    if (!symbols) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
      return;
    }

    try {
      // Use quotes API instead of depth to avoid rate limits
      // Quotes API supports multiple symbols in one request
      const fyersUrl = `https://api-t1.fyers.in/data/quotes?symbols=${symbols}`;
      
      console.log(`[Proxy] Quotes Request for: ${symbols.substring(0, 50)}...`);

      const fyersResponse = await fetch(fyersUrl, {
        method: 'GET',
        headers: { 
          'Authorization': authHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://trade.fyers.in/',
          'Origin': 'https://trade.fyers.in'
        }
      });

      const text = await fyersResponse.text();
      console.log(`[Proxy] Quotes Upstream Status: ${fyersResponse.status}`);
      
      if (fyersResponse.status !== 200) {
        console.log(`[Proxy] Error Response: ${text.substring(0, 200)}`);
      }

      let data = text ? JSON.parse(text) : {};
      
      res.writeHead(fyersResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("[Proxy] Error:", err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } 
  // --- HISTORY ROUTE ---
  else if (reqUrl.pathname === '/api/history' && req.method === 'GET') {
     const symbol = reqUrl.searchParams.get('symbol');
     const range_from = reqUrl.searchParams.get('range_from');
     const range_to = reqUrl.searchParams.get('range_to');
     const resolution = reqUrl.searchParams.get('resolution') || '1';

     if (!symbol || !range_from || !range_to) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Missing params" }));
        return;
     }

     try {
       // Try newer candles endpoint instead of history
       // Based on Fyers API v3 pattern: using /data instead of /data-rest
       const fyersUrl = `https://api-t1.fyers.in/data/candles?symbol=${symbol}&resolution=${resolution}&date_format=1&range_from=${range_from}&range_to=${range_to}&cont_flag=1`;
       
       console.log(`[Proxy] History/Candles Request: ${symbol} (${resolution}) from ${range_from} to ${range_to}`);

       const fyersResponse = await fetch(fyersUrl, {
         method: 'GET',
         headers: { 
           'Authorization': authHeader,
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
           'Accept': '*/*',
           'Referer': 'https://trade.fyers.in/',
           'Origin': 'https://trade.fyers.in'
         }
       });

       const text = await fyersResponse.text();
       console.log(`[Proxy] History Upstream Status: ${fyersResponse.status}`);
       
       if (fyersResponse.status !== 200) {
         console.log(`[Proxy] History Error Response: ${text.substring(0, 300)}`);
       }
       
       let data = text ? JSON.parse(text) : {};
       
       res.writeHead(fyersResponse.status, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(data));
     } catch(err) {
        console.error("[Proxy] History Error:", err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
     }
  }
  // --- PAYTM QUOTES ROUTE ---
  else if (reqUrl.pathname === '/api/paytm/quotes' && req.method === 'POST') {
     let body = '';
     req.on('data', chunk => { body += chunk.toString(); });
     req.on('end', async () => {
        try {
           console.log(`[Proxy] PayTM POST body received: ${body.substring(0, 100)}...`);
           
           const parsed = JSON.parse(body);
           const { security_ids, scrip_type } = parsed;
           
           console.log(`[Proxy] Parsed security_ids:`, security_ids ? `${security_ids.length} items` : 'undefined');
           console.log(`[Proxy] Scrip type: ${scrip_type}`);
           
           if (!security_ids || !Array.isArray(security_ids)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                 error: 'Missing or invalid security_ids array',
                 received: typeof security_ids,
                 body: body.substring(0, 200)
              }));
              return;
           }
           
           console.log(`[Proxy] PayTM Request for ${security_ids.length} securities`);
           
           // PayTM Money Live Price API
           // Format: Exchange:ScripId:ScripType (e.g., NSE:11536:EQUITY)
           const type = scrip_type || 'EQUITY';
           const preferences = security_ids.map(id => `NSE:${id}:${type}`).join(',');
           const paytmUrl = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(preferences)}`;
           
           console.log(`[Proxy] PayTM URL: ${paytmUrl.substring(0, 150)}...`);
           
           const paytmResponse = await fetch(paytmUrl, {
              method: 'GET',
              headers: {
                 'x-jwt-token': authHeader.replace('Bearer ', ''),
                 'Accept': 'application/json'
              }
           });
           
           const text = await paytmResponse.text();
           console.log(`[Proxy] PayTM Status: ${paytmResponse.status}`);
           console.log(`[Proxy] PayTM Response sample: ${text.substring(0, 300)}...`);
           
           if (!paytmResponse.ok) {
              console.error(`[Proxy] PayTM Error Response: ${text.substring(0, 200)}`);
           }
           
           let data;
           try {
              data = text ? JSON.parse(text) : {};
           } catch (e) {
              console.error("[Proxy] PayTM returned non-JSON:", text.substring(0, 200));
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                 error: 'PayTM API returned invalid response',
                 details: text.substring(0, 200)
              }));
              return;
           }
           
           console.log(`[Proxy] PayTM data structure:`, JSON.stringify(data).substring(0, 300));
           
           res.writeHead(paytmResponse.status, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify(data));
        } catch(err) {
           console.error("[Proxy] PayTM Error:", err.message);
           res.writeHead(500);
           res.end(JSON.stringify({ error: err.message }));
        }
     });
  }
  // Paytm OAuth Token Generation
  else if (reqUrl.pathname === '/api/paytm-generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Session storage
        if (!localStore.paytmSessions) {
          localStore.paytmSessions = new Map();
        }

        // Get config
        const config = getConfig();
        if (!config || !config.paytm) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Paytm configuration not found',
            hint: 'Upload api-keys-config.json or set PAYTM_API_KEY environment variables'
          }));
          return;
        }

        // Action 1: Initialize session
        if (data.action === 'init-session') {
          const sessionId = crypto.randomBytes(16).toString('hex');
          const stateKey = crypto.randomBytes(16).toString('hex');
          
          localStore.paytmSessions.set(sessionId, {
            sessionId,
            status: 'pending',
            broker: 'paytm',
            stateKey,
            timestamp: Date.now(),
            expiresAt: Date.now() + 15 * 60 * 1000,
          });

          const loginUrl = `https://login.paytmmoney.com/merchant-login?apiKey=${config.paytm.apiKey}&state=${stateKey}`;

          console.log(`[Paytm] Session created: ${sessionId}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            sessionId,
            loginUrl,
            stateKey,
            message: 'Open loginUrl in browser for OTP authentication',
          }));
          return;
        }

        // Action 2: Complete auth with request token
        if (data.action === 'complete-auth' && data.sessionId && data.requestToken) {
          const session = localStore.paytmSessions.get(data.sessionId);
          
          if (!session) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Session not found or expired' }));
            return;
          }

          try {
            console.log(`[Paytm] Exchanging request token for session: ${data.sessionId}`);
            console.log(`[Paytm] Request token length: ${data.requestToken?.length || 0}`);
            
            const checksum = crypto
              .createHash('sha256')
              .update(`${config.paytm.apiKey}${data.requestToken}${config.paytm.apiSecret}`)
              .digest('hex');
            
            const requestBody = {
              api_key: config.paytm.apiKey,
              request_token: data.requestToken,
              api_secret_key: config.paytm.apiSecret,
              checksum: checksum,
            };
            
            console.log(`[Paytm] Request body keys:`, Object.keys(requestBody));
            
            const paytmResponse = await fetch('https://developer.paytmmoney.com/accounts/v2/gettoken', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-JWT-Token': config.paytm.apiKey,
              },
              body: JSON.stringify(requestBody),
            });

            console.log(`[Paytm] Response status: ${paytmResponse.status}`);
            
            const tokenData = await paytmResponse.json();

            if (tokenData.access_token) {
              session.status = 'completed';
              session.accessToken = tokenData.access_token;
              session.publicAccessToken = tokenData.public_access_token;
              session.readAccessToken = tokenData.read_access_token;
              localStore.paytmSessions.set(data.sessionId, session);

              // Save tokens locally
              saveTokensToFile('paytm', {
                accessToken: tokenData.access_token,
                publicAccessToken: tokenData.public_access_token,
                readAccessToken: tokenData.read_access_token,
              });

              console.log(`[Paytm] ✅ Auth complete for session: ${data.sessionId}`);
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
            localStore.paytmSessions.set(data.sessionId, session);

            console.error(`[Paytm] Auth error for session ${data.sessionId}:`, error.message);
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
      } catch (err) {
        console.error("[Paytm] Error:", err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
});

// ============================================
// PROXY ENDPOINTS FOR EMBEDDED SITES
// ============================================

// Proxy for Zerodha Kite
server.on('request', (req, res) => {
  if (req.url.startsWith('/api/proxy/zerodha')) {
    (async () => {
      try {
        const { default: fetch } = await import('node-fetch');
        console.log('[Proxy] Fetching Zerodha Kite...');
        
        const response = await fetch('https://kite.zerodha.com/', {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://kite.zerodha.com/',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let html = await response.text();
        console.log('[Proxy] Zerodha response received, modifying...');
        
        // Remove X-Frame-Options and other security headers that block embedding
        html = html.replace(/X-Frame-Options:[^;\n]*/gi, '');
        html = html.replace(/frame-ancestors[^;]*/gi, '');
        
        // Modify CSP to allow framing
        html = html.replace(
          /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi,
          '<meta http-equiv="Content-Security-Policy" content="frame-ancestors \'self\' *;">'
        );

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy': "frame-ancestors 'self' *"
        });
        console.log('[Proxy] ✅ Zerodha served successfully');
        res.end(html);
      } catch (err) {
        console.error('[Proxy] ❌ Zerodha Error:', err.message);
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial; background: #f0f0f0; padding: 40px; text-align: center; }
                .error { background: white; padding: 40px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
                h1 { color: #d32f2f; }
                p { color: #666; line-height: 1.6; }
                code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <div class="error">
                <h1>⚠️ Cannot Load Zerodha Kite</h1>
                <p>Failed to fetch Zerodha Kite. The site might be:</p>
                <ul style="text-align: left;">
                  <li>Temporarily unavailable</li>
                  <li>Blocking our proxy server</li>
                  <li>Experiencing network issues</li>
                </ul>
                <p><strong>Error:</strong> <code>${err.message}</code></p>
                <p><a href="https://kite.zerodha.com/" target="_blank">Open Zerodha Kite directly →</a></p>
              </div>
            </body>
          </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(errorHtml);
      }
    })();
    return;
  }

  if (req.url.startsWith('/api/proxy/sensibull')) {
    (async () => {
      try {
        const { default: fetch } = await import('node-fetch');
        console.log('[Proxy] Fetching Sensibull...');
        
        const response = await fetch('https://web.sensibull.com/open-interest/oi-vs-strike?tradingsymbol=RELIANCE', {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://web.sensibull.com/',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let html = await response.text();
        console.log('[Proxy] Sensibull response received, modifying...');
        
        // Remove blocking headers
        html = html.replace(/X-Frame-Options:[^;\n]*/gi, '');
        html = html.replace(/frame-ancestors[^;]*/gi, '');
        
        // Modify CSP
        html = html.replace(
          /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi,
          '<meta http-equiv="Content-Security-Policy" content="frame-ancestors \'self\' *;">'
        );

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Frame-Options': 'ALLOWALL',
          'Content-Security-Policy': "frame-ancestors 'self' *"
        });
        console.log('[Proxy] ✅ Sensibull served successfully');
        res.end(html);
      } catch (err) {
        console.error('[Proxy] ❌ Sensibull Error:', err.message);
        const errorHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial; background: #f0f0f0; padding: 40px; text-align: center; }
                .error { background: white; padding: 40px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
                h1 { color: #d32f2f; }
                p { color: #666; line-height: 1.6; }
                code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <div class="error">
                <h1>⚠️ Cannot Load Sensibull</h1>
                <p>Failed to fetch Sensibull. The site might be:</p>
                <ul style="text-align: left;">
                  <li>Temporarily unavailable</li>
                  <li>Blocking our proxy server</li>
                  <li>Experiencing network issues</li>
                </ul>
                <p><strong>Error:</strong> <code>${err.message}</code></p>
                <p><a href="https://web.sensibull.com/open-interest/oi-vs-strike?tradingsymbol=RELIANCE" target="_blank">Open Sensibull directly →</a></p>
              </div>
            </body>
          </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(errorHtml);
      }
    })();
    return;
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Local Server running at http://localhost:${PORT}`);
  if (LOCAL_MODE) {
    console.log(`🔧 LOCAL MODE ENABLED - Using in-memory storage for testing`);
    console.log(`   • No Redis required`);
    console.log(`   • History stored in memory (resets on restart)`);
    console.log(`   • Authentication relaxed for testing`);
  }
  console.log();
});
