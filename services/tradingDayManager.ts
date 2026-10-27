/**
 * TRADING DAY MANAGER
 * Replaces manual Reset -> Import -> AI Capabilities dance with an idempotent daily state transition.
 */

import { isDayScopedKey } from './storageScopes';
import { dbService } from './db';

export function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function getISTHour(): number {
  return parseInt(
    new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }).format(new Date()),
    10
  );
}

export interface NewTradingDayResult {
  transitioned: boolean;
  tradingDay: string;
  clearedKeys: string[];
}

/**
 * Checks if a new trading day has started.
 * When time > 07:00 IST and date has changed (or force is true):
 * Clears day-scoped keys and IndexedDB while preserving credentials and durable settings.
 */
export async function startNewTradingDay(options: { force?: boolean } = {}): Promise<NewTradingDayResult> {
  if (typeof localStorage === 'undefined') {
    return { transitioned: false, tradingDay: getTodayIST(), clearedKeys: [] };
  }

  const today = getTodayIST();
  const storedDay = localStorage.getItem('trading_day');
  const hour = getISTHour();

  const shouldTransition = options.force || (storedDay !== today && hour >= 7);

  if (!shouldTransition) {
    return { transitioned: false, tradingDay: storedDay || today, clearedKeys: [] };
  }

  console.log(`[TradingDay] Starting new trading day for ${today} (previous: ${storedDay || 'NONE'}, force=${Boolean(options.force)})`);

  // 1. Clear day-scoped localStorage keys
  const clearedKeys: string[] = [];
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }

  for (const key of allKeys) {
    if (isDayScopedKey(key)) {
      localStorage.removeItem(key);
      clearedKeys.push(key);
    }
  }

  // 2. Clear day-scoped IndexedDB tables
  try {
    await dbService.clearAll();
  } catch (err: any) {
    console.warn('[TradingDay] IndexedDB clear warning:', err.message);
  }

  // 3. Update trading_day marker
  localStorage.setItem('trading_day', today);

  console.log(`[TradingDay] ✅ New trading day initialized for ${today}. Cleared ${clearedKeys.length} day-scoped keys.`);

  return {
    transitioned: true,
    tradingDay: today,
    clearedKeys
  };
}
