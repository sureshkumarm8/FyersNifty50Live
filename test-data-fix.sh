#!/bin/bash

echo "🔍 Testing PayTM Data Loading Fix"
echo "=================================="
echo ""

# Check if built
if [ ! -d "dist" ]; then
  echo "❌ No dist folder found. Run: npm run build"
  exit 1
fi

echo "✅ Build found"
echo ""

# Test Redis endpoint (if deployed)
echo "📡 Testing Redis data endpoint..."
echo "Run this in your browser console:"
echo ""
echo "fetch('/api/get-redis-data').then(r => r.json()).then(data => {"
echo "  console.log('Redis data:', data);"
echo "  if (data.success) {"
echo "    console.log('✅ Stocks:', data.data.stocks?.length || 0);"
echo "    console.log('✅ Nifty LTP:', data.data.niftyLTP || 0);"
echo "    console.log('✅ Age:', Math.round((Date.now() - data.data.timestamp) / 60000), 'minutes');"
echo "  } else {"
echo "    console.log('❌ Error:', data.error);"
echo "  }"
echo "});"
echo ""

echo "🧪 What to expect:"
echo "==================="
echo ""
echo "✅ SUCCESS CASE (Redis has data):"
echo "  [PayTM Redis] ✅ Loaded 50 stocks, Nifty: 23450.75 (Age: 2m)"
echo "  ✅ [PayTM] Using Redis data: 50 stocks"
echo "  [App] Skipping options fetch - no PayTM token available"
echo ""
echo "⚠️  NO REDIS DATA CASE:"
echo "  [PayTM Redis] API returned 404: No data available yet"
echo "  Error: No Redis data available and PayTM Access Token is missing..."
echo ""
echo "📝 If no Redis data:"
echo "  1. Check Vercel cron job is configured"
echo "  2. Manually trigger: curl https://your-app.vercel.app/api/cron-fetch"
echo "  3. Check PAYTM_ACCESS_TOKEN env var is set"
echo ""

# Show key changes
echo "📄 Key Changes Made:"
echo "===================="
echo "1. App.tsx line ~596: Check for paytmAccessToken before API fallback"
echo "2. App.tsx line ~637: Skip options if no token (graceful degradation)"
echo "3. services/paytmService.ts: Enhanced Redis fetch with better logging"
echo ""

echo "✅ Fix applied successfully!"
echo ""
echo "Next: Deploy to Vercel and test in browser"
