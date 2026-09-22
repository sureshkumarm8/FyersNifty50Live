/**
 * The history log's Str columns must stay readable across a whole session.
 *
 * The regression this pins: on 2026-09-21 Put Str printed +40,055% because the
 * old formula divided by the session sell DELTA, which crosses zero mid-session.
 * A metric with a pole cannot be read off a log to judge trend, and it silently
 * dominated the AutoTrade score (25% weight on a term pinned at its ±100 rail).
 */

import assert from 'node:assert';
import { dayStrength, sideChangePct, isBaselineAnchorable, isUsableBaseline, shouldAnchorSymbol, BASELINE_ANCHOR_MINUTES } from '../services/marketStrength';

let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${(e as Error).message}`); process.exitCode = 1; }
};

console.log('marketStrength');

test('a book unchanged since the open reads zero', () => {
  assert.strictEqual(dayStrength(100, 100, 50, 50), 0);
});

test('bid growing while ask shrinks is positive', () => {
  // bid +50%, ask -20%  ->  +70
  assert.strictEqual(dayStrength(150, 100, 80, 100), 70);
});

test('both sides growing equally is neutral', () => {
  assert.strictEqual(dayStrength(200, 100, 200, 100), 0);
});

test('the 2026-09-21 spike does not reproduce', () => {
  // Real numbers: put baseline sell 36,237,760; at 11:37 the sell book had
  // drifted back to 36,340,460 — a 102,700 delta against a ~12.7M buy delta.
  // The old formula divided by that delta and printed +12,353.9%.
  const v = dayStrength(140_921_495, 128_188_775, 36_340_460, 36_237_760);
  assert.ok(Math.abs(v) < 100, `expected a readable value, got ${v}`);
  assert.ok(v > 9 && v < 10, `expected ~+9.6, got ${v}`);
});

test('an ask book that crosses its opening level is continuous', () => {
  // Walk the sell book straight through the baseline. The old formula had a
  // pole at the crossing; every step here must stay finite and move smoothly.
  let prev = dayStrength(120, 100, 98, 100);
  for (let sell = 99; sell <= 102; sell++) {
    const v = dayStrength(120, 100, sell, 100);
    assert.ok(Number.isFinite(v), `non-finite at sell=${sell}`);
    assert.ok(Math.abs(v - prev) < 5, `discontinuity at sell=${sell}: ${prev} -> ${v}`);
    prev = v;
  }
});

test('a missing or zero baseline reads zero, not Infinity', () => {
  assert.strictEqual(sideChangePct(500, 0), 0);
  assert.strictEqual(sideChangePct(500, NaN), 0);
  assert.strictEqual(dayStrength(500, 0, 500, 0), 0);
});

const ist = (h: number, m: number) =>
  new Date(`2026-09-22T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`);

test('the baseline anchors from 09:17, never before the open', () => {
  assert.strictEqual(isBaselineAnchorable(ist(8, 24)), false, '08:24 pre-market must not anchor');
  assert.strictEqual(isBaselineAnchorable(ist(9, 10)), false, '09:10 pre-open must not anchor');
  assert.strictEqual(isBaselineAnchorable(ist(9, 16)), false, '09:16 is still too early');
  assert.strictEqual(isBaselineAnchorable(ist(9, 17)), true, '09:17 must anchor');
  assert.strictEqual(isBaselineAnchorable(ist(11, 0)), true, 'a late start must anchor immediately');
  assert.strictEqual(BASELINE_ANCHOR_MINUTES, 9 * 60 + 17);
});

test('a symbol anchors only when its own book is formed', () => {
  // The straggler case: at 09:17 some books have depth and some do not.
  assert.strictEqual(shouldAnchorSymbol(105435, 99981, ist(9, 17)), true, 'formed book at 09:17 anchors');
  assert.strictEqual(shouldAnchorSymbol(0, 61, ist(9, 17)), false, 'half-formed book waits');
  assert.strictEqual(shouldAnchorSymbol(665, 0, ist(9, 17)), false, 'half-formed book waits');
  assert.strictEqual(shouldAnchorSymbol(105435, 99981, ist(9, 16)), false, 'formed but too early');
  // ...and anchors on a later beat once its own book fills.
  assert.strictEqual(shouldAnchorSymbol(98000, 91000, ist(9, 19)), true, 'straggler anchors at 09:19');
});

test('the pre-market baseline artifact is what anchoring prevents', () => {
  // 2026-09-16: 6.58M call bid at 08:24 -> 46.38M at 09:17, market opening.
  const stub = dayStrength(46_380_000, 6_580_000, 4_800_000, 6_650_000);
  assert.ok(stub > 600, `pre-market anchor should read as a huge artifact, got ${stub}`);
  // Anchored at the open instead, the same book is a normal reading.
  const anchored = dayStrength(46_380_000, 46_380_000, 4_800_000, 4_800_000);
  assert.strictEqual(anchored, 0);
});

test('a half-formed pre-open book is not a usable baseline', () => {
  // Real 2026-09-22 09:10 quotes: every constituent had one side at zero.
  assert.strictEqual(isUsableBaseline(0, 61), false, 'ADANIENT buy=0 must be rejected');
  assert.strictEqual(isUsableBaseline(665, 0), false, 'ADANIPORTS sell=0 must be rejected');
  assert.strictEqual(isUsableBaseline(35, 0), false, 'BAJAJ-AUTO sell=0 must be rejected');
  assert.strictEqual(isUsableBaseline(undefined, 100), false);
  assert.strictEqual(isUsableBaseline(NaN, 100), false);
  assert.strictEqual(isUsableBaseline(-5, 100), false);
  assert.strictEqual(isUsableBaseline(105435, 99981), true, 'a real book must be accepted');
});

test('rejecting the stub is what prevents the 163,803% reading', () => {
  // ADANIENT: baseline sell=61, actual book 99,981 fifteen minutes later.
  const stub = dayStrength(105435, 1, 99981, 61);
  assert.ok(Math.abs(stub) > 100000, `the stub baseline really does read absurd: ${stub}`);
  assert.strictEqual(isUsableBaseline(0, 61), false, 'so it must never be used');
});

console.log(`${passed} passed\n`);
