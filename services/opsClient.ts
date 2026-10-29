/**
 * Browser client for the Nifty50Ops routes (/api/ops/*). The chat streams
 * server-sent events over a POST, so it is read with fetch + a stream reader
 * rather than EventSource (which only does GET).
 */

export interface OpsCheck {
  id: string;
  label: string;
  ok: boolean;
  critical: boolean;
  detail: string;
}

export interface OpsHealth {
  asOf: string;
  checks: OpsCheck[];
}

export interface OpsStateReply {
  snapshot: any | null;
  ageSec: number | null;
  stale: boolean;
  receivedAt: number | null;
}

export interface OpsEvent {
  timestamp: number;
  source: 'ops' | 'alerts';
  kind: string;
  [key: string]: any;
}

export type ChatEvent =
  | { type: 'meta'; provider: string; level: number }
  | { type: 'thinking'; step: number; provider?: string; label?: string }
  | { type: 'plan'; step: number; tools: string[]; note?: string }
  | { type: 'stage'; label: string }
  | { type: 'tool_start'; name: string; args: any; label?: string }
  | { type: 'tool'; name: string; args: any; ok: boolean; denied?: boolean; reason?: string; label?: string; summary?: string; ms?: number }
  | { type: 'answer'; text: string; flags: string[] }
  | { type: 'done'; turnId: string; flags: string[]; usage: { inputTokens: number; outputTokens: number } | null }
  | { type: 'error'; error: string };

/** One line of the live "what is it doing" preview. */
export interface ProgressItem {
  kind: 'think' | 'plan' | 'tool' | 'stage';
  name?: string;
  label: string;
  detail?: string;
  status: 'running' | 'done' | 'failed' | 'blocked';
  startedAt: number;
  ms?: number;
}

const settleRunning = (items: ProgressItem[], now: number, status: ProgressItem['status'] = 'done'): ProgressItem[] =>
  items.map(i => (i.status === 'running' ? { ...i, status, ms: now - i.startedAt } : i));

/**
 * Pure: fold one chat event into the progress list. Every step closes the
 * one before it, so exactly one line is "running" at a time.
 */
export function applyProgress(items: ProgressItem[], e: ChatEvent, now = Date.now()): ProgressItem[] {
  switch (e.type) {
    case 'thinking':
      return [...settleRunning(items, now), { kind: 'think', label: e.label || 'Thinking', status: 'running', startedAt: now }];
    case 'plan': {
      const settled = settleRunning(items, now);
      return [
        ...settled,
        {
          kind: 'plan',
          label: e.tools.length ? `Decided to look up: ${e.tools.join(' · ')}` : 'Planning',
          ...(e.note ? { detail: `“${e.note}”` } : {}),
          status: 'done',
          startedAt: now,
          ms: 0
        }
      ];
    }
    case 'stage':
      return [...settleRunning(items, now), { kind: 'stage', label: e.label, status: 'running', startedAt: now }];
    case 'tool_start':
      return [...settleRunning(items, now), { kind: 'tool', name: e.name, label: e.label || e.name, status: 'running', startedAt: now }];
    case 'tool': {
      if (e.denied) {
        return [...settleRunning(items, now), { kind: 'tool', name: e.name, label: e.label || e.name, detail: e.summary || e.reason, status: 'blocked', startedAt: now, ms: 0 }];
      }
      let idx = -1;
      items.forEach((i, k) => { if (i.kind === 'tool' && i.name === e.name && i.status === 'running') idx = k; });
      const done: ProgressItem = {
        kind: 'tool', name: e.name, label: e.label || e.name, detail: e.summary,
        status: e.ok ? 'done' : 'failed', startedAt: idx >= 0 ? items[idx].startedAt : now, ms: e.ms ?? 0
      };
      return idx >= 0 ? items.map((i, k) => (k === idx ? done : i)) : [...items, done];
    }
    case 'answer':
      return settleRunning(items, now);
    case 'error':
      return settleRunning(items, now, 'failed');
    default:
      return items;
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchOpsHealth = () => getJson<OpsHealth>('/api/ops/health');
export const fetchOpsState = () => getJson<OpsStateReply>('/api/ops/state');

export interface OpsConfig {
  provider: string;
  model: string | null;
  /** settings = picked in the app; env = OPS_AI_PROVIDER in .env.local; auto = Gemini key, else Ollama */
  source: 'settings' | 'env' | 'auto';
  supported: string[];
  chatLevel: number;
  daemonLevel: number;
}

export const fetchOpsConfig = () => getJson<OpsConfig>('/api/ops/config');

/** Make the ops agent (chat and daemon) use the provider picked in Settings. */
export async function saveOpsProvider(provider: string, model: string | null): Promise<OpsConfig> {
  const res = await fetch('/api/ops/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model })
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) throw new Error('The app server is running older code. Restart `npm run dev`.');
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body as OpsConfig;
}

export const fetchOpsEvents = (since = 0) =>
  getJson<{ events: OpsEvent[] }>(`/api/ops/events?since=${since}`).then(r => r.events);

/** Pure: split an SSE buffer into complete `data:` events and the unfinished tail. */
export function parseSse(buffer: string): { events: ChatEvent[]; rest: string } {
  const events: ChatEvent[] = [];
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  for (const block of blocks) {
    const data = block
      .split('\n')
      .filter(l => l.startsWith('data:'))
      .map(l => l.slice(5).trimStart())
      .join('\n');
    if (!data) continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      /* skip a malformed frame */
    }
  }
  return { events, rest };
}

export async function askOps(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch('/api/ops/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history }),
    signal
  });
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSse(buffer);
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
  parseSse(buffer + '\n\n').events.forEach(onEvent);
}
