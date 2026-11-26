# Momentum monitor — 2026-11-20

## Data quality
- **Pre-flight Results**: All 10 pre-flight items passed at 09:10 IST (`ageSec: 0.4s`, `stale: false`, PAPER mode confirmed, Momentum armed, tab connected, `oiLadder` active, option chain live, `caffeinate -dimsu` power assertion active via PID 50970/7066, Sensibull snapshot service live on 4321, Fyers candles streaming, and output directories writable).
- **Alerts**: Zero safety alerts raised. System operated with 100% uptime throughout the entire trading day.
- **OI Ladder in Snapshots**: Auto-saved log confirmed at 15:35 to `~/Downloads/market_history_log_2026-11-19_2026-11-20-10-05-07.csv` (462 KB), verifying that full minute-by-minute orderbook, quote, and ladder data were archived.

## Trades
Momentum traded 2 paper orders today:

| # | Side | Entry Time / Spot | Premium In / Out | Reason | Net ₹ | Spot Move | MFE / MAE | Room (App) | Wall (Sensibull) | 5m Trend | H Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | LONG (25500CE) | 09:47:22 @ 25,511.85 | ₹91.65 / ₹77.90 | Stop loss hit | −₹893.75 | −27.50 pts | +0.0 / −8.9 pts | 88.15 pts | 25500 call wall (1.70Cr) | RANGE | OPPOSE (room to wall < 12 pts) |
| 2 | LONG (25550CE) | 10:50:39 @ 25,562.70 | ₹88.60 / ₹74.45 | Stop loss hit | −₹919.75 | −33.70 pts | +6.3 / −33.1 pts | 41.30 pts | 25550–25600 call cluster (2.25Cr) | RANGE | OPPOSE (buying into call cluster) |

- **Lockout Event**: **11:05:10 IST** — Gate triggered: `"Stand down today: 2 consecutive net losses."` Following Trade 2, the engine hit its daily risk limit (2 consecutive losses) and locked out from new trades for the remainder of the session.
- **Momentum Session Net P&L**: **−₹1,813.50** (2 trades: 0 Wins, 2 Losses, 0% Win Rate).

## Scenario H
- **OI Map Trajectory**:
  - **09:21 Baseline**: Spot 25,465.65, PCR 1.20, Floor 25,400 (1.20Cr Put OI), Ceiling 25,500 (1.20Cr Call OI).
  - **09:30 Window Open**: Floor 25,400 (1.45Cr Put OI), Ceiling 25,500 (1.45Cr Call OI), PCR 1.17.
  - **09:45 Resistance Test**: Spot surged to 25,497.80. Massive call addition at 25,500 (1.70Cr Call OI); PCR collapsed to 0.94.
  - **10:00–10:30 Straddle War**: Spot oscillating 25,515–25,535. 25,500 Call wall expanded to 2.10Cr with 25,550 (1.05Cr) and 25,600 (1.20Cr) forming a dense ceiling block. PCR 0.88.
  - **13:00 Afternoon Squeeze**: 25,500 call writers completely folded and began capitulating/unwinding. Massive put buildup at 25,500 (2.25Cr Put OI). Spot pushed to 25,707.05. PCR rose to 1.15.
  - **15:30 Final Settlement**: Nifty settled at 25,800.60 (+1.12%). 25,500–25,600 calls unwound; 26,000 emerged as the new major ceiling (1.55Cr Call OI).
- **Scenario H Actions**:
  - **09:47 Trade 1**: Evaluated LONG at 25,511.85. The App mechanically shifted ceiling to 25,600, declaring 88.15 pts room. In reality, Sensibull showed 25,500 was an active 1.70Cr Call wall with only 11.85 pts clearance. 5m trend was RANGE. **H-OPPOSE/SKIP**. Avoided the −₹893.75 stop loss.
  - **10:50 Trade 2**: Evaluated LONG at 25,562.70 into the 25,550 (1.05Cr) and 25,600 (1.20Cr) call resistance zone. 5m trend was RANGE. **H-OPPOSE/SKIP**. Avoided the −₹919.75 stop loss.
  - **11:05–14:45**: No trades taken as market structure consolidated before the afternoon extension.
  - **14:45**: Entry window closed. Position: **FLAT**.
  - **15:00**: Protocol close. Net Points: **0.0 pts** (0 trades, 0 losses).

## Room vs outcome
- **The "Mechanical Room vs Actual Wall" Trap**:
  - Today provided a textbook demonstration of a structural flaw in mechanical room calculation:
    - **Trade 1**: When spot crossed 25,500 to 25,511, the engine automatically changed its ceiling reference to 25,600, outputting `room = 88.15 pts`. However, 1.70Cr of Call OI was actively stationed at 25,500! Spot was rejected back below 25,500 within seconds.
    - When measured against the **actual OI concentration**, room was under 12 points (< 30 pts).
- **Outcome Distribution**:
  - **Actual Clearance < 30 pts**: 1 trade (Trade 1 @ 25,511.85 vs 25,500 wall). Result: **LOSS (−₹893.75)**. MFE was 0.0 pts.
  - **Entering Heavy Overhead Call Resistance**: 1 trade (Trade 2 @ 25,562.70 into 25,550/25,600 cluster). Result: **LOSS (−₹919.75)**.
  - Scenario H: **SKIPPED both trades**, preserving capital at ₹0.00 vs Momentum's −₹1,813.50.
- **Three-Day Cumulative Tally (2026-11-18 to 2026-11-20)**:
  - **Trades with Real Clearance < 30 pts**: 0 Wins / 3 Losses (**0% Win Rate**). Every single trade entered directly into an adjacent wall without true cushion has produced an immediate stopout.
  - **Trades with Real Clearance ≥ 30 pts**: 2 Wins / 1 Loss (**66.7% Win Rate**).

## Missed moves
- **12:15–15:00 Mega-Trend Rally (25,620 → 25,800, +180 pts)**:
  - After 11:30, call writers at 25,500–25,600 suffered capitulation, triggering a massive short squeeze that drove Nifty up ~180 points into the close.
  - **Momentum Engine**: Completely missed this move because it was locked out at 11:05 IST after suffering 2 consecutive morning losses.
  - **Key Lesson**: Taking early low-quality trades into thick resistance walls not only loses capital, but triggers risk lockout gates that blind the engine to the true trend leg of the day.

## Observations & Recommendations
1. **Wall Clearance Definition**: The app must not advance the ceiling reference to the next strike until price has cleared the current wall by at least 25–30 points with confirmed call OI unwinding. Advancing the ceiling purely on spot crossing `strike + 0.05` creates phantom room.
2. **Scenario H Capital Preservation**: For the third consecutive day, Scenario H's strict 30-pt room rule proved superior in risk management, completely shielding the book from consecutive stopouts.
