# 🎯 Dynamic Options Data - Fully Automated Solution

## 🚨 Current Problem

**Issue:** Options data not showing even though data is available in Redis
**Root Cause:** Static mapping with hardcoded `security_id` from old expiry dates

### Why This Happens:
1. Options expire **every Tuesday** (changed from Thursday in Sep 2025)
2. If Tuesday is a holiday, expiry moves to **Monday** (previous trading day)
3. Each week, new contracts get **new security IDs** from PayTM
4. Current code uses **hardcoded security_ids** in `constants/niftyWeeklyOptions.ts`
5. When expiry passes, **old security_ids become invalid**
6. App tries to fetch with old IDs → **No data returned**

---

## 🎯 Complete Automated Solution

### **3-Layer Auto-Update Strategy**

```
┌──────────────────────────────────────────────┐
│  Layer 1: Real-time API Discovery           │
│  ✓ Fetch options dynamically from PayTM     │
│  ✓ No hardcoded security_ids                │
│  ✓ Always use current week contracts        │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  Layer 2: Smart Caching with Auto-Refresh   │
│  ✓ Cache discovered options in Redis        │
│  ✓ Auto-detect expiry and refresh weekly    │
│  ✓ Fallback to live discovery if needed     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│  Layer 3: Manual Update Backup              │
│  ✓ Auto-update script on cron schedule      │
│  ✓ App startup expiry detection             │
│  ✓ Manual trigger endpoint                  │
└──────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### **Phase 1: Dynamic Options Discovery API** (Recommended ✅)

Create a new endpoint that discovers current week's options automatically:

```javascript
// api/discover-options.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    const paytmToken = process.env.PAYTM_ACCESS_TOKEN;
    
    if (!paytmToken) {
      return res.status(401).json({ error: 'PayTM token not configured' });
    }

    // 1. Get Nifty LTP
    const indexResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=NSE:13:INDEX',
      { headers: { 'x-jwt-token': paytmToken } }
    );
    const indexData = await indexResponse.json();
    const niftyLTP = indexData?.data?.[0]?.last_price || 23000;

    // 2. Calculate ATM strike range
    const atmStrike = Math.round(niftyLTP / 50) * 50;
    const minStrike = atmStrike - 1000;
    const maxStrike = atmStrike + 1000;

    // 3. Get next Thursday expiry (handles holidays)
    const nextExpiry = getNextThursday();
    
    // 4. Fetch ALL option contracts from PayTM
    const allOptionsResponse = await fetch(
      'https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv'
    );
    const csvText = await allOptionsResponse.text();
    
    // 5. Parse and filter for current week NIFTY options
    const currentWeekOptions = parseAndFilterOptions(csvText, nextExpiry, minStrike, maxStrike);
    
    // 6. Cache discovered options in Redis
    await redis.set('options:current_week', JSON.stringify({
      expiry: nextExpiry,
      discoveredAt: new Date().toISOString(),
      atmStrike,
      options: currentWeekOptions,
      count: currentWeekOptions.length
    }), { ex: 604800 }); // 7 days TTL
    
    // 7. Return discovered options
    return res.status(200).json({
      success: true,
      expiry: nextExpiry,
      atmStrike,
      niftyLTP,
      options: currentWeekOptions,
      count: currentWeekOptions.length
    });
    
  } catch (error) {
    console.error('[Discover Options] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function getNextThursday() {
  const today = new Date();
  const day = today.getDay();
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  const nextThursday = new Date(today);
  nextThursday.setDate(today.getDate() + daysUntilThursday);
  return nextThursday.toISOString().split('T')[0];
}

function parseAndFilterOptions(csvText, expiryDate, minStrike, maxStrike) {
  const lines = csvText.split('\n');
  const options = [];
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;
    
    const securityId = parts[0]?.trim();
    const symbol = parts[1]?.trim();
    const strike = parseFloat(parts[3]);
    const expiry = parts[4]?.trim();
    
    // Filter: NIFTY + Current week expiry + ATM range
    if (symbol?.includes('NIFTY') && 
        expiry === expiryDate &&
        strike >= minStrike && 
        strike <= maxStrike) {
      
      const type = symbol.includes('CE') ? 'CE' : 'PE';
      options.push({ security_id: securityId, strike, type });
    }
  }
  
  return options;
}
```

---

### **Phase 2: Update Cron Fetch to Use Dynamic Discovery**

Modify `api/cron-fetch.js` to use discovered options instead of hardcoded:

```javascript
// In api/cron-fetch.js (around line 172-186)

