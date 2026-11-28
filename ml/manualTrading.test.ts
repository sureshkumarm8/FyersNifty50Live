/**
 * Trade ticket and manual journal, checked against the trader's real trades
 * (2026-11-25..27) as pasted from Kite.
 */
import { checkTicket, DEFAULT_CHARGES, TicketInput } from '../services/tradeTicket';
import { journalRow, measureExcursion, pairRoundTrips, parseExecutedOrders } from '../services/manualJournal';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};

// --- Kite paste parsing --------------------------------------------------------
const paste27 = `Executed (2)
Time    Type    Instrument    Product    Qty.    Avg. price    Status
09:42:07    SELL    NIFTY 1st w DEC 25750 CE NFO    NRML    65 / 65    236.15    COMPLETE
09:31:55    BUY    NIFTY 1st w DEC 25750 CE NFO    NRML    65 / 65    216.65     COMPLETE`;
const fills = parseExecutedOrders(paste27);
check('parses both fills, oldest first', fills.length === 2 && fills[0].side === 'BUY' && fills[0].time === '09:31:55');
check('reads strike, type, product, qty, price', fills[0].strike === 25750 && fills[0].optionType === 'CE' && fills[0].product === 'NRML' && fills[0].qty === 65 && fills[0].price === 216.65);
const [trip] = pairRoundTrips(fills);
check('11-27 round trip: +₹1,267.50 gross, LONG view, 10m12s', trip.gross === 1267.5 && trip.view === 'LONG' && trip.heldSec === 612, `${trip.gross} ${trip.view} ${trip.heldSec}s`);

const paste25 = `09:46:58    SELL    NIFTY 1st w DEC 25750 PE NFO    MIS    65 / 65    226.90    COMPLETE
09:38:10    BUY    NIFTY 1st w DEC 25750 PE NFO    MIS    65 / 65    213.30     COMPLETE`;
const [t25] = pairRoundTrips(parseExecutedOrders(paste25));
check('11-25: buying a PE is a SHORT view, +₹884 gross', t25.view === 'SHORT' && t25.gross === 884, `${t25.view} ${t25.gross}`);

// --- excursion from recorded 1-minute spot (11-27) -------------------------------
const ist = (hms: string) => Date.parse(`2026-11-27T${hms}+05:30`);
const ticks = [
  ['09:30:57', 25811.6], ['09:31:58', 25819.95], ['09:32:58', 25827.75], ['09:34:02', 25846.95], ['09:35:03', 25849.7],
  ['09:36:07', 25858.8], ['09:37:09', 25851.05], ['09:38:14', 25851], ['09:39:17', 25877.3], ['09:40:20', 25864.65],
  ['09:41:26', 25877.3], ['09:42:28', 25875.85]
].map(([t, s]) => ({ t: ist(t as string), spot: s as number }));
const ex = measureExcursion(trip, '2026-11-27', ticks);
check('11-27: spot in ~25,820, best +57.35, no adverse move on 1-min data', ex.spotIn === 25819.95 && Math.abs(ex.mfe! - 57.35) <= 0.1 && ex.mae === 0, JSON.stringify(ex));

const row = journalRow('2026-11-27', 1, trip, ex, {
  charges: 82.6, setup: '25800 wall bounce', stop: 25795, exitDriver: 'PLAN + trail', rulesKept: '1/day ✅', lesson: '', feelings: { before: 2, worst: null, after: null, words: '' }
});
check('journal row carries net ₹1,184.90 and unknowns as ?', row.includes('+₹1184.90') && row.includes('| ? |') && row.startsWith('| 2026-11-27 | 1 |'), row.slice(0, 120));

// --- ticket ----------------------------------------------------------------------
const base: TicketInput = {
  side: 'LONG', product: 'MIS', entry: 25827, stop: 25795, target: 25857, nextWall: 25900, supportWall: 25800,
  qty: 65, premiumPerPoint: 0.5, premium: 216, charges: DEFAULT_CHARGES, tradesToday: 0, maxTradesPerDay: 1, plannedPts: 30
};
{
  const r = checkTicket(base);
  check('11-27-style ticket passes', r.ok && r.risk === 32 && r.reward === 30 && r.room === 73, JSON.stringify({ ok: r.ok, risk: r.risk, reward: r.reward, room: r.room }));
  check('net if target / stop after charges', r.netIfTarget === 890 && r.netIfStop === -1125, `${r.netIfTarget} / ${r.netIfStop}`);
  check('break-even win rate after charges is shown (~56%)', r.breakEvenWinRate === 55.8, `${r.breakEvenWinRate}`);
}
{
  const r = checkTicket({ ...base, entry: 25835, stop: null, target: 25800, product: 'NRML', nextWall: 25900 });
  check('11-26-style ticket is BLOCKED: no stop, target behind entry', !r.ok &&
    r.checks.find(c => c.id === 'stop')!.severity === 'BLOCK' && r.checks.find(c => c.id === 'target')!.severity === 'BLOCK');
  check('NRML warns', r.checks.find(c => c.id === 'product')!.severity === 'WARN');
}
{
  const r = checkTicket({ ...base, entry: 25888, stop: 25845, target: 25918, nextWall: 25900 });
  check('room under 30 warns and target past the wall warns', r.checks.find(c => c.id === 'room')!.severity === 'WARN' && r.checks.some(c => c.id === 'wall'));
}
check('writers leaving the support wall warns', checkTicket({ ...base, supportWallOIChangePct: -3.4 }).checks.some(c => c.id === 'wall' && c.severity === 'WARN'));
check('writers adding does not warn', !checkTicket({ ...base, supportWallOIChangePct: 11.3 }).checks.some(c => c.id === 'wall'));
check('second trade of the day is blocked', !checkTicket({ ...base, tradesToday: 1 }).ok);
check('SHORT stop must be above entry', !checkTicket({ ...base, side: 'SHORT', entry: 25780, stop: 25770, target: 25750, nextWall: 25700, supportWall: 25800 }).ok);

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall manual trading checks passed');
