# 9:17 AM IST Delayed API Call Implementation

## Overview
This implementation ensures that when users import a new config or save settings before 9:17 AM IST, the application will NOT immediately call live data APIs. Instead, it will schedule the first API call to occur at exactly 9:17 AM IST.

## Why 9:17 AM?
- Market opens at 9:15 AM IST
- First 2 minutes (9:15-9:17) are highly volatile with extreme price swings
- Waiting until 9:17 AM provides more stable and reliable data for trading decisions

## Implementation Details

### 1. Utility Functions (`utils/marketTime.ts`)
Created reusable utilities for market time calculations:

```typescript
export interface MarketTimeInfo {
  istDate: Date;
  hour: number;
  min: number;
  timeVal: number;
  isBeforeMarketStart: boolean;  // true if time < 9:17 AM
  delayUntil917: number;          // milliseconds until 9:17 AM
  isWeekday: boolean;
  isMarketHours: boolean;         // 9:15 AM - 3:45 PM
}

getMarketTimeInfo(): MarketTimeInfo
formatDelay(delayMs: number): string  // "5m 30s" format
```

### 2. Live Data API (App.tsx)
**Location:** Lines 631-692

**Behavior:**
- When config is imported/saved before 9:17 AM:
  - ✅ Schedules first API call at 9:17 AM IST
  - ✅ Shows countdown message to user
  - ✅ Logs schedule time in console
  - ✅ After 9:17 AM, starts regular interval polling
  
- When config is imported/saved after 9:17 AM:
  - ✅ Immediately calls API
  - ✅ Starts regular interval polling

**Dependencies:**
```javascript
[isDbLoaded, credentials.appId, credentials.accessToken, 
 credentials.paytmAccessToken, credentials.dataProvider, 
 isPaused, credentials.refreshInterval, credentials.bypassMarketHours]
```

When any of these change (e.g., importing new config), the effect re-runs and checks the time.

### 3. Auto-Trade Paper Trading (UnifiedAutoTrade.tsx)
**Location:** Lines 313-370

**Applies to:**
- ✅ MOMENTUM Strategy
- ✅ SNIPER Strategy  
- ✅ Both Paper and Live trading modes

**Behavior:**
- When monitoring is started before 9:17 AM:
  - ✅ Schedules monitoring to start at 9:17 AM IST
  - ✅ Adds log entry with countdown
  - ✅ Shows strategy-specific message
  
- When monitoring is started after 9:17 AM:
  - ✅ Immediately starts monitoring
  - ✅ Runs first analysis
  - ✅ Sets up 30-second interval

**Dependencies:**
```javascript
[state.isMonitoring, state.strategy, runAnalysis, 
 addLog, credentials.bypassMarketHours]
```

### 4. Bypass Option
Both implementations respect `credentials.bypassMarketHours`:
- When `true`: Ignores time check, calls API immediately
- When `false`: Enforces 9:17 AM delay
- Useful for testing or special situations

## User Experience

### Before 9:17 AM
1. User imports config at 8:45 AM
2. UI shows: `⏰ First data fetch at 9:17 AM IST (in 32m 0s)`
3. Console logs: `⏰ Config loaded before market start. First API call scheduled at 9:17 AM IST (in 32m 0s)`
4. Auto-trade shows: `⏰ MOMENTUM monitoring scheduled at 9:17 AM IST (in 32m 0s)`
5. At exactly 9:17 AM:
   - Console: `🔔 9:17 AM IST reached - Starting live data fetch`
   - Auto-trade: `🔔 9:17 AM IST - Starting MOMENTUM monitoring`
   - Regular polling begins

### After 9:17 AM
1. User imports config at 10:00 AM
2. Console logs: `🚀 Starting live data fetch`
3. API called immediately
4. Regular polling starts

## Config Import Flow

