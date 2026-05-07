# Smart Fetch Strategy - Frontend Priority with Cron Backup

## Architecture

### Logic Flow:
```
┌─────────────────────────────────────────────────────────────┐
│  Scenario 1: App OPEN                                       │
│  ─────────────────────────────────────────────────────────  │
│  Frontend fetches every 30s                                 │
│      ↓                                                       │
│  Saves to Redis + Sets "frontend_active" flag              │
│      ↓                                                       │
│  Cron checks flag → Skips (Frontend is handling it)        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Scenario 2: App CLOSED                                     │
│  ─────────────────────────────────────────────────────────  │
│  No frontend activity                                        │
│      ↓                                                       │
│  "frontend_active" flag expires (TTL 90 sec)               │
│      ↓                                                       │
│  Cron detects no flag → Fetches data as backup             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Frontend Heartbeat (Every fetch)
```typescript
// In App.tsx - After successful fetch
await fetch('/api/save-redis-data', {
  method: 'POST',
  body: JSON.stringify({ 
    stocks, 
    options, 
    niftyLTP,
    frontendActive: true  // Signal that frontend is active
  })
});
```

### 2. Redis Heartbeat Flag
```javascript
// In /api/save-redis-data.js
// Set a flag that expires in 90 seconds
await redis.set('frontend_active', Date.now(), {
  ex: 90  // Expires in 90 seconds
});
```

### 3. Smart Cron (Check Flag)
```javascript
// In /api/cron-fetch.js
// Check if frontend is active
const frontendActive = await redis.get('frontend_active');

if (frontendActive) {
  // Frontend is handling it - skip
  return res.json({ 
    success: true, 
    message: 'Frontend is active - Cron skipped',
    skipped: true 
  });
}

// Frontend is not active - proceed with fetch
console.log('[Cron] Frontend inactive - Fetching data');
// ... fetch logic
```

## Result

✅ **App Open:** Frontend fetches, cron does nothing (saves API quota)
✅ **App Closed:** Cron takes over automatically (data stays fresh)
✅ **No Conflict:** Only one source fetching at a time
✅ **Automatic:** No manual intervention needed

