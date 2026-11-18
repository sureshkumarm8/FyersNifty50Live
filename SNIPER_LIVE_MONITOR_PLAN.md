# Live Market Monitor — Sniper vs Manual Wall-Reclaim

> Brief for an AI agent monitoring one NSE session from 08:55 to 15:35 IST.
> Written 2026-11-18. Reusable on any trading day; replace the date in the paths.

## 0. Why this exists

The Sniper (`services/sniperEngine.ts`) and the trader's manual method disagree:

- **Sniper (Scenario A):** marks the 09:15–09:25 opening range and enters at the first moment price is
  within 25 pts of a wall with a ≥65% signal. On 2026-11-17 it bought at 09:25 and was stopped
  at 09:36 (−15). Nifty then rallied 95 points.
- **Manual (Scenario B):** reads the Sensibull OI walls, watches the 09:30 participation wave, and
  waits for a wall to be **tested and reclaimed** on the 1-minute tape before scalping about 30 Nifty points.
  On 11-17 that gave a long around 09:38–09:40 that made +30 by 09:45–09:49.

A 20-day replay (`npm run replay:sniper`) found **no proven edge for either**. The archive could not
test Scenario B properly, because it had no per-strike OI. That is now logged.
**Your job is to collect clean, time-stamped evidence of what each scenario would do today.** You
do not trade, and you do not judge which method is better from a single day.

## 1. Hard rules (non-negotiable)

1. **Observe only. Place no orders**, live or paper. Never click Execute/Arm/Enter/Exit buttons, the
   kill switch, or anything in the AutoTrade order path. Scenario B trades are **notional**: written
   to a file only.
2. Do not change settings, thresholds, `strategy.config`, `.env*` or any code. Do not log in to a
   broker, and never type or request an OTP.
3. Do not refresh or close the app tab during 09:10–10:35 unless the data is stale (§8). A refresh
   resets the session baselines.
4. If something looks wrong, record it and notify the user. Do not fix it.
5. Every record carries the IST time (HH:MM:SS) and the exact source it came from. If a value was
   unreadable, write `null` and give the reason. Never estimate a number and present it as read.

## 2. Pre-flight (must pass by 09:10)

The user does items 1–2; you verify the rest.

