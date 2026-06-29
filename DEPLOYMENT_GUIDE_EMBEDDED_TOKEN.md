# 🚀 Deployment Guide - Embedded Token Generator

## Current Status: ✅ READY FOR PRODUCTION

All code is committed and ready to deploy.

---

## 📋 Pre-Deployment Checklist

- [ ] Redis credentials configured in Vercel
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- [ ] Live-quotes-data app deployed and accessible
- [ ] FyersNifty50Live app builds without errors
- [ ] No console errors on local dev
- [ ] Modal opens and closes properly
- [ ] OTP flow works end-to-end

---

## 🚀 Deployment Steps

### **Step 1: Deploy FyersNifty50Live to Vercel**

```bash
cd /Users/SureshKumar.M/Documents/Suresh/AITools/FyersNifty50Live

# Make sure branch is clean
git status

# Push to GitHub (auto-deploys to Vercel)
git push origin paytm-token-auto-refresh

# Or deploy directly via CLI
vercel --prod
```

**Expected Time:** 2-3 minutes

**Verification:**
```bash
# Check build status
vercel ls

# Check function logs
vercel logs api/save-paytm-token-direct.js
```

---

### **Step 2: Deploy live-quotes-data to Vercel**

```bash
cd /Users/SureshKumar.M/Documents/Suresh/Stock/liveQuotesData

# Push updates
git push origin paytm-token-push-feature

# Or deploy directly
vercel --prod
```

**Expected Time:** 2-3 minutes

---

### **Step 3: Verify Deployment**

```bash
# Test FyersNifty50Live
https://your-nifty50-app.vercel.app/

# Test live-quotes-data
https://live-quotes-data.vercel.app/?embedded=true

# Check API endpoint
curl https://your-nifty50-app.vercel.app/api/save-paytm-token-direct \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"test.token.value"}'
```

---

## 🧪 Production Testing

### **Test Case 1: Generate & Save Token**
```
1. Go to https://your-nifty50-app.vercel.app
2. Settings → 💳 Paytm Money
3. Click [🚀 Generate AccessToken]
4. Complete OTP login
5. ✅ Should see success message
6. Check Redis: paytm:access_token should exist
```

### **Test Case 2: Token Persistence**
```
1. Refresh the page
2. Settings → 💳 Paytm Money
3. Token field should still have value (if using fallback)
4. Verify in Redis it's still there
```

### **Test Case 3: Error Handling**
```
1. Disable Redis temporarily
2. Try to generate token
3. Should show error message gracefully
4. Re-enable Redis and try again
```

### **Test Case 4: Mobile Experience**
```
1. Open on mobile device
2. Settings → Generate Token
3. OTP should work smoothly
4. Token should save successfully
5. Modal should auto-close
```

---

## 🔍 Monitoring & Debugging

### **Check Vercel Logs**
```bash
# FyersNifty50Live API logs
vercel logs api/save-paytm-token-direct.js

# Look for errors:
# - CORS issues
# - Redis connection errors
# - Invalid token format
```

### **Check Redis**
```bash
# Using Upstash dashboard:
1. Go to https://console.upstash.com
2. Select your Redis database
3. Search for key: paytm:access_token
4. Verify token is stored and has 24hr expiry
5. Check metadata: paytm:token_metadata
```

### **Browser DevTools**
```
Press F12 → Network Tab
Look for POST to /api/save-paytm-token-direct

Expected Response:
{
  "success": true,
  "message": "Token saved successfully",
  "expires_in": "24 hours",
  "timestamp": "2026-06-29T..."
}
```

---

## 🐛 Common Issues & Fixes

### **Issue: CORS Error on Token Save**
```
Error: "Access to XMLHttpRequest blocked by CORS policy"

Fix:
1. Verify CORS headers in api/save-paytm-token-direct.js
2. Check if endpoint is accessible: curl https://...
3. Restart deployment: vercel --prod --force
```

