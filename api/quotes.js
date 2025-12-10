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
    // Construct Fyers URL. Note: request.query.symbols is already decoded by Vercel,
    // but Fyers expects comma-separated list. We put it directly into the URL.
    const fyersUrl = `https://api.fyers.in/data-rest/v3/quotes?symbols=${symbols}`;
    
    // Use native fetch (available in Node 18+ environment on Vercel)
    const fetchResponse = await fetch(fyersUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
        // Content-Type removed: Not standard for GET and can trigger WAF blocks
      }
    });

    // Safely read text first to handle upstream errors (e.g. Fyers maintenance HTML page)
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