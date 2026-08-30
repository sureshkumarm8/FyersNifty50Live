/**
 * Feature extraction. This file is the single source of truth for the model's
 * inputs and is mirrored line-for-line by buildFeatures() in
 * services/predictionModel.ts, so training and browser inference agree.
 *
 * `rows` must be oldest-first and `i` is the index of "now". Only rows at or
 * before `i` are read, so the features are causal by construction.
 */
export const WARMUP = 31;              // bars of history required before index i
export const FEATURES = [
  'ret5', 'ret15', 'ret30', 'vol10', 'vol30',
  'sent', 'sentSlope5', 'sentSlope15',
  'pcrDev', 'pcrChg5', 'pcrChg15',
  'todFrac', 'todVol', 'rangePos', 'sessionRet', 'z30'
];

const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const stdev = (a) => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); };
const logRet = (a, b) => Math.log(a / b) * 1e4;   // basis points

/**
 * Empirical intraday volatility seasonality (U/J shape) measured from the
 * exports: ~4.6bps at the open, ~2.3bps midday, ~3.5bps into the 14:45 close.
 * Encoded as a smooth multiplier so the model does not have to relearn it.
 */
export function todVolFactor(minutesSinceOpen) {
  const m = Math.max(0, Math.min(375, minutesSinceOpen));
  return 1 + 1.05 * Math.exp(-m / 45) + 0.45 * Math.exp(-((m - 330) ** 2) / (2 * 45 ** 2));
}

export function buildFeatures(rows, i) {
  if (i < WARMUP - 1) return null;
  const p = rows[i].ltp;
  if (!(p > 0)) return null;

  const bar = [];
  for (let k = i - 29; k <= i; k++) bar.push(Math.log(rows[k].ltp / rows[k - 1].ltp) * 1e4);
  const last10 = bar.slice(-10);

  const win30 = rows.slice(i - 29, i + 1);
  const hi = Math.max(...win30.map(r => r.ltp));
  const lo = Math.min(...win30.map(r => r.ltp));
  const m30 = avg(win30.map(r => r.ltp));
  const s30 = stdev(win30.map(r => r.ltp)) || 1;

  const sentOf = (n) => avg(rows.slice(i - n + 1, i + 1).map(r => r.sent));
  const pcrOf = (n) => avg(rows.slice(i - n + 1, i + 1).map(r => r.pcr));

  return {
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
}

export const toVector = (f) => FEATURES.map(k => f[k]);
