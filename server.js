import http from 'http';

const PORT = 5001; // Changed to 5001 to avoid EADDRINUSE on 5000

// Zero-dependency local proxy server using native Node.js modules
const server = http.createServer(async (req, res) => {
  // Set CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Use WHATWG URL API instead of deprecated url.parse
  const protocol = req.socket.encrypted ? 'https' : 'http';
  const host = req.headers.host || `localhost:${PORT}`;
  const reqUrl = new URL(req.url, `${protocol}://${host}`);
  
  if (reqUrl.pathname === '/api/quotes' && req.method === 'GET') {
    const symbols = reqUrl.searchParams.get('symbols');
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing Authorization header' }));
      return;
    }

    if (!symbols) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
      return;
    }

    try {
      // CRITICAL FIX: Re-encode the symbols because searchParams.get() has decoded them.
      const encodedSymbols = encodeURIComponent(symbols);
      // UPDATED: Use api-t1.fyers.in/data/quotes as per working curl example
      const fyersUrl = `https://api-t1.fyers.in/data/quotes?symbols=${encodedSymbols}`;

      console.log(`\n[Proxy] ---------------------------------------------------`);
      console.log(`[Proxy] Incoming Request for ${symbols.split(',').length} symbols`);
      console.log(`[Proxy] Upstream URL: ${fyersUrl}`);
      console.log(`[Proxy] Auth Header (masked): ${authHeader.substring(0, 15)}...`);

      // Native fetch is available in Node 18+
      const fyersResponse = await fetch(fyersUrl, {
        method: 'GET',
        headers: { 
          'Authorization': authHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          // Mimic Fyers Web Trading Headers to bypass WAF
          'Referer': 'https://trade.fyers.in/',
          'Origin': 'https://trade.fyers.in'
        }
      });
      
      console.log(`[Proxy] Upstream Status: ${fyersResponse.status}`);

      const text = await fyersResponse.text();
      console.log(`[Proxy] Upstream Body Preview: ${text.substring(0, 200)}`);
      
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error(`[Proxy] JSON Parse Error: ${e.message}`);
        // Handle upstream sending HTML or garbage
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: "Upstream API returned invalid JSON", 
          upstreamStatus: fyersResponse.status,
          details: text // Send full text to client for better debugging
        }));
        return;
      }
      
      res.writeHead(fyersResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));

    } catch (err) {
      console.error(`[Proxy] Internal Error:`, err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Local Native Server running at http://localhost:${PORT}`);
  console.log(`   - API Endpoint: http://localhost:${PORT}/api/quotes`);
  console.log(`   - This server is for local testing. Vercel uses 'api/quotes.js' automatically.\n`);
});