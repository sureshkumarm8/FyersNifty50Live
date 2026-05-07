# 🎯 Quick Implementation Guide - Dynamic Options

## What Changed

### ✅ Files Added
1. **`api/discover-options.js`** - Dynamic options discovery API
2. **`OPTIONS_DYNAMIC_AUTO_SOLUTION.md`** - Complete documentation
3. **`test-dynamic-options.sh`** - Test script

### ✅ Files Modified
1. **`api/cron-fetch.js`** - Now uses dynamic discovery with fallback

---

## 🚀 Quick Start

### Option 1: Immediate Fix (5 minutes)
```bash
# Update to current week's options
node scripts/generateWeeklyOptions.cjs
npm run build
git add .
git commit -m "fix: Update options to current week"
git push
```

### Option 2: Enable Dynamic Discovery (15 minutes)
```bash
# 1. Deploy the new discovery API
git add api/discover-options.js api/cron-fetch.js
git commit -m "feat: Add dynamic options discovery"
git push

# 2. After deployment, trigger discovery
curl "https://your-app.vercel.app/api/discover-options"

# 3. Verify it worked
curl "https://your-app.vercel.app/api/discover-options" | jq

# Expected response:
# {
#   "success": true,
#   "expiry": "2026-05-12",
#   "count": 160,
#   "cached": true
# }
```

---

## 🔄 How It Works

### Before (Static):
```
Constants File → Hardcoded IDs → API Call → ❌ No Data (Expired)
```

### After (Dynamic):
```
Discovery API → Fetch CSV → Parse Current Week → Cache → API Call → ✅ Data
                                                    ↓
                                            Auto-refresh weekly
```

---

## 📋 Setup Checklist

- [ ] Deploy `api/discover-options.js`
- [ ] Deploy updated `api/cron-fetch.js`
- [ ] Test discovery: `curl /api/discover-options`
- [ ] Verify options count > 0
- [ ] Setup weekly cron (Monday 6 AM)
- [ ] Monitor first week's auto-update

---

## 🔧 Cron Job Setup

**Platform:** cron-job.org

**Configuration:**
- **Title:** Discover Weekly Options
- **URL:** `https://your-app.vercel.app/api/discover-options?force=true`
- **Schedule:** Every Monday at 6:00 AM IST
- **Method:** GET
- **Expected:** 200 OK with `{"success": true}`

---

## 🧪 Testing

### Local Testing:
```bash
# Start dev server
npm run dev

# Run test script
./test-dynamic-options.sh
```

### Production Testing:
```bash
# Test discovery
curl "https://your-app.vercel.app/api/discover-options"

# Test cron with dynamic options
curl "https://your-app.vercel.app/api/cron-fetch?BYPASS_MARKET_HOURS=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🎯 Expected Results

### Discovery API Response:
```json
{
  "success": true,
  "cached": false,
  "expiry": "2026-05-12",
  "atmStrike": 23000,
  "niftyLTP": 23045.60,
  "strikeRange": { "min": 22000, "max": 24000 },
  "options": [
    { "security_id": "41562", "strike": 22000, "type": "CE" },
    { "security_id": "41563", "strike": 22000, "type": "PE" },
    ...
  ],
  "count": 160,
  "discoveredAt": "2026-05-07T10:30:00.000Z",
  "duration": 1234
}
```

### Cron Fetch Response (with options):
```json
{
  "success": true,
  "message": "Data fetched and saved successfully",
  "optionsCount": 80,
  "stockCount": 50,
  "niftyLTP": 23045.60
}
```

---

## 🛠️ Troubleshooting

### Problem: Options count is 0

**Solution 1:** Check expiry calculation
```bash
node -e "
const today = new Date();
const day = today.getDay();
const daysToThursday = day < 4 ? 4 - day : (7 - day) + 4;
const thursday = new Date(today);
thursday.setDate(today.getDate() + daysToThursday);
console.log('Next Thursday:', thursday.toISOString().split('T')[0]);
"
```

**Solution 2:** Force refresh
```bash
curl "https://your-app.vercel.app/api/discover-options?force=true"
```

**Solution 3:** Check CSV format
```bash
# Download and inspect CSV
curl "https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv" | head -20
```

### Problem: Cron fetch still failing

**Check 1:** Verify Redis has cached options
- Login to Upstash Console
- Check key: `options:current_week`
- Should have JSON with expiry and options array

**Check 2:** Test discovery manually
```bash
curl "https://your-app.vercel.app/api/discover-options" | jq
```

**Check 3:** Verify fallback works
```bash
# Check constants file has valid expiry
grep CURRENT_EXPIRY constants/niftyWeeklyOptions.ts
```

---

## 📊 Monitoring

### Weekly Checklist (Monday):
1. ✅ Discovery cron runs at 6 AM
2. ✅ Check logs for "Discovered X options"
3. ✅ Verify new expiry date in Redis
4. ✅ Options data visible in app

### Dashboard Checks:
- **Vercel Logs:** Search for "[Discover]"
- **Upstash Console:** Check `options:current_week` key
- **App Console:** Look for options count in network tab

---

## 🎯 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Weekly Maintenance** | Manual rebuild | Automatic |
| **Expiry Handling** | Breaks if forgotten | Auto-detects |
| **Deployment Frequency** | Every week | Never (for options) |
| **Error Prone** | High | Low |
| **Setup Time** | 15 min/week | 15 min once |

---

## 📝 Next Steps

1. **Today:** 
   - Deploy discovery API
   - Test with `?force=true`
   - Verify options appear

2. **This Week:**
   - Setup cron job on cron-job.org
   - Monitor first auto-update on Monday

3. **Optional:**
   - Add frontend notification on options refresh
   - Setup alerts for discovery failures
   - Add metrics/logging dashboard

---

## 🚨 Important Notes

1. **CSV Format:** Discovery relies on PayTM's CSV format. If format changes, update parser in `discover-options.js`

2. **Expiry Logic:** Uses official niftyExpiryDates.ts calendar with Tuesday expiry (handles holidays automatically)

3. **Strike Range:** ATM ±1000 points (20 strikes). Adjust `strikeRange` variable if needed

4. **Cache TTL:** Options cached for 7 days. Perfect for weekly expiry cycle

5. **Fallback:** If discovery fails, cron-fetch uses constants file as fallback

---

## ✅ Success Indicators

Your implementation is working correctly if:

- ✅ `/api/discover-options` returns 150+ options
- ✅ Expiry date is current or future Thursday
- ✅ Second call shows `"cached": true` (faster)
- ✅ Options data appears in app dashboard
- ✅ No "options expired" warnings in console
- ✅ Cron fetch shows `optionsCount > 0`

---

## 📞 Support

Issues? Check:
1. Read `OPTIONS_DYNAMIC_AUTO_SOLUTION.md` (detailed guide)
2. Run `./test-dynamic-options.sh` (diagnostics)
3. Review Vercel logs for error messages
4. Check Upstash Redis for cached data

---

**Last Updated:** 2026-05-07  
**Status:** ✅ Ready for Production
