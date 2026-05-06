# 🚀 Quick Start - Test Locally with Production Data

## ✅ The Easy Way (One Command!)

```bash
npm run dev

# Opens: http://localhost:5173
```

**That's it!** Your local app now uses Redis data from production.

---

## What Happens Behind the Scenes

1. Backend server (port 5001) proxies Redis calls
2. Frontend (port 5173) loads from backend
3. Data comes from your Upstash Redis
4. **No PayTM token needed locally!**

---

## 📋 What You'll See

### Terminal Output:
```
✅ Loaded environment from .env.local
🚀 Starting dev server with Redis support
   Data will be fetched from: Upstash Redis

[Redis Proxy] ✅ Loaded snapshot - Stocks: 48, Options: 80
```

### Browser Console (F12):
```
✅ [PayTM Redis] ✅ Loaded 48 stocks, 80 options
✅ [Options] ✅ Options valid until 2026-05-12
```

### UI:
- **Stocks Tab:** 48 stocks with correct names
- **Options Tab:** 80+ contracts

---

## 🎯 This Works EXACTLY Like Production

- ✅ Uses Upstash Redis (your production data)
- ✅ Shows all 48 stocks + options
- ✅ Fast load times (cached data)
- ✅ No API keys needed locally

---

## Deploy to Production

Once you've tested:

```bash
git add .
git commit -m "fix: Complete Nifty50 + options + auto-updates"
git push
```

Done! Vercel auto-deploys in 2 minutes 🚀

---

## 🛠️ Troubleshooting

### "No data in Redis"
```bash
# Trigger the Vercel cron to populate Redis
curl https://fyers-nifty50-live.vercel.app/api/cron-fetch

# Then restart: npm run dev
```

### "Redis credentials not configured"
```bash
# Make sure .env.local has:
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=gQAAA...
```

---

See [COMPLETE_FIX_SUMMARY.md](./COMPLETE_FIX_SUMMARY.md) for full details.
