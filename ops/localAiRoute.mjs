/**
 * /api/local-ai/* — lets the browser use the local AI CLIs (Claude Code,
 * Copilot, Antigravity) as its AI provider. The browser cannot start a
 * process, so the server runs the CLI (locked down, see ops/localAI.mjs) and
 * returns the text. Loopback-only, like the ops routes.
 *
 *   GET  /api/local-ai/status   which CLIs are installed
 *   POST /api/local-ai/chat     { provider, model?, system, prompt, jsonMode? } → { text, model, usage, ms }
 *
 *   Antigravity sign-in (see ops/antigravityAuth.mjs):
 *   GET  /api/local-ai/antigravity/auth          { signedIn, login: { state, url?, expiresAt?, message? } }
 *   POST /api/local-ai/antigravity/auth/start    → login state with the Google link
 *   POST /api/local-ai/antigravity/auth/code     { code } → login state after the CLI checks it
 *   POST /api/local-ai/antigravity/auth/cancel
 */

import { LOCAL_CLI_PROVIDERS, localCliStatus, runLocalCli } from './localAI.mjs';
import { antigravitySignedIn, cancelLogin, loginState, startLogin, submitCode } from './antigravityAuth.mjs';

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

function readBody(req, limit = 400_000) {
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

/** Models asked for JSON still wrap it in fences or a sentence now and then. */
export function extractJson(text) {
  const t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = t.search(/[[{]/);
  if (start < 0) return t;
  const end = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  return end > start ? t.slice(start, end + 1) : t;
}

let statusCache = null;

export async function handleLocalAiRoute(req, res, reqUrl) {
  try {
    if (reqUrl.pathname === '/api/local-ai/status' && req.method === 'GET') {
      if (!statusCache || Date.now() - statusCache.at > 60_000) statusCache = { at: Date.now(), providers: await localCliStatus() };
      return json(res, 200, { providers: statusCache.providers });
    }

    if (reqUrl.pathname === '/api/local-ai/antigravity/auth' && req.method === 'GET') {
      const login = loginState();
      // Skip the probe while a sign-in is in flight: it would race the login process.
      const probe = ['starting', 'awaiting_code', 'verifying'].includes(login.state) ? { installed: true, signedIn: false } : await antigravitySignedIn();
      return json(res, 200, { ...probe, login });
    }
    if (reqUrl.pathname === '/api/local-ai/antigravity/auth/start' && req.method === 'POST') {
      statusCache = null;
      return json(res, 200, { login: await startLogin() });
    }
    if (reqUrl.pathname === '/api/local-ai/antigravity/auth/code' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse(await readBody(req, 8_000));
      } catch {
        return json(res, 400, { error: 'invalid JSON body' });
      }
      return json(res, 200, { login: await submitCode(body?.code) });
    }
    if (reqUrl.pathname === '/api/local-ai/antigravity/auth/cancel' && req.method === 'POST') {
      return json(res, 200, { login: cancelLogin() });
    }

    if (reqUrl.pathname === '/api/local-ai/chat' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch {
        return json(res, 400, { error: 'invalid JSON body' });
      }
      const provider = String(body?.provider || '');
      if (!LOCAL_CLI_PROVIDERS.includes(provider)) return json(res, 400, { error: `provider must be one of ${LOCAL_CLI_PROVIDERS.join(', ')}` });
      const prompt = String(body.prompt || '');
      if (!prompt.trim()) return json(res, 400, { error: 'prompt required' });
      const system = [
        String(body.system || ''),
        'You have no tools in this session; answer from the text provided only.',
        body.jsonMode ? 'Respond with only valid JSON: no prose, no markdown code fences.' : ''
      ].filter(Boolean).join('\n\n');
      const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : null;

      const abort = new AbortController();
      res.on('close', () => { if (!res.writableEnded) abort.abort(); });
      const r = await runLocalCli(provider, { system, prompt, model, timeoutMs: 150_000, signal: abort.signal });
      return json(res, 200, { text: body.jsonMode ? extractJson(r.text) : r.text, model: r.model, usage: r.usage, ms: r.ms });
    }

    return json(res, 404, { error: `No local-ai route for ${req.method} ${reqUrl.pathname}` });
  } catch (err) {
    console.warn(`[Local AI] ${reqUrl.pathname} failed:`, err.message);
    if (!res.headersSent) json(res, /busy/.test(err.message) ? 429 : 502, { error: err.message });
  }
}
