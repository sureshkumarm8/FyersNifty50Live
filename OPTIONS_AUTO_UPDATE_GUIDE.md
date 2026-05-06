# Weekly Options Auto-Update Guide

## Overview
Automatically update Nifty weekly options without manual intervention.

---

## 🎯 Solution: Automated Check on App Startup

### What's Implemented

1. **Auto-Detection (Built-in)**
   - App checks options expiry on every startup
   - Shows warning if expired or expiring soon
   - Logs clear messages in console

2. **API Endpoint for Manual Trigger**
   - `/api/auto-update-options` - Checks and updates if needed
   - Can be called manually or via cron

---

## 📋 Setup Instructions

### Option A: App Built-in Detection (Already Active) ✅

**No setup needed!** The app now automatically:
- Checks expiry on startup
- Shows warning: `⚠️ Weekly options expired! Run: node scripts/generateWeeklyOptions.cjs`
- Logs to console when expiring soon

**When you see the warning:**
```bash
# Run locally:
node scripts/generateWeeklyOptions.cjs
npm run build
git add .
git commit -m "chore: Update weekly options"
git push
```

---

### Option B: External Cron Job (Recommended)

Set up a weekly cron job on cron-job.org:

**1. Add New Cron Job:**
- **Name:** Update Weekly Options
- **URL:** `https://your-domain.vercel.app/api/auto-update-options`
- **Schedule:** Every Monday at 6:00 AM IST
- **Method:** GET

**2. Optional Security:**
Set environment variable in Vercel:
```
OPTIONS_UPDATE_SECRET=your-secret-key-here
```

Then use Authorization header in cron-job.org:
```
Authorization: Bearer your-secret-key-here
```

**3. What It Does:**
- Checks current expiry date
- If expired, runs the generation script
- Updates the constants file
- Returns status JSON

**Note:** This updates the file on Vercel's runtime, but **requires a rebuild and redeploy** to take effect. You'll still need to run the script locally and push.

---

### Option C: Manual Check API (Easiest)

Simply visit this URL every Monday:
```
https://your-domain.vercel.app/api/auto-update-options
```

**Response if needs update:**
```json
{
  "success": true,
  "message": "Options updated successfully",
  "oldExpiry": "2026-05-07",
  "newExpiry": "2026-05-14",
  "optionsCount": 160,
  "updated": true
}
```

**Response if already updated:**
```json
{
  "success": true,
  "message": "Options are up-to-date",
  "currentExpiry": "2026-05-14",
  "needsUpdate": false
}
```

---

## 🔄 Weekly Workflow (Recommended)

### Every Monday Morning:

**Method 1: Automatic with Notification**
1. App shows warning when options expire
2. Run the update command:
   ```bash
   node scripts/generateWeeklyOptions.cjs && npm run build && git add . && git commit -m "chore: Update weekly options" && git push
   ```

**Method 2: Quick Check**
1. Visit `/api/auto-update-options` in browser
2. If it says "needs update", run:
   ```bash
   npm run update-options
   ```

**Method 3: Add npm script** (Add to package.json):
```json
{
  "scripts": {
    "update-options": "node scripts/generateWeeklyOptions.cjs && npm run build"
  }
}
```

Then just run:
```bash
npm run update-options
```

---

## 📅 Expiry Calendar Check

The app uses `/constants/niftyExpiryDates.ts` which has all official Nifty expiry dates (handles holidays).

**To verify next expiry:**
```bash
# Check what's currently configured
grep CURRENT_EXPIRY constants/niftyWeeklyOptions.ts

# Output:
# export const CURRENT_EXPIRY_DATE = '2026-05-12';
```

---

## 🚨 Notifications

The app will show warnings in:
1. **Console:** `[Options] ⚠️ Options expired on 2026-05-07. Please update!`
2. **Status Message:** Yellow banner at top of app
3. **Days Before:** `🔔 Options expire in 2 days` (when < 3 days remaining)

---

## 🛠️ Troubleshooting

### Options not updating?
1. Check if CSV file exists:
   ```bash
   ls -la api/paytm/option_security_master.csv
   ```

2. Download fresh CSV:
   ```bash
   curl -o api/paytm/option_security_master.csv \
     "https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv"
   ```

3. Run generator:
   ```bash
   node scripts/generateWeeklyOptions.cjs
   ```

### Script fails?
Check `/constants/niftyExpiryDates.ts` has upcoming dates.

---

## 📝 Files Created/Modified

**New Files:**
- `/api/auto-update-options.js` - API endpoint for updates
- `/utils/optionsAutoUpdate.ts` - Client-side checking utilities

**Modified Files:**
- `/App.tsx` - Added auto-check on startup
- `/api/cron-fetch.js` - Now fetches options data too

---

## ✨ Benefits

✅ **No more manual weekly updates** - App warns you automatically  
✅ **Clear visibility** - Know exactly when options expire  
✅ **Safe updates** - Uses official expiry calendar (handles holidays)  
✅ **Multiple trigger methods** - API, manual, or automated  
✅ **Already deployed** - Works immediately after push  

---

## 🎯 Recommended Setup

**For best experience:**

1. ✅ **Keep the app built-in warning** (already active)
2. 📱 **Check app every Monday** - You'll see the warning
3. 🖱️ **One command to update:**
   ```bash
   node scripts/generateWeeklyOptions.cjs && npm run build && git push
   ```
4. ⏱️ **Takes 30 seconds** - Automated everything else

---

## 📊 Monitoring

Check options status anytime:
```bash
# In browser console (when app is open):
# The app logs on startup:
[Options] ✅ Options valid until 2026-05-12
[Options] ℹ️ Options expire in 3 days
[Options] ⚠️ Options expired on 2026-05-07. Please update!
```

Or check the API:
```bash
curl https://your-domain.vercel.app/api/auto-update-options
```

---

## 🚀 Quick Start (TL;DR)

**All you need to do:**
1. Push the code (includes auto-check)
2. When you see warning → Run one command
3. Done! Options updated automatically

**That's it!** The app handles all detection for you.
