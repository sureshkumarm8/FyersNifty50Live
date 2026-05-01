# AutoTrade.AI - System Architecture & Flow Diagrams

## 🏗️ Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         App.tsx                                │
│                    (Main Application)                          │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ viewMode === 'autotrade'
                          ↓
┌────────────────────────────────────────────────────────────────┐
│                      AutoTrade.tsx                              │
│              (Intelligent Trading System)                       │
└─────────────────────────┬──────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬────────────────┐
        ↓                 ↓                 ↓                ↓
    ┌────────┐      ┌───────────┐    ┌──────────┐    ┌──────────┐
    │Analysis│      │Trade      │    │Exit      │    │Dashboard │
    │Engine  │      │Executor   │    │Monitor   │    │Display   │
    └────────┘      └───────────┘    └──────────┘    └──────────┘
        │                 │                ↓                ↓
        │                 └────────┬───────┴─────────┬──────┘
        │                          ↓                 ↓
        └──────────────────→ Real-Time State ← Live Analytics
                           Management Module
                                   ↓
                           ┌──────────────────┐
                           │  UI Components   │
                           │  - Status Bar    │
                           │  - Setup Card    │
                           │  - Active Trade  │
                           │  - Analysis Feed │
                           │  - Market Panel  │
                           └──────────────────┘
```

---

## 🔄 Analysis Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│              CONTINUOUS 5-MINUTE ANALYSIS CYCLE                  │
└─────────────────────────────────────────────────────────────────┘

START (Every 5 minutes)
   │
   ├─→ PHASE 1: MOMENTUM ANALYSIS
   │   ├─ Collect last 15 snapshots (75 minutes)
   │   ├─ Calculate: Current LTP - Previous LTP
   │   └─ Output: priceMove (+/- points)
   │
   ├─→ PHASE 2: SENTIMENT ANALYSIS
   │   ├─ Overall Sentiment: (BullishWeight - BearishWeight) / Total
   │   ├─ Option Flow: Call sentiment - Put sentiment
   │   └─ Output: sentimentTrend, optionsSentiment (%)
   │
   ├─→ PHASE 3: PCR ANALYSIS
   │   ├─ PCR = Put Open Interest / Call Open Interest
   │   ├─ Interpret: > 1.0 (bullish), < 0.8 (bearish)
   │   └─ Output: pcr (decimal)
   │
   ├─→ PHASE 4: PIVOT ANALYSIS
   │   ├─ Calculate: S1, R1 levels
   │   ├─ Check: Is LTP near support or resistance?
   │   └─ Output: pivotConfluence (SUPPORT/RESISTANCE/NEUTRAL)
   │
   ├─→ PHASE 5: STOCK HEALTH
   │   ├─ Count: Bullish vs Bearish stocks in Nifty50
   │   ├─ Calculate: Average net strength
   │   └─ Output: healthScore (0-100)
   │
   └─→ SIGNAL GENERATION
       │
       ├─ IF (ALL conditions met):
       │   ├─→ Generate LONG or SHORT setup
       │   ├─→ Calculate confidence (75-95%)
       │   └─→ Emit: "ENTRY_TRIGGERED" status
       │
       ├─ ELSE IF (conditions improving):
       │   └─→ Continue monitoring
       │
       └─ ELSE:
           └─→ Maintain MONITORING status

```

---

## 📊 Signal Generation Logic Tree