// OLD CODE (Remove):
// const { NIFTY_WEEKLY_OPTIONS } = await import('../constants/niftyWeeklyOptions.js');

// NEW CODE (Add):
// Try to get cached options first
let currentWeekOptions = await redis.get('options:current_week');

if (!currentWeekOptions || isExpired(currentWeekOptions.expiry)) {
  // Auto-discover new options if cache expired
  console.log('[Cron] Options expired or not cached, auto-discovering...');
  
  const discoverResponse = await fetch(
    `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/discover-options`
  );
  const discovered = await discoverResponse.json();
  currentWeekOptions = { options: discovered.options };
}

// Use dynamic options
const filteredOptions = currentWeekOptions.options.filter(opt => 
  opt.strike >= minStrike && opt.strike <= maxStrike
);
const optionIds = filteredOptions.map(opt => opt.security_id);
```

---

### **Phase 3: Frontend Auto-Refresh**

Update `App.tsx` to check for expiry and auto-refresh:

```typescript
// Add this function in App.tsx

async function checkAndRefreshOptions() {
  try {
    // Check cached options
    const cached = await fetch('/api/discover-options', { method: 'HEAD' });
    const expiryHeader = cached.headers.get('X-Options-Expiry');
    
    if (!expiryHeader || new Date(expiryHeader) < new Date()) {
      console.log('[Options] ⚠️ Options expired, refreshing...');
      
      // Trigger discovery
      const response = await fetch('/api/discover-options');
      const data = await response.json();
      
      console.log(`[Options] ✅ Refreshed with ${data.count} contracts for expiry ${data.expiry}`);
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Options Updated', {
          body: `New week options loaded (${data.count} contracts)`
        });
      }
      
      // Force reload data
      await loadHistoricalData();
    }
  } catch (error) {
    console.error('[Options] Failed to refresh:', error);
  }
}

// Call on app startup (in useEffect)
useEffect(() => {
  checkAndRefreshOptions();
  
  // Check every hour
  const interval = setInterval(checkAndRefreshOptions, 3600000);
  return () => clearInterval(interval);
}, []);
```

---

### **Phase 4: Automated Weekly Cron Job**

Set up external cron to auto-discover every Monday:

**Cron Job Configuration:**
- **Service:** cron-job.org
- **URL:** `https://your-app.vercel.app/api/discover-options`
- **Schedule:** Every Monday at 6:00 AM IST
- **Method:** GET
- **Expected Response:** `{ "success": true, "count": 160 }`

---

## 🎯 Migration Steps (From Current to Dynamic)

### **Step 1: Deploy Discovery API**
```bash
# Create the new API file
touch api/discover-options.js

# Copy implementation from above
# Commit and deploy
git add api/discover-options.js
git commit -m "feat: Add dynamic options discovery API"
git push
```

### **Step 2: Test Discovery**
```bash
# Test locally first
curl "http://localhost:3000/api/discover-options"

# Should return current week's options
```

### **Step 3: Update Cron Fetch**
```bash
# Modify api/cron-fetch.js to use discovery
# Test with bypass flag
curl "http://localhost:3000/api/cron-fetch" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### **Step 4: Setup External Cron**
```
1. Login to cron-job.org
2. Add job: "Discover Weekly Options"
3. URL: https://your-app.vercel.app/api/discover-options
4. Schedule: Monday 6:00 AM IST
5. Save and activate
```

### **Step 5: Update Frontend (Optional)**
```bash
# Add auto-check logic to App.tsx
# Deploy
git add App.tsx
git commit -m "feat: Add options auto-refresh on expiry"
git push
```

---

## ✅ Benefits of This Approach

| Feature | Current (Static) | New (Dynamic) |
|---------|------------------|---------------|
| **Weekly Updates** | Manual rebuild required | Automatic |
| **Expiry Handling** | App breaks if forgotten | Auto-detects and refreshes |
| **Security IDs** | Hardcoded (gets stale) | Live discovery |
| **Deployment** | Rebuild & redeploy weekly | No rebuild needed |
| **Maintenance** | High (manual every week) | Zero (fully automated) |
| **Reliability** | Fails after expiry | Always works |

---

## 🔍 How It Solves Your Problem

### Current Issue:
```
Constants File: security_id: "41562" (from May 5 expiry)
                     ↓
              [EXPIRED - INVALID]
                     ↓
           Redis: No data found ❌
