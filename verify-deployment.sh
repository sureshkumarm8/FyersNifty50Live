#!/bin/bash

echo "🧪 Testing Deployment Fix"
echo "========================="
echo ""

URL="https://fyers-nifty50-live.vercel.app"

echo "1️⃣  Testing Redis Data Endpoint..."
echo "─────────────────────────────────"
REDIS_DATA=$(curl -s "$URL/api/get-redis-data")
echo "$REDIS_DATA" | jq -r '
  if .success then
    "✅ Redis API: SUCCESS\n" +
    "   Nifty LTP: " + (.data.niftyLTP | tostring) + "\n" +
    "   Stocks: " + ((.data.stocks | length) | tostring) + "\n" +
    "   Timestamp: " + ((.data.timestamp / 1000) | todate) + "\n" +
    "   Age: " + (((now * 1000 - .data.timestamp) / 60000 | floor) | tostring) + " minutes"
  else
    "❌ Redis API: FAILED\n" +
    "   Error: " + .error
  end
' 2>/dev/null || echo "❌ Could not parse response"

echo ""
echo ""
echo "2️⃣  Testing Cron Fetch (Manual Trigger)..."
echo "─────────────────────────────────────────"
CRON_RESULT=$(curl -s "$URL/api/cron-fetch")
echo "$CRON_RESULT" | jq -r '
  if .success then
    "✅ Cron Fetch: SUCCESS\n" +
    "   Nifty LTP: " + (.data.niftyLTP | tostring) + "\n" +
    "   Stock Count: " + (.data.stockCount | tostring) + "\n" +
    "   Duration: " + (.data.duration | tostring) + "ms\n" +
    "   IST Time: " + .data.istTime
  else
    "⚠️  Cron Fetch: " + .message + "\n" +
    "   (May be outside market hours or needs auth)"
  end
' 2>/dev/null || echo "❌ Could not parse response"

echo ""
echo ""
echo "3️⃣  Verification Summary"
echo "────────────────────────"

# Check if Nifty LTP is not null
NIFTY_LTP=$(echo "$REDIS_DATA" | jq -r '.data.niftyLTP' 2>/dev/null)
if [ "$NIFTY_LTP" != "null" ] && [ -n "$NIFTY_LTP" ]; then
  echo "✅ Nifty LTP is available: $NIFTY_LTP"
else
  echo "❌ Nifty LTP is null or missing"
fi

# Check stock count
STOCK_COUNT=$(echo "$REDIS_DATA" | jq -r '.data.stocks | length' 2>/dev/null)
if [ "$STOCK_COUNT" -gt 0 ]; then
  echo "✅ Stocks available: $STOCK_COUNT"
else
  echo "❌ No stocks in Redis"
fi

# Check data freshness
TIMESTAMP=$(echo "$REDIS_DATA" | jq -r '.data.timestamp' 2>/dev/null)
if [ -n "$TIMESTAMP" ]; then
  AGE_SECONDS=$(( ($(date +%s) * 1000 - $TIMESTAMP) / 1000 ))
  AGE_MINUTES=$(( $AGE_SECONDS / 60 ))
  if [ $AGE_MINUTES -lt 10 ]; then
    echo "✅ Data is fresh: $AGE_MINUTES minutes old"
  else
    echo "⚠️  Data is stale: $AGE_MINUTES minutes old (may be outside market hours)"
  fi
fi

echo ""
echo ""
echo "📝 NEXT: Open browser and check:"
echo "   https://fyers-nifty50-live.vercel.app/"
echo ""
echo "   Browser Console should show:"
echo "   ✅ [PayTM Redis] ✅ Loaded XX stocks, Nifty: XXXX.XX"
echo "   ✅ [PayTM] Using Redis data: XX stocks"
echo ""
