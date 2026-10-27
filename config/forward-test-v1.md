# Forward Test Pre-Registration: Strategy Config v1

**Pre-Registration Date:** 2026-10-23  
**Config Version Hash:** `v1-bd5a65d2` (`bd5a65d25911288a34982839d5d8aeebf6674b6e75767b953b9ba529aa51b811`)  
**Strategy Config File:** `config/strategy.v1.json`  
**Test Mode:** PAPER TRADING with realistic feed fills (bid/ask or LTP ± half spread)  
**Planned Test Duration:** 8 Weeks (Minimum 40 trading sessions)  

---

## 1. Parameters (FROZEN — No Ad-Hoc Tuning During Test)

### Sniper Protocol Parameters
- **Download Window:** 09:15 – 09:25 IST
- **Entry Window:** 09:25 – 09:45 IST
- **Target Points:** 25 pts spot
- **Stop Points:** 15 pts spot
- **ITM Strike Offset:** 250 pts ITM
- **Trailing Stop Start:** 10:15 IST
- **Hard Stop & Flatten:** 10:30 IST
- **Engine Stand Down:** 10:35 IST
- **Min Confidence:** 65%
- **Trigger Zone Buffer:** 25 pts
- **Min Zone Width:** 50 pts
- **Comfortable Zone Width:** 75 pts

### Momentum Guard Parameters
- **Min Score Confidence:** 62%
- **Min Path Efficiency:** 0.30
- **Cooldown Window:** 5 minutes
- **Post-Loss Cooldown:** 15 minutes
- **Max Daily Trades:** 4
- **Max Consecutive Losses:** 2
- **Max Daily Loss Cap:** ₹2,000
- **Min Net Risk/Reward:** 1.3 : 1
- **Max Snapshot Age:** 90,000 ms (90 seconds)
- **Max Vision Age:** 300,000 ms (5 minutes)

---

## 2. Pre-Registered Pass/Fail Criteria (Promotion to Live Gate M9)

To be eligible for small LIVE execution (1 lot), the test run MUST satisfy all of the following statistical criteria:

1. **Trade Sample Size:** $\ge 100$ completed trades under config version `v1-bd5a65d2`.
2. **Real Price Requirement:** 100% of evaluated trades must use non-synthetic fills (live option LTP ± half spread). Any synthetic fallback trades are logged but excluded from promotion scorecards.
3. **Profit Factor (Post-Charges):** $\text{Profit Factor} \ge 1.20$ after deducting all statutory NSE/SEBI transaction charges, STT, and brokerages.
4. **Wilson Score Lower Bound:** 95% confidence interval lower bound $> 0.50$ (statistically superior to random coin toss).
5. **Drawdown Boundary:** Maximum paper drawdown $\le ₹15,000$ (agreed risk capital budget), and no single day exceeding the ₹2,000 daily loss cap.
6. **M8 Out-Of-Sample Alignment:** Same sign and consistent positive expectancy between paper test and the 2025–26 historical out-of-sample backtest split.
7. **Operational Safety Verification:**
   - Global kill switch (`/api/kill`) verified with $< 5\text{s}$ reaction time.
   - SL-M protective stop placed within 5s of any fill.
   - Broker reconciliation alarm active.

---

## 3. Governance
Any modification to parameters invalidates the test run, requiring increment to `strategy.v2.json`, new hash generation, and restarting the 8-week clock with an explicit changelog entry.
