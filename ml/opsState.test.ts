/**
 * The state bridge: the collector is read-only, the server flags a stale
 * snapshot, only the lock-holding tab publishes, and the pilot book diff
 * produces the right journal rows.
 */
import assert from 'node:assert';
import { collectOpsState, CollectInputs, startPublisher, OPS_PUBLISHER_LOCK } from '../services/opsState';
import { pilotJournalEvents } from '../services/pilotJournal';
import { createStateStore, validateSnapshot } from '../ops/stateStore.mjs';

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.values(o as any).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
}

const NOW = Date.parse('2026-10-28T10:42:05+05:30');

const inputs = (): CollectInputs => ({
  now: NOW,
  tabId: 'tab-1',
  spot: 24312.5,
  lastQuoteAt: NOW - 12_000,
  source: 'paytm',
  storedMode: 'PAPER',
  storedKilled: false,
  engines: {
    autotrade: { mode: 'PAPER', requestedMode: 'PAPER', killed: false, armed: true, broker: 'paytm' },
    sniper: { state: 'WAITING', armed: true, playbookDate: '2026-10-28', lastDecision: 'Price mid-range' },
    momentum: { state: 'RUNNING', guardWarm: true, lastGate: 'Signal score below threshold' }
  },
  enginePositions: [
    { book: 'paper', strategy: 'SNIPER', symbol: 'NSE:NIFTY26N0324050CE', qty: 65, entry: 180, ltp: 190, stop: 24270, stopBasis: 'spot', target: 24330, openedAt: NOW - 600_000 }
  ],
  manualPaper: [{ symbol: 'NSE:NIFTY26N0324400PE', quantity: 65, entryPrice: 90, ltp: 85, stopLoss: null, target: 120, entryTime: NOW - 60_000 }],
  pilot: {
    position: null,
    todayDecision: { action: 'SKIP', reason: 'No setup' },
    latestFrame: { status: 'WAIT' }
  },
  premarket: { generatedAt: NOW - 3_600_000, primaryBias: 'LONG', headline: 'Buy the dip at support' },
  vision: { id: '20261028-103900', finishedAt: NOW - 180_000, bias: 'bullish' },
  heartbeatLagMs: 140,
  storageOk: true,
  journalQueue: 0
});

async function run() {
  console.log('\n--- Ops state bridge ---');

  // Read-only collector
  const frozen = deepFreeze(inputs());
  const snap = collectOpsState(frozen);
  assert.strictEqual(snap.schema, 1);
  assert.strictEqual(snap.market.quoteAgeSec, 12);
  assert.strictEqual(snap.positions.length, 2);
  assert.ok(snap.positions.some(p => p.strategy === 'MANUAL' && p.stop === undefined));
  assert.strictEqual(snap.engines.pilot.phase, 'DECIDED SKIP');
  assert.strictEqual(snap.premarket.decisionDate, '2026-10-28');
  assert.strictEqual(snap.vision.stale, false);
  assert.strictEqual(validateSnapshot(snap), null);
  snap.positions[0].qty = 999;
  assert.strictEqual(frozen.enginePositions[0].qty, 65);
  ok('collector builds a valid snapshot from frozen inputs without mutating them');

  const fallback = collectOpsState({ ...inputs(), engines: {}, storedKilled: true, storedMode: 'LIVE', vision: null, pilot: null });
  assert.strictEqual(fallback.engines.autotrade.killed, true);
  assert.strictEqual(fallback.engines.autotrade.mode, 'PAPER', 'a killed session is never reported as LIVE');
  assert.strictEqual(fallback.engines.sniper.state, 'NOT_MOUNTED');
  assert.strictEqual(fallback.vision.stale, true);
  ok('falls back to stored flags when AutoTrade has not reported; killed implies PAPER');

  // Server store and staleness
  let clock = NOW;
  const journaled: any[] = [];
  const store = createStateStore({ now: () => clock, journal: ((s: string, row: any) => journaled.push({ s, row })) as any });
  assert.strictEqual(store.get().stale, true);
  assert.ok(store.put({ schema: 2 } as any));
  assert.strictEqual(store.put(snap), null);
  assert.strictEqual(store.get().stale, false);
  clock += 21_000;
  assert.strictEqual(store.get().stale, true);
  assert.strictEqual(store.get().ageSec, 21);
  store.put(snap);
  clock += 5_000;
  store.put(snap);
  assert.strictEqual(journaled.length, 1, 'state.jsonl gets one row per minute, not per post');
  clock += 60_000;
  store.put(snap);
  assert.strictEqual(journaled.length, 2);
  ok('server flags a snapshot older than 20 s as stale; state.jsonl is throttled to 1/min');

  // Only the lock holder publishes
  const waiters: Array<() => void> = [];
  let held = false;
  const locks = {
    request: async (name: string, cb: (lock: unknown) => Promise<void>) => {
      assert.strictEqual(name, OPS_PUBLISHER_LOCK);
      const acquire = async () => { held = true; await cb({}); held = false; waiters.shift()?.(); };
      if (held) await new Promise<void>(r => waiters.push(() => { void acquire().then(r); }));
      else await acquire();
    }
  };
  const posted: string[] = [];
  const mk = (id: string) => startPublisher({
    locks,
    schedule: () => () => {},
    collect: async () => ({ ...snap, tabId: id }),
    post: async s => { posted.push(s.tabId); }
  });
  const stopA = mk('A');
  const stopB = mk('B');
  await new Promise(r => setTimeout(r, 20));
  assert.deepStrictEqual(posted, ['A']);
  stopA();
  await new Promise(r => setTimeout(r, 20));
  assert.deepStrictEqual(posted, ['A', 'B']);
  stopB();
  ok('only the tab holding the publisher lock posts; the next tab takes over when it closes');

  // Pilot journal diff
  const assessment = { at: NOW, status: 'PAPER ENTRY READY', side: 'CE', setup: 'CONTINUATION', reason: 'r', checks: [] } as any;
  const empty = { version: 1, plans: [], observations: [], frames: [], decisions: [], position: null, trades: [] } as any;
  const position = { id: 'p1', symbol: 'X', quantity: 65, entryPremium: 100, stopPremium: 80, targetPremium: 130, override: false, reason: 'go' } as any;
  const withPos = { ...empty, decisions: [{ id: 'd1', day: '2026-10-28', at: NOW, action: 'BUY_CE', reason: 'go', assessment }], position };
  const e1 = pilotJournalEvents(empty, withPos);
  assert.deepStrictEqual(e1.map(e => e.stream), ['decisions', 'fills']);
  const closed = { ...withPos, position: null, trades: [{ ...position, exitPremium: 130, exitReason: 'TARGET', netPnl: 1900.5, samplingGap: false }] };
  const e2 = pilotJournalEvents(withPos, closed);
  assert.deepStrictEqual(e2.map(e => e.stream), ['exits']);
  assert.strictEqual(e2[0].data.exitPrice, 130);
  assert.strictEqual(e2[0].data.entryPrice, 100);
  assert.deepStrictEqual(pilotJournalEvents(closed, closed), []);
  ok('pilot book diffs become decisions / fills / exits rows, once each');

  console.log(`\n✅ PASS — ${passed} state bridge checks\n`);
}

run().catch(err => {
  console.error('❌ FAIL', err);
  process.exit(1);
});