```
┌─────────────────────────────────────────────────────────────────┐
│            MULTI-FACTOR SIGNAL GENERATION MATRIX                │
└─────────────────────────────────────────────────────────────────┘

                    CONFLUENCE CHECK
                          │
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
    MOMENTUM         SENTIMENT            PCR
      TREND          ANALYSIS            CONFLUENCE
        │                 │                │
        │                 │                │
   > +15pts          > +15% (Bullish)    > 1.0
        │                 │                │
        └─────────────────┼─────────────────┘
                          ↓
                    ALL MATCH? 
                          │
            ┌─────────────┴─────────────┐
            ↓                           ↓
          YES                          NO
            │                           │
            ↓                           ↓
        ┌─────────────┐        ┌──────────────────┐
        │  BULLISH    │        │  CHECK REVERSAL  │
        │   SIGNAL    │        │   PATTERNS       │
        └─────────────┘        └──────────────────┘
            │                           │
            ↓                           ↓
      Confidence:                 Price near S1
      75-95%                       + Flow signals
            │                           │
            │                ┌──────────┴──────────┐
            │                ↓                     ↓
            │          REVERSAL LONG        Continue Monitor
            │          Confidence: 65%
            │
            ├─→ STRIKE SELECTION:
            │   └─ CE 250pts ITM (BELOW current)
            │
            ├─→ ENTRY TRIGGER:
            │   ├─ Status: ENTRY_TRIGGERED
            │   ├─ Show Setup Card
            │   └─ Await User Execution
            │
            └─→ IF NOT EXECUTING:
                └─ CLEAR after new cycle if conditions break

Similar for SHORT setup (inverse of LONG)
```

---

## 💰 Trade Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               TRADE EXECUTION & MANAGEMENT CYCLE                │
└─────────────────────────────────────────────────────────────────┘

USER SEES: "ENTRY_TRIGGERED" + Setup Card
     │
     ├─ Reviews:
     │  ├─ Signal: LONG/SHORT
     │  ├─ Strike Price
     │  ├─ Confidence
     │  └─ Risk/Reward
     │
     └─→ CLICKS: "Execute Trade Now"
            │
            ├─ Calculate: Estimated Entry Price
            │  └─ Based on ITM amount × 0.3 (rough premium estimate)
            │
            ├─ Store: TradeExecution object
            │  ├─ setup: All parameters
            │  ├─ executedAt: Timestamp
            │  └─ executedPrice: Estimated entry
            │
            ├─ Update: autoTradeState
            │  └─ status: "IN_TRADE"
            │  └─ tradeActive: true
            │
            └─→ DISPLAY: Active Trade Card
                   │
                   ├─ Entry Price: ₹250
                   ├─ Current LTP: 24,520
                   ├─ Max Gain: Tracking
                   └─ Max Loss: Tracking
                   

DURING TRADE (Real-Time Monitoring):
   │
   ├─ Every snapshot arrival:
   │  ├─ Update current LTP
   │  ├─ Recalculate: Max Gain/Loss
   │  ├─ Recalculate: Runup/Drawdown
   │  └─ Check: Exit conditions?
   │
   ├─ EXIT CONDITION CHECK:
   │  │
   │  ├─ IF LTP >= TARGET:
   │  │  └─→ EXIT @ TARGET ✅ WIN
   │  │      └─ exitReason: "TARGET"
   │  │
   │  ├─ ELSE IF LTP <= STOPLOSS:
   │  │  └─→ EXIT @ STOPLOSS 🛑 LOSS
   │  │      └─ exitReason: "STOPLOSS"
   │  │
   │  ├─ ELSE IF Time >= 3:15 PM IST:
   │  │  └─→ EXIT @ CURRENT ⏱️ EOD
   │  │      └─ exitReason: "EOD"
   │  │
   │  └─ ELSE:
   │     └─ Continue monitoring
   │
   └─ Manual Override Available:
      └─ User can click "Manual Exit" anytime
         └─ Closes at current LTP


TRADE CLOSED:
   │
   ├─ Calculate: P&L
   │  ├─ For LONG: (Exit Price - Entry Price) × 100
   │  └─ For SHORT: (Entry Price - Exit Price) × 100
   │
   ├─ Calculate: P&L %
   │  └─ (Movement / ITM Amount) × 100
   │
   ├─ Update: autoTradeState
   │  ├─ status: "CLOSED"
   │  ├─ tradeActive: false
   │  └─ dailyTradeExecuted: true
   │
   ├─ Display: Closed Trade Summary
   │  ├─ Exit Price
   │  ├─ P&L Amount & %
   │  └─ Exit Reason
   │
   └─ Ready for RESET
      └─ Next day: Click "Reset Daily"
