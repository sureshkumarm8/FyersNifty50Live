# AutoTrade.AI - Intelligent One-Trade-Per-Day System

## Overview

**AutoTrade.AI** is a precision-focused automated trading system designed for NIFTY50 options trading. It executes exactly **one high-confidence trade per day** with intelligent entry/exit management, using multi-factor analysis on real market data.

### Core Philosophy
- **One Trade Only**: Focuses all analysis energy on a single perfect setup
- **Precision Entry**: Waits for exact confluence of technical + flow + volatility signals
- **Managed Exit**: Automatic target/stop-loss or EOD closure
- **ITM Strategy**: Option buyers only (200-300 points In-The-Money)
- **Next Week Expiry**: Always uses upcoming Thursday expiry for better option pricing

---

## How It Works

### Phase 1: Continuous Monitoring (Every 5 Minutes)

The system analyzes 5 key dimensions continuously:

#### 1. **Momentum Analysis**
- **15-minute price movement**: Tracks last 15 snapshots
- **Direction**: +15pts (Bullish) or -15pts (Bearish)
- **Strength**: Compares against volatility threshold

#### 2. **Sentiment Analysis**
- **Overall Sentiment**: Weighted breadth (Buy strength vs Sell strength)
  - `> +15%` = Bullish consensus
  - `< -15%` = Bearish consensus
- **Option Flow**: Call buying vs Put buying
  - Confirms or diverges from price movement

#### 3. **PCR (Put-Call Ratio) Confluence**
- `PCR > 1.0`: More put buyers = Support zone (BULLISH)
- `PCR < 0.8`: More call buyers = Resistance zone (BEARISH)
- Acts as volatility and accumulation signal

#### 4. **Pivot Level Analysis**
- **Support (S1)**: Reversal buying zone at support
- **Resistance (R1)**: Reversal selling zone at resistance
- **Pivot**: Neutral/inflection point

#### 5. **Stock Health Score**
- Average net strength of Nifty 50 stocks
- Indicates overall index health (50 = neutral, 0-50 = weak, 50-100 = strong)

### Phase 2: Signal Generation (When Confidence > 60%)

#### **LONG Setup** ✅
Triggered when ALL conditions met:
- Price move: `> +15 pts`
- Sentiment: `> +15%`
- Option Flow: `> +20%`
- PCR: `> 1.0`
- **Trade**: Buy ITM Call (CE) 250pts below current price
- **Confidence**: 75-95%

#### **SHORT Setup** ✅
Triggered when ALL conditions met:
- Price move: `< -15 pts`
- Sentiment: `< -15%`
- Option Flow: `< -20%`
- PCR: `< 0.8`
- **Trade**: Buy ITM Put (PE) 250pts above current price
- **Confidence**: 75-95%

#### **Reversal Setup** ⚡
At support/resistance with diverging flows:
- Price near S1 (Support) + Strong put buying → Buy Call
- Price near R1 (Resistance) + Strong call buying → Buy Put
- **Confidence**: 65%

---

## Trade Execution Parameters

### Strike Selection (ITM 200-300 Points)

**Why ITM?**
- Better liquidity than OTM
- High delta (0.85+) tracks spot movement closely
- Lower time decay impact
- Higher win probability

**Example Setup:**
```
Nifty LTP: 24,500
ATM Strike: 24,500 (500 multiplier)
Selected Strike for LONG: 24,250 CE (250pts ITM)
Premium paid: ~250 (estimated, option dependent)
```

### Target & Stop Loss

Based on **ATR (Average True Range)** × Volatility:

```
Volatility = Standard deviation of 20 last price changes
ATR = Volatility × Current Price × 0.01

Target = 1.5 × ATR from entry
Stop Loss = 0.75 × ATR from entry
Risk/Reward = 1.5:1 minimum
```

### Expiry Date

**Always uses Thursday of next week:**
```
Today = Friday → Expiry = Next Thursday (8 days)
Today = Monday → Expiry = Next Thursday (3 days)
Today = Thursday → Expiry = Next Thursday (7 days)
```

Benefits:
- Better premium prices
- Sufficient time for setup to develop
- Avoids expiry day volatility

