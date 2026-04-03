# 🚀 AutoTrade User Guide

## Quick Start Guide

### 🔒 Enabling Live Trading (First Time Setup)

**Step 1: Open Settings**
```
Click Settings Icon (⚙️) → Configuration Tab
```

**Step 2: Enable Live Trading**
```
Scroll down to "Live Trading" section
Toggle the switch → Confirm warning dialog
✅ Toggle turns RED and pulses when enabled
```

**Step 3: Verify in AutoTrade**
```
Go to AutoTrade screen
LIVE button should now be clickable (no 🔒)
```

---

### 📊 Using AutoTrade

#### Starting Monitoring

**Option A: During Market Hours (After 9:17 AM IST)**
1. Select Strategy: MOMENTUM or SNIPER
2. Ensure mode: PAPER or LIVE
3. Click **Start** button
4. ✅ Monitoring begins immediately
5. Analysis runs every 30 seconds

**Option B: Before Market Hours (Before 9:17 AM IST)**
1. Select Strategy & Mode
2. Click **Start** button
3. ⏰ System schedules start at 9:17 AM IST
4. Log shows: "⏰ monitoring scheduled at 9:17 AM IST (in Xm Ys)"
5. 🔔 Auto-starts at 9:17 AM
6. Log shows: "🔔 9:17 AM IST - Starting monitoring"

---

### 🔄 State Persistence Feature

**What It Does:**
- Saves your AutoTrade state when you switch screens
- Restores everything when you come back

**What's Saved:**
- ✅ Monitoring status (ON/OFF)
- ✅ Selected strategy (MOMENTUM/SNIPER)
- ✅ Trading mode (PAPER/LIVE)
- ✅ Analysis logs (last 50 entries)
- ✅ System status

**How to Use:**
1. Start monitoring on AutoTrade
2. Switch to any other view (Stocks, Options, etc.)
3. Do your work
4. Return to AutoTrade
5. ✅ Everything restored automatically!
6. Log shows: "🔄 AutoTrade restored - [STRATEGY] monitoring active"

---

### 🎯 Strategy Selection

#### MOMENTUM Strategy
- Multi-factor algorithmic analysis
- Uses technical indicators
- Confidence-based signals
- 70%+ confidence threshold
- Risk-reward: Min 1.5:1

**Best For:**
- Strong trending markets
- Volatile conditions
- Pattern-based trading

#### SNIPER Strategy
- Office hour scalping (9:25-10:15 AM)
- Fixed 30-point targets
- Zone-based entries
- Max 2 trades per day
- Hard stop at 10:15 AM

**Best For:**
- Morning volatility
- Quick scalps
- Time-boxed trading

---

### 🛡️ Safety Features

#### PAPER vs LIVE Mode

**PAPER Mode (Green)**
- ✅ Default mode
- No real orders
- Simulation only
- Safe for testing
- Full functionality

**LIVE Mode (Red 🔴)**
- ⚠️ Real broker orders
- Requires Settings enable
- Shows 🔒 when disabled
- Confirmation required
- Cannot change during monitoring

#### Trading Controls

**When Monitoring is ON:**
- ❌ Cannot switch strategy
- ❌ Cannot change trading mode
- ✅ Can stop monitoring anytime
- ✅ Can close positions
- ✅ Can switch screens

**When Monitoring is OFF:**
- ✅ Can switch strategy
- ✅ Can change trading mode
- ✅ Can modify settings
- ✅ Full control

---

### 📈 Understanding the Interface

#### Status Indicators

```
🟢 IDLE          - System ready, not monitoring
🔵 MONITORING    - Actively scanning market
🟡 SIGNAL_GENERATED - Entry opportunity found
🟢 IN_TRADE      - Position active
```

#### Strategy Tabs

```
[🧠 Momentum] [⚡ Sniper]
   Blue         Yellow
```

#### Trading Mode

```
[PAPER]  [LIVE 🔒]
 Green    Red/Grey
```

