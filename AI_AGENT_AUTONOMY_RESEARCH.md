# Automating the Daily Routine & Handing Control to an AI Agent — Research and Analysis

> Prepared 2026-10-23 from a read-only audit of `FyersNifty50Live`, the `liveImageAnalsis` sidecar (:4321),
> and your saved exports in `~/Downloads/04_TRADING_FINANCE` (8 pre-market decisions, 19 intraday
> history days, 25 days of screenshots, 23 days / 2,821 runs of the vision archive).
> Every claim below is cited to a file or to data that was measured; nothing is taken from the
> aspirational docs in this repo.

---

## 0. TL;DR

1. **The routine can shrink from ~10 manual steps to one OTP tap.** Every step except the
   Paytm login is browser state or an existing HTTP endpoint, so a scheduled Node + Playwright
   "morning runner" can do it. The snapshot capture is *already* an API (`POST :4321/api/snapshots`).
2. **But automating it does not make money by itself, because there is no evidence yet that the
   system has an edge.** There is not a single recorded trade, P&L or win rate anywhere. What *can*
   be measured says direction is a coin flip (vision bias hit-rate ~52%, negative average points;
   your own `ml/README.md` walk-forward: 45–47% directional accuracy).
3. **The AI chart-reading step is close to constant.** The OI chart returned **BULLISH / 85 on every
   saved day**; vision confidence was **75 on 95% of 2,277 runs**; the playbook said **GO on 8 of 9
   days**, including days it simultaneously rated "HIGH risk — charts disagree".
4. **LIVE mode has bugs that could lose real money** (unmanaged positions, fake fills reported as
   success, wrong lot size, likely invalid symbols). Do not flip to LIVE until §4 is fixed.
5. **If you gave me (an AI agent) full control, I would not start by trading.** I would spend the
   first weeks making the system *measurable and safe*, run a pre-registered paper forward-test with
   realistic fills, shift research toward what your data says is predictable (range/volatility, not
   direction), and only go live with 1 lot, broker-side stops and a hard rupee kill switch once
   promotion criteria are met. Details in §6.

---

## 1. What your morning routine actually does

| # | Your step | What happens under the hood | Automatable? |
|---|---|---|---|
| 1 | **Reset** | `handleReset` (`components/SettingsScreen.tsx:255`) clears today's IndexedDB stores, then **`localStorage.clear()`** — which also wipes `fyers_creds` (all keys/tokens), AutoTrade mode, Sniper/Momentum state, paper book. | Yes — and it should be replaced (see §2.2). The *only* reason step 3 exists is that step 1 deletes your credentials. |
| 2 | **🚀 Generate AccessToken** | Paytm Money OAuth (`TokenGeneratorModal.tsx`, `server.js:747-890`). Human enters mobile + OTP on Paytm's site; token saved to a file and to form state. Fyers token is pasted manually (no OAuth code exists). | **Partly.** The OTP is the one step that needs a human (or a broker with a refresh-token flow — §2.1). The "auto refresh" endpoints in `SEAMLESS_TOKEN_*` docs **do not exist** in code. |
| 3 | **Import** | Reads a config JSON into form state; persisted on Save (`SettingsScreen.tsx:369-542`). ⚠️ An old file **overwrites** the token you just generated. | Yes — becomes unnecessary. |
| 4 | **AI Capabilities** | Just the `aiEnabled` flag in `fyers_creds`. | Yes — becomes unnecessary. |
| 5 | **Capture @ :4321/#market → Save snapshots** | Button calls `POST /api/snapshots` (`liveImageAnalsis/src/server.js:90`); Playwright drives your logged-in Chrome and writes 5 PNGs to `~/Downloads` as `YYYYMMDD-HHMMSS-<view>.png`. | **Already headless** — it's one HTTP call. |
| 6 | **PreMkt → Upload charts** | Browser file picker only (`PreMarketAnalyzer.tsx:706-772`). Filenames already auto-route to the 4 slots. Each chart → vision LLM (Gemini `gemini-2.0-flash` or Ollama). | Yes, with a small endpoint + button (§2.3). |
| 7 | **Generate decision** | **Not an AI call** — deterministic `buildDecision()` (`PreMarketAnalyzer.tsx:148`) + `buildSniperPlaybook`. Auto re-cuts at 09:10 / 09:20 if a live price exists. | Yes — can run automatically after step 6. |
| 8 | **AutoTrade running** | React hooks inside the open tab (`UnifiedAutoTrade.tsx`). Sniper reads today's playbook from IndexedDB every 10 s. Auto-arms at open; PAPER by default. | Runs, but only while the tab is open **and the Mac is awake** (your Mac has `sleep 1` on AC — still true today). |

