# 🚀 Quick Setup Guide - Environment Variables for Vercel

## ✅ What Changed

Your project now supports **environment variables on Vercel** for all API keys and configuration. No need to paste tokens in the frontend anymore!

## 📦 Updated Files

1. **`/api/cron-fetch.js`** - Added `BYPASS_MARKET_HOURS` support
2. **`/api/paytm/quotes.js`** - Now uses `PAYTM_ACCESS_TOKEN` from env if available
3. **`/api/market-data.js`** - Added Google and Groq API key support
4. **`.env.example`** - Complete template with all variables
5. **`CRON_SETUP_GUIDE.md`** - Updated with full instructions
6. **`scripts/setup-vercel-env.sh`** - Auto-upload script

---

## 🎯 Quick Start (3 Steps)

### Option A: Manual Setup (Vercel Dashboard)

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project → Settings → Environment Variables

2. **Add These Variables** (from your config file):

   ```bash
   PAYTM_API_KEY=your_paytm_api_key_here
   PAYTM_API_SECRET=your_paytm_api_secret_here
   PAYTM_ACCESS_TOKEN=your_paytm_access_token_here
   
   FYERS_CLIENT_ID=your_fyers_client_id_here
   FYERS_SECRET_KEY=your_fyers_secret_key_here
   
   GOOGLE_API_KEY=your_google_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   
   BYPASS_MARKET_HOURS=false
   REFRESH_INTERVAL=60000
   CRON_SECRET=(generate with: openssl rand -base64 32)
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Add env variable support"
   git push origin main
   ```

### Option B: Automatic Setup (CLI Script)

```bash
# Make sure you have vercel CLI installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run the setup script
./scripts/setup-vercel-env.sh
```

The script will:
- ✅ Read your config file
- ✅ Extract all API keys
- ✅ Generate a secure CRON_SECRET
- ✅ Upload everything to Vercel
- ✅ Save time!

---

## 📊 Environment Variables Reference

| Variable | Source | Required | Used By |
|----------|--------|----------|---------|
| `PAYTM_API_KEY` | config.paytm.apiKey | ✅ Yes | Backend API |
| `PAYTM_API_SECRET` | config.paytm.apiSecret | ✅ Yes | Backend API |
| `PAYTM_ACCESS_TOKEN` | config.paytm.accessToken | ✅ Yes | Cron, Backend |
| `FYERS_CLIENT_ID` | config.fyers.clientId | ❌ No | Fyers API |
| `FYERS_SECRET_KEY` | config.fyers.secretKey | ❌ No | Fyers API |
| `GOOGLE_API_KEY` | config.google.apiKey | ⚠️ Rec | AI Features |
| `GROQ_API_KEY` | config.groq.apiKey | ⚠️ Rec | AI Features |
| `BYPASS_MARKET_HOURS` | config.config.bypassMarketHours | ❌ No | Testing |
| `REFRESH_INTERVAL` | config.config.refreshInterval | ❌ No | Frontend |
| `CRON_SECRET` | Generate new | ⚠️ Rec | Security |

---

## 🔍 How It Works Now

### Before (Manual):
```
Frontend → localStorage → PayTM API
         ↓
   User pastes tokens manually
```

### After (Automated):
```
Vercel Env Variables (secure, server-side)
         ↓
Backend Cron Job → PayTM API (auto-fetch)
         ↓
Frontend → Can still use localStorage OR env vars
```

### Benefits:
- ✅ **Secure**: Tokens stored on server, not in browser
- ✅ **Automatic**: Cron fetches data every minute
- ✅ **Flexible**: Frontend still works with localStorage
- ✅ **Easy**: One-time setup, works forever

---

## 🎯 Testing

### 1. Test Cron Endpoint
```bash
curl https://your-app.vercel.app/api/cron-fetch
```

Expected: `{"success": true, "message": "Data fetched successfully", ...}`

### 2. Test Market Data
```bash
curl https://your-app.vercel.app/api/market-data?refresh=true
```

Expected: Stock data with Nifty LTP

### 3. Check Vercel Logs
- Vercel Dashboard → Functions → cron-fetch
- Look for: `[Cron] ✅ Fetch successful`

---

## 🕐 Cron Schedule

- **Time**: 9:17 AM - 3:15 PM IST (Mon-Fri)
- **Frequency**: Every 1 minute
- **Total**: ~358 invocations/day × 20 trading days = ~7,160/month
- **Cost**: $0 (within free tier of 10,000/month)

---

## 🔧 Troubleshooting

### Issue: "PayTM token not configured"
**Fix**: Add `PAYTM_ACCESS_TOKEN` to Vercel env and redeploy

### Issue: Cron not running
**Fix**: Check Vercel Dashboard → Cron Jobs tab, ensure schedule is correct

### Issue: Frontend still asks for tokens
**Fix**: This is normal! Frontend uses localStorage for client-side calls. Backend uses env vars for server-side calls. Both work independently.

### Issue: Tokens expired
**Fix**: Update `PAYTM_ACCESS_TOKEN` in Vercel env variables

---

## 📖 Full Documentation

- **Detailed Guide**: See `CRON_SETUP_GUIDE.md`
- **Environment Template**: See `.env.example`
- **Auto-upload Script**: Run `./scripts/setup-vercel-env.sh`

---

## ✅ Deployment Checklist

- [ ] Copy values from `Nifty50_AI_config_tokens (3).json`
- [ ] Add all env variables to Vercel Dashboard
- [ ] Generate and save `CRON_SECRET`
- [ ] Commit changes to git
- [ ] Push to GitHub/Deploy to Vercel
- [ ] Verify cron job is running in Vercel Dashboard
- [ ] Test endpoints during market hours
- [ ] Check logs for successful fetches

---

## 🎉 You're Done!

Your app will now:
- ✅ Auto-fetch data every minute during market hours
- ✅ Use secure environment variables
- ✅ Work even when no one is using it
- ✅ Cost $0 on Vercel free tier

**Next**: Just push your code and watch it work! 🚀

---

## 📞 Need Help?

1. Check `CRON_SETUP_GUIDE.md` for detailed instructions
2. View Vercel logs: Dashboard → Functions → cron-fetch
3. Test manually: `curl https://your-app.vercel.app/api/cron-fetch`
