/**
 * Option OI data regression tests.
 *
 * From 2026-11-12 Nifty traded above 25000 while the weekly option list stopped
 * at 25000. ATM ± 1000 then held only deep-ITM calls and OTM puts, so the
 * logged PCR read 5-30 (Sensibull showed 0.73 on 11-17), and the Sniper's PCR
 * gate took that as a bullish floor and blocked every short for a week.
 *
 * These tests pin the three fixes: the strike list covers the live price, the
 * PCR gate ignores impossible readings, and per-strike OI walls are derived
 * correctly for the history log.
 */
import { NIFTY_WEEKLY_OPTIONS } from '../constants/niftyWeeklyOptions';
import { straddlesAtm } from '../services/paytmService';
import { computeOiWalls, parseOptionSymbol, parseOiLadder, wallContext, wallRoom } from '../services/oiWalls';
import { evaluate, OpeningRange } from '../services/sniperEngine';

let passed = 0;
let failed = 0;

const check = (label: string, ok: boolean, detail?: string) => {
  if (ok) {
    passed++;
    console.log(`  ok    ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

// --- strike coverage --------------------------------------------------------

const window = (atm: number) => NIFTY_WEEKLY_OPTIONS.filter(o => Math.abs(o.strike - atm) <= 1000);
for (const atm of [23000, 25300, 26500]) {
  const w = window(atm);
  check(
    `weekly list straddles ATM ${atm}`,
    straddlesAtm(w, atm),
    `${w.length} contracts, ${Math.min(...w.map(o => o.strike))}-${Math.max(...w.map(o => o.strike))}`
  );
}
check(
  'the old 21000-25000 list is flagged as one-sided at 25300',
  !straddlesAtm(NIFTY_WEEKLY_OPTIONS.filter(o => o.strike <= 25000 && o.strike >= 24300), 25300)
);

// --- OI walls ---------------------------------------------------------------

check('parses an option symbol', JSON.stringify(parseOptionSymbol('NSE:NIFTY-25300-CE')) === '{"strike":25300,"type":"CE"}');
check('ignores an unlabelled contract', parseOptionSymbol('UNKNOWN') === null);

// Sensibull, 16-Nov close, Nifty 25291 (OI in contracts, as Paytm reports).
const chain = [
  ['25000', 125e5, 15e5],
  ['25200', 109e5, 58e5],
  ['25250', 46e5, 52e5],
  ['25300', 52e5, 105e5],
  ['25400', 15e5, 95e5],
  ['25500', 8e5, 127e5]
].flatMap(([k, put, call]) => [
  { symbol: `NSE:NIFTY-${k}-PE`, oi: put as number },
  { symbol: `NSE:NIFTY-${k}-CE`, oi: call as number }
]);
chain.push({ symbol: 'UNKNOWN', oi: 999e5 });

const walls = computeOiWalls(chain, 25291);
check('put wall is the largest put OI below spot', walls.putWall === 25000 && walls.putWallOI === 125e5, `${walls.putWall}`);
check('call wall is the largest call OI above spot', walls.callWall === 25500 && walls.callWallOI === 127e5, `${walls.callWall}`);
check(
  'ladder lists ATM ± 500 ascending in lakhs',
  walls.oiLadder === '25000:125.0/15.0;25200:109.0/58.0;25250:46.0/52.0;25300:52.0/105.0;25400:15.0/95.0;25500:8.0/127.0',
  walls.oiLadder
);
// --- room to the wall (Momentum entry log) ---------------------------------

// Sensibull 2026-11-18 10:30, lakhs, as the app's ladder logs it.
const ladder1118 = [
  [24800, 47, 5], [24900, 41, 9], [25000, 120, 35], [25100, 50, 14], [25150, 20, 6.5],
  [25200, 68, 39], [25250, 38, 33], [25300, 88, 102], [25350, 25, 50], [25400, 48, 98],
  [25500, 49, 118], [25600, 7, 52], [25700, 3, 48]
].map(([k, p, c]) => `${k}:${p.toFixed(1)}/${c.toFixed(1)}`).join(';');

check('ladder round-trips to contracts', parseOiLadder(ladder1118)[2].putOI === 120e5 && parseOiLadder('junk').length === 0);
const t3 = wallRoom(ladder1118, 25223.65, 'SHORT');
check('10:45 short: the 25200 put wall is 24 points away, not the larger 25000', t3.wallStrike === 25200 && t3.room === 23.65, JSON.stringify(t3));
const t2 = wallRoom(ladder1118, 25251.95, 'SHORT');
check('10:24 short: 25250 puts are too small to count, 25200 is the wall', t2.wallStrike === 25200 && t2.room === 51.95, JSON.stringify(t2));
const long = wallRoom(ladder1118, 25251.95, 'LONG');
check('a long runs into the 25300 call wall', long.wallStrike === 25300 && long.room === 48.05, JSON.stringify(long));
check('no ladder gives no room reading', wallRoom(null, 25250, 'SHORT').room === null);

// --- writers adding or leaving at the walls -------------------------------

// 2026-11-19: 25100 puts went 38L -> 58L into the 09:30 low; 25200 calls held.
const at = (hhmm: string) => Date.parse(`2026-11-19T${hhmm}:00+05:30`);
const ladderAt = (put25100: number) => `25000:110.9/39.3;25100:${put25100.toFixed(1)}/33.2;25150:35.7/31.8;25200:93.2/110.0`;
const hist1119 = [
  { timestamp: at('09:30'), oiLadder: ladderAt(58.4) },
  { timestamp: at('09:28'), oiLadder: ladderAt(50) },
  { timestamp: at('09:25'), oiLadder: ladderAt(38) },
  { timestamp: at('09:20'), oiLadder: null }
];
const ctx = wallContext(hist1119, 25107.85);
check('floor is the 25100 put wall, 8 points down', ctx.floor === 25100 && ctx.floorRoom === 7.85, JSON.stringify(ctx));
check('writers added 54% at the floor over 5 minutes', ctx.floorOIChangePct === 53.7 && ctx.comparedMinutes === 5, JSON.stringify(ctx));
check('ceiling is the 25200 call wall, unchanged', ctx.ceiling === 25200 && ctx.ceilingOIChangePct === 0, JSON.stringify(ctx));
check('no earlier ladder gives no change reading', wallContext(hist1119.slice(0, 2), 25107.85).floorOIChangePct === null);
check('no ladder at all gives empty walls', wallContext([], 25107.85).floor === null);

check('no options gives empty walls', computeOiWalls([], 25300).callWall === null && computeOiWalls([], 25300).oiLadder === '');

// --- PCR gate ---------------------------------------------------------------

const range = { high: 25352.8, low: 25319.8, open: 25319.8, support: 25308, resistance: 25364, openType: 'FLAT', samples: 9, lockedAt: 0 } as OpeningRange;
const atResistance = (pcr: number) =>
  evaluate({
    now: new Date('2026-11-17T09:41:00+05:30'),
    spot: 25360,
    range,
    signalDirection: 'SHORT',
    signalConfidence: 80,
    signalReasons: [],
    hasOpenPosition: false,
    dailyTradeDone: false,
    expiry: '261124',
    pcr
  });

check('the 11-17 PCR of 22.9 no longer blocks the fade', atResistance(22.9).canEnter, atResistance(22.9).blocks.map(b => b.message).join(' | '));
check('a real PCR of 1.2 still blocks the fade', !atResistance(1.2).canEnter);
check('a real PCR of 0.73 allows the fade', atResistance(0.73).canEnter);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
