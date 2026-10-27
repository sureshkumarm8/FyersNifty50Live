import { validateExpiryDate } from '../services/expiryValidator';
import { CURRENT_EXPIRY_DATE } from '../constants/niftyWeeklyOptions';
import { getNextExpiryDate } from '../constants/niftyExpiryDates';

console.log('\n--- Expiry Validator Verification Suite ---');

let failed = 0;

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const result = validateExpiryDate();
const next = getNextExpiryDate();

console.log(`Current compiled expiry: ${CURRENT_EXPIRY_DATE}`);
console.log(`Next calendar expiry:    ${next?.date}`);
console.log(`Validation result:`, result);

check('Next expiry date is found in calendar', next !== null);
check('Current expiry matches next expiry', result.currentExpiry === next?.date, `${result.currentExpiry} !== ${next?.date}`);
check('Current expiry is not in the past', !result.isPast);
check('Expiry is marked valid', result.valid);
check('Fix command is npm run generate:options', result.fixCommand === 'npm run generate:options');

console.log(failed ? '\n❌ FAILED' : '\n✅ PASS — Expiry Validator correctly tracks NSE calendar\n');
process.exit(failed ? 1 : 0);