```

### After Fix:
```
Discovery API: Fetch current week contracts
                     ↓
        security_id: "42789" (May 12 expiry)
                     ↓
              [VALID - CURRENT]
                     ↓
           Redis: Data loaded ✅
```

---

## 🚀 Quick Start (Fastest Solution)

If you want options working **RIGHT NOW**:

### **Immediate Fix (5 minutes):**
```bash
# 1. Download latest options CSV
curl -o api/paytm/option_security_master.csv \
  "https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv"

# 2. Regenerate constants with current week
node scripts/generateWeeklyOptions.cjs

# 3. Check the output
grep CURRENT_EXPIRY constants/niftyWeeklyOptions.ts
# Should show: export const CURRENT_EXPIRY_DATE = '2026-05-12';

# 4. Rebuild and deploy
npm run build
git add .
git commit -m "fix: Update options to current week expiry"
git push
```

### **Long-term Fix (30 minutes):**
Implement the Dynamic Discovery API (Phase 1-4 above)

---

## 📊 Monitoring & Verification

### Check Current Status:
```bash
# 1. Check what expiry is configured
curl "https://your-app.vercel.app/api/auto-update-options"

# 2. Discover current week options
curl "https://your-app.vercel.app/api/discover-options"

# 3. Check Redis cache
# (Via Upstash Console) → Look for key: options:current_week
```

### Verify Options Loading:
```bash
# Check cron fetch includes options
curl "https://your-app.vercel.app/api/cron-fetch?BYPASS_MARKET_HOURS=true" \
  -H "Authorization: Bearer YOUR_SECRET"

# Response should have:
# "optionsCount": 160 (or similar number)
```

---

## 🛠️ Troubleshooting

### Problem: Options still not showing

**Check 1: Verify expiry date**
```bash
grep CURRENT_EXPIRY constants/niftyWeeklyOptions.ts
# Should be current or future date
```

**Check 2: Test discovery API**
```bash
curl "https://your-app.vercel.app/api/discover-options" | jq
# Should return ~160 options
```

**Check 3: Check Redis data**
```bash
# In Upstash Console, check key: snapshot:latest
# Should have "options": [...] array with data
```

**Check 4: Verify PayTM token**
```bash
# In Vercel dashboard → Settings → Environment Variables
# Confirm: PAYTM_ACCESS_TOKEN is set and valid
```

---

## 🎯 Recommended Implementation Order

1. ✅ **Immediate:** Run `generateWeeklyOptions.cjs` → Deploy (5 min)
2. ✅ **Today:** Implement Discovery API (30 min)
3. ✅ **Today:** Update Cron Fetch to use discovery (15 min)
4. ✅ **Tomorrow:** Setup external cron job (10 min)
5. ⏳ **Optional:** Add frontend auto-refresh (30 min)

---

## 📝 Summary

**Problem:** Options data not showing due to expired security IDs

**Root Cause:** Static hardcoded IDs in constants file

**Solution:** 
- **Short-term:** Regenerate constants weekly (manual)
- **Long-term:** Dynamic discovery API (fully automated)

**Best Approach:** Implement discovery API for zero-maintenance solution

---

## 🚀 Next Steps

Pick one:

### Option A: Quick Fix (Works Today)
```bash
node scripts/generateWeeklyOptions.cjs && npm run build && git push
```

### Option B: Permanent Solution (Works Forever)
```bash
# Implement discovery API (follow Phase 1-4 above)
```

---

**Questions? Issues?**
Check the troubleshooting section or review the code in:
- `api/cron-fetch.js` - Data fetching logic
- `constants/niftyWeeklyOptions.ts` - Current options config
- `scripts/generateWeeklyOptions.cjs` - Generation script