**Hidden time cost:** apart from the ~10–15 min of clicking, your Mac idle-sleeping costs about
**twice the length of each sleep** in lost guard warm-up, because the guard needs continuous 1/min
history. This was verified on 23 Sep.

---

## 2. Making the routine easy — concrete design

### 2.1 The token problem (the only true human step)

| Option | Effort | Human touch / day | Notes |
|---|---|---|---|
| **A. Keep Paytm, 1-tap OTP.** The runner opens the login popup at 08:40, pre-fills your mobile, and sends a macOS/Telegram notification. You type the OTP and the runner captures `requestToken` (the code already handles postMessage/URL polling). | Small | 1 OTP | Safest; stays within broker terms. |
| **B. Fyers API v3 refresh token.** Fyers issues a refresh token (documented as valid ~15 days) that can mint a new access token with your PIN, so you'd do a full login about twice a month. *Verify the current validity on the Fyers API docs before building.* | Medium (no Fyers OAuth code exists yet) | ~0 (re-login every ~2 weeks) | Also fixes the "Fyers token pasted by hand" gap. |
| C. Automating OTP/TOTP entry by scraping the login page | — | 0 | **Not recommended.** Fragile, usually against broker terms, and a credential-security risk. |

**Regulatory note:** SEBI's 2025 retail-algo framework makes the broker responsible for API
algos. It brings static-IP whitelisting, algo-ID tagging and session logout requirements, phased in
through 2025–26. Before running unattended LIVE orders, check with Paytm Money / Fyers what they
currently require from a self-built API algo. Paper trading and data are not affected.

### 2.2 Replace "Reset → Import → AI Capabilities" with an idempotent *New Trading Day*

Today Reset nukes everything, so you must re-import credentials. Instead:

- Split localStorage keys into **durable** (credentials, AI provider/keys, settings) and **day-scoped**
  (`sniper_*`, `momentum_session`, `*_orderbook_*`, `paper_trading_book_v1`, baselines).
- Add `startNewTradingDay()`: clear only day-scoped keys/stores when the stored IST date ≠ today,
  automatically on first load after 08:00. No button, no Import, no AI toggle.
- When the token is regenerated, write it straight into `fyers_creds` **and** Redis `paytm:access_token`
  (today it only reaches Redis after the first successful quote call, `server.js:99-114`). Then the
  server-side failover fetcher can work even if the tab dies.

**Result:** steps 1, 3, 4 disappear.

### 2.3 Snapshots → PreMkt without the file picker

1. In `liveImageAnalsis`: let `/api/snapshots` accept `{dir}` (the function already supports it,
   `src/capture.js:1059`) and serve the saved files (e.g. `/snapshots/<file>`).
2. In FyersNifty50Live: the `/api/vision/*` proxy already exists (`server.js:326-384`). Add a PreMkt
   button **"Pull today's charts"**. It calls `/api/vision/snapshots`, fetches the PNGs and feeds them to the
   existing `ingestFiles` (filename routing already matches), then runs analysis and Generate decision.
3. Add a staleness check before trusting a capture. Today's sidecar shots show the **Fyers PNG at
   exactly 306,159 bytes and Kite at 77,543 bytes in every run 14:40–15:15**, which means a frozen
   chart or a login page is being analysed as if it were live. Reject an image whose hash equals the previous run's, and
   always store `capturedAt` vs spot.

**Result:** steps 5, 6, 7 become one automatic action at ~08:50.

### 2.4 The morning runner (ties it together)

`scripts/morningRunner.mjs`, started by **launchd** at 08:35 on weekdays (NSE holiday list aware):

```
08:35  caffeinate -dimsu -t <until 15:40>          # fixes the sleep stalls
       start server.js / vite / sidecar if down; health-check :5001, :5173, :4321, Ollama
       pre-flight: expiry constants == next NSE expiry?  lot size from security master?
                   Redis reachable?  disk space?  → any FAIL = notify + do NOT arm AutoTrade
08:40  token: notify you → you tap OTP (option A)  or refresh silently (option B)
       Playwright opens :5173 (persistent profile); startNewTradingDay() runs on load
08:50  POST :4321/api/snapshots → PreMkt "Pull today's charts" → decision generated
09:05  verify decision.generatedAt is today, playbook present, snapshots fresh → notify summary
09:10+ app's own re-cuts (PREOPEN/INTRADAY) run; AutoTrade auto-arms (PAPER)
15:35  EOD: export market_history_log, paper book, decisions, scorecard to ~/TradingJournal/<date>/
       optional: `claude -p` reads the day's files and writes a debrief markdown
```

