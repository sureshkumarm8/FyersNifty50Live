import { loadSessions, mean } from './data.mjs';
import { buildFeatures, toVector, WARMUP } from './features.mjs';
import { standardize, applyScale, ridgeFit, predict } from './ridge.mjs';
const HOR=[5,10,15,20,25,30];
const S=loadSessions();
function samp(s){const r=s.rows,o=[];for(let i=WARMUP;i+30<r.length;i++){const f=buildFeatures(r,i);if(!f)continue;
 const x=toVector(f);if(x.some(v=>!Number.isFinite(v)))continue;const y={};
 for(const h of HOR)y[h]={ret:Math.log(r[i+h].ltp/r[i].ltp)*1e4,sent:r[i+h].sent-r[i].sent,pcr:r[i+h].pcr-r[i].pcr};
 o.push({x,y});}return o;}
const data=S.map(samp).filter(r=>r.length>20);
const oos={};for(const h of HOR)oos[h]=[];
for(let cut=20;cut<data.length;cut++){
  const tr=data.slice(0,cut).flat(),te=data[cut];
  const X=tr.map(s=>s.x);const{mu,sg}=standardize(X);const Xs=X.map(r=>applyScale(r,mu,sg));
  for(const h of HOR){
    for(const a of [3000]){}
    const models={};
    for(const alpha of [300,3000,30000]) models[alpha]=ridgeFit(Xs,tr.map(s=>s.y[h].ret),alpha);
    const mS=ridgeFit(Xs,tr.map(s=>Math.log(Math.abs(s.y[h].ret)+0.5)),200);
    for(const s of te){const xs=applyScale(s.x,mu,sg);
      oos[h].push({d300:predict(models[300],xs),d3k:predict(models[3000],xs),d30k:predict(models[30000],xs),
        sig:Math.exp(predict(mS,xs)),aRet:s.y[h].ret});}
  }
}
const rmse=a=>Math.sqrt(mean(a));
console.log('DRIFT SHRINKAGE SWEEP — OOS RMSE (bps). shrink=0 means "predict no move".');
console.log('H     zero    a=300   a=3000  a=30000   best-shrink(a=3000)');
for(const h of HOR){const o=oos[h];
  let best=null;
  for(let k=0;k<=1.001;k+=0.05){const e=rmse(o.map(s=>(s.aRet-k*s.d3k)**2));if(!best||e<best.e)best={k,e};}
  console.log(String(h).padEnd(5),rmse(o.map(s=>s.aRet**2)).toFixed(3).padStart(7),
    rmse(o.map(s=>(s.aRet-s.d300)**2)).toFixed(3).padStart(8),
    rmse(o.map(s=>(s.aRet-s.d3k)**2)).toFixed(3).padStart(8),
    rmse(o.map(s=>(s.aRet-s.d30k)**2)).toFixed(3).padStart(8),
    `  k=${best.k.toFixed(2)} rmse=${best.e.toFixed(3)}`);
}
console.log('\nSIGMA CALIBRATION — multiplier so that 80% band covers 80%, then conditional check');
console.log('H    mult  cov80  | coverage by predicted-vol quintile (model)      | (constant band)');
for(const h of HOR){const o=oos[h];
  let lo=0.5,hi=6;
  for(let it=0;it<60;it++){const m=(lo+hi)/2;
    const c=mean(o.map(s=>Math.abs(s.aRet)<=1.2816*m*s.sig?1:0));c<0.8?lo=m:hi=m;}
  const mult=(lo+hi)/2;
  const gs=(()=>{let l=0.5,hgh=60;for(let it=0;it<60;it++){const m=(l+hgh)/2;
    const c=mean(o.map(s=>Math.abs(s.aRet)<=1.2816*m?1:0));c<0.8?l=m:hgh=m;}return (l+hgh)/2;})();
  const srt=[...o].sort((a,b)=>a.sig-b.sig);const n=srt.length;
  const qs=[],qc=[];
  for(let q=0;q<5;q++){const part=srt.slice(Math.floor(q*n/5),Math.floor((q+1)*n/5));
    qs.push((100*mean(part.map(s=>Math.abs(s.aRet)<=1.2816*mult*s.sig?1:0))).toFixed(0));
    qc.push((100*mean(part.map(s=>Math.abs(s.aRet)<=1.2816*gs?1:0))).toFixed(0));}
  console.log(String(h).padEnd(4),mult.toFixed(2).padStart(5),'  80%  |',qs.map(x=>(x+'%').padStart(5)).join(' '),'|',qc.map(x=>(x+'%').padStart(5)).join(' '));
}
