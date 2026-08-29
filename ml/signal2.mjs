import { loadSessions, mean, sd } from './data.mjs';
const S = loadSessions();
// How predictable are sentiment and pcr themselves? (persistence vs mean reversion)
console.log('H(min)  sent: R2_persist  R2_revert |  pcr: R2_persist  R2_revert');
for (const H of [5, 10, 15, 30]) {
  const a = { sp: [], sr: [], st: [], pp: [], pr: [], pt: [] };
  for (const s of S) { const r = s.rows;
    for (let i = 30; i + H < r.length; i++) {
      a.sp.push(r[i].sent); a.sr.push(mean(r.slice(i-15,i+1).map(x=>x.sent))); a.st.push(r[i+H].sent);
      a.pp.push(r[i].pcr);  a.pr.push(mean(r.slice(i-15,i+1).map(x=>x.pcr)));  a.pt.push(r[i+H].pcr);
    }}
  const r2 = (pred, act) => { const m = mean(act);
    const ss = act.reduce((s,y,i)=>s+(y-pred[i])**2,0), tt = act.reduce((s,y)=>s+(y-m)**2,0); return 1-ss/tt; };
  console.log(String(H).padEnd(7), r2(a.sp,a.st).toFixed(3).padStart(13), r2(a.sr,a.st).toFixed(3).padStart(10),
    '|', r2(a.pp,a.pt).toFixed(3).padStart(15), r2(a.pr,a.pt).toFixed(3).padStart(10));
}
// Time-of-day volatility seasonality
console.log('\nTime-of-day 1-bar vol (bps):');
const buckets = new Map();
for (const s of S) { const r = s.rows;
  for (let i=1;i<r.length;i++){ const b = Math.floor(r[i].mod/30);
    if(!buckets.has(b)) buckets.set(b,[]); buckets.get(b).push(Math.log(r[i].ltp/r[i-1].ltp)*1e4); }}
[...buckets.entries()].sort((a,b)=>a[0]-b[0]).forEach(([b,v])=>{
  const hh=String(Math.floor((b*30+555)/60)).padStart(2,'0'), mm=String((b*30+555)%60).padStart(2,'0');
  if(v.length>50) console.log(` ${hh}:${mm}  sd=${sd(v).toFixed(2)}  n=${v.length}`);});