```
User uploads config.json
       ↓
SettingsScreen.handleFileUpload()
       ↓
Parse JSON, update state
       ↓
User clicks Save
       ↓
handleSave() → onSave(newCredentials)
       ↓
App.saveCredentials()
       ↓
Updates credentials state
       ↓
useEffect dependencies trigger
       ↓
getMarketTimeInfo()
       ↓
Is time < 9:17 AM IST?
   ↓                    ↓
  YES                   NO
   ↓                    ↓
Schedule at 9:17 AM    Call immediately
```

## Edge Cases Handled

### 1. Multiple Config Imports
- Each import cancels previous timers
- New schedule is created based on current time
- No duplicate API calls

### 2. Timezone Issues
- Always uses IST (`Asia/Kolkata`)
- Converts user's local time correctly
- No DST complications

### 3. Weekend/Holidays
- Time check still applies
- Market status message shows accordingly
- No special handling needed (market hours check handles this)

### 4. Network Reconnection
- If network drops before 9:17 AM
- Timer continues running
- First call still happens at 9:17 AM

### 5. Page Refresh
- Timers don't persist across refreshes
- On reload, time check runs again
- New schedule created if still before 9:17 AM

## Testing Scenarios

### Test 1: Import Config at 8:00 AM
```
1. Set system time to 8:00 AM IST
2. Import config.json
3. Click Save
4. Verify: Message shows "in 1h 17m"
5. Verify: No API call in network tab
6. Wait until 9:17 AM
7. Verify: API call happens
8. Verify: Regular polling starts
```

### Test 2: Import Config at 11:00 AM
```
1. Set system time to 11:00 AM IST
2. Import config.json
3. Click Save
4. Verify: Immediate API call
5. Verify: Regular polling active
```

### Test 3: Enable Bypass
```
1. Set system time to 8:00 AM IST
2. Import config with bypassMarketHours: true
3. Click Save
4. Verify: Immediate API call (ignores time)
```

### Test 4: Auto-Trade Start Before 9:17 AM
```
1. Set system time to 9:00 AM IST
2. Configure auto-trade (MOMENTUM or SNIPER)
3. Click Start Monitoring
4. Verify: Log shows scheduled time
5. Wait until 9:17 AM
6. Verify: Monitoring starts
7. Verify: Analysis runs every 30 seconds
```

## Code Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Utility Functions | `utils/marketTime.ts` | All | Time calculations |
| Live Data Delay | `App.tsx` | 631-692 | Main data fetch scheduling |
| Auto-Trade Delay | `components/UnifiedAutoTrade.tsx` | 313-370 | Strategy monitoring scheduling |
| Import Handler | `components/SettingsScreen.tsx` | 183-294 | Config file parsing |
| Save Handler | `App.tsx` | 231-240 | Credential update |

## Benefits

1. **Prevents Bad Data**: Avoids using volatile opening minutes data
2. **Better Trading Decisions**: Strategies analyze stable market conditions
3. **User Control**: Can override with bypass flag
4. **Clear Feedback**: Users see exactly when data fetch will start
5. **Consistent Behavior**: Same logic for live data and auto-trading
6. **Maintainable**: Centralized utility functions
7. **Tested**: Works across different scenarios

## Future Enhancements

1. **Persistent Timers**: Save timer state to localStorage
2. **Desktop Notification**: Alert user at 9:17 AM
3. **Pre-market Data**: Option to fetch pre-market indicators before 9:17 AM
4. **Configurable Start Time**: Allow user to customize (e.g., 9:20 AM, 9:25 AM)
5. **Auto-Enable**: Automatically start monitoring at 9:17 AM without user action

## Summary

✅ **COMPLETE IMPLEMENTATION**
- Live data API calls delayed until 9:17 AM IST
- Auto-trade monitoring delayed until 9:17 AM IST  
- Works for MOMENTUM and SNIPER strategies
- Applies to both PAPER and LIVE trading modes
- Config import/save triggers time check
- User sees clear countdown messages
- Bypass option available for testing
- Network-resilient implementation
- Clean, maintainable code with utility functions
