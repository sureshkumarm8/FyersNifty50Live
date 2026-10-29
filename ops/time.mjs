/**
 * IST CLOCK AND JOURNAL LOCATION — shared by server.js, the ops agent and the daemon.
 *
 * Every per-day folder is keyed by the IST date. The journal endpoint used the
 * UTC date, so anything written between 00:00 and 05:30 IST landed in
 * yesterday's folder; the kill switch had the same split. One helper, one key.
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** YYYY-MM-DD in IST. */
export function istDateStr(ms = Date.now()) {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since IST midnight. */
export function istMinutes(ms = Date.now()) {
  const d = new Date(ms + IST_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** HH:MM:SS in IST, for human-facing timestamps. */
export function istTimeStr(ms = Date.now()) {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(11, 19);
}

/** 0 = Sunday … 6 = Saturday, in IST. */
export function istWeekday(ms = Date.now()) {
  return new Date(ms + IST_OFFSET_MS).getUTCDay();
}

export const hhmm = (h, m) => h * 60 + m;

let holidayCache = null;

/**
 * NSE holidays, read from constants/nseHolidays.ts so there is one list to
 * maintain. A missing or unreadable file means "no holidays known", which
 * fails toward running the routine rather than silently skipping a session.
 */
export function nseHolidays() {
  if (holidayCache) return holidayCache;
  try {
    const src = readFileSync(join(PROJECT_ROOT, 'constants', 'nseHolidays.ts'), 'utf8');
    holidayCache = new Set(src.match(/\d{4}-\d{2}-\d{2}/g) || []);
  } catch {
    holidayCache = new Set();
  }
  return holidayCache;
}

export function isTradingDay(ms = Date.now()) {
  const wd = istWeekday(ms);
  if (wd === 0 || wd === 6) return false;
  return !nseHolidays().has(istDateStr(ms));
}

/**
 * Journal root. `OPS_JOURNAL_ROOT` wins; otherwise ~/TradingJournal, falling
 * back to the project's own TradingJournal/ when the home folder is not
 * writable (which is how the launchd runner has been writing so far).
 */
export function journalRoots() {
  if (process.env.OPS_JOURNAL_ROOT) return [process.env.OPS_JOURNAL_ROOT];
  return [join(homedir(), 'TradingJournal'), join(PROJECT_ROOT, 'TradingJournal')];
}

/** Folder for reading: the first root that already has this date. */
export function findJournalDir(date = istDateStr()) {
  const roots = journalRoots();
  for (const root of roots) {
    const dir = join(root, date);
    if (existsSync(dir)) return dir;
  }
  return join(roots[roots.length - 1], date);
}

/** Folder for writing, created on demand. Prefers a folder that already exists. */
export function ensureJournalDir(date = istDateStr()) {
  const existing = findJournalDir(date);
  if (existsSync(existing)) return existing;
  let lastErr = null;
  for (const root of journalRoots()) {
    const dir = join(root, date);
    try {
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('No writable journal root');
}