```

---

## 🎯 Strike Selection Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│         ITM STRIKE SELECTION (200-300 POINTS IN-THE-MONEY)       │
└─────────────────────────────────────────────────────────────────┘

INPUT:
├─ Current Nifty LTP
├─ Signal Type (LONG/SHORT)
└─ Strike Step (50 points)


CALCULATION:

1. Calculate ATM Strike:
   └─ ATM = ROUND(LTP / 50) × 50

2. Calculate ITM Strike:
   
   FOR LONG (Buy Call):
   ├─ Strike = ATM - 250
   ├─ Why ITM?
   │  ├─ Delta 0.80+ (tracks spot closely)
   │  ├─ Liquidity (high volume)
   │  ├─ Premium acceptable (0.2-0.3% of spot)
   │  └─ Lower time decay impact
   └─ Example:
      ├─ Spot: 24,500
      ├─ ATM: 24,500
      ├─ ITM Strike: 24,250 CE ← 250pts below
      └─ Premium: ~250 points
   
   FOR SHORT (Buy Put):
   ├─ Strike = ATM + 250
   ├─ Why ITM?
   │  ├─ Delta -0.80+ (strong downside tracking)
   │  ├─ Liquid puts (good bid-ask)
   │  ├─ Premium reasonable (0.2-0.3% of spot)
   │  └─ Rapid decay favors buyer if market rallies
   └─ Example:
      ├─ Spot: 24,500
      ├─ ATM: 24,500
      ├─ ITM Strike: 24,750 PE ← 250pts above
      └─ Premium: ~250 points


OUTPUT:
├─ strikePrice: Final selected strike
├─ optionType: "CE" or "PE"
├─ itmAmount: 250 (points ITM)
└─ Ready for execution


VALIDATION:
├─ Verify ITM amount in 200-300 range ✓
├─ Confirm option type matches signal ✓
├─ Check expiry date is next Thursday ✓
└─ Ensure liquidity (not too OTM) ✓
```

---

## 📈 Risk/Reward Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│           VOLATILITY-BASED POSITION SIZING FRAMEWORK             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Calculate Recent Volatility
   │
   └─→ Last 20 Price Changes:
       ├─ Change[1] = (Price[1] - Price[0]) / Price[0]
       ├─ Change[2] = (Price[2] - Price[1]) / Price[1]
       ├─ ...
       └─ Change[20]
   
   Standard Deviation = SQRT(Variance of Changes)
   Volatility % = StdDev × 100


STEP 2: Calculate ATR (Average True Range)
   │
   └─→ ATR = Volatility × Current Price × 0.01
       
       Example:
       ├─ Volatility: 1.25%
       ├─ Current Price: 24,500
       └─ ATR: 1.25 × 24,500 × 0.01 = 306.25 points


STEP 3: Set Target & Stop Loss
   │
   ├─ FOR LONG:
   │  ├─ Entry LTP: (from setup)
   │  ├─ Target: Entry + (1.5 × ATR)
   │  │          Entry + (1.5 × 306.25) = Entry + 459.38
   │  └─ SL: Entry - (0.75 × ATR)
   │         Entry - (0.75 × 306.25) = Entry - 229.69
   │
   └─ FOR SHORT:
      ├─ Entry LTP: (from setup)
      ├─ Target: Entry - (1.5 × ATR)
      │          Entry - (1.5 × 306.25) = Entry - 459.38
      └─ SL: Entry + (0.75 × ATR)
            Entry + (0.75 × 306.25) = Entry + 229.69


STEP 4: Validate Risk/Reward Ratio
   │
   ├─ Target Distance = ABS(Target - Entry)
   ├─ SL Distance = ABS(Entry - SL)
   ├─ Risk/Reward = Target Distance / SL Distance
   │
   └─ Required: R/R >= 1.2
      
      Example:
      ├─ Target Distance: 459 pts
      ├─ SL Distance: 230 pts
      ├─ Ratio: 459 / 230 = 1.995 ✓ (Pass)
      └─ Setup approved for execution


STEP 5: Setup Summary
   │
   └─ Display:
      ├─ Entry Price (estimated premium)
      ├─ Target Level (Nifty spots)
      ├─ Stop Loss Level (Nifty spots)
      ├─ Risk/Reward Ratio
      └─ Confidence Score (based on confluence)
