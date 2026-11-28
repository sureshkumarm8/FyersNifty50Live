/** After-hours Cockpit is rebuilt from the saved session history, not a broker pull. */
import { isEquitySymbol, quotesFromSession } from '../services/lastSession';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const ist = (hms: string) => Date.parse(`2026-11-27T${hms}+05:30`);
const candle = (hms: string, lp: number, chp: number, extra: any = {}) => ({
  time: hms, timestamp: ist(hms), lp, volume: 1000, chp, lp_chg_1m_p: 0, lp_chg_day_p: 0, total_buy_qty: 10, total_sell_qty: 20,
  bid_qty_chg_p: 0, bid_chg_day_p: 5, ask_qty_chg_p: 0, ask_chg_day_p: -3, net_strength_1m: 0, day_net_strength: 8, ...extra
});
const session: any = {
  'NSE:TITAN': [candle('09:16:00', 196, -0.4), candle('12:00:00', 199, 1.1), candle('15:29:40', 192.1, -2.26), candle('17:11:44', 192.1, -2.26)],
  'NSE:M&M': [candle('09:20:00', 3000, 0.5), candle('15:29:30', 3010, 0.83)],
  'NSE:NIFTY-25600-CE': [candle('15:29:00', 120, 10)],
  'NSE:NIFTY50-INDEX': [candle('15:29:00', 25607, -1)]
};
const { quotes, asOf, last } = quotesFromSession(session);
check('equities only (options and index left out)', quotes.length === 2 && quotes.every(q => isEquitySymbol(q.symbol)), quotes.map(q => q.symbol).join(','));
const t = quotes.find(q => q.symbol === 'NSE:TITAN')!;
check('last in-session candle wins (17:11 after-hours poll ignored)', last['NSE:TITAN'].time === '15:29:40' && asOf === ist('15:29:40'));
check('price and % from the candle', t.lp === 192.1 && t.chp === -2.26);
check('previous close derived from price and %', Math.abs(t.prev_close_price - 196.54) < 0.01, String(t.prev_close_price));
check('open/high/low from the day samples', t.open_price === 196 && t.high_price === 199 && t.low_price === 192.1);
check('short name from symbol', t.short_name === 'TITAN' && quotes.some(q => q.short_name === 'M&M'));
check('in-session data is not flagged after-close', quotesFromSession(session).afterClose === false);
check('only after-close reads are flagged (prices = the close)', quotesFromSession({ 'NSE:TITAN': [candle('17:11:44', 192.1, -2.26)] } as any).afterClose === true);
check('empty session gives nothing', quotesFromSession({} as any).quotes.length === 0 && quotesFromSession({} as any).asOf === null);
if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall last-session checks passed');
