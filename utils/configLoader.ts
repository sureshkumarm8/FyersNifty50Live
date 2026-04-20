// Configuration loader that reads from environment variables (Vercel) or falls back to localStorage
export interface AppConfig {
  paytm: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
  };
  fyers: {
    clientId: string;
    secretKey: string;
    accessToken: string;
  };
  google: {
    apiKey: string;
  };
  groq: {
    apiKey: string;
  };
  claudeApiKey: {
    apiKey: string;
  };
  config: {
    bypassMarketHours: boolean;
    refreshInterval: number;
  };
}

export function loadConfig(): AppConfig {
  // Try environment variables first (Vercel deployment)
  if (import.meta.env.VITE_PAYTM_ACCESS_TOKEN || import.meta.env.VITE_FYERS_ACCESS_TOKEN) {
    return {
      paytm: {
        apiKey: import.meta.env.VITE_PAYTM_API_KEY || '',
        apiSecret: import.meta.env.VITE_PAYTM_API_SECRET || '',
        accessToken: import.meta.env.VITE_PAYTM_ACCESS_TOKEN || '',
      },
      fyers: {
        clientId: import.meta.env.VITE_FYERS_CLIENT_ID || '',
        secretKey: import.meta.env.VITE_FYERS_SECRET_KEY || '',
        accessToken: import.meta.env.VITE_FYERS_ACCESS_TOKEN || '',
      },
      google: {
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
      },
      groq: {
        apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
      },
      claudeApiKey: {
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
      },
      config: {
        bypassMarketHours: import.meta.env.VITE_BYPASS_MARKET_HOURS === 'true',
        refreshInterval: parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '60000', 10),
      },
    };
  }

  // Fallback to localStorage (local development or manual upload)
  try {
    const saved = localStorage.getItem('app_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load config from localStorage:', e);
  }

  // Return empty config as last resort
  return {
    paytm: { apiKey: '', apiSecret: '', accessToken: '' },
    fyers: { clientId: '', secretKey: '', accessToken: '' },
    google: { apiKey: '' },
    groq: { apiKey: '' },
    claudeApiKey: { apiKey: '' },
    config: { bypassMarketHours: false, refreshInterval: 60000 },
  };
}

export function saveConfigToLocalStorage(config: AppConfig): void {
  localStorage.setItem('app_config', JSON.stringify(config));
}

export function getAccessToken(provider: 'paytm' | 'fyers'): string {
  const config = loadConfig();
  return provider === 'paytm' ? config.paytm.accessToken : config.fyers.accessToken;
}

export function getApiKey(service: 'google' | 'groq' | 'claude'): string {
  const config = loadConfig();
  if (service === 'google') return config.google.apiKey;
  if (service === 'groq') return config.groq.apiKey;
  if (service === 'claude') return config.claudeApiKey.apiKey;
  return '';
}
