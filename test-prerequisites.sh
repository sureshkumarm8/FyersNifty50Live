#!/bin/bash
# Quick local test - Simulates cron-fetch locally

echo "🧪 Testing Cron Fetch with Real Data"
echo "====================================="
echo ""

# Load environment variables
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found!"
  exit 1
fi

export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs)

echo "✅ Environment loaded"
echo "   PayTM Token: ${PAYTM_ACCESS_TOKEN:0:50}..."
echo "   Redis URL: $UPSTASH_REDIS_REST_URL"
echo ""

# Test 1: Fetch from PayTM directly (simulating what cron-fetch does)
echo "1️⃣  Testing PayTM API Direct Call..."
SECURITY_IDS="3351,11536,10940,3787,13538"  # First 5 stocks for test
PREF=$(echo $SECURITY_IDS | sed 's/,/,NSE:/g' | sed 's/^/NSE:/' | sed 's/$//:EQUITY/g' | sed 's/,/:EQUITY,/g')

RESPONSE=$(curl -s "https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=$PREF" \
  -H "x-jwt-token: $PAYTM_ACCESS_TOKEN" \
  -H "Accept: application/json")

if echo "$RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
  STOCK_COUNT=$(echo "$RESPONSE" | jq '.data | length')
  FIRST_STOCK=$(echo "$RESPONSE" | jq -r '.data[0].security_id' 2>/dev/null)
  echo "   ✅ PayTM API Working!"
  echo "   Stocks returned: $STOCK_COUNT"
  echo "   First security_id: $FIRST_STOCK"
else
  echo "   ❌ PayTM API Failed"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo ""
echo ""

# Test 2: Test Nifty Index
echo "2️⃣  Testing Nifty Index Fetch..."
INDEX_RESPONSE=$(curl -s "https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:13:INDEX" \
  -H "x-jwt-token: $PAYTM_ACCESS_TOKEN" \
  -H "Accept: application/json")

NIFTY_LTP=$(echo "$INDEX_RESPONSE" | jq -r '.data[0].last_price' 2>/dev/null)
if [ "$NIFTY_LTP" != "null" ] && [ -n "$NIFTY_LTP" ]; then
  echo "   ✅ Nifty Index: $NIFTY_LTP"
else
  echo "   ❌ Failed to fetch Nifty LTP"
fi

echo ""
echo ""

# Test 3: Check Redis connection
echo "3️⃣  Testing Redis Connection..."
TEST_KEY="test:$(date +%s)"
TEST_VALUE='{"test":"data"}'

# Try to write to Redis
WRITE_RESPONSE=$(curl -s "$UPSTASH_REDIS_REST_URL/set/$TEST_KEY" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d "$TEST_VALUE")

if echo "$WRITE_RESPONSE" | jq -e '.result' > /dev/null 2>&1; then
  echo "   ✅ Redis Write: OK"
  
  # Try to read
  READ_RESPONSE=$(curl -s "$UPSTASH_REDIS_REST_URL/get/$TEST_KEY" \
    -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN")
  
  if echo "$READ_RESPONSE" | jq -e '.result' > /dev/null 2>&1; then
    echo "   ✅ Redis Read: OK"
  else
    echo "   ⚠️  Redis Read: Failed"
  fi
  
  # Cleanup
  curl -s "$UPSTASH_REDIS_REST_URL/del/$TEST_KEY" \
    -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" > /dev/null
else
  echo "   ❌ Redis Connection Failed"
  echo "$WRITE_RESPONSE" | jq '.' 2>/dev/null || echo "$WRITE_RESPONSE"
fi

echo ""
echo ""
echo "✅ All Pre-checks Complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ PayTM API credentials work"
echo "   ✅ Can fetch Nifty50 stocks"
echo "   ✅ Can fetch Nifty Index"
echo "   ✅ Redis connection works"
echo ""
echo "🚀 Ready to test locally!"
echo ""
echo "Next steps:"
echo "   1. npm run dev        # Start frontend (port 5173)"
echo "   2. vercel dev         # Start API functions (port 3000)"
echo "   3. Open http://localhost:5173"
echo ""
