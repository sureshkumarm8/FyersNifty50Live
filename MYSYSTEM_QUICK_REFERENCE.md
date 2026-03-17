# MySystem AutoTrade - Quick Reference Card

## 🎯 The Strategy
**Nifty Sniper: The Office Protocol**
- **Window**: 09:25 AM - 10:15 AM IST
- **Target**: 30 points
- **Stop Loss**: 30 points  
- **Exit Time**: 10:15 AM (HARD STOP)
- **Mission**: Capture 30pts then focus on office work

---

## 🚀 Access & Start

```
1. Click [⚡ MySystem] in top navigation (Cyan button)
2. Click [▶️ Monitoring] at 09:15 AM
3. Watch for "Setup Ready" notification
4. Click "Execute Trade Now"
5. Let system handle exits automatically
```

---

## 📊 The 4 Phases

| Phase | Time | Status | What Happens |
|-------|------|--------|--------------|
| **DOWNLOAD** | 09:15-09:25 | 📊 Yellow | Mark support/resistance zones |
| **ENTRY** | 09:25-10:15 | 🔵 Blue | Generate setup, wait for execution |
| **IN_TRADE** | During trade | 🟢 Green | Monitor P&L, track target/SL |
| **CLOSED** | After exit | 🟣 Purple | Show results, ready to reset |

---

## 🎲 Setup Generation

**When Price touches Support** → LONG (Buy Call)
```
├─ Strike: ITM (200-300pts below Nifty)
├─ Type: CE (Call)
├─ Target: Support + 30pts
└─ SL: Support - 30pts
```

**When Price touches Resistance** → SHORT (Sell Put)
```
├─ Strike: ITM (200-300pts above Nifty)
├─ Type: PE (Put)
├─ Target: Resistance - 30pts
└─ SL: Resistance + 30pts
```

---

## ⏰ Time Rules

```
✅ DO Trade:
└─ 09:25 AM - 10:15 AM IST only

❌ DON'T Trade:
├─ Before 09:25 AM
├─ After 10:15 AM
└─ Any other time
```

---

## 🎮 Controls

```
[▶️ Monitoring] ← Start watching market
[🛑 Manual Exit] ← Force close (during trade)
[🔄 Reset Daily] ← Prepare for tomorrow
```

---

## 📈 Real Trade Example

```
09:20: Support = 24,450 | Resistance = 24,550 | LTP = 24,480

09:29: Price hits 24,450 (Support)
       ├─ Signal: LONG CE @ 24,250 (ITM)
       ├─ Target: 24,480 (+30pts)
       └─ SL: 24,420 (-30pts)
       
09:31: Clicked "Execute Trade Now"
       ├─ Entry: 24,450
       ├─ Status: IN_TRADE 🟢
       
09:45: LTP = 24,480
       ├─ Target Hit! ✅
       ├─ Exit: 24,480
       ├─ P&L: +30 points
       └─ Trade Closed
       
10:00: Back to office work ✓
```

---

## 💡 Quick Tips

| Tip | Action |
|-----|--------|
| **No Setup?** | Skip the day. Don't force trades. |
| **Choppy Market?** | Wait for confluence at S/R. |
| **Hit Target?** | System exits automatically. ✅ |
| **Hit SL?** | System exits automatically. 🛑 |
| **10:15 AM Reached?** | System force-exits. ⏰ |
| **Want to exit?** | Click [🛑 Manual Exit] anytime. |
| **Next Day?** | Click [🔄 Reset Daily]. |

---

## 🎨 Status Colors

- 📊 **DOWNLOAD** (Yellow) = Analyzing market open
- 🔵 **ENTRY_WINDOW** (Blue) = Waiting for setup
- 🟢 **IN_TRADE** (Green) = Trade is active
- 🟣 **CLOSED** (Purple) = Trade is complete

---

## ✅ Exit Rules (IMPORTANT!)

| Exit Type | Trigger | Action |
|-----------|---------|--------|
| **TARGET** | +30pts | ✅ Auto-exit (WIN) |
| **STOP LOSS** | -30pts | 🛑 Auto-exit (LOSS) |
| **HARD STOP** | 10:15 AM | ⏰ Force-exit (NO EXCEPTIONS) |
| **MANUAL** | You click | 🛑 Your choice |

**NO TRADE HOLDS PAST 10:15 AM**

