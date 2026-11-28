#!/usr/bin/env node
/**
 * READ-ONLY: prints the Pre-Market chart verdicts and decision the app holds in
 * the running Chrome, over Chrome's remote-debugging port (chrome://inspect →
 * "Allow remote debugging"). It only targets the app tab (APP_ORIGIN, default
 * http://localhost:5173), checks indexedDB.databases() first so it can never
 * create a database, opens at the existing version (aborting any upgrade), and
 * reads in `readonly` transactions. It never writes.
 *
 *   node scripts/readPremarketState.mjs            # summary
 *   node scripts/readPremarketState.mjs --raw      # full JSON (minus image data)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const RAW = process.argv.includes('--raw');
const portFile = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort');
const [port, wsPath] = fs.readFileSync(portFile, 'utf8').trim().split('\n');
const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);

let id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  const p = msg.id && pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
};

const READER = `(async () => {
  // Never call open() on a name that doesn't exist: that would CREATE a database.
  const found = (await indexedDB.databases()).find(d => d.name === 'FyersNifty50');
  if (!found) return JSON.stringify({ error: 'FyersNifty50 database not found on ' + location.origin });
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('FyersNifty50', found.version);
    r.onupgradeneeded = () => { r.transaction.abort(); rej(new Error('upgrade would run - aborted')); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  if (!db.objectStoreNames.contains('preMarketAnalysis')) return JSON.stringify({ error: 'no preMarketAnalysis store' });
  const tx = db.transaction('preMarketAnalysis', 'readonly');
  const store = tx.objectStore('preMarketAnalysis');
  const get = k => new Promise((res, rej) => { const r = store.get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  // All reads are queued in the same tick so the readonly transaction stays alive.
  const req = r => new Promise(res => { r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
  const [keys, meta, decision] = await Promise.all([req(store.getAllKeys()), get('preMarketChartMeta'), get('preMarketDecision')]);
  const imageKeys = db.objectStoreNames.contains('preMarketImages')
    ? await req(db.transaction('preMarketImages', 'readonly').objectStore('preMarketImages').getAllKeys())
    : null;
  const out = { dbVersion: db.version, analysisKeys: keys, imageKeys, meta, decision };
  db.close();
  return JSON.stringify(out, (k, v) => (k === 'data' || k === 'raw') ? undefined : v);
})()`;

const timeout = setTimeout(() => {
  console.error('Timed out. If Chrome showed an "Allow remote debugging" prompt, accept it and re-run.');
  process.exit(2);
}, 60_000);

ws.onopen = async () => {
  try {
    const { targetInfos } = await send('Target.getTargets');
    const APP = process.env.APP_ORIGIN || 'http://localhost:5173';
    const page = targetInfos.find(t => t.type === 'page' && t.url.startsWith(APP));
    if (!page) throw new Error(`No app tab at ${APP} in this Chrome (set APP_ORIGIN to override).`);
    const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
    const { result, exceptionDetails } = await send(
      'Runtime.evaluate',
      { expression: READER, awaitPromise: true, returnByValue: true },
      sessionId
    );
    await send('Target.detachFromTarget', { sessionId });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    const state = JSON.parse(result.value);
    if (state.error) throw new Error(state.error);
    if (RAW) {
      console.log(JSON.stringify(state, null, 2));
    } else {
      console.log(`tab: ${page.url} | db v${state.dbVersion} | analysis keys ${JSON.stringify(state.analysisKeys)} | images ${JSON.stringify(state.imageKeys)}`);
      const meta = state.meta || {};
      for (const [slot, c] of Object.entries(meta)) {
        const v = c?.verdict;
        const t = c?.uploadedAt ? new Date(c.uploadedAt).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }) : '?';
        console.log(`${slot.padEnd(12)} uploaded ${t} | ${v ? `${v.bias} ${v.confidence}% S=${JSON.stringify(v.supports)} R=${JSON.stringify(v.resistances)}` : `NO VERDICT ${c?.error ?? ''}`}`);
      }
      const d = state.decision;
      if (d) {
        console.log(`decision: spot ${d.spot} (${d.spotSource}) basis ${d.basis} | zone ${d.expectedSupport}-${d.expectedResistance} | ${d.playbook?.verdictHeadline ?? ''}`);
        console.log(`  ladder S=${JSON.stringify(d.supports)} R=${JSON.stringify(d.resistances)} | read: ${(d.contributions || []).map(c => c.slot).join(', ')}`);
      } else console.log('decision: none stored');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    ws.close();
  }
};
ws.onerror = e => {
  console.error('Cannot reach Chrome on port', port, '-', e.message || 'connection refused');
  process.exit(1);
};
