import { loadSessions } from './data.mjs';
import { forecast, toModelRows, contiguousRuns, MIN_BARS } from '../services/predictionModel.ts';

const S = loadSessions();
const asSnap = x => ({ time: x.time, timestamp: x.t, niftyLtp: x.ltp, overallSent: x.sent, pcr: x.pcr });
let pass = 0, fail = 0;
const check = (name, cond, extra='') => { if (cond) { pass++; console.log(`  ok  ${name} ${extra}`); } else { fail++; console.log(`  FAIL ${name} ${extra}`); } };

// 1. Reproduce the reported bug: many days flattened together (654 rows spread thin).
console.log('multi-day archive, ~15 rows per day across 44 days:');
const thin = S.flatMap(s => s.rows.filter((_, i) => i % 25 === 0).slice(0, 15).map(asSnap));
const thinRows = toModelRows(thin);
const thinRes = forecast(thinRows);
check('total rows are plentiful', thinRows.length > 400, `(${thinRows.length} rows)`);
check('runs are detected per day', contiguousRuns(thinRows).length > 20, `(${contiguousRuns(thinRows).length} runs)`);
check("refuses sparse data instead of inventing a flat band", !thinRes.ok && /sparsely sampled/.test(thinRes.reason), `-> "${thinRes.ok ? "FORECAST ANYWAY" : thinRes.reason}"`);

// 2. The real fix: months of archive containing full sessions must now forecast.
console.log('\nmulti-day archive containing full sessions (the reported case):');
const full = S.flatMap(s => s.rows.map(asSnap));
const fullRes = forecast(toModelRows(full));
check('forecasts successfully', fullRes.ok, fullRes.ok ? `(${fullRes.bars} bars used)` : `-> ${fullRes.reason}`);
if (fullRes.ok) {
  const last = S[S.length-1].rows;
  check('uses the MOST RECENT session', Math.abs(fullRes.horizons[0].niftyLtp - last[last.length-1].ltp) < 60,
    `(anchor ${fullRes.horizons[0].niftyLtp.toFixed(0)} vs last close ${last[last.length-1].ltp})`);
  check('bars <= one session', fullRes.bars < 500, `(${fullRes.bars})`);
}

// 3. Snapshots with NO timestamp must be anchored by the archive's date.
console.log('\nsnapshots carrying only "HH:MM:SS", anchored per archive date:');
const noTs = S.slice(-3).map(s => toModelRows(s.rows.map(x => ({ time: x.time, niftyLtp: x.ltp, overallSent: x.sent, pcr: x.pcr })), s.date));
const anchored = noTs.flat();
check('3 days -> 3 distinct runs', contiguousRuns(anchored).length === 3, `(${contiguousRuns(anchored).length})`);
const aRes = forecast(anchored);
check('forecasts from anchored rows', aRes.ok, aRes.ok ? `(${aRes.bars} bars)` : `-> ${aRes.reason}`);
const unanchored = S.slice(-3).map(s => toModelRows(s.rows.map(x => ({ time: x.time, niftyLtp: x.ltp, overallSent: x.sent, pcr: x.pcr })))).flat();
check('without a date all days collapse into 1 run (why anchoring matters)', contiguousRuns(unanchored).length === 1, `(${contiguousRuns(unanchored).length})`);

// 4. A single clean session still works and matches the pre-fix behaviour.
const one = forecast(toModelRows(S[S.length-1].rows.map(asSnap)));
console.log('\nsingle session:');
check('forecasts', one.ok, one.ok ? `(${one.bars} bars, band ±${one.horizons[5].bandPts.toFixed(1)})` : `-> ${one.reason}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
