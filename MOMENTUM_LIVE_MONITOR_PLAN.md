# Live Market Monitor — Momentum vs Manual 5-min/OI Read

> Brief for an AI agent monitoring one NSE session, 09:10–15:35 IST (or from whenever it starts).
> Written 2026-11-18. Reusable on any trading day; replace the date in the paths.
> Companion to `SNIPER_LIVE_MONITOR_PLAN.md`, which covers 09:15–10:30.

## 0. Why this exists

The Momentum engine trades 09:30–15:00 on a multi-factor score (1m/5m/15m price alignment, breadth,
options flow, PCR). Its support and resistance are **classic pivots (S1/R1)**. It never looks at where
the OI walls are.

The trader's manual method reads three screens: **Sensibull OI vs strike** (where the writers sit),
**Nifty50 5-minute candles** (the trend), and the app's **1-minute Day Sentiment & Momentum History**
(breadth and options flow). The trader enters only when a ~30-point move fits before the next wall.

2026-11-18 showed the gap. Momentum made three paper shorts:

| Time | Entry | Result | Note |
|---|---|---|---|
| 09:38 | 25300PE | won, +₹1,831 | matched the manual read |
| 10:24 | 25250PE | lost, −₹839 | 52 points above the 25200 put wall |
| 10:45 | 25200PE | lost, −₹791 | 24 points above the 25200 put wall |

It then stood down for the day after two losses in a row. Every Momentum entry now logs `room`, the
distance to the nearest OI wall in its path.

This session collects evidence for one question: **does room to the wall separate Momentum's winners
from its losers, and does the manual read do better?** Nothing gets tuned from a single day.

## 1. Hard rules (non-negotiable)

1. **Observe only.** Don't place, modify or close any order. Don't press Start, Stop, Buy or Close in
   any panel. Don't change any setting.
2. **PAPER only.** If `engines.autotrade.mode` in `/api/ops/state` is ever not `PAPER`, write an ALERT
   and stop recording trades.
3. **Never edit browser storage**: localStorage `momentum_orderbook`, `momentum_session` or
   `momentum_settings`, or IndexedDB `NiftyLiveDB`. Today's loss limit, cooldowns and the paper ledger
   are all computed from that order book. Editing it destroys the record this exercise exists to keep.
4. **Never type an OTP, password or token.** If the session needs a login, stop and ask the user.
5. **Never write a value you didn't read.** If a field is unavailable, write `null` and add an
   `issues` entry. (On 2026-11-18 the collector script wrote hard-coded PCR and wall values into every
   row, which made that file unusable.) Every number needs a source (section 3).
6. Scenario H (section 6) is **notional**. Its rules are fixed below. Don't improve them mid-session;
   put ideas in the EOD report.

## 2. Pre-flight (run at start; at 09:10 on a normal day)

| # | Check | How | Pass |
|---|---|---|---|
| 1 | App is live | `curl -s localhost:5001/api/ops/state` | `ageSec < 10`, `stale:false`, `market.quoteAgeSec < 60` |
| 2 | Mode | same | `engines.autotrade.mode == "PAPER"` |
| 3 | Momentum running | same | `engines.momentum.state == "RUNNING"`; record `lastGate` |
| 4 | New logging loaded | App tab: hard-refresh **once** (Cmd+Shift+R) before 09:10. If the session is already running, refresh only when Momentum is flat. | Page loads; Momentum panel shows `RUNNING` again |
| 5 | OI ladder reaches snapshots | Day Sentiment & Momentum History → **Export CSV** (download icon). Open the newest `~/Downloads/market_history_log*.csv`. | `oiLadder` column is non-empty in the latest rows, and `callWall`/`putWall` are numbers. If they're empty, raise an ALERT. The new `room` logging will then record `null`, and that is the first thing to fix. |
| 6 | Option chain healthy | browser console, filter `straddle` | no "one-sided" error |
| 7 | Mac stays awake | `pmset -g assertions \| grep -i caffeinate` | an assertion is held. Otherwise ask the user to run `caffeinate -dimsu &`. |
| 8 | Sensibull | https://web.sensibull.com/open-interest/oi-vs-strike?tradingsymbol=NIFTY | loads, shows the current expiry |
| 9 | 5-min chart | TradingView or Fyers web, NIFTY 50 index, **5-minute** candles | live candles |
| 10 | Output folder | create `TradingJournal/<date>/momentum-monitor/` in the repo | writable |

Record each result as the first lines of `decisions.md`.

## 3. Where each input comes from

