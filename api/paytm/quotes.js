// Disable automatic body parsing - we'll do it manually like server.js
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  // Manually parse body like server.js does
  return new Promise((resolve) => {
    let body = '';
    
    request.on('data', (chunk) => {
      body += chunk.toString();
    });

    request.on('end', async () => {
      try {
        console.log(`[PayTM Proxy] POST body received: ${body.substring(0, 100)}...`);
        
        const parsed = JSON.parse(body);
        const { security_ids, scrip_type } = parsed;
        
        console.log(`[PayTM Proxy] Parsed security_ids:`, security_ids ? `${security_ids.length} items` : 'undefined');
        console.log(`[PayTM Proxy] Scrip type: ${scrip_type}`);
        
        if (!security_ids || !Array.isArray(security_ids)) {
          response.writeHead(400, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ 
            error: 'Missing or invalid security_ids array',
            received: typeof security_ids,
            body: body.substring(0, 200)
          }));
          resolve();
          return;
        }
        
        console.log(`[PayTM Proxy] Request for ${security_ids.length} securities`);
        
        // PayTM Money Live Price API
        // Format: Exchange:ScripId:ScripType (e.g., NSE:11536:EQUITY)
        const type = scrip_type || 'EQUITY';
        const preferences = security_ids.map(id => `NSE:${id}:${type}`).join(',');
        const paytmUrl = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(preferences)}`;
        
        console.log(`[PayTM Proxy] URL: ${paytmUrl.substring(0, 150)}...`);
        
        const paytmResponse = await fetch(paytmUrl, {
          method: 'GET',
          headers: {
            'x-jwt-token': authHeader.replace('Bearer ', ''),
            'Accept': 'application/json'
          }
        });
        
        const text = await paytmResponse.text();
        console.log(`[PayTM Proxy] Status: ${paytmResponse.status}`);
        console.log(`[PayTM Proxy] Response sample: ${text.substring(0, 300)}...`);
        
        if (!paytmResponse.ok) {
          console.error(`[PayTM Proxy] Error Response: ${text.substring(0, 200)}`);
        }
        
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('[PayTM Proxy] Returned non-JSON:', text.substring(0, 200));
          response.writeHead(502, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ 
            error: 'PayTM API returned invalid response',
            details: text.substring(0, 200)
          }));
          resolve();
          return;
        }
        
        console.log(`[PayTM Proxy] Data structure:`, JSON.stringify(data).substring(0, 300));
        
        // Log first item for debugging
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          const firstItem = data.data[0];
          console.log(`[PayTM Proxy] First item fields:`, Object.keys(firstItem));
          console.log(`[PayTM Proxy] First item sample:`, JSON.stringify(firstItem).substring(0, 200));
        }
        
        response.writeHead(paytmResponse.status, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(data));
        resolve();
        
      } catch (err) {
        console.error('[PayTM Proxy] Error:', err.message);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: err.message }));
        resolve();
      }
    });
  });
}
