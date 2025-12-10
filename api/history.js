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

  const { symbol, range_from, range_to } = request.query;
  const authHeader = request.headers['authorization'];

  if (!authHeader) {
    return response.status(401).json({ error: 'Missing Authorization header' });
  }

  if (!symbol || !range_from || !range_to) {
    return response.status(400).json({ error: 'Missing required parameters (symbol, range_from, range_to)' });
  }

  try {
    const encodedSymbol = encodeURIComponent(symbol);
    // resolution=1 (1 minute), date_format=1 (epoch)
    const fyersUrl = `https://api.fyers.in/data-rest/v3/history?symbol=${encodedSymbol}&resolution=1&date_format=1&range_from=${range_from}&range_to=${range_to}&cont_flag=1`;
    
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
    let data;
    
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        return response.status(502).json({ 
            error: "Upstream API returned invalid response",
            upstreamStatus: fetchResponse.status,
            details: "Invalid JSON from Upstream"
        });
    }

    return response.status(fetchResponse.status).json(data);

  } catch (error) {
    console.error('API Proxy Error');
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}