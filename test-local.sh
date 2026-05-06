#!/bin/bash
# Local Testing Script - Test all fixes before deployment

echo "🧪 Local Testing - PayTM Data Fixes"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found!"
  echo ""
  echo "Please create .env.local with:"
  echo "  - PAYTM_ACCESS_TOKEN=your-token"
  echo "  - KV_REST_API_URL and KV_REST_API_TOKEN (Upstash)"
  echo ""
  exit 1
fi

echo "✅ Environment file found"
echo ""

# Test 1: Check Nifty50 list in cron-fetch.js
echo "1️⃣  Testing Nifty50 Stock List..."
STOCK_COUNT=$(grep -o "'[0-9]\+'" api/cron-fetch.js | wc -l | tr -d ' ')
if [ "$STOCK_COUNT" -ge 48 ]; then
  echo "   ✅ Found $STOCK_COUNT security IDs (Complete)"
else
  echo "   ❌ Only $STOCK_COUNT security IDs (Expected 48)"
fi
echo ""

# Test 2: Check if options fetching is in cron-fetch.js
echo "2️⃣  Testing Options Fetching Code..."
if grep -q "NIFTY_WEEKLY_OPTIONS" api/cron-fetch.js; then
  echo "   ✅ Options fetching implemented"
else
  echo "   ❌ Options fetching missing"
fi
echo ""

# Test 3: Check build
echo "3️⃣  Testing Build..."
if [ -f "dist/index.html" ]; then
  BUNDLE_SIZE=$(du -h dist/assets/index-*.js 2>/dev/null | tail -1 | cut -f1)
  echo "   ✅ Build exists (Bundle: $BUNDLE_SIZE)"
else
  echo "   ⚠️  No build found. Run: npm run build"
fi
echo ""

# Test 4: Start local dev server
echo "4️⃣  Starting Local Development Server..."
echo "   📝 This will start the dev server for testing"
echo "   📝 Press Ctrl+C to stop"
echo ""
echo "   Opening in 5 seconds..."
sleep 2

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "   Installing dependencies first..."
  npm install
fi

echo ""
echo "🚀 Starting server..."
echo ""
echo "📋 What to check:"
echo "   1. Open http://localhost:5173"
echo "   2. Check console for: [Options] ✅ Options valid until..."
echo "   3. Go to Stocks tab - verify 48 stocks with names"
echo "   4. Go to Options tab - verify options data shows"
echo "   5. Check Network tab - should see /api/get-redis-data call"
echo ""
echo "Press Ctrl+C when done testing"
echo ""
echo "----------------------------------------"
echo ""

npm run dev
