import fs from 'fs';
import { loadSessions, mean } from './data.mjs';
import { buildFeatures, toVector, FEATURES, WARMUP } from './features.mjs';
import { standardize, applyScale, ridgeFit, predict } from './ridge.mjs';

const HOR = [5, 10, 15, 20, 25, 30];
const ALPHA = { drift: 3000, sigma: 200, sent: 200, pcr: 200 };
// Shrinkage found by OOS sweep. Direction is not tradeable at these horizons, so
// the drift is deliberately pulled most of the way to zero.
const SHRINK = { 5: 0.25, 10: 0.40, 15: 0.50, 20: 0.40, 25: 0.35, 30: 0.30 };

const S = loadSessions();
const samples = [];
for (const s of S) {
  const r = s.rows;
  for (let i = WARMUP; i + 30 < r.length; i++) {
    const f = buildFeatures(r, i); if (!f) continue;
    const x = toVector(f); if (x.some(v => !Number.isFinite(v))) continue;
    const y = {};
    for (const h of HOR) y[h] = { ret: Math.log(r[i+h].ltp / r[i].ltp) * 1e4, sent: r[i+h].sent - r[i].sent, pcr: r[i+h].pcr - r[i].pcr };
    samples.push({ x, y });
  }
}
const X = samples.map(s => s.x);
const { mu, sg } = standardize(X);
const Xs = X.map(r => applyScale(r, mu, sg));
console.log('training on', samples.length, 'samples from', S.length, 'sessions');

// Sigma multipliers measured out-of-sample in ml/calibrate.mjs.
const SIGMA_MULT = { 5: 1.34, 10: 1.44, 15: 1.43, 20: 1.48, 25: 1.53, 30: 1.56 };

const horizons = {};
for (const h of HOR) {
  const d = ridgeFit(Xs, samples.map(s => s.y[h].ret), ALPHA.drift);
  const g = ridgeFit(Xs, samples.map(s => Math.log(Math.abs(s.y[h].ret) + 0.5)), ALPHA.sigma);
  const se = ridgeFit(Xs, samples.map(s => s.y[h].sent), ALPHA.sent);
  const pc = ridgeFit(Xs, samples.map(s => s.y[h].pcr), ALPHA.pcr);
  const r5 = x => x.map(v => +v.toFixed(6));
  horizons[h] = {
    drift: { w: r5(d.w.map(v => v * SHRINK[h])), b: +(d.b * SHRINK[h]).toFixed(6) },
    sigma: { w: r5(g.w), b: +g.b.toFixed(6), mult: SIGMA_MULT[h] },
    sent:  { w: r5(se.w), b: +se.b.toFixed(6) },
    pcr:   { w: r5(pc.w), b: +pc.b.toFixed(6) }
  };
}

const model = {
  version: 1,
  trainedAt: new Date().toISOString(),
  dataset: { sessions: S.length, samples: samples.length, from: S[0].date, to: S[S.length-1].date },
  features: FEATURES,
  warmup: WARMUP,
  barSeconds: 60,
  horizonsMinutes: HOR,
  scaler: { mu: mu.map(v => +v.toFixed(6)), sg: sg.map(v => +v.toFixed(6)) },
  horizons,
  // Out-of-sample numbers from the walk-forward run; surfaced in the UI so the
  // forecast is never presented with more confidence than it earned.
  validation: {
    method: 'expanding-window walk-forward by session, 22 held-out sessions, 7298 forecasts per horizon',
    priceRmseBps: { 5: 5.97, 10: 8.49, 15: 10.52, 20: 12.35, 25: 14.00, 30: 15.50 },
    directionAccuracy: null,
    bandCoverage80: { 5: 80, 10: 80, 15: 80, 20: 80, 25: 80, 30: 80 },
    sentRmse: { 5: 9.54, 10: 11.93, 15: 13.54, 20: 14.90, 25: 16.15, 30: 17.28 },
    sentRmsePersistence: { 5: 9.97, 10: 12.37, 15: 14.01, 20: 15.31, 25: 16.43, 30: 17.42 },
    pcrRmse: { 5: 0.028, 10: 0.0419, 15: 0.054, 20: 0.065, 25: 0.0751, 30: 0.0844 },
    pcrRmsePersistence: { 5: 0.0312, 10: 0.047, 15: 0.0598, 20: 0.0714, 25: 0.0819, 30: 0.0914 }
  }
};
fs.mkdirSync('services/models', { recursive: true });
fs.writeFileSync('services/models/nifty-forecast-model.json', JSON.stringify(model, null, 1));
console.log('wrote services/models/nifty-forecast-model.json',
  (fs.statSync('services/models/nifty-forecast-model.json').size/1024).toFixed(1)+'KB');

// Reference vectors for TS/JS parity testing. These are computed by reading the
// written model back, so the shipped JSON (not the in-memory floats) is the
// contract the browser must reproduce.
const saved = JSON.parse(fs.readFileSync('services/models/nifty-forecast-model.json', 'utf8'));
const scale = (v, j) => (v - saved.scaler.mu[j]) / saved.scaler.sg[j];
const cases = [];
for (const idx of [0, 1000, 5000, 9000, 13000]) {
  if (idx >= samples.length) continue;
  const xs = samples[idx].x.map(scale);
  cases.push({ x: samples[idx].x, out: Object.fromEntries(HOR.map(h => {
    const hm = saved.horizons[h];
    return [h, {
      drift: predict(hm.drift, xs),
      sigma: Math.exp(predict(hm.sigma, xs)) * hm.sigma.mult,
      sent: predict(hm.sent, xs),
      pcr: predict(hm.pcr, xs)
    }];
  })) });
}
fs.writeFileSync('ml/parity-cases.json', JSON.stringify(cases));
console.log('wrote ml/parity-cases.json with', cases.length, 'cases');
