/**
 * Trend and option flow must describe the SAME window.
 *
 * The regression this pins: `optionsSent` is cumulative since the session
 * anchor, while `trend15m` covers fifteen minutes. Comparing them produced a
 * phantom divergence — production on 2026-09-22 logged twenty consecutive rows
 * of `trend BEARISH/100 · optFlow BULLISH/29-71`, because the morning had been
 * up and the cumulative figure had not unwound. The momentum guard treated that
 * as a TRAP and denied the best setup of the session (10:42:59, score 77.8).
 *
 * Measured over 16/17/21-09, cumulative optionsSent correlates +0.42 / +0.38 /
 * +0.59 with the TRAILING price move: it lags. Differencing over the matched
 * window lifts sign agreement with price from 47% to 83% on the cleanest day.
 */

import assert from 'node:assert';
import { EnhancedSignalGenerator } from '../services/enhancedSignalGenerator';
import type { MarketSnapshot } from '../types';

const AT = Date.parse('2026-09-22T10:42:59+05:30');
const MINUTE = 60_000;
let passed = 0;
const test = (name: string, fn: () => void) => {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${(e as Error).message}`); process.exitCode = 1; }
};

/** `optionsSent` at row i is produced by `flow(i)`, i = 0 newest. */
function rows(flow: (i: number) => number, count = 20): MarketSnapshot[] {
  return Array.from({ length: count }, (_, i) => ({
    time: new Date(AT - i * MINUTE).toISOString(),
    timestamp: AT - i * MINUTE,
    niftyLtp: 23400 - (count - 1 - i) * 3,   // falling into the present
    ptsChg: -3, overallSent: -85, adv: 8, dec: 40, stockSent: -20,
    callSent: 30, putSent: -30, pcr: 1.1,
    optionsSent: flow(i),
    callsBuyQty: 200, callsSellQty: 100, putsBuyQty: 100, putsSellQty: 200,
    callsOI: 1000, putsOI: 1100,
  }));
}

const metricsFor = (h: MarketSnapshot[]) =>
  EnhancedSignalGenerator.generateSignal(h, 23350, 23450, h[0].niftyLtp).metrics;

console.log('signal horizon');

test('a high but unchanged cumulative flow reads NEUTRAL, not BULLISH', () => {
  // The 2026-09-22 shape: Opt Str sitting at +63 all window, price falling.
  const m = metricsFor(rows(() => 63));
  assert.strictEqual(m.trend15m, 'BEARISH', 'price is clearly falling');
  assert.strictEqual(m.optionFlow, 'NEUTRAL',
    `cumulative flow that did not move must not claim a direction (got ${m.optionFlow})`);
  assert.ok(m.optionFlowStrength < 1, `strength should be ~0, got ${m.optionFlowStrength}`);
});

test('a genuine build-up over the window is still detected', () => {
  // optionsSent grows from +(63-19*4) to +63 moving toward the present.
  const m = metricsFor(rows(i => 63 - i * 4));
  assert.strictEqual(m.optionFlow, 'BULLISH', 'a real windowed increase must register');
  assert.ok(m.optionFlowStrength > 20, `expected meaningful strength, got ${m.optionFlowStrength}`);
});

test('a genuine unwind over the window reads BEARISH', () => {
  const m = metricsFor(rows(i => 63 + i * 4));
  assert.strictEqual(m.optionFlow, 'BEARISH', 'a real windowed decrease must register');
});

test('flow and trend are anchored to the same row', () => {
  // Only the last 15 minutes may count. A spike older than the window must not
  // leak into the reading: here flow is flat across the window and only the
  // very oldest rows differ.
  const m = metricsFor(rows(i => (i >= 16 ? 200 : 63), 20));
  assert.strictEqual(m.optionFlow, 'NEUTRAL',
    'a move outside the 15m window must not set the direction');
});

console.log(`${passed} passed\n`);
