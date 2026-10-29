/**
 * Day replay: a recorded session (state.jsonl + trade/decision streams) is fed
 * through the watchdog and the debrief, the way the daemon would see it.
 *
 * TradingJournal/2026-10-23 predates the journal wiring (it holds only the
 * runner log and an empty scorecard), so its files are copied in and the
 * streams that day would have produced are recorded alongside, including an
 * 11:02–11:21 sleep stall like the ones in the memory notes.
 */
import assert from 'node:assert';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'opsreplay-'));
process.env.OPS_JOURNAL_ROOT = root;
const DATE = '2026-10-23';
const dir = join(root, DATE);
mkdirSync(dir, { recursive: true });
if (existsSync(join('TradingJournal', DATE))) cpSync(join('TradingJournal', DATE), dir, { recursive: true });

const { evaluateWatchdog, emptyWatchdogMemory } = await import('../ops/watchdog.mjs');
const { buildDebriefData, renderDebrief, stateGaps } = await import('../ops/debrief.mjs');
const { scoreDay, tradesFrom } = await import('../ops/scorecard.mjs');

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };

const at = (hhmm: string, sec = 0) => Date.parse(`${DATE}T${hhmm}:${String(sec).padStart(2, '0')}+05:30`);
const write = (stream: string, rows: any[]) =>
  writeFileSync(join(dir, `${stream}.jsonl`), rows.map(r => JSON.stringify(r)).join('\n') + '\n');

const snap = (t: number, positions: any[] = []) => ({
  schema: 1, tabId: 't', at: t,
  market: { spot: 24300, quoteAgeSec: 5, source: 'paytm' },
  engines: {
    autotrade: { mode: 'PAPER', killed: false, armed: true },
    sniper: { state: 'WAITING', armed: true, playbookDate: DATE },
    momentum: { state: 'RUNNING', guardWarm: true },
    pilot: { phase: 'IDLE' }
  },
  positions, premarket: { decisionDate: DATE, generatedAt: at('08:58') }, vision: { lastCaptureAt: t, stale: false },
  health: { heartbeatLagMs: 0, storageOk: true, journalQueue: 0 }
});

// --- record the day ----------------------------------------------------------
const stateRows: any[] = [];
for (let t = at('09:15'); t <= at('15:30'); t += 60_000) {
  if (t >= at('11:02') && t < at('11:21')) continue; // the Mac slept
  const holding = t >= at('09:31') && t < at('09:52');
  stateRows.push({ timestamp: t, receivedAt: t, snapshot: snap(t, holding ? [{ book: 'paper', strategy: 'SNIPER', symbol: 'NSE:NIFTY26O2724050CE', qty: 65, entry: 182, ltp: 190, stop: 24270, stopBasis: 'spot', openedAt: at('09:31') }] : []) });
}
write('state', stateRows);
write('premarket', [{ timestamp: at('08:58'), trigger: 'generate', verdict: 'TRADE', headline: 'Buy support 24270', primaryBias: 'LONG', basis: 'PREOPEN', provisional: false }]);
write('decisions', [
  { timestamp: at('09:25'), strategy: 'SNIPER', phase: 'ENTRY_WINDOW', canEnter: false, blocks: [{ code: 'MID_RANGE', message: 'mid' }] },
  { timestamp: at('09:30', 40), strategy: 'SNIPER', phase: 'ENTRY_WINDOW', canEnter: true, blocks: [] },
  { timestamp: at('09:31'), strategy: 'SNIPER', phase: 'ENTRY_WINDOW', canEnter: false, blocks: [{ code: 'DAILY_DONE', message: 'done' }] }
]);
write('gates', [
  { timestamp: at('09:30'), strategy: 'MOMENTUM', ready: false, blockedBy: 'score', reason: 'score 41 < 68' },
  { timestamp: at('10:10'), strategy: 'MOMENTUM', ready: false, blockedBy: 'fresh-snapshot', reason: 'stale' },
  { timestamp: at('11:25'), strategy: 'MOMENTUM', ready: false, blockedBy: 'history-anchors', reason: 'hole' }
]);
write('orders', [
  { timestamp: at('09:31'), book: 'paper', strategy: 'SNIPER', symbol: 'NSE:NIFTY26O2724050CE', side: 'BUY', quantity: 65, status: 'FILLED' },
  { timestamp: at('09:52'), book: 'paper', strategy: 'SNIPER', symbol: 'NSE:NIFTY26O2724050CE', side: 'SELL', quantity: 65, status: 'FILLED' }
]);
write('fills', [{ timestamp: at('09:31'), book: 'paper', strategy: 'SNIPER', symbol: 'NSE:NIFTY26O2724050CE', side: 'BUY', quantity: 65, avgPrice: 182 }]);
write('exits', [{ timestamp: at('09:52'), book: 'paper', strategy: 'SNIPER', symbol: 'NSE:NIFTY26O2724050CE', side: 'SELL', quantity: 65, entryPrice: 182, exitPrice: 197, pnl: 975, priceSource: 'mark', reason: 'target +30 hit' }]);
write('alerts', [{ timestamp: at('11:21', 30), rule: 'feed_stalled', severity: 'warning', source: 'momentum', message: 'Newest snapshot is 1140s old' }]);
write('charts', [{ timestamp: at('08:50'), ok: true, accepted: 2, rejected: [{ file: 'x.png', why: 'identical to the previous capture' }], files: [] }]);

