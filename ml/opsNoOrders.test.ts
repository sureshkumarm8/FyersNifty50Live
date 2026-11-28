/**
 * "Fully autonomous, but never a real trade" (user, 2026-11-27). Proves the agent
 * at its highest enabled level has no route to an order, the kill switch or the
 * trading mode, and that the autonomous code paths never reference them.
 */
import fs from 'node:fs';
import { isAllowed, FORBIDDEN } from '../ops/client.mjs';
import { toolsForLevel, TOOLS } from '../ops/tools.mjs';
import { MAX_ENABLED_LEVEL, opsConfig } from '../ops/config.mjs';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};

const orderPaths = ['/api/place-order', '/api/paytm/place-order', '/api/fyers/place-order', '/api/paytm/orders', '/api/fyers/orders/abc', '/api/kill', '/api/ops/chat'];
for (const p of orderPaths) {
  check(`no tool can reach ${p}`, !isAllowed('GET', p) && !isAllowed('POST', p) && FORBIDDEN.test(p));
}
check('highest enabled level is L1', MAX_ENABLED_LEVEL === 1);
const l1 = toolsForLevel(1).map((t: any) => t.name);
check('no L1 tool is about orders, mode or the kill switch', !l1.some((n: string) => /order|trade|kill|mode|position|square|flatten/i.test(n)), l1.join(','));
check('every tool is read or ops tier (no protective/trading tier shipped)', TOOLS.every((t: any) => t.tier === 'read' || t.tier === 'ops'));
check('chat defaults to L1', opsConfig({}, null).chatLevel === 1, String(opsConfig({}, null).chatLevel));

const src = (f: string) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const copilot = src('ops/copilot.mjs');
check('co-pilot never calls an order, kill or mode endpoint', !/place-order|\/orders|\/api\/kill|autotrade_mode|setMode/.test(copilot));
const pm = src('components/PreMarketAnalyzer.tsx');
const auto = pm.slice(pm.indexOf('MORNING AUTOPILOT'), pm.indexOf('MORNING AUTOPILOT') + 2500);
check('morning autopilot touches no order, mode or kill switch', auto.length > 100 && !/place-order|order|autotrade_mode|kill/i.test(auto.replace(/never touches orders, modes or the kill switch/, '')));

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall no-real-trade checks passed');
