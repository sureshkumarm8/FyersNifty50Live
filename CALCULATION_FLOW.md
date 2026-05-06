# Data Flow & Calculation Architecture

## Where Calculations Happen

### ❌ OLD PROBLEM (Before Fix)
```
Redis: Raw stock/options data ONLY
  ↓
Frontend: Calculates EVERYTHING on page load
  ↓
Result: Zeros shown because initialRef was empty
```

### ✅ CURRENT ARCHITECTURE

## 1. **Cron Job (External - Every Minute)**
**File:** `api/cron-fetch.js`

**What it stores in Redis:**
```javascript
{
  timestamp: 1234567890,
  niftyLTP: 23450.50,
  stocks: [
    {
      symbol: "NSE:3045:EQUITY",
      lp: 825.30,                    // Last price
      total_buy_quantity: 1234567,   // Raw quantity
      total_sell_quantity: 9876543,  // Raw quantity
      change_percent: 2.45,
      // ... other raw fields
    }
  ],
  options: [ /* same - raw data only */ ]
}
```

**❌ NO calculations stored:**
- No sentiment
- No buy/sell deltas
- No strength metrics
- No enriched data

---

## 2. **Frontend (On Page Load)**
**File:** `App.tsx` - Lines 173-238

**Step 1: Load from Redis**
```typescript
const historyResponse = await fetch('/api/get-history?limit=500');
const rawSnapshots = historyData.data; // Raw data from Redis
```

**Step 2: Calculate ALL Metrics (Frontend Side)**
```typescript
const redisSnapshots = historyData.data.map((snap) => {
  const stocks = snap.stocks || [];
  const options = snap.options || [];
  
  // ✅ CALCULATE stock metrics
  const adv = stocks.filter(s => s.change_percent > 0).length;
  const dec = stocks.filter(s => s.change_percent < 0).length;
  
  // ✅ CALCULATE stock sentiment
  let totalBuyQty = 0, totalSellQty = 0;
  stocks.forEach(s => {
    totalBuyQty += s.total_buy_quantity || 0;
    totalSellQty += s.total_sell_quantity || 0;
  });
  const stockSent = ((totalBuyQty - totalSellQty) / Math.abs(totalSellQty)) * 100;
  
  // ✅ CALCULATE options metrics
  let callsBuyQty = 0, callsSellQty = 0, callsOI = 0;
  let putsBuyQty = 0, putsSellQty = 0, putsOI = 0;
  options.forEach(opt => {
    if (opt.symbol.includes('CE')) {
      callsBuyQty += opt.total_buy_quantity || 0;
      callsSellQty += opt.total_sell_quantity || 0;
      callsOI += opt.oi || 0;
    } else {
      putsBuyQty += opt.total_buy_quantity || 0;
      putsSellQty += opt.total_sell_quantity || 0;
      putsOI += opt.oi || 0;
    }
  });
  
  // ✅ CALCULATE sentiment metrics
  const pcr = callsOI > 0 ? putsOI / callsOI : 0;
  const callSent = ((callsBuyQty - callsSellQty) / Math.abs(callsSellQty)) * 100;
  const putSent = ((putsBuyQty - putsSellQty) / Math.abs(putsSellQty)) * 100;
  const optionsSent = callSent - putSent;
  const overallSent = (stockSent * 0.7) + (optionsSent * 0.3);
  
  return {
    timestamp: snap.timestamp,
    niftyLtp: snap.niftyLTP,
    overallSent,      // ✅ Calculated
    stockSent,        // ✅ Calculated
    callSent,         // ✅ Calculated
    putSent,          // ✅ Calculated
    optionsSent,      // ✅ Calculated
    pcr,              // ✅ Calculated
    adv,              // ✅ Calculated
    dec,              // ✅ Calculated
    // ... more calculated fields
  };
});
```

**Step 3: Initialize Refs (NEW FIX)**
```typescript
// Set baseline from OLDEST snapshot
const oldestSnapshot = historyData.data[historyData.data.length - 1];
oldestSnapshot.stocks.forEach(stock => {
  initialStocksRef.current[stock.symbol] = {
    lp: stock.lp,
    total_buy_qty: stock.total_buy_quantity,
    total_sell_qty: stock.total_sell_quantity
  };
});
```

---

## 3. **Frontend (Live Updates)**
**File:** `App.tsx` - Lines 604-850 (refreshData function)

**Same Process:**
1. Fetch fresh data from Redis or API
2. Use `enrichData()` to calculate day changes
3. Compare with `initialRef` (now properly set!)
4. Generate new snapshot with all calculations

---

## Summary Table

| Component | What's Stored | Where Calculated | When |
|-----------|---------------|------------------|------|
| **Redis (Cron)** | Raw price, volume, OI, quantities | N/A | Every minute |
| **Frontend (Load)** | Historical snapshots → Calculated metrics | Browser (on load) | Page refresh |
| **Frontend (Live)** | New snapshots → Calculated metrics | Browser (every 30s) | Ongoing |

---

## Why This Design?

### ✅ Advantages
1. **Reduced Redis Storage** - Only raw data stored (~50% less space)
2. **Flexibility** - Can change calculation formulas without reprocessing history
3. **No Backend Logic** - Cron job is simple (just fetch & store)
4. **Real-time Recalc** - Calculations always use latest logic

### ⚠️ Trade-offs
1. **Initial Load Time** - ~500 snapshots × calculations = ~500ms
2. **Client-side Processing** - More CPU usage in browser
3. **Formula Consistency** - Must ensure same formulas everywhere

---

## The Fix Impact

### Before Fix
```
Redis: [snap1, snap2, snap3]
  ↓
Frontend loads → initialRef = EMPTY
  ↓
First API call → initialRef = currentData
  ↓
Result: current === initial → ALL ZEROS ❌
```

### After Fix
```
Redis: [snap1, snap2, snap3]
  ↓
Frontend loads → initialRef = snap1 (oldest)
  ↓
Calculations: current - initial → PROPER VALUES ✅
  ↓
Result: Historical data shows correctly immediately
```

---

## Console Verification

On page load, you should see:
```
📥 Loaded 250 snapshots from Redis
🔄 Converted snapshots: 250
🔧 Initializing refs from oldest snapshot with 50 stocks and 82 options
✅ Initialized 50 stock refs and 82 option refs
✅ Restored 250 historical snapshots from Redis
```

Then historical data shows proper calculations! 🎉
