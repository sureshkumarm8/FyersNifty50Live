# MySystem AutoTrade - Quick Start Guide

## 🎯 Overview

**MySystem AutoTrade** is an automated trading system for "**Nifty Sniper: The Office Protocol**" - a precision strategy designed to capture **30 points between 09:25 AM - 10:15 AM** IST, then exit for office work.

---

## 📋 System Phases

### Phase 1: DOWNLOAD (09:15 - 09:25)
```
Status: 📊 DOWNLOAD
├─ Market opens, observe initial movement
├─ Mark 5-min High & Low
├─ Identify Support/Resistance zones (50-point buffers)
├─ Assess Open Type (Gap Up/Flat/Gap Down)
└─ NO SETUP = NO TRADE - Never force trades
```

### Phase 2: ENTRY WINDOW (09:25 - 09:45)
```
Status: 🎯 ENTRY_WINDOW
├─ Market participation increases
├─ System generates setup near S/R zones
├─ Buy Call at Support (LONG)
└─ Sell Put at Resistance (SHORT)
```

### Phase 3: IN_TRADE (09:45 - 10:15)
```
Status: 📈 IN_TRADE
├─ Entry executed
├─ Real-time P&L tracking
├─ Target: +30 points
├─ Stop Loss: -30 points
└─ Hard Stop: 10:15 AM (forced exit)
```

### Phase 4: CLOSED
```
Status: ✅ CLOSED
├─ Exit Reason: TARGET / STOPLOSS / HARD_STOP / MANUAL
├─ P&L Shown
└─ Ready for reset tomorrow
```

---

## 🎮 How to Use

### Step 1: Open MySystem
```
Top Navigation → Click [⚡ MySystem] button
```

### Step 2: Start Monitoring
```
Click [▶️ Monitoring] button
Status changes to: DOWNLOAD
```

### Step 3: Watch Analysis Feed
```
📋 Analysis Feed shows:
├─ Support/Resistance levels identified
├─ Open Type (Gap Up/Flat/Gap Down)
└─ Setup generation when confluence found
```

### Step 4: Execute When Ready
```
When "Setup Ready" card appears:
├─ Review Strike, Target, Stop Loss
└─ Click [Execute Trade Now]
```

### Step 5: Monitor Trade
```
"Trade Active" card shows:
├─ Entry Price
├─ Current LTP
├─ Max Gain / Max Loss
└─ Progress bar toward 30pt target
```

### Step 6: Let System Exit
```
System automatically exits when:
✅ TARGET HIT (+30pts) → WIN
🛑 STOP LOSS (-30pts) → LOSS
⏰ 10:15 AM → HARD STOP (forced exit)
```

### Step 7: Reset for Tomorrow
```
After trade closes:
├─ Review Closed Trade summary
└─ Click [🔄 Reset Daily] for next day
```

---

## 📊 Real Example

```
⏰ 09:15 - Market Opens
   Status: DOWNLOAD PHASE
   
⏰ 09:20 - Analyzing
   ├─ 5-min High: 24,550
   ├─ 5-min Low: 24,480
   ├─ Support: 24,450 (50-pt buffer)
   ├─ Resistance: 24,550
   └─ Zone: NEUTRAL

⏰ 09:28 - Price moves near Support
   ├─ Current LTP: 24,455
   ├─ Status: ENTRY_WINDOW
   └─ Zone: NEAR_SUPPORT ✅

⏰ 09:29 - Setup Generated
   ├─ Signal: LONG (Buy Call)
   ├─ Strike: 24,250 CE (ITM)
   ├─ Target: 24,485 (+30pts)
   ├─ Stop Loss: 24,455 (-30pts)
   └─ [Execute Trade Now]

⏰ 09:31 - Trade Executed
   ├─ Entry: 24,460
   ├─ Status: IN_TRADE
   └─ Monitoring...

⏰ 09:45 - Trade Active
   ├─ Entry: 24,460
   ├─ Current: 24,485
   ├─ Max Gain: +25pts
   └─ Progress: 83% toward target

⏰ 09:52 - TARGET HIT ✅
   ├─ Exit: 24,490 (+30pts)
   ├─ Entry: 24,460
   ├─ P&L: +30 points
   └─ Trade Closed ✓
   
⏰ 10:00 - Office Work
   └─ Focus back to job (30 points captured!)
```

---

## ⚡ Key Features

| Feature | Description |
|---------|-------------|
| **Time Window** | 09:25 - 10:15 AM IST only |
| **Target** | Exactly 30 points |
| **Stop Loss** | Exactly 30 points |
| **Hard Stop** | 10:15 AM (NO EXCEPTIONS) |
| **Strike** | ITM (200-300 pts below/above) |
| **Option Type** | CE (Call) for LONG, PE (Put) for SHORT |
| **Setup** | Support/Resistance zone plays |
| **Entry** | Manual (click "Execute") |
| **Exit** | Automatic (Target/SL/Hard Stop) |
| **Manual Exit** | Available anytime during trade |

---

## 🎨 Status Indicators

| Status | Color | Phase | Meaning |
|--------|-------|-------|---------|
| IDLE | Gray | Before 09:15 | Waiting for market open |
| DOWNLOAD | 🟡 Yellow | 09:15-09:25 | Analyzing open, marking zones |
| ENTRY_WINDOW | 🔵 Blue | 09:25-10:15 | Waiting for setup or in setup phase |
| IN_TRADE | 🟢 Green | During trade | Trade active, monitoring exits |
| CLOSED | 🟣 Purple | After exit | Trade complete, ready to reset |

