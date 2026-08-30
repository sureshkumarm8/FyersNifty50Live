import { loadSessions } from './data.mjs';
import { buildLabelledSeries, buildFeatureSeries } from '../services/predictionModel.ts';
import { regimeRadar, deriveThresholds, todBucketOf } from '../services/regimeRadar.ts';

const S = loadSessions();
const rows = S.flatMap(s => s.rows.map(x => ({ t:x.t, ltp:x.ltp, sent:x.sent, pcr:x.pcr })));
const H = buildLabelledSeries(rows);
const th = deriveThresholds(H);
console.log('derived thresholds: vol', th.vol.map(v=>v.toFixed(2)).join('/'), ' eff', th.eff.map(v=>v.toFixed(2)).join('/'));

// Occupancy across all 12 regimes, plus the forward stats each one claims.
const last = S[S.length-1];
const qs = buildFeatureSeries(last.rows.map(x=>({t:x.t,ltp:x.ltp,sent:x.sent,pcr:x.pcr})));
const seen = new Map();
for (const q of qs) {
  const r = regimeRadar.read(q, H);
  if (!r.ok) continue;
  const key = `${r.vol}|${r.trend}`;
  if (!seen.has(key)) seen.set(key, r);
}
console.log('\nregimes encountered in the latest session:');
console.log('regime                n(peers)  med|30m|  base   ratio   p80    probUp');
let fails=0;
for (const [k,r] of [...seen.entries()].sort()) {
  const s = r.stats[30];
  const ok = s.samples>50 && s.medAbsMove>=0 && s.p80AbsMove>=s.medAbsMove;
  if(!ok) fails++;
  console.log(k.padEnd(20), String(s.samples).padStart(7), s.medAbsMove.toFixed(1).padStart(8),
    s.baseMedAbsMove.toFixed(1).padStart(6), s.moveRatio.toFixed(2).padStart(7),
    s.p80AbsMove.toFixed(1).padStart(7), (s.probUp*100).toFixed(0).padStart(7)+'%', ok?'':'  <-- SUSPECT');
}

// The core claim: volatility state must actually order forward movement.
console.log('\nmonotonicity check — does vol state order 30m movement?');
const byVol = {calm:[],normal:[],active:[],violent:[]};
for (const p of H) {
  const v = p.vec[ (await import('../services/predictionModel.ts')).FEATURE_NAMES.indexOf('vol10') ];
  const st = v<th.vol[0]?'calm':v<th.vol[1]?'normal':v<th.vol[2]?'active':'violent';
  if (Number.isFinite(p.forward[30])) byVol[st].push(Math.abs(p.forward[30]));
}
const med = a => { const s=[...a].sort((x,y)=>x-y); return s.length?s[Math.floor(s.length/2)]:0; };
const meds = ['calm','normal','active','violent'].map(k=>({k,n:byVol[k].length,m:med(byVol[k])}));
meds.forEach(x=>console.log(`  ${x.k.padEnd(8)} n=${String(x.n).padStart(5)}  median |30m move| = ${x.m.toFixed(1)} pts`));
const mono = meds.every((x,i)=> i===0 || x.m >= meds[i-1].m);
console.log('monotonic ->', mono?'PASS':'FAIL');

// Time-of-day buckets must reproduce the J-curve found during model research.
console.log('\ntime-of-day |5m move| (the J-curve):');
const byTod={};
for (const p of H) if(Number.isFinite(p.forward[5])) (byTod[todBucketOf(p.t)] ??= []).push(Math.abs(p.forward[5]));
for (const b of ['open','morning','midday','afternoon','close'])
  if(byTod[b]) console.log(`  ${b.padEnd(10)} n=${String(byTod[b].length).padStart(5)}  ${med(byTod[b]).toFixed(2)} pts`);

process.exit(fails===0 && mono ? 0 : 1);