| Input | Source | Field / location |
|---|---|---|
| Spot, engine state, last gate, open positions | `GET localhost:5001/api/ops/state` | `snapshot.market.spot`, `snapshot.engines.momentum.{state,lastGate}`, `snapshot.positions` |
| Momentum gate changes | `~/TradingJournal/<date>/gates.jsonl` | rows with `strategy:"MOMENTUM"`: `blockedBy`, `reason`, `direction`, `score`, `threshold` |
| Momentum entries, with room to the wall | `~/TradingJournal/<date>/decisions.jsonl` | `strategy:"MOMENTUM", event:"ENTRY"`: `direction`, `spot`, `premium`, `score`, `wallStrike`, `wallOI`, `room`, `callWall`, `putWall`, `pcr`, `oiLadder`, and `walls` = `{floor, floorRoom, floorOIChangePct, ceiling, ceilingRoom, ceilingOIChangePct, comparedMinutes}` (OI change over ~5 min; positive means writers are adding) |
| Momentum exits, with the reason | same file | `event:"EXIT"`: `reason`, `premium`, `pnlPercent`, `netPnl`, `spot`, `spotMove`, `heldMs` |
| Orders, fills, prices | `~/TradingJournal/<date>/{orders,fills,exits}.jsonl` | `strategy:"MOMENTUM"` |
| 1-min breadth and options flow | App: Day Sentiment & Momentum History table (or its CSV export) | `overallSent`, `adv`/`dec`, `callSent`/`putSent`, `optionsSent`, `pcr` |
| Per-strike OI | Sensibull OI vs strike (and the app's `oiLadder` column) | put/call OI by strike, in lakhs |
| 5-min candles | TradingView / Fyers 5-min chart | O/H/L/C of each completed candle |

Note that `~/TradingJournal` is in the **home folder**; the repo's `TradingJournal/` is only for this
monitor's output.

## 4. Output files (append-only, `TradingJournal/<date>/momentum-monitor/`)

- `minute.jsonl`: one row per minute, with **only values read this minute**:
  `{t, spot, momentum:{state,lastGate}, position:{symbol,ltp}|null, candle5:{o,h,l,c}|null (on 5-min closes), hist:{overallSent,adv,dec,callSent,putSent,pcr}|null, H:{state,armed,side,level}, issues:[]}`
- `oi.jsonl`: one row per Sensibull read: `{t, spot, pcr, bars:[{strike,putOI,callOI}] for ATM ±500, floor, ceiling}`
- `decisions.md`: one line per event (`M-ENTRY`, `M-EXIT`, `M-GATE`, `H-ARM`, `H-TRIGGER`, `H-SKIP`,
  `H-EXIT`, `OI-READ`, `ALERT`), each with time, spot and reason
- `eod_report.md`: section 9

## 5. Scenario M — monitor the Momentum engine

Every minute, take the spot and Momentum `state`/`lastGate` from ops state. Tail
`~/TradingJournal/<date>/gates.jsonl` and `decisions.jsonl` for new MOMENTUM rows.

**On every Momentum ENTRY row:**
1. Copy `direction`, `spot`, `premium`, `score`, `wallStrike`, `room`.
2. Within 2 minutes, take a Sensibull read and note the nearest significant wall in the trade's path
   (puts below for a SHORT, calls above for a LONG). Use your own eye and say which bar it is.
   Compare with the app's `wallStrike`. A disagreement over 50 points is an `issues` entry.
3. Note the last two completed 5-min candles and the 3-minute breadth direction.
4. Write: `M-ENTRY 10:24 SHORT @25252 room 52 (app) / 25200 put wall 68L (Sensibull) · 5m: lower high 25316→25287 · breadth falling · H would: SKIP (room) | AGREE | OPPOSE`.

**On every EXIT row:** copy `reason`, `pnlPercent`, `netPnl`, `spotMove`. Also record the **maximum
favourable and adverse spot excursion** during the hold, from your minute rows.

**Lockouts:** if `lastGate` says `Stand down today`, `Daily limit` or `Daily net loss limit`, record it
once. Then keep running Scenario H to the close: the manual read is still worth scoring. Don't try to
clear the lockout (rule 3).

## 6. Scenario H — the manual 5-min/OI read (notional)

Follow these rules **exactly as written**. They were fixed before any result was seen.

### H1. OI map: at start, then every 15 minutes, and whenever spot moves 50+ points from the last read
- Using Sensibull, within ATM ±500: take the largest put OI below spot and the largest call OI above.
- **Floor** = the nearest put strike below spot with OI ≥ 50% of that largest put bar.
- **Ceiling** = the nearest call strike above spot with OI ≥ 50% of that largest call bar.
- Note the change since the previous read at the floor and ceiling. Writers adding means the wall is
  defended; writers cutting by more than 15% means the wall is weakening.

### H2. 5-minute trend (on every completed 5-min candle)
- **DOWN** if the last 3 completed candles have lower highs **and** lower lows.
- **UP** if they have higher highs **and** higher lows.
- Otherwise **RANGE**.

### H3. Entry (09:30–14:45 only)
- **Direction** = the H2 trend. In RANGE, trade only a wall fade: SHORT within 10 points of the
  ceiling, LONG within 10 points of the floor.
- **Trigger, with trend:** a 1-min close beyond the previous completed 5-min candle's low (SHORT) or
  high (LONG), **and** `overallSent` moving with the trade over the last 3 minutes.
- **Trigger, wall fade (RANGE):** two consecutive 1-min closes ≥ 10 points back off the wall, with
  breadth agreeing over 3 minutes.
- **Room check:** points from entry to the wall in the trade's path (H1). **SKIP if room < 30** and
  record `H-SKIP room <n>`. A trend trade whose wall the writers are cutting (more than 15% OI drop
  since the last read) counts the next wall instead.
- **Stop** = the previous 5-min candle's high + 5 (SHORT) or low − 5 (LONG). Skip if that is more
  than 20 points away.
- **Target** = +30 points, or wall − 5 if that is closer (then record `target:"wall"`).
- **Limits:** at most 4 attempts a day. 5 minutes of cooldown after an exit, 15 minutes after a
  loss. Stop for the day after 2 losses in a row. These match the engine's own limits, so the two are
  compared on the same terms.
- Check the stop **before** the target each minute, using the 1-min low/high. Exit at 15:00 if
  neither has hit.

## 7. Cadence

| When | Do |
|---|---|
| every minute | ops state + journal tail → `minute.jsonl` |
| every 5-min close | H2 trend, candle into `minute.jsonl` |
| every 15 min / ±50 move | Sensibull read → `oi.jsonl` (H1) |
| on any Momentum ENTRY/EXIT | section 5 steps, immediately |
| 15:00 | close any notional H position; note Momentum's flat state |
| 15:35 | export the CSV, write the EOD report |

If you script any of this, the script may **only** copy fields it fetched. No constants in data
fields (rule 5).

## 8. Faults and alerts (write `ALERT` lines)

- ops state `stale:true` or `ageSec > 30` for 2+ minutes: the app tab may be asleep or closed.
- Momentum `state` is not `RUNNING` during 09:30–15:00 with no lockout reason.
- An ENTRY row with `room:null` or `oiLadder:null`: the ladder isn't reaching snapshots.
- `mode` is not `PAPER`.
- Sensibull and the app disagree by over 50 points on the wall for an open trade.

## 9. End of day (15:35)

1. Export **Day Sentiment & Momentum History → Export CSV** to `~/Downloads` (needed for replays).
2. Copy today's `~/TradingJournal/<date>/{gates,decisions,orders,fills,exits}.jsonl` rows with
   `strategy:"MOMENTUM"` into `momentum-monitor/journal-copy.jsonl`.
3. Write `eod_report.md`:

```
# Momentum monitor — <date>
## Data quality      (pre-flight results, alerts, any null/`issues` periods)
## Trades            table: side · entry time/spot · premium in/out · reason · net ₹ · spot move · MFE/MAE · room (app) · wall (Sensibull) · 5m trend · H verdict
## Scenario H        every arm/trigger/skip/exit, net points, how it compares with M
## Room vs outcome   every M and H trade with room < 30 vs ≥ 30, and its result
## Missed moves      any 5-min trend leg ≥ 40 pts that neither scenario traded, and why (gate / rule)
## Observations      no parameter changes; ideas only
```

4. Append one row to the running tally in `TradingJournal/momentum-tally.md`:

`| date | M trades | M net ₹ | M wins | H trades | H net pts | H wins | room<30 trades (W/L) | room≥30 trades (W/L) | lockout time |`

**Decision rule, for the user and not the agent:** after at least **15 Momentum entries** with a
`room` value, compare the win rate below and above 30 points. Only if the gap holds across several
days is a room gate worth adding.

## 10. Today (2026-11-18) specifically

Momentum locked out at 10:56 (`Stand down today: 2 consecutive net losses`) and can't trade again
today. Rule 3 forbids clearing that. For the rest of today:
- Run pre-flight items 1–3, 5 and 7–10. Item 5 matters most: it is the first proof that the OI ladder
  is reaching the snapshots.
- Run **Scenario H** from now to 15:00, and log Momentum's state each minute.
- At the close, export the CSV. That gives the first full day with `oiLadder` logged, which a
  Momentum replay can score.
- The first live ENTRY/EXIT records with `room` will come in the next session.
