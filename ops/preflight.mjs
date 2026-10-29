/**
 * PRE-FLIGHT AND HEALTH CHECKS — deterministic, no LLM.
 *
 * Extracted from scripts/morningRunner.mjs so the ops agent, the daemon and
 * the runner share one implementation. Each check returns
 * `{ id, label, ok, critical, detail }` and never throws.
 */

import { readFileSync, statfsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { journalRoots, istDateStr, PROJECT_ROOT } from './time.mjs';

export const DEFAULT_BASE = `http://127.0.0.1:${process.env.PORT || 5001}`;

/** A `get(path)` bound to a server base URL. Tools pass ops/client.mjs's `get` instead. */
export const httpGet = (base = DEFAULT_BASE) => path => getJson(`${base}${path}`);

const result = (id, label, ok, detail, critical = false) => ({ id, label, ok, critical, detail });

/** GET JSON with a timeout. Returns `{ ok, status, json, error }`; never throws. */
export async function getJson(url, { timeoutMs = 4000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
    return { ok: res.ok, status: res.status, json, error: null };
  } catch (err) {
    return { ok: false, status: 0, json: null, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

export function checkLotSize() {
  try {
    const src = readFileSync(join(PROJECT_ROOT, 'constants', 'lotSize.ts'), 'utf8');
    const m = /NIFTY_LOT_SIZE\s*=\s*(\d+)/.exec(src);
    const size = m ? Number(m[1]) : null;
    return result('lot_size', 'Nifty lot size', size === 65, size ? `NIFTY_LOT_SIZE = ${size}` : 'NIFTY_LOT_SIZE not found', true);
  } catch (err) {
    return result('lot_size', 'Nifty lot size', false, err.message, true);
  }
}

export async function checkExpiry(today = istDateStr()) {
  try {
    const src = readFileSync(join(PROJECT_ROOT, 'constants', 'generated', 'niftyWeeklyOptions.js'), 'utf8');
    const m = /CURRENT_EXPIRY_DATE\s*=\s*['"]([^'"]+)['"]/.exec(src);
    if (!m) return result('expiry', 'Weekly expiry', false, 'CURRENT_EXPIRY_DATE not found', true);
    const expiry = m[1];
    return expiry < today
      ? result('expiry', 'Weekly expiry', false, `CURRENT_EXPIRY_DATE ${expiry} is in the past — run npm run generate:options`, true)
      : result('expiry', 'Weekly expiry', true, `CURRENT_EXPIRY_DATE ${expiry}`, true);
  } catch (err) {
    return result('expiry', 'Weekly expiry', false, err.message, true);
  }
}

export function checkDisk(minFreeGb = 2) {
  for (const path of [...journalRoots().map(r => dirname(r)), PROJECT_ROOT]) {
    try {
      const s = statfsSync(path);
      const freeGb = (s.bavail * s.bsize) / 1e9;
      return result('disk', 'Disk space', freeGb >= minFreeGb, `${freeGb.toFixed(1)} GB free`);
    } catch {
      /* try the next candidate */
    }
  }
  return result('disk', 'Disk space', false, 'could not stat the journal volume');
}

export async function checkServer(get = httpGet()) {
  const r = await get('/api/token-status');
  return result('server', 'Node server', r.status > 0 && r.status < 500, r.status ? `HTTP ${r.status}` : r.error, true);
}

/** /api/token-status answers `{ paytm: { present }, fyers: { present } }`. */
export async function checkToken(get = httpGet()) {
  const r = await get('/api/token-status');
  if (!r.ok || !r.json) return result('token', 'Broker token', false, r.error || `HTTP ${r.status}`);
  const paytm = Boolean(r.json.paytm?.present);
  const fyers = Boolean(r.json.fyers?.present);
  return result(
    'token', 'Broker token', paytm || fyers,
    `PayTM ${paytm ? `present (${r.json.paytm.source})` : 'missing'} · Fyers ${fyers ? `present (${r.json.fyers.source})` : 'missing'}`
  );
}

export async function checkKill(get = httpGet()) {
  const r = await get('/api/kill/status');
  if (!r.ok || !r.json) return result('kill', 'Kill switch', false, r.error || `HTTP ${r.status}`);
  return result('kill', 'Kill switch', !r.json.killed,
    r.json.killed ? `LATCHED for ${r.json.date}: ${r.json.details?.reason ?? 'no reason recorded'}` : `clear for ${r.json.date}`);
}

export async function checkSidecar(get = httpGet()) {
  const r = await get('/api/vision/status');
  return result('sidecar', 'Vision sidecar :4321', r.ok, r.ok ? 'reachable' : (r.json?.message || r.error || `HTTP ${r.status}`));
}

export async function checkVite(url = 'http://127.0.0.1:5173/') {
  const r = await getJson(url, { timeoutMs: 2000 });
  return result('vite', 'App (Vite :5173)', r.status > 0 && r.status < 500, r.status ? `HTTP ${r.status}` : r.error);
}

export async function checkRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return result('redis', 'Redis', false, 'no Redis credentials in the environment');
  try {
    const { Redis } = await import('@upstash/redis');
    const started = Date.now();
    await Promise.race([
      new Redis({ url, token }).get('ops:ping'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
    ]);
    return result('redis', 'Redis', true, `answered in ${Date.now() - started} ms`);
  } catch (err) {
    return result('redis', 'Redis', false, err.message);
  }
}

/** The 08:35 pre-flight. `ok` is false if any critical check failed. */
export async function runPreflight({ get = httpGet(), today = istDateStr() } = {}) {
  const checks = [
    checkLotSize(),
    await checkExpiry(today),
    checkDisk(),
    ...(await Promise.all([checkServer(get), checkToken(get), checkKill(get), checkRedis(), checkSidecar(get), checkVite()]))
  ];
  return {
    at: Date.now(),
    ok: checks.every(c => c.ok || !c.critical),
    failedCritical: checks.filter(c => c.critical && !c.ok).map(c => c.id),
    warnings: checks.filter(c => !c.critical && !c.ok).map(c => c.id),
    checks
  };
}
