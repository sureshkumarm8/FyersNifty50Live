/**
 * LOOPBACK GUARD.
 *
 * server.js listens on every interface with CORS `*`, and LOCAL_MODE skips
 * auth, so anyone on the same Wi-Fi could reach the kill switch, order
 * placement, the agent chat or the local AI CLIs (which spend LLM credit).
 * Those routes are served only to this machine, and only to pages served from
 * this machine: a loopback socket alone is not enough, because any website
 * open in the browser can POST to localhost.
 */

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function isLoopback(req) {
  return LOOPBACK.has(req?.socket?.remoteAddress || '');
}

/** No Origin (curl, the daemon, same-origin GET) or a localhost origin. */
export function isTrustedOrigin(req) {
  const origin = req?.headers?.origin;
  if (!origin || origin === 'null') return !origin;
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** Paths that must never be reachable from another machine or another site. */
export function isLocalOnlyPath(pathname) {
  return pathname.startsWith('/api/ops/')
    || pathname.startsWith('/api/local-ai/')
    || pathname === '/api/kill'
    || pathname.startsWith('/api/kill/')
    || pathname.startsWith('/api/journal/')
    || pathname === '/api/token-status'
    || pathname.endsWith('/place-order');
}

/** True when the request may proceed. */
export function localOnlyAllowed(req, pathname) {
  if (!isLocalOnlyPath(pathname)) return true;
  return isLoopback(req) && isTrustedOrigin(req);
}
