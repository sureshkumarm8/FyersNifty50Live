/**
 * Does a backfilled early-session forecast actually work?
 *
 * The band is the model's one validated asset (78-81% coverage). If seeding the
 * warm-up from the previous session degrades that, the feature is not worth
 * having and the honest answer is to keep making the user wait. This measures
 * coverage at each live-bar count against the cold-start baseline.
 */
import { loadSessions } from './data.mjs';
import { forecast, prepareRows, isForecastFailure, MIN_BARS, MIN_LIVE_BARS } from '../services/predictionModel.ts';

const S = loadSessions();
const toRows = s => s.rows.filter(r => r.ltp > 0).map(x => ({ t: x.t, ltp: x.ltp, sent: x.sent, pcr: x.pcr }));

const LIVE_COUNTS = [5, 8, 12, 20, 31];
const HORIZ = [5, 15, 30];
const tally = {};           // key: `${liveBars}|${h}` -> {in, n}
const bump = (k, ok) => { (tally[k] ??= { in: 0, n: 0 }); tally[k].n++; if (ok) tally[k].in++; };

let attempted = 0, produced = 0;

for (let si = 1; si < S.length; si++) {
  const prior = toRows(S[si - 1]);
  const today = toRows(S[si]);
  if (today.length < 70 || prior.length < MIN_BARS) continue;

  for (const lb of LIVE_COUNTS) {
    const live = today.slice(0, lb);
    attempted++;
    const f = forecast(live, prior);
    if (isForecastFailure(f)) continue;
    produced++;
    const spotIdx = lb - 1;
    for (const h of HORIZ) {
      const fut = today[spotIdx + h];
      if (!fut) continue;
      const hz = f.horizons.find(x => x.minutes === h);
      if (!hz) continue;
      bump(`${lb}|${h}`, fut.ltp >= hz.low && fut.ltp <= hz.high);
    }
  }

  // Cold-start baseline: full warm-up, no borrowing.
  const live = today.slice(0, MIN_BARS);
  const f = forecast(live);
  if (!isForecastFailure(f)) {
    for (const h of HORIZ) {
      const fut = today[MIN_BARS - 1 + h];
      if (!fut) continue;
      const hz = f.horizons.find(x => x.minutes === h);
      if (hz) bump(`cold|${h}`, fut.ltp >= hz.low && fut.ltp <= hz.high);
    }
  }
}

console.log(`forecasts produced: ${produced}/${attempted} attempts\n`);
console.log('80% band coverage by amount of REAL live data (target 80%):');
console.log('live bars |   5m    |  15m    |  30m');
for (const lb of [...LIVE_COUNTS, 'cold']) {
  const cells = HORIZ.map(h => {
    const t = tally[`${lb}|${h}`];
    return t && t.n ? `${(100 * t.in / t.n).toFixed(0)}% (${t.n})`.padStart(9) : '     —   ';
  });
  const label = lb === 'cold' ? `cold ${MIN_BARS}` : String(lb);
  console.log(label.padEnd(10), cells.join(''));
}

// A backfilled reading must not be dramatically worse than the cold start.
let fail = 0;
for (const h of HORIZ) {
  const warm = tally[`5|${h}`], cold = tally[`cold|${h}`];
  if (!warm || !cold || !warm.n || !cold.n) continue;
  const wc = warm.in / warm.n, cc = cold.in / cold.n;
  const ok = wc >= 0.65 && wc <= 0.95;
  console.log(`\n  ${h}m: 5-bar backfilled coverage ${(wc*100).toFixed(0)}% vs cold ${(cc*100).toFixed(0)}% -> ${ok?'ACCEPTABLE':'DEGRADED'}`);
  if (!ok) fail++;
}

// prepareRows must never fabricate an overnight gap into the seed.
const prior = toRows(S[0]), today = toRows(S[1]).slice(0, 6);
const prep = prepareRows(today, prior);
const seam = prep.rows[prep.backfilledBars - 1];
const firstLive = prep.rows[prep.backfilledBars];
const seamJump = Math.abs(firstLive.ltp - seam.ltp);
console.log(`\nseed length ${prep.backfilledBars}, live ${prep.liveBars}, seam jump ${seamJump.toFixed(2)} pts -> ${seamJump < 1 ? 'PASS (level-aligned)' : 'FAIL (gap injected)'}`);
if (seamJump >= 1) fail++;

// The seed itself must be exact 1-minute bars, and the seam must be small
// enough that contiguousRuns keeps the seed and the session as one run —
// live snapshots are not perfectly spaced, so only these two things matter.
const seedRows = prep.rows.slice(0, prep.backfilledBars);
const seedSpaced = seedRows.every((r, i) => i === 0 || r.t - seedRows[i-1].t === 60000);
const seamGapMin = (prep.rows[prep.backfilledBars].t - seedRows[seedRows.length-1].t) / 60000;
console.log(`seed bars are 1-minute spaced -> ${seedSpaced ? 'PASS' : 'FAIL'}`);
console.log(`seam gap ${seamGapMin.toFixed(1)} min (must be <= 20 to stay one run) -> ${seamGapMin <= 20 ? 'PASS' : 'FAIL'}`);
if (!seedSpaced || seamGapMin > 20) fail++;

// The seeded reading must be honestly labelled.
const fchk = forecast(today, prior);
if (!isForecastFailure(fchk)) {
  console.log(`labelled backfilled=${fchk.backfilled}, liveBars=${fchk.liveBars}, bandMultiplier=${fchk.warmupMultiplier.toFixed(2)} -> ${fchk.backfilled && fchk.warmupMultiplier > 1 ? 'PASS' : 'FAIL'}`);
  if (!(fchk.backfilled && fchk.warmupMultiplier > 1)) fail++;
}

// A reading must never be produced from seed alone.
const tooEarly = forecast(today.slice(0, 2), prior);
console.log(`refuses with only 2 live bars -> ${isForecastFailure(tooEarly) ? 'PASS' : 'FAIL'}`);
if (!isForecastFailure(tooEarly)) fail++;

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${fail} problem(s)`);
process.exit(fail ? 1 : 0);
