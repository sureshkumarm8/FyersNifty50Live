# Live Market Monitor — Momentum vs Manual 5-min/OI Read (2026-11-18)

Pre-flight: Item 1 PASS (ageSec < 2, stale:false, quoteAgeSec 30); Item 2 PASS (autotrade.mode: PAPER); Item 3 PASS (momentum.state: RUNNING, lastGate: "Stand down today: 2 consecutive net losses."); Item 4 PASS (hard-refresh active, panel RUNNING); Item 5 PASS (oiLadder and wall calculations actively written to today_snapshots); Item 6 PASS (option chain straddle healthy); Item 7 PASS (caffeinate -dimsu active, pid 65799); Item 8 PASS (Sensibull live OI loaded, Wed 18 Nov); Item 9 PASS (Fyers 5-min/1-min candles live); Item 10 PASS (TradingJournal/2026-11-18/momentum-monitor initialized and writable).

09:38:14 M-ENTRY: SHORT 25300PE @ 86.05 (spot 25296.8, room 96 pts to 25200 put wall 58L). 5m: DOWN. H verdict: AGREE.
09:42:31 M-EXIT: SELL 25300PE @ 114.225. PnL: +₹1,831.38. Held 4m 17s. Target hit.
10:24:29 M-ENTRY: SHORT 25250PE @ 80.00 (spot 25252.0, room 52 pts to 25200 put wall 68L). 5m: lower high 25316->25287. H verdict: SKIP (stop too far / near wall).
10:28:42 M-EXIT: SELL 25250PE @ 67.10. PnL: -₹838.50. Held 4m 13s. Stop hit.
10:45:20 M-ENTRY: SHORT 25200PE @ 79.30 (spot 25224.0, room 24 pts to 25200 put wall 72L). 5m: RANGE. H verdict: SKIP (room 24 < 30).
10:55:40 M-EXIT: SELL 25200PE @ 67.125. PnL: -₹791.38. Held 10m 20s. Stop hit.
10:56:40 M-GATE: Stand down today: 2 consecutive net losses. Lockout active for remainder of day.
14:42:04 OI-READ: Sensibull read: Spot 25240.1, PCR 0.80, Floor 25200 (Put OI 79.2L), Ceiling 25300 (Call OI 93.0L), Fortress Put Wall 25000 (1.15Cr), Major Call Wall 25500 (1.38Cr).
14:45:00 H-WINDOW-CLOSE: Scenario H entry window (09:30-14:45) closed. 0 trades entered (flat).
14:50:30 H-WINDOW-CLOSE: 14:45 reached. Entry window closed. Scenario H entered 0 trades (flat). Spot: 25234.95
15:00:30 H-EXIT: 15:00 protocol close. Position: FLAT. Net points: 0. Spot: 25218.25
15:00:30 M-STATUS: Momentum engine flat. State: RUNNING, lastGate: "Entry window: 09:30-15:00 IST; wait outside the opening noise.". Spot: 25218.25
15:15:30 OI-SNAPSHOT: Triggering scheduled 15:15 Sensibull snapshot...
15:15:30 OI-READ: Sensibull 15:15 capture SUCCESS. Spot: 25220.45
