/**
 * The second opinion. One AI pass per session checkpoint.
 *
 * The four screenshots are read once, by a vision model, into levels and a
 * bias. That read never changes — the charts are the same file all morning.
 * What *does* change is the price those levels are measured against, and that
 * is the whole game: a wall 180 points away at 08:45 is scenery, and the same
 * wall 12 points away at 09:16 is the trade.
 *
 * So each checkpoint gets its own analyst pass over the *same* chart evidence
 * with the *new* price, and each pass is asked a different question:
 *
 *   CHARTS_ONLY  nothing from today exists yet. Enumerate, do not commit.
 *   PREOPEN      the auction has indicated the open. Commit to a zone.
 *   INTRADAY     the market is open. Real price and measured high/low — give the
 *                plan against the real walls and say what is left of the window.
 *
 * The model is deliberately handed the protocol's hard constraints (the 09:25
 * entry window, the 10:15 hard stop, the fixed 30-point target) because an
 * analyst who does not know the rules writes plans that cannot be executed.
 */

import { FyersCredentials } from '../types';
import { callAI, isAIConfigured } from './aiProvider';
import { DecisionBasis } from './premarketSchedule';
import { SNIPER } from './sniperPlaybook';

export interface ReviewLevelNote {
  level: number;
  kind: 'SUPPORT' | 'RESISTANCE';
  /** Why this level matters, in the analyst's words. */
  note: string;
  /** How much weight to give it: the model's own read of its strength. */
  strength: 'MAJOR' | 'MINOR';
}

export interface PhaseReview {
  basis: DecisionBasis;
  at: number;
  atStr: string;
  /** The price this review was written against. */
  spot: number;
  /** One line. What this checkpoint changes about the day. */
  headline: string;
  /** The replacement for the deterministic market summary. */
  summary: string;
  /** What to expect between now and the 10:15 hard stop. */
  expectation: string;
  levelNotes: ReviewLevelNote[];
  /** Ordered, executable steps for this phase. */
  playbook: string[];
  /** The observations that would kill the plan. */
  invalidators: string[];
  /** 0-100. The model's own conviction, not ours. */
  conviction: number;
  /** ACT / WAIT / STAND_ASIDE — the model's call, shown next to ours. */
  stance: 'ACT' | 'WAIT' | 'STAND_ASIDE';
  model: string;
}

export interface ReviewInput {
  basis: DecisionBasis;
  spot: number;
  spotSource: 'LIVE' | 'MANUAL' | 'CHARTS';
  /** Previous session's close, when it is known and different from spot. */
  previousClose?: number | null;
  supports: number[];
  resistances: number[];
  expectedSupport: number;
  expectedResistance: number;
  chartBias: number | null;
  marketBias: number | null;
  agreement: number;
  openSentiment: string;
  riskLevel: string;
  /** Our own deterministic verdict, so the model can agree or dissent. */
  systemVerdict: string;
  systemReason: string;
  charts: {
    short: string;
    weight: number;
    bias: string;
    confidence: number;
    summary: string;
    supports: number[];
    resistances: number[];
    notes: string[];
    stale: boolean;
  }[];
  missingCharts: string[];
  market: {
    niftyLtp: number | null;
    ptsChg: number | null;
    pcr: number | null;
    optionsSent: number | null;
    stockSent: number | null;
    adv: number | null;
    dec: number | null;
    snapshotTime: string | null;
    snapshots: number;
  };
  now?: number;
}

/**
 * What the analyst is allowed to assume at each checkpoint, and what it is
 * being asked for. Keeping these apart is the point of the whole board: a
 * pre-open answer that reads like a live answer is how a day gets traded on a
 * price that never existed.
 */
const PHASE_BRIEF: Record<DecisionBasis, string> = {
  CHARTS_ONLY: `CHECKPOINT 1 of 3 — CHARTS ONLY, BEFORE THE PRE-OPEN AUCTION.
Nothing from today exists yet. The price you are given is last session's close, and every level
you have was drawn on last session's chart. You therefore CANNOT know where the day opens.
Your job is to ENUMERATE, NOT COMMIT: describe what each kind of open would mean, name the
levels that would come into play in each case, and state clearly that no trade can be planned
until a price from today exists. Any confident directional call here is a mistake — say so.
Your "stance" must be WAIT or STAND_ASIDE. Never ACT.`,

  PREOPEN: `CHECKPOINT 2 of 3 — PRE-OPEN CALL AUCTION (09:08-09:14).
The price you are given is the auction's indicative open. This is real information from today:
it tells you the gap, and therefore which of the chart levels are actually in play and which are
now irrelevant scenery. The auction indicates the open — it does not set the day's range, and
it can still move before the bell.
Your job is to COMMIT TO A ZONE: given this gap, name the support and resistance that will
actually matter in the first hour, say which side of the book is live and which is dead, and give
the specific actions to prepare. Be concrete about levels; stay honest that the range is unproven.
Your "stance" may be WAIT or STAND_ASIDE, and ACT only if the gap lands price directly on a
major chart level with room to the opposite wall.`,

  INTRADAY: `CHECKPOINT 3 of 3 — LIVE MARKET, THE REAL READ.
The price you are given is a real traded price from today, together with today's measured HIGH and
LOW. There is no more guessing about the open: every level from the four charts can be measured
against a price that exists, and the day's range (low to high) gives real, tested support and
resistance. Levels already tested and held are stronger than untested ones; levels that broke are
now the opposite kind of level.
This is the checkpoint the whole morning was built for. Give the definitive read: the exact zone
price is trading in, where price sits within today's range, the distance to each wall, which wall
gets tested first and why, and the precise plan for the ${SNIPER.entryStart}-${SNIPER.reviewBy} entry
window — including what is left of it before the ${SNIPER.hardStop} hard stop. Do not hedge — if
there is a trade, name it; if there is not, say why not in one sharp sentence. Take a real position
on "stance".`
};

