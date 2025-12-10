import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';

const BASE_URL = 'https://api.fyers.in/data-rest/v3/quotes';

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

  const data: FyersQuoteResponse = await response.json();
  
  if (data.s !== 'ok') {
     throw new Error(data.message || "Failed to fetch data");
  }
  
  return data;
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

  // Fyers API V3 Expects comma separated symbols
  const symbolsParam = symbols.join(',');
  const directUrl = `${BASE_URL}?symbols=${symbolsParam}`;

  let data: FyersQuoteResponse;

  try {
    // Attempt 1: Direct Fetch
    // This usually works if the user has a CORS extension or if the API allows the origin
    data = await performRequest(directUrl, credentials);
  } catch (error: any) {
    // Check if it's a network/CORS error
    if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
       console.warn("Direct fetch failed (likely CORS). Retrying with proxy...");
       
       // Attempt 2: CORS Proxy
       // specific for browser-only environments to bypass CORS
       const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
       
       try {
         data = await performRequest(proxyUrl, credentials);
       } catch (proxyError: any) {
         console.error("Proxy fetch failed:", proxyError);
         // Throw the original or a combined error to help user debug
         throw new Error(`Connection failed. If using Real API, ensure 'App ID' and 'Access Token' are valid. (Proxy Error: ${proxyError.message})`);
       }
    } else {
       // If it was a 401/403 or other logic error, rethrow it
       throw error;
    }
  }

  // Fyers V3 returns data in 'd' array, where each item has a 'v' property containing the quote
  if (data && Array.isArray(data.d)) {
    return data.d.map(item => item.v).filter(Boolean);
  }
  
  return [];
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