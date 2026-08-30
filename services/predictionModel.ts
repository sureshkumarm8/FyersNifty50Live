/**
 * Nifty intraday forecast model — browser inference.
 *
 * Trained offline by ml/train.mjs on the daily History-view CSV exports and
 * shipped as a ~9KB weight file. Everything here is a dot product, so a full
 * six-horizon forecast costs microseconds.
 *
 * What the walk-forward validation actually showed (see ml/ for the scripts):
 *
 *  - Price DIRECTION at 5-30 minutes is not predictable from this data. The
 *    best out-of-sample drift model improved RMSE by ~0.1% over "assume no
 *    move", which is noise. The drift coefficients are therefore shrunk hard
 *    toward zero and the forecast is presented as a band, not a point.
 *  - Price RANGE is predictable. Predicted sigma correlates ~0.21 with the
 *    realised absolute move, and after calibration the 80% band covers 78-81%
 *    of outcomes in every volatility quintile. A constant-width band covers
 *    only 69% in the top quintile while claiming 80% — it fails exactly when
 *    the market is dangerous.
 *  - Sentiment and PCR are genuinely forecastable and the model beats simple
 *    persistence at every horizon.
 *
 * The model is fed by whichever series the caller supplies, which is what
 * separates the two panel methods: archived snapshots for Method 1, live
 * session snapshots (backfilled from the archive during warm-up) for Method 2.
 */

import modelJson from './models/nifty-forecast-model.json';

export interface ModelInputRow {
  /** Epoch milliseconds. */
  t: number;
  ltp: number;
  sent: number;
  pcr: number;
}

export interface HorizonForecast {
  minutes: number;
  /** Wall-clock label for the forecast time. */
  time: string;
  niftyLtp: number;
  /** Expected move from now, in index points. */
  ptsChg: number;
  /** 80% confidence band on the price. */
  low: number;
  high: number;
  /** Half-width of the 80% band in index points. */
  bandPts: number;
  /** Expected 1-sigma move in index points. */
  sigmaPts: number;
  /** Calibrated probability the index is higher than now at this horizon. */
  probUp: number;
  overallSent: number;
  pcr: number;
  /** 0-100. Derived from band width relative to price, not from a fixed curve. */
  confidence: number;
}

export interface ForecastResult {
  ok: true;
  horizons: HorizonForecast[];
  /** Bars actually available after resampling. */
  bars: number;
  /** True when live history was too short and archive rows filled the warm-up. */
  backfilled: boolean;
  /** How many warm-up bars were borrowed from the previous session. */
  backfilledBars: number;
  /** Bars of genuine live session data behind this reading. */
  liveBars: number;
  /** Band widening applied because the warm-up was seeded. 1 when not needed. */
  warmupMultiplier: number;
  asOf: number;
  meta: typeof modelJson.validation & { dataset: typeof modelJson.dataset };
}

export interface ForecastFailure {
  ok: false;
  reason: string;
  bars: number;
  needed: number;
}

/**
 * This project compiles without `strict`, which disables truthiness narrowing on
 * boolean-literal discriminants, so callers need an explicit type predicate.
 */
export const isForecastFailure = (r: ForecastResult | ForecastFailure): r is ForecastFailure => !r.ok;

const M = modelJson as any;
const FEATURES: string[] = M.features;
const HORIZONS: number[] = M.horizonsMinutes;
export const MIN_BARS = M.warmup + 1;
export const MODEL_META = { dataset: M.dataset, validation: M.validation, trainedAt: M.trainedAt };

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const stdev = (a: number[]) => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); };

/** Normal CDF (Abramowitz & Stegun 7.1.26), used for the direction probability. */
function normCdf(z: number): number {
  const s = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + s * y);
}

/** Mirrors todVolFactor() in ml/features.mjs. */
function todVolFactor(minutesSinceOpen: number): number {
  const m = Math.max(0, Math.min(375, minutesSinceOpen));
  return 1 + 1.05 * Math.exp(-m / 45) + 0.45 * Math.exp(-((m - 330) ** 2) / (2 * 45 ** 2));
}

/**
 * Split a series wherever the gap between consecutive rows is large enough that
 * the model should not bridge it. Archives span months, so the raw series is a
 * sequence of daily runs separated by ~17-hour overnight gaps; feeding that to a
 * minute-grid resampler would otherwise produce a mostly-empty grid.
 */
