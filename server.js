
import http from 'http';
import { URL } from 'url';

const PORT = 5001; 

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const protocol = req.socket.encrypted ? 'https' : 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  const reqUrl = new URL(req.url, `${protocol}://${host}`);
  
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
     res.writeHead(401, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify({ error: 'Missing Authorization header' }));
     return;
  }

  // --- QUOTES ROUTE (Now Proxies to Depth) ---
  if (reqUrl.pathname === '/api/quotes' && req.method === 'GET') {
    const symbols = reqUrl.searchParams.get('symbols');
    if (!symbols) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
      return;
    }

    try {
      const encodedSymbols = encodeURIComponent(symbols);
      // Using Depth Endpoint
      const fyersUrl = `https://api-t1.fyers.in/data/depth?symbol=${encodedSymbols}&ohlcv_flag=1`;
      
      // Log generic info without tokens
      console.log(`[Proxy] Depth Request for: ${symbols.substring(0, 50)}...`);

      const fyersResponse = await fetch(fyersUrl, {
        method: 'GET',
        headers: { 
          'Authorization': authHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://trade.fyers.in/',
          'Origin': 'https://trade.fyers.in'
        }
      });
      
      const text = await fyersResponse.text();
      // Only log status code, no body content that might contain sensitive data
      console.log(`[Proxy] Upstream Status: ${fyersResponse.status}`);

      let data = text ? JSON.parse(text) : {};
      
      res.writeHead(fyersResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("[Proxy] Error:", err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  } 
  // --- HISTORY ROUTE ---
  else if (reqUrl.pathname === '/api/history' && req.method === 'GET') {
     const symbol = reqUrl.searchParams.get('symbol');
     const range_from = reqUrl.searchParams.get('range_from');
     const range_to = reqUrl.searchParams.get('range_to');
     const resolution = reqUrl.searchParams.get('resolution') || '1';

     if (!symbol || !range_from || !range_to) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Missing params" }));
        return;
     }

     try {
       const encodedSymbol = encodeURIComponent(symbol);
       const fyersUrl = `https://api.fyers.in/data-rest/v3/history?symbol=${encodedSymbol}&resolution=${resolution}&date_format=1&range_from=${range_from}&range_to=${range_to}&cont_flag=1`;
       
       console.log(`[Proxy] History Request: ${symbol} (${resolution})`);

       const fyersResponse = await fetch(fyersUrl, {
         method: 'GET',
         headers: { 
           'Authorization': authHeader,
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
           'Accept': '*/*',
           'Referer': 'https://trade.fyers.in/',
           'Origin': 'https://trade.fyers.in'
         }
       });

       const text = await fyersResponse.text();
       let data = text ? JSON.parse(text) : {};
       
       res.writeHead(fyersResponse.status, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(data));
     } catch(err) {
        console.error("[Proxy] History Error:", err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
     }
  }
  // --- PAYTM QUOTES ROUTE ---
  else if (reqUrl.pathname === '/api/paytm/quotes' && req.method === 'POST') {
     let body = '';
     req.on('data', chunk => { body += chunk.toString(); });
     req.on('end', async () => {
        try {
           console.log(`[Proxy] PayTM POST body received: ${body.substring(0, 100)}...`);
           
           const parsed = JSON.parse(body);
           const { security_ids, scrip_type } = parsed;
           
           console.log(`[Proxy] Parsed security_ids:`, security_ids ? `${security_ids.length} items` : 'undefined');
           console.log(`[Proxy] Scrip type: ${scrip_type}`);
           
           if (!security_ids || !Array.isArray(security_ids)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                 error: 'Missing or invalid security_ids array',
                 received: typeof security_ids,
                 body: body.substring(0, 200)
              }));
              return;
           }
           
           console.log(`[Proxy] PayTM Request for ${security_ids.length} securities`);
           
           // PayTM Money Live Price API
           // Format: Exchange:ScripId:ScripType (e.g., NSE:11536:EQUITY)
           const type = scrip_type || 'EQUITY';
           const preferences = security_ids.map(id => `NSE:${id}:${type}`).join(',');
           const paytmUrl = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(preferences)}`;
           
           console.log(`[Proxy] PayTM URL: ${paytmUrl.substring(0, 150)}...`);
           
           const paytmResponse = await fetch(paytmUrl, {
              method: 'GET',
              headers: {
                 'x-jwt-token': authHeader.replace('Bearer ', ''),
                 'Accept': 'application/json'
              }
           });
           
           const text = await paytmResponse.text();
           console.log(`[Proxy] PayTM Status: ${paytmResponse.status}`);
           console.log(`[Proxy] PayTM Response sample: ${text.substring(0, 300)}...`);
           
           if (!paytmResponse.ok) {
              console.error(`[Proxy] PayTM Error Response: ${text.substring(0, 200)}`);
           }
           
           let data;
           try {
              data = text ? JSON.parse(text) : {};
           } catch (e) {
              console.error("[Proxy] PayTM returned non-JSON:", text.substring(0, 200));
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                 error: 'PayTM API returned invalid response',
                 details: text.substring(0, 200)
              }));
              return;
           }
           
           console.log(`[Proxy] PayTM data structure:`, JSON.stringify(data).substring(0, 300));
           
           res.writeHead(paytmResponse.status, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify(data));
        } catch(err) {
           console.error("[Proxy] PayTM Error:", err.message);
           res.writeHead(500);
           res.end(JSON.stringify({ error: err.message }));
        }
     });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Local Server running at http://localhost:${PORT}`);
});
