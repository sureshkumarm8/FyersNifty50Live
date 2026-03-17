# AutoTrade.AI - Quick Reference Card

## 🎯 One Trade Per Day | Precision Strategy

```
═══════════════════════════════════════════════════════════════
                    AUTOTRADE.AI QUICK GUIDE
═══════════════════════════════════════════════════════════════
```

### 📊 Signal Generation Requirements

**LONG SETUP** ✅ (Buy Call - ITM)
```
Price Move:     > +15 pts
Sentiment:      > +15%
Option Flow:    > +20%
PCR:            > 1.0
Confidence:     75-95%
Strike:         ATM - 250pts (ITM)
Expiry:         Next Thursday
```

**SHORT SETUP** ✅ (Buy Put - ITM)
```
Price Move:     < -15 pts
Sentiment:      < -15%
Option Flow:    < -20%
PCR:            < 0.8
Confidence:     75-95%
Strike:         ATM + 250pts (ITM)
Expiry:         Next Thursday
```

---

### 🚀 Trade Execution Timeline

```
09:15 AM ─────── Market Opens
  │
  └─→ System enters MONITORING mode
      Analyzes every 5 minutes
      
10:00 AM - 02:00 PM (Typical Setup Generation)
  │
  └─→ Confluence detected
      SETUP READY notification
      Shows: Strike, Target, Stop Loss
      
USER REVIEWS & CLICKS:
  │
  └─→ "Execute Trade Now"
      Trade goes ACTIVE
      Real-time P&L tracking
      
Exit Triggers:
  ├─→ TARGET HIT   ✅ WIN
  ├─→ STOP LOSS    🛑 LOSS
  └─→ 03:15 PM     ⏱️  EOD EXIT
      
Daily Trade Complete ✓
```

---

### 📈 Strike Selection Rule

**Always ITM 200-300 Points**

```
Current Nifty LTP: 24,500
ATM Strike (50pt): 24,500 CE/PE

LONG Setup:
├─ Strike: 24,250 CE  ← 250pts BELOW (ITM)
├─ Why: Higher delta (0.85+), better liquidity
└─ Premium: ~250 points

SHORT Setup:
├─ Strike: 24,750 PE  ← 250pts ABOVE (ITM)
├─ Why: Tracks spot closely, liquid
└─ Premium: ~250 points
```

---

### 🎲 Risk/Reward Calculation

```
Volatility = Std Dev of last 20 price changes
ATR = Volatility × Price × 0.01

Target Distance: 1.5 × ATR
Stop Loss: 0.75 × ATR
Risk/Reward: 1.5:1 minimum

Example:
├─ Current: 24,500
├─ ATR: 30 points
├─ Target: 24,545 (+1.5×30)
├─ SL: 24,478 (-0.75×30)
└─ R/R: 1.5:1 ✓
```

---

### 🎨 Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| MONITORING | 🟡 Yellow | Analyzing, waiting for signal |
| ENTRY_TRIGGERED | 🟡 Amber | Setup ready, awaiting execution |
| IN_TRADE | 🟢 Green | Trade active |
| CLOSED | 🔵 Blue | Trade complete |

**Top Bar Shows:**
```
[Brain Icon] AutoTrade.AI
├─ Live Feed       │  Status Badge  │  ▶️ Play   │  ⚙️ Settings
│                  │  MONITORING    │  🔄 Reset │
│                  │                │            │
```

---

### 📋 Active Trade Display

```
┌─────────────────────────────────────────┐
│ Setup Ready                              │
├─────────────────────────────────────────┤
│ LONG CE @ 24,250                         │
│ Confidence: 82%                          │
│ Reasoning: STRONG_BULL | ITM: 250pts    │
├─────────────────────────────────────────┤
│ Strike: 24,250  │  Target: 24,545       │
│ Confidence: 82% │  Stop Loss: 24,478    │
├─────────────────────────────────────────┤
│ [Execute Trade Now] ◄── Click to Start  │
└─────────────────────────────────────────┘
```

---

### 🔴 During Trade Monitoring

```
┌─────────────────────────────────────────┐
│ Trade Active (18 min running)            │
├─────────────────────────────────────────┤
│ Entry Price: ₹250                        │
│ Current LTP: 24,520  (+25pts)            │
│ Max Gain: +75pts                         │
│ Max Loss: -5pts                          │
├─────────────────────────────────────────┤
│ Performance: ══════════════ 40%          │
└─────────────────────────────────────────┘
```

---

### ✅ Exit & Closed Trade

```
Target HIT at 24,560

Setup: LONG CE @ 24,250
Entry: ₹250
Exit: ₹325
Exit Reason: TARGET ✓

P&L: +₹75
Return: +30%

Next Trade Tomorrow
```

