/**
 * SNIPER REVIEW — the live second opinion.
 *
 * The pre-market analyst pass reads charts. This one reads the *session*: the
 * opening range, how far the thesis has drifted from the morning's plan, the
 * breadth and PCR on the tape right now, and the mechanical engine's own
 * decision. It is the "is my analysis still right?" question, asked once the
 * market has started answering it.
 *
 * Two rules make this safe to run next to real money:
 *
 *   1. VETO-ONLY. The model can block a trade the mechanics allowed, or shave
 *      confidence off it. It can never authorise a trade the mechanics
 *      refused, and it can never move a level. An AI that could invent an
 *      entry would be an AI that could invent a loss, and the whole protocol
 *      exists to stop exactly that kind of improvisation.
 *
 *   2. NEVER IN THE HOT PATH. The entry window is twenty minutes and a model
 *      round-trip is seconds. This runs at defined checkpoints - range lock,
 *      and on demand - and its result is cached. The engine never waits on it;
 *      if it has not answered, the mechanical decision stands unmodified.
 */

import { FyersCredentials } from '../types';
import { callAI, isAIConfigured } from './aiProvider';
import { SNIPER } from './sniperPlaybook';
import { LiveThesis } from './sniperReconcile';

export interface LiveVerdict {
  at: number;
  atStr: string;
  /** The spot this opinion was written against. Stale once price has moved on. */
  spot: number;
  /** PROCEED = no objection. TRIM = allow but with less confidence. BLOCK = stand down. */
  call: 'PROCEED' | 'TRIM' | 'BLOCK';
  /** One line, the reason. Shown next to the engine's own blocks. */
  reason: string;
  /** What the model thinks the tape is doing, in a sentence. */
  read: string;
  /** Confidence points to remove. Always <= 0 — this pass cannot add conviction. */
  confidencePenalty: number;
  /** Observations that should end the day if seen. */
  watchFor: string[];
  model: string;
}

export interface LiveReviewInput {
  now: number;
  spot: number | null;
  phase: string;
  thesis: LiveThesis;
  /** The opening range as marked, before reconciliation. */
  range: { open: number; high: number; low: number; support: number; resistance: number; samples: number } | null;
  /** The pre-market plan's headline verdict, for context. */
  planHeadline: string | null;
  planReason: string | null;
  /** Live engine opinion. */
  signalDirection: string;
  signalConfidence: number;
  signalReasons: string[];
  /** Tape readings. */
  breadth: number | null;
  pcr: number | null;
  optionsSent: number | null;
  drift: number | null;
  /** What the mechanical engine decided, and why not if it refused. */
  engineCanEnter: boolean;
  engineBlocks: string[];
  engineSetup: string | null;
}

const SYSTEM = `You are the risk officer on a one-trade-a-day Nifty 50 intraday options desk.
Your only job is to stop bad trades. You cannot start one.

THE DESK'S RULES, WHICH YOU DO NOT GET TO CHANGE:
- Exactly one trade per day. Entries only between ${SNIPER.entryStart} and ${SNIPER.reviewBy}.
- Everything is flat by ${SNIPER.hardStop}, win or lose.
- The trade is always a ${SNIPER.itmPoints}-point ITM option bought AT a level: a call at
  support, a put at resistance. The desk never chases a breakout.
- Fixed +${SNIPER.targetPoints} / -${SNIPER.stopPoints} points on spot. No trailing, no adding, no averaging.
- A zone narrower than ${SNIPER.minZoneWidth} points is untradable by construction.

WHAT YOU ARE BEING ASKED:
The desk formed a view before the open and has now checked it against the live tape.
You are shown that reconciliation and the mechanical engine's decision. Say whether you
see a reason to stand down that the mechanics cannot see - a tape that is trending hard
through a level rather than respecting it, breadth and options flow pulling opposite ways,
a range built from too few ticks to trust, a level that is really the previous day's and
not today's.

YOU MAY ONLY:
- PROCEED  you have no objection. confidencePenalty must be 0.
- TRIM     the trade is defensible but the evidence is thinner than it looks.
           confidencePenalty between -1 and -15.
- BLOCK    stand down for the day. confidencePenalty -100.

You may NOT invent levels, suggest a different strike, propose a trade the engine did not
find, or recommend trading outside the window. If the engine has already refused, your
answer is PROCEED with reason "engine already declined" - do not argue it back into a trade.

Return ONLY this JSON, no prose, no markdown fence:
{
  "call": "PROCEED" | "TRIM" | "BLOCK",
  "reason": "one sentence, why",
  "read": "one sentence on what the tape is actually doing",
  "confidencePenalty": 0,
  "watchFor": ["observation that should end the day", "..."]
}`;

