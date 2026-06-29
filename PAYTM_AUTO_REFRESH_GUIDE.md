# Paytm Token Auto-Refresh Setup Guide

## 🎯 Problem Solved
**Before:** Manual token update daily on Vercel (painful!)  
**After:** Fully automated token refresh with zero manual intervention ✨

---

## 🚀 Quick Setup (One-time, 5 minutes)

### Step 1: Get Vercel API Token (Optional but Recommended)
```bash
# Go to: https://vercel.com/account/tokens
# Create new token with scope: "Read and Write"
# Add to Vercel project env variables:
# VERCEL_TOKEN=your_vercel_token_here
# VERCEL_PROJECT_ID=prj_xxxxx (from project settings)
```

### Step 2: Do Manual Login Once
```bash
# Open this URL in browser:
https://login.paytmmoney.com/merchant-login?apiKey=ebb89582a5214f3bbf93fa7f7866ce28

# After login, you'll be redirected to URL like:
# https://developer.paytmmoney.com/developer/v1/oauth/redirect?...requestToken=abc123...

# Copy the requestToken value from URL
```

### Step 3: Save Request Token (One-time)
```bash
curl -X POST https://your-app.vercel.app/api/save-request-token \
  -H "Content-Type: application/json" \
  -d '{"requestToken": "PASTE_TOKEN_HERE"}'

# Response: ✅ Request token saved successfully
```

### Step 4: Test Token Refresh
```bash
# Manually trigger first refresh
curl -X POST https://your-app.vercel.app/api/refresh-paytm-token \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Response: ✅ Paytm token refreshed successfully
```

### Step 5: Setup Automated Cron Job
```bash
# Go to: https://cron-job.org/en/
# Create new cron job:

URL: https://your-app.vercel.app/api/refresh-paytm-token
Schedule: Every day at 8:00 AM IST
Headers: Authorization: Bearer YOUR_CRON_SECRET
Method: GET

# Click "Create"
```

---

## 🔄 How It Works

```mermaid
┌─────────────────────────────────────────────────────────────┐
│                    Daily at 8 AM IST                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   cron-job.org triggers       │
         │   /api/refresh-paytm-token    │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  API fetches stored request   │
         │  token from Redis             │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Calls Paytm API to generate  │
         │  new access token             │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Stores new token in:         │
         │  1. Redis (24hr cache)        │
         │  2. Vercel Env (optional)     │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  App uses fresh token from    │
         │  /api/get-paytm-token         │
         └───────────────────────────────┘
```

---

## 📊 API Endpoints

### 1. `/api/save-request-token` (POST)
**Purpose:** One-time setup to store request token  
**Body:** `{ "requestToken": "..." }`  
**Call:** Once after manual login

### 2. `/api/refresh-paytm-token` (GET/POST)
**Purpose:** Auto-refresh access token  
**Headers:** `Authorization: Bearer YOUR_CRON_SECRET`  
**Call:** Automated daily via cron-job.org

### 3. `/api/get-paytm-token` (GET)
**Purpose:** Get current valid token for your app  
**Returns:** `{ "token": "...", "source": "redis_auto_refresh" }`  
**Call:** From your app whenever needed

---

## 🔧 Update Your App Code

### Option A: Update cron-fetch.js (Recommended)
```javascript
// Replace line 191 in api/cron-fetch.js:
// OLD:
const paytmToken = process.env.PAYTM_ACCESS_TOKEN;

// NEW:
let paytmToken = process.env.PAYTM_ACCESS_TOKEN;

// Try to get auto-refreshed token from Redis first
try {
  const tokenResponse = await fetch(`${process.env.VERCEL_URL}/api/get-paytm-token`);
  if (tokenResponse.ok) {
    const tokenData = await tokenResponse.json();
    if (tokenData.success && tokenData.token) {
      paytmToken = tokenData.token;
      console.log(`[Cron] Using auto-refreshed token from ${tokenData.source}`);
    }
  }
} catch (err) {
  console.log('[Cron] Using fallback token from env:', err.message);
}
```

### Option B: Direct Redis Access (Faster)
```javascript
// At top of cron-fetch.js, add:
const cachedToken = await redis.get('paytm:access_token');
const paytmToken = cachedToken || process.env.PAYTM_ACCESS_TOKEN;
```

---

## ✅ Verification

### Check Token Status
```bash
curl https://your-app.vercel.app/api/get-paytm-token

# Expected response:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1Q...",
  "source": "redis_auto_refresh",
  "note": "Token is auto-refreshed daily"
}
```

### Monitor Cron Execution
```bash
# Check cron-job.org dashboard for execution history
# Should show: ✅ 200 OK every day at 8 AM
```

### Test Token Validity
```bash
TOKEN=$(curl -s https://your-app.vercel.app/api/get-paytm-token | jq -r .token)

curl "https://developer.paytmmoney.com/data/v1/price/live?mode=LTP&pref=NSE:13:INDEX" \
  -H "x-jwt-token: $TOKEN"

# Should return Nifty 50 live data
```

---

## 🎁 Benefits

✅ **Zero Manual Work:** Never update Vercel env variables again  
✅ **Always Fresh:** Token refreshes daily automatically  
✅ **Fault Tolerant:** Falls back to env variable if auto-refresh fails  
✅ **Secure:** Request token stored in Redis, not in code  
✅ **Fast:** Token cached in Redis for instant access  
✅ **Cost-Free:** Uses free tier of cron-job.org  

---

## 🔐 Security Notes

- **Request Token:** Stored in Redis (encrypted at rest)
- **Access Token:** Refreshed daily, expires in 24 hours
- **Cron Secret:** Prevents unauthorized token refresh
- **No Credentials in Code:** All secrets in environment variables

---

## 🐛 Troubleshooting

### "No request token found"
**Fix:** Complete Step 2 & 3 (manual login + save token)

### "Paytm session API failed"
**Fix:** Request token might be expired. Redo manual login (Step 2)

### "Token not found in Redis"
**Fix:** Run manual refresh once: `curl .../api/refresh-paytm-token`

### "Cron job failing"
**Fix:** Check Authorization header has correct CRON_SECRET

---

## 🚨 Fallback Plan

If auto-refresh fails, app automatically falls back to manual token from:
1. Redis cache (if available)
2. `PAYTM_ACCESS_TOKEN` env variable (your current setup)

So you're never blocked! 🎉

---

## 📞 Alternative Solutions

### Option 2: GitHub Actions (Simpler)
If you don't want external cron service:

```yaml
# .github/workflows/refresh-token.yml
name: Refresh Paytm Token
on:
  schedule:
    - cron: '30 2 * * *'  # 8 AM IST = 2:30 AM UTC
  workflow_dispatch:

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Refresh Token
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/refresh-paytm-token \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 3: Vercel Cron (Easiest)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/refresh-paytm-token",
    "schedule": "0 2 * * *"
  }]
}
```
⚠️ Requires Vercel Pro plan ($20/month)

---

**Last Updated:** 2026-06-29  
**Status:** ✅ Production Ready  
**Maintenance:** Zero manual work required!
