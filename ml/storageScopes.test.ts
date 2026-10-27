import { isDurableKey, isDayScopedKey, DURABLE_STORAGE_KEYS } from '../services/storageScopes';
import { startNewTradingDay, getTodayIST } from '../services/tradingDayManager';

console.log('\n--- Storage Scopes & New Trading Day Verification Suite ---');

let failed = 0;
function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// 1. Storage Scope categorization
check('fyers_creds is durable', isDurableKey('fyers_creds'));
check('momentum_settings is durable', isDurableKey('momentum_settings'));
check('sniper_lots is durable', isDurableKey('sniper_lots'));
check('trading_day is durable', isDurableKey('trading_day'));

check('sniper_log is day-scoped', isDayScopedKey('sniper_log'));
check('sniper_day_state is day-scoped', isDayScopedKey('sniper_day_state'));
check('sniper_range_2026-10-23 is day-scoped', isDayScopedKey('sniper_range_2026-10-23'));
check('autotrade_killed_2026-10-23 is day-scoped', isDayScopedKey('autotrade_killed_2026-10-23'));

// 2. Simulated LocalStorage mock
const store = new Map<string, string>();
(global as any).localStorage = {
  getItem: (k: string) => store.get(k) || null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => Array.from(store.keys())[i] || null,
  get length() { return store.size; }
};

// Seed credentials and session state
localStorage.setItem('fyers_creds', JSON.stringify({ appId: 'test', accessToken: 'xyz' }));
localStorage.setItem('momentum_settings', JSON.stringify({ lots: 2 }));
localStorage.setItem('sniper_lots', '2');
localStorage.setItem('sniper_log', 'yesterday logs');
localStorage.setItem('sniper_range_yesterday', 'yesterday range');
localStorage.setItem('trading_day', '2026-10-22'); // yesterday

// Execute startNewTradingDay
startNewTradingDay({ force: true }).then(res => {
  check('startNewTradingDay transitioned successfully', res.transitioned);
  check('fyers_creds preserved', localStorage.getItem('fyers_creds') !== null);
  check('momentum_settings preserved', localStorage.getItem('momentum_settings') !== null);
  check('sniper_lots preserved', localStorage.getItem('sniper_lots') === '2');
  check('sniper_log cleared', localStorage.getItem('sniper_log') === null);
  check('sniper_range cleared', localStorage.getItem('sniper_range_yesterday') === null);
  check('trading_day updated to today', localStorage.getItem('trading_day') === getTodayIST());

  // Second call on same day should be idempotent
  return startNewTradingDay();
}).then(res2 => {
  check('Idempotent on second call (no transition)', !res2.transitioned);

  console.log(failed ? '\n❌ FAILED' : '\n✅ PASS — Storage scopes & New Trading Day verified!\n');
  process.exit(failed ? 1 : 0);
}).catch(err => {
  failed++;
  console.log('FAIL: Exception in test:', err);
  process.exit(1);
});
