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
import { computeOiWalls, parseOptionSymbol } from '../services/oiWalls';
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