export function contiguousRuns(rows: ModelInputRow[], maxGapMs = 20 * 60000): ModelInputRow[][] {
  const sorted = [...rows].sort((a, b) => a.t - b.t);
  const runs: ModelInputRow[][] = [];
  let cur: ModelInputRow[] = [];
  for (const r of sorted) {
    if (cur.length && r.t - cur[cur.length - 1].t > maxGapMs) {
      runs.push(cur);
      cur = [];
    }
    cur.push(r);
  }
  if (cur.length) runs.push(cur);
  return runs;
}

/**
 * The model is trained on one-minute bars. Live snapshots can arrive at any
 * cadence, so the series is snapped onto a strict one-minute grid with
 * forward-fill. Without this the lookback windows would silently mean
 * different spans of time than they did in training.
 */
export function resampleToMinuteBars(rows: ModelInputRow[]): Array<ModelInputRow & { mod: number }> {
  const clean = rows
    .filter(r => Number.isFinite(r.t) && r.ltp > 1000 && Number.isFinite(r.sent))
    .sort((a, b) => a.t - b.t);
  if (clean.length === 0) return [];

  // Forward-fill PCR the same way the training loader does.
  let lastPcr = NaN;
  const filled = clean.map(r => {
    const pcr = (r.pcr > 0.2 && r.pcr < 3) ? r.pcr : lastPcr;
    if (r.pcr > 0.2 && r.pcr < 3) lastPcr = r.pcr;
    return { ...r, pcr };
  });
  const firstGood = filled.find(r => Number.isFinite(r.pcr));
  for (const r of filled) if (!Number.isFinite(r.pcr)) r.pcr = firstGood ? firstGood.pcr : 1;

  const MIN = 60000;
  const start = Math.floor(filled[0].t / MIN);
  const end = Math.floor(filled[filled.length - 1].t / MIN);

  const out: Array<ModelInputRow & { mod: number }> = [];
  let idx = 0, last = filled[0];
  for (let m = start; m <= end; m++) {
    while (idx < filled.length && Math.floor(filled[idx].t / MIN) <= m) last = filled[idx++];
    const d = new Date(m * MIN);
    out.push({ t: m * MIN, ltp: last.ltp, sent: last.sent, pcr: last.pcr, mod: d.getHours() * 60 + d.getMinutes() - 555 });
  }
  return out;
}

/** Mirrors buildFeatures() in ml/features.mjs exactly. */
function buildFeatures(rows: Array<ModelInputRow & { mod: number }>, i: number): number[] | null {
  if (i < M.warmup - 1) return null;
  const p = rows[i].ltp;
  if (!(p > 0)) return null;

  const bar: number[] = [];
  for (let k = i - 29; k <= i; k++) bar.push(Math.log(rows[k].ltp / rows[k - 1].ltp) * 1e4);
  const last10 = bar.slice(-10);

  const win30 = rows.slice(i - 29, i + 1);
  const hi = Math.max(...win30.map(r => r.ltp));
  const lo = Math.min(...win30.map(r => r.ltp));
  const m30 = avg(win30.map(r => r.ltp));
  const s30 = stdev(win30.map(r => r.ltp)) || 1;

  const sentOf = (n: number) => avg(rows.slice(i - n + 1, i + 1).map(r => r.sent));
  const pcrOf = (n: number) => avg(rows.slice(i - n + 1, i + 1).map(r => r.pcr));
  const logRet = (a: number, b: number) => Math.log(a / b) * 1e4;

  const f: Record<string, number> = {
    ret5: logRet(p, rows[i - 5].ltp),
    ret15: logRet(p, rows[i - 15].ltp),
    ret30: logRet(p, rows[i - 30].ltp),
    vol10: stdev(last10),
    vol30: stdev(bar),
    sent: rows[i].sent,
    sentSlope5: rows[i].sent - sentOf(5),
    sentSlope15: rows[i].sent - sentOf(15),
    pcrDev: rows[i].pcr - 1,
    pcrChg5: rows[i].pcr - pcrOf(5),
    pcrChg15: rows[i].pcr - pcrOf(15),
    todFrac: Math.max(0, Math.min(1, rows[i].mod / 375)),
    todVol: todVolFactor(rows[i].mod),
    rangePos: hi > lo ? (p - lo) / (hi - lo) : 0.5,
    sessionRet: logRet(p, rows[0].ltp),
    z30: (p - m30) / s30
  };
  const vec = FEATURES.map(k => f[k]);
  return vec.some(v => !Number.isFinite(v)) ? null : vec;
}

const dot = (m: { w: number[]; b: number }, x: number[]) => m.b + x.reduce((s, v, j) => s + v * m.w[j], 0);

/** Names of the 16 feature dimensions, in vector order. */
export const FEATURE_NAMES: string[] = FEATURES;

