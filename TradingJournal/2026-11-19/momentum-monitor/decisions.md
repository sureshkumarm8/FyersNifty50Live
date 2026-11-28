# Live Market Monitor — Momentum vs Manual 5-min/OI Read (2026-11-19)

Pre-flight: Item 1 PASS (ageSec: 5.4, stale: false); Item 2 PASS (mode: PAPER); Item 3 PASS (state: STOPPED, lastGate: "Engine stopped; entry confirmation reset."); Item 4 PASS (tab connected, panel active); Item 5 PASS (oiLadder and wall logging active); Item 6 PASS (option chain online); Item 7 PASS (caffeinate assertion held); Item 8 PASS (Sensibull live OI loaded); Item 9 PASS (Fyers 5-min candles live); Item 10 PASS (/Users/SureshKumar.M/Documents/Suresh/AITools/FyersNifty50Live/TradingJournal/2026-11-19/momentum-monitor initialized and writable).

09:26:14 OI-READ: Sensibull 09:26 baseline: Spot 25154.4, PCR 0.90, Floor 25100 (Put OI 56.0L), Ceiling 25200 (Call OI 1.05Cr), Fortress Put Wall 25000 (1.10Cr), Largest Call Wall 25500 (1.30Cr).
09:30:36 M-ENTRY: SHORT NSE:NIFTY2310125100PE @ 79.9 (spot: 25107.85 room 7.85 (wall 25100)) · 5m: DOWN · H would: SKIP (room < 30)
09:31:36 M-EXIT: NSE:NIFTY2310125100PE @ 66.275 · PnL: ₹-885.62 · Held: 52s · MFE: +0.0 / MAE: -27.3
09:46:27 OI-READ: Sensibull 09:46 read: Spot 25236.25, PCR 0.85, Floor shifted to 25200 (Put OI 1.15Cr), Ceiling 25300 (Call OI 95.0L), Fortress Put Wall 25000 (1.20Cr), Major Call Wall 25500 (1.35Cr). 5m trend: UP.
10:05:04 OI-READ: Sensibull 10:05 read: Spot 25275.95, PCR 1.04 (Put OI surged to 8.02Cr vs Call OI 7.71Cr). Floor 25200 (Put OI 1.30Cr), Ceiling 25300 (Call OI 88.0L). Room to ceiling: 24.0 pts (< 30). H would: SKIP (room < 30).
10:35:02 OI-READ: Sensibull 10:35 read: Spot 25272.1, PCR 1.08 (Put OI 8.46Cr vs Call OI 7.82Cr). Floor 25200 (Put OI 1.35Cr), Ceiling 25300 (Call OI 92.0L). Room to ceiling: 27.9 pts (< 30). H would: SKIP (room < 30).
11:30:21 OI-READ: Sensibull 11:30 read: Spot 25317.0, PCR 1.12 (Total Put OI 8.94Cr vs Call OI 7.98Cr). 25300 Call Wall broken and converted to Floor (Put OI surged to 1.10Cr vs Call OI 92.0L). Next Ceiling 25400 (Call OI 82.0L). Room to ceiling: 83.0 pts.
13:00:11 OI-READ: Sensibull 13:00 read: Spot 25372.9, PCR 1.32 (Total Put OI 9.61Cr vs Call OI 7.28Cr). Call unwinding visible across 25200-25300. Floor 25300 (Put OI 1.25Cr), Ceiling 25400 (Call OI 85.0L). Room to ceiling: 27.1 pts (< 30). H would: SKIP (room < 30).
14:11:38 M-ENTRY: LONG NSE:NIFTY2310125450CE @ 79.8 (spot: 25437.35 room 61.75 (wall 25500)) · 5m: UP · H would: OPPOSE
14:36:39 M-EXIT: NSE:NIFTY2310125450CE @ 103.05 · PnL: ₹1511.25 · Held: 1530s · MFE: +47.4 / MAE: -4.3
14:45:39 H-WINDOW-CLOSE: 14:45 reached. Scenario H entry window closed. Trades taken: 0. Spot: 25461
15:00:39 H-STATUS: Scenario H day complete. Total trades: 0. Net points: 0.0 pts.
15:00:39 M-STATUS: Momentum engine state: RUNNING, lastGate: "Entry window: 09:30-15:00 IST; wait outside the opening noise.". Positions: 0
