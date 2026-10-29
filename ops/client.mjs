/**
 * THE ONLY NETWORK ROUTE THE AGENT'S TOOLS HAVE.
 *
 * Tools never call `fetch` themselves; they get this client, which talks only
 * to this machine's server and only on an allowlist. Order placement, order
 * books and the kill switch are refused here regardless of autonomy level, so
 * a bug in a tool (or a prompt injection that reaches one) cannot place a trade.
 */

const GET_ALLOW = [
  /^\/api\/token-status$/,
  /^\/api\/kill\/status$/,
  /^\/api\/ops\/state$/,
  /^\/api\/get-redis-data$/,
  /^\/api\/vision\/(status|latest|history)(\?.*)?$/,
  /^\/api\/vision-snapshot-file\/[^/]+$/,
  /^\/api\/(fyers|paytm)\/positions$/
];

const POST_ALLOW = [/^\/api\/vision\/snapshots$/];

/** Never reachable from a tool, whatever the allowlists above say. */
export const FORBIDDEN = /place-order|\/orders(\/|$)|^\/api\/kill$|\/api\/ops\/chat/;

export function isAllowed(method, path) {
  if (FORBIDDEN.test(path)) return false;
  const list = method === 'GET' ? GET_ALLOW : method === 'POST' ? POST_ALLOW : [];
  return list.some(re => re.test(path));
}

export function createOpsClient(base, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const call = async (method, path, body, { raw = false, timeout = timeoutMs } = {}) => {
    if (!isAllowed(method, path)) throw new Error(`ops client refused ${method} ${path}`);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetchImpl(`${base}${path}`, {
        method,
        signal: ctrl.signal,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      if (raw) return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
      return { ok: res.ok, status: res.status, json };
    } catch (err) {
      if (raw) return null;
      return { ok: false, status: 0, json: null, error: err.name === 'AbortError' ? 'timeout' : err.message };
    } finally {
      clearTimeout(timer);
    }
  };
  return {
    get: path => call('GET', path),
    post: (path, body) => call('POST', path, body ?? {}, { timeout: 120_000 }),
    getBytes: path => call('GET', path, undefined, { raw: true })
  };
}
