# DEPLOYMENT FIX - Zero Values Issue

## Issue Found
Data in Upstash Redis but showing zero values because:
1. ❌ **Wrong Nifty Index Security ID**: cron-fetch.js was using `26000` instead of `13`
2. ❌ **Old stale data in Redis**: Data from May 6, 2026 11:26 AM (likely test data)
3. ❌ **niftyLTP was null**: Because wrong security ID returned no data

## Fixes Applied

### 1. Fixed Nifty Index Security ID (api/cron-fetch.js line 91)
**Before:**
```javascript
const indexResponse = await fetch(
  'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:26000:INDEX',
  ...
);
const niftyLTP = indexData?.data?.[0]?.lp || null;
```

**After:**
```javascript
const indexResponse = await fetch(
  'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:13:INDEX',
  ...
);
const niftyLTP = indexData?.data?.[0]?.last_price || indexData?.data?.[0]?.lp || null;
```

## Deployment Steps

### 1. Push Changes to Git
```bash
git add .
git commit -m "Fix: Correct Nifty Index security ID and improve data loading"
git push origin main
```

### 2. Vercel Will Auto-Deploy
Vercel will detect the push and automatically deploy. Monitor at:
https://vercel.com/dashboard

### 3. After Deployment - Clear Old Redis Data
Run this in browser console on your deployed site:
```javascript
// This will trigger a fresh data fetch
fetch('https://fyers-nifty50-live.vercel.app/api/cron-fetch', {
  headers: {
    'Authorization': 'Bearer YOUR_CRON_SECRET' // If you have CRON_SECRET env var
  }
}).then(r => r.json()).then(console.log);
```

Or manually via curl:
```bash
curl -X GET https://fyers-nifty50-live.vercel.app/api/cron-fetch
```

### 4. Verify Redis Data is Updated
```javascript
fetch('/api/get-redis-data')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Success:', data.success);
    console.log('📊 Nifty LTP:', data.data.niftyLTP);
    console.log('📈 Stocks:', data.data.stocks?.length);
    console.log('⏰ Timestamp:', new Date(data.data.timestamp).toLocaleString());
    
    // Check if data is fresh (< 5 minutes old)
    const ageMinutes = Math.round((Date.now() - data.data.timestamp) / 60000);
    console.log('📅 Data Age:', ageMinutes, 'minutes');
  });
```

Expected output:
```
✅ Success: true
📊 Nifty LTP: 23456.75  (should NOT be null)
📈 Stocks: 50
⏰ Timestamp: 5/6/2026, 11:55:30 AM
📅 Data Age: 0 minutes
```

## Environment Variables to Check in Vercel

Make sure these are set in Vercel → Settings → Environment Variables:

### Required:
- ✅ `PAYTM_ACCESS_TOKEN` - Your PayTM JWT token
- ✅ `UPSTASH_REDIS_REST_URL` or `KV_REST_API_URL`
- ✅ `UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_TOKEN`

### Optional:
- `CRON_SECRET` - If set, cron endpoint requires Bearer token
- `BYPASS_MARKET_HOURS` - Set to `true` for testing outside 9:17 AM - 3:15 PM IST
- `CONFIG_SECRET` - For /api/get-config endpoint auth

## Verify Cron Job Configuration

In Vercel Dashboard:
1. Go to project → Settings → Crons
2. Should see: `/api/cron-fetch` scheduled every minute
3. If not, add it:
   ```
   Path: /api/cron-fetch
   Schedule: */1 * * * * (every minute)
   ```

## Testing After Deployment

### Test 1: Check if data is loading
1. Open https://fyers-nifty50-live.vercel.app/
2. Open browser console (F12)
3. Look for these logs:
   ```
   [PayTM Redis] Fetching data from /api/get-redis-data...
   [PayTM Redis] Response: { success: true, hasData: true }
   [PayTM Redis] ✅ Loaded 50 stocks, Nifty: 23456.75 (Age: 1m)
   ✅ [PayTM] Using Redis data: 50 stocks
   📊 [Mobile Debug] Enriched 50 stocks, setting state...
   ```

### Test 2: Check if stocks are displayed
- Summary page should show Nifty LTP (not 0)
- Stocks page should show 50 stocks with prices
- Change % should be colored (green/red)

### Test 3: Check console for errors
- ✅ No 401 errors
- ✅ No "No data available" errors
- ⚠️  "Skipping options fetch" is OK (expected if no token in localStorage)

## Troubleshooting

### Issue: Still seeing niftyLTP: null
**Solution**: 
1. Check if cron ran after deployment: Vercel → Logs → Cron Logs
2. Manually trigger: `curl https://fyers-nifty50-live.vercel.app/api/cron-fetch`
3. Check PAYTM_ACCESS_TOKEN is valid and not expired

### Issue: Old stale data still showing
**Solution**: Clear Redis manually by triggering cron-fetch during market hours

### Issue: "Market closed - No fetch performed"
**Solution**: 
- Either wait for market hours (9:17 AM - 3:15 PM IST Monday-Friday)
- OR set `BYPASS_MARKET_HOURS=true` in Vercel env vars for testing

### Issue: 401 Unauthorized on cron-fetch
**Solution**: 
- If `CRON_SECRET` is set, you need to pass it: 
  ```bash
  curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
    https://fyers-nifty50-live.vercel.app/api/cron-fetch
  ```
- OR remove `CRON_SECRET` env var temporarily for testing

## What Should Work Now

1. ✅ **Stock data loads from Redis** - Even without paytmAccessToken in localStorage
2. ✅ **Nifty LTP shows correct value** - Not null anymore  
3. ✅ **Fresh data every minute** - Cron job fetches during market hours
4. ✅ **No 401 errors** - Graceful fallback to Redis data
5. ✅ **Options are optional** - App works even if options fail to load

## Files Modified
- ✅ `api/cron-fetch.js` - Fixed Nifty Index security ID (26000 → 13)
- ✅ `App.tsx` - Added token checks before API calls
- ✅ `services/paytmService.ts` - Enhanced Redis fetch logging

## Quick Verification Checklist
- [ ] Code pushed to Git
- [ ] Vercel deployed successfully
- [ ] Cron job triggered (manual or automatic)
- [ ] Redis data has niftyLTP (not null)
- [ ] Browser console shows "✅ Loaded X stocks"
- [ ] UI displays stock prices (not zero)
- [ ] No 401 errors in console

Once all checked, the app should work! 🎉
