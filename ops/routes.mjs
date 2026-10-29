/**
 * /api/ops/* — dispatched from server.js so it does not keep growing.
 * Every route here is loopback-only (enforced in server.js via ops/net.mjs).
 *
 *   POST /api/ops/state    browser snapshot in (services/opsState.ts)
 *   GET  /api/ops/state    { snapshot, ageSec, stale }
 *   GET  /api/ops/health   deterministic health checks, no LLM
 *   GET  /api/ops/events   timeline: daemon runs, notifications, alerts, answers (?since=ms)
 *   GET  /api/ops/runs     daemon job runs only
 *   GET  /api/ops/config   provider, model, where the choice came from, autonomy levels (never keys)
 *   POST /api/ops/config   { provider, model } — the AI provider picked in Settings
 *   POST /api/ops/chat     { question, history } → text/event-stream
 */

import { runAgent } from './agent.mjs';
import { listEvents } from './audit.mjs';
import { readJournal } from './journal.mjs';
import { createRuntime } from './runtime.mjs';
import { saveProviderChoice, SERVER_PROVIDERS } from './config.mjs';
import { stateStore } from './stateStore.mjs';
import { TOOL_BY_NAME } from './tools.mjs';

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

function readBody(req, limit = 512_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > limit) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

let chatInFlight = false;

export async function handleOpsRoute(req, res, reqUrl, { port }) {
  const path = reqUrl.pathname;
  const base = `http://127.0.0.1:${port}`;
  try {
    if (path === '/api/ops/state' && req.method === 'POST') {
      let snapshot;
      try {
        snapshot = JSON.parse(await readBody(req));
      } catch {
        return json(res, 400, { success: false, error: 'invalid JSON' });
      }
      const error = stateStore.put(snapshot);
      return error ? json(res, 400, { success: false, error }) : json(res, 200, { success: true });
    }

    if (path === '/api/ops/state' && req.method === 'GET') {
      return json(res, 200, stateStore.get());
    }

    if (path === '/api/ops/health' && req.method === 'GET') {
      const rt = createRuntime({ base, level: 0 });
      return json(res, 200, await TOOL_BY_NAME.get('get_system_health').run({}, rt.ctx));
    }

    if (path === '/api/ops/events' && req.method === 'GET') {
      const since = Number(reqUrl.searchParams.get('since')) || 0;
      return json(res, 200, { events: listEvents({ since }) });
    }

    if (path === '/api/ops/runs' && req.method === 'GET') {
      return json(res, 200, { runs: readJournal('ops', { limit: 0 }).filter(r => r.kind === 'run') });
    }

    if (path === '/api/ops/config' && req.method === 'GET') {
      const { config, level } = createRuntime({ base });
      return json(res, 200, {
        provider: config.provider, model: config.model, source: config.source,
        supported: [...SERVER_PROVIDERS], chatLevel: level, daemonLevel: config.daemonLevel
      });
    }

    if (path === '/api/ops/config' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse(await readBody(req, 4_000));
      } catch {
        return json(res, 400, { success: false, error: 'invalid JSON' });
      }
      try {
        saveProviderChoice({ provider: body?.provider, model: body?.model });
      } catch (err) {
        return json(res, 400, { success: false, error: err.message });
      }
      const { config, level } = createRuntime({ base });
      return json(res, 200, {
        success: true, provider: config.provider, model: config.model, source: config.source,
        supported: [...SERVER_PROVIDERS], chatLevel: level, daemonLevel: config.daemonLevel
      });
    }

    if (path === '/api/ops/chat' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse(await readBody(req, 64_000));
      } catch {
        return json(res, 400, { success: false, error: 'invalid JSON' });
      }
      const question = String(body?.question || '').trim().slice(0, 2000);
      if (!question) return json(res, 400, { success: false, error: 'question required' });
      // One question at a time: bounds LLM spend and keeps the audit readable.
      if (chatInFlight) return json(res, 429, { success: false, error: 'Another question is still being answered.' });
      chatInFlight = true;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      });
      const send = event => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
      };
      try {
        const rt = createRuntime({ base });
        let provider;
        try {
          provider = rt.provider();
        } catch (err) {
          provider = { name: 'unavailable', chat: async () => { throw err; } };
        }
        // The tab's "stop" (or a closed tab) ends the turn and any CLI it started.
        const cancel = new AbortController();
        res.on('close', () => { if (!res.writableEnded) cancel.abort(); });
        send({ type: 'meta', provider: provider.name, level: rt.level });
        const result = await runAgent({
          question,
          history: Array.isArray(body.history) ? body.history : [],
          provider,
          guard: rt.guard,
          audit: rt.audit,
          ctx: rt.ctx,
          level: rt.level,
          limits: rt.limits,
          signal: cancel.signal,
          onEvent: send
        });
        send({ type: 'done', turnId: result.turnId, flags: result.flags, usage: result.usage });
      } catch (err) {
        send({ type: 'error', error: err.message });
      } finally {
        chatInFlight = false;
        res.end();
      }
      return;
    }

    return json(res, 404, { success: false, error: `No ops route for ${req.method} ${path}` });
  } catch (err) {
    console.error(`[Ops] ${path} failed:`, err.message);
    if (!res.headersSent) json(res, 500, { success: false, error: err.message });
    else if (!res.writableEnded) res.end();
  }
}