Your involvement drops to one OTP tap, plus reading one notification.

> Longer term, move the engines out of the browser. Snapshots already land in Redis, and the Node
> workers (`scripts/momentumAutoTradeWorker.ts`) already run the same guard but only `console.log`.
> A Node daemon that owns state and orders survives a closed tab, a reload or a sleeping display, and
> the browser becomes just a dashboard.

---

## 3. Does the system make money? What the evidence says

### 3.1 There is no performance record

- **No trades, P&L, win rate or journal is persisted anywhere** outside browser IndexedDB.
  `data/local_redis.json` holds only market snapshots (14–16 Oct).
- The figures in docs (`+117 points yesterday`, `44.8% hit rate / PF 1.35`,
  `PCR >1.10 = 92.3% bullish accuracy`) have **no script or data that reproduces them**. The PCR
  numbers look like 12/13 and 5/7 samples.
- `services/agentScorecard.ts` is well designed (Wilson intervals, overlap-adjusted N), but it **only
  grades AI Lab agents, not Sniper, Momentum or pre-market**, which are the parts that would trade.

### 3.2 What can be measured is not encouraging

| Component | Measurement | Result |
|---|---|---|
| Vision archive (gemma4, 23 days, 2,277 parsed runs) | bias vs spot at +15/+30 min (8-pt neutral band) | **51.8% / 52.9% hit rate, −3.1 / −2.4 avg pts** |
| | action episodes (independent) | 22 episodes over 8 days — no edge, huge variance (e.g. 13 Oct SHORT −153 pts @15m) |
| | confidence field | **75 on 95% of runs** → carries no information |
| Pre-market vision verdicts (8 days) | per-chart bias | OI chart **BULLISH/85 every day**; Daily mostly NEUTRAL/65; Intraday mostly NEUTRAL/60 |
| Pre-market playbook | verdict | **GO on 8/9 exports**, incl. "riskLevel HIGH — charts only 50% aligned" |
| Playbook vs actual price (only 3 days overlap) | spot simulation | 17 Sep target ✅, 29 Sep stop ❌, 28 Sep no trigger (built 04:13 from charts; zone 23100–23180 vs actual open 22869). **n=3 means nothing.** |
| Your own ML walk-forward (`ml/README.md`, 22 held-out sessions) | direction | **45–47% accuracy — "not predictable"**; range/volatility *is* (corr ≈ 0.21) |
| Momentum guard's own comment (`momentumEntryGuard.ts:28-62`) | 22 Sep scans | clearing 68 → **−2.52 pts/15 min**; clearing 75 → **−10.82, 22% win** |

### 3.3 The trade structure works against you

- **Reward vs risk:** a saved playbook enters anywhere in a 30-pt zone and targets the *top of that
  zone* (e.g. trigger 23200–23230, target 23230, stop 23170). An entry near the top risks ~60 pts to make
  ~0–2. The current engine uses +25/−15 on spot, which is better, but premarket text and the LLM
  review prompt still say ±30 / 10:15 (`premarketReview.ts:18-20`), so the "analyst" reviews the wrong rules.
- **Costs vs edge:** a 1-lot round trip on a ~₹280 premium costs ≈ ₹85 in charges plus spread, which is
  roughly 2–4 premium points. That is the same size as the best gross edge any sample above suggests.
- **Paper P&L is model output, not market fills.** Premium comes from `estimateOptionPremium`
  (a formula whose own file says never use it for real money) and is marked with a fixed 0.85 delta,
  with no theta, IV or bid/ask. Paper results will overstate performance.
- **Base rate:** SEBI's studies of F&O traders (2024, 2025) found **~9 in 10 individual traders lost
  money**, with option *buyers* faring worst. A directional ATM/ITM option-buying system starts at a disadvantage.

### 3.4 Process red flag: tuning to yesterday

Between 16 Sep and 17 Oct the entry rules were loosened ~8 times, each after a single session:
confidence 80→68→62, efficiency 0.55→0.40→0.30→0.20 (super-trend), move gates 8/15→5/8, wider
windows, 45 s fast-track. Sniper parameters (30/30→25/15, min confidence 75→65, hard stop
10:15→10:30) changed inside a commit titled *"chore: update Nifty weekly options expiry"*
(`1e0245b`). The 8 Oct post-mortem lists four "missed opportunities" on a −182 pt day and then
loosens gates to catch exactly those. That is hindsight fitting: every loosening admits trades the
data predicts will lose, and parameters never stay fixed long enough to measure anything.

---

## 4. Blockers before ANY live money (verified in code)

