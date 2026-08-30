import fs from 'fs';
import { loadSessions, mean } from './data.mjs';
import { buildFeatures, toVector, FEATURES, WARMUP } from './features.mjs';
import { standardize, applyScale, ridgeFit, predict } from './ridge.mjs';

const HORIZONS = [5, 10, 15, 20, 25, 30];      // bars ~= minutes
const ALPHAS = { drift: 3000, sigma: 200, sent: 200, pcr: 200 };
const S = loadSessions();

/** Build (features, targets) for one session. */
function sampleSession(s) {
  const r = s.rows, out = [];
  for (let i = WARMUP; i + Math.max(...HORIZONS) < r.length; i++) {
    const f = buildFeatures(r, i);
    if (!f) continue;
    const x = toVector(f);
    if (x.some(v => !Number.isFinite(v))) continue;
    const y = {};
    for (const h of HORIZONS) {
      y[h] = {
        ret: Math.log(r[i + h].ltp / r[i].ltp) * 1e4,
        sent: r[i + h].sent - r[i].sent,
        pcr: r[i + h].pcr - r[i].pcr
      };
    }
    // Emulated current-heuristic drift: panel averages steps over a newest-first
    // array, which negates chronological momentum, then decays by 0.85^k.
    let mom = 0; for (let k = i - 9; k <= i; k++) mom += r[k].ltp - r[k - 1].ltp;
    mom /= 10;
    out.push({ x, y, now: { ltp: r[i].ltp, sent: r[i].sent, pcr: r[i].pcr }, mom });
  }
  return out;
}

const data = S.map(s => ({ date: s.date, rows: sampleSession(s) })).filter(s => s.rows.length > 20);
console.log(`sessions=${data.length} samples=${data.reduce((a, s) => a + s.rows.length, 0)} features=${FEATURES.length}`);

const heuristicDrift = (mom, steps, decay, sign) => {
  let d = 0; for (let k = 1; k <= steps; k++) d += sign * mom * Math.pow(decay, k);
  return d;
};

// ---------------- expanding-window walk-forward ----------------
const START = 20;
const oos = {}; for (const h of HORIZONS) oos[h] = [];

for (let cut = START; cut < data.length; cut++) {
  const tr = data.slice(0, cut).flatMap(s => s.rows);
  const te = data[cut].rows;
  const X = tr.map(s => s.x);
  const { mu, sg } = standardize(X);
  const Xs = X.map(r => applyScale(r, mu, sg));

  for (const h of HORIZONS) {
    const mDrift = ridgeFit(Xs, tr.map(s => s.y[h].ret), ALPHAS.drift);
    const mSigma = ridgeFit(Xs, tr.map(s => Math.log(Math.abs(s.y[h].ret) + 0.5)), ALPHAS.sigma);
    const mSent = ridgeFit(Xs, tr.map(s => s.y[h].sent), ALPHAS.sent);
    const mPcr = ridgeFit(Xs, tr.map(s => s.y[h].pcr), ALPHAS.pcr);
    for (const s of te) {
      const xs = applyScale(s.x, mu, sg);
      oos[h].push({
        pDrift: predict(mDrift, xs),
        pSigma: Math.exp(predict(mSigma, xs)),
        pSent: predict(mSent, xs),
        pPcr: predict(mPcr, xs),
        aRet: s.y[h].ret, aSent: s.y[h].sent, aPcr: s.y[h].pcr,
        ltp: s.now.ltp, mom: s.mom
      });
    }
  }
  if (cut % 8 === 0) process.stdout.write(`  fold ${cut}/${data.length - 1}\r`);
}

const rmse = a => Math.sqrt(mean(a));
console.log('\n\n=== OUT-OF-SAMPLE (walk-forward, never trained on the test session) ===\n');
console.log('PRICE  — RMSE in bps, lower is better');
console.log('H   n      model   zero-drift  curHeuristic  curHeur(signfix)   modelDirAcc');
for (const h of HORIZONS) {
  const o = oos[h], steps = Math.round(h / 5);
  const e = f => rmse(o.map(f));
  const model = e(s => (s.aRet - s.pDrift) ** 2);
  const zero = e(s => s.aRet ** 2);
  const cur = e(s => (s.aRet - heuristicDrift(s.mom, steps, 0.85, -1) / s.ltp * 1e4) ** 2);
  const curF = e(s => (s.aRet - heuristicDrift(s.mom, steps, 0.85, +1) / s.ltp * 1e4) ** 2);
  const dir = mean(o.filter(s => Math.abs(s.pDrift) > 1e-9).map(s => (Math.sign(s.pDrift) === Math.sign(s.aRet) ? 1 : 0)));
  console.log(String(h).padEnd(4), String(o.length).padEnd(7),
    model.toFixed(2).padStart(6), zero.toFixed(2).padStart(11), cur.toFixed(2).padStart(13),
    curF.toFixed(2).padStart(17), (100 * dir).toFixed(1).padStart(13) + '%');
}

console.log('\nSENTIMENT — RMSE (points)          PCR — RMSE');
console.log('H     model  persistence   |   model  persistence');
for (const h of HORIZONS) {
  const o = oos[h];
  console.log(String(h).padEnd(5),
    rmse(o.map(s => (s.aSent - s.pSent) ** 2)).toFixed(2).padStart(6),
    rmse(o.map(s => s.aSent ** 2)).toFixed(2).padStart(12), '  |',
    rmse(o.map(s => (s.aPcr - s.pPcr) ** 2)).toFixed(4).padStart(7),
    rmse(o.map(s => s.aPcr ** 2)).toFixed(4).padStart(12));
}

console.log('\nVOLATILITY BAND — |actual| vs predicted sigma');
console.log('H    corr(sigma,|ret|)   rawCoverage80   constCoverage80');
for (const h of HORIZONS) {
  const o = oos[h];
  const c = (() => { const a = o.map(s => s.pSigma), b = o.map(s => Math.abs(s.aRet));
    const ma = mean(a), mb = mean(b); let n = 0, da = 0, db = 0;
    for (let i = 0; i < a.length; i++) { n += (a[i]-ma)*(b[i]-mb); da += (a[i]-ma)**2; db += (b[i]-mb)**2; }
    return n / Math.sqrt(da * db || 1); })();
  const cov = mean(o.map(s => Math.abs(s.aRet - s.pDrift) <= 1.2816 * s.pSigma ? 1 : 0));
  const gs = mean(o.map(s => Math.abs(s.aRet)));
  const covC = mean(o.map(s => Math.abs(s.aRet - s.pDrift) <= 1.2816 * gs ? 1 : 0));
  console.log(String(h).padEnd(4), c.toFixed(3).padStart(14), (100*cov).toFixed(1).padStart(15)+'%', (100*covC).toFixed(1).padStart(15)+'%');
}
