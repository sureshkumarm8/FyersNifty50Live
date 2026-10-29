/**
 * OPS CONFIGURATION — read from .env.local (the same file server.js loads).
 *
 * Model keys live here and never pass through the browser. Autonomy levels
 * are capped at L1: L2 (protective actions) is milestone M5 and needs a real
 * server-side flatten first, so asking for it is refused rather than honoured.
 */

import dotenv from 'dotenv';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PROJECT_ROOT } from './time.mjs';

let loaded = false;
let fileEnv = {};

/**
 * Loads .env.local into process.env (without overriding the shell, like
 * server.js) and remembers the file's own values: for the ops keys the file
 * wins, so a stale GEMINI_API_KEY exported in a shell profile cannot shadow
 * the one configured for the app.
 */
export function loadOpsEnv() {
  if (loaded) return;
  loaded = true;
  fileEnv = dotenv.config({ path: join(PROJECT_ROOT, '.env.local'), quiet: true }).parsed || {};
}

export const LEVELS = Object.freeze({ L0: 0, L1: 1, L2: 2 });
export const MAX_ENABLED_LEVEL = 1;

/** Parses 'L0' / 'l1' / '1'. Unknown → fallback. Anything above L1 is clamped to L1. */
export function parseLevel(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const m = /^l?([0-3])$/i.exec(String(value).trim());
  if (!m) return fallback;
  return Math.min(Number(m[1]), MAX_ENABLED_LEVEL);
}

const keyIn = e => e.GEMINI_API_KEY || e.GOOGLE_API_KEY || '';

const PROVIDER_ALIASES = {
  gemini: 'gemini', ollama: 'ollama',
  'claude-code': 'claude-code', claude: 'claude-code', 'local-claude': 'claude-code',
  copilot: 'copilot', 'github-copilot': 'copilot',
  antigravity: 'antigravity', agy: 'antigravity'
};

/** Local CLIs signed in on this Mac: no key here, and each step takes seconds, not milliseconds. */
export const LOCAL_CLI_IDS = new Set(['claude-code', 'copilot', 'antigravity']);

/**
 * The AI provider picked in the app's Settings, saved by the Nifty50Ops tab
 * (POST /api/ops/config) so the chat and the daemon follow the same choice.
 * Order: this saved choice, then OPS_AI_PROVIDER / OPS_AI_MODEL, then auto.
 */
export const PROVIDER_CHOICE_FILE = join(PROJECT_ROOT, 'data', 'ops-provider.json');

/** Providers the server can run itself. Groq / Claude API / Cerebras keys live only in the browser. */
export const SERVER_PROVIDERS = new Set(['gemini', 'ollama', 'claude-code', 'copilot', 'antigravity']);

export function readProviderChoice(file = PROVIDER_CHOICE_FILE) {
  try {
    if (!existsSync(file)) return null;
    const c = JSON.parse(readFileSync(file, 'utf8'));
    const provider = PROVIDER_ALIASES[String(c.provider || '').toLowerCase()];
    if (!provider) return null;
    return { provider, model: typeof c.model === 'string' && c.model.trim() ? c.model.trim() : null, savedAt: c.savedAt ?? null };
  } catch {
    return null;
  }
}

/** Returns the saved choice, or throws if the server cannot run that provider. */
export function saveProviderChoice({ provider, model }, file = PROVIDER_CHOICE_FILE) {
  const id = PROVIDER_ALIASES[String(provider || '').toLowerCase()];
  if (!id || !SERVER_PROVIDERS.has(id)) {
    throw new Error(`${provider} cannot run on the server (its key lives only in the browser). Nifty50Ops supports: ${[...SERVER_PROVIDERS].join(', ')}.`);
  }
  const choice = { provider: id, model: typeof model === 'string' && model.trim() ? model.trim() : null, savedAt: Date.now() };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(choice, null, 2));
  renameSync(`${file}.tmp`, file);
  return choice;
}

export function opsConfig(env = { ...process.env, ...fileEnv }, choice = readProviderChoice()) {
  // A key in .env.local beats any key in the shell, whichever name either uses.
  const geminiKey = keyIn(fileEnv) || keyIn(env);
  const wanted = choice?.provider ?? PROVIDER_ALIASES[(env.OPS_AI_PROVIDER || '').toLowerCase().trim()] ?? null;
  let provider = wanted ?? (geminiKey ? 'gemini' : 'ollama');
  if (provider === 'gemini' && !geminiKey) provider = 'ollama';
  const defaultModel = { gemini: 'gemini-2.5-flash', ollama: 'gemma4:latest' }[provider] ?? null; // CLIs: their own default
  return {
    provider,
    // A saved Settings choice carries its own model (empty = provider default).
    model: choice ? (choice.model || defaultModel) : (env.OPS_AI_MODEL || defaultModel),
    source: choice ? 'settings' : env.OPS_AI_PROVIDER ? 'env' : 'auto',
    local: LOCAL_CLI_IDS.has(provider),
    geminiKey,
    ollamaUrl: (env.OPS_OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, ''),
    chatLevel: parseLevel(env.OPS_AUTONOMY_LEVEL, 0),
    daemonLevel: parseLevel(env.OPS_DAEMON_AUTONOMY_LEVEL, 1),
    serverBase: env.OPS_SERVER_URL || `http://127.0.0.1:${env.PORT || 5001}`
  };
}
