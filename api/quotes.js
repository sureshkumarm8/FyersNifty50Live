/**
 * Fyers Depth API Proxy
 * 
 * IMPORTANT: As of 2025, Fyers changed the /data/depth endpoint to accept
 * only ONE symbol per request (previously supported multiple symbols).
 * 
 * This proxy handles the change by:
 * 1. Accepting multiple symbols via ?symbols=SYM1,SYM2,SYM3
 * 2. Making parallel individual requests to Fyers for each symbol
 * 3. Merging results into a single response matching the old format
 * 
 * This maintains backward compatibility with the rest of the application.
 */
export default async function handler(request, response) {
  // CORS configuration for Vercel Serverless
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { symbols } = request.query;
  const authHeader = request.headers['authorization'];

  if (!authHeader) {
    return response.status(401).json({ error: 'Missing Authorization header' });
  }

  if (!symbols) {
    return response.status(400).json({ error: 'Missing symbols parameter' });
  }

  try {
    // NEW: Depth API now accepts only ONE symbol per request
    const symbolArray = symbols.split(',');
    
    // Make parallel requests for all symbols
    const fetchPromises = symbolArray.map(async (symbol) => {
      const encodedSymbol = encodeURIComponent(symbol.trim());
      const fyersUrl = `https://api-t1.fyers.in/data/depth?symbol=${encodedSymbol}&ohlcv_flag=1`;
      
      const fetchResponse = await fetch(fyersUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*', 
          'Referer': 'https://trade.fyers.in/',
          'Origin': 'https://trade.fyers.in'
        }
      });

      const text = await fetchResponse.text();
      
      try {
        const data = text ? JSON.parse(text) : {};
        return { symbol: symbol.trim(), data, status: fetchResponse.status };
      } catch (e) {
        return { symbol: symbol.trim(), error: 'Invalid JSON', status: fetchResponse.status };
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(fetchPromises);
    
    // Merge results into single response matching old format
    const mergedData = { s: 'ok', d: {} };
    let hasError = false;
    let errorMessage = '';

    for (const result of results) {
      if (result.error) {
        hasError = true;
        errorMessage = result.error;
        continue;
      }
      
      if (result.data && result.data.s === 'ok' && result.data.d) {
        // Depth API returns single symbol data in 'd' object
        Object.assign(mergedData.d, result.data.d);
      } else if (result.data && result.data.s === 'error') {
        hasError = true;
        errorMessage = result.data.message || 'API Error';
      }
    }

    if (hasError && Object.keys(mergedData.d).length === 0) {
      return response.status(400).json({ s: 'error', message: errorMessage });
    }

    return response.status(200).json(mergedData);

  } catch (error) {
    console.error('API Proxy Error');
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}