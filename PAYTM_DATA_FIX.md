# PayTM Data Fix - Stock Names & Options Display

## Problem Summary
- Few Nifty50 stock names showing as "UNKNOWN"  
- Options chain not showing any data
- Root cause: Incomplete data in cron-fetch.js and missing options fetching

## Changes Made

### 1. Fixed Stock Names (api/cron-fetch.js)
**Issue**: Only 32 out of 50 Nifty stocks were being fetched by the cron job

**Fix**: Updated `NIFTY50_SECURITY_IDS` array to include all 48 complete Nifty50 stocks:
```javascript
const NIFTY50_SECURITY_IDS = [
  '3351',  // SUNPHARMA
  '11536', // TCS
  '10940', // DIVISLAB
  // ... (complete list with 48 stocks)
  '317'    // BAJFINANCE
];
```

### 2. Added Options Data Fetching (api/cron-fetch.js)
**Issue**: Cron job was only fetching stocks, not options data

**Fix**: Added options fetching logic:
- Calculates ATM strike based on Nifty LTP
- Fetches ±1000 points range (20 strikes × 50 points)
- Uses `NIFTY_WEEKLY_OPTIONS` from constants
- Stores options data in Redis alongside stocks

```javascript
// Imports weekly options configuration
const { NIFTY_WEEKLY_OPTIONS } = await import('../constants/niftyWeeklyOptions.js');

// Filters relevant strikes and fetches data
const filteredOptions = NIFTY_WEEKLY_OPTIONS.filter(opt => 
  opt.strike >= minStrike && opt.strike <= maxStrike
);
```

### 3. Updated Redis Data Structure
**Before**:
```json
{
  "stocks": [...],
  "niftyLTP": 23000,
  "stockCount": 32
}
```

**After**:
```json
{
  "stocks": [...],
  "options": [...],
  "niftyLTP": 23000,
  "stockCount": 48,
  "optionsCount": 80
}
```

### 4. Enhanced Frontend to Use Options from Redis (App.tsx)
**Issue**: Frontend was fetching options separately even when available in Redis

**Fix**: 
- Added `__PAYTM_OPTIONS_CACHE__` to window object
- Frontend now checks cache first before making API call
- Falls back to direct API fetch only if cache is empty

```typescript
// Check if we have options from Redis cache first
if (window.__PAYTM_OPTIONS_CACHE__ && window.__PAYTM_OPTIONS_CACHE__.length > 0) {
  console.log(`[App] Using ${window.__PAYTM_OPTIONS_CACHE__.length} options from Redis cache`);
  rawOptions = window.__PAYTM_OPTIONS_CACHE__;
  delete window.__PAYTM_OPTIONS_CACHE__; // Clear cache after use
}
```

### 5. Updated PayTM Service (services/paytmService.ts)
- Enhanced `fetchPayTMFromRedis()` return type to include options
- Added error handling for options conversion
- Improved logging to show both stocks and options counts

## Testing Checklist

### Backend (Cron Job)
- [ ] Visit `/api/cron-fetch` and verify response includes:
  - `stockCount: 48` (or close to it)
  - `optionsCount: 80+` (depends on Nifty LTP)
- [ ] Check Redis data: `/api/get-redis-data`
- [ ] Verify all stock names are present (no UNKNOWN)

### Frontend
- [ ] Open app and wait for data load
- [ ] **Stocks tab**: All 48 stocks should show with proper names
- [ ] **Options tab**: Should display CE/PE contracts with strikes
- [ ] Check browser console for logs:
  ```
  ✅ [PayTM] Using Redis data: 48 stocks, 80 options
  [App] Using 80 options from Redis cache
  ```

## Files Modified
1. `/api/cron-fetch.js` - Complete Nifty50 list + Options fetching
2. `/services/paytmService.ts` - Enhanced Redis data structure
3. `/App.tsx` - Options cache implementation
4. Built files regenerated in `/dist/`

## Expected Results
- ✅ All 48 Nifty50 stocks display with correct names
- ✅ Options chain shows 80+ contracts (CE/PE pairs)
- ✅ Single cron job fetch provides both stocks and options
- ✅ Reduced API calls (data reused from Redis)
- ✅ Faster load time (one Redis fetch vs multiple API calls)

## Rollback Instructions
If issues occur:
1. Revert `/api/cron-fetch.js` to use old 32-stock list
2. Remove options fetching code from cron job
3. App will fall back to direct PayTM API calls

## Notes
- Ensure `PAYTM_ACCESS_TOKEN` is set in Vercel environment variables
- Cron job runs every minute during market hours (9:17 AM - 3:15 PM IST)
- Redis TTL is 24 hours, auto-cleanup keeps last 500 snapshots
- Options expiry date in `constants/niftyWeeklyOptions.ts` needs weekly updates

## Next Steps
1. Monitor cron job logs in Vercel
2. Check Redis storage usage
3. Consider auto-updating weekly options expiry date
4. Add alerting if stock/options count drops unexpectedly
