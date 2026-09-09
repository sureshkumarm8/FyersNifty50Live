/**
 * MARKET SESSION — the single answer to "is the market actually trading right now?"
 *
 * Both AutoTrade panels need to wake themselves up when the session opens rather
 * than waiting for someone to press Start. They previously did not, which is why
 * a perfect setup could pass untouched: the engines were simply never running.
 *
 * The check is deliberately conservative. It is derived from IST wall-clock time,
 * which is the same clock the sniper protocol is written against, and it treats
 * weekends as closed. Exchange holidays are not modelled here — on a holiday the
 * feed produces no fresh snapshots, so the engines find nothing to act on.
 */

import { istMinutesOf, MARKET_OPEN } from './sniperEngine';

/** 15:30 IST — the closing bell. */
export const MARKET_CLOSE = 15 * 60 + 30;

/** IST day-of-week, 0 = Sunday. Computed without mutating the caller's Date. */
function istWeekday(now: Date): number {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist.getDay();
}

/** True between 09:15 and 15:30 IST on a weekday. */
export function isMarketLive(now: Date = new Date()): boolean {
  const day = istWeekday(now);
  if (day === 0 || day === 6) return false;
  const mins = istMinutesOf(now);
  return mins >= MARKET_OPEN && mins < MARKET_CLOSE;
}

/**
 * A boolean preference in localStorage that defaults to ON.
 *
 * Auto-start has to survive a reload without the user re-enabling it every
 * morning, and an unset key must mean "on" — otherwise the very first session
 * after this change would still sit idle, which is the bug being fixed.
 */
export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === 'true';
  } catch {
    return fallback;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage disabled — the in-memory state still drives this session */
  }
}
