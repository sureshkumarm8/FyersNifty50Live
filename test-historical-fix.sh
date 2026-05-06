#!/bin/bash

echo "🧪 Testing Historical Data Fix"
echo "================================"
echo ""

# Check if fix is in place
if grep -q "Initializing refs from oldest snapshot" App.tsx; then
    echo "✅ Fix applied in App.tsx"
else
    echo "❌ Fix NOT found in App.tsx"
    exit 1
fi

# Check Redis API is accessible
echo ""
echo "📡 Testing Redis API..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/get-history?limit=1)
if [ "$response" = "200" ]; then
    echo "✅ Redis API accessible"
else
    echo "⚠️  Redis API returned $response (server may not be running)"
fi

echo ""
echo "📋 Testing Steps:"
echo "1. Start dev server: npm run dev"
echo "2. Open browser: http://localhost:5173"
echo "3. Check browser console for:"
echo "   - '🔧 Initializing refs from oldest snapshot'"
echo "   - '✅ Initialized X stock refs and Y option refs'"
echo "4. Navigate to History view"
echo "5. Verify all metrics show values (not zeros)"
echo "6. Check Cockpit view sentiment calculations"
echo ""
echo "Expected Behavior:"
echo "✅ Historical data shows calculations immediately"
echo "✅ No zeros in historical snapshots"
echo "✅ Sentiment analysis works from page load"

