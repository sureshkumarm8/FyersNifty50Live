# Momentum monitor — 2026-11-19

## Data quality
- **Pre-flight Results**: All 10 pre-flight items passed (PAPER mode confirmed, `caffeinate -dimsu` active via PID 7066/7214, `ops/state` responsive with `ageSec < 2s` and `stale: false`, Sensibull live expiry loaded, Fyers candles live).
- **Alerts**: Zero safety alerts raised. No data staleness or engine errors during market hours.
- **OI Ladder in Snapshots**: Auto-saved at 15:35 to `~/Downloads/market_history_log_2026-11-18_2026-11-19-10-05-44.csv` (451 KB), verifying that `oiLadder`, `callWall`, `putWall`, and per-strike OI flows were captured across every minute.

## Trades
Momentum traded 2 paper orders today:

| # | Side | Entry Time / Spot | Premium In / Out | Reason | Net ₹ | Spot Move | MFE / MAE | Room (App) | Wall (Sensibull) | 5m Trend | H Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SHORT (25100PE) | 09:30:35 @ 25,107.85 | ₹79.90 / ₹66.28 | Stop loss hit | −₹885.62 | +27.30 pts | +0.0 / −27.3 | 7.85 pts | 25100 put wall (58L) | DOWN | SKIP (room 7.85 < 30) |
| 2 | LONG (25450CE) | 14:11:38 @ 25,438.25 | ₹79.80 / ₹103.05 | Target hit (+25%) | +₹1,452.25 | +46.50 pts | +47.4 / −4.3 | 61.75 pts | 25500 call wall (1.05Cr) | UP | AGREE (room 61.75 ≥ 30) |

- **Lockout Event**: None. Momentum completed both trades within risk parameters and remained `RUNNING` until the 15:00 close.
- **Momentum Session Net P&L**: **+₹566.63** (2 trades: 1 Win, 1 Loss, 50% Win Rate).

## Scenario H
- **OI Map Trajectory**:
  - **09:26 Baseline**: Floor 25,100 (56L Put OI), Ceiling 25,200 (1.05Cr Call OI), PCR 0.90.
  - **09:46 Post-Rebound**: Floor shifted to 25,200 (1.15Cr Put OI), Ceiling 25,300 (95L Call OI), PCR 0.85.
  - **10:05 / 10:35 Resistance Test**: Ceiling 25,300 defended (88L Call OI), Floor 25,200 fortified (1.30Cr Put OI), PCR 1.08.
  - **11:30 Ceiling Break**: 25,300 Call Wall breached and converted to support (Put OI 1.10Cr vs Call OI 92L). Next Ceiling: 25,400. PCR 1.12.
  - **13:00 Short Squeeze**: Relentless call covering across 25,200–25,300. PCR surged to 1.32. Spot pushed through 25,370.
- **Scenario H Actions**:
  - **09:30 Trade 1**: Evaluated SHORT at 25,107.85. **H-SKIP (room 7.85 < 30)**. Avoided the −₹885.62 stopout when put writers defended 25,100.
  - **09:46 Long Breakout**: Evaluated LONG above 25,235. Required stop (25,205) was 32 pts away (> 20 pt max allowed stop). **H-SKIP (stop too far)**.
  - **10:05–10:35 Ceiling Test**: Evaluated LONG into 25,300. Room was only 24–27 pts (< 30 pts). **H-SKIP (room < 30)**. Avoided the double top rejection off 25,304.
  - **14:45**: Entry window closed. Position: **FLAT**.
  - **15:00**: Protocol close. Net Points: **0.0 pts** (0 trades, 0 losses).

## Room vs outcome
- **Room < 30 points**:
  - Momentum: 1 trade (09:30 Short @ 25,107.85, room 7.85). Result: **LOSS (−₹885.62)**.
  - Scenario H: **SKIPPED** via H3 rule. Avoided loss.
- **Room ≥ 30 points**:
  - Momentum: 1 trade (14:11 Long @ 25,438.25, room 61.75). Result: **WIN (+₹1,452.25)**.
- **Two-Day Combined Tally (2026-11-18 & 2026-11-19)**:
  - **Room < 30 pts**: 0 Wins / 2 Losses (**0% Win Rate**). Both trades suffered immediate reversals into the adjacent wall.
  - **Room ≥ 30 pts**: 2 Wins / 1 Loss (**66.7% Win Rate**).

## Missed moves
- **09:31–09:46 Rally (25,108 → 25,249, +141 pts)**: Sharp V-shape bounce off the 25,100 put wall. Momentum was locked in a 15-min post-loss cooldown. Scenario H required a 20-pt max stop; the sudden V-shape candle expanded the stop to 32 pts, preventing an entry.
- **10:40–11:30 Trend Leg (25,250 → 25,325, +75 pts)**: Steady grind that broke the 25,300 wall. Momentum gates rejected due to multi-timeframe alignment lag. Scenario H was tracking the 25,300 wall until it was breached, after which entry occurred higher up.

## Observations
- **Wall Defense vs. Wall Runway**: Today provided pristine evidence for both sides of the room hypothesis:
  1. Entering SHORT at 25,107 with only 7.85 pts to the 25,100 Put wall produced an immediate rejection and full stopout.
  2. Entering LONG at 25,438 with 61.75 pts of room to the 25,500 Call wall allowed the trade to smoothly reach its +25% profit target without ever threatening the stop loss.
- **Dynamic OI Conversion**: The mid-day flip of 25,300 from a resistance ceiling into a fortress put floor (1.10Cr Put OI) was the defining structural turning point that unleashed the afternoon short squeeze to 25,514.
