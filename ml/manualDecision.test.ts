/** The Manual tab's one-line decision and "Am I on track?" verdict. */
import { deriveManualDecision, marketPhase, onTrack, DecisionInput } from '../services/manualDecision';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const m = (h: number, mi: number) => h * 60 + mi;
check('phases: weekend closed, 09:05 pre-open, 09:20 opening, 10:00 window, 15:00 late, 16:00 closed',
  marketPhase(m(10, 0), 6) === 'CLOSED' && marketPhase(m(9, 5), 5) === 'PRE_OPEN' && marketPhase(m(9, 20), 5) === 'OPENING' &&
  marketPhase(m(10, 0), 5) === 'WINDOW' && marketPhase(m(15, 0), 5) === 'LATE' && marketPhase(m(16, 0), 5) === 'CLOSED');

const base: DecisionInput = {
  phase: 'WINDOW', spot: 25820, walls: { floor: 25800, floorOIChangePct: 11.3, ceiling: 25900, ceilingOIChangePct: 2 },
  long: { stage: 'IDLE', last: null }, short: { stage: 'IDLE', last: null }, ageMs: { long: Infinity, short: Infinity },
  tradesToday: 0, maxTrades: 1, watched: null, nextOpenLabel: 'Opens Mon 09:15'
};
const plan = { side: 'LONG', wall: 25800, entry: 25827.8, stop: 25795, target: 25857.8, targetCapped: false, room: 72.3, risk: 32.8, reward: 30, wallDefended: true, roomOk: true } as any;
const ev = (stage: string, extra: any = {}) => ({ t: 0, side: 'LONG', stage, spot: 25828, wall: 25800, note: 'Higher low above 25812; break level 25820', ...extra }) as any;

check('closed → MARKET CLOSED', deriveManualDecision({ ...base, phase: 'CLOSED' }).word === 'MARKET CLOSED');
check('one trade taken → DONE FOR TODAY', deriveManualDecision({ ...base, tradesToday: 1 }).word === 'DONE FOR TODAY');
check('logged trade → IN TRADE with live points', /\+28 pts/.test(deriveManualDecision({ ...base, spot: 25848, watched: { side: 'LONG', entry: 25820, stop: 25795, target: 25850 } }).line));
check('11-27 09:32: confirmed, room and writers OK → SETUP CONFIRMED',
  deriveManualDecision({ ...base, long: { stage: 'IDLE', last: ev('CONFIRMED', { plan }) }, ageMs: { long: 30_000, short: Infinity } }).word === 'SETUP CONFIRMED');
check('confirmed but writers leaving → CAUTION',
  deriveManualDecision({ ...base, long: { stage: 'IDLE', last: ev('CONFIRMED', { plan: { ...plan, wallDefended: false } }) }, ageMs: { long: 30_000, short: Infinity } }).word === 'CAUTION');
check('an old confirmation does not linger', deriveManualDecision({ ...base, long: { stage: 'IDLE', last: ev('CONFIRMED', { plan }) }, ageMs: { long: 10 * 60_000, short: Infinity } }).word === 'WAIT');
check('turning → WATCH with the break level', /close through ~25,820/.test(deriveManualDecision({ ...base, long: { stage: 'TURNING', last: ev('TURNING') } }).line));
check('25850 broke → WALL FAILED', deriveManualDecision({ ...base, long: { stage: 'IDLE', last: ev('FAILED', { wall: 25850, note: 'Closed 13 pts below 25850' }) }, ageMs: { long: 60_000, short: Infinity } }).word === 'WALL FAILED');
check('mid-range → WAIT with distances', /20 pts to the floor, 80 to the ceiling/.test(deriveManualDecision(base).line));
check('no walls → NO DATA', deriveManualDecision({ ...base, walls: null }).word === 'NO DATA');

const record = [
  { date: '2026-11-27', side: 'LONG', net: 1184.9, gross: null, spotPts: 56, rulesKept: 3, rulesBroken: 0, brokenRules: [], exitDriver: 'PLAN' },
  { date: '2026-11-26', side: 'LONG', net: 2859.27, gross: null, spotPts: 70, rulesKept: 1, rulesBroken: 3, brokenRules: ['stop', 'target', 'product'], exitDriver: 'GREED' },
  { date: '2026-11-25', side: 'SHORT', net: 802.77, gross: null, spotPts: 37, rulesKept: 1, rulesBroken: 0, brokenRules: [], exitDriver: 'PLAN' }
] as any;
const o = onTrack(record);
check('record: 3 trades, 3 wins, 100%, net ₹4,846.94', o.trades === 3 && o.wins === 3 && o.winRate === 100 && o.net === 4846.94);
check('rules kept 5 of 8 = 63% → amber, with what to work on', o.rulesPct === 63 && o.tone === 'amber' && o.workOn.includes('stop') && o.workOn.includes('exit by greed'), JSON.stringify(o.workOn));
check('honest about sample size', /3 of 15 trades: too few/.test(o.verdict), o.verdict);
check('avg spot captured 54 pts', o.avgPts === 54);
if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall manual decision checks passed');