export interface FeaturePoint {
  t: number;
  /** Minutes since the 09:15 open. */
  mod: number;
  ltp: number;
  sent: number;
  pcr: number;
  /** Raw feature vector. */
  vec: number[];
  /** Standardized vector — the space distances should be measured in. */
  z: number[];
}

/** Standardize a raw feature vector into the model's training space. */
export const standardizeVector = (vec: number[]): number[] =>
  vec.map((v, j) => (v - M.scaler.mu[j]) / M.scaler.sg[j]);

/**
 * Build a feature point for every bar in a series that has enough warm-up.
 *
 * Shared by Market Memory, Regime Radar and Risk Sizing so all of them reason in
 * exactly the space the forecast model was trained and validated in, rather than
 * each inventing its own notion of "similar market".
 */
export function buildFeatureSeries(rows: ModelInputRow[]): FeaturePoint[] {
  const out: FeaturePoint[] = [];
  for (const run of contiguousRuns(rows)) {
    if (medianGapMinutes(run) > MAX_MEDIAN_GAP_MIN) continue;
    const bars = resampleToMinuteBars(run);
    for (let i = M.warmup; i < bars.length; i++) {
      const vec = buildFeatures(bars, i);
      if (!vec) continue;
      out.push({
        t: bars[i].t,
        mod: bars[i].mod,
        ltp: bars[i].ltp,
        sent: bars[i].sent,
        pcr: bars[i].pcr,
        vec,
        z: standardizeVector(vec)
      });
    }
  }
  return out;
}

/**
 * Feature points paired with what actually happened next, for analogue search
 * and regime statistics. `forward[h]` is the realised move in index points h
 * minutes later, present only when the series extends that far.
 */
export interface LabelledPoint extends FeaturePoint {
  forward: Record<number, number>;
}

export function buildLabelledSeries(rows: ModelInputRow[], horizons: number[] = HORIZONS): LabelledPoint[] {
  const out: LabelledPoint[] = [];
  for (const run of contiguousRuns(rows)) {
    if (medianGapMinutes(run) > MAX_MEDIAN_GAP_MIN) continue;
    const bars = resampleToMinuteBars(run);
    for (let i = M.warmup; i < bars.length; i++) {
      const vec = buildFeatures(bars, i);
      if (!vec) continue;
      const forward: Record<number, number> = {};
      for (const h of horizons) if (i + h < bars.length) forward[h] = bars[i + h].ltp - bars[i].ltp;
      out.push({
        t: bars[i].t,
        mod: bars[i].mod,
        ltp: bars[i].ltp,
        sent: bars[i].sent,
        pcr: bars[i].pcr,
        vec,
        z: standardizeVector(vec),
        forward
      });
    }
  }
  return out;
}

export const MODEL_HORIZONS: number[] = HORIZONS;

/** Exposed for the parity test against the training pipeline. */
export function rawInference(featureVector: number[]) {
  const xs = featureVector.map((v, j) => (v - M.scaler.mu[j]) / M.scaler.sg[j]);
  const out: Record<number, { drift: number; sigma: number; sent: number; pcr: number }> = {};
  for (const h of HORIZONS) {
    const hm = M.horizons[h];
    out[h] = {
      drift: dot(hm.drift, xs),
      sigma: Math.exp(dot(hm.sigma, xs)) * hm.sigma.mult,
      sent: dot(hm.sent, xs),
      pcr: dot(hm.pcr, xs)
    };
  }
  return out;
}

/**
 * Longest tolerated median spacing between observations, in minutes. A one-minute
 * live feed and a five-minute one both qualify; a series with 15-minute holes
 * does not, because forward-filling it would manufacture a long stretch of
 * identical bars and the model would read that flat line as near-zero
 * volatility and quote an absurdly tight band.
 */
const MAX_MEDIAN_GAP_MIN = 6;

const medianGapMinutes = (run: ModelInputRow[]): number => {
  if (run.length < 2) return Infinity;
  const gaps: number[] = [];
  for (let i = 1; i < run.length; i++) gaps.push((run[i].t - run[i - 1].t) / 60000);
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
};

/**
 * Bars the model would actually use for this series, or 0 if none qualifies.
 * Exported so UI gating cannot drift away from what forecast() will accept.
 */
export function usableRunBars(rows: ModelInputRow[]): number {
  let best = 0;
  for (const run of contiguousRuns(rows)) {
    if (medianGapMinutes(run) > MAX_MEDIAN_GAP_MIN) continue;
    best = Math.max(best, resampleToMinuteBars(run).length);
  }
  return best;
}

