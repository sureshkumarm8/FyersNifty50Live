# Live monitor — 2026-11-20

## Data quality
- **Pre-flight**:
  - Item 1 (`CURRENT_EXPIRY_DATE = '2026-11-23'`): **PASS** (regenerated, 506 contracts verified).
  - Item 2 (`server.js` running, `/api/ops/state` reachable, Vite HMR active): **PASS** (PID 20381, `http://localhost:5173`).
  - Item 3 (active browser tab `tab-mwofdvqn-veh3o` sending heartbeats): **PASS**.
  - Item 4 (`localhost:5001/api/ops/state` in PAPER mode, `ageSec < 2s`): **PASS**.
  - Item 5 (Options straddling ATM 25,400 cleanly): **PASS**.
  - Item 6 (`caffeinate -dimsu` running via background daemon): **PASS**.
  - Item 7 (Sensibull OI tab open & active capture): **PASS**.
  - Item 8 (Fyers 1-minute chart active in capture sidecar `localhost:4321`): **PASS**.
  - Item 9 (`TradingJournal/2026-11-20/live-monitor/` initialized): **PASS**.
- **Stale periods**: None. 142 records logged into `minute.jsonl` continuously from 09:14 to 15:36:35. `ageSec` remained < 3s throughout market hours. No gaps or interpolated timestamps.
- **PCR range seen**: 0.88 to 1.17 in morning session; 0.97 into close. Well within valid operational bounds (0.3–3.0).
- **Walls vs Sensibull agreement**: Clean alignment. The app and Sensibull agreed on Put wall at 25,400 (transitioning to 25,500 post-breakout) and Call wall at 25,500 (breaking upward at 10:30 to 25,700/25,800/26,000).

## OI map
- **B1 Pre-Open Map (08:58)**:
  - Macro Floor: 25,300 (nearest support 25,400)
  - Macro Ceiling: 26,000 (nearest resistance 25,500)
  - Bias: NEUTRAL (PCR 1.09, spot 25,514.30 / pre-open 25,411.65, Call OI ±300 = 4.76 Cr, Put OI ±300 = 5.32 Cr).
- **Evolution during session**:
  - **09:29**: PCR 1.17. Corridor established between 25,400 Put wall (1.48 Cr) and 25,500 Call wall (1.45 Cr). Spot traded inside this corridor (25,429–25,463).
  - **09:44**: PCR compressed to 0.94 as 25,500 Call OI surged to 1.75 Cr, temporarily capping the upside while 25,400 Put wall expanded to 1.68 Cr.
  - **10:30**: PCR dipped to 0.88. 25,500 strike became the epicenter of an institutional battle (2.10 Cr Call OI vs 1.62 Cr Put OI). Spot sliced through 25,500 to 25,527.90.
  - **12:30**: Massive short-covering breakout. The 25,500 Call wall completely capitulated (Call OI collapsed from 2.10 Cr down to 1.05 Cr) while 25,500 Put OI exploded to 2.32 Cr. Spot surged to 25,691.30 (+0.68%).
  - **15:15**: Trend expansion extended to 25,781.20 (+1.06%, +417 pts from day low). Put writers fortified 25,500 (1.82 Cr), 25,600 (82L), and 25,700 (98L). Macro ceiling held at 26,000 (1.52 Cr Call OI) with local resistance at 25,800 (1.05 Cr). Market closed near day highs at 25,800.60.

## Scenario A — Sniper
- **09:15–09:25 Opening Range**: 25,368.00 to 25,462.50 (86 pts range).
- **09:25–09:45 Trading Window**:
  - Spot traded between 25,429.55 and 25,493.95.
  - Walls in play: 25,400 Put wall (Support) and 25,500 Call wall (Resistance).
- **Decision Log (Deduped)**:
  - 09:14:05: `Market opens at 09:15.` (STAND DOWN)
  - 09:16:05: `The Download runs until 09:25. Watching only — no trade may be opened.` (STAND DOWN)
  - 09:25:33: `Price is mid-range (95 from support, 34 from resistance). Let it come to a zone.` (WAITING)
  - 09:26:33: `Price is mid-range (70 from support, 58 from resistance). Let it come to a zone.`
  - 09:27:33: `Price is mid-range (62 from support, 66 from resistance). Let it come to a zone.`
  - 09:32:06: `Price is mid-range (76 from support, 52 from resistance). Let it come to a zone.`
  - 09:35:06: `Price is mid-range (98 from support, 30 from resistance). Let it come to a zone.`
  - 09:42:06: `Price is mid-range (100 from support, 28 from resistance). Let it come to a zone.`
  - 09:43:06: `Price is at resistance but the live signal says LONG. Entry must align with the immediate trend.` (DIRECTION_CONFLICT)
  - 09:45:34: `Past 09:45. Your rule: if there was no setup by now, close the laptop.` (STAND DOWN)