const n = (v: number | null | undefined, suffix = '') =>
  v == null || !isFinite(v) ? 'unknown' : `${Math.round(v * 100) / 100}${suffix}`;

export function buildLivePrompt(input: LiveReviewInput): string {
  const t = input.thesis;
  const checks = t.checks.length
    ? t.checks.map(c => `  [${c.verdict}] ${c.label}: ${c.detail}`).join('\n')
    : '  (nothing checked yet)';
  const adjustments = t.adjustments.length ? t.adjustments.map(a => `  - ${a}`).join('\n') : '  (none)';

  const range = input.range
    ? `open ${Math.round(input.range.open)}, high ${Math.round(input.range.high)}, low ${Math.round(input.range.low)} from ${input.range.samples} ticks
  → mechanical walls ${Math.round(input.range.support)} / ${Math.round(input.range.resistance)}`
    : 'not marked yet';

  return `=== NOW ===
${new Date(input.now).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST, phase ${input.phase}
Nifty spot: ${n(input.spot)}

=== THIS MORNING'S PLAN ===
${input.planHeadline ?? 'no pre-market plan today'}${input.planReason ? ` — ${input.planReason}` : ''}

=== THE 09:15 OPENING RANGE ===
  ${range}

=== THE RECONCILIATION (plan vs tape) ===
State: ${t.state}, ${t.score}% of the morning's read survived.
Trading walls: ${t.support == null ? 'none' : Math.round(t.support)} / ${t.resistance == null ? 'none' : Math.round(t.resistance)} (source: ${t.levelSource})
Checks:
${checks}
Adjustments already made:
${adjustments}
${t.veto ? `HARD VETO ALREADY IN FORCE: ${t.veto}` : 'No veto from reconciliation.'}

=== THE TAPE ===
Session drift since the open: ${n(input.drift, ' pts')}
Breadth: ${n(input.breadth, '%')}   PCR: ${n(input.pcr)}   Options sentiment: ${n(input.optionsSent)}
Live signal: ${input.signalDirection} at ${Math.round(input.signalConfidence)}% confidence
${input.signalReasons.slice(0, 4).map(r => `  - ${r}`).join('\n') || '  (no reasons given)'}

=== THE MECHANICAL ENGINE'S DECISION ===
${input.engineCanEnter ? `WOULD ENTER: ${input.engineSetup ?? 'setup formed'}` : 'WOULD NOT ENTER'}
${input.engineBlocks.length ? input.engineBlocks.map(b => `  blocked by: ${b}`).join('\n') : '  nothing blocking'}

Give your JSON now.`;
}

const unfence = (raw: string): string => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
};

/**
 * Parse, and clamp into the shape the desk permits.
 *
 * The prompt asks for veto-only behaviour; this enforces it. A model that
 * returns PROCEED with a bonus, or BLOCK with a token penalty, gets corrected
 * rather than trusted - the penalty is always derived from the call, never
 * taken at face value.
 */
export function parseLiveVerdict(raw: string, input: LiveReviewInput, model: string): LiveVerdict {
  const parsed = JSON.parse(unfence(raw)) as Record<string, unknown>;

  const callRaw = String(parsed.call ?? '').toUpperCase().trim();
  const call: LiveVerdict['call'] =
    callRaw === 'BLOCK' ? 'BLOCK' : callRaw === 'TRIM' ? 'TRIM' : 'PROCEED';

  const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';
  if (!reason) throw new Error('the model gave no reason');

  // A penalty is a consequence of the call, not an independent field. This is
  // the line that makes the pass structurally incapable of adding conviction.
  const asked = Math.round(Number(parsed.confidencePenalty) || 0);
  const confidencePenalty =
    call === 'BLOCK' ? -100 : call === 'TRIM' ? Math.max(-15, Math.min(-1, asked > 0 ? -asked : asked)) : 0;

  return {
    at: input.now,
    atStr: new Date(input.now).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
    spot: Math.round(input.spot ?? 0),
    call,
    reason,
    read: typeof parsed.read === 'string' ? parsed.read.trim() : '',
    confidencePenalty,
    watchFor: Array.isArray(parsed.watchFor)
      ? (parsed.watchFor as unknown[])
          .map(x => (typeof x === 'string' ? x.trim() : ''))
          .filter(Boolean)
          .slice(0, 4)
      : [],
    model
  };
}

export const isLiveReviewConfigured = (credentials: FyersCredentials): boolean => isAIConfigured(credentials);

export async function requestLiveVerdict(
  credentials: FyersCredentials,
  input: LiveReviewInput,
  modelLabel: string
): Promise<LiveVerdict> {
  const raw = await callAI(credentials, SYSTEM, buildLivePrompt(input), { jsonMode: true });
  return parseLiveVerdict(raw, input, modelLabel);
}
