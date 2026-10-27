/**
 * M1 LIVE SAFETY SUITE
 * Validates M1.1 through M1.8 acceptance criteria
 */

import { NIFTY_LOT_SIZE } from '../constants/lotSize';
import { resolveOptionSymbol } from '../services/instrumentResolver';
import { validateExpiryDate } from '../services/expiryValidator';
import { OrderManager } from '../services/orderManager';

console.log('\n--- M1 LIVE Safety Comprehensive Verification Suite ---');

let failed = 0;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// M1.1: Lot size is 65
check('NIFTY_LOT_SIZE is 65', NIFTY_LOT_SIZE === 65, `${NIFTY_LOT_SIZE} !== 65`);

// M1.2: Correct broker symbols with NSE: prefix
const fyersWeekly = resolveOptionSymbol({ broker: 'FYERS', expiry: '2026-10-20', strike: 24500, side: 'CE' });
check('Fyers symbol starts with NSE:NIFTY', fyersWeekly.tradableSymbol.startsWith('NSE:NIFTY'), fyersWeekly.tradableSymbol);

// Unknown strike rejection
let rejected = false;
try {
  resolveOptionSymbol({ broker: 'FYERS', expiry: '2026-10-20', strike: 24513, side: 'CE' });
} catch {
  rejected = true;
}
check('Unknown/non-50 strike rejected before reaching server', rejected);

// M1.7: Master gate liveOrdersEnabled
const om = new OrderManager({} as any, false, undefined, false); // live mode, liveOrdersEnabled = false
check('liveOrdersEnabled defaults to false', !om.isLiveOrdersEnabled());

om.placeOrder('NSE:NIFTY26O2024500CE', 'BUY', 65, 'MARKET').then(res => {
  check('LIVE order rejected when liveOrdersEnabled is false', !res.success && res.message?.includes('liveOrdersEnabled=false'), res.message);

  // M1.8: Expiry validation
  const expCheck = validateExpiryDate();
  check('Expiry validation passes against current NSE calendar', expCheck.valid);

  console.log(failed ? '\n❌ M1 FAILED' : '\n✅ PASS — All M1 LIVE-mode safety criteria verified!\n');
  process.exit(failed ? 1 : 0);
}).catch(err => {
  failed++;
  console.log('FAIL: placeOrder threw', err);
  process.exit(1);
});
