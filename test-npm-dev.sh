#!/bin/bash

echo "🧪 Testing npm run dev with Redis"
echo "=================================="
echo ""

# Check env
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found"
  exit 1
fi

# Start dev server in background
echo "Starting dev server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "Waiting for servers to start..."
sleep 8

echo ""
echo "Testing Redis proxy..."
RESPONSE=$(curl -s http://localhost:5001/api/get-redis-data)

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  STOCKS=$(echo "$RESPONSE" | jq -r '.data.stocks | length' 2>/dev/null)
  OPTIONS=$(echo "$RESPONSE" | jq -r '.data.options | length' 2>/dev/null)
  NIFTY=$(echo "$RESPONSE" | jq -r '.data.niftyLTP' 2>/dev/null)
  
  echo "✅ Redis Proxy Working!"
  echo "   Stocks: $STOCKS"
  echo "   Options: $OPTIONS"
  echo "   Nifty LTP: $NIFTY"
else
  echo "❌ Redis Proxy Failed"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
fi

echo ""
echo "🌐 Frontend should now work at: http://localhost:5173"
echo ""
echo "Press Enter to stop the server..."
read

# Stop dev server
kill $DEV_PID 2>/dev/null
echo "Server stopped"
