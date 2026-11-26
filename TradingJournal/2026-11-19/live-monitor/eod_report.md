# Live monitor — 2026-11-19

## Data quality
- **Pre-flight**: **PASS** across all 9 items.
  - Item 1 (`CURRENT_EXPIRY_DATE = '2026-11-23'`): PASS (506 contracts verified).
  - Item 2 (Dev server restarted / HMR active): PASS (`server.js` running PID 20381; Vite active).
  - Item 3 (Frontend hard-reloaded on `http://localhost:5173`): PASS.
  - Item 4 (`localhost:5001/api/ops/state` verified in PAPER mode): PASS (`ageSec < 1s`).
  - Item 5 (Option contracts straddling ATM 25200 cleanly): PASS.
  - Item 6 (`caffeinate -dimsu` active in background): PASS (Task `task-742`).
  - Item 7 (Sensibull OI open in Chrome; snapshots captured cleanly): PASS (All 7 scheduled reads completed).
  - Item 8 (Fyers Web Nifty 1m chart active on capture sidecar `localhost:4321`): PASS.
  - Item 9 (`TradingJournal/2026-11-19/live-monitor/` initialized): PASS.
- **Stale periods**: None. 1-minute updates logged continuously from 09:14 to 10:35 IST, followed by 5-minute cadences through 15:36 IST (`minute.jsonl` contains 142 records). Average quote age remained under 5 seconds throughout the entire trading day.
- **PCR range seen**: 0.77 (08:58 Pre-open) → 0.88 (09:20) → 0.97 (09:29) → 0.91 (09:44) → 1.09 (10:30) → 1.27 (12:30 Midday peak) → 1.09 (15:15 Close). Clean, logical progression without corrupted or zero values.
- **Walls vs Sensibull agreement**: Strong agreement. The morning resistance at 25,200 (1.07 Cr Calls at 09:29) was systematically dismantled as Put writers colonized 25,200 (1.30 Cr at 10:30) and 25,300 (1.24 Cr at 12:30), driving a full-day short squeeze into the 25,500 Call wall (1.02 Cr at close).

---

## OI map
- **B1 Pre-market Map (08:58)**: Floor 25,000 (nearest major 25,200) · Ceiling 25,500 (nearest major 25,300) · Bias NEUTRAL · PCR 0.77 · Spot 25,227.95.
- **How it played out**:
  - **09:15–09:30**: Market opened at 25,186.80 and flushed lower to morning low 25,107.85, testing the 25,100 Put defense.
  - **09:30–10:30**: 25,100 and 25,200 Put writers initiated an aggressive accumulation wave (+20L at 25,100; +68L at 25,200). By 10:30, 25,200 Put OI reached 1.30 Cr while Call writers retreated down to 75L, firmly reclaiming 25,200 as support.
  - **10:30–12:30**: Put writers surged into 25,300, adding +80L to cross 1.24 Cr Put OI, lifting spot above 25,360 (+0.52%) and triggering Call short covering.
  - **12:30–15:30**: A sustained trending short squeeze unfolded: Call OI across 25,200 (down to 35L), 25,300 (down to 50L), and 25,400 (down to 55L) unwound violently. Spot pushed all the way to 25,514.30 (+1.09% for the session), testing the 25,500 Call wall before closing.

---

## Scenario A — Sniper
- **09:15–09:25 Opening Range**: Low `25,109` · High `25,262` · Width `153` pts.
- **Risk Officer stand-aside**:
  > *"Risk officer stood the day down — Both walls (25109/25262) come from a 09:15 opening range built on only 7 ticks, and the plan's own walls were already broken by the open, so neither the bounce nor the fade has a level worth trading; this is not about direction."*
- **Live decision log**:
  - 09:25:28: Range check logged. Stood aside.
  - 09:26:28: Risk officer veto recorded (`WAITING` state).
  - 09:45:00: Window expired. Transitioned to `STAND DOWN` (`Outside the protocol window`).
- **Signal flips**: 0.
- **Trade taken**: **None (FLAT, 0 pts)**.

---

## Scenario B — Wall-reclaim (notional)
- **Armed**: LONG armed at 09:25:28 @ `25,159.40` (testing below 25,200 active floor). Initial `testLow = 25,159.40`.
- **Trajectory**: Spot continued downward to `testLow = 25,107.85` at 09:30.
- **Reclaim Check (09:34)**: Spot completed 2 consecutive 1m closes above `testLow + 10` (`c1 = 25,123.40`, `c2 = 25,148.25`).
- **Trigger Check**: **BLOCKED** by `STOP_TOO_FAR`.
  - Swing low (`testLow`): `25,107.85`
  - Stop level (`testLow − 8`): `25,099.85`
  - Risk distance: `25,148.25 − 25,099.85 = 48.40 pts` (vastly exceeds 25 pt maximum stop budget).
  - Rule vetoed the entry.
- **Trade taken**: **None (FLAT, 0 pts)**.

---

## Hindsight
- **Best +30-before-−15 entry in 09:25–10:30**:
  - **SHORT @ 09:25:00** at `25,159.40` on opening drift: spot dropped to `25,107.85` at 09:33 (**+51.55 pts** gain).
  - **LONG @ 09:33:00** at `25,107.85` on immediate rebound off 25,100 Put defense: spot surged to `25,235.30` at 09:46 (**+127.45 pts** gain), and continued running to `25,514.30` (**+406.45 pts** full-day expansion).
- **How close A and B came**:
  - **Scenario A** correctly refrained from engaging on an unverified 7-tick opening range.
  - **Scenario B** accurately detected the low reversal at 25,107.85, but the confirmation delay on a 25-point 1m impulse candle expanded the required stop to 48.40 pts, correctly triggering the risk control safeguard `STOP_TOO_FAR`.

---

## Replay check
- Output of `npm run replay:sniper` for today:
  ```
  2026-11-19  gap -64  OR 90pt  09:25-10:30 range 201pt  (25159 → 25250)
    A engine (as live)           —
    B engine, PCR gate off       —
    C wall-reclaim +breadth      —
    D wall-reclaim, no breadth   —
    E naive 09:25 drift          S@09:25 +35 TARGET
    F wall-reclaim, gap side     —
  ```
- **Comparison to live observations**:
  - Scenario A: Replay reports `—` (0 trades). **Exact match with live monitor.**
  - Scenario C/D/F (Wall-reclaim variants): Replay reports `—` (0 trades). **Exact match with live monitor** (trigger blocked by stop width).
  - Variant E (naive drift) hit target on the opening short (+35 pts) before the market reversed into a +400 pt squeeze.

---

## Observations (no parameter changes)
- Today was a high-momentum expansion day driven by short-covering (+406 points from low to high).
- On such fast trend days, the **Stop Distance Filter (max 25 pts)** reliably prevents entering late after large breakout/reversal candles where the stop-to-risk ratio is poor.
- The Sensibull OI evolution provided an exceptionally clear roadmap of the day:
  1. 09:29: 25,200 Call resistance at 1.07 Cr.
  2. 10:30: 25,200 Call broken, Put OI exploded to 1.30 Cr (Floor established).
  3. 12:30: 25,300 Put OI exploded to 1.24 Cr (Floor migrated up).
  4. 15:15: Calls unwound completely, driving spot directly to 25,500.
