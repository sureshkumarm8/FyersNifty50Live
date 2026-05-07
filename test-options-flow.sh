#!/bin/bash

echo "🔍 Testing Options Data Flow..."
echo ""

# Test 1: Check Redis data
echo "1️⃣ Checking Redis data availability..."
curl -s http://localhost:3000/api/get-redis-data | jq '.data | {stocks: .stocks | length, options: .options | length, niftyLTP: .niftyLTP}' 2>/dev/null || echo "❌ Redis API not responding or jq not installed"

echo ""
echo "2️⃣ Check if options data exists in Redis..."
curl -s http://localhost:3000/api/get-redis-data | jq '.data.options[0:2]' 2>/dev/null || echo "❌ No options data or jq not installed"

echo ""
echo "✅ Test complete. Check browser console for client-side logs."
echo "   Look for: [OptionChain] and [App] log messages"
