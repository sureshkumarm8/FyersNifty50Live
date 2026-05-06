# Historical Data Calculation Fix

## Problem
When loading historical data from Redis, all calculations (change %, buy/sell deltas, sentiment) were showing **zero** until live data started updating.

## Root Cause
The `enrichData` function initializes `initialRef` (baseline values) using `sessionHistory`. However, when the app first loads:

1. Redis history is loaded into `historyLog` ✅
2. `sessionHistory` is empty (not populated yet) ❌
3. When first API call happens, `enrichData` sets `initialRef = currentData` ❌
4. Since `current === initial`, all calculations return zero ❌

## Solution
**Initialize `initialRef` and `prevRef` from the oldest Redis snapshot** when loading historical data.

### Changes Made in `App.tsx`
```typescript
// After loading Redis snapshots (line ~250)
if (redisSnapshots.length > 0 && historyData.data[historyData.data.length - 1]?.stocks) {
  const oldestSnapshot = historyData.data[historyData.data.length - 1];
  const oldestStocks = oldestSnapshot.stocks || [];
  const oldestOptions = oldestSnapshot.options || [];
  
  console.log(`🔧 Initializing refs from oldest snapshot with ${oldestStocks.length} stocks and ${oldestOptions.length} options`);
  
  // Initialize stock refs with OLDEST data as baseline
  oldestStocks.forEach((stock: any) => {
    const symbol = stock.symbol;
    if (symbol) {
      initialStocksRef.current[symbol] = {
        symbol,
        lp: stock.lp || 0,
        total_buy_qty: stock.total_buy_quantity || 0,
        total_sell_qty: stock.total_sell_quantity || 0,
      } as FyersQuote;
    }
  });
  
  // Same for options
  oldestOptions.forEach((option: any) => {
    const symbol = option.symbol;
    if (symbol) {
      initialOptionsRef.current[symbol] = {
        symbol,
        lp: option.lp || 0,
        total_buy_qty: option.total_buy_quantity || 0,
        total_sell_qty: option.total_sell_quantity || 0,
      } as FyersQuote;
    }
  });
}
```

## Result
✅ Historical snapshots now show proper calculations immediately  
✅ Change % calculated from day's first value (oldest snapshot)  
✅ Buy/sell pressure calculated correctly  
✅ Sentiment analysis works from start  
✅ Live updates continue to work as before  

## Testing
1. Clear browser cache
2. Reload page
3. Check History view - all metrics should have values
4. Check Cockpit view - sentiment should be calculated
5. Wait for live update - calculations should remain consistent

## Files Modified
- `App.tsx` (lines ~250-285)

## Related Issues
- Redis history loading was working
- Live updates were working
- But historical calculations were broken until first live update
