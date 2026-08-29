/**
 * Calibrate a warm-up band multiplier.
 *
 * A forecast made 5 minutes into the session is genuinely more uncertain than
 * one made at 09:47: the feature windows are mostly borrowed, and the open is
 * the most volatile part of the day. Rather than pretend otherwise, we measure
 * how much wider the band must be at each live-bar count for the stated 80%
 * coverage to be true, and ship that table.
 */
import { loadSessions } from './data.mjs';
import { forecast, isForecastFailure, MIN_BARS } from '../services/predictionModel.ts';

const S = loadSessions();
const toRows = s => s.rows.filter(r => r.ltp > 0).map(x => ({ t: x.t, ltp: x.ltp, sent: x.sent, pcr: x.pcr }));
const HORIZ = [5, 10, 15, 20, 25, 30];
const COUNTS = [];
for (let k = 5; k <= 31; k++) COUNTS.push(k);

// Collect |actual - expected| / bandPts for every (liveBars, horizon).
const ratios = {};
for (let si = 1; si < S.length; si++) {
  const prior = toRows(S[si - 1]), today = toRows(S[si]);
  if (today.length < 70 || prior.length < MIN_BARS) continue;
  for (const lb of COUNTS) {
    const f = forecast(today.slice(0, lb), prior);
    if (isForecastFailure(f)) continue;
    for (const h of HORIZ) {
      const fut = today[lb - 1 + h];
      const hz = f.horizons.find(x => x.minutes === h);
      if (!fut || !hz || !(hz.bandPts > 0)) continue;
      const err = Math.abs(fut.ltp - hz.niftyLtp) / hz.bandPts;
      (ratios[lb] ??= []).push(err);
    }
  }
}

// The multiplier that makes 80% of outcomes land inside the band is simply the
// 80th percentile of that ratio.
const q = (a, p) => { const s=[...a].sort((x,y)=>x-y); return s[Math.min(s.length-1, Math.floor(p*s.length))]; };
console.log('live bars | n    | needed multiplier (80th pct of |err|/band)');
const table = {};
for (const lb of COUNTS) {
  const r = ratios[lb];
  if (!r || r.length < 30) { console.log(String(lb).padEnd(10), '| too few'); continue; }
  const m = q(r, 0.80);
  table[lb] = m;
  console.log(String(lb).padEnd(10), '|', String(r.length).padEnd(4), '|', m.toFixed(2));
}

// Fit m(lb) = c + a * exp(-(lb-5)/tau). The floor `c` matters: even with a full
// warm-up an early-session forecast needs a wider band than the all-day average
// the model was calibrated on, so the curve must not decay to 1.0.
let best = null;
for (let c = 1.0; c <= 2.0; c += 0.02) {
  for (let a = 0; a <= 6; a += 0.05) {
    for (let tau = 1; tau <= 40; tau += 0.5) {
      let sse = 0, n = 0;
      for (const lb of Object.keys(table)) {
        const pred = c + a * Math.exp(-(Number(lb) - 5) / tau);
        sse += (pred - table[lb]) ** 2; n++;
      }
      if (n && (!best || sse / n < best.mse)) best = { c, a, tau, mse: sse / n };
    }
  }
}
console.log(`\nfitted: mult(lb) = ${best.c.toFixed(2)} + ${best.a.toFixed(2)} * exp(-(lb-5)/${best.tau.toFixed(1)})   rmse=${Math.sqrt(best.mse).toFixed(3)}`);
for (const lb of [5,8,12,16,20,25,31]) if(table[lb]) console.log(`  lb=${String(lb).padEnd(3)} measured ${table[lb].toFixed(2)}  fitted ${(best.c+best.a*Math.exp(-(lb-5)/best.tau)).toFixed(2)}`);
console.log('\nJSON:', JSON.stringify({ minLiveBars: 5, floor: +best.c.toFixed(3), amp: +best.a.toFixed(3), tau: +best.tau.toFixed(2) }));
