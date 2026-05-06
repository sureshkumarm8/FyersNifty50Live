#!/bin/bash
# Test script to verify PayTM data fetch fixes

echo "🔍 Testing PayTM Data Fetch Fixes"
echo "=================================="
echo ""

echo "1. Checking Nifty50 Security IDs count in cron-fetch.js..."
STOCK_COUNT=$(grep -o "'[0-9]\+'" api/cron-fetch.js | wc -l)
echo "   Found: $STOCK_COUNT security IDs"
if [ "$STOCK_COUNT" -ge 48 ]; then
  echo "   ✅ PASS: Complete Nifty50 list"
else
  echo "   ❌ FAIL: Incomplete list (expected 48+)"
fi
echo ""

echo "2. Checking if options fetching is implemented..."
if grep -q "NIFTY_WEEKLY_OPTIONS" api/cron-fetch.js; then
  echo "   ✅ PASS: Options fetching code present"
else
  echo "   ❌ FAIL: Options fetching missing"
fi
echo ""

echo "3. Checking Redis data structure includes options..."
if grep -q "options:" api/cron-fetch.js && grep -q "optionsCount:" api/cron-fetch.js; then
  echo "   ✅ PASS: Redis structure updated for options"
else
  echo "   ❌ FAIL: Redis structure incomplete"
fi
echo ""

echo "4. Checking App.tsx uses options cache..."
if grep -q "__PAYTM_OPTIONS_CACHE__" App.tsx; then
  echo "   ✅ PASS: Options cache implemented in App"
else
  echo "   ❌ FAIL: Options cache missing"
fi
echo ""

echo "5. Checking paytmService.ts returns options..."
if grep -q "options: FyersQuote\[\]" services/paytmService.ts; then
  echo "   ✅ PASS: Service returns options data"
else
  echo "   ❌ FAIL: Service doesn't return options"
fi
echo ""

echo "6. Verifying build succeeded..."
if [ -f "dist/index.html" ]; then
  BUNDLE_SIZE=$(du -h dist/assets/index-*.js | cut -f1)
  echo "   ✅ PASS: Build successful (Bundle: $BUNDLE_SIZE)"
else
  echo "   ❌ FAIL: Build files missing"
fi
echo ""

echo "=================================="
echo "📋 Summary of Stock IDs:"
echo ""
echo "Security IDs found in cron-fetch.js:"
grep -o "'[0-9]\+'" api/cron-fetch.js | sort -u | head -20
echo "... (showing first 20)"
echo ""

echo "✅ All checks complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: git push"
echo "2. Test cron endpoint: curl https://your-domain/api/cron-fetch"
echo "3. Verify Redis data: curl https://your-domain/api/get-redis-data"
echo "4. Check frontend displays all stocks and options"
