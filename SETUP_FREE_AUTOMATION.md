# 🆓 FREE Server-Side Automation (GitHub Actions)

## ✅ Solution: GitHub Actions Cron (100% Free, No Vercel Cron Needed)

**Why this works:**
- ❌ Vercel Free tier: Limited to 1 cron/day
- ✅ GitHub Actions: FREE unlimited cron jobs (2,000 minutes/month)
- ✅ GitHub calls Vercel API every minute
- ✅ Works with Vercel FREE tier (no paid plan needed)

---

## 🚀 Setup (5 minutes)

### Step 1: Generate Cron Secret

```bash
openssl rand -hex 32
# Example output: a3f5d8c2e1b4f7g9h2j5k8m1n4p7q0r3
```

### Step 2: Add Environment Variables to Vercel

https://vercel.com/dashboard → Your Project → Settings → Environment Variables

```
VITE_PAYTM_ACCESS_TOKEN = your_paytm_token_here
VITE_PAYTM_API_KEY = your_paytm_api_key
VITE_PAYTM_API_SECRET = your_paytm_secret
CRON_SECRET = a3f5d8c2e1b4f7g9h2j5k8m1n4p7q0r3
VITE_BYPASS_MARKET_HOURS = false
```

**Important:** Select **Production** environment, then click **Save** → **Redeploy**

### Step 3: Add Secret to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CRON_SECRET`
5. Value: `a3f5d8c2e1b4f7g9h2j5k8m1n4p7q0r3` (same as Vercel)
6. Click **Add secret**

### Step 4: Deploy to GitHub

```bash
git add .
git commit -m "Add GitHub Actions cron automation"
git push
```

### Step 5: Enable & Test Workflow

1. Go to GitHub → Your repo → **Actions** tab
2. Click **"I understand my workflows, go ahead and enable them"** (if needed)
3. Click **Market Data Fetcher** workflow
4. Click **Run workflow** → **Run workflow** (manual test)
5. Wait 10 seconds, refresh page
6. Check if run succeeded ✅

---

## 📊 Architecture

```
┌──────────────────────────────────────────┐
│   GitHub Actions (FREE Cron)            │
│   - Runs every 1 minute                 │
│   - Mon-Fri, 9:17 AM - 3:30 PM IST     │
│   - NO COST (2,000 min/month free)     │
└──────────────────────────────────────────┘
              ↓ POST request
┌──────────────────────────────────────────┐
│   Vercel Serverless Function            │
│   /api/cron/fetch-market-data           │
│   - Validates CRON_SECRET               │
│   - Fetches PayTM API                   │
│   - Caches data in memory               │
└──────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────┐
│   Users Visit Website                   │
│   https://fyers-nifty50-live.vercel.app│
│   - Frontend calls /api/market-data    │
│   - Gets cached server-side data        │
│   - NO manual import needed!            │
└──────────────────────────────────────────┘
```

---

## ✅ What Happens Automatically

**Every Market Day:**

**9:15 AM IST:**
- GitHub Actions workflow wakes up

**9:17 AM - 3:30 PM IST:**
- Every 1 minute: GitHub calls Vercel API
- Vercel fetches fresh data from PayTM
- Data cached on server
- All users see same live data

**3:30 PM IST:**
- GitHub Actions stops automatically

**Your Only Task:**
- Update `VITE_PAYTM_ACCESS_TOKEN` on Vercel when expired (weekly/monthly)

---

## 🔍 Verify It's Working

### 1. Check GitHub Actions
- Go to repo → **Actions** tab
- See green checkmarks ✅ for successful runs
- Click on a run to see detailed logs

### 2. Check Vercel Function Logs
- Vercel Dashboard → Your Project → Deployments
- Click latest deployment → **Functions** tab
- See `/api/cron/fetch-market-data` logs

### 3. Test API Endpoint
Visit: `https://fyers-nifty50-live.vercel.app/api/market-data`

Should show:
```json
{
  "success": true,
  "cached": true,
  "timestamp": 1745432156000,
  "data": { ... }
}
```

---

## 🐛 Troubleshooting

### Problem: GitHub Actions fails with 401 Unauthorized

**Fix:**
```bash
# Verify secrets match
# GitHub: Settings → Secrets → Actions → CRON_SECRET
# Vercel: Settings → Environment Variables → CRON_SECRET
# They MUST be identical
```

### Problem: GitHub Actions succeeds but returns "skipped"

**Fix:**
- Set `VITE_BYPASS_MARKET_HOURS=true` in Vercel (for testing)
- Or wait until 9:17 AM IST on a weekday

### Problem: No data in frontend

**Fix:**
1. Check if cron is running: GitHub → Actions
2. Check API response: Visit `/api/market-data` directly
3. Check browser console for errors
4. Verify Vercel env vars are in **Production** environment

---

## 💰 Cost Breakdown

| Service | Plan | Cost | Usage |
|---------|------|------|-------|
| Vercel | Free | $0 | Hosting + Serverless Functions |
| GitHub Actions | Free | $0 | 2,000 minutes/month (we use ~300) |
| PayTM API | Free | $0 | Market data |
| **TOTAL** | | **$0/month** | ✅ Completely Free! |

**No Vercel Pro needed!**

---

## 📈 GitHub Actions Usage

**Calculation:**
- Market hours: 6 hours/day (9:17 AM - 3:30 PM)
- Frequency: 1 run/minute = 60 runs/hour
- Daily: 360 runs × ~1 second = 6 minutes/day
- Monthly: 6 min × ~22 trading days = **~132 minutes/month**

**Your free tier:** 2,000 minutes/month  
**You'll use:** ~132 minutes/month  
**Remaining:** 1,868 minutes for other workflows ✅

---

## 🔄 Daily Workflow Comparison

### Before (Manual)
```
Every morning:
1. Generate new PayTM token (5 min)
2. Update local JSON file (1 min)
3. Upload via Settings screen (1 min)
4. Refresh browser (1 min)
= 8 minutes/day × 22 days = 176 min/month
```

### After (Automated)
```
Once per week:
1. Update VITE_PAYTM_ACCESS_TOKEN on Vercel (2 min)
= 2 minutes/week × 4 = 8 min/month
```

**Time saved:** 168 minutes/month = **2.8 hours/month** 🎉

---

## 🎯 Next Steps

**You're ready to go!**

1. ✅ GitHub Actions workflow created
2. ✅ Vercel serverless functions ready
3. ✅ Just add secrets and push!

**Tomorrow at 9:17 AM IST:**
- GitHub Actions will automatically start
- Data will be fetched every minute
- All users will see live data
- No manual work required!

---

## 📚 Files You Have

- ✅ `.github/workflows/fetch-market-data.yml` - GitHub Actions cron
- ✅ `api/cron/fetch-market-data.js` - Data fetcher (called by GitHub)
- ✅ `api/market-data.js` - API endpoint (called by frontend)
- ✅ `utils/configLoader.ts` - Env var loader
- ✅ `.env.local` - Local development
- ✅ This guide!

---

## 🎓 How to Update Token (Weekly)

```bash
# Option 1: Vercel Dashboard (2 clicks)
# 1. Vercel → Settings → Env Variables
# 2. Edit VITE_PAYTM_ACCESS_TOKEN → Save → Redeploy

# Option 2: Vercel CLI (1 command)
vercel env rm VITE_PAYTM_ACCESS_TOKEN production
echo 'new_token' | vercel env add VITE_PAYTM_ACCESS_TOKEN production
vercel --prod

# Option 3: Use the script we created
./update-token.sh paytm "new_token_here"
```

---

**🚀 Push to GitHub and you're done!**
