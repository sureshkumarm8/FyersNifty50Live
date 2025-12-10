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
    // The Fyers API requires symbols to be URL-encoded (e.g., NSE%3ARELIANCE-EQ).
    const encodedSymbols = encodeURIComponent(symbols);
    const fyersUrl = `https://api.fyers.in/data-rest/v3/quotes?symbols=${encodedSymbols}`;
    
    // Use native fetch
    const fetchResponse = await fetch(fyersUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
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
            details: text.substring(0, 200) // Return snippet of HTML for debugging
        });
    }

    return response.status(fetchResponse.status).json(data);

  } catch (error) {
    console.error('API Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}