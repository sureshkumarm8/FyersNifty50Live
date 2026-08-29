import fs from 'fs';
import path from 'path';
const DIR = '/Users/SureshKumar.M/Downloads/nifty_sentiment_momentum_csvFiles';

const parseCsv = (txt) => {
  const lines = txt.split(/\r?\n/).filter(l => l.trim());
  const head = lines[0].split(',').map(s => s.trim());
  return lines.slice(1).map(l => {
    const cells = l.match(/("([^"]*)")|([^,]+)/g) || [];
    const o = {};
    head.forEach((h, i) => { o[h] = (cells[i] || '').replace(/^"|"$/g, ''); });
    return o;
  });
};

// Dedup: same session date -> keep the file with the most rows.
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.csv'));
const bySession = new Map();
for (const f of files) {
  const m = f.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
  if (!m) { console.log('UNPARSED NAME:', f); continue; }
  const rows = parseCsv(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const key = m[2];
  const prev = bySession.get(key);
  if (!prev || rows.length > prev.rows.length) bySession.set(key, { file: f, rows });
}
const sessions = [...bySession.entries()].sort((a,b) => a[0] < b[0] ? -1 : 1);
console.log('unique sessions:', sessions.length);
console.log('total rows:', sessions.reduce((s,[,v]) => s + v.rows.length, 0));

const COLS = ['niftyLTP','change','changePercent','sentiment','pcr','callOI','putOI','vix','bullishStocks','bearishStocks','advanceDecline','momentum','cumulativeMomentum'];
const stats = {};
for (const c of COLS) stats[c] = { n:0, nonzero:0, nan:0, min:Infinity, max:-Infinity, sum:0 };
for (const [,{rows}] of sessions) for (const r of rows) for (const c of COLS) {
  const v = parseFloat(r[c]); const s = stats[c];
  s.n++;
  if (!Number.isFinite(v)) { s.nan++; continue; }
  if (v !== 0) s.nonzero++;
  s.min = Math.min(s.min, v); s.max = Math.max(s.max, v); s.sum += v;
}
console.log('\ncol            nonzero%   nan    min          max          mean');
for (const c of COLS) {
  const s = stats[c];
  console.log(c.padEnd(18), ((100*s.nonzero/s.n).toFixed(1)+'%').padStart(7), String(s.nan).padStart(6),
    String(s.min===Infinity?'-':s.min.toFixed(2)).padStart(12), String(s.max===-Infinity?'-':s.max.toFixed(2)).padStart(12),
    (s.sum/s.n).toFixed(3).padStart(12));
}

console.log('\nrows per session (first 8 / last 8):');
const rp = sessions.map(([d,v]) => `${d}:${v.rows.length}`);
console.log(rp.slice(0,8).join('  ')); console.log(rp.slice(-8).join('  '));

// Sampling cadence
const s0 = sessions[Math.floor(sessions.length/2)][1].rows;
const gaps = [];
for (let i=1;i<Math.min(60,s0.length);i++) gaps.push((new Date(s0[i].timestamp) - new Date(s0[i-1].timestamp))/1000);
gaps.sort((a,b)=>a-b);
console.log('\nmid-session cadence (sec): median', gaps[Math.floor(gaps.length/2)], 'min', gaps[0], 'max', gaps[gaps.length-1]);
console.log('session', sessions[Math.floor(sessions.length/2)][0], 'first time', s0[0].time, 'last time', s0[s0.length-1].time);