| # | Check | How | Pass |
|---|---|---|---|
| 1 | Option list is for the current expiry | `grep CURRENT_EXPIRY_DATE constants/niftyWeeklyOptions.ts` | `2026-11-23` (regenerated 2026-11-18 08:45; re-run `npm run generate:options` on any later day) |
| 2 | Dev server restarted after 2026-11-17 19:51 | `ps -o lstart= -p $(lsof -tiTCP:5001 -sTCP:LISTEN)` | Start time after the last code change. If not, ask the user to restart `npm run dev`. The server caches `api/*.js` modules, so the option fixes don't load without a restart |
| 3 | App open and fresh | Browser at `http://localhost:5173`, hard-refreshed once **before 09:10** | Loads without errors |
| 4 | App state is reachable | `curl -s localhost:5001/api/ops/state` | `ageSec` < 15, `autotrade.mode` = `PAPER` |
| 5 | Options straddle the ATM | Browser console after the first fetch (after 09:08) | `Contracts=82` (or about that) and **no** `do not straddle ATM` error |
| 6 | Mac will not sleep | `pmset -g` → `sleep prevented by caffeinate`. Otherwise ask the user to run `caffeinate -dimsu &` | A sleep stall costs about twice its length (see `pmset -g log`) |
| 7 | Sensibull OI page opens | `https://web.sensibull.com/open-interest/oi-vs-strike?tradingsymbol=NIFTY` | Bars visible, expiry = nearest |
| 8 | 1-minute chart opens | TradingView `https://www.tradingview.com/chart/?symbol=NSE%3ANIFTY&interval=1` (or the user's usual chart) | 1-minute candles updating |
| 9 | Output folder exists | `mkdir -p TradingJournal/<YYYY-MM-DD>/live-monitor` | — |

Write the pre-flight result as the first line of `decisions.md`. If item 1, 2 or 5 fails, **tell the user
immediately**. The option data, PCR and OI walls are invalid until it's fixed.

## 3. Where each input comes from

| Input | Source | Notes |
|---|---|---|
| Sniper state + last decision | `GET localhost:5001/api/ops/state` → `snapshot.engines.sniper.{state,armed,lastDecision}`, `snapshot.market.spot`, `ageSec` | Machine-readable; poll it, don't screen-scrape |
| Sniper event log (range lock, thesis, risk officer, entries/exits) | App → AutoTrade → **Sniper** tab, log panel | Copy each new line verbatim with its time |
| 1-minute history (breadth, adv/dec, call/put sentiment, options sentiment, PCR, OI, **callWall/putWall/oiLadder**) | App → **Day Sentiment & Momentum History** (`components/SentimentHistory.tsx`); its export button writes `market_history_log_*.csv` to `~/Downloads` | Export at 09:46, 10:31 and 15:31; read the table between exports |
| Nifty 1-minute candles | Chart tab (§2 #8) | Use the candles for structure (higher lows, wicks); use the app's spot for numbers |
| Per-strike OI | Sensibull OI vs strike (§2 #7), cross-checked with `oiLadder` in the history | Sensibull is the reference; the app's ladder must roughly agree |

## 4. Output files (append-only, `TradingJournal/<YYYY-MM-DD>/live-monitor/`)

- `minute.jsonl`: one line per minute 09:15–10:35, then every 5 minutes to 15:30:
  ```json
  {"t":"09:31:00","spot":25325.8,"sniper":{"state":"...","armed":false,"lastDecision":"..."},
   "hist":{"overallSent":-33,"adv":24,"dec":24,"callSent":0,"putSent":-1,"optionsSent":1,"pcr":0.74,
           "callWall":25500,"putWall":25000,"oiLadder":"..."},
   "B":{"state":"ARMED_LONG","wall":25300,"testExtreme":25295.4,"note":"..."},
   "dataOk":true,"issues":[]}
  ```
- `oi.jsonl`: Sensibull reads at 08:58, 09:20, 09:29, 09:44, 10:30, 12:30 and 15:15. Each is
  `{"t","source":"sensibull","pcr","totalCallOI","totalPutOI","bars":[{"strike","callOI","putOI"}...]}`
  covering ATM ± 500 at minimum, with values exactly as shown (Cr/L units preserved in a `unit` field).
- `decisions.md`: a human-readable timeline. Each line is one event: time, scenario A or B, what
  happened, and why.
- `eod_report.md`: the template in §9.

## 5. Scenario A — monitor the Sniper

You only **record**. The engine's rules, for reference:

| Time | Phase | Expected behaviour |
|---|---|---|
| 09:15–09:25 | DOWNLOAD | Watches the range only. Log the range-lock line (`🔒 Range locked — high/low → support/resistance`) |
| 09:25–09:45 | ENTRY_WINDOW | Enters when price is within 25 of a wall, signal ≥65% in the same direction, PCR gate passes (PCR is ignored outside 0.3–3), not MID_RANGE/ZONE_BROKEN. 250-ITM option, target +25 / stop −15 spot, **one trade a day** |
| 09:45–10:30 | MANAGE_ONLY | Open position only. From 10:15, a loss is cut and a profit trails 10 pts behind its peak |
| 10:30 / 10:35 | HARD_STOP / stand down | Flat |

Record:
1. The range lock, the walls traded, and any thesis or risk-officer line (`🧭`, `↻`, `🧠`, `🎯`, `⛔`).
2. **Each change** of `lastDecision` (dedupe repeats), with the block codes in it (MID_RANGE,
   DIRECTION_CONFLICT, CONFIDENCE, …).
3. Entry: time, spot, side, strike. Exit: time, spot, reason, points.
4. **Signal flips:** if `lastDecision` swings direction (LONG→SHORT/NEUTRAL) within 5 minutes,
   record it as `SIGNAL_FLIP`. On 11-17 this happened 3 times in 10 minutes.

## 6. Scenario B — the manual wall-reclaim read (notional)

Follow these rules **exactly as written**. They were fixed before any backtest. Don't improve them
mid-session; put ideas in the EOD report.

### B1. 08:55–09:14: the OI map
1. Read Sensibull. Note the spot, PCR, and the **3 largest put-OI strikes below spot** and **3 largest call-OI strikes above spot**.
2. **Floor** = the nearest of those put strikes with OI ≥ 70% of the largest put bar. **Ceiling** = the
   same rule for calls. **Bias** = `UP` if put OI within ±300 of spot is more than 1.3× call OI within ±300,
   `DOWN` if call OI is more than 1.3× put OI, otherwise `NEUTRAL`.
3. Record it in `oi.jsonl` and `decisions.md` ("B-MAP: floor 25200, ceiling 25300, bias NEUTRAL …").

### B2. 09:15–09:25: the opening read
1. Record the opening-range high and low from the app (the Sniper's range-lock line gives them).
2. **Gap check:** if the open is above the ceiling, the ceiling has become a *candidate floor* (writers
   trapped). If the open is below the floor, the floor has become a *candidate ceiling*. Write this down.
3. Watch for the first wave: breadth (`overallSent`), adv/dec and `putSent`/`callSent` direction
   minute by minute.

### B3. 09:25–09:45: arm and trigger (the 09:30 wave)
- **Arm LONG** when price trades within 10 pts of the active floor (an OI floor or the opening-range low,
  whichever is closer to price). Track `testLow` = the lowest print while armed.
- **Arm SHORT** when price trades within 10 pts of the active ceiling. Track `testHigh`.
- **Trigger LONG** when, after the test, **two consecutive 1-minute closes are ≥ 10 pts above
  `testLow`**, the latest close is higher than the previous one, and **all three** of these hold:
  breadth now > breadth 3 minutes ago; `putSent` falling or `callSent` rising over 3 minutes; and the
  Sensibull floor's put OI has not dropped more than 10% since B1 (writers still defending).
  Mirror everything for SHORT.
- **Notional entry** = spot at the trigger close. **Stop** = `testLow − 8` (`testHigh + 8` for a short).
  **Skip** if the stop is more than 25 points away. **Target** = +30, or the next OI wall if that's closer
  than 30 (then record `target:"wall"`).
- **No new triggers after 09:45.** At most 2 attempts. A second attempt needs a fresh test of a wall.
- Each minute, check the stop **before** the target using the minute's low/high from the 1-minute
  candle. Exit at 10:30 if neither has hit.

Record every arm, disarm, trigger and exit in `decisions.md`, plus the reasons that **blocked** a trigger.
The near-misses are the most useful data.

### B4. Also record (both scenarios, 09:25–10:30)
- The **best available trade in hindsight**: the earliest point from which +30 was reached before −15. Fill
  this in at 10:35, so you can see whether either method was close.

## 7. Cadence

| IST | Every | Do |
|---|---|---|
| 08:55–09:14 | once + as needed | Pre-flight (§2), B1 OI map |
| 09:15–10:35 | **1 min** | `minute.jsonl` line; Sniper log diff; Scenario B state machine. Sensibull at 09:20, 09:29, 09:44, 10:30 |
| 09:46, 10:31 | once | Export the history CSV; confirm `callWall/putWall/oiLadder` columns are populated |
| 10:35–15:30 | **5 min** | `minute.jsonl` (spot, breadth, PCR, walls); note any **wall shift** (callWall/putWall changes strike) or a PCR move > 0.1 in 15 min. Sensibull at 12:30, 15:15 |
| 15:31 | once | Final CSV export (the app also auto-saves at 15:35) |
| 15:35 | once | EOD (§9) |

After 10:35 both scenarios are finished. The afternoon is data collection only: does the OI map hold
into the close?

## 8. Data faults and alerts

**Notify the user right away** (macOS notification or chat; keep it to one line) when:
- Pre-flight #1, #2 or #5 fails, or the console shows `do not straddle ATM`.
- `ageSec` > 90, `quoteAgeSec` > 90, or spot doesn't change for 3 minutes during 09:15–10:30
  (check `pmset -g log` for sleep before blaming the app).
- The PCR in history is outside 0.3–3, or `callsOI` / `putsOI` reads 0. This is the 11-12…11-17 failure
  mode coming back.
- The app's `callWall`/`putWall` disagree with Sensibull by more than one strike (100 pts) for 2 reads in a row.
- **Scenario A** enters or exits, or **Scenario B** arms or triggers. Format: `B LONG trigger 09:38 @25,312, stop 25,287, target 25,342`.

On a fault: mark `"dataOk":false` with the reason, keep logging, and never fill gaps by
interpolation. If the app tab is unresponsive for more than 3 minutes, ask the user before refreshing.

## 9. End of day (15:35)

1. Put the exported CSVs in `~/Downloads` (the app saves them there), then run
   `npm run replay:sniper -- ~/Downloads/<today's market_history_log CSVs>`. The replay merges
   files by timestamp and drops days without enough coverage.
2. Write `eod_report.md`:

```markdown
# Live monitor — <date>
## Data quality
pre-flight: pass/fail per item · stale periods · PCR range seen · walls vs Sensibull agreement
## OI map
B1 floor/ceiling/bias → how it played out (held / broke / shifted, when)
## Scenario A — Sniper
range, walls traded, every decision change (deduped), signal flips, trade + result (points)
## Scenario B — Wall-reclaim (notional)
arms / triggers / blocks with reasons, trade(s) + result (points)
## Hindsight
best +30-before-−15 entry in 09:25–10:30; how close A and B came to it
## Replay check
`npm run replay:sniper` output for today vs what was observed live (they should match for A; differences = bug)
## Observations (no parameter changes)
what the tape showed that neither rule captures
```

3. Do **not** recommend threshold changes from one day. Add the day to the running tally at the bottom
   of this file:

| Date | A trade (pts) | B trade(s) (pts) | Hindsight best | Data OK |
|---|---|---|---|---|
| 2026-11-17 (replayed) | L 09:25 −15.2 | (D rules) L 09:31 −23.6, L 09:39 +33.8 | L ~09:38 +30 | No: PCR/OI corrupt |