const SYSTEM = `You are the senior analyst for a single-trade-a-day NIFTY 50 options desk. You are terse,
numerate and allergic to hedging language that hides a lack of a view.

THE DESK'S RULES — every plan you write must be executable inside them:
- Instrument: NIFTY index options, ${SNIPER.itmPoints}-point ITM strikes, ${SNIPER.strikeStep}-point strike steps.
- The ONLY entry window is ${SNIPER.entryStart} to ${SNIPER.reviewBy} IST. Nothing is entered before or after.
- Everything is flat at ${SNIPER.hardStop} IST, winning or losing. There is no "hold for the close".
- The system buys AT support and sells AT resistance. It NEVER chases a breakout.
- Fixed ${SNIPER.targetPoints}-point target, ${SNIPER.stopPoints}-point stop, in index points.
- Price within ${SNIPER.zoneBuffer} points of a level counts as "at" that level.
- A zone narrower than roughly ${SNIPER.targetPoints * 2} points cannot pay for the trade — say so if that is the case.
- At most one trade per day. A missed trade costs nothing; a forced trade costs money.

HOW TO THINK:
- Levels are only meaningful relative to the CURRENT price. Always state distances in points.
- Two independent charts naming the same level is far stronger than one chart naming it twice.
- Open interest walls are where option writers are defending; they are the highest-quality levels
  for this system because writers defend them intraday.
- A stale chart is weaker evidence. A missing chart is a hole in the read, not a neutral vote.
- Distrust your own confidence when the charts disagree.

You will be told which of four session checkpoints you are writing for. Answer AS THAT CHECKPOINT.
Do not write a live-market answer at a pre-open checkpoint.

Reply with ONLY a JSON object, no prose, no markdown fence:
{
  "headline": "<max 14 words: what this checkpoint changes about today>",
  "summary": "<3-5 sentences. The read: where price sits, which walls matter, what the charts collectively say, where they disagree.>",
  "expectation": "<2-4 sentences. What you expect between now and the ${SNIPER.hardStop} hard stop, with levels.>",
  "levelNotes": [
    { "level": <number>, "kind": "SUPPORT" | "RESISTANCE", "strength": "MAJOR" | "MINOR",
      "note": "<max 18 words: why this level matters and what happens at it>" }
  ],
  "playbook": ["<ordered, specific, executable steps for THIS checkpoint. 3-6 items. Include real numbers.>"],
  "invalidators": ["<2-4 observations that would kill this plan>"],
  "conviction": <0-100 integer>,
  "stance": "ACT" | "WAIT" | "STAND_ASIDE"
}`;

const fmtNum = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? 'unknown' : String(Math.round(n * 100) / 100);

const signed = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? 'unknown' : `${n > 0 ? '+' : ''}${Math.round(n * 10) / 10}`;

/** Distance annotation, because the model must never have to do arithmetic. */
const withDistance = (levels: number[], spot: number) =>
  levels.length
    ? levels
        .map(l => `${Math.round(l)} (${l >= spot ? '+' : ''}${Math.round(l - spot)} pts)`)
        .join(', ')
    : 'none reported';

