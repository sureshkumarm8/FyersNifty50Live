# 📌 Quick Start: External Cron Setup

## Problem
Vercel free plan only allows daily cron jobs. You need every-minute fetching.

## Solution
Use **cron-job.org** (free) to trigger your API.

## Steps

1. **Deploy to Vercel** and add environment variable:
   ```
   PAYTM_ACCESS_TOKEN=your_token_here
   ```

2. **Sign up at cron-job.org:**
   https://cron-job.org/en/signup/

3. **Create cron job:**
   - URL: `https://your-app.vercel.app/api/cron-fetch`
   - Schedule: Every 1 minute
   - Days: Mon-Fri
   - Time: 03:47-09:45 UTC (= 9:17 AM - 3:15 PM IST)

4. **Done!** ✅

## Full Documentation
See: [EXTERNAL_CRON_SETUP.md](./EXTERNAL_CRON_SETUP.md)

## Cost
**$0** - Completely free!
