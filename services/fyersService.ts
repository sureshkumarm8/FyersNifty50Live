import { FyersQuote, FyersQuoteResponse, FyersCredentials } from '../types';

// Points to the Vercel API route (api/quotes.js) or local proxy
const PROXY_URL = '/api/quotes'; 

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

export const fetchQuotes = async (
  symbols: string[],
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  // Credential Validation
  if (!credentials.appId || !credentials.accessToken) {
    throw new Error("Missing Credentials");
  }

  // Sanitize credentials to remove accidental whitespace
  const appId = credentials.appId.trim();
  const token = credentials.accessToken.trim();

  // Encode symbols to ensure special characters like ':' are handled correctly
  const symbolsParam = encodeURIComponent(symbols.join(','));
  const targetUrl = `${PROXY_URL}?symbols=${symbolsParam}`;

  // Fetch via Proxy (Vercel API or Local Server)
  try {
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
      if (response.status === 504) throw new Error("Gateway Timeout: Fyers API is slow or unreachable");
      
      // Try to read error body if possible
      const errText = await response.text();
      let errMsg = `Server Error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errMsg = errJson.error;
        else if (errJson.message) errMsg = errJson.message;
        
        // Append details if available
        if (errJson.details) errMsg += ` - ${errJson.details.substring(0, 50)}...`;
      } catch (e) {
        // If body isn't JSON, use the status text or snippet
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
        throw new Error(`Server returned HTML instead of JSON. The API route might be misconfigured.`);
      }
      throw new Error(`Invalid JSON response: ${text.substring(0, 30)}...`);
    }

    return processResponse(data);

  } catch (error: any) {
    // Enhance error message for connection failures
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Connection Failed. Ensure the API server is running (npm run server).");
    }
    throw error;
  }
};