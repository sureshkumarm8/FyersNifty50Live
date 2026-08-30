import fs from 'fs'; import path from 'path';
const DIR='/Users/SureshKumar.M/Downloads/nifty_sentiment_momentum_csvFiles';
const parseCsv=(t)=>{const L=t.split(/\r?\n/).filter(x=>x.trim());const h=L[0].split(',').map(s=>s.trim());
 return L.slice(1).map(l=>{const c=l.match(/("([^"]*)")|([^,]+)/g)||[];const o={};h.forEach((k,i)=>o[k]=(c[i]||'').replace(/^"|"$/g,''));return o;});};
const files=fs.readdirSync(DIR).filter(f=>f.endsWith('.csv'));
const by=new Map();
for(const f of files){const m=f.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);if(!m)continue;
 const rows=parseCsv(fs.readFileSync(path.join(DIR,f),'utf8'));const p=by.get(m[2]);if(!p||rows.length>p.length)by.set(m[2],rows);}

let zeroLtp=0,tot=0,zeroPcr=0,pcrHi=0;
const badSessions=[];
for(const [d,rows] of by){
  let z=0;
  for(const r of rows){tot++;const v=+r.niftyLTP;if(!(v>1000)){z++;zeroLtp++;}
    const p=+r.pcr; if(!(p>0))zeroPcr++; if(p>3)pcrHi++;}
  if(z)badSessions.push(`${d}:${z}/${rows.length}`);
}
console.log('rows with niftyLTP<=1000:',zeroLtp,'of',tot);
console.log('sessions containing them:',badSessions.join('  ')||'none');
console.log('pcr<=0:',zeroPcr,' pcr>3:',pcrHi);

// Where do bad LTP rows sit? show a sample window
for(const [d,rows] of by){
  const i=rows.findIndex(r=>!(+r.niftyLTP>1000));
  if(i>=0){console.log(`\nsample bad window session ${d} idx ${i}:`);
    rows.slice(Math.max(0,i-2),i+4).forEach((r,k)=>console.log(' ',r.time,'ltp=',r.niftyLTP,'sent=',(+r.sentiment).toFixed(1),'pcr=',(+r.pcr).toFixed(3),'mom=',r.momentum));
    break;}
}
// True 1-bar return distribution after cleaning
const rets=[];
for(const [,rows] of by){
  const cl=rows.filter(r=>+r.niftyLTP>1000).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  for(let i=1;i<cl.length;i++){const r=(+cl[i].niftyLTP/+cl[i-1].niftyLTP-1)*10000; if(Math.abs(r)<500)rets.push(r);}
}
rets.sort((a,b)=>a-b);
const q=p=>rets[Math.floor(p*rets.length)].toFixed(2);
const mean=rets.reduce((a,b)=>a+b,0)/rets.length;
const sd=Math.sqrt(rets.reduce((a,b)=>a+(b-mean)**2,0)/rets.length);
console.log('\n1-bar returns (bps): n=',rets.length,'mean',mean.toFixed(3),'sd',sd.toFixed(2));
console.log('p01',q(.01),'p10',q(.10),'p50',q(.50),'p90',q(.90),'p99',q(.99));
// autocorrelation of 1-bar returns -> is there momentum at all?
