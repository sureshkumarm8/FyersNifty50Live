# Local Testing Mode

## Overview

The application now supports local testing mode for development without requiring Redis or external services.

## Features

### In-Memory Storage
- **History tracking** - Market snapshots stored in memory
- **Configuration** - App configuration cached locally
- **Session data** - Session history maintained during runtime

### Relaxed Authentication
- Redis API endpoints (`/api/get-history`, `/api/save-history`, etc.) don't require authentication
- Fyers/PayTM API endpoints still require proper auth headers for real data

### Automatic Activation

Local mode is **automatically enabled** when running:
```bash
npm run dev
```

The `start-dev.sh` script sets:
```bash
export LOCAL_MODE=true
export NODE_ENV=development
```

## Local Endpoints

All endpoints work on `http://localhost:5001`:

### Get History
```bash
GET /api/get-history?limit=500
GET /api/get-history?latest=true
```

### Save History
```bash
POST /api/save-history
Content-Type: application/json

{
  "timestamp": 1234567890,
  "time": "10:30:00",
  "niftyLtp": 23500,
  ...
}
```

### Clear History
```bash
POST /api/clear-history
```

### Get/Save Config
```bash
GET /api/get-config
POST /api/save-config
```

## Testing Without Real Data

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. The app will work without Fyers/PayTM credentials:
   - ✅ UI loads normally
   - ✅ History can be saved/loaded from memory
   - ✅ No Redis required
   - ⚠️ Live stock data won't work (requires valid API tokens)

3. Mock data can be added via browser console:
   ```javascript
   await fetch('http://localhost:5001/api/save-history', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       timestamp: Date.now(),
       time: new Date().toLocaleTimeString(),
       niftyLtp: 23500,
       overallSent: 65,
       callsBuyQty: 100000,
       callsSellQty: 80000,
       putsBuyQty: 90000,
       putsSellQty: 110000
     })
   });
   ```

## Production Mode

To disable local mode (for production):

```bash
export LOCAL_MODE=false
# or remove the environment variable
npm start
```

In production mode:
- Authentication is strictly enforced
- Redis/Upstash is required
- All data is persisted to external storage

## Limitations

⚠️ **Local Mode Limitations:**

1. **Memory only** - Data is lost when server restarts
2. **Single instance** - Not suitable for multi-process/distributed setups
3. **No persistence** - Unlike Redis, data doesn't survive crashes
4. **Development only** - Not for production use

## Troubleshooting

### 401 Unauthorized Errors

If you see 401 errors on `/api/get-history`:
- ✅ Make sure `LOCAL_MODE=true` in environment
- ✅ Check that `start-dev.sh` exports the variable
- ✅ Restart the server after changes

### Data Not Persisting

This is expected in local mode! Data is stored in memory only. To persist data:
- Use Redis in production
- Or save/load from files manually

## Benefits

✨ **Why Local Mode?**

- 🚀 **Faster development** - No external dependencies
- 💰 **Cost savings** - No Redis hosting needed for dev
- 🔒 **Offline work** - Develop without internet
- 🧪 **Easy testing** - Mock data without complex setup
- 🎯 **Focused debugging** - Isolate UI issues from backend

---

**Pro Tip:** Use local mode for UI development and layout testing. Switch to production mode with real APIs when testing data flows and integrations.
