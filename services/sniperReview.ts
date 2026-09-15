/**
 * SNIPER REVIEW — the live second opinion.
 *
 * The pre-market analyst pass reads charts. This one reads the *session*: the
 * opening range, how far the thesis has drifted from the morning's plan, the
 * breadth and PCR on the tape right now, and the mechanical engine's own
 * decision. It is the "is my analysis still right?" question, asked once the
 * market has started answering it.
 *
 * Three rules make this safe to run next to real money:
 *
 *   1. IT MAY NARROW, NEVER WIDEN. The model can block a trade the mechanics
 *      allowed, shave confidence off it, or restrict the day to one side of the
 *      zone. It can never authorise a trade the mechanics refused, and it can
 *      never move a level. An AI that could invent an entry would be an AI that
 *      could invent a loss, and the whole protocol exists to stop exactly that
 *      kind of improvisation.
 *
 *   2. BLOCK IS THE LAST ANSWER, NOT THE FIRST. This desk buys calls at support
 *      and puts at resistance, so evidence is almost never evidence against
 *      *trading* - it is evidence against one of the two sides. A tape with
 *      negative breadth and call writing does not kill the day; it kills the
 *      long and leaves the fade at resistance standing. The earlier version of
 *      this pass had no way to say that, so the only word it had for "the
 *      morning's bullish read is wrong" was BLOCK, and a 20-minute entry window
 *      died at 09:26 over an observation that should have redirected it.
 *      REFRAME exists for that case, and BLOCK now has to earn itself: a model
 *      that names a surviving side is read as a reframe whatever word it used.
 *
 *   3. NEVER IN THE HOT PATH, AND NEVER PERMANENT. The entry window is twenty
 *      minutes and a model round-trip is seconds, so this runs at checkpoints
 *      and its result is cached - the engine never waits on it. But an opinion
 *      is written against a price, and the tape moves: a verdict goes stale
 *      (see `isVerdictStale`) once price has left the level it was judged at or
 *      enough of the window has passed, after which the mechanics stand alone
 *      until the officer is asked again.
 */

import { FyersCredentials } from '../types';
import { callAI, isAIConfigured } from './aiProvider';
import { SNIPER } from './sniperPlaybook';
import { LiveThesis } from './sniperReconcile';

/** Which of the two pre-armed plays the officer is willing to let stand. */
export type AllowedSide = 'BOTH' | 'LONG_ONLY' | 'SHORT_ONLY' | 'NONE';

