import { loadSessions } from './data.mjs';
import { forecast, toModelRows, MIN_BARS } from '../services/predictionModel.ts';

const S = loadSessions();
const held = S.slice(-10);           // last 10 sessions
let n = 0, cov = 0, hits = 0, dirN = 0, sumAbsErr = 0, sumAbsNaive = 0;
const H = 30;

for (const s of held) {
  const r = s.rows;
  for (let i = 40; i + H < r.length; i += 7) {
    // Feed snapshots exactly as the app holds them: newest-first, app field names.
    const snaps = r.slice(0, i + 1).map(x => ({
      timestamp: x.t, time: x.time, niftyLtp: x.ltp, overallSent: x.sent, pcr: x.pcr
    })).reverse();
    const f = forecast(toModelRows(snaps));
    if (!f.ok) continue;
    const h30 = f.horizons.find(x => x.minutes === H);
    const actual = r[i + H].ltp;
    n++;
    if (actual >= h30.low && actual <= h30.high) cov++;
    sumAbsErr += Math.abs(actual - h30.niftyLtp);
    sumAbsNaive += Math.abs(actual - r[i].ltp);
    if (Math.abs(h30.probUp - 0.5) > 0.02) { dirN++; if ((h30.probUp > 0.5) === (actual > r[i].ltp)) hits++; }
  }
}
console.log(`forecasts evaluated: ${n} (10 most recent sessions, model trained on all 44)`);
console.log(`80% band coverage : ${(100*cov/n).toFixed(1)}%   (target 80%)`);
console.log(`MAE model         : ${(sumAbsErr/n).toFixed(2)} pts`);
console.log(`MAE assume-no-move: ${(sumAbsNaive/n).toFixed(2)} pts`);
console.log(`directional calls : ${dirN}, accuracy ${dirN? (100*hits/dirN).toFixed(1):'-'}%`);

// Cadence robustness: 5-minute snapshots must still work via resampling.
const s = held[held.length-1], r = s.rows;
const sparse = r.filter((_,k)=>k%5===0).slice(0,80).map(x=>({timestamp:x.t,time:x.time,niftyLtp:x.ltp,overallSent:x.sent,pcr:x.pcr})).reverse();
const fs5 = forecast(toModelRows(sparse));
console.log('\n5-min cadence input ->', fs5.ok ? `ok, ${fs5.bars} bars after resample, 30m band +-${fs5.horizons[5].bandPts.toFixed(1)} pts` : 'FAIL '+fs5.reason);
const tooShort = forecast(toModelRows(r.slice(0,10).map(x=>({timestamp:x.t,niftyLtp:x.ltp,overallSent:x.sent,pcr:x.pcr}))));
console.log('short input ->', tooShort.ok ? 'UNEXPECTED ok' : 'correctly refused: ' + tooShort.reason);
console.log('empty input ->', (()=>{const z=forecast([]);return z.ok?'UNEXPECTED ok':'correctly refused';})());
