import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';

const BASE_URL = 'https://api.fyers.in/data-rest/v3/quotes';

// List of CORS proxies to try in sequence if direct connection fails
// These are necessary for browser-only apps to bypass CORS restrictions
const PROXIES = [
  // Primary: CORS Proxy IO (Fast, usually reliable)
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // Backup 1: ThingProxy
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  // Backup 2: CodeTabs (Good reliability)
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

// Helper to perform the actual fetch request
const performRequest = async (url: string, credentials: FyersCredentials) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `${credentials.appId}:${credentials.accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized: Check App ID or Token");
    if (response.status === 403) throw new Error("Forbidden: API Access Denied (Check permissions)");
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Some proxies return the data directly, others might wrap it. 
  // Fyers API returns JSON, so we expect valid JSON.
  try {
    const data: FyersQuoteResponse = await response.json();
    if (data.s !== 'ok') {
       // Fyers internal error structure
       throw new Error(data.message || "Failed to fetch data from API");
    }
    return data;
  } catch (e: any) {
    // If JSON parsing fails, it's likely the proxy returned an HTML error page
    throw new Error("Invalid response format (Proxy might be down)");
  }
};

// Helper to extract quotes from response
const processResponse = (data: FyersQuoteResponse): FyersQuote[] => {
  if (data && Array.isArray(data.d)) {
    return data.d.map(item => item.v).filter(Boolean);
  }
  return [];
};

export const fetchQuotes = async (
  symbols: string[],
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  if (credentials.isDemoMode) {
    return fetchMockQuotes(symbols);
  }

  if (!credentials.appId || !credentials.accessToken) {
    throw new Error("Missing Credentials");
  }

  const symbolsParam = symbols.join(',');
  const directUrl = `${BASE_URL}?symbols=${symbolsParam}`;

  let lastError: Error | null = null;

  // 1. Attempt Direct Fetch
  // Works if the user has a CORS extension or if run in a non-browser env
  try {
    const data = await performRequest(directUrl, credentials);
    return processResponse(data);
  } catch (error: any) {
    // If it's explicitly an auth error, fail immediately. Do not retry via proxies.
    if (error.message.includes("Unauthorized") || error.message.includes("Forbidden")) {
      throw error;
    }
    console.warn("Direct fetch failed (likely CORS). Attempting proxies...", error.message);
    lastError = error;
  }

  // 2. Attempt Proxies in sequence
  for (const proxyGenerator of PROXIES) {
    try {
      const proxyUrl = proxyGenerator(directUrl);
      const data = await performRequest(proxyUrl, credentials);
      return processResponse(data);
    } catch (error: any) {
      console.warn(`Proxy attempt failed: ${error.message}`);
      // Don't overwrite an Auth error if we somehow got one, but usually we just track network errors here
      if (!lastError || (!lastError.message.includes("Unauthorized") && !lastError.message.includes("Forbidden"))) {
         lastError = error;
      }
    }
  }

  // If all attempts fail
  throw new Error(
    `Connection failed. ${lastError?.message || "Unknown error"}. \nTip: Enable 'Demo Mode' to test the UI, or install a 'Allow CORS' browser extension.`
  );
};

// Mock Data Generator for Demo Mode
const randomVariation = (price: number) => {
  const change = price * (Math.random() * 0.004 - 0.002); // +/- 0.2%
  return Number((price + change).toFixed(2));
};

let mockCache: Record<string, FyersQuote> = {};

const fetchMockQuotes = async (symbols: string[]): Promise<FyersQuote[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const quotes: FyersQuote[] = symbols.map(sym => {
    const basePrice = Math.random() * 3000 + 500;
    
    // If we have cached data, move it slightly
    const prev = mockCache[sym];
    let lp = prev ? randomVariation(prev.lp) : Number(basePrice.toFixed(2));
    
    // Ensure simulated open price is static-ish
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
      tt: Math.floor(Date.now() / 1000), // Fyers returns unix timestamp in seconds usually
      
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

  return quotes;
};