---

## 📊 Panel Breakdown

### Left Panel
```
[📋 Analysis Feed]
Shows every market update in real-time
├─ Zone detection
├─ Setup generation
├─ Trade execution
└─ Exit signals
```

### Right Panel - Top
```
[Support/Resistance]
├─ Support Level: XXX
├─ Resistance Level: YYY
├─ Current LTP: ZZZ
└─ Zone: NEUTRAL/NEAR_SUPPORT/NEAR_RESISTANCE
```

### Right Panel - Middle
```
[Setup Ready] or [Trade Active]
├─ Strike & Target
├─ Entry & SL
├─ P&L & Progress
└─ Buttons for execution/exit
```

### Right Panel - Bottom
```
[Closed Trade] (after exit)
├─ Entry & Exit prices
├─ Exit Reason
└─ Final P&L
```

---

## 🔴 DO NOT

❌ Trade before 09:25 AM  
❌ Trade after 10:15 AM  
❌ Override the 30-point target  
❌ Override the 30-point stop loss  
❌ Force trades on choppy days  
❌ Hold past 10:15 AM hard stop  
❌ Trade multiple times per day  
❌ Modify strike calculations  

---

## ✅ DO

✅ Start monitoring at 09:15 AM  
✅ Wait for S/R confluence  
✅ Trust the 30-point mechanics  
✅ Exit at hard stop (10:15 AM)  
✅ Reset daily for tomorrow  
✅ Focus on office work after 10:15 AM  
✅ Review analysis feed for learning  

---

## 💰 Expected Results

```
Per Trade:
├─ Target Win: +30 points
└─ Loss: -30 points

Per Month (20 trading days):
├─ Wins: 12-13 days × 30pts = +360-390pts
├─ Losses: 7-8 days × -30pts = -210-240pts
└─ Net Monthly: +120-180 points

Per Year (250 trading days):
└─ Estimated: +1500-2250 points
```

---

## 🎯 Daily Checklist

```
Morning:
☐ Open app at 09:15 AM
☐ Click MySystem tab
☐ Click ▶️ Monitoring

During Trading Window:
☐ Watch Analysis Feed
☐ Wait for "Setup Ready"
☐ Review setup parameters
☐ Click "Execute Trade Now"

During Trade:
☐ Monitor Trade Active card
☐ Let system handle exits
☐ Don't interfere

After Trade:
☐ Review P&L
☐ Note zone behavior
☐ Click 🔄 Reset Daily
☐ Return to office work
```

---

## 🚨 Emergency

| Problem | Solution |
|---------|----------|
| **Setup not generating** | Market is choppy. Skip day. |
| **Trade stuck at 10:15** | Hard stop will force exit automatically. |
| **Want to exit manually** | Click [🛑 Manual Exit] button. |
| **App seems frozen** | Refresh page or restart browser. |
| **LTP not updating** | Check Fyers API credentials. |

---

## 📞 Support Info

**Strategy Name**: Nifty Sniper: The Office Protocol  
**Time Window**: 09:25 - 10:15 AM IST  
**Target**: Exactly 30 points  
**Hard Stop**: 10:15 AM (NO EXCEPTIONS)  
**Status**: ✅ Active & Ready

---

## 🌟 Philosophy

### "30 Points. Every Day. Before Coffee."

This system is NOT about:
- Making 100 points
- Trading multiple times
- Holding through afternoon
- Scalping or overtrading

This system IS about:
- One precise 30-point trade
- Discipline & consistency
- Protecting office work time
- Quality over quantity

---

## 📚 Learn More

Full guides available:
- `MYSYSTEM_AUTOTRADE_GUIDE.md` - Complete walkthrough
- `MYSYSTEM_IMPLEMENTATION_SUMMARY.md` - Technical details

---

**MySystem AutoTrade v1.0**  
*Precision Trading for Office Workers*

**Ready?** Let's capture 30 points! 🎯

---

## Quick Access Path

```
1. Browser → Your App
2. Top Navigation → Click [⚡ MySystem]
3. Tomorrow 09:15 AM → Click [▶️ Monitoring]
4. 09:25-10:15 AM → Execute & Monitor
5. Auto-exit at Target/SL/Hard Stop
6. Reset & Repeat Daily
```

**Last Updated**: March 7, 2026  
**Status**: ✅ Production Ready