---

### 🔧 Control Panel

```
Top Right Corner:

[▶️] Play/Pause Monitoring
[🔄] Refresh Data
[🔄] Reset Daily
```

**During Trade:**
```
[🛑] Manual Exit
```

---

### 📊 Analysis Feed (Real-Time)

```
[10:30:15] 📊 Analysis Cycle #5...
[10:30:15] 📈 Price: +18.5pts | Sentiment: +22.3%
[10:30:15] 🌪️  Volatility: 1.25% | ATR: 30.62
[10:30:15] ✅ BULLISH SETUP: Confluence confirmed
[10:30:15] 🎯 SETUP: LONG CE @ 24250 | Conf: 82%
[10:45:30] 🚀 EXECUTED: Entry ₹250
[11:15:45] ✅ TARGET HIT: Exit ₹325 | +30%
```

---

### 💡 Key Rules to Remember

```
✅ DO's:
  • Start monitoring at 9:15 AM IST
  • Wait for 60%+ confidence setup
  • Trust the target & stop loss
  • One trade per day, maximum
  • Review analysis logs
  
❌ DON'Ts:
  • Don't trade outside 09:15-15:30 IST
  • Don't override system exits
  • Don't modify stop loss
  • Don't execute marginal setups
  • Don't scalp the trade
```

---

### 🎯 Daily Workflow

```
Morning Prep:
1. Open AutoTrade screen
2. Check API credentials in Settings
3. Verify market hours (9:15 AM IST start)
4. Click ▶️ to start monitoring

Waiting Phase:
- System continuously analyzes
- Look for "Entry_Triggered" status
- Review setup parameters

Execution:
- When confident, click "Execute"
- Monitor active trade in real-time

Exit:
- Let system handle exits (Target/SL)
- Or manual exit if needed

Review:
- Check closed trade summary
- Note analysis from feed
```

---

### 📱 Market Context Panel (Right Side)

```
Current LTP: 24,520.50
1H Change: +45.25 pts
Sentiment: +22.30%
PCR: 1.15

Daily Summary:
Analysis Count: 5
Trade Executed: ✓ Yes
Expiry Date: 20-Mar-2026
Strategy Type: ITM Long
```

---

### 🎓 Example: Full Trade Cycle

```
⏰ 09:15 AM - Market Opens
   └─ AutoTrade starts monitoring

⏰ 10:30 AM - Analysis Cycle
   ├─ Price up 18.5pts
   ├─ Sentiment +22.3%
   ├─ PCR 1.15 (bullish)
   └─ Confidence: 82% ✅

⏰ 10:30 AM - SETUP READY
   ├─ Signal: LONG
   ├─ Strike: 24,250 CE
   ├─ Target: 24,545
   ├─ Stop Loss: 24,478
   └─ [Execute Now]

⏰ 10:32 AM - TRADE ACTIVE
   ├─ Entry: ₹250
   ├─ Monitoring live P&L
   └─ Max Gain tracking: +75pts

⏰ 11:15 AM - TARGET HIT
   ├─ Current LTP: 24,560
   ├─ Exit at: ₹325
   ├─ Profit: +₹75 (+30%)
   └─ Trade Closed ✓

⏰ Next Day - New Setup
   └─ Reset and repeat
```

---

### 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| No setup | Increase monitoring time, wait for confluence |
| Low confidence | System requires 60%+, skip day if weak |
| Exit not hit | Check levels, confirm market moving properly |
| Paused | Click ▶️ button to resume |
| Error message | Check API credentials in Settings |

---

### 💰 Risk Management Template

```
Account Size: ₹1,00,000
Max Risk per Trade: 2% = ₹2,000

Trade Setup:
├─ Stop Loss Points: 50 pts
├─ Contracts: ₹2,000 ÷ 50 = 40 contracts
├─ Max Loss: ₹2,000
└─ Breakeven: Strike price

Position Sizing:
  Never exceed 2% account risk per trade
  Scale size with account growth
```

---

### 📞 Quick Buttons

```
During Setup:          During Trade:         After Close:
├─ Execute Trade       ├─ Manual Exit         ├─ View Summary
├─ View Details        ├─ Pause Monitor       ├─ Reset Daily
└─ Check Logs          └─ Check Metrics       └─ Next Day Setup
```

---

```
═══════════════════════════════════════════════════════════════
             AutoTrade.AI - One Perfect Trade Daily
                    Precision Over Frequency
═══════════════════════════════════════════════════════════════
```

**Remember:** The goal is ONE high-probability trade with excellent risk/reward, not multiple marginal setups. Quality over quantity. ✓

