#!/usr/bin/env node
/**
 * READ-ONLY export of the app's per-snapshot market history (spot, sentiment,
 * PCR, walls, oiLadder) from IndexedDB `NiftyLiveDB` in the running app tab,
 * over Chrome's remote-debugging port. Writes one JSONL per IST day to
 * ~/TradingJournal/history/<date>.jsonl for replays and backtests.
 *
 * Safety: checks indexedDB.databases() first (never creates a DB), opens at the
 * existing version and aborts if an upgrade would run, uses readonly
 * transactions only. NiftyLiveDB is never written (monitor plan, rule 3).
 *
 *   node scripts/exportHistory.mjs [--list]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LIST = process.argv.includes('--list');
const APP = process.env.APP_ORIGIN || 'http://localhost:5173';
const OUT = path.join(os.homedir(), 'TradingJournal', 'history');
const [port, wsPath] = fs
  .readFileSync(path.join(os.homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort'), 'utf8')
  .trim()
  .split('\n');

const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);
let id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  const p = m.id && pending.get(m.id);
  if (!p) return;
  pending.delete(m.id);
  m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
};

const READER = `(async () => {
  const found = (await indexedDB.databases()).find(d => d.name === 'NiftyLiveDB');
  if (!found) return JSON.stringify({ error: 'NiftyLiveDB not found on ' + location.origin });
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('NiftyLiveDB', found.version);
    r.onupgradeneeded = () => { r.transaction.abort(); rej(new Error('upgrade would run - aborted')); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const req = r => new Promise(res => { r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
  const all = name => db.objectStoreNames.contains(name)
    ? req(db.transaction(name, 'readonly').objectStore(name).getAll())
    : Promise.resolve(null);
  const stores = Array.from(db.objectStoreNames);
  const [today, archives] = await Promise.all([all('today_snapshots'), all('daily_archives')]);
  db.close();
  return JSON.stringify({ stores, today, archives });
})()`;

const istDate = ts => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

ws.onopen = async () => {
  try {
    const { targetInfos } = await send('Target.getTargets');
    const page = targetInfos.find(t => t.type === 'page' && t.url.startsWith(APP));
    if (!page) throw new Error(`No app tab at ${APP}`);
    const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
    const { result, exceptionDetails } = await send(
      'Runtime.evaluate',
      { expression: READER, awaitPromise: true, returnByValue: true },
      sessionId
    );
    await send('Target.detachFromTarget', { sessionId });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    const data = JSON.parse(result.value);
    if (data.error) throw new Error(data.error);

    // Collect snapshots per IST day: archives first, then today's live store.
    const byDay = new Map();
    const add = s => {
      if (!s || typeof s.timestamp !== 'number') return;
      const d = istDate(s.timestamp);
      if (!byDay.has(d)) byDay.set(d, new Map());
      byDay.get(d).set(s.timestamp, s);
    };
    for (const a of data.archives || []) (a.snapshots || a.history || []).forEach(add);
    (data.today || []).forEach(add);

    console.log(`stores: ${data.stores.join(', ')}`);
    console.log(`archives: ${(data.archives || []).map(a => a.date).join(', ') || 'none'}`);
    fs.mkdirSync(OUT, { recursive: true });
    for (const [day, rows] of [...byDay.entries()].sort()) {
      const sorted = [...rows.values()].sort((a, b) => a.timestamp - b.timestamp);
      const withLadder = sorted.filter(r => r.oiLadder).length;
      console.log(`${day}: ${sorted.length} snapshots, ${withLadder} with oiLadder`);
      if (LIST) continue;
      fs.writeFileSync(path.join(OUT, `${day}.jsonl`), sorted.map(r => JSON.stringify(r)).join('\n') + '\n');
    }
    if (!LIST) console.log(`written to ${OUT}`);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    ws.close();
  }
};
ws.onclose = ev => { if (ev.code !== 1000 && ev.code !== 1005) console.error(`connection closed: code ${ev.code} ${ev.reason || ''}`); };
ws.onerror = e => { console.error('websocket error:', e.message || e.type); };
