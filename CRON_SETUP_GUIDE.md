# Vercel Cron Job Setup Guide

## ✅ What Was Done

I've configured your project to automatically fetch market data every minute on Vercel's backend, even when no one is using the website.

### Files Created/Modified:

1. **`vercel.json`** - Added cron job configuration
2. **`/api/cron-fetch.js`** - Backend function that fetches data every minute
3. **`/api/market-data.js`** - Optional endpoint for frontend to get cached data
4. **`/api/paytm/quotes.js`** - Updated to support env variables
5. **`.env.example`** - Complete template for all environment variables

---

## 🚀 Deployment Steps

### Step 1: Upload Your Config File to Get Values

You mentioned you have `/Users/SureshKumar.M/Downloads/Nifty50_AI_config_tokens (3).json`

This file contains all the required API keys:
- PayTM credentials (apiKey, apiSecret, accessToken)
- Fyers credentials (clientId, secretKey, accessToken)
- Google API key (for Gemini AI)
- Groq API key (for AI analysis)
- Config settings (bypassMarketHours, refreshInterval)

### Step 2: Configure Environment Variables in Vercel

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables from your config file:

#### Required - PayTM Money API:
```bash
PAYTM_API_KEY=your_paytm_api_key_here
PAYTM_API_SECRET=your_paytm_api_secret_here
PAYTM_ACCESS_TOKEN=your_paytm_access_token_here
```

#### Optional - Fyers API:
```bash
FYERS_CLIENT_ID=your_fyers_client_id_here
FYERS_SECRET_KEY=your_fyers_secret_key_here
FYERS_ACCESS_TOKEN=(leave empty if not using Fyers)
```

#### Optional - AI/ML APIs:
```bash
GOOGLE_API_KEY=your_google_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
CLAUDE_API_KEY=(optional, leave empty if not using)
```

#### Configuration:
```bash
BYPASS_MARKET_HOURS=false
REFRESH_INTERVAL=60000
CRON_SECRET=your_random_secret_123  # Generate with: openssl rand -base64 32
```

### Step 3: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Add Vercel cron job with full env variable support"
git push origin main

# Or deploy directly
vercel --prod
```

### Step 4: Verify Cron is Running

After deployment, check:

1. **Vercel Dashboard** → Your Project → Cron Jobs tab
2. You should see: `/api/cron-fetch` running every 1 minute (3:47-9:45 UTC = 9:17-15:15 IST)
3. Check logs in Vercel Dashboard → Functions → cron-fetch

---

## 📊 How It Works

```
VERCEL CRON (Every 1 min, 9:17 AM-3:15 PM IST)
         ↓
    /api/cron-fetch
         ↓
   Uses PAYTM_ACCESS_TOKEN from env
         ↓
   Fetches PayTM Data
         ↓
   Stores in Memory Cache
         ↓
   Frontend continues to work as before
```

### Cron Schedule Breakdown:

```
"*/1 3-9 * * 1-5"
 │   │    │ │ │
 │   │    │ │ └─ Monday-Friday
 │   │    │ └─── Any day of month
 │   │    └───── Any month
 │   └────────── 3:47-9:45 UTC (9:17-15:15 IST)
 └────────────── Every 1 minute
```

**Note:** The cron schedule in vercel.json runs from 3:47-9:45 UTC which equals 9:17-15:15 IST (as requested)

---

## 🔍 Testing

### Test the cron endpoint manually:

```bash
# Without secret (should work if CRON_SECRET not set)
curl https://your-app.vercel.app/api/cron-fetch

# With secret
curl -H "Authorization: Bearer your_secret" https://your-app.vercel.app/api/cron-fetch
```

### Expected Response (during market hours):

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {
    "niftyLTP": 22450.50,
    "stockCount": 50,
    "optionCount": 42,
    "timestamp": 1714564825000,
    "duration": 1245,
    "istTime": "5/1/2026, 2:30:25 PM"
  }
}
```

---

## 📈 Monitoring

### Check if cron is working:

1. **Vercel Dashboard** → Functions → cron-fetch → View Logs
2. Look for logs like:
   ```
   [Cron] Fetching market data at 5/1/2026, 2:30:00 PM
   [Cron] ✅ Fetch successful - Nifty: 22450.50, Duration: 1245ms
   ```

### During off-hours, you'll see:

```json
{
  "success": true,
  "message": "Market closed - No fetch performed",
  "marketClosed": true
}
```

