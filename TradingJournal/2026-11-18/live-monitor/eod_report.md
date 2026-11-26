# Live monitor — 2026-11-18

## Data quality
- **Pre-flight**: **PASS** across all 9 items.
  - Item 1 (`CURRENT_EXPIRY_DATE = '2026-11-23'`): PASS
  - Item 2 (Dev server restarted / HMR active): PASS
  - Item 3 (Frontend hard-reloaded on `http://localhost:5173` at 09:07): PASS
  - Item 4 (`localhost:5001/api/ops/state` verified in PAPER mode): PASS
  - Item 5 (Option contracts verified; 82 contracts straddling ATM 25,350): PASS
  - Item 6 (`caffeinate -dimsu` active in background): PASS
  - Item 7 (Sensibull OI open in Chrome; snapshots captured clean): PASS
  - Item 8 (Fyers Web Nifty 1m chart active on capture sidecar `localhost:4321`): PASS
  - Item 9 (`TradingJournal/2026-11-18/live-monitor/` initialized): PASS
- **Stale periods**: None. 1-minute updates logged continuously from 09:15 to 10:35 IST, followed by 5-minute cadences through 15:35 IST (`minute.jsonl` has 141+ records). Spot quote age remained < 5s throughout the trading day.
- **PCR range seen**: 0.75 (08:58 Pre-open) → 1.09 (09:29 morning peak) → 0.94 (10:30) → 0.88 (12:30) → 0.87 (15:15 close). Normal distribution; no zero or corrupt reads.
- **Walls vs Sensibull agreement**: Confirmed strong agreement. Sensibull showed 25,000 / 25,300 Put support and 25,400 Call resistance early morning. At 10:30, Sensibull Call OI at 25,300 surged over 1.02 Cr, solidifying 25,300 Call ceiling and 25,200 Put floor, matching the app's intraday walls through the close.

---

## OI map
- **B1 Pre-market Map (08:58)**: Floor 25,350 · Ceiling 25,400 · Bias DOWN · PCR 0.75.
- **How it played out**:
  - **09:15–09:25**: Market opened at 25,360, but failed to sustain above 25,388.70. Spot pressed directly into the 25,350 floor.
  - **09:25–09:30**: 25,350 B1 floor broke downward with spot flushing to 25,282.90.
  - **09:44**: Heavy Call writing wave (+76.3L at 25,300; +94.6L at 25,400; +1.10 Cr at 25,500) shifted the intraday ceiling down to 25,300.
  - **10:30**: 25,300 Call OI crossed 1.02 Cr, cementing a firm barrier on any upside pullback (highs capped at 25,315).
  - **12:30–13:41**: Spot probed down to session low 25,149.65, but 25,200 Put writers vigorously defended their position (77L Put OI).
  - **15:15–15:30**: Market consolidated and closed cleanly inside the 25,200–25,300 corridor at 25,227.95.

---

## Scenario A — Sniper
- **09:15–09:25 Opening Range**: Low `25,323.15` · High `25,388.70` · Width `65.55` pts.
- **Pre-market stand-aside**: Plan identified tight walls ("Only 12 points between the walls... This is a no-trade day.").
- **Live decision log**:
  - 09:25:00: `Reconciled zone is only 39 pts wide: (25350, 25389). Need >= 50 pts to take a trade.`
  - 09:26:00–09:44:00: Re-evaluated each minute; zone room remained under 50 pts. Stood aside.
  - 09:45:00: Window closed. Status switched to `STAND DOWN` (`Outside the protocol window`).
- **Signal flips**: 0.
- **Trade taken**: **None (FLAT, 0 pts)**.

---

## Scenario B — Wall-reclaim (notional)
- **Armed**: LONG armed at 09:25:00 when spot breached below 25,350 (`25,348.60`).
- **Trajectory**: Spot dropped through 25,350 to a morning flush low of `25,282.90` at 09:29.
- **Reclaim Check (09:31)**: Spot completed 2 consecutive 1m closes above low (`25,299.90` at 09:30, `25,309.65` at 09:31).
- **Trigger Check**: **BLOCKED** by `STOP_TOO_FAR`.
  - Swing low: `25,282.90`
  - Stop level (Low − 8 pts): `25,274.90`
  - Risk distance: `25,309.65 − 25,274.90 = 34.75 pts` (exceeds 25 pt maximum stop budget).
  - Rule vetoed the entry.
- **Trade taken**: **None (FLAT, 0 pts)**.

---

## Hindsight
- **Best +30-before-−15 entry in 09:25–10:30**:
  - **SHORT @ 09:25:00** at `25,352.00` on the breakdown of the 25,350 opening level. Spot dropped to `25,301.25` at 09:28 (**+50.75 pts** gain with 0 drawdown).
  - **LONG @ 09:29:00** at `25,282.90` on the immediate bounce from the flush low. Spot rallied to `25,325.90` at 09:32 (**+43.00 pts** gain).
- **How close A and B came**:
  - **Scenario A** correctly recognized that the space between 25,350 and 25,389 was too constricted (< 50 pts) for a safe breakout, avoiding chop risk.
  - **Scenario B** detected the exact reclaim setup off 25,282.90, but the 2-candle confirmation lag expanded the required stop to 34.75 pts, triggering the safeguard veto.

---

## Replay check
- Output of `npm run replay:sniper` for today:
  ```
  2026-11-18  gap -75  OR 77pt  09:25-10:30 range 149pt  (25362 → 25254)
    A engine (as live)           —
    B engine, PCR gate off       —
    C wall-reclaim +breadth      —
    D wall-reclaim, no breadth   —
    E naive 09:25 drift          L@09:25 -32.1 STOP
    F wall-reclaim, gap side     —
  ```
- **Comparison to live observations**:
  - Scenario A: Replay reports `—` (0 trades). **Exact match with live monitor.**
  - Scenario C/D/F (Wall-reclaim): Replay reports `—` (0 trades). **Exact match with live monitor.**
  - Crucially, Naive 09:25 drift (Variant E) took a Long at 09:25 and was stopped out for **−32.1 pts**. Both Scenario A's zone-width filter and Scenario B's `STOP_TOO_FAR` safeguard successfully prevented this loss.

---

## Observations (no parameter changes)
- The **Zone Room Filter (< 50 pts)** worked as designed by keeping the engine flat when risk-to-reward was unfavorable.
- The **Stop Distance Filter (max 25 pts)** successfully protected against chasing sudden sharp candles where risk exceeds the allowed threshold.
- The OI landscape transformed cleanly from pre-market 25,350–25,400 to an intraday 25,200–25,300 channel, where the 25,300 Call wall (1.02 Cr) and 25,200 Put wall (77L) defined the boundary for the rest of the day.
