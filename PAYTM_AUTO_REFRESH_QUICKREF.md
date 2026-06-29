# Paytm Token Auto-Refresh - Quick Reference

## 🎯 The Problem
Manually updating `PAYTM_ACCESS_TOKEN` on Vercel every day is painful!

## ✅ The Solution
**3 new API endpoints** that automate everything:

### Setup (One-time)
```bash
# 1. Login to Paytm and get request token
open "https://login.paytmmoney.com/merchant-login?apiKey=ebb89582a5214f3bbf93fa7f7866ce28"
# Copy requestToken from redirected URL

# 2. Save request token
curl -X POST https://your-app.vercel.app/api/save-request-token \
  -H "Content-Type: application/json" \
  -d '{"requestToken": "YOUR_REQUEST_TOKEN"}'

# 3. Test refresh
curl -X POST https://your-app.vercel.app/api/refresh-paytm-token \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 4. Setup cron at cron-job.org
URL: https://your-app.vercel.app/api/refresh-paytm-token
Schedule: Daily at 8 AM IST
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

### Daily (Automated)
- Cron-job.org calls `/api/refresh-paytm-token` at 8 AM
- Token refreshed and stored in Redis
- Your app uses fresh token automatically

### How Your App Gets Token
```javascript
// Before (manual):
const token = process.env.PAYTM_ACCESS_TOKEN;

// After (automatic):
let token = await redis.get('paytm:access_token');
if (!token) token = process.env.PAYTM_ACCESS_TOKEN; // fallback
```

## 📁 Files Created
- `api/refresh-paytm-token.js` - Auto-refresh endpoint (called by cron)
- `api/save-request-token.js` - One-time setup endpoint
- `api/get-paytm-token.js` - Get current valid token
- `PAYTM_AUTO_REFRESH_GUIDE.md` - Complete setup guide

## 📁 Files Updated
- `api/cron-fetch.js` - Now uses auto-refreshed token
- `api/discover-options.js` - Now uses auto-refreshed token
- `api/get-config.js` - Now uses auto-refreshed token

## 🎁 Benefits
✅ Zero manual work after setup  
✅ Token always fresh (24hr validity)  
✅ Fallback to env variable if auto-refresh fails  
✅ Secure (request token in Redis, not code)  
✅ Free (uses cron-job.org free tier)  

## 🧪 Test Locally
```bash
./test-paytm-auto-refresh.sh http://localhost:3000
```

## 🚀 Deploy
```bash
git add .
git commit -m "Add Paytm token auto-refresh"
git push
vercel --prod
```

## 📖 Full Guide
See `PAYTM_AUTO_REFRESH_GUIDE.md` for complete setup instructions.

## 🔄 Alternative Options
1. **GitHub Actions** - No external service needed
2. **Vercel Cron** - Requires Pro plan ($20/month)
3. **Current solution** - Free tier cron-job.org ✅

---

**Status:** ✅ Production Ready  
**Maintenance:** Zero after setup!
