import { FyersQuote, FyersCredentials, FyersHistoryResponse, FyersDepthResponse } from '../types';

// Points to the Vercel API route (api/quotes.js) or local proxy
const PROXY_QUOTES_URL = '/api/quotes'; 
const PROXY_HISTORY_URL = '/api/history';

// Mappers to convert Depth API data to UI Quote format
const processResponse = (data: FyersDepthResponse): FyersQuote[] => {
  if (!data) return [];
  if (data.s !== 'ok') {
    throw new Error(data.message || "API returned error status");
  }

  // Handle Depth Response (Dictionary: { "SYMBOL": { ...data } })
  if (data && data.d && !Array.isArray(data.d)) {
    return Object.entries(data.d).map(([symbol, info]) => {
      return {
        symbol: symbol,
        short_name: symbol.split(':')[1]?.replace('-EQ', '') || symbol,
        exchange: symbol.split(':')[0] || 'NSE',
        description: symbol,
        original_name: symbol,
        fyToken: '', // Not provided in depth, not strictly needed for UI
        tt: info.ltt || Date.now() / 1000, // Last Traded Time
        
        // Price Data
        lp: info.ltp,
        open_price: info.o,
        high_price: info.h,
        low_price: info.l,
        prev_close_price: info.c,
        volume: info.v,
        
        // Change Data
        ch: info.ch,
        chp: info.chp,
        
        // Depth Data
        total_buy_qty: info.totalbuyqty,
        total_sell_qty: info.totalsellqty,
        bid: info.bids && info.bids.length > 0 ? info.bids[0].price : 0,
        ask: info.ask && info.ask.length > 0 ? info.ask[0].price : 0,
        spread: (info.ask && info.ask.length > 0 && info.bids && info.bids.length > 0) 
                 ? info.ask[0].price - info.bids[0].price 
                 : 0
      };
    });
  }
  
  // Fallback for Array format (if API changes back or old endpoint used)
  if (data && Array.isArray((data as any).d)) {
    return (data as any).d.map((item: any) => item.v).filter(Boolean);
  }

  return [];
};

const fetchSymbolsInternal = async (
  symbols: string[], 
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  const appId = credentials.appId.trim();
  const token = credentials.accessToken.trim();

  // Encode symbols to ensure special characters like ':' are handled correctly
  // Sending all symbols in one request (up to 50 supported) to minimize request count
  const symbolsParam = encodeURIComponent(symbols.join(','));
  const targetUrl = `${PROXY_QUOTES_URL}?symbols=${symbolsParam}`;

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Authorization': `${appId}:${token}`,
    }
  });

  // Check HTTP Status
  if (!response.ok) {
    // Try to read error body to get the real reason from the proxy
    const errText = await response.text();
    let errMsg = `Server Error (${response.status})`;
    
    try {
      const errJson = JSON.parse(errText);
      // Construct a detailed error message
      if (errJson.details) {
         errMsg = `${errJson.error || 'Error'}: ${errJson.details.substring(0, 100)}`;
         if (errJson.upstreamStatus) errMsg += ` (Upstream: ${errJson.upstreamStatus})`;
      } else if (errJson.error) {
         errMsg = errJson.error;
      } else if (errJson.message) {
         errMsg = errJson.message;
      }
    } catch (e) {
      // If raw text (e.g. HTML from 404/503)
      if (errText.length < 200) errMsg += `: ${errText}`;
    }

    if (response.status === 404) {
      throw new Error(`API Endpoint not found. ${errMsg}`);
    }
    if (response.status === 401) throw new Error("Unauthorized: Invalid App ID or Access Token");
    if (response.status === 403) throw new Error("Forbidden: Access Denied by Fyers");
    if (response.status === 503) throw new Error("Service Unavailable (503): Fyers API is overloaded.");
    if (response.status === 502) throw new Error(`Bad Gateway (502): ${errMsg}`);
    
    throw new Error(errMsg);
  }

  // 2. Parse JSON (Safe)
  const text = await response.text();
  let data: any;

  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from server");
    }
    data = JSON.parse(text);
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError, "Response:", text.substring(0, 100));
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      if(text.includes("503 Service Temporarily Unavailable")) {
         throw new Error("Service Unavailable (503): Fyers API is temporarily down.");
      }
      throw new Error(`Server returned HTML instead of JSON. API might be down or blocked.`);
    }
    throw new Error(`Invalid JSON response: ${text.substring(0, 30)}...`);
  }

  return processResponse(data);
};

export const fetchQuotes = async (
  symbols: string[],
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  // Credential Validation
  if (!credentials.appId || !credentials.accessToken) {
    throw new Error("Missing Credentials");
  }

  try {
    // Fyers Data API v3 supports up to 50 symbols per request.
    // We send all Nifty50 symbols in a single call to be efficient and avoid rate limits.
    return await fetchSymbolsInternal(symbols, credentials);

  } catch (error: any) {
    // Enhance error message for connection failures
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Connection Failed. Ensure the API server is running (npm run server).");
    }
    throw error;
  }
};

export const fetchStockHistory = async (
  symbol: string,
  credentials: FyersCredentials
): Promise<number[][]> => {
   if (!credentials.appId || !credentials.accessToken) throw new Error("Missing Credentials");

   // Calculate Range (Start of Today to Now)
   const now = new Date();
   const todayStart = new Date(now);
   todayStart.setHours(9, 0, 0, 0); // Market start or just 00:00

   // Format: YYYY-MM-DD
   const formatDate = (date: Date) => date.toISOString().split('T')[0];
   
   const range_from = formatDate(todayStart);
   const range_to = formatDate(now);

   const targetUrl = `${PROXY_HISTORY_URL}?symbol=${encodeURIComponent(symbol)}&range_from=${range_from}&range_to=${range_to}`;
   
   const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
         'Authorization': `${credentials.appId.trim()}:${credentials.accessToken.trim()}`
      }
   });

   if (!response.ok) throw new Error("Failed to fetch history");

   const data: FyersHistoryResponse = await response.json();
   if (data.s !== 'ok') throw new Error(data.message || "History API error");
   
   return data.candles || [];
};