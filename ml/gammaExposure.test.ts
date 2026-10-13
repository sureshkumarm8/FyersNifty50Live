import assert from 'node:assert/strict';
import { calculateGamma, calculateGexProfile } from '../services/gammaExposure';
import { FyersQuote } from '../types';

let passed = 0;
function test(label: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok    ${label}`);
}

console.log('Testing Gamma Exposure & Zero-Gamma Flip Calculations:');

test('Black-Scholes Gamma calculates reasonable value for ATM strike', () => {
  const spot = 22500;
  const strike = 22500;
  const timeToExpiryYears = 2 / 365; // 2 days
  const gamma = calculateGamma(spot, strike, timeToExpiryYears);

  assert.ok(gamma > 0, 'ATM gamma must be positive');
  assert.ok(Number.isFinite(gamma), 'Gamma must be finite');

  // OTM strike should have lower gamma than ATM
  const otmGamma = calculateGamma(spot, 23000, timeToExpiryYears);
  assert.ok(gamma > otmGamma, 'ATM gamma must exceed OTM gamma');
});

test('calculateGexProfile returns expected profile and detects regime', () => {
  const spot = 22500;
  const mockQuotes: FyersQuote[] = [
    // 22400 PE heavy
    { symbol: 'NSE:NIFTY2692222400PE', lp: 45, volume: 50000, oi: 1000000, ask: 46, bid: 45, ch: 0, chp: 0, description: '', exchange: 'NSE', fyToken: '1', high_price: 50, low_price: 40, open_price: 45, original_name: '', prev_close_price: 45, short_name: '', spread: 1, tt: 0 },
    // 22500 CE & PE
    { symbol: 'NSE:NIFTY2692222500CE', lp: 80, volume: 80000, oi: 800000, ask: 81, bid: 80, ch: 0, chp: 0, description: '', exchange: 'NSE', fyToken: '2', high_price: 85, low_price: 75, open_price: 80, original_name: '', prev_close_price: 80, short_name: '', spread: 1, tt: 0 },
    { symbol: 'NSE:NIFTY2692222500PE', lp: 75, volume: 75000, oi: 600000, ask: 76, bid: 75, ch: 0, chp: 0, description: '', exchange: 'NSE', fyToken: '3', high_price: 80, low_price: 70, open_price: 75, original_name: '', prev_close_price: 75, short_name: '', spread: 1, tt: 0 },
    // 22600 CE heavy
    { symbol: 'NSE:NIFTY2692222600CE', lp: 30, volume: 60000, oi: 1200000, ask: 31, bid: 30, ch: 0, chp: 0, description: '', exchange: 'NSE', fyToken: '4', high_price: 35, low_price: 25, open_price: 30, original_name: '', prev_close_price: 30, short_name: '', spread: 1, tt: 0 },
  ];

  const profile = calculateGexProfile(mockQuotes, spot, 2);

  assert.equal(profile.spot, 22500);
  assert.equal(profile.strikes.length, 3);
  assert.ok(profile.majorCallWallGex === 22600 || profile.majorCallWallGex === 22500);
  assert.ok(profile.majorPutWallGex === 22400 || profile.majorPutWallGex === 22500);
  assert.ok(['LONG_GAMMA', 'SHORT_GAMMA', 'NEUTRAL'].includes(profile.regime));
});

test('handles empty or zero quotes without crashing', () => {
  const empty = calculateGexProfile([], 22500);
  assert.equal(empty.regime, 'NEUTRAL');
  assert.equal(empty.strikes.length, 0);
  assert.equal(empty.zeroGammaFlipLevel, null);
});

console.log(`\nAll ${passed} GEX tests passed successfully.`);
