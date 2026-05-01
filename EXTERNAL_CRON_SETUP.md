# 🚀 External Cron Setup with cron-job.org (FREE)

## Why External Cron?

Vercel's **free (Hobby) plan** only allows cron jobs to run **once per day**.  
Your app needs to fetch data **every minute** during market hours (9:17 AM - 3:15 PM IST).

**Solution:** Use **cron-job.org** - a free external service that triggers your API every minute.

---

## ✅ Step-by-Step Setup Guide

### Step 1: Deploy to Vercel

1. **Add Environment Variables** in Vercel Dashboard:
   ```
   Go to: https://vercel.com/dashboard
   → Your Project → Settings → Environment Variables
   
   Add:
   PAYTM_ACCESS_TOKEN=your_paytm_token_here
   CRON_SECRET=your_random_secret_here  (optional but recommended)
   ```

2. **Deploy your app** (push to GitHub triggers auto-deploy)

3. **Test your API endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/cron-fetch
   ```
   Should return: `{"success": true, ...}`

---

### Step 2: Sign Up on cron-job.org

1. Visit: https://cron-job.org/en/signup/
2. Fill in:
   - Email: your-email@example.com
   - Password: (choose a strong password)
3. Click **"Sign Up"**
4. **Verify your email** (check inbox)
5. Login at: https://cron-job.org/en/members/

---

### Step 3: Create Cron Job

1. After login, click **"Create Cronjob"** button

2. Fill in the form:

   **📌 Title:**
   ```
   Nifty50 Market Data Fetch (9:17 AM - 3:15 PM IST)
   ```

   **📌 URL:**
   ```
   https://your-app.vercel.app/api/cron-fetch
   ```
   *(Replace `your-app` with your actual Vercel app name)*

   **📌 Schedule:**
   - Select: **"Every minute"**

   **📌 Days of Week:**
   - ☑ Monday
   - ☑ Tuesday
   - ☑ Wednesday
   - ☑ Thursday
   - ☑ Friday
   - ☐ Saturday
   - ☐ Sunday

   **📌 Time Range (UTC):**
   ```
   Start: 03:47
   End:   09:45
   ```
   *(9:17 AM IST = 03:47 UTC, 3:15 PM IST = 09:45 UTC)*

   **📌 Request Method:**
   - Select: **GET**

   **📌 Authentication** (if using CRON_SECRET):
   - Click "Add Header"
   - Name: `Authorization`
   - Value: `Bearer your_cron_secret_here`

   **📌 Notifications:**
   - ☐ Email me on success (optional)
   - ☑ Email me on failure (recommended)

3. Click **"Create Cronjob"**

---

### Step 4: Test Your Cron Job

1. Find your cron job in the list
2. Click **"Execute now"** button (▶️ play icon)
3. Wait 5-10 seconds
4. Check **"Execution history"** tab
5. Should see:
   - ✅ Status: **Success (200 OK)**
   - Response contains market data

---

## 📊 Timezone Conversion Reference

| IST Time   | UTC Time |
|------------|----------|
| 9:17 AM    | 3:47 AM  |
| 9:30 AM    | 4:00 AM  |
| 12:00 PM   | 6:30 AM  |
| 3:15 PM    | 9:45 AM  |

**Formula:** IST = UTC + 5:30

---

## 🎯 How It Works

```
cron-job.org (Free Service)
    ↓ Triggers every minute (Mon-Fri, 03:47-09:45 UTC)
    ↓
https://your-app.vercel.app/api/cron-fetch
    ↓ Vercel serverless function
    ↓ Checks market hours (9:17 AM - 3:15 PM IST)
    ↓ Fetches PayTM data if market is open
    ↓
Returns JSON response
```

---

## 💰 Cost Breakdown

| Service       | Plan         | Cost    |
|---------------|--------------|---------|
| Vercel        | Hobby (Free) | $0      |
| cron-job.org  | Free         | $0      |
| **Total**     |              | **$0** ✅ |

**Usage:**
- ~358 executions/day (6 hours × 60 minutes - ~2 mins)
- ~7,160 executions/month (20 trading days)
- ✅ Well within free limits!

---

## 🔒 Security (Optional but Recommended)

To prevent unauthorized access to your cron endpoint:

1. **Generate a CRON_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Vercel Environment Variables:**
   ```
   CRON_SECRET=your_generated_secret_here
   ```

3. **Add to cron-job.org:**
   - In cron job settings
   - Add Header: `Authorization: Bearer your_generated_secret_here`

---

## 🧪 Testing

### Test Manually:
```bash
# Without secret
curl https://your-app.vercel.app/api/cron-fetch

# With secret
curl -H "Authorization: Bearer your_secret" \
     https://your-app.vercel.app/api/cron-fetch
```

### Expected Response (Market Hours):
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {
    "niftyLTP": 22450.50,
    "stockCount": 50,
    "timestamp": 1714564825000,
    "duration": 1245,
    "istTime": "5/1/2026, 2:30:25 PM"
  }
}
```

### Expected Response (Market Closed):
```json
{
  "success": true,
  "message": "Market closed - No fetch performed",
  "marketClosed": true,
  "currentTime": "5/1/2026, 5:00:00 PM"
}
```

---

## 📈 Monitoring

### On cron-job.org Dashboard:
- Last execution time
- Success/failure count
- Average response time
- Execution history

### On Vercel Dashboard:
- Functions → cron-fetch → View Logs
- Should see logs every minute during market hours

---

## ❓ Troubleshooting

### Issue: "Unauthorized" error
**Fix:** 
- Check if CRON_SECRET matches in both Vercel and cron-job.org
- Or remove CRON_SECRET from Vercel to disable authentication

### Issue: cron-job.org shows "Failed" status
**Fix:**
- Check if Vercel app is deployed and running
- Test API endpoint manually with curl
- Check Vercel function logs for errors

### Issue: "PayTM token not configured"
**Fix:**
- Add PAYTM_ACCESS_TOKEN to Vercel environment variables
- Redeploy (or wait for next automatic deployment)

---

## 🎉 You're Done!

Once set up:
- ✅ cron-job.org will trigger your API every minute
- ✅ During market hours only (9:17 AM - 3:15 PM IST, Mon-Fri)
- ✅ Completely free
- ✅ No Vercel Pro plan needed

Your market data will be fetched automatically! 🚀
