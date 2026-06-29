# 🔑 Setting Up Paytm Money API Keys

## Problem: "Invalid Api Key or Api Secret Key"

If you're getting this error, your API keys are likely:
1. ❌ Invalid/Demo keys
2. ❌ Expired
3. ❌ Not properly configured

## Solution: Get Real API Keys

### Step 1: Create Paytm Money Developer Account
1. Go to: https://developer.paytmmoney.com/
2. Sign up for a developer account
3. Complete KYC verification
4. Create an application

### Step 2: Get API Credentials
1. Login to developer dashboard
2. Go to "My Applications"
3. Click your application
4. Copy:
   - **API Key** (e.g., `abc123def456...`)
   - **API Secret** (e.g., `xyz789uvw012...`)

### Step 3: Update Environment Variables

#### Local Testing (.env.local):
```bash
PAYTM_API_KEY=your_actual_api_key_here
PAYTM_API_SECRET=your_actual_api_secret_here
```

#### Production (Vercel):
1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Add:
   - `PAYTM_API_KEY` = your real key
   - `PAYTM_API_SECRET` = your real secret

### Step 4: Restart Dev Server
```bash
# Kill old server
pkill -f "npm run dev"

# Restart
npm run dev
```

### Step 5: Test
1. Go to http://localhost:5173
2. Settings → Generate Token
3. Should work now!

---

## Verifying Your Keys

Check if keys are loaded:
```bash
# In your app terminal:
curl http://localhost:5001/api/verify-paytm-keys
```

Expected response:
```json
{
  "success": true,
  "apiKey": "abc12345...yz99",
  "apiSecret": "xyz78901...wx88",
  "message": "API keys configured"
}
```

---

## If Still Getting "Invalid Api Key" Error

This usually means:
1. **API credentials are demo/test keys** - Get real ones from Paytm
2. **Request token is invalid** - Make sure you copied the FULL redirect URL
3. **Mismatch between local and production keys** - Check .env.local vs Vercel

---

## Troubleshooting Steps

### 1. Verify Keys are Set
```bash
echo $PAYTM_API_KEY
echo $PAYTM_API_SECRET
```

Should show your actual keys (not demo keys)

### 2. Check Redirect URL Format
```
✅ Correct:
https://developer.paytmmoney.com/?requestToken=ABC123XYZ789...

❌ Wrong:
https://developer.paytmmoney.com/?token=ABC...
https://paytmmoney.com/?requestToken=ABC...
```

### 3. Check in Browser Console
Open DevTools (F12) → Console
Look for `[TokenGenerator]` messages showing:
- Session ID
- Request token length
- API response

### 4. Check Server Logs
```bash
tail -f /tmp/dev-server.log | grep "Paytm\|Error"
```

Should show token exchange attempts

---

## Getting Help

If issues persist:
1. Verify API keys are from actual Paytm account
2. Test login manually: `[loginUrl]` from first step
3. Check Paytm Developer documentation
4. Contact Paytm Support

---

**Note**: The hardcoded demo keys will NOT work for real token generation.
Always use your actual API credentials from Paytm Money Developer Dashboard.