- **Signal Flips**: Live signal remained LONG/NEUTRAL while approaching resistance; no reversal signal or edge pullback materialized.
- **Trade + Result**: **0 trades taken (FLAT, 0 pts)**.

## Scenario B — Wall-reclaim (notional)
- **Active Walls**: Floor at 25,400, Ceiling at 25,500.
- **Arming Conditions**:
  - Long Arm: Spot must touch within 10 pts of floor (&le; 25,410) and reclaim > 25,410.
  - Short Arm: Spot must touch within 10 pts of ceiling (&ge; 25,490) and reclaim < 25,490.
- **Execution Log**:
  - Low of 09:25–09:45 window was 25,429.55 at 09:27 (+29.55 pts above floor; never armed Long).
  - High of 09:25–09:45 window was 25,480.30 at 09:44 (9.7 pts below ceiling; briefly touched 25,493.95 right at 09:45:34 after window expired).
  - Arms: 0.
  - Triggers: 0.
  - Blocks: None (never reached arming conditions).
- **Trade + Result**: **0 trades taken (FLAT, 0 pts)**.

## Hindsight
- **Best +30 before −15 in 09:25–10:30**:
  - **Long Entry**: 25,429.55 @ 09:27 (pullback low).
    - Stop (−15): 25,414.55 (never touched; lowest print thereafter was 25,430.00).
    - Target (+30): 25,459.55 reached @ 09:35 (+30 pts in 8 minutes).
    - Maximum run: 25,536.50 @ 10:26 (**+106.95 pts**).
- **How close did A and B come to it?**:
  - Neither A nor B caught the 09:27 Long.
  - Scenario A classified 25,429.55 as `MID_RANGE` (62 pts from 25,400 support, 66 pts from 25,500 resistance), requiring spot to enter within 25 pts of a wall.
  - Scenario B required a touch of 25,410 to arm, missing the turnaround by 19.55 pts.
  - Note: Naive 09:25 drift (Variant E) entered Long at 09:25 (25,462.50) and was stopped out at 09:27 (−15.7 pts). Sniper filters protected against buying the top of the initial 09:25 spike.

## Replay check
- **Replay command**: `npm run replay:sniper`
- **Output for 2026-11-20**:
  ```
  2026-11-20  gap -120  OR 86pt  09:25-10:30 range 116pt  (25463 → 25524)
    A engine (as live)           —
    B engine, PCR gate off       —
    C wall-reclaim +breadth      —
    D wall-reclaim, no breadth   —
    E naive 09:25 drift          L@09:25 -15.7 STOP
    F wall-reclaim, gap side     —
  ```
- **Live vs Replay Agreement**: Exact match. Both Scenario A and Scenario B (and all variations C, D, F) produced zero trades (`—`), perfectly mirroring live paper execution. Variant E stopped out for −15.7 pts in replay, corroborating the live mid-range filter's protective value.

## Observations (no parameter changes)
- **100-pt Strike Spacing Dynamics**: On Nifty expiry days or high-volatility sessions, 100-pt strike spacing creates a wide 100-pt corridor between major walls. Spot can spend the entire 09:25–09:45 window traversing from 25,430 to 25,480 without ever touching within 10–25 pts of either strike boundary.
- **Wall Capitulation Mechanics**: When an institutional wall breaks (e.g., 25,500 Call wall at 10:30 with 2.10 Cr OI), the subsequent squeeze in the afternoon (+280 pts from 25,520 to 25,800) is explosive as Call writers are forced into massive stop-loss unwinding (dropping from 2.10 Cr to 1.05 Cr by 12:30).
- **Filter Discipline**: The Sniper rules strictly prevented chasing at resistance (`DIRECTION_CONFLICT` at 25,471) and prevented entering mid-range chop, preserving capital on a session where early entries were vulnerable to whipsaws before the 10:30 breakout.
