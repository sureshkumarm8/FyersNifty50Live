import assert from 'node:assert/strict';
import {
  initTrailingState,
  evaluateTrailingStop,
  isTrailingStopTriggered,
  DEFAULT_TRAILING_CONFIG
} from '../services/trailingStopEngine';

let passed = 0;
function test(label: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok    ${label}`);
}

console.log('Testing Dynamic Smart Trailing Stop Engine:');

test('initial state begins with highWaterPremium equal to entry and no trailing stop active', () => {
  const state = initTrailingState(100);
  assert.equal(state.highWaterPremium, 100);
  assert.equal(state.breakevenLocked, false);
  assert.equal(state.currentTrailingStop, null);
  assert.equal(isTrailingStopTriggered(95, state), false);
});

test('small gain under breakeven trigger (e.g. +8% < 12%) updates peak but does not arm trailing stop', () => {
  const initial = initTrailingState(100);
  const state = evaluateTrailingStop(100, 108, initial, DEFAULT_TRAILING_CONFIG);
  assert.equal(state.highWaterPremium, 108);
  assert.equal(state.breakevenLocked, false);
  assert.equal(state.currentTrailingStop, null);
});

test('gain reaching breakevenTriggerPct (+15% >= 12%) locks Stop Loss at entry + 1.5% and arms trail', () => {
  const initial = initTrailingState(100);
  // Premium touches 115 (+15%)
  const state = evaluateTrailingStop(100, 115, initial, DEFAULT_TRAILING_CONFIG);
  assert.equal(state.highWaterPremium, 115);
  assert.equal(state.breakevenLocked, true);

  // Cost + 1.5% = 101.5. Peak * 0.92 = 115 * 0.92 = 105.8. Max is 105.8!
  assert.ok(state.currentTrailingStop !== null);
  assert.ok(state.currentTrailingStop! >= 101.5);
  assert.equal(state.currentTrailingStop, 115 * 0.92);
});

test('trailing stop monotonically ratchets upward and NEVER drops when premium wicks down', () => {
  const initial = initTrailingState(100);
  // 1. Premium climbs to 130 (+30%)
  const state1 = evaluateTrailingStop(100, 130, initial, DEFAULT_TRAILING_CONFIG);
  const stopAt130 = state1.currentTrailingStop!;
  assert.equal(stopAt130, 130 * 0.92); // 119.6

  // 2. Premium pulls back to 124
  const state2 = evaluateTrailingStop(100, 124, state1, DEFAULT_TRAILING_CONFIG);
  assert.equal(state2.highWaterPremium, 130);
  assert.equal(state2.currentTrailingStop, stopAt130, 'Stop must NOT decrease on pullback');

  // 3. Premium breaks out to 150
  const state3 = evaluateTrailingStop(100, 150, state2, DEFAULT_TRAILING_CONFIG);
  assert.equal(state3.highWaterPremium, 150);
  assert.equal(state3.currentTrailingStop, 150 * 0.92); // 138.0
  assert.ok(state3.currentTrailingStop! > stopAt130);
});

test('triggers exit accurately when current premium drops to or below trailing stop', () => {
  const initial = initTrailingState(100);
  const activeState = evaluateTrailingStop(100, 125, initial, DEFAULT_TRAILING_CONFIG);
  // Trail stop = 125 * 0.92 = 115.0
  assert.equal(activeState.currentTrailingStop, 115);

  assert.equal(isTrailingStopTriggered(118, activeState), false);
  assert.equal(isTrailingStopTriggered(115.01, activeState), false);
  assert.equal(isTrailingStopTriggered(115, activeState), true);
  assert.equal(isTrailingStopTriggered(112, activeState), true);
});

test('disabled trailing config preserves original stop behavior', () => {
  const initial = initTrailingState(100);
  const state = evaluateTrailingStop(100, 150, initial, { ...DEFAULT_TRAILING_CONFIG, enableTrailing: false });
  assert.equal(state.currentTrailingStop, null);
  assert.equal(state.breakevenLocked, false);
});

console.log(`\nAll ${passed} Trailing Stop tests passed successfully.`);