---

## Trade Monitoring & Exit Rules

### Real-Time Monitoring

System tracks:
1. **Maximum Gain Since Entry**: Peak profit level reached
2. **Maximum Loss Since Entry**: Worst level reached
3. **Runup LTP**: Highest price during trade (for LONG)
4. **Drawdown LTP**: Lowest price during trade (for SHORT)
5. **Performance Bar**: Visual representation of risk/reward

### Automatic Exit Triggers

#### ✅ **TARGET HIT**
- LONG: When `Current LTP >= Target LTP`
- SHORT: When `Current LTP <= Target LTP`
- **Result**: WIN

#### 🛑 **STOP LOSS HIT**
- LONG: When `Current LTP <= Stop Loss`
- SHORT: When `Current LTP >= Stop Loss`
- **Result**: LOSS

#### ⏱️ **END OF DAY**
- Automatic exit at **3:15 PM IST** (market close - 15 min)
- Closes trade regardless of P&L
- **Result**: EOD Exit

### Manual Override

You can manually exit at any time:
- Useful if market structure changes dramatically
- Click "Manual Exit" button during active trade
- Trade closes at current LTP

---

## Daily Workflow

### Morning (9:15 AM onwards)
1. System enters **Monitoring** mode
2. Continuously analyzes market data every 5 minutes
3. Displays analysis logs in real-time
4. Shows current market context (Sentiment, PCR, etc.)

### Setup Ready (Example: 10:30 AM)
```
Trade Setup Generated:
├─ Signal: LONG
├─ Strike: 24,250 CE
├─ Confidence: 82%
├─ Target: 24,560
├─ Stop Loss: 24,440
├─ Reasoning: STRONG_BULL | ITM: 250pts | R/R: 1.5
└─ [Execute Trade Now] Button
```

### Manual Execution
- Review setup parameters
- Click "Execute Trade Now"
- System tracks trade immediately

### Active Trade (Example: 10:45 AM - 2:30 PM)
```
Trade Active (25 min running)
├─ Entry Price: ₹250
├─ Current LTP: 24,520 (+25pts)
├─ Max Gain: +75pts
├─ Max Loss: -5pts
└─ [Manual Exit] Button available
```

### Trade Closed (Example: 11:15 AM)
```
Target HIT at 24,560
├─ Entry: ₹250
├─ Exit: ₹325
├─ P&L: ₹75 | +30%
├─ Exit Reason: TARGET
└─ Daily trade completed ✓
```

---

## Status Indicators

### Upper Status Bar

| Status | Meaning |
|--------|---------|
| **IDLE** | Waiting to start monitoring |
| **MONITORING** | Watching for signals, no trade yet |
| **ANALYZING** | Running multi-factor analysis |
| **ENTRY_TRIGGERED** | Setup generated, awaiting execution |
| **IN_TRADE** | Trade active, monitoring P&L |
| **EXIT_TRIGGERED** | Exit condition hit, trade closing |
| **CLOSED** | Daily trade complete |

### Visual Indicators

- 🟢 **Green Status**: Trade active and profitable
- 🟡 **Amber Status**: Setup ready or no setup yet
- 🔵 **Blue Status**: Trade closed successfully
- 🔴 **Red Status**: Trade in loss or stopped out

---

## Analysis Feed (Live Log)

Real-time analysis events displayed chronologically:

```
[10:30:15] 📊 Analysis Cycle #5 starting...
[10:30:15] 📈 Price Movement: +18.50 pts | Sentiment: 22.30%
[10:30:15] 🌪️  Volatility: 1.25% | ATR: 30.62 pts
[10:30:15] 🎯 Pivot Level: NEUTRAL | Flow: CONFIRMED | Stock Health: 68
[10:30:15] ✅ BULLISH SETUP: Momentum + Sentiment + PCR Confluence
[10:30:15] 🎯 TRADE SETUP GENERATED: LONG CE @ 24250 | Conf: 82%
[10:45:30] 🚀 TRADE EXECUTED: LONG CE @ 24250 | Entry: 250.00
[11:15:45] ✅ TARGET HIT at 24560.00 | Exit: 325.00
[11:15:45] Daily session complete - Next trade tomorrow
```

