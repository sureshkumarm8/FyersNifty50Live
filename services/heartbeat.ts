/**
 * WORKER-DRIVEN HEARTBEAT.
 *
 * Main-thread setInterval/setTimeout is throttled to roughly once a minute when
 * the tab is hidden — switched to another tab, another window, or another app.
 * That silently stalls the data fetch, the momentum scan and the stop/target
 * exit monitor exactly when the user is not looking, which is the worst possible
 * time for AutoTrade to freeze.
 *
 * A dedicated Web Worker's timer is not throttled the same way, and a worker
 * message wakes the main thread even while it is hidden, so the actual work
 * still runs. We therefore run a single 1s ticker inside a worker and fan its
 * ticks out to every subscriber on the main thread.
 *
 * Note: under very long deep-background (Chrome "intensive throttling" after
 * ~5 min hidden, or OS sleep) even worker timers can slow down. This removes
 * the immediate main-thread throttling — the dominant cause of the stalls — but
 * a machine that is asleep still cannot fetch.
 */

type Cb = () => void;

const subscribers = new Set<Cb>();
let worker: Worker | null = null;
let fallbackId: number | null = null;

const WORKER_SRC = `
let id = null;
self.onmessage = (e) => {
  if (e.data === 'start') { if (!id) id = setInterval(function () { postMessage(0); }, 1000); }
  else if (e.data === 'stop') { if (id) { clearInterval(id); id = null; } }
};
`;

function fanout(): void {
  for (const cb of subscribers) {
    try { cb(); } catch { /* one bad subscriber must not stop the rest */ }
  }
}

function ensureTicker(): void {
  if (worker || fallbackId !== null) return;
  try {
    if (typeof Worker !== 'undefined' && typeof URL !== 'undefined' && typeof Blob !== 'undefined') {
      const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }));
      worker = new Worker(url);
      worker.onmessage = fanout;
      worker.postMessage('start');
      return;
    }
  } catch {
    /* fall through to a main-thread ticker */
  }
  // Fallback: still better than nothing, and fine while the tab is visible.
  fallbackId = (typeof window !== 'undefined' ? window.setInterval(fanout, 1000) : null) as number | null;
}

/** Subscribe to the ~1s heartbeat. Returns an unsubscribe function. */
export function onHeartbeat(cb: Cb): () => void {
  ensureTicker();
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

/**
 * Drop-in replacement for `setInterval` that keeps firing while the tab is
 * hidden. Like setInterval, the first call lands one interval after
 * registration. Returns a cleanup function.
 */
export function scheduleBackground(fn: Cb, intervalMs: number): () => void {
  let last = Date.now();
  return onHeartbeat(() => {
    const now = Date.now();
    if (now - last >= intervalMs) { last = now; fn(); }
  });
}