/** Genuine live bars required before a backfilled reading is offered. */
export const MIN_LIVE_BARS = M.warmupBand?.minLiveBars ?? 5;

/**
 * How much wider the band must be when the warm-up was seeded rather than lived.
 *
 * A forecast made five minutes into the session is genuinely less certain than
 * one made at 09:47: most of its feature window is borrowed from yesterday, and
 * the open is the most volatile part of the day. Measured on 44 archived
 * sessions, the band needs to be ~3x wider at 5 live bars, decaying to ~1.5x by
 * 31. Widening it is what keeps "80% band" a true statement instead of a label;
 * the alternative is a tight band that is wrong three times out of four.
 */
export function warmupBandMultiplier(liveBars: number): number {
  const w = M.warmupBand;
  if (!w || liveBars >= MIN_BARS) return 1;
  return w.floor + w.amp * Math.exp(-(Math.max(liveBars, w.minLiveBars) - w.minLiveBars) / w.tau);
}

export interface PreparedRows {
  rows: ModelInputRow[];
  /** Bars of real live session data. */
  liveBars: number;
  /** Bars borrowed from the previous session to seed the feature windows. */
  backfilledBars: number;
}

/**
 * Seed the model's warm-up window with the tail of the previous session.
 *
 * The feature set spans 30 minutes (`ret30`, `vol30`, `z30`), so a cold start
 * cannot produce a reading until 32 minutes into the session — by which time
 * the most volatile part of the day is over. Indicators are conventionally
 * seeded from prior data rather than left blank, and that is what this does.
 *
 * Two details make it honest rather than convenient:
 *
 *  - The borrowed bars are **level-aligned**: the archived tail is shifted so
 *    its last close equals the first live price. Without this, the overnight
 *    gap would enter `ret5`/`vol10` as an enormous fabricated move and the model
 *    would read the open as violently volatile every single day.
 *  - They are **re-timestamped** to sit contiguously before the live open, so
 *    the gap detector treats the seed and the session as one run. Only the
 *    dynamics are carried over; no archived bar is presented as live data, and
 *    callers are told exactly how many bars were borrowed.
 *
 * Sentiment and PCR are carried across unshifted — they are bounded measures,
 * not price levels, so yesterday's closing sentiment is a fair prior for today's
 * opening sentiment.
 */
export function prepareRows(live: ModelInputRow[], archive: ModelInputRow[] = []): PreparedRows {
  const liveSorted = [...live].filter(r => r.ltp > 0).sort((a, b) => a.t - b.t);
  if (liveSorted.length === 0) return { rows: [], liveBars: 0, backfilledBars: 0 };

  // Enough real history already — never borrow when it is not needed.
  if (usableRunBars(liveSorted) >= MIN_BARS) {
    return { rows: liveSorted, liveBars: liveSorted.length, backfilledBars: 0 };
  }

  const firstLive = liveSorted[0];
  const priorRuns = contiguousRuns(archive.filter(r => r.ltp > 0 && r.t < firstLive.t));
  if (priorRuns.length === 0) return { rows: liveSorted, liveBars: liveSorted.length, backfilledBars: 0 };

  const prior = resampleToMinuteBars(priorRuns[priorRuns.length - 1]);
  const need = MIN_BARS - liveSorted.length;
  if (prior.length === 0 || need <= 0) {
    return { rows: liveSorted, liveBars: liveSorted.length, backfilledBars: 0 };
  }

  const tail = prior.slice(-need);
  const shift = firstLive.ltp - tail[tail.length - 1].ltp;
  const startT = firstLive.t - tail.length * 60000;

  const seeded: ModelInputRow[] = tail.map((b, k) => ({
    t: startT + k * 60000,
    ltp: b.ltp + shift,
    sent: b.sent,
    pcr: b.pcr
  }));

  return {
    rows: [...seeded, ...liveSorted],
    liveBars: liveSorted.length,
    backfilledBars: seeded.length
  };
}

/**
 * Produce the six-horizon forecast from a snapshot series.
 * `rows` may be in any order, any cadence and may span many days — the most
 * recent contiguous, sufficiently dense run is selected automatically.
 */