```

---

## 🔔 Status State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│               AUTOTRADE STATE TRANSITIONS                        │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────┐
                        │  IDLE   │ (Initial State)
                        └────┬────┘
                             │
                             │ Market Opens (9:15 AM)
                             ↓
                    ┌─────────────────┐
                    │  MONITORING     │◄──────────┐
                    │ (Continuous)    │           │
                    └────┬────────────┘           │
                         │                        │
           ┌─────────────┐│┌─────────────┐        │
           ↓             ││             ↓        │
      Setup Rejected     ││      ANALYZING        │
      (poor confluence)  ││      (1 cycle)        │
           │             ││                       │
           └─────────────┘└─ Every 5 min ─────────┘
                           cycles
                             │
                    Analysis Complete
                             │
                    Confidence > 60% ?
                             │
          ┌──────────────────┴──────────────────┐
          │ YES                                 │ NO
          ↓                                     ↓
    ┌───────────────┐                    Continue Monitor
    │ENTRY_TRIGGERED│                    (cycle repeats)
    └────┬──────────┘
         │
    Setup Displayed
    Awaiting Execution
         │
         ├─ User clicks "Execute"
         │  ↓
         ├────→ ┌──────────────┐
         │      │  IN_TRADE    │
         │      │ (Active)     │
         │      └────┬─────────┘
         │           │
         │      Real-time Monitoring
         │      P&L Tracking
         │           │
         │   Exit Condition Met?
         │           │
         │  ┌────────┼────────┐
         │  ↓        ↓        ↓
         │ TARGET  STOPLOSS  EOD
         │ HIT     HIT      (3:15PM)
         │  │       │         │
         │  └───┬───┴────┬────┘
         │      ↓        ↓
         │   ┌────────────────┐
         │   │   CLOSED       │
         │   │ (Trade Done)   │
         │   └────────────────┘
         │           │
         │      Manual Override
         │   (User clicks Exit)
         │           │
         └─────→─────┘


DAILY FLOW:
1. 09:15 - IDLE → MONITORING
2. During day - MONITORING ↔ ANALYZING cycles
3. ~10:00 AM - Trigger ENTRY_TRIGGERED (typical)
4. User executes - IN_TRADE starts
5. Exit triggers - CLOSED
6. Next day - Reset to IDLE (restart flow)
```

---

## 🖼️ UI Layout Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    AUTOTRADE.AI DASHBOARD                      │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [🧠] AutoTrade.AI    │  Status: MONITORING  [▶️] [🔄] [⚙️]   │
│  One Trade Per Day    │                                        │
│                                                                │
├──────────────────────┬──────────────────────┬─────────────────┤
│                      │                      │                 │
│  LEFT PANEL          │   MIDDLE/RIGHT       │  RIGHT PANEL    │
│  ┌────────────────┐  │  ┌────────────────┐  │ ┌─────────────┐ │
│  │Setup Ready     │  │  │ Analysis Feed  │  │ │Market       │ │
│  │                │  │  │ 📊 Analysis... │  │ │Context:     │ │
│  │LONG CE @ 24250 │  │  │ 📈 Price: +18  │  │ │ LTP: 24520  │ │
│  │Conf: 82%       │  │  │ 🌪️ Vol: 1.25%  │  │ │ Sentiment:  │ │
│  │Target: 24545   │  │  │ ✅ BULLISH     │  │ │ +22.3%      │ │
│  │SL: 24478       │  │  │ 🎯 SETUP GEN   │  │ │ PCR: 1.15   │ │
│  │                │  │  │ 🚀 EXECUTED    │  │ │             │ │
│  │[Execute ▶]     │  │  │ ✅ TARGET HIT  │  │ │Daily Summ:  │ │
│  │                │  │  │                │  │ │ Trade: ✓    │ │
│  └────────────────┘  │  └────────────────┘  │ │ Expiry: Thu │ │
│                      │                      │ └─────────────┘ │
│  OR                  │  [Scroll]            │                 │
│  ┌────────────────┐  │  └────────────────┘  │ ┌─────────────┐ │
│  │Trade Active    │  │                      │ │Closed Trade │ │
│  │18 min running  │  │                      │ │ LONG CE      │ │
│  │                │  │                      │ │ Entry: 250   │ │
│  │Entry: 250      │  │                      │ │ Exit: 325    │ │
│  │Current: 24520  │  │                      │ │ P&L: +30%    │ │
│  │Max Gain: +75   │  │                      │ │ Win ✅       │ │
│  │Max Loss: -5    │  │                      │ └─────────────┘ │
│  │                │  │                      │                 │
│  │Performance:    │  │                      │                 │
│  │═══════════40%  │  │                      │                 │
│  │                │  │                      │                 │
│  │[Manual Exit]   │  │                      │                 │
│  │                │  │                      │                 │
│  └────────────────┘  │                      │                 │
│                      │                      │                 │
└──────────────────────┴──────────────────────┴─────────────────┘
│ ◀ Responsive Layout - Adapts to screen size ▶               │
└───────────────────────────────────────────────────────────────┘
```

---

## 📱 Data Flow (Real-Time Updates)

```
Market Data Source (Fyers API)
        ↓
  ┌─────┴─────┐
  │ Every 30s │
  └─────┬─────┘
        ↓
  Snapshot Data
  ├─ Nifty LTP
  ├─ Stock Prices
  ├─ Option Flow
  ├─ Sentiment
  ├─ PCR
  └─ Pivot Levels
        ↓
  ┌─────────────────────────────────────┐
  │  AutoTrade Analysis Engine          │
  │  (Runs every 5 min or on demand)    │
  └────┬────────────────────────────────┘
       ↓
  ┌──────────────────────────────────┐
  │  Multi-Factor Analysis:          │
  ├─ Momentum check                  │
  ├─ Sentiment check                 │
  ├─ PCR confluence                  │
  ├─ Pivot levels                    │
  ├─ Stock health                    │
  └──────────────────────────────────┘
       ↓
  Signal Generated?
       │
   ┌───┴───┐
   │ YES   │ NO
   ↓       ↓
