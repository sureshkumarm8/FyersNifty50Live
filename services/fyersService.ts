import { FyersQuote, FyersQuoteResponse, FyersCredentials, FyersHistoryResponse } from '../types';

// Points to the Vercel API route (api/quotes.js) or local proxy
const PROXY_QUOTES_URL = '/api/quotes'; 
const PROXY_HISTORY_URL = '/api/history';

const processResponse = (data: FyersQuoteResponse): FyersQuote[] => {
  if (!data) return [];
  if (data.s !== 'ok') {
    throw new Error(data.message || "API returned error status");
  }
  if (data && Array.isArray(data.d)) {
    return data.d.map(item => item.v).filter(Boolean);
  }
  return [];
};

const fetchSymbolsInternal = async (
  symbols: string[], 
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  const appId = credentials.appId.trim();
  const token = credentials.accessToken.trim();

  const symbolsParam = encodeURIComponent(symbols.join(','));
  const targetUrl = `${PROXY_QUOTES_URL}?symbols=${symbolsParam}`;

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Authorization': `${appId}:${token}`,
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server Error (${response.status}): ${errText.substring(0,100)}`);
  }

  const text = await response.text();
  let data: any;

  try {
    data = JSON.parse(text);
  } catch (parseError) {
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      throw new Error(`Server returned HTML instead of JSON. API might be down.`);
    }
    throw new Error(`Invalid JSON response: ${text.substring(0, 30)}...`);
  }

  return processResponse(data);
};

export const fetchQuotes = async (
  symbols: string[],
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  if (!credentials.appId || !credentials.accessToken) {
    throw new Error("Missing Credentials");
  }
  try {
    return await fetchSymbolsInternal(symbols, credentials);
  } catch (error: any) {
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
