
export default async function handler(request, response) {
  // CORS configuration
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const { symbol, range_from, range_to, resolution } = request.query;
  const authHeader = request.headers['authorization'];

  if (!authHeader) {
    return response.status(401).json({ error: 'Missing Authorization header' });
  }

  if (!symbol || !range_from || !range_to) {
    return response.status(400).json({ error: 'Missing required parameters (symbol, range_from, range_to)' });
  }

  const resVal = resolution || '1'; // Default to 1m if not specified

  try {
    const encodedSymbol = encodeURIComponent(symbol);
    // Try /data/candles endpoint (similar pattern to /data/depth that works)
    const fyersUrl = `https://api-t1.fyers.in/data/candles?symbol=${encodedSymbol}&resolution=${resVal}&date_format=1&range_from=${range_from}&range_to=${range_to}&cont_flag=1`;
    
    console.log(`[History] Request: ${symbol} from ${range_from} to ${range_to} (resolution: ${resVal})`);
    
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
    console.log(`[History] Upstream Status: ${fetchResponse.status}`);
    
    let data;
    
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('[History] Parse error:', text.substring(0, 200));
        return response.status(502).json({ 
            error: "Upstream API returned invalid response",
            upstreamStatus: fetchResponse.status,
            details: "Invalid JSON from Upstream"
        });
    }

    return response.status(fetchResponse.status).json(data);

  } catch (error) {
    console.error('[History] API Proxy Error:', error.message);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
