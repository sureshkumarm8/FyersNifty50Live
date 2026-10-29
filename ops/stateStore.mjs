/**
 * LATEST APP STATE — the browser's OpsStateSnapshot, held in server memory.
 *
 * The paper book, the engines and Opening Pilot live in the browser
 * (IndexedDB/localStorage), so the server cannot see them. The tab that owns
 * the publisher lock POSTs a snapshot every 5 s; this keeps the newest one and
 * appends one row per minute to state.jsonl for the day's record.
 *
 * A stale snapshot is itself the alert: the tab is closed, frozen or the Mac
 * slept. `stale` is computed on the server clock, never the client's.
 */

import { appendJournal } from './journal.mjs';

export const STALE_AFTER_SEC = 20;
const JOURNAL_EVERY_MS = 60_000;

/** Pure: rejects anything that is not a schema-1 snapshot. Returns an error string or null. */
export function validateSnapshot(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return 'snapshot must be an object';
  if (s.schema !== 1) return 'unsupported snapshot schema';
  if (typeof s.tabId !== 'string' || !s.tabId) return 'tabId required';
  if (!Number.isFinite(s.at)) return 'at (client ms) required';
  if (!s.engines || typeof s.engines !== 'object') return 'engines required';
  if (!Array.isArray(s.positions)) return 'positions must be an array';
  return null;
}

export function createStateStore({ journal = appendJournal, now = () => Date.now() } = {}) {
  let latest = null;
  let receivedAt = 0;
  let lastJournalAt = 0;

  return {
    /** Returns null on success or an error string. */
    put(snapshot) {
      const error = validateSnapshot(snapshot);
      if (error) return error;
      latest = snapshot;
      receivedAt = now();
      if (receivedAt - lastJournalAt >= JOURNAL_EVERY_MS) {
        lastJournalAt = receivedAt;
        try {
          journal('state', { receivedAt, snapshot });
        } catch (err) {
          console.warn('[Ops] state.jsonl write failed:', err.message);
        }
      }
      return null;
    },

    get() {
      if (!latest) return { snapshot: null, ageSec: null, stale: true, receivedAt: null };
      const ageSec = Math.round((now() - receivedAt) / 100) / 10;
      return { snapshot: latest, ageSec, stale: ageSec > STALE_AFTER_SEC, receivedAt };
    }
  };
}

/** The server process's single store. */
export const stateStore = createStateStore();
