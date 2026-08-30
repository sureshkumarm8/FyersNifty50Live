import { loadSessions } from './data.mjs';
import { buildLabelledSeries, buildFeatureSeries } from '../services/predictionModel.ts';
import { marketMemory, EXCLUSION_MINUTES } from '../services/marketMemory.ts';

const S = loadSessions();
const rows = S.flatMap(s => s.rows.map(x => ({ t: x.t, ltp: x.ltp, sent: x.sent, pcr: x.pcr })));
console.time('build');
const labelled = buildLabelledSeries(rows);
console.timeEnd('build');
console.log('labelled points:', labelled.length);

// Query = a point from the most recent session.
const last = S[S.length - 1];
const qrows = last.rows.map(x => ({ t: x.t, ltp: x.ltp, sent: x.sent, pcr: x.pcr }));
const qseries = buildFeatureSeries(qrows);
const query = qseries[Math.floor(qseries.length * 0.6)];
console.log('query moment:', new Date(query.t).toISOString(), 'ltp', query.ltp.toFixed(1));

console.time('search');
const res = marketMemory.search(query, labelled, 25);
console.timeEnd('search');
if (!res.ok) { console.log('FAIL:', res.reason); process.exit(1); }

console.log(`\nsearched ${res.searched} archived moments`);
console.log('\nTop 5 analogues:');
res.analogues.slice(0,5).forEach(a =>
  console.log(`  ${a.label}  sim=${(a.similarity*100).toFixed(0)}%  d=${a.distance.toFixed(2)}  ltp=${a.ltp.toFixed(0)}  +30m=${(a.forward[30]??NaN).toFixed(1)}`));

console.log('\nOutcome distribution vs base rate:');
console.log('H    n   median    p25     p75   probUp  baseUp   edge     z    signif');
for (const o of res.outcomes) {
  console.log(String(o.horizon).padEnd(4), String(o.samples).padStart(3),
    o.median.toFixed(1).padStart(8), o.p25.toFixed(1).padStart(7), o.p75.toFixed(1).padStart(7),
    (o.probUp*100).toFixed(0).padStart(7)+'%', (o.baseProbUp*100).toFixed(0).padStart(6)+'%',
    o.edgePts.toFixed(1).padStart(6), o.z.toFixed(2).padStart(6), String(o.significant).padStart(8));
}
console.log('\nverdict:', res.verdict);

// Leakage guard: no analogue may come from within the exclusion window.
const leak = res.analogues.filter(a => Math.abs(a.t - query.t) <= EXCLUSION_MINUTES*60000);
console.log(`\nleakage check: ${leak.length} analogues inside ±${EXCLUSION_MINUTES}min ->`, leak.length===0?'PASS':'FAIL');

// Sanity: analogues must genuinely be closer than random draws.
const rnd = Array.from({length:25},()=>labelled[Math.floor(Math.random()*labelled.length)]);
const w = query.z;
const dist = p => Math.sqrt(p.z.reduce((s,v,j)=>s+(v-w[j])**2,0));
const avgTop = res.analogues.reduce((s,a)=>s+a.distance,0)/res.analogues.length;
const avgRnd = rnd.reduce((s,p)=>s+dist(p),0)/rnd.length;
console.log(`mean distance: analogues ${avgTop.toFixed(2)} vs random ${avgRnd.toFixed(2)} ->`, avgTop < avgRnd*0.6 ? 'PASS' : 'FAIL');
// Independence: no two selected analogues may be from the same episode.
import('../services/marketMemory.ts').then(({MIN_SEPARATION_MINUTES})=>{
  const ts=res.analogues.map(a=>a.t).sort((a,b)=>a-b);
  let tooClose=0;
  for(let i=1;i<ts.length;i++) if(ts[i]-ts[i-1] < MIN_SEPARATION_MINUTES*60000) tooClose++;
  console.log(`independence: ${tooClose} pairs closer than ${MIN_SEPARATION_MINUTES}min ->`, tooClose===0?'PASS':'FAIL');
  const days=new Set(res.analogues.map(a=>a.label.slice(0,10)));
  console.log(`diversity: ${res.analogues.length} analogues span ${days.size} distinct days`);
  process.exit((leak.length===0 && avgTop < avgRnd*0.6 && tooClose===0) ? 0 : 1);
});
