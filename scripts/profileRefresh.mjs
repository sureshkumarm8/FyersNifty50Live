#!/usr/bin/env node
/**
 * READ-ONLY profiler for the live app tab (http://localhost:5173) over Chrome's
 * remote-debugging port. Listens for SECONDS (default 90) and reports:
 *  - console lines from the refresh cycle (REFRESH DATA CALLED, skipping, LIVE ...)
 *  - main-thread long tasks (>50 ms) via PerformanceObserver
 * It installs a PerformanceObserver and an array on window.__perfProbe; nothing else.
 */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const SECONDS = Number(process.argv[2] || 90);
const APP = process.env.APP_ORIGIN || 'http://localhost:5173';
const [port, wsPath] = fs.readFileSync(path.join(os.homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort'), 'utf8').trim().split('\n');
const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);
let id = 0; const pending = new Map(); const logs = [];
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
const PATTERN = process.env.PATTERN ? new RegExp(process.env.PATTERN, "i") : /REFRESH DATA CALLED|skipping this tick|wedged|LIVE: \d+ stocks|Fetch Strategy|Cycle|took \d+|heartbeat/i;
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); return; }
  if (m.method === 'Runtime.consoleAPICalled') {
    const text = m.params.args.map(a => a.value ?? a.description ?? '').join(' ').trim();
    if (PATTERN.test(text)) logs.push(`${new Date(m.params.timestamp).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })} ${text.slice(0, 160)}`);
  }
};
ws.onopen = async () => {
  const { targetInfos } = await send('Target.getTargets');
  const page = targetInfos.find(t => t.type === 'page' && t.url.startsWith(APP));
  if (!page) { console.error('no app tab at', APP); process.exit(1); }
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  await send('Runtime.evaluate', { expression: `(() => { window.__perfProbe = []; const o = new PerformanceObserver(l => { for (const e of l.getEntries()) window.__perfProbe.push([Math.round(performance.timeOrigin + e.startTime), Math.round(e.duration)]); }); o.observe({ type: 'longtask' }); window.__perfProbeObs = o; return 1; })()` }, sessionId);
  console.log(`listening ${SECONDS}s on ${page.url} ...`);
  setTimeout(async () => {
    const r = await send('Runtime.evaluate', { expression: `(() => { window.__perfProbeObs?.disconnect(); const p = window.__perfProbe || []; delete window.__perfProbe; delete window.__perfProbeObs; return JSON.stringify(p); })()`, returnByValue: true }, sessionId);
    const tasks = JSON.parse(r.result.value);
    await send('Runtime.disable', {}, sessionId); await send('Target.detachFromTarget', { sessionId }); ws.close();
    console.log('\n--- refresh-cycle console lines ---'); logs.forEach(l => console.log(l));
    const total = tasks.reduce((s, t) => s + t[1], 0);
    console.log(`\n--- long tasks: ${tasks.length}, total ${total} ms blocked in ${SECONDS}s (${(total / SECONDS / 10).toFixed(1)}%) ---`);
    tasks.sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([t, d]) => console.log(new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }), d + ' ms'));
  }, SECONDS * 1000);
};
