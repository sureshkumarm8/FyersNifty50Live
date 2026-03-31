# 🕐 9:17 AM Delayed API - Quick Reference

## What is this?
When you import a config or save settings **before 9:17 AM IST**, the app will **NOT** call live data APIs immediately. Instead, it schedules the first API call at exactly **9:17 AM IST**.

## Why?
- Market opens at 9:15 AM IST
- First 2 minutes are extremely volatile
- 9:17 AM provides stable, reliable data

## When Does It Apply?

### ✅ Applies To:
- **Live Data Fetching** (Stock quotes, Nifty LTP, Option chain)
- **Auto-Trade Monitoring** (Both MOMENTUM and SNIPER strategies)
- **Paper Trading Mode**
- **Live Trading Mode**

### ❌ Does NOT Apply When:
- Time is already **9:17 AM or later**
- `bypassMarketHours` is set to `true` in config
- Manual refresh button is clicked after 9:17 AM

## What You'll See

### Before 9:17 AM Import:
```
⏰ First data fetch at 9:17 AM IST (in 15m 30s)
⏰ MOMENTUM monitoring scheduled at 9:17 AM IST (in 15m 30s)
```

### At 9:17 AM Exactly:
```
🔔 9:17 AM IST reached - Starting live data fetch
🔔 9:17 AM IST - Starting MOMENTUM monitoring
```

### After 9:17 AM Import:
```
🚀 Starting live data fetch
🚀 Started monitoring with MOMENTUM strategy
```

## How to Use

### Normal Usage (Recommended)
1. Import your config JSON any time
2. Click Save
3. If before 9:17 AM, wait - countdown shows automatically
4. At 9:17 AM, data fetching starts automatically

### Override for Testing
1. In your config.json, add:
   ```json
   {
     "config": {
       "bypassMarketHours": true
     }
   }
   ```
2. Save config
3. API calls happen immediately regardless of time

## Config JSON Examples

### Production Config (Recommended)
```json
{
  "fyers": {
    "clientId": "YOUR_CLIENT_ID",
    "accessToken": "YOUR_ACCESS_TOKEN"
  },
  "paytm": {
    "accessToken": "YOUR_PAYTM_TOKEN"
  },
  "config": {
    "bypassMarketHours": false,
    "refreshInterval": 60000
  }
}
```

### Testing Config (Use with Caution)
```json
{
  "fyers": {
    "clientId": "YOUR_CLIENT_ID",
    "accessToken": "YOUR_ACCESS_TOKEN"
  },
  "config": {
    "bypassMarketHours": true,
    "refreshInterval": 30000
  }
}
```

## Timeline

| Time     | Action |
|----------|--------|
| 8:00 AM  | Import config → Scheduled for 9:17 AM |
| 9:00 AM  | Import config → Scheduled for 9:17 AM |
| 9:15 AM  | Import config → Scheduled for 9:17 AM (2 min wait) |
| 9:16 AM  | Import config → Scheduled for 9:17 AM (1 min wait) |
| **9:17 AM** | **First API call happens** |
| 9:18 AM  | Import config → Immediate API call |
| 10:00 AM | Import config → Immediate API call |
| 3:30 PM  | Import config → Immediate API call |

## Troubleshooting

### "Why isn't data loading?"
- Check if current time is before 9:17 AM IST
- Look for countdown message in UI
- Check browser console for schedule logs

### "I want to test before 9:17 AM"
- Set `bypassMarketHours: true` in config
- OR wait until after 9:17 AM

### "Can I change the start time?"
- Currently fixed at 9:17 AM
- Future versions may allow customization
- Contact dev team for custom builds

### "Does this work on weekends?"
- Yes, time check still applies
- Market status shows "Weekend" separately
- No API calls on weekends (unless bypass enabled)

## Auto-Trade Specific

### MOMENTUM Strategy
- Scheduled if started before 9:17 AM
- Multi-factor analysis runs every 30 seconds after 9:17 AM
- Shows countdown in analysis log

### SNIPER Strategy  
- Scheduled if started before 9:17 AM
- Phase 1 (Download) runs 9:15-9:25 but waits for 9:17 AM data
- Phase 2 (Entry) runs 9:25-10:15
- Phase 3 (Hard Stop) at 10:15 AM

## Benefits

✅ Avoids volatile opening tick data  
✅ Better trading decisions with stable prices  
✅ Consistent behavior across features  
✅ Clear user feedback with countdown  
✅ Safety override for testing  
✅ Automatic scheduling - no manual intervention needed  

## Support

For issues or questions:
1. Check browser console logs
2. Review `DELAYED_API_IMPLEMENTATION.md` for technical details
3. Contact development team

---

**Remember:** This is a SAFETY FEATURE to protect your trading decisions from volatile opening data. Use bypass option only for testing! 🛡️
