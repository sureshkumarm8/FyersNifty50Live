/**
 * The refresh heartbeat must start at 09:00 IST (pre-open), the same time
 * refreshData() starts accepting data. On 2026-11-27 it started at 09:17, so
 * from 09:00 to 09:17 only the 60s watchdog fetched, though Refresh Rate was 30s.
 */
import { getMarketTimeInfo } from '../utils/marketTime';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const ist = (hhmm: string) => new Date(`2026-11-27T${hhmm}:00+05:30`);

{
  const m = getMarketTimeInfo(ist('08:52'));
  check('08:52 is before data start', m.isBeforeDataStart);
  check('08:52 waits 8 min for 09:00', m.delayUntilDataStart === 8 * 60_000, `got ${m.delayUntilDataStart}`);
}
{
  const m = getMarketTimeInfo(ist('09:00'));
  check('09:00 starts immediately', !m.isBeforeDataStart && m.delayUntilDataStart === 0);
}
{
  const m = getMarketTimeInfo(ist('09:05'));
  check('09:05 is not held back to 09:17', !m.isBeforeDataStart, `isBeforeDataStart=${m.isBeforeDataStart}`);
  check('09:17 marker unchanged for other callers', m.isBeforeMarketStart);
}
{
  const m = getMarketTimeInfo(ist('10:30'));
  check('10:30 is in market hours', m.isMarketHours && !m.isBeforeDataStart);
}

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall market time checks passed');
