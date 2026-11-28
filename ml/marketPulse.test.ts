/** Market Pulse on the real 27-Nov open (30s ticks with OI ladder) and on synthetic breadth. */
import fs from 'node:fs';
import { buildPulse, readFlow, strikeFlows } from '../services/marketPulse';
import { createCopilot } from '../ops/copilot.mjs';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const ist = (hms: string) => Date.parse(`2026-11-27T${hms}+05:30`);
const ticks = fs.readFileSync(new URL('./fixtures/ticks-2026-11-27-open.jsonl', import.meta.url), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));

check('flow read: puts written + calls covered = BULLISH', readFlow(6, -4) === 'BULLISH');
check('flow read: calls written + puts covered = BEARISH', readFlow(-3, 8) === 'BEARISH');
check('flow read: both writing = RANGE, both covering = UNWINDING, small = QUIET', readFlow(5, 5) === 'RANGE' && readFlow(-5, -5) === 'UNWINDING' && readFlow(1, -1) === 'QUIET');
check('strike flows in lakhs', strikeFlows('25800:62.3/75.4', '25800:60.0/70.0', 25810)[0].changeL === 2.3);

const p = buildPulse(ticks, ist('09:36:00'))!;
check('09:36: +47 pts in 5 min', p.move5 !== null && Math.abs(p.move5 - 47.2) < 0.5, String(p.move5));
check('09:36: call writers adding into the rally (bearish flow)', p.flow === 'BEARISH' && (p.callsAboveL ?? 0) > 20, `${p.flow} ${p.callsAboveL}`);
check('09:36: biggest 5m strikes are calls at 25850/26000', p.top5m.slice(0, 2).every(f => f.side === 'CE') && p.top5m.some(f => f.strike === 26000), JSON.stringify(p.top5m.slice(0, 2)));
check('headline reads as one line', /pts 1m/.test(p.headline) && /bearish flow/.test(p.headline), p.headline);

// breadth, PCR and drivers when the app sends them
const syn = [
  { t: ist('10:00:00'), spot: 25800, adv: 20, dec: 30, pcr: 0.8, sent: -10, movers: [{ s: 'NSE:HDFCBANK', w: 13, m1: 0, day: -0.5 }] },
  { t: ist('10:04:00'), spot: 25810, adv: 24, dec: 26, pcr: 0.82, sent: 0, movers: [{ s: 'NSE:HDFCBANK', w: 13, m1: 0, day: -0.4 }] },
  { t: ist('10:05:00'), spot: 25830, adv: 28, dec: 22, pcr: 0.85, sent: 12, movers: [{ s: 'NSE:HDFCBANK', w: 13, m1: 0.3, day: -0.1 }, { s: 'NSE:RELIANCE', w: 9, m1: -0.1, day: 0.6 }] }
];
const q = buildPulse(syn, ist('10:05:30'))!;
check('breadth now and its 5-min change', q.adv === 28 && q.advChange5 === 8, `${q.adv} ${q.advChange5}`);
check('PCR change', q.pcr === 0.85 && q.pcrChange5 === 0.05);
check('heavyweights moving Nifty now (index points)', q.drivers1m[0].s === 'HDFCBANK' && Math.abs(q.drivers1m[0].pts - 10.1) < 0.2, JSON.stringify(q.drivers1m));
check('lines include drivers and sentiment change', q.lines.some(l => /Moving Nifty now: HDFCBANK/.test(l)) && q.lines.some(l => /Sentiment 12% \(\+22 in 5m\)/.test(l)), q.lines.join(' | '));

// the co-pilot builds one pulse per completed minute
let clock = ticks[0].t;
const cp = createCopilot({ now: () => clock, journal: (() => ({})) as any, read: (() => []) as any, writeFile: (() => '') as any });
for (const t of ticks) { clock = t.t + 3_000; cp.onState({ market: { spot: t.spot, quoteAt: t.t, oiLadder: t.oiLadder, quoteAgeSec: 3 } }); }
const st = cp.status();
check('co-pilot keeps per-minute pulses', st.pulses.length >= 20 && st.pulse?.headline, `${st.pulses.length}`);
if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall market pulse checks passed');
