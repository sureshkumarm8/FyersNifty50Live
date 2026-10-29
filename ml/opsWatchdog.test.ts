/**
 * Watchdog rules on fixture snapshots: each rule fires, de-duplicates for
 * 10 minutes, and the kill alert fires once per day.
 */
import assert from 'node:assert';
import { countBrokerOpen, DEDUPE_MS, emptyWatchdogMemory, evaluateWatchdog } from '../ops/watchdog.mjs';
import { readiness } from '../ops/daemonJobs.mjs';

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };

const T0 = Date.parse('2026-10-28T10:00:00+05:30');

const snapshot = (over: any = {}) => ({
  schema: 1,
  tabId: 't',
  at: T0,
  market: { spot: 24300, quoteAgeSec: 5, source: 'paytm' },
  engines: {
    autotrade: { mode: 'PAPER', requestedMode: 'PAPER', killed: false, armed: true, broker: 'fyers' },
    sniper: { state: 'WAITING', armed: true, playbookDate: '2026-10-28' },
    momentum: { state: 'RUNNING', guardWarm: true },
    pilot: { phase: 'IDLE' }
  },
  positions: [],
  premarket: { decisionDate: '2026-10-28', generatedAt: T0 - 3600_000 },
  vision: { lastCaptureAt: T0, stale: false },
  health: { heartbeatLagMs: 0, storageOk: true, journalQueue: 0 },
  ...over
});

const livePos = (stop?: number) => ({ book: 'live', strategy: 'SNIPER', symbol: 'NSE:X', qty: 65, entry: 100, ltp: 101, ...(stop ? { stop, stopBasis: 'spot' } : {}), openedAt: T0 });

