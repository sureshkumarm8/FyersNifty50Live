# AI Lab - Dual Prediction Methods Guide

## Overview
AI Lab now features **TWO distinct prediction generation methods** for forecasting market movements over the next 30 minutes.

---

## Method 1: Archived Snapshot Predictions 📦

### Description
Generates predictions using **ONLY archived historical data** from previous trading days.

### Requirements
- **Minimum:** 10 archived snapshots
- **Data Source:** Historical data imported via CSV or saved from previous sessions

### How It Works
1. Analyzes patterns from archived market data
2. Calculates momentum, sentiment trends, PCR movements
3. Projects 6 time intervals (30 minutes at 5-min intervals)
4. Uses historical volatility patterns for confidence scoring

### Best For
- **Pattern-based trading** when market is closed
- **Backtesting strategies** using historical data
- **Model validation** against known outcomes
- **Training and learning** market behavior

### Confidence Range
- **85% → 40%** (decreases over time)
- Lower confidence as predictions extend further

### UI Indicators
- **Blue theme** (Download icon)
- Shows archived snapshot count
- Disabled if < 10 archived snapshots

---

## Method 2: Hybrid Live + Archived Predictions ⚡

### Description
Combines **LIVE market data** (minimum 5 snapshots) with **archived historical context** for enhanced accuracy.

### Requirements
- **Minimum:** 5 live market snapshots
- **Optional:** Archived data for additional context
- **Best Performance:** 10+ live snapshots + archived data

### How It Works
1. **Primary Analysis:** Uses latest live market data (70% weight)
2. **Context Layer:** Leverages archived patterns (30% weight)
3. **Hybrid Momentum:** Combines real-time trends with historical context
4. **Smart Decay:** Better momentum retention (88% vs 85%)
5. **Higher Confidence:** More accurate predictions with combined data

### Best For
- **Real-time intraday trading**
- **Active market hours** (9:15 AM - 3:30 PM)
- **High-confidence predictions**
- **Live decision making**

### Confidence Range
- **90% → 50%** (better retention than archived-only)
- Higher overall confidence due to live data

### UI Indicators
- **Purple theme** (Sparkles icon)
- Shows live + archived snapshot counts
- Disabled if < 5 live snapshots
- Displays "Higher accuracy with combined data" badge

---

## Comparison Table

| Feature | Archived Only | Hybrid (Live + Archived) |
|---------|---------------|-------------------------|
| **Min Requirements** | 10 archived | 5 live snapshots |
| **Data Weight** | 100% historical | 70% live + 30% archived |
| **Confidence** | 85% → 40% | 90% → 50% |
| **Momentum Decay** | 0.85 | 0.88 |
| **Best Use Case** | Pattern study | Real-time trading |
| **Availability** | Anytime | Market hours only |
| **Accuracy** | Good | Better |
| **Theme Color** | Blue | Purple |

---

## Prediction Output

Both methods generate **6 predictions** for the next 30 minutes (5-minute intervals):

### Data Points Per Prediction
- **Time:** Future timestamp
- **Nifty LTP:** Predicted price
- **Points Change:** Expected move from last prediction
- **Overall Sentiment:** Market mood (%)
- **Advance/Decline:** Bull vs bear stock count
- **Stock Strength:** Equity sentiment
- **Call/Put Strength:** Options sentiment
- **PCR:** Put-Call Ratio
- **Options Strength:** Combined options sentiment
- **Call/Put Volumes:** Buy/Sell quantities in millions
- **Confidence:** Prediction reliability (%)

---

## How to Use

### Step 1: Choose Your Method

**For Pattern Analysis (Market Closed):**
```
→ Go to AI Lab > Predictions tab
→ Use "Method 1: Archived Data Predictions"
→ Click "Generate from Archive"
```

**For Live Trading (Market Open):**
```
→ Go to AI Lab > Predictions tab
→ Wait for 5+ live snapshots to accumulate
→ Use "Method 2: Hybrid Predictions"
→ Click "Generate Hybrid"
```

### Step 2: Interpret Results

**High Confidence (80-90%)**
- Strong trend continuation expected
- Good for aggressive trades
- Clear market direction

**Medium Confidence (60-79%)**
- Moderate conviction
- Use tighter stops
- Partial position sizing

**Low Confidence (40-59%)**
- Uncertain market
- Stay defensive
- Wait for better setups

