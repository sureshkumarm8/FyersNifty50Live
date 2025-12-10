import http from 'http';

const PORT = 5001; 

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

  // --- QUOTES ROUTE ---
  if (reqUrl.pathname === '/api/quotes' && req.method === 'GET') {
    const symbols = reqUrl.searchParams.get('symbols');
    if (!symbols) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
      return;
    }

    try {
      const encodedSymbols = encodeURIComponent(symbols);
      const fyersUrl = `https://api-t1.fyers.in/data/quotes?symbols=${encodedSymbols}`;
      
      console.log(`[Proxy] Quotes Request: ${symbols.substring(0, 30)}...`);

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
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  } 
  // --- HISTORY ROUTE ---
  else if (reqUrl.pathname === '/api/history' && req.method === 'GET') {
     const symbol = reqUrl.searchParams.get('symbol');
     const range_from = reqUrl.searchParams.get('range_from');
     const range_to = reqUrl.searchParams.get('range_to');

     if (!symbol || !range_from || !range_to) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Missing params" }));
        return;
     }

     try {
       const encodedSymbol = encodeURIComponent(symbol);
       const fyersUrl = `https://api.fyers.in/data-rest/v3/history?symbol=${encodedSymbol}&resolution=1&date_format=1&range_from=${range_from}&range_to=${range_to}&cont_flag=1`;
       
       console.log(`[Proxy] History Request: ${symbol}`);

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
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
     }
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Local Server running at http://localhost:${PORT}`);
});