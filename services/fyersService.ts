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
                 : 0,
        
        // Option Data
        oi: info.oi
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
    // Log generic error without sensitive data
    console.error("JSON Parse Error. API response might be HTML/Invalid.");
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      if(text.includes("503 Service Temporarily Unavailable")) {
         throw new Error("Service Unavailable (503): Fyers API is temporarily down.");
      }
      throw new Error(`Server returned HTML instead of JSON. API might be down or blocked.`);
    }
    throw new Error(`Invalid JSON response`);
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
   
   // Format: YYYY-MM-DD (Local Time)
   const formatDate = (date: Date) => {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     return `${year}-${month}-${day}`;
   };
   
   const range_from = formatDate(now);
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

// Known NSE Holidays (YYYY-MM-DD)
// Used to shift expiry if the calculated Tuesday is a holiday
const NSE_HOLIDAYS = [
    "2024-10-02", // Gandhi Jayanti
    "2024-11-01", // Diwali
    "2024-11-15", // Guru Nanak Jayanti
    "2024-12-25", // Christmas
    "2025-01-26", // Republic Day
    "2025-02-26", // Mahashivratri
    "2025-03-14", // Holi
    "2025-03-31", // Id-Ul-Fitr (Tentative)
    "2025-04-14", // Ambedkar Jayanti
    "2025-04-18", // Good Friday
    "2025-05-01", // Maharashtra Day
];

const formatDateStr = (date: Date) => {
    return date.toISOString().split('T')[0];
};

/**
 * Generates Nifty Option Symbols (10 Up, 10 Down) based on underlying LTP.
 * Handles "Upcoming Weekly" logic targeting TUESDAY expiry.
 * Checks for Holidays and Monthly Expiry.
 */
export const getNiftyOptionSymbols = (ltp: number): string[] => {
  const symbols: string[] = [];
  const now = new Date();
  
  // 1. Calculate Nearest Tuesday (Upcoming Expiry)
  const expiry = new Date(now);
  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // If we assume expiry is ALWAYS Tuesday (Day 2)
  let daysToAdd = (2 - expiry.getDay() + 7) % 7;
  
  // If today is Tuesday (daysToAdd=0), check if market hours are over (e.g., > 3:30 PM)
  // If trade is over, move to NEXT Tuesday
  if (daysToAdd === 0) {
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      if (currentHour > 15 || (currentHour === 15 && currentMin >= 30)) {
          daysToAdd = 7;
      }
  }

  expiry.setDate(expiry.getDate() + daysToAdd);

  // 2. Holiday Handling
  // If expiry falls on a holiday, move to previous trading day
  while (NSE_HOLIDAYS.includes(formatDateStr(expiry))) {
      expiry.setDate(expiry.getDate() - 1);
  }

  // 3. Check for Monthly Expiry (Last Tuesday of the Month)
  // Logic: If adding 7 days pushes us to the next month, then this is the last Tuesday.
  // Note: We check the original 'Tuesday' logic for monthly calculation, even if holiday shifted it slightly.
  // Ideally, monthly expiry dates are fixed, but symbols follow the date.
  const checkNextWeek = new Date(expiry);
  checkNextWeek.setDate(expiry.getDate() + 7);
  const isMonthly = checkNextWeek.getMonth() !== expiry.getMonth();

  // 4. Construct Symbol Prefix
  // Monthly Format: NSE:NIFTY{YY}{MMM}{Strike}{Opt_Type}  (e.g., NIFTY24OCT...)
  // Weekly Format:  NSE:NIFTY{YY}{M}{dd}{Strike}{Opt_Type} (e.g., NIFTY24O10...)

  const yy = expiry.getFullYear().toString().slice(-2);
  const monthIdx = expiry.getMonth(); // 0-11
  const dd = expiry.getDate().toString().padStart(2, '0');

  let symbolBase = "";

  if (isMonthly) {
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const mmm = months[monthIdx];
      symbolBase = `NSE:NIFTY${yy}${mmm}`;
  } else {
      // Fyers Weekly Month Codes: 1-9, O, N, D
      let m = (monthIdx + 1).toString();
      if (monthIdx === 9) m = 'O'; // October
      if (monthIdx === 10) m = 'N'; // November
      if (monthIdx === 11) m = 'D'; // December
      
      symbolBase = `NSE:NIFTY${yy}${m}${dd}`;
  }

  // 5. Generate Strikes (10 Above, 10 Below)
  // Round LTP to nearest 50
  const atm = Math.round(ltp / 50) * 50;

  for (let i = -10; i <= 10; i++) {
      const strike = atm + (i * 50);
      symbols.push(`${symbolBase}${strike}CE`);
      symbols.push(`${symbolBase}${strike}PE`);
  }

  return symbols;
};