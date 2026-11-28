#!/usr/bin/env node
/**
 * Screenshot the app as the user sees it, from their own Chrome over the
 * remote-debugging port (chrome://inspect → Allow remote debugging).
 *
 * Look-only: it scrolls the page's scroll container to capture each screen,
 * then puts the scroll position back. It never clicks, types or writes storage.
 *
 *   node scripts/cdpShot.mjs <outDir> [--selector "<css>"] [--tab "<nav button text>"]
 *
 * --tab switches the app's view by pressing that top-bar button (navigation only).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const outDir = process.argv[2] || '.';
const selIdx = process.argv.indexOf('--selector');
const SELECTOR = selIdx > 0 ? process.argv[selIdx + 1] : null;
const tabIdx = process.argv.indexOf('--tab');
const TAB = tabIdx > 0 ? process.argv[tabIdx + 1] : null;
const APP = process.env.APP_ORIGIN || 'http://localhost:5173';
const [port, wsPath] = fs.readFileSync(path.join(os.homedir(), 'Library/Application Support/Google/Chrome/DevToolsActivePort'), 'utf8').trim().split('\n');
fs.mkdirSync(outDir, { recursive: true });

const ws = new WebSocket(`ws://127.0.0.1:${port}${wsPath}`);
let id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
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
ws.onerror = () => { console.error('Cannot reach Chrome on port', port); process.exit(1); };

const evalJs = async (sessionId, expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

ws.onopen = async () => {
  try {
    const { targetInfos } = await send('Target.getTargets');
    const page = targetInfos.find(t => t.type === 'page' && t.url.startsWith(APP));
    if (!page) throw new Error(`No app tab at ${APP}`);
    const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
    if (TAB) {
      const ok = await evalJs(sessionId, `(() => { const b = [...document.querySelectorAll('header button')].find(x => x.textContent.trim() === ${JSON.stringify(TAB)}); if (b) b.click(); return !!b; })()`);
      if (!ok) throw new Error(`No top-bar button "${TAB}"`);
      await new Promise(r => setTimeout(r, 2500));
    }
    // The tallest scrollable element is the screen's scroll container unless one is given.
    const find = SELECTOR
      ? `document.querySelector(${JSON.stringify(SELECTOR)})`
      : `[...document.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]`;
    const info = await evalJs(sessionId, `(() => { const el = ${find}; window.__shotEl = el; if (!el) return null;
      return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, top: el.scrollTop, vw: innerWidth, vh: innerHeight }; })()`);
    console.log('tab', page.url, 'container', JSON.stringify(info));
    const shots = [];
    const steps = info ? Math.min(12, Math.ceil(info.scrollHeight / info.clientHeight)) : 1;
    for (let i = 0; i < steps; i++) {
      if (info) await evalJs(sessionId, `window.__shotEl.scrollTop = ${i * info.clientHeight}; true`);
      await new Promise(r => setTimeout(r, 400));
      const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
      const f = path.join(outDir, `screen-${String(i + 1).padStart(2, '0')}.png`);
      fs.writeFileSync(f, Buffer.from(data, 'base64'));
      shots.push(f);
    }
    if (info) await evalJs(sessionId, `window.__shotEl.scrollTop = ${info.top}; delete window.__shotEl; true`);
    else await evalJs(sessionId, 'delete window.__shotEl; true');
    await send('Target.detachFromTarget', { sessionId });
    console.log(shots.join('\n'));
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exitCode = 1;
  } finally {
    ws.close();
  }
};
