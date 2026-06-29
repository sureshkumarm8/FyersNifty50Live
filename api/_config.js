// Config loading - Simplified for Vercel (env vars only)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cachedConfig = null;

export function getConfig() {
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
        google: {
          apiKey: process.env.GOOGLE_API_KEY || '',
        },
        groq: {
          apiKey: process.env.GROQ_API_KEY || '',
        },
        config: {
          bypassMarketHours: process.env.BYPASS_MARKET_HOURS === 'true',
          refreshInterval: parseInt(process.env.REFRESH_INTERVAL || '60000', 10)
        }
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

export function saveTokensToFile(broker, tokens) {
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
