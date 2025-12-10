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

  const symbolsParam = symbols.join(',');
  const targetUrl = `${PROXY_URL}?symbols=${symbolsParam}`;

  // Fetch via Proxy (Vercel API or Local Server)
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `${credentials.appId}:${credentials.accessToken}`,
        // Note: Content-Type is not needed for GET and can trigger CORS issues on some proxies
      }
    });

    // Robust parsing: Get text first to handle non-JSON errors (like 404/500 HTML pages)
    const text = await response.text();
    let data: any;

    try {
      // Handle empty response
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from server");
      }
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", text.substring(0, 100));
      // If response is HTML (common for 404/500 errors), provide a hint
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }
      throw new Error(`Invalid JSON response: ${text.substring(0, 30)}...`);
    }

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized: Check App ID & Token");
      if (response.status === 403) throw new Error("Forbidden: Access Denied");
      if (response.status === 404) throw new Error("API Endpoint not found. (Check Vercel deployment or local server)");
      
      const errorMsg = data.error || data.message || `Server Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    return processResponse(data);

  } catch (error: any) {
    // Enhance error message for connection failures
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("Connection Failed. Ensure the API server is running (npm run server for local).");
    }
    throw error;
  }
};