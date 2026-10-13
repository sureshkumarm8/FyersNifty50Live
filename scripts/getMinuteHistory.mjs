import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Redis } from '@upstash/redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

async function run() {
  const index = await redis.zrange('snapshots:index', 0, -1);
  const keys = index.map(ts => 'snapshot:' + ts);
  if (keys.length === 0) {
    console.log('[]');
    return;
  }
  const pipeline = redis.pipeline();
  keys.forEach(k => pipeline.get(k));
  const results = await pipeline.exec();
  const rows = results
    .filter(Boolean)
    .map(r => typeof r === 'string' ? JSON.parse(r) : r)
    .filter(s => {
      const d = new Date(s.timestamp);
      const istStr = d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const ist = new Date(istStr);
      return (ist.getHours() * 60 + ist.getMinutes()) >= (9 * 60 + 17);
    })
    .sort((a,b) => b.timestamp - a.timestamp);

  const byMinute = new Map();
  rows.forEach(s => {
    const t = new Date(s.timestamp);
    const ist = new Date(t.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hh = String(ist.getHours()).padStart(2, '0');
    const mm = String(ist.getMinutes()).padStart(2, '0');
    const ss = String(ist.getSeconds()).padStart(2, '0');
    const mKey = `${hh}:${mm}:${ss}`;
    const minKey = `${hh}:${mm}`;
    if (!byMinute.has(minKey)) {
      byMinute.set(minKey, { ...s, formattedTime: mKey });
    }
  });

  const minuteRows = Array.from(byMinute.entries());
  const formatted = minuteRows.map(([minKey, s], idx, arr) => {
    const prev = arr[idx + 1] ? arr[idx + 1][1] : s;
    const ptsChg = (s.niftyLTP - prev.niftyLTP);
    const adv = s.stocks ? s.stocks.filter(x => x.ch > 0).length : 0;
    const dec = s.stocks ? s.stocks.filter(x => x.ch < 0).length : 0;
    
    let callsBuy = 0, callsSell = 0, putsBuy = 0, putsSell = 0;
    let callOI = 0, putOI = 0;
    (s.options || []).forEach(opt => {
      const sym = opt.symbol || '';
      const desc = opt.description || '';
      const isCall = sym.endsWith('CE') || sym.includes('-CE') || desc.includes(' CE');
      const buyQty = opt.total_buy_qty || 0;
      const sellQty = opt.total_sell_qty || 0;
      const oi = opt.oi || 0;
      if (isCall) {
        callsBuy += buyQty; callsSell += sellQty; callOI += oi;
      } else {
        putsBuy += buyQty; putsSell += sellQty; putOI += oi;
      }
    });

    const pcr = callOI > 0 ? (putOI / callOI) : (s.pcr || 0.85);
    const overallSent = (adv + dec > 0) ? Math.round(((adv - dec) / (adv + dec)) * 1000) / 10 : 0;

    return {
      time: s.formattedTime,
      niftyLtp: s.niftyLTP,
      ptsChg: Math.round(ptsChg * 10) / 10,
      overallSent: (overallSent >= 0 ? '+' : '') + overallSent.toFixed(1) + '%',
      advDec: `${adv} / ${dec}`,
      pcr: pcr.toFixed(2),
      callsBuySell: `${(callsBuy / 1000000).toFixed(2)}M / ${(callsSell / 1000000).toFixed(2)}M`,
      putsBuySell: `${(putsBuy / 1000000).toFixed(2)}M / ${(putsSell / 1000000).toFixed(2)}M`,
    };
  });

  console.log(JSON.stringify(formatted, null, 2));
}

run().catch(console.error);
