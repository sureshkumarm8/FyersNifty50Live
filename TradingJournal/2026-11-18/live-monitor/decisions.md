# Live Monitor Decisions — 2026-11-18

Pre-flight: Item 1 PASS (2026-11-23); Item 2 NOTE (Dev server running PID 20381; Vite HMR active); Item 3 PASS (localhost:5173 fresh, hard-reloaded at 09:07); Item 4 PASS (ageSec < 5, PAPER mode); Item 5 PASS (82 contracts straddling ATM 25350, spot 25323.15); Item 6 PASS (caffeinate active); Item 7 PASS (Sensibull OI open); Item 8 PASS (Fyers Web 1-min chart active); Item 9 PASS (TradingJournal/2026-11-18/live-monitor initialized).

08:58:00 B-MAP: floor 25350, ceiling 25400, bias DOWN (spot 25387.4, PCR 0.75, Call OI ±300 = 8.92Cr, Put OI ±300 = 6.73Cr, ratio 1.325x).
09:15:00 B-OPEN: Open print 25323.15. GAP CHECK: Open is below B1 floor (25350) by 26.85 pts. B1 floor 25350 has become CANDIDATE CEILING. Sniper phase: DOWNLOAD (watching range).
09:17:00 A-DECISION: "The plan stood aside (\"Only 12 points between the walls. Entry can be up to 25 points inside the zone, so 25 points cannot be captured. This is a no-trade day.\") and the tape has given no reason to overrule it." Spot: 25366.5.
09:18:00 A-DECISION: "Reconciled zone is only 39 pts. The 25-pt target cannot be reached before the far wall — 50 is the minimum." Spot: 25388.7.
09:25:00 A-RANGE: Range 09:15-09:25 locked: Low 25323.15, High 25388.70, Width 65.55 pts. Sniper state: STAND DOWN (premarket stand-aside stands).
09:25:00 B-ARM: B LONG arm 09:25 @25,352, active floor 25,350 (OI floor), testLow 25,352.0. Tracking for 2 consecutive closes >= 10 pts above testLow.
09:27:00 B-UPDATE: Spot 25331.95 breaks through 25350. Closer to opening range low (25323.15, dist 8.8 pts) than 25350. Active floor shifts to 25323.15, testLow updated to 25331.95.
09:28:00 B-UPDATE: Spot 25301.25 breaks opening-range low 25323.15, trades within 1.25 pts of next major OI put wall (25300). Active floor shifts to 25300, testLow updated to 25301.25.
09:29:00 OI-REFRESH: Sensibull loaded Wed 18 Nov live OI. Total Call OI: 5.76Cr, Total Put OI: 6.25Cr, PCR: 1.09 (jumped from 0.75). Largest Put wall: 25000 (1.05Cr), nearest Put support: 25300 (79L Put OI). Largest Call wall: 25500 (99L). Spot: 25300.75.
09:31:00 B-BLOCKED: Scenario B LONG reclaim pattern completed (09:30 close 25299.90, 09:31 close 25309.65 > testLow 25282.90 + 10). TRIGGER BLOCKED: Stop level 25274.90 (testLow - 8) is 34.75 pts away from entry (25309.65), exceeding the 25-pt maximum stop rule. Trade skipped.
09:40:00 B-UPDATE: Spot breaks lower to 25270.90, setting new session testLow = 25270.90. Floor shifts towards 25250/25200. Momentum paper 25300PE gains to 97.55 (stop trailed to 89.75).
09:44:00 OI-UPDATE: Sensibull 09:44 read confirms heavy call writing wave: 25300 Call OI climbed to 76L (+26L), 25400 to 94L, 25500 to 1.10Cr. Put floor solidifying at 25200 (58L) and 25000 (1.08Cr). Spot: 25237.05. PCR: 1.06.
09:45:00 A-PHASE: 09:45 reached. Scenario A (Sniper) ENTRY_WINDOW closed -> MANAGE_ONLY. Sniper entered 0 trades (flat).
09:45:00 B-PHASE: 09:45 reached. Scenario B (Wall-Reclaim) trigger window closed. Attempt 1 at 09:31 was blocked by STOP_TOO_FAR; no further triggers. Scenario B finishes with 0 trades (flat). Spot: 25232.90.
10:30:03 OI-SNAPSHOT: Triggering scheduled Sensibull read for 10:30
10:30:00 OI-UPDATE: Sensibull 10:30 read: 25300 Call OI crosses 1 Cr to 1.02Cr (+52L since 09:29), establishing dominant session ceiling at 25300. 25000 Put wall expands to 1.20Cr, 25200 Put wall strengthens to 68L. PCR compresses to 0.94. Spot: 25265.70.
10:35:00 B4-HINDSIGHT:
- Best trade in hindsight (earliest +30 before -15 in 09:25-10:30):
  1. SHORT at 09:25:00 @ 25,352.00. Dropped to 25,301.25 at 09:28:00 (+50.75 pts in 3m, zero drawdown). Target +30 hit at 09:27.
  2. LONG at 09:29:00 @ 25,282.90. Rallied to 25,325.90 at 09:32:00 (+43.0 pts in 3m). Target +30 hit at 09:32.
- Alignment with methods:
  - Scenario A (Sniper): Stood down entire session due to pre-market narrow wall rule. 0 trades.
  - Scenario B (Wall-Reclaim): Armed LONG at 09:25 @ 25,350, missed the short breakdown. Reclaim LONG off 25,282.90 was recognized at 09:31 but blocked by STOP_TOO_FAR (34.75 pts > 25 pt max allowed stop).
10:56:31 A-DECISION: "Outside the protocol window." Spot: 25248
12:30:00 OI-UPDATE: Sensibull 12:30 read: Spot tests 25200 support (25215.50). 25200 Put writers defending at 75L (up from 68L). 25300 Call ceiling expands to 1.08Cr. 25000 Put fortress expands to 1.25Cr. PCR steady at 0.92.
15:15:00 OI-UPDATE: Sensibull 15:15 final intraday read: 25200 Put floor (77L Put OI) held through the afternoon; 25300 Call ceiling (84L Call OI) capped all upside. Market contained in 25200-25300 corridor into the close. Spot: 25215.85. PCR: 0.87.
15:35:00 EOD-CLOSE: Market session closed. Nifty spot closing price ~25,227.95. Both Scenario A and Scenario B completed the session with 0 trades taken (FLAT). Total live records logged: 141+ in minute.jsonl, 7 Sensibull reads in oi.jsonl. Live monitoring completed.
