import { resolveOptionSymbol, buildFyersSymbol } from '../services/instrumentResolver';
import { CURRENT_EXPIRY_DATE, NIFTY_WEEKLY_OPTIONS } from '../constants/niftyWeeklyOptions';

console.log('\n--- Instrument Resolver Verification Suite ---');

let failed = 0;

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// 1. Weekly Expiry Test
// 2026-10-20 is a Tuesday (weekly, October = 'O')
const weeklyFyers = buildFyersSymbol(new Date('2026-10-20'), 24500, 'CE');
check('Fyers weekly symbol uses 2-digit year, single-char month, 2-digit day', weeklyFyers === 'NSE:NIFTY26O2024500CE', weeklyFyers);

const weeklyResolved = resolveOptionSymbol({
  broker: 'FYERS',
  expiry: '2026-10-20',
  strike: 24500,
  side: 'CE'
});
check('resolveOptionSymbol returns correct Fyers weekly symbol', weeklyResolved.tradableSymbol === 'NSE:NIFTY26O2024500CE');

// 2. Monthly Expiry Test
// 2026-10-29 is the last Thursday of October 2026 (monthly -> 'OCT')
const monthlyFyers = buildFyersSymbol(new Date('2026-10-29'), 24500, 'PE');
check('Fyers monthly symbol uses 3-letter month MMM', monthlyFyers === 'NSE:NIFTY26OCT24500PE', monthlyFyers);

const monthlyResolved = resolveOptionSymbol({
  broker: 'FYERS',
  expiry: '2026-10-29',
  strike: 24500,
  side: 'PE'
});
check('resolveOptionSymbol returns correct Fyers monthly symbol', monthlyResolved.tradableSymbol === 'NSE:NIFTY26OCT24500PE');

// 3. Expiry-day case
const expiryDayResolved = resolveOptionSymbol({
  broker: 'FYERS',
  expiry: new Date('2026-10-27'),
  strike: 24000,
  side: 'CE'
});
check('Handles Date object for expiry-day', expiryDayResolved.tradableSymbol.startsWith('NSE:NIFTY26'));

// 4. Paytm Weekly Resolution with securityId
if (NIFTY_WEEKLY_OPTIONS.length > 0) {
  const sample = NIFTY_WEEKLY_OPTIONS[0];
  const paytmResolved = resolveOptionSymbol({
    broker: 'PAYTM',
    expiry: CURRENT_EXPIRY_DATE,
    strike: sample.strike,
    side: sample.type
  });
  check('Paytm weekly returns tradableSymbol and valid numeric securityId',
    paytmResolved.securityId === sample.security_id && paytmResolved.tradableSymbol === `NSE:NIFTY-${sample.strike}-${sample.type}`,
    `${paytmResolved.securityId} !== ${sample.security_id}`
  );
}

// 5. Unknown strike rejection
let rejectedNonMultiple = false;
try {
  resolveOptionSymbol({
    broker: 'FYERS',
    expiry: '2026-10-27',
    strike: 24523, // not a multiple of 50
    side: 'CE'
  });
} catch (e: any) {
  rejectedNonMultiple = true;
}
check('Rejects strike not a multiple of 50', rejectedNonMultiple);

let rejectedOutOfRange = false;
try {
  resolveOptionSymbol({
    broker: 'FYERS',
    expiry: '2026-10-27',
    strike: 5000, // outside [15000, 35000]
    side: 'CE'
  });
} catch (e: any) {
  rejectedOutOfRange = true;
}
check('Rejects strike outside [15000, 35000]', rejectedOutOfRange);

let rejectedMissingPaytmStrike = false;
try {
  resolveOptionSymbol({
    broker: 'PAYTM',
    expiry: CURRENT_EXPIRY_DATE,
    strike: 16000, // valid multiple of 50, but not in current weekly contracts
    side: 'CE'
  });
} catch (e: any) {
  rejectedMissingPaytmStrike = true;
}
check('Rejects Paytm strike absent from weekly master', rejectedMissingPaytmStrike);

console.log(failed ? '\n❌ FAILED' : '\n✅ PASS — Instrument Resolver verified for weekly, monthly, expiry-day & rejections\n');
process.exit(failed ? 1 : 0);
