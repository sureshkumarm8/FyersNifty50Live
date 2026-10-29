/**
 * Process-wide wiring for the ops agent: provider from config, one guard per
 * autonomy level (so rate limits hold across chat turns), the tool context.
 */

import { createAudit } from './audit.mjs';
import { createOpsClient } from './client.mjs';
import { loadOpsEnv, opsConfig } from './config.mjs';
import { createGuard } from './guard.mjs';
import { createGeminiProvider } from './providers/gemini.mjs';
import { createOllamaProvider } from './providers/ollama.mjs';
import { createLocalCliProvider } from './providers/localCli.mjs';
import { LIMITS } from './agent.mjs';
import { sendNotification } from '../services/notify.mjs';

export function createProvider(config) {
  if (config.local) return createLocalCliProvider({ provider: config.provider, model: config.model, timeoutMs: LOCAL_STEP_MS });
  return config.provider === 'gemini'
    ? createGeminiProvider({ apiKey: config.geminiKey, model: config.model })
    : createOllamaProvider({ baseUrl: config.ollamaUrl, model: config.model });
}

/** A local CLI start-up alone takes 2–25 s, so one question gets more time. */
const LOCAL_STEP_MS = 90_000;
export const limitsFor = config => (config.local ? { ...LIMITS, wallMs: 240_000 } : LIMITS);

const guards = new Map();

/** Guards are long-lived so "1 chart pull per 10 min" survives across turns. */
export function guardFor(level) {
  if (!guards.has(level)) guards.set(level, createGuard({ level }));
  return guards.get(level);
}

export function createRuntime({ base, level, env } = {}) {
  loadOpsEnv();
  const config = opsConfig(env);
  const effectiveLevel = level ?? config.chatLevel;
  // Provider choice is re-read on every use, so a long-running daemon follows
  // a change made in Settings without a restart.
  const current = () => opsConfig(env);
  return {
    get config() {
      return current();
    },
    level: effectiveLevel,
    guard: guardFor(effectiveLevel),
    audit: createAudit(),
    provider: () => createProvider(current()),
    get limits() {
      return limitsFor(current());
    },
    ctx: {
      client: createOpsClient(base ?? config.serverBase),
      now: () => Date.now(),
      notify: (title, message) => sendNotification(title, message)
    }
  };
}