export function buildReviewPrompt(input: ReviewInput): string {
  const spot = input.spot;
  const gap =
    input.previousClose && isFinite(input.previousClose) && Math.abs(spot - input.previousClose) >= 1
      ? `${signed(spot - input.previousClose)} pts vs the ${fmtNum(input.previousClose)} previous close`
      : 'not established';

  const chartBlocks = input.charts
    .map(
      c => `--- ${c.short} (weight ${Math.round(c.weight * 100)}%${c.stale ? ', STALE — captured in an earlier session' : ''})
bias: ${c.bias} at ${c.confidence}% confidence
read: ${c.summary}
supports it named: ${withDistance(c.supports, spot)}
resistances it named: ${withDistance(c.resistances, spot)}
notes: ${c.notes.length ? c.notes.join(' | ') : 'none'}`
    )
    .join('\n');

  const m = input.market;
  const feed =
    m.snapshots > 0
      ? `snapshots: ${m.snapshots} (last at ${m.snapshotTime ?? 'unknown'})
nifty ltp: ${fmtNum(m.niftyLtp)}, points change: ${signed(m.ptsChg)}
pcr: ${fmtNum(m.pcr)}  |  option flow: ${signed(m.optionsSent)}%  |  stock flow: ${signed(m.stockSent)}%
advances/declines: ${m.adv ?? '?'} / ${m.dec ?? '?'}`
      : 'No live snapshots have arrived. You have chart evidence only — weigh your conviction accordingly.';

  return `${PHASE_BRIEF[input.basis]}

=== PRICE ===
Price to anchor everything to: ${fmtNum(spot)} (source: ${input.spotSource.toLowerCase()})
Gap: ${gap}

=== LEVELS ALREADY EXTRACTED FROM THE FOUR CHARTS ===
supports below price: ${withDistance(input.supports, spot)}
resistances above price: ${withDistance(input.resistances, spot)}
the mechanical system picked this working zone: ${input.expectedSupport} - ${input.expectedResistance} (${
    input.expectedResistance - input.expectedSupport
  } pts wide)

=== THE FOUR CHART READS ===
${chartBlocks || 'No readable charts.'}
${input.missingCharts.length ? `\nMISSING CHARTS (holes in the read): ${input.missingCharts.join(', ')}` : ''}

=== AGGREGATES ===
chart bias: ${signed(input.chartBias)}%  |  live market bias: ${signed(input.marketBias)}%
agreement between charts: ${input.agreement}%
expected open sentiment: ${input.openSentiment}  |  system risk grade: ${input.riskLevel}

=== LIVE FEED ===
${feed}

=== THE MECHANICAL SYSTEM'S OWN VERDICT ===
"${input.systemVerdict}" — ${input.systemReason}
You are not obliged to agree. If the mechanical read is wrong for a reason it cannot see, say so
plainly in "summary" and let "stance" differ. If it is right, say why in one line and move on.

Write the JSON for checkpoint ${input.basis} now.`;
}

/** Strips a markdown fence if the model wrapped its JSON in one anyway. */
const unfence = (raw: string): string => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
};

const asStringList = (v: unknown, max: number): string[] =>
  Array.isArray(v)
    ? v
        .map(x => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean)
        .slice(0, max)
    : [];

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * A checkpoint before the open must not be able to return ACT, whatever the
 * model says. The prompt asks for that restraint; this enforces it.
 */
const ALLOWED_STANCE: Record<DecisionBasis, PhaseReview['stance'][]> = {
  CHARTS_ONLY: ['WAIT', 'STAND_ASIDE'],
  PREOPEN: ['ACT', 'WAIT', 'STAND_ASIDE'],
  INTRADAY: ['ACT', 'WAIT', 'STAND_ASIDE']
};

export function parseReview(raw: string, input: ReviewInput, model: string): PhaseReview {
  const parsed = JSON.parse(unfence(raw)) as Record<string, unknown>;
  const now = input.now ?? Date.now();

  const stanceRaw = String(parsed.stance ?? 'WAIT').toUpperCase().replace(/[\s-]/g, '_');
  const allowed = ALLOWED_STANCE[input.basis];
  const stance = (allowed as string[]).includes(stanceRaw)
    ? (stanceRaw as PhaseReview['stance'])
    : allowed[allowed.length - 1];

  const levelNotes: ReviewLevelNote[] = Array.isArray(parsed.levelNotes)
    ? (parsed.levelNotes as Record<string, unknown>[])
        .map(l => ({
          level: Math.round(Number(l?.level)),
          kind: String(l?.kind).toUpperCase() === 'SUPPORT' ? ('SUPPORT' as const) : ('RESISTANCE' as const),
          strength: String(l?.strength).toUpperCase() === 'MAJOR' ? ('MAJOR' as const) : ('MINOR' as const),
          note: typeof l?.note === 'string' ? l.note.trim() : ''
        }))
        .filter(l => isFinite(l.level) && l.level > 0 && !!l.note)
        .slice(0, 10)
    : [];

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  if (!summary) throw new Error('the model returned no summary');

  return {
    basis: input.basis,
    at: now,
    atStr: new Date(now).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
    spot: Math.round(input.spot),
    headline: typeof parsed.headline === 'string' ? parsed.headline.trim() : summary.split('.')[0],
    summary,
    expectation: typeof parsed.expectation === 'string' ? parsed.expectation.trim() : '',
    levelNotes,
    playbook: asStringList(parsed.playbook, 6),
    invalidators: asStringList(parsed.invalidators, 4),
    conviction: clamp(Math.round(Number(parsed.conviction) || 0), 0, 100),
    stance,
    model
  };
}

/** True when a text model is reachable. The vision key alone is not enough. */
export const isReviewConfigured = (credentials: FyersCredentials): boolean => isAIConfigured(credentials);

export async function requestPhaseReview(
  credentials: FyersCredentials,
  input: ReviewInput,
  modelLabel: string
): Promise<PhaseReview> {
  const raw = await callAI(credentials, SYSTEM, buildReviewPrompt(input), { jsonMode: true });
  return parseReview(raw, input, modelLabel);
}
