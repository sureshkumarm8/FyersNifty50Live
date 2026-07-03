#!/bin/bash
# Test Paytm Token Auto-Refresh Setup

BASE_URL="${1:-http://localhost:3000}"
echo "🧪 Testing Paytm Auto-Refresh on: $BASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣  Testing token retrieval..."
curl -s "$BASE_URL/api/get-paytm-token" | jq '.'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "2️⃣  Testing token refresh (requires CRON_SECRET)..."
read -p "Enter CRON_SECRET: " CRON_SECRET

if [ -n "$CRON_SECRET" ]; then
  curl -s -X POST "$BASE_URL/api/refresh-paytm-token" \
    -H "Authorization: Bearer $CRON_SECRET" | jq '.'
else
  echo "⏭️  Skipped (no CRON_SECRET provided)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "3️⃣  Verifying token with Paytm API..."

TOKEN=$(curl -s "$BASE_URL/api/get-paytm-token" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "Testing Nifty 50 index quote with token..."
  curl -s "https://developer.paytmmoney.com/data/v1/price/live?mode=LTP&pref=NSE:13:INDEX" \
    -H "x-jwt-token: $TOKEN" \
    -H "Accept: application/json" | jq '.'
else
  echo "❌ No valid token found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Setup request token: curl -X POST $BASE_URL/api/save-request-token -H 'Content-Type: application/json' -d '{\"requestToken\":\"...\"}}'"
echo "  2. Setup cron job at: https://cron-job.org"
echo "  3. Read guide: cat PAYTM_AUTO_REFRESH_GUIDE.md"
