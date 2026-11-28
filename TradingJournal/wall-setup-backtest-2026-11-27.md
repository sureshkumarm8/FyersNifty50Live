# Wall-setup backtest — run 2026-11-27 (after close)

Command: `npx tsx scripts/wallSetupReplay.ts` (add `--events` for every stage change). Rules: services/wallSetup.ts defaults — at wall ≤25 pts, confirm = close through the extreme bar + ≥10 pts off the extreme, stop wall ∓5, target +30 or next wall ∓5, stop checked before target, signals 09:30–14:45, every signal taken (no 1/day limit).

```

=== 2026-11-19 · journal (~1 min spot + 41 logged wall reads) · 360 bars (237 without walls) ===
  14:01 SHORT FAILED   wall 25400 · Closed 11 pts above 25400: wall failed
  15:29 SHORT FAILED   wall 25500 · Closed 14 pts above 25500: wall failed
  13:06 SHORT CONFIRMED wall 25400 entry 25349.7 stop 25405 tgt 25319.7 room 49.7 defended true  -> STOP -55.3 pts at 14:01 (MFE 1.8 / MAE -61.5)
  14:41 SHORT CONFIRMED wall 25500 entry 25465.8 stop 25505 tgt 25435.8 room 65.8 defended false  -> STOP -39.2 pts at 15:29 (MFE 17.6 / MAE -48.5)

=== 2026-11-20 · journal (~1 min spot + 159 logged wall reads) · 358 bars (79 without walls) ===
  09:17 SHORT FAILED   wall 25400 · Closed 36 pts above 25400: wall failed
  09:45 SHORT FAILED   wall 25500 · Closed 11 pts above 25500: wall failed
  09:49 LONG FAILED   wall 25500 · Closed 7 pts below 25500: wall failed
  10:17 LONG FAILED   wall 25500 · Closed 6 pts below 25500: wall failed
  10:22 LONG FAILED   wall 25500 · Closed 19 pts below 25500: wall failed
  10:49 SHORT FAILED   wall 25550 · Closed 8 pts above 25550: wall failed
  11:23 SHORT FAILED   wall 25550 · Closed 6 pts above 25550: wall failed
  11:37 SHORT FAILED   wall 25550 · Closed 7 pts above 25550: wall failed
  11:41 SHORT FAILED   wall 25550 · Closed 12 pts above 25550: wall failed
  11:57 SHORT FAILED   wall 25600 · Closed 7 pts above 25600: wall failed
  14:08 SHORT FAILED   wall 25750 · Closed 10 pts above 25750: wall failed
  14:27 SHORT FAILED   wall 25750 · Closed 11 pts above 25750: wall failed
  09:51 LONG  CONFIRMED wall 25500 entry 25515.9 stop 25495 tgt 25545.9 room 84.1 defended true  -> STOP -20.9 pts at 10:17 (MFE 24 / MAE -22.1)
  09:55 LONG  CONFIRMED wall 25500 entry 25537.2 stop 25495 tgt 25567.2 room 62.8 defended true  -> STOP -42.2 pts at 10:17 (MFE 2.8 / MAE -43.4)
  10:08 LONG  CONFIRMED wall 25500 entry 25521.1 stop 25495 tgt 25545(cap) room 29 SHORT-ROOM defended true  -> STOP -26.1 pts at 10:17 (MFE 0.2 / MAE -27.2)
  10:22 SHORT CONFIRMED wall 25500 entry 25481.3 stop 25505 tgt 25451.3 room 18.8 SHORT-ROOM defended false  -> STOP -23.7 pts at 10:24 (MFE 0 / MAE -31)
  10:24 LONG  CONFIRMED wall 25500 entry 25512.3 stop 25495 tgt 25542.3 room 37.7 defended true  -> TARGET +30 pts at 10:44 (MFE 36.1 / MAE 0)
  10:26 LONG  CONFIRMED wall 25500 entry 25536.5 stop 25495 tgt 25545(cap) room 13.5 SHORT-ROOM defended true  -> TARGET +8.5 pts at 10:44 (MFE 11.9 / MAE -22.5)
  10:27 SHORT CONFIRMED wall 25550 entry 25524 stop 25555 tgt 25505(cap) room 24 SHORT-ROOM defended true  -> STOP -31 pts at 10:49 (MFE 10 / MAE -33.7)
  10:29 LONG  CONFIRMED wall 25500 entry 25535.5 stop 25495 tgt 25545(cap) room 14.5 SHORT-ROOM defended true  -> TARGET +9.5 pts at 10:44 (MFE 12.9 / MAE -21.5)
  10:32 SHORT CONFIRMED wall 25550 entry 25520.9 stop 25555 tgt 25505(cap) room 20.9 SHORT-ROOM defended true  -> STOP -34.1 pts at 10:49 (MFE 6.9 / MAE -36.7)
  10:36 LONG  CONFIRMED wall 25500 entry 25527.6 stop 25495 tgt 25545(cap) room 22.4 SHORT-ROOM defended true  -> TARGET +17.4 pts at 10:44 (MFE 20.8 / MAE 0)
  11:03 SHORT CONFIRMED wall 25550 entry 25537.5 stop 25555 tgt 25507.5 room 37.5 defended true  -> STOP -17.5 pts at 11:23 (MFE 17.7 / MAE -18.2)
  11:09 SHORT CONFIRMED wall 25550 entry 25521.2 stop 25555 tgt 25505(cap) room 21.2 SHORT-ROOM defended true  -> STOP -33.8 pts at 11:23 (MFE 1.4 / MAE -34.5)
  11:12 SHORT CONFIRMED wall 25550 entry 25519.9 stop 25555 tgt 25505(cap) room 19.8 SHORT-ROOM defended true  -> STOP -35.1 pts at 11:23 (MFE 0 / MAE -35.8)
  11:16 LONG  CONFIRMED wall 25500 entry 25542 stop 25495 tgt 25572 room 8 SHORT-ROOM defended true  -> TARGET +30 pts at 11:53 (MFE 33.7 / MAE -12.5)
  11:26 SHORT CONFIRMED wall 25550 entry 25537.3 stop 25555 tgt 25507.3 room 37.3 defended true  -> STOP -17.7 pts at 11:37 (MFE 7.8 / MAE -19.5)
  13:27 LONG  CONFIRMED wall 25700 entry 25711.6 stop 25695 tgt 25741.6 room 88.4 defended true  -> TARGET +30 pts at 13:49 (MFE 30.6 / MAE -16.3)
  13:32 LONG  CONFIRMED wall 25700 entry 25709.1 stop 25695 tgt 25739.1 room 91 defended true  -> TARGET +30 pts at 13:41 (MFE 30.6 / MAE -13.8)
  13:36 LONG  CONFIRMED wall 25700 entry 25705.7 stop 25695 tgt 25735.7 room 94.3 defended false  -> TARGET +30 pts at 13:41 (MFE 34 / MAE -2)
  13:39 LONG  CONFIRMED wall 25700 entry 25716.9 stop 25695 tgt 25746.9 room 83.1 defended false  -> TARGET +30 pts at 14:08 (MFE 42.9 / MAE 0)
  14:03 SHORT CONFIRMED wall 25750 entry 25730.3 stop 25755 tgt 25705(cap) room 30.3 defended true  -> STOP -24.7 pts at 14:08 (MFE 3.1 / MAE -29.5)

=== 2026-11-21 · journal (~1 min spot + 4 logged wall reads) · 54 bars (27 without walls) ===
  no confirmed setups 09:30-14:45

=== 2026-11-25 · journal (~1 min spot + 146 logged wall reads) · 313 bars (34 without walls) ===
  10:08 LONG FAILED   wall 25750 · Closed 10 pts below 25750: wall failed
  10:30 SHORT FAILED   wall 25800 · Closed 6 pts above 25800: wall failed
  12:06 LONG FAILED   wall 25900 · Closed 8 pts below 25900: wall failed
  12:10 LONG FAILED   wall 25900 · Closed 7 pts below 25900: wall failed
  12:17 LONG FAILED   wall 25900 · Closed 16 pts below 25900: wall failed
  12:40 LONG FAILED   wall 25800 · Closed 15 pts below 25800: wall failed
  12:53 LONG FAILED   wall 25750 · Closed 7 pts below 25750: wall failed
  13:03 LONG FAILED   wall 25700 · Closed 10 pts below 25700: wall failed
  13:37 LONG FAILED   wall 25700 · Closed 12 pts below 25700: wall failed
  09:36 SHORT CONFIRMED wall 25800 entry 25776.8 stop 25805 tgt 25755(cap) room 26.8 SHORT-ROOM defended true  -> TARGET +21.8 pts at 09:39 (MFE 26 / MAE 0)
  09:42 LONG  CONFIRMED wall 25750 entry 25770.1 stop 25745 tgt 25795(cap) room 30 defended true  -> STOP -25.1 pts at 09:44 (MFE 0 / MAE -26.5)
  09:48 LONG  CONFIRMED wall 25700 entry 25730.9 stop 25695 tgt 25760.9 room 69.2 defended true  -> TARGET +30 pts at 09:51 (MFE 47.8 / MAE -7.9)
  09:52 SHORT CONFIRMED wall 25800 entry 25762.6 stop 25805 tgt 25755(cap) room 12.6 SHORT-ROOM defended true  -> TARGET +7.6 pts at 10:01 (MFE 7.7 / MAE -22.9)
  09:56 LONG  CONFIRMED wall 25750 entry 25782.8 stop 25745 tgt 25795(cap) room 17.2 SHORT-ROOM defended false  -> STOP -37.8 pts at 10:04 (MFE 2.7 / MAE -49.8)
  09:59 SHORT CONFIRMED wall 25800 entry 25770.3 stop 25805 tgt 25755(cap) room 20.3 SHORT-ROOM defended false  -> TARGET +15.3 pts at 10:01 (MFE 15.4 / MAE -5.4)
  10:02 LONG  CONFIRMED wall 25750 entry 25766.6 stop 25745 tgt 25795(cap) room 33.4 defended true  -> STOP -21.6 pts at 10:04 (MFE 0 / MAE -33.6)
  10:17 LONG  CONFIRMED wall 25750 entry 25782.3 stop 25745 tgt 25795(cap) room 17.8 SHORT-ROOM defended true  -> TARGET +12.7 pts at 10:19 (MFE 22.7 / MAE 0)
  10:23 SHORT CONFIRMED wall 25800 entry 25778.8 stop 25805 tgt 25755(cap) room 28.8 SHORT-ROOM defended false  -> STOP -26.2 pts at 10:27 (MFE 3.6 / MAE -26.2)
  10:37 LONG  CONFIRMED wall 25800 entry 25817 stop 25795 tgt 25847 room 183 defended true  -> TARGET +30 pts at 10:49 (MFE 31 / MAE 0)
  10:40 LONG  CONFIRMED wall 25800 entry 25845.1 stop 25795 tgt 25875.1 room 155 defended true  -> TARGET +30 pts at 10:57 (MFE 31.4 / MAE -23.7)
  10:44 LONG  CONFIRMED wall 25800 entry 25832.8 stop 25795 tgt 25862.8 room 167.2 defended true  -> TARGET +30 pts at 10:56 (MFE 32.4 / MAE 0)
  11:57 LONG  CONFIRMED wall 25900 entry 25927.1 stop 25895 tgt 25957.1 room 73 defended true  -> STOP -32.1 pts at 12:06 (MFE 0 / MAE -34.7)
  12:27 SHORT CONFIRMED wall 25900 entry 25879.4 stop 25905 tgt 25849.4 room 79.3 defended true  -> TARGET +30 pts at 12:32 (MFE 36 / MAE -19.1)
  12:29 SHORT CONFIRMED wall 25900 entry 25883 stop 25905 tgt 25853 room 83 defended true  -> TARGET +30 pts at 12:32 (MFE 39.6 / MAE 0)
  12:43 SHORT CONFIRMED wall 25800 entry 25771.4 stop 25805 tgt 25741.4 room 71.3 defended true  -> TARGET +30 pts at 12:56 (MFE 32.2 / MAE -7.4)
  12:48 SHORT CONFIRMED wall 25800 entry 25759.8 stop 25805 tgt 25729.8 room 9.8 SHORT-ROOM defended true  -> TARGET +30 pts at 12:58 (MFE 45.2 / MAE -10)
  12:50 LONG  CONFIRMED wall 25750 entry 25769.9 stop 25745 tgt 25795(cap) room 30.2 defended true  -> STOP -24.9 pts at 12:53 (MFE 0 / MAE -26.6)
  13:49 LONG  CONFIRMED wall 25700 entry 25726.2 stop 25695 tgt 25756.2 room 73.8 defended true  -> TARGET +30 pts at 14:02 (MFE 43.8 / MAE -27.8)
  13:59 LONG  CONFIRMED wall 25700 entry 25712.3 stop 25695 tgt 25742.3 room 87.7 defended true  -> TARGET +30 pts at 14:02 (MFE 57.7 / MAE 0)

=== 2026-11-26 · CSV market_history_log_2026-11-25_2026-11-26-10-05-52 (2).csv (30s + oiLadder) · 354 bars ===
  09:24 LONG FAILED   wall 25800 · Closed 23 pts below 25800: wall failed
  09:28 SHORT FAILED   wall 25800 · Closed 8 pts above 25800: wall failed
  09:37 SHORT FAILED   wall 25800 · Closed 20 pts above 25800: wall failed
  09:40 LONG FAILED   wall 25800 · Closed 8 pts below 25800: wall failed
  09:52 SHORT FAILED   wall 25800 · Closed 27 pts above 25800: wall failed
  10:30 SHORT FAILED   wall 25900 · Closed 16 pts above 25900: wall failed
  10:36 LONG FAILED   wall 25900 · Closed 11 pts below 25900: wall failed
  10:38 SHORT FAILED   wall 25900 · Closed 11 pts above 25900: wall failed
  11:26 LONG FAILED   wall 25900 · Closed 11 pts below 25900: wall failed
  11:28 SHORT FAILED   wall 25900 · Closed 6 pts above 25900: wall failed
  11:29 LONG FAILED   wall 25900 · Closed 7 pts below 25900: wall failed
  11:34 LONG FAILED   wall 25900 · Closed 23 pts below 25900: wall failed
  11:53 SHORT FAILED   wall 25900 · Closed 8 pts above 25900: wall failed
  12:45 SHORT FAILED   wall 25900 · Closed 5 pts above 25900: wall failed
  12:52 LONG FAILED   wall 25900 · Closed 7 pts below 25900: wall failed
  13:02 LONG FAILED   wall 25900 · Closed 6 pts below 25900: wall failed
  13:57 LONG FAILED   wall 25800 · Closed 9 pts below 25800: wall failed
  14:07 SHORT FAILED   wall 25800 · Closed 15 pts above 25800: wall failed
  14:15 LONG FAILED   wall 25800 · Closed 15 pts below 25800: wall failed
  14:18 SHORT FAILED   wall 25800 · Closed 6 pts above 25800: wall failed
  15:03 SHORT FAILED   wall 25900 · Closed 8 pts above 25900: wall failed
  15:06 LONG FAILED   wall 25900 · Closed 7 pts below 25900: wall failed
  09:30 LONG  CONFIRMED wall 25800 entry 25832.8 stop 25795 tgt 25862.8 room 67.2 defended true  -> STOP -37.8 pts at 09:36 (MFE 25.3 / MAE -48.5)
  09:37 LONG  CONFIRMED wall 25800 entry 25819.6 stop 25795 tgt 25849.6 room 80.4 defended true  -> STOP -24.6 pts at 09:40 (MFE 1.6 / MAE -29.7)
  09:41 SHORT CONFIRMED wall 25800 entry 25767 stop 25805 tgt 25737 room 67 defended true  -> TARGET +30 pts at 09:46 (MFE 32.7 / MAE 0)
  09:49 LONG  CONFIRMED wall 25750 entry 25774 stop 25745 tgt 25795(cap) room 26 SHORT-ROOM defended true  -> TARGET +21 pts at 09:51 (MFE 29.8 / MAE 0)
  09:52 LONG  CONFIRMED wall 25800 entry 25826.8 stop 25795 tgt 25856.8 room 73.2 defended false  -> TARGET +30 pts at 10:03 (MFE 32.4 / MAE -0.6)
  10:22 SHORT CONFIRMED wall 25900 entry 25863.3 stop 25905 tgt 25833.3 room 63.3 defended true  -> STOP -41.7 pts at 10:30 (MFE 3.8 / MAE -53)
  10:33 LONG  CONFIRMED wall 25900 entry 25918.7 stop 25895 tgt 25948.7 room 81.3 defended true  -> STOP -23.7 pts at 10:36 (MFE 0 / MAE -32.5)
  10:38 LONG  CONFIRMED wall 25900 entry 25911.1 stop 25895 tgt 25941.1 room 89 defended true  -> TARGET +30 pts at 10:46 (MFE 32.9 / MAE -4.9)
  10:41 LONG  CONFIRMED wall 25900 entry 25918.1 stop 25895 tgt 25948.1 room 82 defended true  -> TARGET +30 pts at 10:49 (MFE 34 / MAE 0)
  10:44 LONG  CONFIRMED wall 25900 entry 25937.9 stop 25895 tgt 25967.9 room 62.1 defended true  -> TARGET +30 pts at 10:55 (MFE 35.5 / MAE -8.2)
  11:20 LONG  CONFIRMED wall 25900 entry 25924.5 stop 25895 tgt 25954.5 room 75.5 defended true  -> STOP -29.5 pts at 11:26 (MFE 0 / MAE -35.8)
  11:30 SHORT CONFIRMED wall 25900 entry 25891.2 stop 25905 tgt 25861.2 room 91.2 defended false  -> STOP -13.8 pts at 11:32 (MFE 0 / MAE -16.2)
  11:34 SHORT CONFIRMED wall 25900 entry 25877.1 stop 25905 tgt 25847.1 room 77 defended true  -> STOP -27.9 pts at 11:53 (MFE 9 / MAE -31.1)
  11:37 SHORT CONFIRMED wall 25900 entry 25871.6 stop 25905 tgt 25841.6 room 71.5 defended false  -> STOP -33.4 pts at 11:53 (MFE 3.5 / MAE -36.6)
  11:44 SHORT CONFIRMED wall 25900 entry 25878.3 stop 25905 tgt 25848.3 room 78.3 defended true  -> STOP -26.7 pts at 11:53 (MFE 10.3 / MAE -29.9)
  11:54 LONG  CONFIRMED wall 25900 entry 25916.6 stop 25895 tgt 25946.6 room 83.5 defended false  -> STOP -21.6 pts at 12:52 (MFE 29.3 / MAE -23.7)
  11:56 LONG  CONFIRMED wall 25900 entry 25930.2 stop 25895 tgt 25960.2 room 69.8 defended false  -> STOP -35.2 pts at 12:52 (MFE 15.6 / MAE -37.3)
  12:06 LONG  CONFIRMED wall 25900 entry 25924.5 stop 25895 tgt 25954.5 room 75.5 defended true  -> STOP -29.5 pts at 12:52 (MFE 21.3 / MAE -31.6)
  12:22 LONG  CONFIRMED wall 25900 entry 25926.5 stop 25895 tgt 25956.5 room 73.5 defended true  -> STOP -31.5 pts at 12:52 (MFE 10.7 / MAE -33.6)
  12:30 LONG  CONFIRMED wall 25900 entry 25923 stop 25895 tgt 25953 room 77 defended true  -> STOP -28 pts at 12:52 (MFE 6.5 / MAE -30.1)
  12:33 LONG  CONFIRMED wall 25900 entry 25929.5 stop 25895 tgt 25959.5 room 70.5 defended true  -> STOP -34.5 pts at 12:52 (MFE 0 / MAE -36.6)
  12:46 LONG  CONFIRMED wall 25900 entry 25909.1 stop 25895 tgt 25939.1 room 90.9 defended true  -> STOP -14.1 pts at 12:52 (MFE 1.3 / MAE -16.2)
  13:03 SHORT CONFIRMED wall 25900 entry 25880.2 stop 25905 tgt 25850.2 room 80.2 defended true  -> TARGET +30 pts at 13:13 (MFE 37.9 / MAE -18.2)
  13:10 SHORT CONFIRMED wall 25900 entry 25880.2 stop 25905 tgt 25850.2 room 80.2 defended true  -> TARGET +30 pts at 13:13 (MFE 37.9 / MAE 0)
  13:22 SHORT CONFIRMED wall 25900 entry 25867.2 stop 25905 tgt 25837.2 room 67.2 defended true  -> TARGET +30 pts at 13:30 (MFE 35.6 / MAE 0)
  13:39 LONG  CONFIRMED wall 25800 entry 25837.7 stop 25795 tgt 25867.7 room 62.3 defended false  -> STOP -42.7 pts at 13:55 (MFE 26.3 / MAE -44)
  14:08 LONG  CONFIRMED wall 25800 entry 25815.8 stop 25795 tgt 25845.8 room 84.2 defended false  -> STOP -20.8 pts at 14:14 (MFE 18.2 / MAE -24.1)
  14:15 SHORT CONFIRMED wall 25800 entry 25785.1 stop 25805 tgt 25755.1 room 85.1 defended true  -> STOP -19.9 pts at 14:18 (MFE 3.4 / MAE -21)
  14:19 LONG  CONFIRMED wall 25800 entry 25822.2 stop 25795 tgt 25852.2 room 77.8 defended false  -> TARGET +30 pts at 14:26 (MFE 35 / MAE -7.1)
  14:23 LONG  CONFIRMED wall 25800 entry 25837.7 stop 25795 tgt 25867.7 room 62.3 defended false  -> TARGET +30 pts at 14:38 (MFE 35.5 / MAE -8.8)

=== 2026-11-27 · CSV market_history_log_2026-11-26_2026-11-27-10-05-56 (1).csv (30s + oiLadder) · 223 bars ===
  09:24 LONG FAILED   wall 25850 · Closed 13 pts below 25850: wall failed
  09:36 LONG FAILED   wall 25850 · Closed 5 pts below 25850: wall failed
  10:01 LONG FAILED   wall 25850 · Closed 14 pts below 25850: wall failed
  10:08 SHORT FAILED   wall 25850 · Closed 10 pts above 25850: wall failed
  10:13 LONG FAILED   wall 25850 · Closed 8 pts below 25850: wall failed
  10:18 LONG FAILED   wall 25850 · Closed 14 pts below 25850: wall failed
  10:30 LONG FAILED   wall 25800 · Closed 7 pts below 25800: wall failed
  10:55 LONG FAILED   wall 25750 · Closed 6 pts below 25750: wall failed
  10:58 LONG FAILED   wall 25750 · Closed 15 pts below 25750: wall failed
  11:16 LONG FAILED   wall 25750 · Closed 16 pts below 25750: wall failed
  11:22 LONG FAILED   wall 25700 · Closed 11 pts below 25700: wall failed
  14:42 LONG FAILED   wall 25650 · Closed 5 pts below 25650: wall failed
  15:05 LONG FAILED   wall 25600 · Closed 6 pts below 25600: wall failed
  15:08 LONG FAILED   wall 25600 · Closed 8 pts below 25600: wall failed
  09:31 LONG  CONFIRMED wall 25800 entry 25820 stop 25795 tgt 25850 room 80 defended true  -> TARGET +30 pts at 09:34 (MFE 31.3 / MAE 0)
  09:41 LONG  CONFIRMED wall 25850 entry 25884.8 stop 25845 tgt 25895(cap) room 15.3 SHORT-ROOM defended true  -> STOP -39.8 pts at 09:50 (MFE 0 / MAE -42.3)
  09:42 SHORT CONFIRMED wall 25900 entry 25862.6 stop 25905 tgt 25855(cap) room 12.6 SHORT-ROOM defended true  -> TARGET +7.6 pts at 09:46 (MFE 12.8 / MAE -11.2)
  09:47 LONG  CONFIRMED wall 25850 entry 25864.8 stop 25845 tgt 25894.8 room 35.3 defended true  -> STOP -19.8 pts at 09:50 (MFE 5 / MAE -22.3)
  09:51 LONG  CONFIRMED wall 25850 entry 25869 stop 25845 tgt 25895(cap) room 31 defended true  -> STOP -24 pts at 09:52 (MFE 0 / MAE -25.5)
  09:58 LONG  CONFIRMED wall 25800 entry 25836.7 stop 25795 tgt 25866.7 room 63.3 defended true  -> TARGET +30 pts at 10:09 (MFE 48.3 / MAE -3.5)
  10:09 LONG  CONFIRMED wall 25850 entry 25885 stop 25845 tgt 25895(cap) room 15 SHORT-ROOM defended true  -> STOP -40 pts at 10:13 (MFE 0 / MAE -43.2)
  10:10 SHORT CONFIRMED wall 25900 entry 25875 stop 25905 tgt 25855(cap) room 25 SHORT-ROOM defended false  -> TARGET +20 pts at 10:12 (MFE 23.3 / MAE 0)
  10:18 SHORT CONFIRMED wall 25850 entry 25836 stop 25855 tgt 25806 room 36 defended true  -> TARGET +30 pts at 10:29 (MFE 30.5 / MAE -12.7)
  10:22 SHORT CONFIRMED wall 25850 entry 25834.1 stop 25855 tgt 25805(cap) room 34 defended true  -> TARGET +29.1 pts at 10:30 (MFE 40.8 / MAE 0)
  10:31 SHORT CONFIRMED wall 25800 entry 25774.1 stop 25805 tgt 25755(cap) room 24 SHORT-ROOM defended true  -> TARGET +19.1 pts at 10:55 (MFE 30.1 / MAE -22.9)
  10:35 SHORT CONFIRMED wall 25800 entry 25756.1 stop 25805 tgt 25726.1 room 6.1 SHORT-ROOM defended true  -> TARGET +30 pts at 11:00 (MFE 35.3 / MAE -40.9)
  10:36 LONG  CONFIRMED wall 25750 entry 25766.7 stop 25745 tgt 25795(cap) room 33.3 defended true  -> TARGET +28.3 pts at 10:49 (MFE 30.3 / MAE 0)
  10:40 LONG  CONFIRMED wall 25750 entry 25792.1 stop 25745 tgt 25822.1 room 8 SHORT-ROOM defended true  -> STOP -47.1 pts at 10:55 (MFE 4.9 / MAE -48.1)
  10:41 SHORT CONFIRMED wall 25800 entry 25778.3 stop 25805 tgt 25755(cap) room 28.3 SHORT-ROOM defended true  -> TARGET +23.3 pts at 10:55 (MFE 34.3 / MAE -18.7)
  10:43 SHORT CONFIRMED wall 25800 entry 25773.9 stop 25805 tgt 25755(cap) room 23.9 SHORT-ROOM defended true  -> TARGET +18.9 pts at 10:55 (MFE 29.9 / MAE -23)
  10:44 LONG  CONFIRMED wall 25750 entry 25784.5 stop 25745 tgt 25795(cap) room 15.5 SHORT-ROOM defended true  -> TARGET +10.5 pts at 10:49 (MFE 12.5 / MAE -1.2)
  10:46 SHORT CONFIRMED wall 25800 entry 25783.6 stop 25805 tgt 25755(cap) room 33.5 defended true  -> TARGET +28.6 pts at 10:55 (MFE 39.6 / MAE -13.4)
  10:50 SHORT CONFIRMED wall 25800 entry 25782.2 stop 25805 tgt 25755(cap) room 32.2 defended true  -> TARGET +27.2 pts at 10:55 (MFE 38.2 / MAE 0)
  11:02 LONG  CONFIRMED wall 25700 entry 25733.2 stop 25695 tgt 25763.2 room 66.8 defended false  -> STOP -38.2 pts at 11:22 (MFE 18.4 / MAE -43.8)
  11:05 LONG  CONFIRMED wall 25700 entry 25735.8 stop 25695 tgt 25765.8 room 64.2 defended true  -> STOP -40.8 pts at 11:22 (MFE 15.8 / MAE -46.4)
  14:03 LONG  CONFIRMED wall 25650 entry 25673.3 stop 25645 tgt 25703.3 room 126.7 defended true  -> STOP -28.3 pts at 14:42 (MFE 21.5 / MAE -28.6)
  14:12 LONG  CONFIRMED wall 25650 entry 25677.4 stop 25645 tgt 25707.4 room 122.7 defended false  -> STOP -32.4 pts at 14:42 (MFE 17.4 / MAE -32.7)
  14:26 LONG  CONFIRMED wall 25650 entry 25679.1 stop 25645 tgt 25709.1 room 120.9 defended false  -> STOP -34.1 pts at 14:42 (MFE 15.2 / MAE -34.4)
  14:35 LONG  CONFIRMED wall 25650 entry 25680.2 stop 25645 tgt 25710.2 room 119.8 defended false  -> STOP -35.2 pts at 14:42 (MFE 14 / MAE -35.5)
  14:37 LONG  CONFIRMED wall 25650 entry 25683.1 stop 25645 tgt 25713.1 room 116.9 defended false  -> STOP -38.1 pts at 14:42 (MFE 11.2 / MAE -38.4)

=== SUMMARY (spot points, before charges) ===
all confirmed setups                 n=98  win 49%  target 48 stop 50 timeout 0  net -297.3 pts  avg -3
first setup of the day only          n= 5  win 40%  target 2 stop 3 timeout 0  net -62.2 pts  avg -12.4
room >= 30 (your rule)               n=70  win 44%  target 31 stop 39 timeout 0  net -225.8 pts  avg -3.2
room < 30                            n=28  win 61%  target 17 stop 11 timeout 0  net -71.5 pts  avg -2.6
wall defended (writers adding)       n=76  win 54%  target 41 stop 35 timeout 0  net -10.2 pts  avg -0.1
wall not defended                    n=22  win 32%  target 7 stop 15 timeout 0  net -287.1 pts  avg -13
09:30-10:30 (your trading window)    n=33  win 52%  target 17 stop 16 timeout 0  net -119.2 pts  avg -3.6
after 10:30                          n=65  win 48%  target 31 stop 34 timeout 0  net -178.1 pts  avg -2.7
room >= 30 AND wall defended         n=53  win 49%  target 26 stop 27 timeout 0  net +8.9 pts  avg 0.2
first setup of the day, room >= 30   n= 5  win 20%  target 1 stop 4 timeout 0  net -109.1 pts  avg -21.8
LONG off floor                       n=60  win 45%  target 27 stop 33 timeout 0  net -314.1 pts  avg -5.2
SHORT off ceiling                    n=38  win 55%  target 21 stop 17 timeout 0  net +16.8 pts  avg 0.4

Caveat: bars are built from 30s-1min snapshots, so intrabar highs/lows are approximate; few days = not evidence of an edge.
```
