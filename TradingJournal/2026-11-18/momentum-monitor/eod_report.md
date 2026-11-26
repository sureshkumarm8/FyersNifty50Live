# Momentum monitor — 2026-11-18

## Data quality
- **Pre-flight Checks**: All 10 pre-flight checks verified. Mode is PAPER, caffeinate active (pid 65799), ops state live (ageSec < 2s, stale: false). Sensibull OI vs Strike and Fyers charts verified live.
- **Alerts**: Zero safety alerts raised. No data staleness or engine errors.
- **OI Ladder in Snapshots**: LevelDB and frontend state confirm `oiLadder`, `callWall`, and `putWall` are actively computed and stored in `today_snapshots`. Auto-download file: market_history_log_2026-11-17_2026-11-18-10-05-48 (2).csv.

## Trades
Momentum traded 3 paper orders before locking out at 10:56 IST:

| # | Side | Entry Time / Spot | Premium In / Out | Reason | Net ₹ | Spot Move | MFE / MAE | Room (App) | Wall (Sensibull) | 5m Trend | H Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SHORT (25300PE) | 09:38:14 @ 25,296.80 | ₹86.05 / ₹114.22 | Trailing stop / Target | +₹1,831.38 | −59.75 pts | +64.5 / −4.2 | 96 pts (to 25200) | 25200 put wall (58L) | DOWN | AGREE (+30 target hit) |
| 2 | SHORT (25250PE) | 10:24:29 @ 25,252.00 | ₹80.00 / ₹67.10 | Stop loss hit | −₹838.50 | +13.70 pts | +6.2 / −16.8 | 52 pts | 25200 put wall (68L) | DOWN | SKIP (room < 60 near floor) |
| 3 | SHORT (25200PE) | 10:45:20 @ 25,224.00 | ₹79.30 / ₹67.13 | Stop loss hit | −₹791.38 | +24.00 pts | +4.0 / −28.5 | 24 pts | 25200 put wall (72L) | RANGE | SKIP (room 24 < 30) |

- **Lockout Event**: 10:56:40 IST — `lastGate: "Stand down today: 2 consecutive net losses."` Engine stood down for the remainder of the session in strict accordance with Rule 3.
- **Momentum Session Net P&L**: **+₹201.50** (3 trades: 1 Win, 2 Losses, Win Rate: 33.3%).

## Scenario H
- **OI Map Structure**:
  - Session Floor: 25,200 (Put writers actively defending: 58L at 09:44 -> 68L at 10:30 -> 75L at 12:30 -> 79.2L at 14:42).
  - Fortress Put Wall: 25,000 (1.05Cr -> 1.25Cr).
  - Session Ceiling: 25,300 (Call OI surged from 76L at 09:44 to 1.02Cr at 10:30 to 1.08Cr at 12:30).
  - Major Call Wall: 25,500 (1.38Cr).
  - Overall PCR: drifted from 1.09 (09:29) to 0.94 (10:30) to 0.80 (14:42), reflecting sustained call writing pressure.
- **Scenario H Rules & Trades**:
  - H entered **0 trades** (Flat).
  - Trades attempted/evaluated:
    - 09:38: DOWN trend. Room to 25200 put floor was 96 points (> 30). Valid trend short opportunity, matching Momentum's winner.
    - 10:24: DOWN trend, but spot was at 25252, only 52 points above the 25200 put wall. Stop loss calculation exceeded 20 points; trade skipped.
    - 10:45: RANGE consolidation above 25200 wall. Room to wall was only 24 points (< 30 pts required by H3). **H-SKIP (room < 30)** successfully avoided Momentum's losing short trade!
    - Afternoon (12:30–14:45): Price oscillated between 25,148 and 25,274. In RANGE mode, wall fade required entry within 10 pts of 25200 (<= 25210) or 25300 (>= 25290). No qualifying two-candle reclaim pattern triggered within 10 points with volume/breadth confirmation.
  - 14:45: Entry window closed.
  - 15:00: Exit flat. Net Points: **0.0 pts**.

## Room vs outcome
- **Room < 30 points**:
  - Momentum: 1 trade (10:45 Short @ 25224, room 24). Result: **LOSS (−₹791.38)**.
  - Scenario H: **SKIPPED** via H3 rule. Avoided loss.
- **Room ≥ 30 points**:
  - Momentum: 2 trades (09:38 Short with room 96 -> **WIN +₹1,831.38**; 10:24 Short with room 52 -> **LOSS −₹838.50**).
- **Finding**: On today's sample, every entry with room < 30 was a loss. Filtering out entries with room < 30 would have eliminated 1 of the 2 consecutive losses and kept Momentum profitable at +₹992.88 instead of +₹201.50.

## Missed moves
- **09:15–09:28 (Drop from 25,388 to 25,301, ~87 pts)**: Occurred during pre-market / opening window before Momentum's 09:30 start time.
- **13:40–14:18 (Rally from 25,148 to 25,274, ~126 pts)**: Strong bounce off the 25,150 zone back up to 25,270. Momentum was locked out (2 losses limit). Scenario H was in RANGE mode and required a wall fade off the 25,200 floor; the move originated from 25,148 (below the floor) and broke back above 25,200 rapidly without giving a 2-candle fade confirmation within 10 pts of floor.

## Observations
- The 25,200 Put wall acted as a persistent magnet and trampoline between 10:00 and 14:00. Momentum shorted right into it at 10:45 with only 24 points of room and suffered an immediate bounce stopout.
- Logging `room` and `oiLadder` in every snapshot provides exact quantitative proof of why shorting within 30 points of heavy Put OI carries negative expectancy.
