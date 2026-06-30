# 🚀 Implementation Roadmap: Auto Token Refresh

## Phase 1: Verify Current Setup ✅

### 1.1 Kill Stuck Processes
```bash
lsof -i :5001 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
lsof -i :5174 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 2
echo "✅ All ports cleared"
```

### 1.2 Clean Cache
```bash
rm -rf node_modules/.vite-temp
npm cache clean --force
```

### 1.3 Verify Environment
```bash
cat .env.local | grep PAYTM
# Should show:
# PAYTM_API_KEY=ebb89582...
# PAYTM_API_SECRET=xxx...
```

---

## Phase 2: Fix Local Token Generation

### 2.1 Update TokenGeneratorModal to Accept Multiple URL Formats

**File:** `components/TokenGeneratorModal.tsx`

**Change:** Update placeholder and URL parsing to handle both formats

```typescript
// Current Line 298 - Update placeholder:
placeholder="Paste the redirect URL here (starting with https://developer.paytmmoney.com/ or http://127.0.0.1:1313/...)"

// Lines 114-120 - Already handles extraction, no change needed
```

### 2.2 Test Local Generation
```bash
npm run dev
# Navigate to Settings → Token Generator
# Test the flow
```

---

## Phase 3: Implement Auto-Refresh Service

### 3.1 Create `/api/paytm-auto-refresh.js`

**Purpose:** Automatically refresh token before expiry

**Features:**
- Validates current token
- Refreshes if expiring within 1 hour
- Updates Redis cache
- Logs results
- Provides status check

### 3.2 Create `/services/paytm-token-manager.js`

**Purpose:** Centralized token management logic

**Functions:**
- `getTokenStatus()` - Check validity
- `refreshToken()` - Perform refresh
- `saveToken()` - Update cache + env
- `getTimeUntilExpiry()` - Calculate TTL

### 3.3 Create `/api/paytm-token-status.js`

**Purpose:** Provide monitoring endpoint

**Returns:**
- Current token status
- Expiry time
- Last refresh timestamp
- Next refresh scheduled

---

## Phase 4: Setup External Cron

### 4.1 Register at EasyCron

1. Go to https://www.easycron.com/
2. Sign up (free)
3. Create new cron job:
   ```
   URL: https://{your-vercel-domain}/api/paytm-auto-refresh
   Method: POST
   Schedule: 0 23 * * * (11 PM daily)
   Headers: Authorization: Bearer {PAYTM_AUTO_REFRESH_SECRET}
   ```

### 4.2 Verify Cron Firing
```bash
# Check Vercel logs for cron trigger
vercel logs --follow
# Should see successful refresh at scheduled time
```

---

## Phase 5: Monitoring & Alerts

### 5.1 Add Token Status Dashboard
**File:** `components/TokenRefreshStatus.tsx`

**Displays:**
- ✅ Token valid until: XX:XX on DD/MM
- 🔄 Last refresh: HH:MM on DD/MM
- 📅 Next refresh: HH:MM on DD/MM
- 🟢 Status: Healthy / ⚠️ Warning / 🔴 Critical

### 5.2 Add Webhook Alerts
```javascript
// In paytm-auto-refresh.js:
if (tokenRefreshFailed) {
  await fetch(process.env.ALERT_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      message: `Token refresh failed: ${error}`,
      severity: 'critical',
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## File Structure After Implementation

```
FyersNifty50Live/
├── api/
│   ├── paytm-generate.js              [Existing] Manual token generation
│   ├── paytm-auto-refresh.js          [NEW] Auto-refresh endpoint
│   ├── paytm-token-status.js          [NEW] Status check endpoint
│   └── paytm/
│       └── token-validator.js         [NEW] Validation logic
│
├── components/
│   ├── TokenGeneratorModal.tsx        [UPDATED] Fix URL parsing
│   └── TokenRefreshStatus.tsx         [NEW] Status dashboard
│
├── services/
│   ├── paytm-token-manager.js         [NEW] Token management
│   └── redis-client.js                [Existing]
│
├── docs/
│   ├── SEAMLESS_TOKEN_AUTO_REFRESH_PROPOSAL.md
│   ├── CURRENT_TOKEN_GENERATION_ISSUE.md
│   ├── IMPLEMENTATION_ROADMAP.md       [THIS FILE]
│   └── TOKEN_TROUBLESHOOTING.md
│
└── .env.local                         [VERIFIED]
    ├── PAYTM_API_KEY=...
    ├── PAYTM_API_SECRET=...
    ├── PAYTM_AUTO_REFRESH_SECRET=... [NEW]
    └── PAYTM_REFRESH_CRON_ENABLED=true [NEW]
