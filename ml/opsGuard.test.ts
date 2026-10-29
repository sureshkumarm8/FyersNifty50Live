/**
 * The ops guard: tiers, the order-placement wall, rate limits, confirmation
 * tokens, and the autonomy cap. Pure — no network, no model.
 */
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { createGuard, MAX_CALLS_PER_TURN } from '../ops/guard.mjs';
import { createOpsClient, isAllowed } from '../ops/client.mjs';
import { parseLevel } from '../ops/config.mjs';
import { TOOLS, toolsForLevel } from '../ops/tools.mjs';

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };

async function run() {
  console.log('\n--- Ops guard ---');
  let clock = 1_000_000;
  const now = () => clock;
  const tool = (name: string, tier: string) => ({ name, tier, description: '', parameters: {}, run: async () => ({}) });

  // Tiers
  const l0 = createGuard({ level: 0, now });
  l0.startTurn();
  assert.ok(l0.check(tool('get_app_state', 'read'), {}).ok);
  const denied = l0.check(tool('run_preflight', 'ops'), {});
  assert.ok(!denied.ok && /L0/.test(denied.reason));
  assert.ok(!l0.check(undefined as any, {}).ok);
  assert.ok(!l0.check(tool('weird', 'superuser'), {}).ok);
  ok('read allowed at L0; ops tool, unknown tool and unknown tier refused');

  const l1 = createGuard({ level: 1, now });
  l1.startTurn();
  assert.ok(l1.check(tool('run_preflight', 'ops'), {}).ok);
  assert.ok(!l1.check(tool('latch_kill_switch', 'protective'), {}).ok);
  ok('ops allowed at L1; protective refused at L1');

  // Visible tools match the level, and there is no protective tool at all yet.
  assert.ok(toolsForLevel(0).every(t => t.tier === 'read'));
  assert.ok(toolsForLevel(1).every(t => t.tier !== 'protective'));
  assert.ok(!TOOLS.some(t => t.tier === 'protective'));
  ok('the model is only shown tools its level can call; no protective tool is registered (M5)');

  // Order placement unreachable
  assert.ok(!TOOLS.some(t => /order|trade|buy|sell|kill|flatten|shell|exec|http|fetch/i.test(t.name)));
  for (const path of ['/api/fyers/place-order', '/api/paytm/place-order', '/api/fyers/orders', '/api/paytm/orders', '/api/kill', '/api/ops/chat']) {
    assert.strictEqual(isAllowed('POST', path), false, path);
    assert.strictEqual(isAllowed('GET', path), false, path);
  }
  assert.ok(isAllowed('GET', '/api/ops/state') && isAllowed('POST', '/api/vision/snapshots'));
  assert.ok(!isAllowed('DELETE', '/api/vision/history') && !isAllowed('GET', 'https://example.com/'));
  let fetched = 0;
  const client = createOpsClient('http://127.0.0.1:1', { fetchImpl: (async () => { fetched++; return new Response('{}'); }) as any });
  await assert.rejects(() => client.post('/api/fyers/place-order', {}), /refused/);
  await assert.rejects(() => client.get('/api/paytm/orders'), /refused/);
  assert.strictEqual(fetched, 0);
  const toolSource = readFileSync(new URL('../ops/tools.mjs', import.meta.url), 'utf8');
  assert.ok(!/place-order|\bfetch\(|child_process|execSync|spawn\(/.test(toolSource));
  ok('place-order, order books and the kill POST are unreachable from any tool, at any level');

  // Rate limits
  const g = createGuard({ level: 1, now });
  g.startTurn();
  const pull = tool('pull_premarket_charts', 'ops');
  assert.ok(g.check(pull, {}).ok);
  assert.ok(!g.check(pull, {}).ok);
  clock += 10 * 60_000;
  assert.ok(g.check(pull, {}).ok);
  const notify = tool('notify', 'ops');
  assert.ok(g.check(notify, { topic: 'a' }).ok);
  assert.ok(!g.check(notify, { topic: 'a' }).ok);
  assert.ok(g.check(notify, { topic: 'b' }).ok);
  clock += 60_000;
  assert.ok(g.check(notify, { topic: 'a' }).ok);
  ok('1 chart pull per 10 min; 1 notify per minute per topic');

  const b = createGuard({ level: 0, now });
  b.startTurn();
  for (let i = 0; i < MAX_CALLS_PER_TURN; i++) assert.ok(b.check(tool('get_app_state', 'read'), {}).ok);
  assert.ok(!b.check(tool('get_app_state', 'read'), {}).ok);
  b.startTurn();
  assert.ok(b.check(tool('get_app_state', 'read'), {}).ok);
  ok(`max ${MAX_CALLS_PER_TURN} tool calls per turn`);

  // Confirmation tokens (tested at L2 directly; config caps real sessions at L1)
  const p = createGuard({ level: 2, now });
  p.startTurn();
  const latch = tool('latch_kill_switch', 'protective');
  assert.ok(!p.check(latch, { reason: 'x' }).ok);
  assert.ok(!p.check(latch, { reason: 'x' }, { confirmToken: 'made-up-by-the-model' }).ok);
  assert.throws(() => p.issueConfirmToken('latch_kill_switch', 'model'));
  const t1 = p.issueConfirmToken('latch_kill_switch', 'ui');
  assert.ok(p.check(latch, { reason: 'x' }, { confirmToken: t1 }).ok);
  assert.ok(!p.check(latch, { reason: 'x' }, { confirmToken: t1 }).ok, 'single use');
  const t2 = p.issueConfirmToken('something_else', 'watchdog');
  assert.ok(!p.check(latch, {}, { confirmToken: t2 }).ok, 'bound to its tool');
  const t3 = p.issueConfirmToken('latch_kill_switch', 'watchdog');
  clock += 3 * 60_000;
  assert.ok(!p.check(latch, {}, { confirmToken: t3 }).ok, 'expires');
  ok('protective tool needs a fresh, single-use, tool-bound token from the UI or watchdog');

  // Autonomy cap
  assert.strictEqual(parseLevel('L0'), 0);
  assert.strictEqual(parseLevel('l1'), 1);
  assert.strictEqual(parseLevel('L2'), 1);
  assert.strictEqual(parseLevel('L3'), 1);
  assert.strictEqual(parseLevel('banana', 0), 0);
  ok('OPS_AUTONOMY_LEVEL is clamped to L1 until M5');

  console.log(`\n✅ PASS — ${passed} guard checks\n`);
}

run().catch(err => {
  console.error('❌ FAIL', err);
  process.exit(1);
});