export function forecast(rows: ModelInputRow[], archive?: ModelInputRow[]): ForecastResult | ForecastFailure {
  let backfilledBars = 0;
  if (archive && archive.length) {
    const prepared = prepareRows(rows, archive);
    // Refuse to run on seed alone — a reading needs real data from today.
    if (prepared.backfilledBars > 0 && prepared.liveBars >= MIN_LIVE_BARS) {
      rows = prepared.rows;
      backfilledBars = prepared.backfilledBars;
    }
  }
  const runs = contiguousRuns(rows);
  if (runs.length === 0) {
    return { ok: false, reason: `No usable snapshots. The model needs ${MIN_BARS} minutes of history.`, bars: 0, needed: MIN_BARS };
  }

  // Walk backwards from the newest run and use the first one that is both long
  // enough and densely enough sampled.
  let bars: Array<ModelInputRow & { mod: number }> = [];
  let longest = 0;
  let sawSparse = false;
  for (let k = runs.length - 1; k >= 0; k--) {
    const candidate = resampleToMinuteBars(runs[k]);
    if (candidate.length < MIN_BARS) { longest = Math.max(longest, candidate.length); continue; }
    if (medianGapMinutes(runs[k]) > MAX_MEDIAN_GAP_MIN) { sawSparse = true; continue; }
    longest = Math.max(longest, candidate.length);
    bars = candidate;
    break;
  }
  if (bars.length === 0) {
    return {
      ok: false,
      reason: sawSparse
        ? `History is too sparsely sampled — the model needs snapshots at least every ${MAX_MEDIAN_GAP_MIN} minutes.`
        : `Need ${MIN_BARS} minutes of continuous history. The longest unbroken run in this data is ${longest} minute${longest === 1 ? '' : 's'}.`,
      bars: longest,
      needed: MIN_BARS
    };
  }

  const i = bars.length - 1;
  const x = buildFeatures(bars, i);
  if (!x) return { ok: false, reason: 'History contains gaps the model cannot bridge.', bars: bars.length, needed: MIN_BARS };

  const now = bars[i];
  const raw = rawInference(x);
  const asOf = now.t;

  // A seeded warm-up is genuinely less certain than a lived one; widen the band
  // so its stated 80% coverage stays true. Returns 1 once the session has
  // supplied a full warm-up of its own.
  const liveBars = backfilledBars > 0 ? bars.length - backfilledBars : bars.length;
  const warmMult = backfilledBars > 0 ? warmupBandMultiplier(liveBars) : 1;

  const horizons: HorizonForecast[] = HORIZONS.map(h => {
    const r = raw[h];
    const price = now.ltp * Math.exp(r.drift / 1e4);
    const sigmaPts = now.ltp * (r.sigma / 1e4) * warmMult;
    const bandPts = 1.2816 * sigmaPts;                     // 80% two-sided
    const d = new Date(asOf + h * 60000);
    return {
      minutes: h,
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      niftyLtp: price,
      ptsChg: price - now.ltp,
      low: price - bandPts,
      high: price + bandPts,
      bandPts,
      sigmaPts,
      probUp: normCdf(sigmaPts > 0 ? (price - now.ltp) / sigmaPts : 0),
      overallSent: Math.max(-100, Math.min(100, now.sent + r.sent)),
      pcr: Math.max(0.5, Math.min(2, now.pcr + r.pcr)),
      // Tight band relative to price => more confidence. Anchored so a typical
      // 12bps band at 30 minutes lands around 60.
      confidence: Math.max(5, Math.min(95, 100 - (bandPts / now.ltp) * 1e4 * 3.2))
    };
  });

  return {
    ok: true,
    horizons,
    bars: bars.length,
    backfilled: backfilledBars > 0,
    backfilledBars,
    liveBars,
    warmupMultiplier: warmMult,
    asOf,
    meta: { ...M.validation, dataset: M.dataset }
  };
}

/**
 * Convert app snapshots (any order) into model input rows.
 *
 * Archived snapshots frequently carry only a "HH:MM:SS" label with no epoch
 * timestamp. Pass the archive's `date` ("YYYY-MM-DD") as `dateISO` so each day
 * is anchored correctly; without it every day would collapse onto today and the
 * separate sessions would be indistinguishable.
 */
export function toModelRows(
  snaps: Array<{ timestamp?: number; time?: string; niftyLtp: number; overallSent: number; pcr: number }>,
  dateISO?: string
): ModelInputRow[] {
  const base = dateISO ? new Date(`${dateISO}T00:00:00`) : null;
  return snaps
    .map(s => {
      let t = s.timestamp;
      if (!Number.isFinite(t as number) && s.time) {
        const [hh, mm, ss] = s.time.split(':').map(Number);
        const d = base ? new Date(base.getTime()) : new Date();
        d.setHours(hh || 0, mm || 0, ss || 0, 0);
        t = d.getTime();
      }
      return { t: t as number, ltp: s.niftyLtp, sent: s.overallSent, pcr: s.pcr };
    })
    .filter(r => Number.isFinite(r.t));
}
