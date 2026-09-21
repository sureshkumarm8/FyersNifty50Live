/**
 * The history log's Str columns must stay readable across a whole session.
 *
 * The regression this pins: on 2026-09-21 Put Str printed +40,055% because the
 * old formula divided by the session sell DELTA, which crosses zero mid-session.
 * A metric with a pole cannot be read off a log to judge trend, and it silently
 * dominated the AutoTrade score (25% weight on a term pinned at its ±100 rail).
 */

import assert from 'node:assert';
import { dayStrength, sideChangePct, isBaselineAnchorable, BASELINE_ANCHOR_MINUTES } from '../services/marketStrength';

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

test('the baseline anchors only after the book settles', () => {
  const ist = (h: number, m: number) =>
    new Date(`2026-09-21T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00+05:30`);
  assert.strictEqual(isBaselineAnchorable(ist(8, 24)), false, '08:24 pre-market must not anchor');
  assert.strictEqual(isBaselineAnchorable(ist(9, 14)), false, '09:14 pre-open must not anchor');
  // 09:20-09:45 is inside the bid:ask normalisation decay; anchoring there put
  // a -45 to -57 structural slope through the rest of the session.
  assert.strictEqual(isBaselineAnchorable(ist(9, 20)), false, '09:20 is inside the opening decay');
  assert.strictEqual(isBaselineAnchorable(ist(9, 45)), false, '09:45 is still inside the decay');
  assert.strictEqual(isBaselineAnchorable(ist(10, 0)), true, '10:00 must anchor');
  assert.strictEqual(BASELINE_ANCHOR_MINUTES, 10 * 60);
});

test('the pre-market baseline artifact is what anchoring prevents', () => {
  // 2026-09-16: 6.58M call bid at 08:24 -> 46.38M at 09:17, market opening.
  const stub = dayStrength(46_380_000, 6_580_000, 4_800_000, 6_650_000);
  assert.ok(stub > 600, `pre-market anchor should read as a huge artifact, got ${stub}`);
  // Anchored at the open instead, the same book is a normal reading.
  const anchored = dayStrength(46_380_000, 46_380_000, 4_800_000, 4_800_000);
  assert.strictEqual(anchored, 0);
});

console.log(`${passed} passed\n`);