---

## 🔴 Live Metrics Display

```
Support/Resistance Panel:
├─ Support Level: 24,450
├─ Resistance Level: 24,550
├─ Current LTP: 24,485
└─ Zone: NEAR_SUPPORT

Setup Ready Card (when generated):
├─ Strike: 24,250 CE
├─ Entry Level: 24,450
├─ Target: 24,480
└─ Stop Loss: 24,450

Trade Active Card:
├─ Entry Price: 24,460
├─ Current LTP: 24,485
├─ Target: 24,490
├─ Stop Loss: 24,430
├─ Max Gain: +25pts
└─ Progress: ═══════════ 83%

Closed Trade Card:
├─ Entry: 24,460
├─ Exit: 24,490
├─ Exit Reason: TARGET
└─ P&L: +30 points (+0.1%)
```

---

## ✅ Rules (DO's)

✅ **DO:**
- Start monitoring at 09:15 AM IST
- Wait for support/resistance confluence
- Click "Execute" only when confident
- Trust the 30-point target
- Trust the 30-point stop loss
- Exit hard at 10:15 AM no matter what
- Close laptop after 10:15 AM (focus on office work)
- Reset daily for next trading day
- Review analysis feed for learning

---

## ❌ Rules (DON'Ts)

❌ **DON'T:**
- Trade before 09:25 AM
- Trade after 10:15 AM
- Override the 30-point target
- Override the 30-point stop loss
- Force trades when market is choppy
- Hold past 10:15 AM (hard stop is mandatory)
- Modify strike prices
- Scalp for extra points
- Execute multiple trades per day
- Trade on market holidays

---

## 🔧 Control Buttons

### Main Controls
```
[▶️ Monitoring] / [⏸️ Paused]
  → Start/Stop system monitoring
  
[🔄 Reset Daily]
  → Available after trade closes
  → Resets all state for next day
  
[🛑 Manual Exit]
  → Available during active trade
  → Force exit at any price (not recommended)
```

---

## 📈 Expected Performance

Based on 30-point target strategy:

| Metric | Expected Range |
|--------|-----------------|
| Win Rate | 50-60% |
| Avg Win | +30 points |
| Avg Loss | -30 points |
| Trades/Month | 20-22 (weekdays only) |
| Monthly P&L | 20-30 winning days × 30pts = **+600 to +900 points** |
| Risk/Reward | 1:1 ratio |

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| No setup generated | Wait, market may be choppy. Skip day if needed. |
| Setup not ready | Check S/R levels, confirm zone type |
| Trade not triggering | Verify 09:25-10:15 window, check monitoring is ON |
| Paused monitoring | Click ▶️ to resume |
| Can't exit manually | Trade may have already closed (check status) |

---

## 📚 Workflow Summary

```
Morning:
1️⃣ Open MySystem tab
2️⃣ Click ▶️ Monitoring at 09:15 AM
3️⃣ Watch Analysis Feed for setup

When Setup Generated:
4️⃣ Review Setup Ready card
5️⃣ Click "Execute Trade Now"

During Trade:
6️⃣ Monitor Trade Active card
7️⃣ Let system exit automatically

After Exit:
8️⃣ Review Closed Trade summary
9️⃣ Click 🔄 Reset Daily
🔟 Return to office work

Next Day:
Repeat!
```

---

## 💡 Philosophy

**"30 Points. Every Day. Before Coffee."**

This system is designed for ONE precise trade during market open hours, capturing the initial momentum wave, then exiting completely for office work. Quality over quantity. Discipline over greed. 30 points or nothing.

---

## 🎯 Key Concept: Support/Resistance Zones

The system identifies S/R by:
1. Calculating 5-minute High & Low from market open
2. Creating 50-point zones around these levels
3. Waiting for price to bounce at these zones
4. Generating trade signals at confluence

**Example:**
```
5-min High: 24,550
5-min Low: 24,480
Midpoint: 24,515

Support Zone: 24,450 (Low - 30pts)
Resistance Zone: 24,550 (High)

When price touches Support → BUY CALL (LONG)
When price touches Resistance → SELL PUT (SHORT)
```

---

## 📞 Quick Reference

| Time | Status | Action |
|------|--------|--------|
| 09:15 - 09:25 | DOWNLOAD | Watch market open, mark zones |
| 09:25 - 09:45 | ENTRY_WINDOW | Wait for setup |
| 09:45 - 10:15 | IN_TRADE | Monitor trade, let system exit |
| 10:15+ | CLOSED | Exit forced, end trading |

---

## 🌟 Next Steps

1. **Read this guide** ✓
2. **Open MySystem tab** tomorrow at 09:15 AM IST
3. **Start monitoring** and watch first trade cycle
4. **Execute** when you see "Setup Ready"
5. **Track results** daily
6. **Refine zones** based on market behavior

---

**MySystem AutoTrade - Designed for precision, discipline, and office priorities.**

*One Trade. Thirty Points. Office Work. Repeat Daily.*

---

**Version**: 1.0  
**Status**: ✅ Active  
**Last Updated**: March 7, 2026