---

## Market Context Panel (Right Side)

Real-time market snapshot:

| Metric | Usage |
|--------|-------|
| **Current LTP** | Spot price of NIFTY50 |
| **1H Change** | Price movement in last hour |
| **Sentiment** | Overall market momentum |
| **PCR** | Put-Call ratio for options |

---

## Daily Summary

After trade closure, displays:
- **Analysis Count**: How many analysis cycles ran
- **Trade Executed**: Yes/No
- **Expiry Date**: Thursday date used
- **Strategy Type**: Always "ITM Long"

---

## Control Buttons

### Top Right Corner

| Button | Function |
|--------|----------|
| **▶️ Play/Pause** | Resume/Pause live monitoring |
| **🔄 Refresh** | Manual data refresh |
| **🔄 Reset** | Reset daily session for next day |

---

## Performance Tracking

### Trade Metrics (During Active Trade)

```
Performance Bar: ═══════════════════ 40%
↑ Shows progress toward target

Max Gain: +75pts (best level reached)
Max Loss: -5pts (worst level reached)
```

### Closed Trade Summary

```
Setup: LONG CE @ 24,250
Entry Price: ₹250
Exit Price: ₹325
Exit Reason: TARGET ✓
P&L: +₹75
Return %: +30%
```

---

## Best Practices

### ✅ DO's
1. **Start monitoring at 9:15 AM IST** - Allow system warm-up
2. **Wait for 60%+ confidence** - Don't execute marginal setups
3. **Review analysis logs** - Understand trade reasoning
4. **Use target/stop loss** - Don't hold past market hours
5. **Trade only when setup is clear** - Skip uncertain days
6. **Monitor active trades** - Watch for execution quality

### ❌ DON'Ts
1. **Don't execute before market warmup** - Data unreliable in first 15 mins
2. **Don't override system exits** - Trust the stop loss
3. **Don't trade multiple times** - One trade per day maximum
4. **Don't scalp the trade** - Let it run to target/stop loss
5. **Don't modify stop loss** - Breaks risk management
6. **Don't trade against confirmed setup** - Wait for next day

---

## Configuration

### In Settings Screen

| Setting | Purpose | Default |
|---------|---------|---------|
| **AI Enabled** | Use AI analysis | ON |
| **Refresh Interval** | Data update frequency | 30 sec |
| **Bypass Market Hours** | Test after hours | OFF |
| **API Keys** | Market data access | Required |

---

## Risk Management

### Per-Trade Risk Model

```
Max Risk Per Trade = 2% of account
Position Size = Max Risk / Stop Loss Points

Example:
Account: ₹1,00,000
Max Risk: ₹2,000 (2%)
Stop Loss: 50 points
Contracts: 2,000/50 = 40 points of exposure
```

### Daily Limits

- **One trade per day**: Prevents overtrading
- **Set exit times**: Don't hold past 3:15 PM
- **No re-entry**: After exit, wait for next day

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No setup generated | Wait for stronger confluence (< 5 times per hour normal) |
| Setup confidence too low | System requires 60%+ to execute |
| Trade didn't trigger | Check if market is open (9:15 AM - 3:30 PM IST) |
| Exit not triggered | Verify stop loss & target levels in setup |
| Monitoring paused | Click Play button to resume |
| Historical analysis | Check Analysis Feed log for decision reasoning |

---

## Future Enhancements

Potential improvements:
- [ ] Real order placement integration
- [ ] Multiple symbol support (beyond NIFTY50)
- [ ] Machine learning signal optimization
- [ ] Weekly/Monthly strategy variations
- [ ] Drawdown protection logic
- [ ] Account size-based position sizing
- [ ] Discord/Telegram notifications
- [ ] Trade performance analytics dashboard

---

## Support & Feedback

For issues or feature requests:
1. Check Analysis Feed for error messages
2. Verify API credentials in Settings
3. Ensure market hours (9:15 AM - 3:30 PM IST)
4. Review this guide for expected behavior

---

**AutoTrade.AI** - *One Perfect Trade Every Day*

Last Updated: March 2026
