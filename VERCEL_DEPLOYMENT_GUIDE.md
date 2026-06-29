# 🚀 Vercel Deployment Guide - Copy-Paste Setup

## ⚡ Quick Setup (5 minutes)

### Step 1: Copy Environment Variables
```
PAYTM_API_KEY=your-paytm-api-key
PAYTM_API_SECRET=your-paytm-secret
FYERS_CLIENT_ID=your-fyers-client-id
FYERS_SECRET_KEY=your-fyers-secret
GOOGLE_API_KEY=your-google-key
GROQ_API_KEY=your-groq-key
BYPASS_MARKET_HOURS=false
REFRESH_INTERVAL=60000
```

### Step 2: Add to Vercel Dashboard

1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. For each variable:
   - Paste name and value
   - Select **Production**, **Preview**, **Development**
   - Click **Save**

### Step 3: Redeploy

1. Go to **Deployments**
2. Click latest deployment → **Redeploy**
3. Wait 2-3 minutes
4. ✅ Done!

---

## 📋 Environment Variables Explained

| Variable | Where to Get | Example |
|----------|-------------|---------|
| `PAYTM_API_KEY` | developer.paytmmoney.com | `abc123def456xyz...` |
| `PAYTM_API_SECRET` | developer.paytmmoney.com | `xyz789abc123def...` |
| `FYERS_CLIENT_ID` | developer.fyers.in | `ABC12345CD...` |
| `FYERS_SECRET_KEY` | developer.fyers.in | `xyz789uvw...` |
| `GOOGLE_API_KEY` | console.cloud.google.com | `AIzaSy...` |
| `GROQ_API_KEY` | console.groq.com | `gsk_...` |
| `BYPASS_MARKET_HOURS` | (optional) | `false` or `true` |
| `REFRESH_INTERVAL` | (optional) | `60000` (milliseconds) |

---

## 🔑 Getting Your API Keys

### Paytm Money
1. Go to https://developer.paytmmoney.com/
2. Login with your account
3. Go to **My Applications**
4. Click your application
5. Copy **API Key** and **API Secret**

### Fyers
1. Go to https://developer.fyers.in/
2. Create/select application
3. Copy **Client ID** and **Secret Key**

### Google
1. Go to https://console.cloud.google.com/
2. Create API key
3. Copy key

### Groq
1. Go to https://console.groq.com/
2. Create API key
3. Copy key

---

## ✅ How It Works

```
Vercel deploys your app
        ↓
Environment variables loaded automatically
        ↓
API endpoints use process.env.PAYTM_API_KEY, etc.
        ↓
Config manager reads from environment
        ↓
Token generation works! ✨
```

---

## 🔄 Local Development

For local testing, use `.env.local`:

```bash
# .env.local (NOT committed to git)
PAYTM_API_KEY=your-local-key
PAYTM_API_SECRET=your-local-secret
FYERS_CLIENT_ID=your-local-id
FYERS_SECRET_KEY=your-local-secret
```

Then run: `npm run dev`

---

## 🧪 Testing After Deployment

### Test Paytm Token Generation
1. Go to your deployed app URL
2. Settings → Generate Token
3. Click Start Authentication
4. Complete OTP
5. Paste redirect URL
6. ✅ Should work now!

### Check Logs
```bash
# View Vercel deployment logs
vercel logs YOUR_PROJECT_NAME --tail
```

---

## ⚠️ Important

✅ **DO:**
- Add variables to all three environments (Production, Preview, Development)
- Redeploy after adding variables
- Use real API credentials
- Keep credentials secret (never share or commit)

❌ **DON'T:**
- Commit `.env.local` to git
- Share your API keys publicly
- Use demo keys in production
- Forget to redeploy after changing variables

---

## 🎯 Troubleshooting

### Still getting "Invalid Api Key" error
- ✓ Confirm you added variables to Vercel
- ✓ Confirm you redeployed
- ✓ Confirm variables are in all 3 environments
- ✓ Confirm you're using REAL credentials (not demo)

### Variables not showing up
- Go to Settings → Environment Variables
- Scroll down to verify all are added
- Make sure they're not just in Development

### Need to change variables
- Edit in Vercel Settings
- Redeploy
- That's it!

---

## 📊 Expected Result

After setup:
```json
{
  "success": true,
  "message": "Authentication successful",
  "accessToken": "eyJ0eXAi...",
  "publicAccessToken": "eyJ0eXAi...",
  "readAccessToken": "eyJ0eXAi...",
  "expiresIn": "24 hours"
}
```

---

## 🚀 Summary

**One-time setup:**
1. Copy variables from above
2. Paste into Vercel Settings
3. Redeploy
4. Done! 🎉

No more config uploads. Just environment variables. Simple and secure! ✨

---

**Status: READY FOR VERCEL DEPLOYMENT** 🚀
