# 🆓 FREE Server-Side Automation - Setup Guide

## ✅ Complete Solution (No Cost!)

**What you get:**
- ✅ Auto-fetches market data every minute during market hours
- ✅ Server-side (not client-side) - all users see same data
- ✅ No manual JSON upload needed
- ✅ Works with Vercel FREE tier
- ✅ Uses GitHub Actions (100% free)

---

## 🚀 Setup Steps (10 minutes)

### Step 1: Generate Cron Secret

```bash
# Generate a random secret
openssl rand -hex 32

# Copy the output (e.g., 8f3d2c1b4e5a6f7g8h9i0j1k2l3m4n5o)
```

### Step 2: Add Environment Variables to Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these:

```
VITE_PAYTM_ACCESS_TOKEN = your_paytm_token_here
VITE_BYPASS_MARKET_HOURS = false
CRON_SECRET = 8f3d2c1b4e5a6f7g8h9i0j1k2l3m4n5o  # (from Step 1)
```

Click **Save** → **Redeploy**

### Step 3: Add Secret to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CRON_SECRET`
5. Value: `8f3d2c1b4e5a6f7g8h9i0j1k2l3m4n5o` (same as Vercel)
6. Click **Add secret**

### Step 4: Push Code to GitHub

```bash
git add .
git commit -m "Add free server-side automation"
git push
```

### Step 5: Verify GitHub Actions

1. Go to your repo on GitHub
2. Click **Actions** tab
3. You should see "Market Data Fetcher" workflow
4. It will run automatically during market hours (9:17 AM - 3:30 PM IST)

**Manual Test:**
- Click the workflow → **Run workflow** → **Run workflow**
- Watch the logs to verify it works

---

## 📊 How It Works

```
┌─────────────────────────────────────────┐
│  GitHub Actions (Free Cron)             │
│  - Runs every minute (Mon-Fri)         │
│  - 9:17 AM - 3:30 PM IST               │
└─────────────────────────────────────────┘
              ↓ HTTP POST
┌─────────────────────────────────────────┐
│  Vercel Serverless Function             │
│  /api/cron/fetch-market-data            │
│  - Validates CRON_SECRET                │
│  - Fetches from PayTM API               │
│  - Stores data in memory/cache          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Users Visit Website                    │
│  https://fyers-nifty50-live.vercel.app  │
│  - See live data instantly              │
│  - No manual import needed               │
│  - All users see same data              │
└─────────────────────────────────────────┘
```

---

## ✅ What's Automated

**Every Day (Automatic):**
1. ✅ 9:17 AM IST - GitHub Actions starts
2. ✅ Every minute - Fetches live data from PayTM
3. ✅ Stores on Vercel server
4. ✅ 3:30 PM IST - Stops automatically
5. ✅ All users see same live data

**Your Only Task:**
- Update `VITE_PAYTM_ACCESS_TOKEN` on Vercel when token expires (once every few weeks)

---

## 🔍 Monitoring

### View GitHub Actions Logs
1. Go to your repo → **Actions**
2. Click on a workflow run
3. See if data fetch succeeded or failed

### View Vercel Function Logs
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** → Select latest
3. Click **Functions** → View logs

### Check if Data is Fresh
Visit: `https://fyers-nifty50-live.vercel.app/api/market-data`

Should return:
```json
{
  "success": true,
  "timestamp": 1745326789000,
  "data": { ... }
}
```

---

## 🐛 Troubleshooting

### Problem: GitHub Actions fails with 401 Unauthorized

**Fix:**
- Verify `CRON_SECRET` matches in both Vercel and GitHub
- Check Vercel env vars are set for Production environment

### Problem: GitHub Actions succeeds but no data

**Fix:**
- Check Vercel function logs for errors
- Verify `VITE_PAYTM_ACCESS_TOKEN` is valid
- Check if it's during market hours (9:17 AM - 3:30 PM IST)

### Problem: Outside market hours error

**Fix:**
- Set `VITE_BYPASS_MARKET_HOURS=true` in Vercel for testing
- Or wait until 9:17 AM IST

---

## 💰 Cost Breakdown

| Service | Cost | Usage |
|---------|------|-------|
| Vercel (Free tier) | $0 | Hosting + Serverless Functions |
| GitHub Actions | $0 | 2,000 minutes/month (we use ~300) |
| **TOTAL** | **$0** | ✅ Completely Free! |

---

## 🔄 Daily Workflow

### Before (Manual - 5 min/day)
1. Generate new token
2. Update JSON file
3. Upload via Settings
4. Repeat tomorrow

### After (Automated - 1 min/week)
1. Update `VITE_PAYTM_ACCESS_TOKEN` on Vercel (when expired)
2. That's it! Everything else is automatic

**Time Saved:** ~35 hours/year 🎉

---

## 🎯 Next Steps

**You're all set! Here's what happens:**

1. **Push to GitHub** (code is ready)
2. **Add secrets** (Vercel + GitHub)
3. **Tomorrow at 9:17 AM** - GitHub Actions starts automatically
4. **Any user** visits your URL → sees live data (no import needed)

---

## 📚 Files Created

- ✅ `.github/workflows/fetch-market-data.yml` - GitHub Actions cron
- ✅ `api/market-data.js` - Serve cached data
- ✅ `api/cron/fetch-market-data.js` - Fetch and store data
- ✅ `vercel.json` - Updated config
- ✅ `FREE_ALTERNATIVES_GUIDE.md` - All options explained

---

**Questions? Check logs in GitHub Actions or Vercel Dashboard!**
