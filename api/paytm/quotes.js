export default async function handler(request, response) {
  // CORS configuration
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const authHeader = request.headers['authorization'];

  if (!authHeader) {
    return response.status(401).json({ error: 'Missing Authorization header' });
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Parse body if it's a string (Vercel edge functions)
  let body = request.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return response.status(400).json({ 
        error: 'Invalid JSON body',
        details: e.message
      });
    }
  }

  // Log request body for debugging
  console.log('[PayTM Proxy] Request body type:', typeof body);
  console.log('[PayTM Proxy] Request body:', JSON.stringify(body));

  const { security_ids, scrip_type } = body || {};

  if (!security_ids || !Array.isArray(security_ids) || security_ids.length === 0) {
    return response.status(400).json({ 
      error: 'Missing or invalid security_ids array',
      received: { security_ids, scrip_type, bodyType: typeof body },
      bodyKeys: body ? Object.keys(body) : [],
      rawBody: typeof request.body === 'string' ? request.body.substring(0, 100) : 'not a string'
    });
  }

  try {
    // PayTM Money Live Price API - Format: EXCHANGE:SECURITY_ID:SCRIP_TYPE
    const scripTypeValue = scrip_type || 'EQUITY';
    const preferences = security_ids.map(id => `NSE:${id}:${scripTypeValue}`).join(',');
    const paytmUrl = `https://developer.paytmmoney.com/data/v1/price/live?mode=full&pref=${preferences}`;
    
    console.log(`[PayTM Proxy] Fetching ${security_ids.length} securities (${scripTypeValue})`);

    const fetchResponse = await fetch(paytmUrl, {
      method: 'GET',
      headers: {
        'x-jwt-token': authHeader.replace('Bearer ', ''),
        'Accept': 'application/json'
      }
    });

    const text = await fetchResponse.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('[PayTM Proxy] Invalid JSON response from upstream');
      return response.status(502).json({ 
        error: 'Upstream API returned invalid response',
        upstreamStatus: fetchResponse.status,
        details: 'Invalid JSON from PayTM API'
      });
    }

    return response.status(fetchResponse.status).json(data);

  } catch (error) {
    console.error('[PayTM Proxy] Error:', error.message);
    return response.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}