export interface LiveVerdict {
  at: number;
  atStr: string;
  /** The spot this opinion was written against. Stale once price has moved on. */
  spot: number;
  /**
   * PROCEED = no objection. TRIM = allow but with less confidence.
   * REFRAME = the day lives, but only one side of the zone may be traded.
   * BLOCK = stand down, neither side is tradable.
   */
  call: 'PROCEED' | 'TRIM' | 'REFRAME' | 'BLOCK';
  /** One line, the reason. Shown next to the engine's own blocks. */
  reason: string;
  /** What the model thinks the tape is doing, in a sentence. */
  read: string;
  /** Derived from `call` - the engine reads this, not the word. */
  allow: AllowedSide;
  /**
   * On a REFRAME: what has to happen for the surviving side to become live,
   * in the trader's own terms ("price back at 23,600 with breadth still red").
   * Empty for every other call.
   */
  waitFor: string;
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
You cannot start a trade. You decide which of the desk's two pre-armed plays are still worth taking.

THE DESK'S RULES, WHICH YOU DO NOT GET TO CHANGE:
- Exactly one trade per day. Entries only between ${SNIPER.entryStart} and ${SNIPER.reviewBy}.
- Everything is flat by ${SNIPER.hardStop}, win or lose.
- There are only ever two plays, both taken AT a level, never on a breakout:
    THE BOUNCE  buy a ${SNIPER.itmPoints}-point ITM CALL when price comes down to support.
    THE FADE    buy a ${SNIPER.itmPoints}-point ITM PUT when price comes up to resistance.
- Fixed +${SNIPER.targetPoints} / -${SNIPER.stopPoints} points on spot. No trailing, no adding, no averaging.
- A zone narrower than ${SNIPER.minZoneWidth} points is untradable by construction.

THE MISTAKE YOU MUST NOT MAKE:
The morning's plan leans one way. The tape often disagrees with it. That disagreement is
almost never a reason to stop trading - it is a reason to stop trading ONE SIDE.
Negative breadth and call writing against a bullish plan do not kill the day: they kill
the bounce and they strengthen the fade at resistance. Bullish flow against a bearish plan
kills the fade and strengthens the bounce. Before you even consider BLOCK you must answer
one question honestly: "is the OTHER side of this zone still a good trade?" If it is, the
answer is REFRAME, not BLOCK. A day ended over evidence that merely picked a side is a
day thrown away.

YOUR ANSWERS:
- PROCEED   no objection. Both sides stand. allow="BOTH", confidencePenalty 0.
- TRIM      defensible but thinner than it looks. Both sides stand.
            allow="BOTH", confidencePenalty between -1 and -15.
- REFRAME   the day lives, but only one side is worth taking.
            allow="LONG_ONLY" (only the bounce at support) or "SHORT_ONLY" (only the fade
            at resistance). confidencePenalty between 0 and -10. In "waitFor", say plainly
            what must happen for that side to trigger - price arriving at the level, and
            the condition that must still hold when it does.
- BLOCK     neither side is tradable at any price today. allow="NONE".
            confidencePenalty -100. Reserve this for conditions that poison BOTH plays:
            the zone is too narrow, the range was built from too few ticks to trust, price
            is trending hard through levels rather than respecting them, the levels belong
            to yesterday, or the feed cannot be trusted. "The plan's direction was wrong"
            is a REFRAME. If you name a side that still works, it is a REFRAME whatever
            word you use - it will be read as one.

You may NOT invent or move levels, suggest a different strike, propose an entry the engine
did not find, or recommend trading outside the window. If the engine has already refused for
a mechanical reason you have no opinion on, answer PROCEED with reason "engine already
declined" - do not argue it back into a trade.

Return ONLY this JSON, no prose, no markdown fence:
{
  "call": "PROCEED" | "TRIM" | "REFRAME" | "BLOCK",
  "allow": "BOTH" | "LONG_ONLY" | "SHORT_ONLY" | "NONE",
  "reason": "one sentence, why",
  "read": "one sentence on what the tape is actually doing",
  "waitFor": "on a REFRAME, the trigger for the surviving side; otherwise empty",
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

  // Stated explicitly so the model is choosing between two concrete trades
  // rather than passing judgement on "the day" - the framing is what stops a
  // directional observation from being spent as a blanket veto.
  const dist = (level: number | null) =>
    level == null || input.spot == null ? 'distance unknown' : `${Math.round(Math.abs(input.spot - level))} pts away`;
  const plays = [
    `  THE BOUNCE (allow="LONG_ONLY"): buy ${SNIPER.itmPoints}-ITM CE when price reaches support ${
      t.support == null ? 'unknown' : Math.round(t.support)
    } (${dist(t.support)}).`,
    `  THE FADE   (allow="SHORT_ONLY"): buy ${SNIPER.itmPoints}-ITM PE when price reaches resistance ${
      t.resistance == null ? 'unknown' : Math.round(t.resistance)
    } (${dist(t.resistance)}).`
  ].join('\n');

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

=== THE TWO PLAYS ON THE BOOK TODAY ===
${plays}

=== THE TAPE ===
Session drift since the open: ${n(input.drift, ' pts')}
Breadth: ${n(input.breadth, '%')}   PCR: ${n(input.pcr)}   Options sentiment: ${n(input.optionsSent)}
Live signal: ${input.signalDirection} at ${Math.round(input.signalConfidence)}% confidence
${input.signalReasons.slice(0, 4).map(r => `  - ${r}`).join('\n') || '  (no reasons given)'}

=== THE MECHANICAL ENGINE'S DECISION ===
${input.engineCanEnter ? `WOULD ENTER: ${input.engineSetup ?? 'setup formed'}` : 'WOULD NOT ENTER'}
${input.engineBlocks.length ? input.engineBlocks.map(b => `  blocked by: ${b}`).join('\n') : '  nothing blocking'}

Judge both plays, not the day. Give your JSON now.`;
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
 * The prompt asks for narrow-only behaviour; this enforces it. Two corrections
 * are applied regardless of what the model wrote:
 *
 *   - The penalty is derived from the call, never taken at face value. This is
 *     the line that makes the pass structurally incapable of adding conviction.
 *   - The call and the surviving side must agree. A model that says BLOCK while
 *     naming a side that still works has described a reframe, and is read as
 *     one; a model that says REFRAME while leaving both sides open has described
 *     a trim. Left uncorrected, the first of those throws away a tradable day on
 *     a wording slip and the second silently changes nothing.
 */
export function parseLiveVerdict(raw: string, input: LiveReviewInput, model: string): LiveVerdict {
  const parsed = JSON.parse(unfence(raw)) as Record<string, unknown>;

  const callRaw = String(parsed.call ?? '').toUpperCase().trim();
  const allowRaw = String(parsed.allow ?? '').toUpperCase().replace(/[\s-]/g, '_').trim();
  const sideRaw = String(parsed.allow ?? parsed.side ?? '').toUpperCase().replace(/[\s-]/g, '_').trim();

  const readSide = (text: string): AllowedSide | null =>
    text === 'LONG_ONLY' || text === 'LONG' || text === 'BOUNCE'
      ? 'LONG_ONLY'
      : text === 'SHORT_ONLY' || text === 'SHORT' || text === 'FADE'
        ? 'SHORT_ONLY'
        : text === 'BOTH'
          ? 'BOTH'
          : text === 'NONE' || text === 'NEITHER'
            ? 'NONE'
            : null;

  const statedSide = readSide(sideRaw);
  const oneSided = statedSide === 'LONG_ONLY' || statedSide === 'SHORT_ONLY';
  const asked = Math.round(Number(parsed.confidencePenalty) || 0);

  let call: LiveVerdict['call'] =
    callRaw === 'BLOCK' ? 'BLOCK' : callRaw === 'REFRAME' ? 'REFRAME' : callRaw === 'TRIM' ? 'TRIM' : 'PROCEED';

  /**
   * Reconcile the word against the side, in both directions - but asymmetrically.
   *
   * Turning a BLOCK into a reframe is the only correction in this file that
   * makes a verdict *weaker* than the word the model chose, so it is the only
   * one that has to be earned. It requires the canonical `allow` field (not the
   * loose `side` alias, which a model may well use to name the direction it is
   * objecting to) and a penalty that is not the -100 block sentinel. Where the
   * two fields genuinely disagree, the block stands.
   */
  const canonicalSide = readSide(allowRaw);
  const canonicalOneSided = canonicalSide === 'LONG_ONLY' || canonicalSide === 'SHORT_ONLY';
  if (call === 'BLOCK' && canonicalOneSided && asked !== -100) call = 'REFRAME';
  if ((call === 'PROCEED' || call === 'TRIM') && oneSided) call = 'REFRAME';
  if (call === 'REFRAME' && !oneSided) call = statedSide === 'NONE' ? 'BLOCK' : 'TRIM';

  const side = call === 'BLOCK' ? null : canonicalOneSided ? canonicalSide : statedSide;
  const allow: AllowedSide =
    call === 'BLOCK' ? 'NONE' : call === 'REFRAME' ? (side as 'LONG_ONLY' | 'SHORT_ONLY') : 'BOTH';

  const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';
  if (!reason) throw new Error('the model gave no reason');

  // A penalty is a consequence of the call, not an independent field.
  // REFRAME is not punished twice: losing a side is already the cost, and
  // taxing the survivor below the 75% bar would re-create the block it replaced.
  const negative = asked > 0 ? -asked : asked;
  const confidencePenalty =
    call === 'BLOCK'
      ? -100
      : call === 'TRIM'
        ? Math.max(-15, Math.min(-1, negative))
        : call === 'REFRAME'
          ? Math.max(-10, Math.min(0, negative))
          : 0;

  const waitFor = typeof parsed.waitFor === 'string' ? parsed.waitFor.trim() : '';

  return {
    at: input.now,
    atStr: new Date(input.now).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
    spot: Math.round(input.spot ?? 0),
    call,
    reason,
    read: typeof parsed.read === 'string' ? parsed.read.trim() : '',
    allow,
    waitFor: call === 'REFRAME' ? waitFor : '',
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

/** The one direction the engine may still take, or null when both stand. */
export const allowedDirectionOf = (verdict: LiveVerdict | null): 'LONG' | 'SHORT' | null =>
  verdict?.allow === 'LONG_ONLY' ? 'LONG' : verdict?.allow === 'SHORT_ONLY' ? 'SHORT' : null;

/**
 * How long an opinion goes unchallenged before it is asked again.
 *
 * A verdict is a judgement about a market at a price and a moment, and the
 * entry window is only twenty minutes long. Letting one 09:26 answer stand
 * unchallenged until 09:45 is how a single model round-trip silently becomes
 * the whole session's decision.
 */
export const VERDICT_TTL_MS = 6 * 60 * 1000;

/**
 * True once the verdict has stopped describing the market in front of it:
 * either it has aged out, or price has travelled a full arm band away from the
 * level it was judged at, at which point the setup being judged is a different
 * one.
 *
 * This schedules a re-ask. It does NOT lift the verdict.
 *
 * The distinction is the whole safety of the feature. A BLOCK is raised on
 * conditions that are true for the day - no room between the walls, a range
 * built from too few ticks, a feed that cannot be trusted - and none of them
 * stop being true because six minutes passed or price moved thirty-one points.
 * An opinion here is replaced only by another opinion, never by the clock: a
 * blocked day reopens when the officer is asked again and answers differently,
 * which is exactly the loop that keeps the session alive without ever letting
 * a veto expire into an unattended live order.
 */
export function needsFreshVerdict(verdict: LiveVerdict | null, spot: number | null, now: number): boolean {
  if (!verdict) return true;
  if (now - verdict.at >= VERDICT_TTL_MS) return true;
  if (spot != null && isFinite(spot) && verdict.spot > 0) {
    return Math.abs(spot - verdict.spot) > SNIPER.zoneBuffer;
  }
  return false;
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
