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
    // CRITICAL FIX: Re-encode the symbols because request.query has decoded them.
    // The depth API usually expects 'symbol' parameter, but supports comma separated values for multiple.
    const encodedSymbols = encodeURIComponent(symbols);
    
    // UPDATED: Use api-t1.fyers.in/data/depth
    // Added ohlcv_flag=1 to get full OHLCV data + Depth
    // Parameter name is 'symbol' for depth endpoint
    const fyersUrl = `https://api-t1.fyers.in/data/depth?symbol=${encodedSymbols}&ohlcv_flag=1`;
    
    // Use native fetch
    const fetchResponse = await fetch(fyersUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        // Standard Browser User-Agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*', 
        'Referer': 'https://trade.fyers.in/',
        'Origin': 'https://trade.fyers.in'
      }
    });

    // Safely read text first to handle upstream errors
    const text = await fetchResponse.text();
    let data;
    
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('Upstream API returned non-JSON:', text.substring(0, 100));
        return response.status(502).json({ 
            error: "Upstream API returned invalid response (possibly HTML)",
            upstreamStatus: fetchResponse.status,
            details: text.substring(0, 300) // Return snippet of HTML for debugging
        });
    }

    return response.status(fetchResponse.status).json(data);

  } catch (error) {
    console.error('API Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}