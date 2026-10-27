/**
 * STORAGE SCOPES
 * Explicit inventory separating durable settings/credentials from day-scoped market session data.
 */

export const DURABLE_STORAGE_KEYS = new Set([
  'fyers_creds',
  'momentum_settings',
  'sniper_lots',
  'sniper_sound',
  'sniper_autostart',
  'sniper_auto_paper',
  'sniper_auto_live',
  'sniper_interval',
  'autotrade_mode',
  'autotrade_tab',
  'paytm_symbol_mapping',
  'admin_secret',
  'user_trading_protocol',
  'terminal_sound_enabled',
  'vision.archive.autoSync',
  'vision.archive.syncMinutes',
  'trading_day'
]);

export const DAY_SCOPED_KEY_PREFIXES = [
  'sniper_range_',
  'autotrade_killed_',
  'sentiment_history_',
  'ai_view_'
];

export const DAY_SCOPED_STORAGE_KEYS = new Set([
  'sniper_day_state',
  'sniper_armed',
  'sniper_log',
  'sniper_history',
  'sniper_analysis',
  'sniper_is_looping',
  'sniper_orderbook',
  'momentum_session',
  'momentum_orderbook',
  'paper_trading_book_v1',
  'opening_pilot_book_v1',
  'session_baseline',
  'session_data',
  'session_start',
  'preMarketData',
  'snapshot_hashes'
]);

export function isDurableKey(key: string): boolean {
  return DURABLE_STORAGE_KEYS.has(key);
}

export function isDayScopedKey(key: string): boolean {
  if (DAY_SCOPED_STORAGE_KEYS.has(key)) return true;
  return DAY_SCOPED_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
}
