#!/bin/bash
# Test API endpoints locally using Vercel CLI

echo "🧪 Testing API Endpoints Locally"
echo "================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🚀 Starting Vercel Dev Server..."
echo ""
echo "This will:"
echo "  1. Start local serverless functions"
echo "  2. Test /api/cron-fetch endpoint"
echo "  3. Test /api/get-redis-data endpoint"
echo "  4. Test /api/auto-update-options endpoint"
echo ""
echo "Server will start on http://localhost:3000"
echo ""

# Run in background
vercel dev --listen 3000 &
VERCEL_PID=$!

echo "⏳ Waiting for server to start..."
sleep 10

echo ""
echo "1️⃣  Testing Cron Fetch Endpoint..."
echo "   GET http://localhost:3000/api/cron-fetch"
curl -s http://localhost:3000/api/cron-fetch | jq -r '
  if .success then
    "   ✅ Success\n" +
    "   Nifty LTP: " + (.data.niftyLTP | tostring) + "\n" +
    "   Stocks: " + (.data.stockCount | tostring) + "\n" +
    "   Options: " + (.data.optionsCount // 0 | tostring)
  else
    "   ⚠️  " + (.message // .error)
  end
' 2>/dev/null || echo "   ❌ Failed to fetch"

echo ""
echo ""
echo "2️⃣  Testing Redis Data Endpoint..."
echo "   GET http://localhost:3000/api/get-redis-data"
curl -s http://localhost:3000/api/get-redis-data | jq -r '
  if .success then
    "   ✅ Success\n" +
    "   Nifty LTP: " + (.data.niftyLTP | tostring) + "\n" +
    "   Stocks: " + ((.data.stocks | length) | tostring) + "\n" +
    "   Options: " + ((.data.options | length // 0) | tostring) + "\n" +
    "   Age: " + (((now * 1000 - .data.timestamp) / 60000 | floor) | tostring) + " minutes"
  else
    "   ⚠️  " + (.error // "No data")
  end
' 2>/dev/null || echo "   ❌ Failed to fetch"

echo ""
echo ""
echo "3️⃣  Testing Options Auto-Update..."
echo "   GET http://localhost:3000/api/auto-update-options"
curl -s http://localhost:3000/api/auto-update-options | jq -r '
  if .success then
    if .needsUpdate then
      "   ⚠️  Needs Update\n" +
      "   Current: " + .currentExpiry + "\n" +
      "   Status: Options expired"
    else
      "   ✅ Up to date\n" +
      "   Expiry: " + .currentExpiry + "\n" +
      "   Status: Options valid"
    end
  else
    "   ❌ " + (.error // "Failed")
  end
' 2>/dev/null || echo "   ❌ Failed to fetch"

echo ""
echo ""
echo "✅ Tests Complete!"
echo ""
echo "🌐 Vercel dev server is still running on http://localhost:3000"
echo "   You can test the frontend at this URL"
echo ""
echo "Press Enter to stop the server..."
read

# Stop vercel dev
kill $VERCEL_PID 2>/dev/null
echo ""
echo "👋 Server stopped"
