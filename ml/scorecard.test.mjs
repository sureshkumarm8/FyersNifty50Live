/**
 * Replays a real archived session, fabricates agent calls at known moments and
 * checks that grading, Wilson bounds and calibration behave.
 *
 * The scorecard normally persists via IndexedDB, which does not exist in Node,
 * so the pure aggregation functions are exercised directly against calls that
 * were graded by hand from the archive.
 */
import { loadSessions } from './data.mjs';
import { agentScorecard, GRADING_HORIZONS } from '../services/agentScorecard.ts';
import { calibrationReport, isCalibrationFailure } from '../services/calibrationMonitor.ts';

const S = loadSessions();
// Several sessions, because a single day yields too few decisive calls to
// clear the 20-call threshold the scorecard rightly insists on.
const used = S.slice(-6);
const bars = used.flatMap(x => x.rows.filter(r => r.ltp > 0)).sort((a, b) => a.t - b.t);
console.log(`replaying ${used.length} sessions — ${bars.length} bars`);

const levelAt = t => { let best=null; for(const b of bars){const d=Math.abs(b.t-t); if(!best||d<best.d) best={d,ltp:b.ltp};} return best && best.d<=3*60000 ? best.ltp : null; };
const verdict = (action, move) => { const NB=8; if(Math.abs(move)<NB) return 'flat'; if(action==='BUY') return move>0?'win':'loss'; if(action==='SELL') return move<0?'win':'loss'; return Math.abs(move)<NB?'win':'loss'; };

// Three synthetic agents with deliberately different skill.
const mk = (agent, pick, conf) => {
  const calls=[];
  for (let i=30;i<bars.length-40;i+=5){
    const b=bars[i];
    const action=pick(bars,i);
    const c={id:`${agent}-${i}`,agent,timestamp:b.t,action,claimedConfidence:conf,reasoning:[],ltp:b.ltp,sent:b.sent,pcr:b.pcr,outcomes:{},verdicts:{},graded:0};
    for(const h of GRADING_HORIZONS){
      const lvl=levelAt(b.t+h*60000); if(lvl===null) continue;
      const mv=lvl-b.ltp; c.outcomes[h]=mv; c.verdicts[h]=verdict(action,mv);
    }
    c.graded = GRADING_HORIZONS.every(h=>c.verdicts[h])?1:0;
    calls.push(c);
  }
  return calls;
};

// An oracle that peeks 15 min ahead must grade as an edge.
const oracle = mk('Oracle',(bs,i)=>{ const f=bs[Math.min(i+15,bs.length-1)]; return f.ltp>bs[i].ltp?'BUY':'SELL'; },90);
// A coin flip must not.
let seed=42; const rnd=()=>{seed=(seed*1103515245+12345)%2147483648; return seed/2147483648;};
const coin = mk('CoinFlip',()=>rnd()>0.5?'BUY':'SELL',75);
// An inverted oracle must grade as harmful.
const anti = mk('Contrarian',(bs,i)=>{ const f=bs[Math.min(i+15,bs.length-1)]; return f.ltp>bs[i].ltp?'SELL':'BUY'; },80);

const all=[...oracle,...coin,...anti];
const stats=agentScorecard.stats(all,15);
console.log('\nagent        decisive  hit   95% range      expectancy  grade');
for(const s of stats){
  console.log(s.agent.padEnd(12), String(s.decisiveCalls).padStart(7),
    (s.hitRate===null?'—':(s.hitRate*100).toFixed(0)+'%').padStart(6),
    (s.hitRateLow===null?'—':`${(s.hitRateLow*100).toFixed(0)}-${(s.hitRateHigh*100).toFixed(0)}%`).padStart(11),
    (s.expectancy===null?'—':s.expectancy.toFixed(2)+' pts').padStart(12), '  '+s.grade);
}

const g=n=>stats.find(s=>s.agent===n);
const checks=[
  ['oracle is graded as an edge', g('Oracle').grade==='edge'],
  ['contrarian is graded harmful', g('Contrarian').grade==='harmful'],
  ['coin flip is not credited with an edge', g('CoinFlip').grade!=='edge'],
  ['oracle expectancy is positive', g('Oracle').expectancy>0],
  ['contrarian expectancy is negative', g('Contrarian').expectancy<0],
  ['wilson lower bound never exceeds hit rate', stats.every(s=>s.hitRateLow===null||s.hitRateLow<=s.hitRate+1e-9)],
  ['wilson upper bound never below hit rate', stats.every(s=>s.hitRateHigh===null||s.hitRateHigh>=s.hitRate-1e-9)],
];

const cal=calibrationReport(all,15);
if(isCalibrationFailure(cal)){ console.log('\ncalibration:',cal.reason); checks.push(['calibration produced a report',false]); }
else{
  console.log(`\ncalibration: brier ${cal.brier.toFixed(3)} vs baseline ${cal.brierBaseline.toFixed(3)}, overconfidence ${cal.overconfidence.toFixed(1)} pts`);
  console.log('  ', cal.verdict);
  checks.push(['calibration flags the mixed book as overconfident', cal.overconfidence>0]);
  checks.push(['brier is a valid probability score', cal.brier>=0 && cal.brier<=1]);
}

console.log();
let fail=0;
for(const [name,ok] of checks){ console.log(`  ${ok?'ok ':'FAIL'}  ${name}`); if(!ok) fail++; }
console.log(`\n${checks.length-fail} passed, ${fail} failed`);
process.exit(fail?1:0);