```

---

## Environment Variables Required

### Add to `.env.local`:
```bash
# Auto-refresh configuration
PAYTM_AUTO_REFRESH_SECRET=<random-32-char-string>
PAYTM_REFRESH_CRON_ENABLED=true
PAYTM_REFRESH_INTERVAL_HOURS=23
PAYTM_REFRESH_ALERT_WEBHOOK=<optional-webhook-url>
```

### Add to Vercel Settings → Environment Variables:
```bash
PAYTM_AUTO_REFRESH_SECRET=<same-as-above>
PAYTM_REFRESH_CRON_ENABLED=true
PAYTM_REFRESH_INTERVAL_HOURS=23
```

---

## Testing Checklist

- [ ] Kill stuck processes
- [ ] Verify .env.local credentials
- [ ] Test local token generation (manual)
- [ ] Deploy updated code to preview branch
- [ ] Test preview auto-refresh endpoint
- [ ] Register EasyCron job
- [ ] Monitor first scheduled refresh
- [ ] Check Vercel logs for success
- [ ] Verify Redis cache updated
- [ ] Test status endpoint
- [ ] Test monitoring dashboard
- [ ] Verify alert webhook (if configured)

---

## Deployment Steps

### Step 1: Create Branch
```bash
git -c user.name="Suresh Kumar M" -c user.email="sureshkumarm8@gmail.com" checkout -b feat/auto-token-refresh
```

### Step 2: Make Changes
- Add new API endpoints
- Update components
- Add services

### Step 3: Test Locally
```bash
npm run dev
# Test all flows
```

### Step 4: Commit Changes
```bash
git -c user.name="Suresh Kumar M" -c user.email="sureshkumarm8@gmail.com" add -A
git -c user.name="Suresh Kumar M" -c user.email="sureshkumarm8@gmail.com" commit -m "feat: implement auto token refresh service

- Add paytm-auto-refresh.js for scheduled token refresh
- Add paytm-token-manager.js for centralized token logic
- Add TokenRefreshStatus component for monitoring
- Configure EasyCron integration
- Add environment variables for auto-refresh
"
```

### Step 5: Push & Create PR
```bash
git push origin feat/auto-token-refresh
# Create PR on GitHub
# Review → Merge
```

### Step 6: Deploy to Production
```bash
# Vercel auto-deploys on merge to main
# Monitor logs for first refresh
```

---

## Monitoring After Deployment

### Daily Checks
- ✅ Check Vercel logs for scheduled refresh
- ✅ Verify token status endpoint returns healthy
- ✅ Confirm dashboard shows recent refresh
- ✅ Check Redis cache has new token

### Weekly Checks
- ✅ Review refresh logs for patterns
- ✅ Monitor alert webhook (if configured)
- ✅ Verify no manual refreshes needed
- ✅ Check Paytm API response times

### Monthly Checks
- ✅ Analyze refresh success rate
- ✅ Review EasyCron logs
- ✅ Plan for any maintenance
- ✅ Update documentation

---

## Rollback Plan

If auto-refresh fails:

1. **Immediate (< 1 hour)**
   ```bash
   # Disable auto-refresh
   PAYTM_REFRESH_CRON_ENABLED=false
   # Update manually via UI
   ```

2. **Short-term (< 1 day)**
   ```bash
   # Revert commit
   git revert <auto-refresh-commit>
   # Redeploy
   ```

3. **Long-term**
   - Investigate failure root cause
   - Add additional error handling
   - Implement retry logic
   - Deploy fixed version

---

## Success Criteria

- ✅ No manual token refresh needed for 30 days
- ✅ Zero token expiry errors in production
- ✅ Auto-refresh succeeds > 99% of scheduled times
- ✅ Monitoring dashboard shows healthy status
- ✅ Team confidence in automated process

---

## Questions & Support

**Q: What if cron job doesn't fire?**
- A: Implement manual fallback + monitoring dashboard
- Check EasyCron logs
- Verify webhook secret

**Q: What if token refresh fails?**
- A: Stay on old token, retry in 1 hour
- Send alert webhook
- Manual UI refresh available

**Q: Can we test this before production?**
- A: Yes! Use preview deployment
- Manually trigger refresh endpoint
- Monitor for 24 hours before production

---

**Ready to start? Let's implement Phase 1 first! 🚀**