### Step 3: Compare Methods

**Pro Tip:** Generate both predictions and compare:
- **Agreement:** High conviction trade setup
- **Divergence:** Market uncertainty, reduce size
- **Hybrid Higher:** Trust live data more
- **Archived Higher:** Beware of unusual live action

---

## Data Requirements

### Importing Archived Data
1. Go to **Pattern Dashboard → Archives tab**
2. Click **Import CSV**
3. Select historical data files (format: date, time, nifty, sentiment, pcr, etc.)
4. Data automatically loads into AI Lab

### Live Data Accumulation
- Snapshots auto-save every minute during market hours
- Minimum 5 snapshots needed (5 minutes of data)
- Optimal: 10+ snapshots for better accuracy
- Resets daily (stored in daily archives)

---

## Algorithm Details

### Archived Method Algorithm
```typescript
1. Extract last 30 archived snapshots
2. Calculate 10-period momentum average
3. Compute sentiment trends (5-period)
4. Apply momentum decay (0.85^interval)
5. Project 6 future intervals
6. Confidence = max(40, 85 - interval*8)
```

### Hybrid Method Algorithm
```typescript
1. Extract last 10 live snapshots
2. Calculate live momentum (5-period, weight=0.7)
3. Calculate archived momentum (10-period, weight=0.3)
4. Weighted momentum = (live*0.7) + (archived*0.3)
5. Apply better decay (0.88^interval)
6. Project 6 future intervals
7. Confidence = max(50, 90 - interval*6)
```

---

## Limitations & Disclaimer

⚠️ **Important Notes:**

1. **Not Financial Advice:** These are AI-generated forecasts for reference only
2. **No Guarantees:** Past patterns don't guarantee future results
3. **Market Volatility:** Extreme events can invalidate predictions
4. **Data Quality:** Accuracy depends on clean, complete data
5. **Time Decay:** Confidence drops significantly after 15-20 minutes

**Best Practice:**
- Use predictions as ONE input in your decision-making
- Always apply proper risk management
- Never trade based solely on predictions
- Combine with technical analysis and fundamentals

---

## Troubleshooting

### "Need at least 10 archived snapshots"
**Solution:** Import CSV data via Pattern Dashboard → Archives

### "Need at least 5 live snapshots"
**Solution:** Wait for 5 minutes of market data to accumulate

### "Predictions seem off"
**Possible Causes:**
- News events disrupting patterns
- Gap up/down at market open
- Low liquidity periods
- Unusual market conditions

**Solution:** Use lower confidence predictions with caution

### Predictions not updating
**Check:**
1. Is market open? (Live method only)
2. Is data flowing? (Check main dashboard)
3. Are snapshots being saved? (Check Redis/localStorage)

---

## Technical Implementation

### Files Modified
- `components/AILab.tsx` - Main implementation

### New State Variables
```typescript
archivedPredictions: PredictedSnapshot[]
isArchivePredicting: boolean
showArchivedPredictions: boolean
hybridPredictions: PredictedSnapshot[]
isHybridPredicting: boolean
showHybridPredictions: boolean
```

### New Functions
- `generateArchivedPredictions()` - Method 1 implementation
- `generateHybridPredictions()` - Method 2 implementation
- `PredictionTable()` - Reusable table component

---

## Future Enhancements (Optional)

1. **Method 3:** Machine Learning predictions using TensorFlow.js
2. **Confidence Calibration:** Track prediction accuracy over time
3. **Auto-refresh:** Re-generate predictions every 5 minutes
4. **Export Predictions:** Save for comparison with actual outcomes
5. **Alert System:** Notify when high-confidence setup appears
6. **Backtest Mode:** Run predictions on historical data and compare

---

## Version History

**v1.0** (Current)
- Dual prediction methods implemented
- Archived-only predictions
- Hybrid live+archived predictions
- Minimum 5 live snapshots requirement
- Reusable PredictionTable component
- Color-coded themes (Blue/Purple)
- Confidence scoring with decay

---

## Support

For issues or questions:
1. Check console logs for errors
2. Verify data availability (live/archived counts)
3. Review prediction confidence levels
4. Compare both methods for validation

---

**Happy Trading! 📈**

Remember: The best prediction method is the one that combines:
- Quality data
- Multiple confirmation signals  
- Proper risk management
- Your experience and judgment
