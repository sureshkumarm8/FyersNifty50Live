import http from 'http';
import url from 'url';

const PORT = 5000;

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

  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/quotes' && req.method === 'GET') {
    const { symbols } = parsedUrl.query;
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
      // CRITICAL FIX: Re-encode the symbols because parsedUrl.query has decoded them.
      const encodedSymbols = encodeURIComponent(symbols);
      const fyersUrl = `https://api.fyers.in/data-rest/v3/quotes?symbols=${encodedSymbols}`;

      // Native fetch is available in Node 18+
      const fyersResponse = await fetch(fyersUrl, {
        method: 'GET',
        headers: { 
          'Authorization': authHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          // Mimic Fyers Web Trading Headers to bypass WAF
          'Referer': 'https://trade.fyers.in/',
          'Origin': 'https://trade.fyers.in'
        }
      });
      
      const text = await fyersResponse.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        // Handle upstream sending HTML or garbage
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: "Upstream API returned invalid JSON", 
          upstreamStatus: fyersResponse.status,
          details: text.substring(0, 100) 
        }));
        return;
      }
      
      res.writeHead(fyersResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));

    } catch (err) {
      console.error(err);
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