SETUP  Monitor
 Ready  Continue
   │
   ↓ (on current LTP update)
Real-time P&L Calculation
├─ Current LTP vs Entry
├─ Max Gain/Loss tracking
├─ Target/SL check
└─ Exit condition eval
   │
   ├─ IF Exit triggered
   │  └─→ Close trade, show summary
   │
   └─ ELSE
      └─→ Continue monitoring
```

---

## ✅ Quality Assurance Checklist

```
┌──────────────────────────────────────────────────────────────┐
│  AUTOTRADE SYSTEM - QA VERIFICATION                          │
└──────────────────────────────────────────────────────────────┘

Component Rendering:
  ☑ AutoTrade component loads
  ☑ All UI elements display correctly
  ☑ Responsive layout works
  ☑ Colors and animations render

State Management:
  ☑ autoTradeState transitions correct
  ☑ tradeSetup generates properly
  ☑ execution tracking works
  ☑ analysisLog populates

Analysis Engine:
  ☑ Momentum calculation correct
  ☑ Sentiment analysis works
  ☑ PCR interpretation accurate
  ☑ Pivot level detection correct
  ☑ Stock health scorer works
  ☑ Confidence scoring valid
  ☑ R/R validation active

Strike Selection:
  ☑ ITM calculation (200-300pts)
  ☑ Strike type (CE/PE) correct
  ☑ Expiry date selection works
  ☑ Premium estimation reasonable

Trade Management:
  ☑ Execution triggers trade
  ☑ Entry price calculated
  ☑ P&L tracking updates real-time
  ☑ Target exit works
  ☑ Stop loss exit works
  ☑ EOD exit (3:15 PM) works
  ☑ Manual exit option works

UI/UX:
  ☑ Status badges update
  ☑ Analysis feed scrolls
  ☑ Market panel updates
  ☑ Trade summary displays
  ☑ Button clicks respond
  ☑ Performance bar animates

Integration:
  ☑ Props passed correctly
  ☑ No console errors
  ☑ Responsive on mobile
  ☑ Styling consistent
  ☑ Lucide icons display

Build:
  ☑ TypeScript compilation passes
  ☑ No import errors
  ☑ Build completes successfully
  ☑ Production bundle generated
  ☑ No console warnings
```

---

This completes the **AutoTrade.AI** system architecture and flow documentation!
