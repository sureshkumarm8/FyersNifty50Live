# Nifty intraday forecast model

Small ridge-regression model trained on the daily **History view** CSV exports and
run in the browser by `services/predictionModel.ts`. It powers Method 1 and
Method 2 of the Predictions panel.

## Retraining after new exports

```bash
node ml/export.mjs          # retrain + rewrite services/models/nifty-forecast-model.json
npx tsx ml/parity.test.mjs  # browser inference must match the training pipeline
npx tsx ml/e2e.test.mjs     # band coverage / refusal behaviour on real sessions
npx tsx ml/multiday.test.mjs # multi-day archive handling
```

`CSV_DIR` overrides the export folder (default
`~/Downloads/nifty_sentiment_momentum_csvFiles`). Re-downloaded duplicates of the
same session are de-duplicated automatically, keeping the longest copy.

To re-derive the tuning constants rather than just refit weights:

```bash
node ml/signal.mjs      # information coefficients — is there signal at all?
node ml/train.mjs       # walk-forward validation vs baselines
node ml/calibrate.mjs   # drift shrinkage sweep + sigma band calibration
```
Copy the resulting shrinkage and sigma multipliers into `SHRINK` / `SIGMA_MULT`
in `export.mjs`, and refresh the `validation` block so the UI's model card keeps
quoting real numbers.

## What the data actually contains

Of the 15 exported columns, only **niftyLTP, sentiment and pcr** carry
information. `change`, `changePercent`, `callOI`, `putOI`, `vix`,
`bullishStocks`, `bearishStocks` and `advanceDecline` are **identically zero in
every row of every file**. The `momentum` / `cumulativeMomentum` columns are
derived from the raw feed and inherit the zero-LTP placeholder rows, producing
values as large as 24,107, so they are recomputed from price rather than trusted.

## What the validation showed

Expanding-window walk-forward, 22 held-out sessions, 7,298 forecasts per horizon.

| Finding | Result |
|---|---|
| Price **direction** | Not predictable. Best drift model beat "assume no move" by 0.1% RMSE — noise. Directional accuracy 45–47%. |
| Price **range** | Predictable. corr(predicted sigma, abs move) ≈ 0.21. |
| Band **calibration** | 80% band covers 78–81% in *every* volatility quintile. A constant-width band covers only 69% in the top quintile while claiming 80%. |
| **Sentiment** | Beats persistence at all six horizons (e.g. 9.54 vs 9.97 RMSE at 5 min). |
| **PCR** | Beats persistence at all six horizons (0.0280 vs 0.0312 at 5 min). |

The drift coefficients are therefore shrunk hard toward zero and the UI leads
with the range, not the midpoint. This is the model's main design decision: it
refuses to sell a directional call the data cannot support.

## Files

| File | Role |
|---|---|
| `data.mjs` | Loader, de-duplication, cleaning |
| `features.mjs` | Feature extraction — **mirrored by `buildFeatures()` in `services/predictionModel.ts`**, kept honest by `parity.test.mjs` |
| `ridge.mjs` | Ridge regression (normal equations + Cholesky), no dependencies |
| `signal.mjs`, `signal2.mjs` | Diagnostics that justify the design |
| `train.mjs` | Walk-forward validation against baselines |
| `calibrate.mjs` | Drift shrinkage sweep and sigma band calibration |
| `export.mjs` | Trains on all data and writes the shipped weight file |
| `parity.test.mjs` | Browser inference must reproduce the training pipeline exactly |
| `e2e.test.mjs` | Band coverage and refusal behaviour on real sessions |
| `multiday.test.mjs` | Multi-day archives: run selection, date anchoring, sparse-data refusal |
| `render.test.tsx` | Renders the panel table from a real session (`npx tsx ml/render.test.tsx`) |

---

## AI Lab intelligence services

The revamp added six services under `services/`, all dependency-free and all
reasoning in the same 16-dimension standardized feature space the forecast model
was trained in (`FEATURE_NAMES`, `standardizeVector`, `buildLabelledSeries` in
`predictionModel.ts`). The organising principle is that nothing is displayed as
a finding unless it has been measured against the archive.