| # | Defect | Evidence | Consequence |
|---|---|---|---|
| 1 | **Live positions are never managed.** A broker accept sets `PLACED`; positions update only on `FILLED`; nothing polls the broker order book. | `orderManager.ts:291,341,396` | In LIVE, stop / target / hard-stop logic sees no position. **A live entry is left unmanaged.** |
| 2 | **Fake success in LIVE.** Missing Fyers creds → server replies `{s:'ok', id:'SIM-FY-…'}`. | `server.js:919-925` | LIVE mode reports an order that never reached the exchange. |
| 3 | **Wrong token for Paytm orders.** The Paytm place-order route uses `process.env.PAYTM_ACCESS_TOKEN` and ignores the token you generate each morning. | `server.js:949-985` | LIVE orders are rejected or simulated depending on a stale env var. |
| 4 | **Wrong lot size.** Hardcoded 75; your security master says NIFTY lot = **65** on every row. | `SniperPanel.tsx:48`, `MomentumPanel.tsx:35`, `paperTradingService.ts:21` | Wrong qty → rejection or 15% oversize; paper P&L is mis-scaled. |
| 5 | **Symbol format.** `NIFTY${expiry}${strike}CE` with no `NSE:` prefix or broker month code. | `sniperEngine.ts:369`, `MomentumPanel.tsx:202` | Likely rejected by Fyers; verify against the symbol master. |
| 6 | **Stale expiry constants.** Generated JS says `2026-10-19`, the TS source says `2026-10-13`, and you traded 22 Oct. Updated by a manual weekly commit. | `constants/generated/niftyWeeklyOptions.js:5`, `constants/niftyWeeklyOptions.ts:12` | PCR/OI inputs may come from an expired series. |
| 7 | **No global kill switch, no broker-side stop.** Stops live in a browser tab on a Mac that sleeps after 1 min. | §1, memory of 23 Sep stalls | A sleep, reload or crash leaves a naked option position. |
| 8 | **`liveOrdersEnabled` setting is read by nothing.** | Import handler vs engines | False sense of a safety switch. |

---

## 5. Why "give the AI full control" needs a precise definition

An LLM is the wrong component to pull the trigger tick by tick:
- **Latency and variance.** Seconds per call, and different answers to the same input. Your own vision
  data shows the other failure: near-identical answers to *different* inputs (BULLISH/85 daily).
- **No calibration.** A stated "confidence 75" was not a probability in 2,277 runs.
- **Hindsight.** An LLM reviewing a day is very good at explaining what happened and very bad at knowing
  whether that explanation generalises. That is how the gate-loosening loop in §3.4 happened.

So "full control" should mean the agent **operates, measures, researches and polices** the system.
**Deterministic, pre-registered rules execute the trades**, and the agent can only *veto or shrink*
in real time, never enlarge. Your `sniperReview.ts` already follows this "narrow-only" pattern, and it
is the right instinct.

---

## 6. What I would do with full control — the plan

### Phase 0 — Make it safe and measurable (weeks 1–2, no trading changes)

1. Fix §4 items 1–6. Order status sync: poll `orders`/`positions` from the broker every few seconds,
   reconcile, and alert on any mismatch.
2. **Append-only journal on disk** (`~/TradingJournal/<date>/*.jsonl`): every decision, gate
   evaluation, order, fill, exit and snapshot hash. If it isn't on disk it didn't happen.
3. Extend `agentScorecard` grading to **Sniper, Momentum, pre-market bias and vision**: same +5/15/30
   horizons, Wilson intervals, effective N.
4. **Freeze parameters.** Version them in one `strategy.config.json` with a semver. Any change gets a
   new version, and results are only compared within a version.
5. Build the morning runner (§2.4) and keep the machine awake.

### Phase 1 — Honest paper forward-test (weeks 3–10)

- **Realistic fills:** use the real option LTP/bid-ask from the feed you already poll, not
  `estimateOptionPremium`. Charge spread + statutory costs.
- **Pre-register** the rules and the promotion criteria *before* the test starts (below).
- **Sample-size reality check:** to detect a modest edge (+0.1 R per trade, 1 R std-dev) at 95%
  confidence you need roughly **(1.96 / 0.1)² ≈ 380 trades**. The Sniper takes at most 1 trade a day,
  so that is about 1.5 years of forward testing. That is why the next bullet matters.
- **Backtest on years, not days.** Sniper exits are on *spot* (+25/−15, time stop). Its mechanical
  core (opening-range / prior-day levels → zone → spot target/stop) can be replayed on **years of
  Nifty 1-minute candles** from the broker's historical API (`/api/history` proxy already exists). Do
  that with a strict train / validation / out-of-sample split. If the mechanical rule has no edge over
  5 years, an LLM reading a screenshot of the same chart will not add one.

