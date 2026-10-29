/**
 * APPEND-ONLY DAY JOURNAL — TradingJournal/<IST date>/<stream>.jsonl
 *
 * Browser streams arrive through POST /api/journal/:stream and must be one of
 * BROWSER_STREAMS (the `JournalStream` union in services/journal.ts). Server
 * streams (state, ops, charts) are written only by server-side code.
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureJournalDir, findJournalDir, istDateStr } from './time.mjs';

/** Keep in step with JOURNAL_STREAMS in services/journal.ts (ml/journalEndpoint.test.ts checks it). */
export const BROWSER_STREAMS = Object.freeze([
  'decisions', 'gates', 'orders', 'fills', 'exits', 'premarket', 'vision', 'alerts'
]);

export const SERVER_STREAMS = Object.freeze(['state', 'ops', 'charts']);

const ALL_STREAMS = new Set([...BROWSER_STREAMS, ...SERVER_STREAMS]);

export function isBrowserStream(stream) {
  return BROWSER_STREAMS.includes(stream);
}

/** Append one record. Returns `{ filePath, record }`. Throws on an unknown stream. */
export function appendJournal(stream, payload = {}, now = Date.now()) {
  if (!ALL_STREAMS.has(stream)) throw new Error(`Unknown journal stream: ${stream}`);
  const dir = ensureJournalDir(istDateStr(now));
  const filePath = join(dir, `${stream}.jsonl`);
  const record = { timestamp: now, isoTime: new Date(now).toISOString(), ...payload };
  appendFileSync(filePath, JSON.stringify(record) + '\n');
  return { filePath, record };
}

export function readJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  const out = [];
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    if (!line) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* a torn last line from a crash must not hide the rest of the day */
    }
  }
  return out;
}

/**
 * Read a stream for a date. `since` (ms) filters on `timestamp`; `limit` keeps
 * the NEWEST rows, because "what happened last" is the usual question.
 */
export function readJournal(stream, { date = istDateStr(), since = 0, limit = 200 } = {}) {
  if (!ALL_STREAMS.has(stream)) throw new Error(`Unknown journal stream: ${stream}`);
  const rows = readJsonl(join(findJournalDir(date), `${stream}.jsonl`))
    .filter(r => !since || (Number(r.timestamp) || 0) >= since);
  return limit > 0 ? rows.slice(-limit) : rows;
}

/** Write a whole file into today's folder (debrief.md, scorecard.json). Name is not a path. */
export function writeJournalFile(name, content, date = istDateStr()) {
  if (!/^[a-z0-9_.-]+$/i.test(name) || name.includes('..')) throw new Error(`Bad journal file name: ${name}`);
  const filePath = join(ensureJournalDir(date), name);
  writeFileSync(filePath, content);
  return filePath;
}