| Service | Answers | Guard against fooling yourself |
|---|---|---|
| `agentScorecard.ts` | Has this agent actually been right? | Wilson bounds on the **effective** sample; 5-min duplicate suppression |
| `marketMemory.ts` | What followed when the market last looked like this? | Analogues kept 45 min apart; every result compared to base rate and z-tested |
| `regimeRadar.ts` | What kind of market is this? | Every threshold is an archive quantile, not a chosen number |
| `calibrationMonitor.ts` | Is the stated confidence worth anything? | Brier score vs a constant-guess baseline |
| `riskSizer.ts` | How large, and where is the stop? | Derived from the calibrated band, the one thing validated as reliable |
| `sessionDebrief.ts` | What should change tomorrow? | Every line traces to a graded call or a measured move |

### Two mistakes worth remembering

Both were caught by tests, and both would have produced convincing, wrong output.

**Overlapping samples inflate confidence.** Market Memory originally returned
the 25 nearest analogues outright. Because adjacent minutes are nearly
identical, three of the top five came from one afternoon, and the 30-minute
outcome looked like a `+18` percentage-point edge at `z = 1.81`. Enforcing 45
minutes of separation between selected analogues collapsed it to `+1.9` points
at `z = 0.18` — noise. The same flaw appeared in the scorecard, where calls
logged every 5 minutes and graded over 15 let a **coin flip** clear a Wilson
lower bound of 50% and be labelled an edge; `effectiveSampleSize()` discounts
overlapping windows by the ratio of spacing to horizon and it correctly grades
as a coin flip.

**A risk agent that only ever said BUY.** `riskAgent` in `AILab.tsx` chose BUY in
two of its three volatility branches and could never emit SELL, so it cast a
permanent bullish vote into the ensemble on evidence that says nothing about
direction. It now abstains from the direction vote (`score: 0`).

### Tests

`npm run model:test` runs parity, e2e, multiday, memory, regime, scorecard and
panel-render tests. The scorecard test replays six real archived sessions
against a synthetic oracle, coin flip and contrarian, and asserts they grade as
`edge`, `coin-flip` and `harmful` respectively.

---

## Early-session warm-up (5 minutes instead of 32)

The feature set spans 30 minutes (`ret30`, `vol30`, `z30`), so a cold start
could not produce a reading until 09:47 — after the most volatile part of the
day. `prepareRows()` now seeds the warm-up from the previous session's tail:

- **Level-aligned** — the seed is shifted so its last close equals the first
  live price. Without this the overnight gap enters `ret5`/`vol10` as an
  enormous fabricated move and every open reads as violently volatile.
- **Re-timestamped** to sit contiguously before the live open, so the >20-minute
  gap detector treats seed and session as one run.
- Only dynamics carry over. A reading is refused until there are
  `MIN_LIVE_BARS` (5) bars of genuine live data.

### The seed alone is not enough — the band must widen

Measured on 44 archived sessions, a naively seeded 5-bar forecast covered only
**22–36%** of outcomes inside its nominal 80% band. The seed carries yesterday's
*calm close* into today's *volatile open*, so `vol10`/`vol30` are badly
understated and the band comes out far too tight.

`warmupBandMultiplier(liveBars)` corrects this, calibrated from ~210 forecasts
per live-bar count:

```
mult(lb) = 1.44 + 1.60 * exp(-(lb - 5) / 8.0)      rmse 0.092
```

| live bars | 5 | 8 | 12 | 20 | 31 | 32+ |
|---|---|---|---|---|---|---|
| multiplier | 3.04 | 2.54 | 2.11 | 1.69 | 1.50 | 1.00 |

Coverage after correction: **83% / 86% / 69%** at 5/15/30 minutes from just five
live bars — at or above the cold-start baseline (63/53/68%), which is itself
under-covered because early-session forecasts are harder than the all-day
average the sigma calibration was fitted on. The floor stays above 1.0 for that
reason.

`WarmupNotice` states the live-bar count and the widening on screen, so an early
reading never looks as authoritative as a mature one.

### A bug this uncovered

Method 2 (Hybrid) previously backfilled by prepending raw archive rows. Those
sit months before the live session, so the gap detector split them apart and the
"hybrid" forecast was silently computed **from the archive run alone**, not from
today. It now goes through `prepareRows()`.
