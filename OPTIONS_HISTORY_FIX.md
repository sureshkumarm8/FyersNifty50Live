# Options History Loading Fix

## Problem
Options symbols were showing "No Data Available" in their 1-min intraday history charts, even though:
- Stock history was loading correctly from Redis
- Options were showing live data when app was in foreground
- Historical data existed in Redis snapshots

## Root Cause
The Redis snapshot loading code in `App.tsx` (lines 353-500) was ONLY handling **raw PayTM format** data with `security_id` field. However, Redis can contain TWO different data formats:

1. **Raw PayTM format** (from cron job): Has `security_id`, `last_price`, `total_buy_quantity`, etc.
2. **Converted FyersQuote format** (from frontend): Has `symbol`, `lp`, `total_buy_qty`, etc.

The options processing code at line 453-497 was doing:
```typescript
if (!option.security_id || option.found === false) return;
```

This skipped ALL already-converted options data, so options history was never built from Redis snapshots that contained converted data.

## Solution
Updated the historical data loading to handle BOTH formats, just like we did for live data loading:

### 1. Initial Options Refs Initialization (Lines 371-437)
**Before**: Only processed `security_id` format
```typescript
if (!option.security_id || option.found === false) return;
const securityIdStr = option.security_id.toString();
```

**After**: Handles both formats
```typescript
// Check if already converted (has 'symbol' field)
if (option.symbol && !option.security_id) {
  symbol = option.symbol;
  initialData = { lp: option.lp || 0, ... };
}
// Raw PayTM format (has security_id)
else if (option.security_id && option.found !== false) {
  const securityIdStr = option.security_id.toString();
  const optInfo = NIFTY_WEEKLY_OPTIONS.find(...);
  symbol = `NSE:NIFTY-${optInfo.strike}-${optInfo.type}`;
  initialData = { lp: option.last_price || 0, ... };
}
```

### 2. SessionHistory Building (Lines 502-576)
**Before**: Only processed `security_id` format in loop
```typescript
options.forEach((option: any) => {
  if (!option.security_id || option.found === false) return;
  // Only handles raw format...
});
```

**After**: Handles both formats
```typescript
options.forEach((option: any) => {
  let symbol: string | undefined;
  let optionData = { ... };
  
  // Check if already converted
  if (option.symbol && !option.security_id) {
    symbol = option.symbol;
    optionData = { 
      last_price: option.lp || 0,
      total_buy_quantity: option.total_buy_qty || 0,
      ...
    };
  }
  // Raw PayTM format
  else if (option.security_id && option.found !== false) {
    // Map security_id to symbol and convert field names
  }
  
  if (!symbol) return;
  sessionHistoryMap[symbol].push(...);
});
```

### 3. Same Fix Applied to Stocks
Applied identical dual-format handling to stock history loading for consistency.

## Debug Logging Added
```
📝 Sample option symbols: ["NSE:NIFTY-23350-CE", "NSE:NIFTY-23400-PE", ...]
📊 SessionHistory breakdown: 50 stocks, 80 options
📊 Sample option history symbols: ["NSE:NIFTY-23350-CE", ...]
📊 Sample option history length: 145
```

## Testing Scenarios
✅ **Cron Data (Raw)**: Options with `security_id` → Mapped to symbol → History loads  
✅ **Frontend Data (Converted)**: Options with `symbol` → Used directly → History loads  
✅ **Mixed Data**: Some raw, some converted → Both handled correctly  
✅ **Stock History**: Still works as before with dual-format support

## Benefits
✅ Options history now loads from Redis snapshots correctly  
✅ Consistent behavior between stocks and options  
✅ Works with both cron and frontend data sources  
✅ Proper delta calculations for intraday charts  
✅ "No Data Available" error completely resolved

## Files Changed
- `App.tsx` (lines 353-576): Added dual-format handling for historical data loading
  - Updated initial refs initialization (stocks + options)
  - Updated sessionHistory building (stocks + options)  
  - Added comprehensive debug logging

## Related Fixes
This completes the trilogy of Redis data format fixes:
1. ✅ Live data loading (`paytmService.ts` - `fetchPayTMFromRedis`)
2. ✅ Options refs initialization (`App.tsx` - Redis first load)
3. ✅ Historical data loading (`App.tsx` - sessionHistory building)

All three now handle both raw PayTM and converted FyersQuote formats seamlessly.

---
**Date**: 2025-01-07  
**Status**: ✅ Fixed and Tested  
**Build**: Successful (1.02s, 234.09 kB gzipped)
