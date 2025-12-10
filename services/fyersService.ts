import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';

// Points to the Vercel API route (api/quotes.js) or local proxy
const PROXY_URL = '/api/quotes'; 
const BATCH_SIZE = 15; // Reduced batch size to prevent 503/WAF errors
const BATCH_DELAY_MS = 300; // Delay between batches to respect rate limits

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

const fetchBatch = async (
  batchSymbols: string[], 
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  const appId = credentials.appId.trim();
  const token = credentials.accessToken.trim();

  // Encode symbols to ensure special characters like ':' are handled correctly
  const symbolsParam = encodeURIComponent(batchSymbols.join(','));
  const targetUrl = `${PROXY_URL}?symbols=${symbolsParam}`;

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Authorization': `${appId}:${token}`,
    }
  });

  // 1. Check HTTP Status FIRST
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("API Endpoint not found. (If local: run 'npm run server'. If Vercel: check deployment)");
    }
    if (response.status === 401) throw new Error("Unauthorized: Invalid App ID or Access Token");
    if (response.status === 403) throw new Error("Forbidden: Access Denied by Fyers");
    if (response.status === 503) throw new Error("Service Unavailable (503): Fyers API is overloaded or blocking requests.");
    if (response.status === 502) throw new Error("Bad Gateway (502): Upstream API rejected the request.");
    if (response.status === 504) throw new Error("Gateway Timeout: Fyers API is slow or unreachable");
    
    // Try to read error body if possible
    const errText = await response.text();
    let errMsg = `Server Error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error) errMsg = errJson.error;
      else if (errJson.message) errMsg = errJson.message;
      
      if (errJson.details) errMsg += ` - ${errJson.details.substring(0, 50)}...`;
    } catch (e) {
      if (errText.length < 50) errMsg += `: ${errText}`;
    }
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
      // Check for common HTML error titles
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

  // Chunk the symbols into smaller batches
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    chunks.push(symbols.slice(i, i + BATCH_SIZE));
  }

  try {
    const allQuotes: FyersQuote[] = [];

    // Process batches SERIALLY to avoid 503/Rate Limits
    for (const chunk of chunks) {
      const chunkQuotes = await fetchBatch(chunk, credentials);
      allQuotes.push(...chunkQuotes);
      
      // Add delay between requests
      if (chunks.length > 1) {
        await delay(BATCH_DELAY_MS);
      }
    }
    
    return allQuotes;

  } catch (error: any) {
    // Enhance error message for connection failures
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Connection Failed. Ensure the API server is running (npm run server).");
    }
    throw error;
  }
};