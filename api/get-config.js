// API endpoint to provide encrypted configuration
// Frontend will decrypt this to avoid storing plain tokens

import crypto from 'crypto';

// Simple encryption using AES-256-CBC
// The encryption key is derived from a combination of user agent and timestamp
// This is NOT military-grade security, but prevents casual inspection
function encrypt(text) {
  // Use a server-side secret key (from env) or fallback to generated key
  const SECRET_KEY = process.env.ENCRYPTION_KEY || 'nifty50-default-key-change-this-in-production';
  
  // Create a 32-byte key from the secret
  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  
  // Generate a random IV (initialization vector)
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data (IV is needed for decryption)
  return {
    iv: iv.toString('hex'),
    data: encrypted
  };
}

export default async function handler(req, res) {
  // Optional: Add simple authentication
  const authHeader = req.headers.authorization;
  const configSecret = process.env.CONFIG_SECRET;
  
  if (configSecret && authHeader !== `Bearer ${configSecret}`) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }

  try {
    // Get tokens from environment
    const paytmAccessToken = process.env.PAYTM_ACCESS_TOKEN;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!paytmAccessToken) {
      return res.status(503).json({
        success: false,
        error: 'Configuration not available'
      });
    }

    // Create config object
    const config = {
      dataProvider: 'paytm',
      paytmAccessToken: paytmAccessToken,
      googleApiKey: googleApiKey || '',
      groqApiKey: groqApiKey || '',
      refreshInterval: 60000,
      aiEnabled: true,
      bypassMarketHours: process.env.BYPASS_MARKET_HOURS === 'true'
    };

    // Encrypt the config
    const encrypted = encrypt(JSON.stringify(config));

    return res.status(200).json({
      success: true,
      encrypted: encrypted,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('[Config API] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate configuration'
    });
  }
}