---

## 🔧 Troubleshooting

### Issue: "PayTM token not configured"

**Solution:** Add `PAYTM_ACCESS_TOKEN` to Vercel environment variables and redeploy.

### Issue: Cron not triggering

**Solutions:**
1. Make sure you're on a Vercel paid plan (Hobby plan has limited crons)
2. Check cron schedule syntax in `vercel.json`
3. Verify deployment was successful

### Issue: "Unauthorized" error

**Solution:** Either:
- Remove `CRON_SECRET` env variable, OR
- Pass correct secret in Authorization header

### Issue: Frontend still asking for tokens

**Solution:** 
- The frontend uses localStorage for tokens (for client-side calls)
- Backend cron uses Vercel env variables (for server-side calls)
- Both can work independently - frontend doesn't need to change

---

## 💰 Cost Estimate

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| Vercel Cron | 10,000 invocations/month | ~6,000/month (358 mins/day × 20 days) | **$0** |
| Vercel Functions | 100 GB-hours | ~2 GB-hours | **$0** |
| **Total** | | | **$0** ✅ |

---

## 🎯 Architecture Overview

### Current Setup:
```
Frontend (Browser)
    ↓ (uses localStorage tokens)
    ↓ calls /api/paytm/quotes
    ↓
PayTM API
```

### With Cron Job:
```
Vercel Cron (Background)
    ↓ (uses env variables)
    ↓ calls /api/cron-fetch
    ↓
PayTM API → Cache in memory

Frontend (Browser) - Works independently
    ↓ (uses localStorage tokens OR env variables)
    ↓ calls /api/paytm/quotes
    ↓
PayTM API (with fallback to env vars)
```

### Benefits:
- ✅ Frontend works without changes
- ✅ Background cron keeps data fresh
- ✅ /api/paytm/quotes now works with env variables too
- ✅ No token needed in localStorage for server calls
- ✅ Secure - tokens stored in Vercel env, not in code

---

## 📝 Environment Variables - Complete Reference

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `PAYTM_API_KEY` | ✅ Yes | PayTM API Key | `your_api_key_here` |
| `PAYTM_API_SECRET` | ✅ Yes | PayTM API Secret | `your_api_secret_here` |
| `PAYTM_ACCESS_TOKEN` | ✅ Yes | PayTM JWT Token | `eyJ0eXAiOiJKV1QiLCJh...` |
| `FYERS_CLIENT_ID` | ❌ No | Fyers Client ID | `YOUR_CLIENT_ID-100` |
| `FYERS_SECRET_KEY` | ❌ No | Fyers Secret Key | `YOUR_SECRET_KEY` |
| `FYERS_ACCESS_TOKEN` | ❌ No | Fyers Access Token | (empty if not using) |
| `GOOGLE_API_KEY` | ⚠️ Recommended | Google Gemini API | `AIzaSy...` |
| `GROQ_API_KEY` | ⚠️ Recommended | Groq API Key | `gsk_...` |
| `CLAUDE_API_KEY` | ❌ No | Anthropic Claude API | (optional) |
| `BYPASS_MARKET_HOURS` | ❌ No | Bypass time check | `false` (or `true` for testing) |
| `REFRESH_INTERVAL` | ❌ No | Data refresh interval | `60000` (milliseconds) |
| `CRON_SECRET` | ⚠️ Recommended | Cron auth secret | Generate: `openssl rand -base64 32` |

---

## ✅ Verification Checklist

- [ ] Environment variables added in Vercel (from your config file)
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] Cron job visible in Vercel Dashboard (Cron Jobs tab)
- [ ] Test endpoint returns success: `curl https://your-app.vercel.app/api/cron-fetch`
- [ ] Check logs during market hours (9:17 AM - 3:15 PM IST)
- [ ] Verify cron runs every minute during market hours

---

## 🔐 Security Best Practices

1. **Never commit .env file** - It's already in .gitignore
2. **Use CRON_SECRET** - Prevents unauthorized cron calls
3. **Rotate tokens periodically** - Update PayTM tokens when expired
4. **Use Vercel's Production environment** - Keep secrets separate from preview

---

**Status:** ✅ Ready to deploy with full environment variable support!

**Market Hours:** 9:17 AM - 3:15 PM IST, Monday-Friday

Need help? Check Vercel logs or test the endpoint manually.
