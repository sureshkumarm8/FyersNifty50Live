
import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';

// Points to the Vercel API route (api/quotes.js) or local proxy
const PROXY_URL = '/api/quotes'; 

const processResponse = (data: FyersQuoteResponse): FyersQuote[] => {
  if (data.s !== 'ok') {
    throw new Error(data.message || "API returned error status");
  }
  if (data && Array.isArray(data.d)) {
    return data.d.map(item => item.v).filter(Boolean);
  }
  return [];
};

export const fetchQuotes = async (
  symbols: string[],
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  // 1. Mock Data Handling
  if (credentials.isDemoMode) {
    return fetchMockQuotes(symbols);
  }

  // 2. Credential Validation
  if (!credentials.appId || !credentials.accessToken) {
    throw new Error("Missing Credentials");
  }

  const symbolsParam = symbols.join(',');
  const targetUrl = `${PROXY_URL}?symbols=${symbolsParam}`;

  // 3. Fetch via Proxy (Vercel API or Local Server)
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `${credentials.appId}:${credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized: Check App ID & Token");
      if (response.status === 403) throw new Error("Forbidden: Access Denied");
      // Specific check for Vercel 404 (function not found) or local server down
      if (response.status === 404) throw new Error("API Endpoint not found. (Check Vercel deployment or local server)");
      throw new Error(data.message || `Server Error: ${response.status}`);
    }

    return processResponse(data);

  } catch (error: any) {
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Connection Failed. Ensure the API server is running.");
    }
    throw error;
  }
};

// --- Mock Data Generator (Unchanged) ---
const randomVariation = (price: number) => {
  const change = price * (Math.random() * 0.004 - 0.002);
  return Number((price + change).toFixed(2));
};

let mockCache: Record<string, FyersQuote> = {};

const fetchMockQuotes = async (symbols: string[]): Promise<FyersQuote[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  return symbols.map(sym => {
    const basePrice = Math.random() * 3000 + 500;
    const prev = mockCache[sym];
    let lp = prev ? randomVariation(prev.lp) : Number(basePrice.toFixed(2));
    
    const open = prev ? prev.open_price : Number((lp * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2));
    const prevClose = prev ? prev.prev_close_price : Number((lp * (1 + (Math.random() * 0.04 - 0.02))).toFixed(2));
    
    const ch = Number((lp - prevClose).toFixed(2));
    const chp = Number(((ch / prevClose) * 100).toFixed(2));

    const quote: FyersQuote = {
      symbol: sym,
      short_name: sym.replace('NSE:', '').replace('-EQ', ''),
      description: 'Nifty 50 Stock',
      exchange: 'NSE',
      fyToken: '101010101',
      original_name: sym,
      tt: Math.floor(Date.now() / 1000),
      lp: lp,
      open_price: open,
      prev_close_price: prevClose,
      high_price: prev ? Math.max(prev.high_price, lp) : Number((lp * 1.01).toFixed(2)),
      low_price: prev ? Math.min(prev.low_price, lp) : Number((lp * 0.99).toFixed(2)),
      volume: prev ? prev.volume + Math.floor(Math.random() * 100) : Math.floor(Math.random() * 1000000),
      ch: ch,
      chp: chp,
      ask: Number((lp + 0.05).toFixed(2)),
      bid: Number((lp - 0.05).toFixed(2)),
      spread: 0.1
    };
    
    mockCache[sym] = quote;
    return quote;
  });
};