### **Issue: Token Not Posting from iframe**
```
Error: "postMessage failed" or no message received

Fix:
1. Check browser console for errors
2. Verify live-quotes-data is deployed
3. Check isEmbedded detection works: console.log(window.self !== window.top)
4. Verify origin verification in TokenGeneratorModal.tsx
```

### **Issue: Token Saves But Field Not Updated**
```
Error: Token field doesn't change after save

Fix:
1. Check if React state is updating
2. Verify onTokenSaved callback is called
3. Check no JavaScript errors in console
4. Restart browser
```

### **Issue: Redis Connection Failed**
```
Error: "Failed to connect to Redis"

Fix:
1. Check Redis credentials in Vercel env
2. Verify Upstash instance is running
3. Test with: curl UPSTASH_REDIS_REST_URL/get/test
4. Re-add credentials if needed
```

---

## 📊 Post-Deployment Checklist

- [ ] Settings button opens modal
- [ ] Modal displays embedded token generator
- [ ] OTP login works smoothly
- [ ] Token generates successfully
- [ ] Token saves to Redis (verify in Upstash)
- [ ] Success notification appears
- [ ] Modal auto-closes
- [ ] Token field auto-updates
- [ ] No browser console errors
- [ ] No Vercel function errors
- [ ] Works on mobile
- [ ] Works on desktop
- [ ] Fallback works if Redis fails

---

## 🎯 Performance Metrics

After deployment, track:

```
Token Generation Time: < 10 seconds
API Response Time: < 1 second
Modal Load Time: < 2 seconds
Success Rate: > 99%
Error Rate: < 1%
User Experience: Smooth & intuitive
```

---

## 📈 Rollback Plan

If issues occur:

```bash
# Revert to previous version
git revert HEAD

# Or reset to stable branch
git checkout main
git pull origin main
vercel --prod

# Clear browser cache
# Clear Redis cache (optional)
```

---

## 🔐 Security Checklist

- [ ] No credentials in code
- [ ] CORS properly configured
- [ ] Origin verification enabled
- [ ] Token stored securely in Redis
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info
- [ ] Rate limiting considered
- [ ] HTTPS only (Vercel default)

---

## 📞 Support & Escalation

### **If Something Breaks:**

1. **Check Logs First**
   ```bash
   vercel logs [function-name]
   ```

2. **Check Redis Connection**
   ```bash
   curl https://your-redis-url/ping
   ```

3. **Check Function Execution**
   ```bash
   # Test via curl
   curl -X POST https://your-app/api/save-paytm-token-direct \
     -H "Content-Type: application/json" \
     -d '{"accessToken":"test"}'
   ```

4. **Check Browser Console**
   - F12 → Console tab
   - Look for errors or warnings

5. **Contact Support**
   - Vercel Support: https://vercel.com/support
   - Upstash Support: https://upstash.com/docs/support

---

## ✅ Final Deployment Command

When ready to deploy to production:

```bash
# FyersNifty50Live
cd /Users/SureshKumar.M/Documents/Suresh/AITools/FyersNifty50Live
git push origin paytm-token-auto-refresh

# live-quotes-data  
cd /Users/SureshKumar.M/Documents/Suresh/Stock/liveQuotesData
git push origin paytm-token-push-feature

# Vercel will auto-build and deploy
# Check status: https://vercel.com/dashboard
```

---

## 🎉 Deployment Complete!

Once deployed:

✅ Settings → Generate Token works  
✅ Token auto-saves to Redis  
✅ Modal opens smoothly  
✅ OTP works end-to-end  
✅ Users can trade immediately  

**Time to launch: < 5 minutes!** 🚀

---

**Next Phase (Optional):**
- Setup cron-job.org for daily auto-refresh
- Add Telegram bot integration
- Add GitHub Actions workflow

---

**Questions?** Check the other documentation files:
- EMBEDDED_TOKEN_GENERATOR_QUICKSTART.md
- IMPLEMENTATION_EMBEDDED_TOKEN_GENERATOR.md
- SEAMLESS_TOKEN_GENERATION_PROPOSAL.md
