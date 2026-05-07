#!/bin/bash

# Test Dynamic Options Discovery
# This script tests the new discovery API

echo "🧪 Testing Dynamic Options Discovery"
echo "======================================"
echo ""

# Check if server is running
echo "📡 Testing discovery API..."
echo ""

# Test 1: Fresh discovery
echo "Test 1: Fresh discovery (with force refresh)"
curl -s "http://localhost:3000/api/discover-options?force=true" | jq -r '
  "Status: \(.success)",
  "Expiry: \(.expiry)",
  "ATM Strike: \(.atmStrike)",
  "Nifty LTP: \(.niftyLTP)",
  "Options Count: \(.count)",
  "Duration: \(.duration)ms",
  "Cached: \(.cached)",
  ""
'

echo ""
echo "Test 2: Cached discovery"
curl -s "http://localhost:3000/api/discover-options" | jq -r '
  "Status: \(.success)",
  "Expiry: \(.expiry)",
  "Options Count: \(.count)",
  "Duration: \(.duration)ms",
  "Cached: \(.cached)",
  ""
'

echo ""
echo "Test 3: Sample options (first 5)"
curl -s "http://localhost:3000/api/discover-options" | jq -r '
  .options[:5] | .[] | 
  "Strike: \(.strike) | Type: \(.type) | ID: \(.security_id)"
'

echo ""
echo "Test 4: Check cron-fetch with dynamic options"
echo "Note: Set BYPASS_MARKET_HOURS=true to test outside market hours"
curl -s "http://localhost:3000/api/cron-fetch" \
  -H "Authorization: Bearer ${CRON_SECRET:-test}" | jq -r '
  "Status: \(.success)",
  "Message: \(.message // "OK")",
  "Options Count: \(.optionsCount // 0)",
  ""
'

echo ""
echo "✅ Tests completed!"
echo ""
echo "Next steps:"
echo "1. Check if options count > 0"
echo "2. Verify expiry date is current/future"
echo "3. Ensure cached=true on second call (faster)"
echo "4. Setup cron job to call /api/discover-options weekly"
