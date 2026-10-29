/**
 * OPS GUARD — what the agent may do, enforced in code.
 *
 *  - Every tool has a tier: read (L0) < ops (L1) < protective (L2).
 *    A call runs only if tier ≤ the session's autonomy level.
 *  - Unknown tools are refused. There is no generic tool: no shell, no
 *    "fetch any URL", no file write outside today's journal folder.
 *  - Order placement is unreachable: no tool wraps it, and the HTTP client the
 *    tools get (ops/client.mjs) refuses those paths at any level.
 *  - Rate limits: 20 tool calls per chat turn, 1 chart pull per 10 min,
 *    1 notification per minute per topic.
 *  - A protective tool also needs a single-use confirmation token. Tokens are
 *    issued only by the UI button route or the deterministic watchdog and are
 *    never placed in the model's context, so model text cannot mint one.
 */

import crypto from 'node:crypto';

export const TIERS = Object.freeze({ read: 0, ops: 1, protective: 2 });
export const MAX_CALLS_PER_TURN = 20;

export const RATE_LIMITS = Object.freeze({
  pull_premarket_charts: { windowMs: 10 * 60_000, key: () => 'all' },
  notify: { windowMs: 60_000, key: args => String(args?.topic || 'general') }
});

const TOKEN_TTL_MS = 2 * 60_000;
const TOKEN_ISSUERS = new Set(['ui', 'watchdog']);

export function createGuard({ level = 0, now = () => Date.now(), rateLimits = RATE_LIMITS, maxCallsPerTurn = MAX_CALLS_PER_TURN } = {}) {
  const lastRun = new Map();
  const tokens = new Map();
  let callsThisTurn = 0;

  return {
    level,

    startTurn() {
      callsThisTurn = 0;
    },

    /** Only the UI route and the watchdog call this. Returns the token string. */
    issueConfirmToken(toolName, issuer) {
      if (!TOKEN_ISSUERS.has(issuer)) throw new Error(`Confirmation tokens cannot be issued by "${issuer}"`);
      const token = crypto.randomBytes(16).toString('hex');
      tokens.set(token, { toolName, issuer, expiresAt: now() + TOKEN_TTL_MS });
      return token;
    },

    /**
     * Decide whether `tool` may run with `args`. Returns `{ ok: true }` or
     * `{ ok: false, reason }`. Counts toward the per-turn budget either way,
     * so a model looping on denied calls still hits the ceiling.
     */
    check(tool, args, { confirmToken } = {}) {
      callsThisTurn += 1;
      if (callsThisTurn > maxCallsPerTurn) return { ok: false, reason: `tool-call budget of ${maxCallsPerTurn} per turn exhausted` };
      if (!tool) return { ok: false, reason: 'unknown tool' };
      const tier = TIERS[tool.tier];
      if (tier === undefined) return { ok: false, reason: `tool ${tool.name} has no valid tier` };
      if (tier > level) return { ok: false, reason: `${tool.name} is a ${tool.tier} tool (L${tier}); this session is L${level}` };

      if (tool.tier === 'protective') {
        const t = confirmToken && tokens.get(confirmToken);
        if (!t) return { ok: false, reason: `${tool.name} needs a confirmation token from the UI or the watchdog` };
        tokens.delete(confirmToken); // single use, even if the rest of the check fails
        if (t.toolName !== tool.name) return { ok: false, reason: 'confirmation token was issued for a different action' };
        if (now() > t.expiresAt) return { ok: false, reason: 'confirmation token expired' };
      }

      const limit = rateLimits[tool.name];
      if (limit) {
        const key = `${tool.name}:${limit.key(args)}`;
        const last = lastRun.get(key);
        if (last !== undefined && now() - last < limit.windowMs) {
          return { ok: false, reason: `${tool.name} is rate-limited; try again in ${Math.ceil((limit.windowMs - (now() - last)) / 1000)} s` };
        }
        lastRun.set(key, now());
      }
      return { ok: true };
    }
  };
}
