import { loadSessions, mean, sd } from './data.mjs';
const S = loadSessions();
console.log('sessions', S.length, 'rows', S.reduce((a, s) => a + s.rows.length, 0));

const corr = (x, y) => {
  const mx = mean(x), my = mean(y);
  let n = 0, dx = 0, dy = 0;
  for (let i = 0; i < x.length; i++) { n += (x[i]-mx)*(y[i]-my); dx += (x[i]-mx)**2; dy += (y[i]-my)**2; }
  return n / Math.sqrt(dx*dy || 1);
};
// Information coefficient: correlation between a signal at t and forward return.
const build = (H) => {
  const f = { pastRet5: [], pastRet15: [], sent: [], sentSlope: [], pcrChg: [], vol10: [], fwd: [] };
  for (const s of S) {
    const r = s.rows;
    for (let i = 30; i + H < r.length; i++) {
      const p = r[i].ltp;
      const rets = []; for (let k = i-9; k <= i; k++) rets.push(Math.log(r[k].ltp / r[k-1].ltp));
      f.pastRet5.push(Math.log(p / r[i-5].ltp) * 1e4);
      f.pastRet15.push(Math.log(p / r[i-15].ltp) * 1e4);
      f.sent.push(r[i].sent);
      f.sentSlope.push(r[i].sent - mean(r.slice(i-5, i).map(x => x.sent)));
      f.pcrChg.push(r[i].pcr - mean(r.slice(i-15, i).map(x => x.pcr)));
      f.vol10.push(sd(rets) * 1e4);
      f.fwd.push(Math.log(r[i+H].ltp / p) * 1e4);
    }
  }
  return f;
};
console.log('\nInformation coefficient vs forward return (all data, in-sample upper bound)');
console.log('H(min) n      pastRet5 pastRet15   sent  sentSlope  pcrChg   vol10   fwdSD(bps)');
for (const H of [5, 10, 15, 30]) {
  const f = build(H);
  const row = ['pastRet5','pastRet15','sent','sentSlope','pcrChg','vol10']
    .map(k => corr(f[k], f.fwd).toFixed(3).padStart(8)).join(' ');
  console.log(String(H).padEnd(6), String(f.fwd.length).padEnd(6), row, sd(f.fwd).toFixed(1).padStart(9));
}
// Is volatility predictable? (the usual real edge)
const f = build(10);
const absFwd = f.fwd.map(Math.abs);
console.log('\nVolatility predictability: corr(vol10, |fwdRet10|) =', corr(f.vol10, absFwd).toFixed(3));
console.log('Sentiment |level| vs |fwd|:', corr(f.sent.map(Math.abs), absFwd).toFixed(3));
