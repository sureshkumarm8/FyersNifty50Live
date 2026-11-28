/**
 * Nifty50Ops co-pilot replayed on the real 2026-11-27 open (30s ticks with OI ladder,
 * ml/fixtures/ticks-2026-11-27-open.jsonl). Journal, reads and files are in memory.
 */
import fs from 'node:fs';
import { createCopilot } from '../ops/copilot.mjs';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const ticks = fs.readFileSync(new URL('./fixtures/ticks-2026-11-27-open.jsonl', import.meta.url), 'utf8')
  .split('\n').filter(Boolean).map(l => JSON.parse(l));
const ist = (hms: string) => Date.parse(`2026-11-27T${hms}+05:30`);
const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

const rows: Record<string, any[]> = { manual: [], copilot: [], ticks: [], premarket: [] };
const files: Record<string, string> = {};
let clock = ticks[0].t;
const cp = createCopilot({
  now: () => clock,
  journal: ((stream: string, payload: any) => { (rows[stream] ||= []).push({ timestamp: clock, ...payload }); return {}; }) as any,
  read: ((stream: string) => rows[stream] ?? []) as any,
  writeFile: ((name: string, content: string) => { files[name] = content; return `/journal/${name}`; }) as any
});
const snap = (t: any, ageSec = 5) => ({ market: { spot: t.spot, quoteAt: t.t, oiLadder: t.oiLadder, quoteAgeSec: ageSec } });

// The user logs a LONG ticket at 09:32 (as on the Manual tab): stop 25795, target 25850.
let ticketLogged = false;
for (const t of ticks) {
  clock = t.t + 3_000;
  if (!ticketLogged && t.t >= ist('09:32:00')) {
    rows.manual.push({ timestamp: clock, event: 'TICKET', side: 'LONG', entry: 25820, stop: 25795, target: 25850 });
    ticketLogged = true;
  }
  cp.onState(snap(t));
}
const st = cp.status();
const titles = st.alerts.map((a: any) => `${a.time.slice(0, 5)} ${a.title}`);

check('records every tick to ticks.jsonl', rows.ticks.length === ticks.length, `${rows.ticks.length}`);
check('flags the 25850 wall failure around 09:24', titles.some((x: string) => /^09:2[3-5] Wall failed · 25850/.test(x)), titles.filter((x: string) => /failed/.test(x)).join(' | '));
const conf = rows.copilot.find((e: any) => e.event === 'SETUP' && e.stage === 'CONFIRMED' && e.side === 'LONG' && e.wall === 25800);
check('confirms the 25800 LONG at 09:31 (journalled)', conf && hhmm(conf.barAt) === '09:31', conf ? hhmm(conf.barAt) : 'none');
check('PAPER shadow entered on it and hit target', st.shadow?.side === 'LONG' && st.shadow.entryTime.startsWith('09:31') && st.shadow.result === 'TARGET' && st.shadow.points === 30,
  JSON.stringify(st.shadow));
check('shadow is journalled (entry + exit)', rows.copilot.filter(r => /^SHADOW_/.test(r.event)).length === 2);
check('watched trade: target alert fired', titles.some((x: string) => /Target reached/.test(x)));
check('no stop alert (25795 never broke)', !titles.some((x: string) => /stop level is hit/.test(x)));
check('walls are known at the end', Number.isFinite(st.walls?.floor) && Number.isFinite(st.walls?.ceiling), JSON.stringify(st.walls));

// Data alert: a stale quote during market hours.
clock = ist('10:20:00');
cp.onState({ market: { spot: 25800, quoteAt: ticks[ticks.length - 1].t, oiLadder: null, quoteAgeSec: 95 } });
check('stale price raises an in-app alert', cp.status().alerts.some((a: any) => a.title === 'Price is stale'));

// Morning zone check with a too-narrow plan (the 27-Nov 08:49 bug shape).
(async () => {
  clock = ist('09:21:00');
  rows.premarket.push({ expectedSupport: 25880, expectedResistance: 25900, chartCoverage: 3, chartsRead: ['DAILY_1Y', 'INTRADAY_1M'], provisional: true, headline: 'STAND ASIDE' });
  await cp.tickClock({ state: { stale: false, snapshot: {} }, premarketRows: rows.premarket });
  const zone = cp.status().alerts.find((a: any) => a.title === 'Pre-market plan needs a look');
  check('zone check catches a 20-pt zone with the OI chart unread', !!zone && /20 pts/.test(zone.message) && /OI chart was not read/.test(zone.message), zone?.message);

  clock = ist('15:41:00');
  await cp.tickClock({ state: null, premarketRows: rows.premarket });
  const eod = files['copilot-eod.md'] || '';
  check('EOD report written with shadow and replay sections', /PAPER shadow/.test(eod) && /TARGET \+30 pts/.test(eod) && /Every confirmed setup/.test(eod));
  check('EOD only once per day', (await cp.tickClock({ state: null, premarketRows: rows.premarket }), cp.status().alerts.filter((a: any) => a.kind === 'eod').length === 1));

  // Self-healing charts: none on disk by 08:56 -> exactly one guarded re-pull.
  {
    let pulls = 0;
    const cp2 = createCopilot({ now: () => ist('08:56:00'), journal: (() => ({})) as any, read: (() => []) as any, writeFile: (() => '') as any });
    const deps = { chartsToday: () => 1, repullCharts: async () => { pulls++; return { ok: true, accepted: 5 }; } };
    await cp2.tickClock(deps);
    await cp2.tickClock(deps);
    check('08:56 with 1 chart file: one automatic re-pull, reported in-app', pulls === 1 && cp2.status().alerts.some((a: any) => a.title === 'Charts re-pulled'));
  }

  // Bad data: a 16-Oct cache price after hours, and an impossible in-session jump.
  {
    const before = cp.status().ticksToday;
    clock = ist('17:11:00');
    cp.onState({ market: { spot: 23135.9, quoteAt: ist('17:11:00'), oiLadder: null, quoteAgeSec: 5 } });
    clock = ist('10:21:00');
    cp.onState({ market: { spot: 23135.9, quoteAt: ist('10:20:30'), oiLadder: null, quoteAgeSec: 5 } });
    const st2 = cp.status();
    check('after-hours and 3%+ jump ticks are rejected', st2.ticksToday === before, `${before} -> ${st2.ticksToday}`);
    check('no "wall failed" from a bad tick', !st2.alerts.some((a: any) => /2[0-9]{3} pts below/.test(a.message)));
  }

  check('alerts outside 09:15-15:30 are recorded but quiet', cp.status().alerts.filter((a: any) => a.title === 'End-of-day report written').every((a: any) => a.quiet === true));
  check('in-session alerts are live (not quiet)', cp.status().alerts.some((a: any) => /Setup confirmed/.test(a.title) && a.quiet === false));

  const inboxed = cp.inbox('Pre-flight FAILED', 'token expired');
  check('daemon/agent notifications land in the in-app list', inboxed?.severity === 'action' && cp.status().alerts.some((a: any) => a.title === 'Pre-flight FAILED'));

  if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
  console.log('\nall co-pilot checks passed');
})();