function run() {
  console.log('\n--- Watchdog rules ---');
  const rules = (out: any) => out.alerts.map((a: any) => a.rule).sort();

  // Healthy
  let out = evaluateWatchdog({ now: T0, state: { snapshot: snapshot(), ageSec: 3 } });
  assert.deepStrictEqual(rules(out), []);
  ok('a healthy paper session raises nothing');

  // App silent + dedupe
  let mem = emptyWatchdogMemory();
  out = evaluateWatchdog({ now: T0, state: { snapshot: snapshot(), ageSec: 75 } }, mem);
  assert.deepStrictEqual(rules(out), ['app_silent']);
  mem = out.memory;
  out = evaluateWatchdog({ now: T0 + 30_000, state: { snapshot: snapshot(), ageSec: 105 } }, mem);
  assert.deepStrictEqual(rules(out), [], 'deduplicated');
  out = evaluateWatchdog({ now: T0 + DEDUPE_MS + 1, state: { snapshot: snapshot(), ageSec: 700 } }, out.memory);
  assert.deepStrictEqual(rules(out), ['app_silent'], 're-fires after 10 min');
  assert.deepStrictEqual(rules(evaluateWatchdog({ now: T0, state: { snapshot: null, ageSec: null } })), ['app_silent']);
  ok('app snapshot older than 60 s (or never) alerts, de-duplicated for 10 min');

  // Live position with no stop
  out = evaluateWatchdog({ now: T0, state: { snapshot: snapshot({ engines: { ...snapshot().engines, autotrade: { mode: 'LIVE', killed: false } }, positions: [livePos()] }), ageSec: 2 }, brokerOpenCount: 1 });
  assert.deepStrictEqual(rules(out), ['live_no_stop']);
  out = evaluateWatchdog({ now: T0, state: { snapshot: snapshot({ positions: [livePos(24270)] }), ageSec: 2 } });
  assert.deepStrictEqual(rules(out), []);
  ok('a live position with no stop alerts immediately; one with a stop does not');

  // Stale quote with a position
  out = evaluateWatchdog({ now: T0, state: { snapshot: snapshot({ market: { spot: 1, quoteAgeSec: 120 }, positions: [{ ...livePos(1), book: 'paper' }] }), ageSec: 2 } });
  assert.deepStrictEqual(rules(out), ['quote_stale']);
  out = evaluateWatchdog({ now: T0, state: { snapshot: snapshot({ market: { spot: 1, quoteAgeSec: 120 } }), ageSec: 2 } });
  assert.deepStrictEqual(rules(out), [], 'no position, no alert');
  ok('quote older than 90 s while holding a position alerts');

  // Broker mismatch with 10 s grace
  const liveSnap = snapshot({ engines: { ...snapshot().engines, autotrade: { mode: 'LIVE', killed: false } }, positions: [] });
  mem = emptyWatchdogMemory();
  out = evaluateWatchdog({ now: T0, state: { snapshot: liveSnap, ageSec: 1 }, brokerOpenCount: 1 }, mem);
  assert.deepStrictEqual(rules(out), []);
  out = evaluateWatchdog({ now: T0 + 5_000, state: { snapshot: liveSnap, ageSec: 1 }, brokerOpenCount: 1 }, out.memory);
  assert.deepStrictEqual(rules(out), []);
  out = evaluateWatchdog({ now: T0 + 11_000, state: { snapshot: liveSnap, ageSec: 1 }, brokerOpenCount: 1 }, out.memory);
  assert.deepStrictEqual(rules(out), ['broker_mismatch']);
  const healed = evaluateWatchdog({ now: T0 + 12_000, state: { snapshot: liveSnap, ageSec: 1 }, brokerOpenCount: 0 }, out.memory);
  assert.strictEqual(healed.memory.mismatchSince, null);
  assert.deepStrictEqual(rules(evaluateWatchdog({ now: T0 + 20_000, state: { snapshot: snapshot(), ageSec: 1 }, brokerOpenCount: 3 })), [], 'PAPER mode ignores the broker');
  ok('broker ≠ app positions for more than 10 s alerts (LIVE only)');

  // Kill once per day
  const killed = snapshot({ engines: { ...snapshot().engines, autotrade: { mode: 'PAPER', killed: true } } });
  out = evaluateWatchdog({ now: T0, state: { snapshot: killed, ageSec: 1 } });
  assert.deepStrictEqual(rules(out), ['kill_latched']);
  out = evaluateWatchdog({ now: T0 + 2 * DEDUPE_MS, state: { snapshot: killed, ageSec: 1 } }, out.memory);
  assert.deepStrictEqual(rules(out), [], 'once per day, not every 10 min');
  out = evaluateWatchdog({ now: T0 + 24 * 3600_000, state: { snapshot: killed, ageSec: 1 } }, out.memory);
  assert.deepStrictEqual(rules(out), ['kill_latched'], 'again the next day');
  ok('kill latched alerts once per IST day');

  assert.strictEqual(countBrokerOpen({ netPositions: [{ netQty: 65 }, { netQty: 0 }] }), 1);
  assert.strictEqual(countBrokerOpen({ data: [{ quantity: -65 }] }), 1);
  assert.strictEqual(countBrokerOpen({}), 0);
  ok('broker position counting handles Fyers and PayTM shapes');

  // 09:05 readiness verdict
  const ready = readiness({ state: { snapshot: snapshot(), ageSec: 2, stale: false }, today: '2026-10-28', chartsToday: [{ ok: true }] });
  assert.ok(ready.ready);
  const notReady = readiness({
    state: { snapshot: snapshot({ premarket: { decisionDate: '2026-10-27' } }), ageSec: 2, stale: false },
    today: '2026-10-28',
    chartsToday: []
  });
  assert.ok(!notReady.ready);
  assert.ok(notReady.reasons.some((r: string) => /2026-10-27/.test(r)) && notReady.reasons.some((r: string) => /chart/.test(r)));
  ok('09:05 readiness names every missing piece');

  console.log(`\n✅ PASS — ${passed} watchdog checks\n`);
}

try {
  run();
} catch (err) {
  console.error('❌ FAIL', err);
  process.exit(1);
}
