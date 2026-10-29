/**
 * PRE-MARKET CHART PULL — ask the vision sidecar for its snapshot set and
 * check what came back.
 *
 * A capture can "succeed" while being useless: a logged-out broker page, or
 * the same PNG as last time because the page never refreshed. Each file's
 * size and SHA-256 are compared with the previous pull; an identical hash or a
 * tiny file is rejected. The browser still ingests the charts into the
 * pre-market decision (PreMarketAnalyzer); this only verifies the capture.
 */

import crypto from 'node:crypto';
import { appendJournal, readJournal } from './journal.mjs';
import { istDateStr } from './time.mjs';

const MIN_BYTES = 20_000;

/** Pure: grade one capture against the previous run's hashes. */
export function gradeCaptures(files, previousHashes = {}) {
  return files.map(f => {
    if (!f.ok) return { ...f, accepted: false, why: f.error || 'capture failed' };
    if (!f.bytes || f.bytes < MIN_BYTES) return { ...f, accepted: false, why: `only ${f.bytes ?? 0} bytes (blank or login page?)` };
    const prior = Object.entries(previousHashes).find(([, hash]) => hash === f.sha256);
    if (prior) return { ...f, accepted: false, why: `identical to the previous capture ${prior[0]} (page did not refresh)` };
    return { ...f, accepted: true, why: null };
  });
}

/** Hashes from the most recent pull: today's, else the latest within the past week. */
export function previousHashes(date = istDateStr()) {
  const base = Date.parse(`${date}T12:00:00+05:30`);
  for (let back = 0; back <= 7; back++) {
    const day = istDateStr(base - back * 86_400_000);
    const last = readJournal('charts', { date: day }).filter(r => Array.isArray(r.files) && r.files.length).slice(-1)[0];
    if (last) return Object.fromEntries(last.files.filter(f => f.sha256).map(f => [f.file, f.sha256]));
  }
  return {};
}

/**
 * `post(path, body)` and `getBytes(path)` are injected so this module has no
 * route of its own to the network (see ops/tools.mjs).
 */
export async function pullPremarketCharts({ post, getBytes, sleep = ms => new Promise(r => setTimeout(r, ms)), date = istDateStr() }) {
  let reply = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    reply = await post('/api/vision/snapshots', {});
    if (reply.status !== 409 || attempt === 4) break;
    await sleep(8000); // a scheduled capture holds the browser for a few seconds
  }
  if (!reply || !reply.ok) {
    const out = { at: Date.now(), ok: false, error: reply?.json?.message || reply?.json?.error || `HTTP ${reply?.status ?? '?'}`, files: [] };
    appendJournal('charts', out);
    return out;
  }

  const results = Array.isArray(reply.json?.results) ? reply.json.results : [];
  const files = [];
  for (const item of results) {
    if (!item.ok || !item.file) {
      files.push({ id: item.id ?? null, file: item.file ?? null, ok: false, error: item.error || 'capture failed' });
      continue;
    }
    const bytes = await getBytes(`/api/vision-snapshot-file/${encodeURIComponent(item.file)}`);
    files.push(bytes
      ? { id: item.id ?? null, file: item.file, ok: true, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
      : { id: item.id ?? null, file: item.file, ok: false, error: 'file not readable through the server' });
  }

  const graded = gradeCaptures(files, previousHashes(date));
  const out = {
    at: Date.now(),
    ok: graded.some(f => f.accepted),
    stamp: reply.json?.stamp ?? null,
    accepted: graded.filter(f => f.accepted).length,
    rejected: graded.filter(f => !f.accepted).map(f => ({ file: f.file, why: f.why })),
    files: graded.map(({ id, file, ok, bytes, sha256, accepted }) => ({ id, file, ok, bytes, sha256, accepted }))
  };
  appendJournal('charts', out);
  return out;
}
