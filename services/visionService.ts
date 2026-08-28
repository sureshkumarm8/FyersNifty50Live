import { VisionRun, VisionStatus } from '../types';

/**
 * Client for the local chart-capture + vision-analysis sidecar.
 *
 * The engine itself (Playwright driving a real Chrome with your broker logins,
 * plus an Ollama vision model) runs as a separate local process and is reached
 * through the dev proxy at /api/vision. It is intentionally unavailable in a
 * deployed build - the UI degrades to setup instructions in that case.
 */

const BASE = '/api/vision';

export class VisionSidecarOfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisionSidecarOfflineError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init
    });
  } catch (error: any) {
    throw new VisionSidecarOfflineError(
      `Cannot reach the dashboard server. Start it with "npm run server". (${error?.message || error})`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // A non-JSON reply means the SPA fallback answered - the proxy route is absent,
    // which is what happens in a deployed build with no local server.
    throw new VisionSidecarOfflineError(
      'The vision capture engine is not available in this deployment. It only runs locally.'
    );
  }

  const data = await response.json();

  if (!response.ok) {
    if (data?.error === 'vision_sidecar_unreachable') {
      throw new VisionSidecarOfflineError(data.message);
    }
    throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  }

  return data as T;
}

/** Resolves a sidecar-relative screenshot path onto the proxy. */
export function shotUrl(shotPath?: string): string | null {
  if (!shotPath) return null;
  return `${BASE}${shotPath.startsWith('/') ? shotPath : `/${shotPath}`}`;
}

export const visionService = {
  getStatus: () => request<VisionStatus>('/status'),

  getHistory: (limit = 30) => request<VisionRun[]>(`/history?limit=${limit}`),

  getLatest: () => request<VisionRun | null>('/latest'),

  runNow: () => request<VisionRun>('/run-now', { method: 'POST' }),

  pause: () => request<VisionStatus>('/pause', { method: 'POST' }),

  resume: () => request<VisionStatus>('/resume', { method: 'POST' }),

  setInterval: (minutes: number) =>
    request<VisionStatus>('/interval', { method: 'POST', body: JSON.stringify({ minutes }) }),

  clearHistory: () => request<{ ok: boolean; runs: number; shots: number }>('/history', { method: 'DELETE' }),

  unloadModel: () => request<{ ok: boolean }>('/ollama/unload', { method: 'POST' }),

  /** Pops the capture browser back onto screen (for a manual broker login) or tucks it away. */
  setWindowVisible: (visible: boolean) =>
    request<{ ok: boolean; windowVisible: boolean }>(`/window/${visible ? 'show' : 'hide'}`, { method: 'POST' }),

  reloadTarget: (id: string) => request<{ ok: boolean; url?: string; error?: string }>(`/reload/${id}`, { method: 'POST' }),

  /**
   * Live push of scheduler status and completed runs.
   * Returns an unsubscribe function.
   */
  subscribe(handlers: {
    onStatus?: (status: VisionStatus) => void;
    onRun?: (run: VisionRun) => void;
    onError?: (message: string) => void;
    onOffline?: () => void;
  }): () => void {
    let source: EventSource | null = null;
    try {
      source = new EventSource(`${BASE}/events`);
    } catch {
      handlers.onOffline?.();
      return () => {};
    }

    const parse = <T,>(event: MessageEvent, cb?: (value: T) => void) => {
      if (!cb) return;
      try {
        cb(JSON.parse(event.data) as T);
      } catch {
        /* ignore malformed frame */
      }
    };

    source.addEventListener('status', (e) => parse<VisionStatus>(e as MessageEvent, handlers.onStatus));
    source.addEventListener('run', (e) => parse<VisionRun>(e as MessageEvent, handlers.onRun));
    source.addEventListener('error-event', (e) =>
      parse<{ message: string }>(e as MessageEvent, (v) => handlers.onError?.(v.message))
    );
    source.onerror = () => handlers.onOffline?.();

    return () => source?.close();
  }
};

export default visionService;
