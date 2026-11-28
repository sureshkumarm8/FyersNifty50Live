/**
 * The wall-setup state machine on the three real sessions behind it.
 * Spot values are the app's 1-minute snapshots from ~/TradingJournal/<date>/state.jsonl.
 */
import {
  Bar, DEFAULT_SETUP_PARAMS, SetupEvent, WallsAt, fiveMinuteTrend, initialSetupState, scorePlan,
  stepWallSetup, toFiveMinuteBars, toMinuteBars, trailLevel
} from '../services/wallSetup';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const ist = (hhmm: string, day = '2026-11-27') => Date.parse(`${day}T${hhmm}:00+05:30`);
const run = (series: [string, number][], walls: (hhmm: string) => WallsAt, day?: string) => {
  const bars = toMinuteBars(series.map(([hhmm, spot]) => ({ t: ist(hhmm, day) + 30_000, spot })));
  const state = initialSetupState();
  const events: SetupEvent[] = [];
  bars.forEach((b, i) => events.push(...stepWallSetup(state, b, walls(series[i][0]))));
  return { bars, events };
};
const at = (events: SetupEvent[], side: string, stage: string) => events.find(e => e.side === side && e.stage === stage);
const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

// 1. 2026-11-27: fall into the 25800 put wall, low 25,811.6 at 09:30, bounce. The user bought at 09:31:55.
{
  const series: [string, number][] = [
    ['09:24', 25836.9], ['09:25', 25847.75], ['09:26', 25820.05], ['09:27', 25818.3], ['09:28', 25815.75],
    ['09:29', 25815.25], ['09:30', 25811.6], ['09:31', 25819.95], ['09:32', 25827.75], ['09:34', 25846.95],
    ['09:35', 25849.7], ['09:36', 25858.8], ['09:37', 25851.05], ['09:38', 25851], ['09:39', 25877.3]
  ];
  const { bars, events } = run(series, () => ({ floor: 25800, floorOIChangePct: 11.3, ceiling: 25900, ceilingOIChangePct: 13.9 }));
  const conf = at(events, 'LONG', 'CONFIRMED');
  check('11-27: at the floor by 09:26', at(events, 'LONG', 'AT_WALL')?.t === ist('09:26'));
  check('11-27: turning on the 09:31 higher low', at(events, 'LONG', 'TURNING')?.t === ist('09:31'));
  check('11-27: confirmed at 09:32 (~25,828), not on the first uptick', conf?.t === ist('09:32') && conf.plan!.entry === 25827.8,
    conf ? `${hhmm(conf.t)} @ ${conf.plan!.entry}` : 'none');
  check('11-27: stop 25,795, room 72 to 25900, wall defended', conf?.plan?.stop === 25795 && conf.plan.room === 72.3 && conf.plan.wallDefended === true && conf.plan.roomOk);
  check('11-27: no failure', !at(events, 'LONG', 'FAILED'));
  const out = scorePlan(conf!.plan!, conf!.t, bars);
  check('11-27: target +30 hit at 09:36', out.result === 'TARGET' && out.exitT === ist('09:36'), `${out.result} ${hhmm(out.exitT)}`);
}

// 2. 2026-11-27 09:21-09:26: the 25850 put wall (+120% writing) broke.
{
  const series: [string, number][] = [['09:21', 25888.6], ['09:22', 25872.2], ['09:23', 25865.2], ['09:24', 25836.9]];
  const { events } = run(series, () => ({ floor: 25850, floorOIChangePct: 120.1, ceiling: 25900, ceilingOIChangePct: 56.7 }));
  const failed = at(events, 'LONG', 'FAILED');
  check('11-27: the 25850 wall is flagged FAILED at 09:24', failed?.t === ist('09:24'), failed ? hhmm(failed.t) : 'none');
  check('11-27: no LONG confirmed into the failing wall', !at(events, 'LONG', 'CONFIRMED'));
}

// 3. 2026-11-26: the user bought the 09:32 spike at 25,858 with no wall nearby; nothing should confirm a LONG there.
{
  const series: [string, number][] = [
    ['09:25', 25777.2], ['09:26', 25790.65], ['09:27', 25788.35], ['09:28', 25800.95], ['09:29', 25808.15],
    ['09:30', 25819.7], ['09:31', 25831.55], ['09:32', 25858.1]
  ];
  const { events } = run(series, () => ({ floor: 25700, floorOIChangePct: 4.8, ceiling: 25900, ceilingOIChangePct: 0.7 }), '2026-11-26');
  check('11-26: no LONG setup at 09:31-09:32 (77 pts above the floor)', !events.some(e => e.side === 'LONG'));
}

// 4. Trend and trail helpers.
{
  const mk = (t: number, h: number, l: number): Bar => ({ t, o: l, h, l, c: l, n: 1 });
  check('5m trend DOWN on lower highs and lows', fiveMinuteTrend([mk(0, 30, 20), mk(1, 28, 18), mk(2, 25, 15)]) === 'DOWN');
  check('5m trend RANGE otherwise', fiveMinuteTrend([mk(0, 30, 20), mk(1, 32, 18), mk(2, 25, 15)]) === 'RANGE');
  const fives = toFiveMinuteBars(toMinuteBars([{ t: ist('09:30'), spot: 1 }, { t: ist('09:34'), spot: 3 }, { t: ist('09:35'), spot: 2 }]));
  check('5m bars group on 5-minute boundaries', fives.length === 2 && fives[0].h === 3);
  const bars = [mk(0, 25880, 25870)];
  check('trail = last bar low - 5', trailLevel('LONG', bars, null) === 25865);
  check('trail never loosens', trailLevel('LONG', [mk(1, 25860, 25850)], 25865) === 25865);
}

check('default params match the system (30-pt target, wall - 5 stop)', DEFAULT_SETUP_PARAMS.targetPts === 30 && DEFAULT_SETUP_PARAMS.failBuffer === 5);

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall wall setup checks passed');
