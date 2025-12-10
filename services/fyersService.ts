import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';

// Points to the Vercel API route (api/quotes.js) or local proxy
const PROXY_URL = '/api/quotes'; 

const processResponse = (data: FyersQuoteResponse): FyersQuote[] => {
  if (!data) return [];
  if (data.s !== 'ok') {
    // If partial data is returned (sometimes data.d exists even with error), we could use it, 
    // but usually 'error' status means something went wrong.
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

  // Encode symbols to ensure special characters like ':' are handled correctly
  // Sending all symbols in one request (up to 50 supported) to minimize request count
  const symbolsParam = encodeURIComponent(symbols.join(','));
  const targetUrl = `${PROXY_URL}?symbols=${symbolsParam}`;

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