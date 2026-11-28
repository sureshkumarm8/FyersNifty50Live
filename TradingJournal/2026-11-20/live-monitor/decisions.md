# Live Monitor Decisions — 2026-11-20

Pre-flight: Item 1 PASS (2026-11-23 regenerated, 506 contracts); Item 2 PASS (Dev server running PID 20381; Vite HMR active); Item 3 PASS (localhost:5173 fresh, active tab-mwofdvqn-veh3o); Item 4 PASS (ageSec 1.5s, PAPER mode); Item 5 PASS (Option contracts straddling ATM 25400 cleanly); Item 6 PASS (caffeinate active PID in task-1044); Item 7 PASS (Sensibull OI open & capturing); Item 8 PASS (Fyers Web chart sidecar ready); Item 9 PASS (TradingJournal/2026-11-20/live-monitor initialized).
08:58:00 B-MAP: floor 25300 (nearest major support 25400/25500), ceiling 26000 (nearest major resistance 25600/25700), bias NEUTRAL (spot 25514.30 / pre-open 25411.65, PCR 1.09, Call OI ±300 = 4.76Cr, Put OI ±300 = 5.32Cr, ratio 1.12x).
09:14:05 A-DECISION: "Market opens at 09:15." Spot: 25368
09:14:05 A-STATE: Switched from null to STAND DOWN. Spot: 25368
09:16:05 A-DECISION: "The Download runs until 09:25. Watching only — no trade may be opened." Spot: 25394.6
09:20:05 OI-SNAPSHOT: Triggering scheduled Sensibull read for 09:20
09:25:33 A-RANGE: 09:15-09:25 range check. Spot: 25462.5, Sniper state: WAITING, lastDecision: "Price is mid-range (95 from support, 34 from resistance). Let it come to a zone.".
09:25:33 A-DECISION: "Price is mid-range (95 from support, 34 from resistance). Let it come to a zone." Spot: 25462.5
09:25:33 A-STATE: Switched from STAND DOWN to WAITING. Spot: 25462.5
09:26:33 A-DECISION: "Price is mid-range (70 from support, 58 from resistance). Let it come to a zone." Spot: 25438.35
09:27:33 A-DECISION: "Price is mid-range (62 from support, 66 from resistance). Let it come to a zone." Spot: 25429.55
09:28:33 A-DECISION: "Price is mid-range (65 from support, 64 from resistance). Let it come to a zone." Spot: 25432.5
09:29:33 OI-SNAPSHOT: Triggering scheduled Sensibull read for 09:29
09:29:00 OI-UPDATE: Sensibull 09:29 read: PCR 1.17. Tight corridor defined: 25400 Put wall (1.48Cr) and 25500 Call wall (1.45Cr). Spot is mid-range between 25400 and 25500.
09:30:06 A-DECISION: "Price is mid-range (62 from support, 66 from resistance). Let it come to a zone." Spot: 25430
09:32:06 A-DECISION: "Price is mid-range (76 from support, 52 from resistance). Let it come to a zone." Spot: 25444.25
09:33:06 A-DECISION: "Price is mid-range (88 from support, 40 from resistance). Let it come to a zone." Spot: 25455.65
09:34:06 A-DECISION: "Price is mid-range (90 from support, 38 from resistance). Let it come to a zone." Spot: 25458.4
09:35:06 A-DECISION: "Price is mid-range (98 from support, 30 from resistance). Let it come to a zone." Spot: 25465.85
09:36:06 A-DECISION: "Price is mid-range (95 from support, 33 from resistance). Let it come to a zone." Spot: 25463.15
09:37:06 A-DECISION: "Price is mid-range (94 from support, 34 from resistance). Let it come to a zone." Spot: 25462.15
09:38:06 A-DECISION: "Price is mid-range (90 from support, 38 from resistance). Let it come to a zone." Spot: 25458.4
09:39:06 A-DECISION: "Price is mid-range (84 from support, 44 from resistance). Let it come to a zone." Spot: 25452.3
09:40:06 A-DECISION: "Price is mid-range (80 from support, 48 from resistance). Let it come to a zone." Spot: 25448.25
09:42:06 A-DECISION: "Price is mid-range (100 from support, 28 from resistance). Let it come to a zone." Spot: 25468.3
09:43:06 A-DECISION: "Price is at resistance but the live signal says LONG. Entry must align with the immediate trend." Spot: 25471.6
09:44:06 OI-SNAPSHOT: Triggering scheduled Sensibull read for 09:44
09:44:00 OI-UPDATE: Sensibull 09:44 read: PCR 0.94. 25500 Call wall exploded to 1.75Cr, capping upside. 25400 Put wall expanded to 1.68Cr, providing solid floor. Spot: 25480.30.
09:45:00 A-PHASE: 09:45 reached. Scenario A (Sniper) ENTRY_WINDOW closed -> MANAGE_ONLY / STAND DOWN. Stood aside due to mid-range chop and DIRECTION_CONFLICT. 0 trades taken (flat).
09:45:00 B-PHASE: 09:45 reached. Scenario B trigger window closed. Spot remained inside 25400-25500 corridor without touching arming triggers. 0 trades taken (flat).
10:30:35 OI-SNAPSHOT: Triggering scheduled Sensibull read for 10:30
10:30:00 OI-UPDATE: Sensibull 10:30 read: PCR 0.88. 25500 strike is epicenter of massive institutional clash: 2.10Cr Call OI vs 1.62Cr Put OI. Spot broke through 25500 to 25527.90. 25400 Put wall at 1.75Cr, 25600 Call OI at 1.20Cr, 26000 Call wall at 1.75Cr.
10:30:00 HARD_STOP: Morning protocol window complete. Scenario A (Sniper) and Scenario B (Wall-Reclaim) both finished morning window with 0 trades (FLAT). Afternoon 5-minute data collection active.
09:45:34 A-DECISION: "Past 09:45. Your rule: if there was no setup by now, close the laptop." Spot: 25493.95
09:45:34 A-STATE: Switched from WAITING to STAND DOWN. Spot: 25493.95
09:45:34 B-PHASE: 09:45 reached. Scenario B trigger window closed. Total triggers: 0. Scenario B finishes with 0 trades (flat).
10:30:35 OI-SNAPSHOT: Triggering scheduled Sensibull read for 10:30
10:30:35 A-DECISION: "Outside the protocol window." Spot: 25528.2
12:30:00 OI-SNAPSHOT: Triggered scheduled Sensibull read for 12:30
12:30:00 OI-UPDATE: Sensibull 12:30 read: Massive bullish expansion. 25500 Call wall completely shattered (Call OI collapsed from 2.10Cr down to 1.05Cr) while 25500 Put OI exploded to an astronomical 2.32Cr. Put writers colonized 25600 (1.00Cr Put OI). Spot surged to 25691.30 (+0.68%) testing 25700 Call resistance (1.05Cr). Next major macro ceiling at 26000 (1.65Cr). PCR: 1.11.
15:15:00 OI-SNAPSHOT: Triggered scheduled Sensibull read for 15:15
15:15:00 OI-UPDATE: Sensibull 15:15 read: Full-day trending expansion (+1.06%). Spot surged to 25781.20 (+417 pts from low). Put writers fortified 25500 (1.82Cr Put OI), 25600 (82L), and 25700 (98L). Severe Call unwinding across 25400-25700. Immediate resistance at 25800 (1.05Cr), main ceiling at 26000 (1.52Cr). PCR: 0.97.
15:36:35 EOD-CLOSE: Market session closed at 15:35. Live collection completed.
