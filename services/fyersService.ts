import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';
import { NIFTY50_SYMBOLS } from '../constants';

const BASE_URL = 'https://api.fyers.in/data-rest/v3/quotes';

// Helper to generate random variation for Demo Mode
const randomVariation = (price: number) => {
  const change = price * (Math.random() * 0.004 - 0.002); // +/- 0.2%
  return Number((price + change).toFixed(2));
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
  const url = `${BASE_URL}?symbols=${symbolsParam}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `${credentials.appId}:${credentials.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized: Check App ID or Token");
      if (response.status === 403) throw new Error("Forbidden: API Access Denied (Check CORS/Scopes)");
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data: FyersQuoteResponse = await response.json();
    
    if (data.s !== 'ok') {
       throw new Error(data.message || "Failed to fetch data");
    }
    
    return data.d || [];
  } catch (error) {
    console.error("Fyers API Error:", error);
    throw error;
  }
};

// Mock Data Generator for Demo Mode
// Keeps track of previous values to simulate realistic movement
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
      tt: Date.now(),
      
      lp: lp,
      open_price: open,
      prev_close_price: prevClose,
      high_price: prev ? Math.max(prev.high_price, lp) : Number((lp * 1.01).toFixed(2)),
      low_price: prev ? Math.min(prev.low_price, lp) : Number((lp * 0.99).toFixed(2)),
      volume: prev ? prev.volume + Math.floor(Math.random() * 100) : Math.floor(Math.random() * 1000000),
      
      ch: ch,
      chp: chp,
      ask: lp,
      bid: lp,
      spread: 0.05
    };
    
    mockCache[sym] = quote;
    return quote;
  });

  return quotes;
};