function run() {
  console.log('\n--- Day replay ---');

  // Watchdog as the daemon saw it every 30 s.
  let memory = emptyWatchdogMemory();
  const fired: Array<{ t: number; rule: string }> = [];
  let lastState: any = null;
  for (let t = at('09:15'); t <= at('15:30'); t += 30_000) {
    const latest = stateRows.filter(r => r.receivedAt <= t).slice(-1)[0];
    if (latest) lastState = latest;
    const ageSec = lastState ? (t - lastState.receivedAt) / 1000 : null;
    const out = evaluateWatchdog({ now: t, state: { snapshot: lastState?.snapshot ?? null, ageSec } }, memory);
    memory = out.memory;
    out.alerts.forEach((a: any) => fired.push({ t, rule: a.rule }));
  }
  const silent = fired.filter(f => f.rule === 'app_silent');
  assert.ok(silent.length >= 1 && silent.length <= 2, `app_silent fired ${silent.length}x`);
  assert.ok(silent[0].t >= at('11:02') && silent[0].t <= at('11:03'), 'within ~60 s of the stall');
  assert.ok(!fired.some(f => f.rule !== 'app_silent'), `unexpected: ${fired.map(f => f.rule)}`);
  ok(`the 11:02 stall raised app_silent ${silent.length}x (de-duplicated), nothing else fired`);

  // Data gaps
  const gaps = stateGaps(stateRows);
  assert.deepStrictEqual(gaps.map((g: any) => [g.from, g.to]), [['11:02', '11:21']]);
  ok('debrief finds exactly the 11:02–11:21 gap');

  // Scorecard
  const card = scoreDay(DATE, { orders: [], fills: [], exits: [{ symbol: 'A', exitPrice: 120, quantity: 65, timestamp: 2 }], gates: [], premarket: [] });
  assert.strictEqual(card.metrics.totalTrades, 1);
  const legacy = tradesFrom({ fills: [{ symbol: 'A', avgPrice: 100, timestamp: 1, side: 'BUY' }], exits: [{ symbol: 'A', avgPrice: 110, quantity: 65, timestamp: 2 }] });
  assert.strictEqual(legacy[0].pnl, 650);
  ok('scorecard pairs both the new exit rows and the legacy fill/exit shape');

  // Debrief
  const data = buildDebriefData(DATE);
  assert.strictEqual(data.card.metrics.totalTrades, 1);
  assert.strictEqual(data.card.metrics.netPnl, 975);
  assert.ok(data.sniper.everCanEnter);
  assert.deepStrictEqual(data.momentum.topBlocks.map((b: any) => b[0]).sort(), ['fresh-snapshot', 'history-anchors', 'score']);
  const md = renderDebrief(data, 'One Sniper trade hit target.');
  for (const heading of ['## What happened', '## What was skipped and why', '## Data gaps and alerts', '## Narrative (model-written']) {
    assert.ok(md.includes(heading), heading);
  }
  assert.match(md, /11:02–11:21/);
  assert.match(md, /exit price from last mark/);
  assert.match(md, /far too few/);
  assert.doesNotMatch(md, /should (raise|lower|change)|increase the threshold/i);
  ok('debrief.md has the three sections, the gap, the trade, and no tuning advice');

  const runnerLog = join(dir, 'runner.log');
  if (existsSync(runnerLog)) assert.ok(readFileSync(runnerLog, 'utf8').length > 0);

  console.log(`\n✅ PASS — ${passed} day replay checks\n`);
}

try {
  run();
} catch (err) {
  console.error('❌ FAIL', err);
  process.exitCode = 1;
} finally {
  rmSync(root, { recursive: true, force: true });
}
