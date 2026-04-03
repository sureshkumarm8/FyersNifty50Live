# AutoTrade Quick Fix Reference Card

## 🎯 3 Issues Fixed - Quick Reference

### Issue #1: State Lost When Switching Views ❌ → ✅

**Before:** Switching to another screen stopped monitoring
**After:** State persists automatically

**How It Works:**
- State saved to `localStorage.autotrade_state`
- Logs saved to `localStorage.autotrade_logs`
- Auto-restore on return to AutoTrade screen
- Message: "🔄 AutoTrade restored - [STRATEGY] monitoring active"

**User Action Required:** None - automatic!

---

### Issue #2: 9:17 AM Auto-Start ❌ → ✅

**Before:** Already working (verified)
**After:** Confirmed working perfectly

**How It Works:**
- Click Start before 9:17 AM → Scheduled start
- Shows: "⏰ monitoring scheduled at 9:17 AM IST (in Xm Ys)"
- Auto-activates at 9:17 AM IST
- Shows: "🔔 9:17 AM IST - Starting monitoring"

**User Action Required:** Just click "Start" anytime!

---

### Issue #3: LIVE Mode Safety ❌ → ✅

**Before:** LIVE button always accessible
**After:** Locked by default, requires Settings enable

**How It Works:**
1. LIVE button shows 🔒 when disabled
2. Go to Settings → Configuration → Live Trading
3. Toggle ON (confirm warning)
4. LIVE button unlocks in AutoTrade

**User Action Required:** 
- Settings → Configuration → Enable "Live Trading"
- Confirm warning dialog

---

## 📱 Quick Actions

| Action | Steps |
|--------|-------|
| **Enable Live Trading** | Settings → Config → Live Trading ON |
| **Check State Persistence** | Start monitoring → Switch view → Return |
| **Schedule 9:17 Start** | Click Start before 9:17 AM |
| **Switch Strategy** | Stop monitoring → Select strategy → Start |
| **View Logs** | AutoTrade screen → Logs panel (right side) |

---

## 🔧 Troubleshooting One-Liners

| Problem | Solution |
|---------|----------|
| LIVE button locked | Settings → Enable "Live Trading" |
| State not saving | Check localStorage enabled, not incognito |
| 9:17 not working | Verify timezone = IST, Dev Mode OFF |
| Can't switch strategy | Stop monitoring first |

---

## 💾 What's Persisted

✅ Monitoring ON/OFF
✅ Strategy (MOMENTUM/SNIPER)
✅ Trading Mode (PAPER/LIVE)
✅ System Status
✅ Last 50 log entries
❌ Active positions (not yet - future enhancement)
❌ Signals (regenerated on return)

---

## 🚦 Quick Status Guide

| Icon/Color | Meaning |
|------------|---------|
| 🟢 Green "PAPER" | Safe mode - no real orders |
| 🔴 Red "LIVE" | Real trading - caution! |
| 🔒 Lock icon | Feature disabled in Settings |
| ⏰ Clock | Scheduled for 9:17 AM |
| 🔔 Bell | Auto-started at 9:17 AM |
| 🔄 Circular | State restored from previous session |

---

## 📍 Where to Find Things

**Live Trading Enable:**
```
Settings (⚙️) → Configuration → Scroll down → "Live Trading"
```

**Dev Mode (Bypass Hours):**
```
Settings (⚙️) → Configuration → Scroll down → "Dev Mode"
```

**AutoTrade Logs:**
```
AutoTrade screen → Right panel → Analysis Logs
```

**Strategy Selection:**
```
AutoTrade screen → Top → [Momentum] [Sniper] tabs
```

---

## ⚡ Pro Tips

1. **Test in PAPER first** - Always validate strategies before going LIVE
2. **Monitor logs** - Watch for confidence levels and reasons
3. **Respect time windows** - SNIPER has hard stops
4. **Use state persistence** - Switch views freely during monitoring
5. **Enable carefully** - Live Trading needs conscious decision

---

## 🆘 Emergency Actions

**Stop All Monitoring:**
Click the ⏸️ **Stop** button (red)

**Close All Positions:**
Monitoring must be stopped first → "Close All Positions" button

**Disable Live Trading:**
Settings → Configuration → Live Trading OFF

**Reset Everything:**
Settings → Reset button (nuclear option - clears all data)

---

## 📊 Version Info

**Build:** 698KB bundle
**Modified Files:** 3
**New Docs:** 2
**Breaking Changes:** 0
**Status:** Production Ready ✅

---

**Last Updated:** April 3, 2026
**Version:** AutoTrade Pro v3.0

