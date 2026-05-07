#!/bin/bash

# Test automatic options discovery flow
# This simulates the cron-fetch behavior

echo "============================================"
echo "Testing Automatic Options Discovery"
echo "============================================"
echo ""

# Step 1: Call discover-options API
echo "Step 1: Calling /api/discover-options to populate Redis cache..."
echo "-----------------------------------------------------------"
curl -s http://localhost:3000/api/discover-options | jq '.'
echo ""

# Step 2: Verify Redis cache
echo ""
echo "Step 2: Verifying options:current_week in Redis..."
echo "-----------------------------------------------------------"
curl -s http://localhost:3000/api/get-redis-data | jq '{
  success: .success,
  hasOptions: (.data.options != null),
  optionsCount: (.data.options | length),
  timestamp: .data.timestamp,
  niftyLTP: .data.niftyLTP
}'
echo ""

# Step 3: Test cron-fetch auto-discovery
echo ""
echo "Step 3: Testing cron-fetch with auto-discovery (set BYPASS_MARKET_HOURS=true)..."
echo "-----------------------------------------------------------"
curl -s -X POST http://localhost:3000/api/cron-fetch \
  -H "Authorization: Bearer ${CRON_SECRET:-test}" | jq '{
  success: .success,
  message: .message,
  optionsFetched: .optionsFetched,
  duration: .duration
}'
echo ""

echo ""
echo "============================================"
echo "Summary:"
echo "1. Options should be discovered from PayTM CSV"
echo "2. Redis cache should be populated with current week options"
echo "3. Cron-fetch should use cached options automatically"
echo "============================================"