### Phase 2 — Research where the edge plausibly is (in parallel)

Your own data says **direction is unpredictable but range/volatility is somewhat predictable**
(`ml/README.md`). That points away from buying directional options and toward:

1. **Regime filter first:** use the predictable part (expected range, opening-range width, VIX,
   gap size) to decide *whether* to trade at all. A "no-trade day" classifier that removes the worst
   days is often worth more than a better entry.
2. **Defined-risk premium structures** (credit spreads / iron condors around the OI walls on
   range-predicted days). Risk is capped by construction. This needs more margin and its own backtest
   on historical option prices; treat it as a research track, not a switch.
3. **Measure the inputs you already capture** (option flow, OI change, breadth) against forward range
   as well as direction. The earlier "no edge" finding was for direction only.
4. **Retire what doesn't earn its keep.** If, after 60 graded days, the vision chart verdicts don't
   beat a constant, drop the screenshot step. It is your most labour-intensive input, and the data so
   far says it is the least informative.

### Phase 3 — Small live, if and only if promotion criteria are met

**Promotion criteria (pre-registered):**
- ≥ 100 paper trades on a *frozen* config version, with realistic fills and costs.
- Profit factor ≥ 1.2 **after costs**, with a positive lower confidence bound on expectancy.
- Max drawdown within the rupee budget; no single-day loss over the daily cap.
- An out-of-sample backtest that agrees in sign.

**Live rules:**
- 1 lot (65). Risk capital you can lose entirely. A hard daily loss cap and a monthly loss cap,
  each enforced by the daemon and flattening everything when hit.
- **Exchange-side SL-M order placed immediately after every entry**, so a crashed machine still has
  a stop.
- Kill switch: one command or Telegram message flattens and disarms.
- Scale up only after another 100 live trades confirm the paper results within tolerance.

### What the agent does every day (steady state)

| Time | Agent action |
|---|---|
| 08:35 | Pre-flight checks (§2.4). On any failure: notify you and do **not** arm. |
| 08:40–09:05 | Token (your OTP), snapshots, decision. Send you a one-line plan: *"Range day expected 66 pts; Sniper GO 22650 CE zone; Momentum paper-armed."* |
| 09:15–15:20 | Execution is deterministic. The agent watches feed health, reconciles orders against the broker, and can **veto or shrink** a trade only for stale data, an event/news spike, a broken rule or a hit risk cap. |
| 15:35 | Grade every decision; write the journal + debrief; update scorecards. |
| Weekly | Research report: what's working with confidence intervals, what isn't, and **proposed** config changes backed by out-of-sample evidence only. **You approve** any change; it ships as a new config version. |

**Hard "will not do" list for the agent:** no parameter changes intraday; no increasing size after a
loss; no averaging down; no trading without a broker-side stop; no going live because of one good
day; no re-tuning on fewer than ~30 sessions.

---

## 7. Realistic expectations

- Automation can save you ~15 minutes and the sleep-stall losses every day. That is certain and cheap.
- Profit is **not** certain, and right now there is no evidence for it either way. The honest
  description of the current system is *"unmeasured, with early signs of no directional edge after costs."*
- The most valuable thing an AI agent can do here is not to find clever entries. It is to stop the
  loop of tuning to yesterday, produce a trustworthy track record, and stop losses the system can't
  justify. If an edge exists, that process will find it. If it doesn't, the same process will show
  that before it costs real money.

---

## 8. Recommended next actions (in order)

| # | Action | Effort |
|---|---|---|
| 1 | `sudo pmset -c sleep 0` (or `caffeinate` in the runner) | 1 min |
| 2 | Fix lot size 75→65, the order-status sync, the fake `SIM-FY` success and the Paytm env token (§4.1–4.4) | ½–1 day |
| 3 | `startNewTradingDay()` — durable vs day-scoped keys; delete the Reset → Import dance | ½ day |
| 4 | Sidecar `/snapshots` serving + PreMkt "Pull today's charts" + stale-image hash check | ½ day |
| 5 | `morningRunner.mjs` + launchd plist + notifications | 1 day |
| 6 | Disk journal + scorecard coverage for Sniper / Momentum / pre-market | 1–2 days |
| 7 | Freeze `strategy.config.json` v1; start the 8-week paper forward-test with real option quotes | ongoing |
| 8 | 5-year 1-minute backtest of the Sniper's mechanical core | 2–3 days |
| 9 | Fyers refresh-token flow (removes the daily OTP) | 1 day |

Items 1–6 are pure engineering with no strategy risk; they can be done next.