#### Monitor Button

```
▶️ Start  (Blue) - Click to begin
⏸️ Stop   (Red)  - Click to pause
```

---

### ⏰ Market Time Behavior

| Time (IST) | AutoTrade Behavior |
|------------|-------------------|
| Before 9:00 AM | Monitoring disabled |
| 9:00 - 9:17 AM | Can start → Scheduled for 9:17 |
| 9:17 AM | Auto-start if scheduled |
| 9:17 - 3:45 PM | Normal operation |
| After 3:45 PM | Monitoring disabled |
| Weekends | Market closed |

**Dev Mode Override:**
- Settings → Configuration → Dev Mode
- Bypasses all market hour checks
- Use for testing only

---

### 🔧 Troubleshooting

#### LIVE Button Shows 🔒

**Problem:** Cannot click LIVE button
**Solution:**
1. Go to Settings → Configuration
2. Enable "Live Trading" toggle
3. Confirm warning dialog
4. Return to AutoTrade
5. LIVE button now unlocked

#### State Not Persisting

**Problem:** Monitoring stops when switching screens
**Solution:**
- Check browser localStorage is enabled
- Don't use incognito/private mode
- Clear browser cache and reload
- State should persist automatically

#### Monitoring Doesn't Start at 9:17

**Problem:** Scheduled start doesn't work
**Solution:**
1. Check system timezone (should be IST)
2. Verify Dev Mode is OFF
3. Check browser console for errors
4. Try manual start after 9:17 AM

#### Cannot Switch Strategy

**Problem:** Strategy buttons disabled
**Solution:**
- Stop monitoring first (click ⏸️ Stop)
- Then switch strategy
- Restart monitoring if needed

---

### 💡 Best Practices

#### For MOMENTUM Strategy
1. ✅ Start after 9:17 AM for best data
2. ✅ Monitor during trending hours
3. ✅ Let signals develop (70%+ confidence)
4. ✅ Respect stop-loss levels
5. ❌ Don't force trades in choppy market

#### For SNIPER Strategy
1. ✅ Start before 9:25 AM
2. ✅ Wait for zone setup (9:15-9:25)
3. ✅ Enter during window (9:25-10:15)
4. ✅ Auto-exit at 10:15 AM
5. ❌ Max 2 trades per day only

#### General Tips
- 🔒 Use PAPER mode for testing
- 📊 Review logs regularly
- 💰 Respect position sizing
- ⏰ Don't override time limits
- 🛡️ Enable circuit breakers

---

### 📝 Analysis Logs

**What They Show:**
- Timestamp of each event
- Signal generation details
- Confidence levels
- Entry/exit decisions
- System status changes

**Features:**
- Last 50 entries saved
- Persists across screen switches
- Real-time updates
- Scrollable history

**Reading Logs:**
```
[HH:MM:SS] 🎯 LONG Signal | Confidence: 75% | Reason
[HH:MM:SS] �� Position Size: 50 lots | R:R = 2.5
[HH:MM:SS] ✅ Order placed: 24000 CE @ ₹250
[HH:MM:SS] 🔔 9:17 AM IST - Starting monitoring
```

---

### ⚡ Keyboard Shortcuts

*Coming soon in future update*

---

### 🆘 Support

**Need Help?**
- Check logs for error messages
- Review AUTOTRADE_FIXES_SUMMARY.md
- Verify Settings configuration
- Test in PAPER mode first

**Report Issues:**
- Include log messages
- Specify strategy used
- Note time and market conditions
- Describe expected vs actual behavior

---

## Version Information

**Current Version:** AutoTrade Pro v3.0
**Last Updated:** April 3, 2026
**Features:**
- ✅ State Persistence
- ✅ 9:17 AM Auto-Start
- ✅ Live Orders Control
- ✅ Dual Strategy Support
- ✅ AI Predictions
- ✅ Risk Management

---

**Happy Trading! 🚀**

*Remember: Past performance does not guarantee future results. Always practice risk management.*
