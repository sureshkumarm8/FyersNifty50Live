/**
 * SNIPER RECONCILE — the morning's thesis, checked against the live tape.
 *
 * This is the missing half of the system. The pre-market screen forms a thesis
 * from four charts before the bell; the sniper engine watches the 09:15-09:25
 * range and trades it. Until now those two never spoke: the plan was displayed
 * next to the live range and had no influence on whether a trade was taken.
 * That is not how the morning actually works.
 *
 * A trader does this instead:
 *
 *   1. Before the open, decide where the walls are and which way you lean.
 *   2. At the open, ask one question of every claim: is it still true?
 *   3. Where the tape confirms the plan, trade with more size of conviction.
 *   4. Where the tape contradicts it, drop the plan *immediately* and trade
 *      what is in front of you.
 *
 * That loop is implemented here as a set of independent checks, each of which
 * can come back CONFIRMED, BROKEN or UNKNOWN. The checks then decide two
 * things the engine cares about: which support/resistance pair to actually
 * trade, and how much the day's evidence should move the confidence bar.
 *
 * Design rules:
 *   - Pure. No clock of its own, no I/O, no React. Every branch is testable.
 *   - The live tape always wins a factual dispute. A plan level is a forecast;
 *     a traded price is a fact.
 *   - But a plan level *confirmed* by the tape outranks a bare range level,
 *     because it carries evidence the range does not: multiple independent
 *     charts, and OI walls that the writers who sold them will defend.
 *   - Nothing here can authorise a trade. It narrows, vetoes and annotates.
 */

import { SNIPER, SniperPlaybook } from './sniperPlaybook';
import { OpeningRange, istDayKey, snapshotMinutes } from './sniperEngine';
import { MarketSnapshot } from '../types';

export type CheckVerdict = 'CONFIRMED' | 'BROKEN' | 'UNKNOWN';

export interface ThesisCheck {
  id: 'levels' | 'direction' | 'gap' | 'room' | 'verdict' | 'breadth';
  label: string;
  verdict: CheckVerdict;
  /** One sentence, written to be read mid-window under time pressure. */
  detail: string;
  /** Points added to (or taken off) the engine's confidence requirement slack. */
  weight: number;
}

export type ThesisState =
  /** No plan for today, or none that can be checked yet. */
  | 'NO_PLAN'
  /** Plan exists but the tape has not produced enough to check it against. */
  | 'PENDING'
  /** The tape agrees with the morning's read. Trade it with conviction. */
  | 'CONFIRMED'
  /** Partly wrong. Levels have been re-cut to what the tape says. */
  | 'DRIFTED'
  /** The thesis is wrong in a way that matters. Stand down. */
  | 'INVALIDATED';

export interface LiveThesis {
  state: ThesisState;
  /** 0-100. How much of the morning's read survived contact with the tape. */
  score: number;
  /** The support the engine should actually trade. */
  support: number | null;
  /** The resistance the engine should actually trade. */
  resistance: number | null;
  /**
   * Where the traded levels came from:
   *   CONFLUENCE - plan and tape agree, the strongest case this system makes
   *   RANGE      - the tape disagreed with the plan, so the tape is used
   *   PLAN       - no usable range yet, running on the morning's levels
   */
  levelSource: 'CONFLUENCE' | 'RANGE' | 'PLAN' | 'NONE';
  checks: ThesisCheck[];
  /** Human-readable record of every change made to the morning's plan. */
  adjustments: string[];
  /**
   * Confidence adjustment applied to the live signal, in percentage points.
   * Positive when the tape backs the plan, negative when it fights it.
   */
  confidenceDelta: number;
  /** Non-null means no trade may be opened, whatever else agrees. */
  veto: string | null;
  /** Direction the reconciled read favours, or null when it has no opinion. */
  bias: 'LONG' | 'SHORT' | 'NEUTRAL';
}

const round = (n: number) => Math.round(n);
const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

/**
 * How close a plan level and a range level must be to count as the same wall.
 *
 * The arm band is the natural unit: if price being within 30 points of a level
 * is "at" that level for entry purposes, then two levels within 30 points of
 * each other are, for trading purposes, the same level.
 */
export const CONFLUENCE_PTS = SNIPER.zoneBuffer;

/**
 * Beyond this the plan was not describing today's market at all - it is not a
 * drift to be nudged, it is a different day. Two arm bands.
 */
export const DIVORCED_PTS = SNIPER.zoneBuffer * 2;

const EMPTY: LiveThesis = {
  state: 'NO_PLAN',
  score: 0,
  support: null,
  resistance: null,
  levelSource: 'NONE',
  checks: [],
  adjustments: [],
  confidenceDelta: 0,
  veto: null,
  bias: 'NEUTRAL'
};

/**
 * Net drift of the session so far, in points, measured from the first snapshot
 * at or after `sinceMinutes` to the most recent one.
 *
 * Used as a cheap read on whether the tape is going the way the morning said it
 * would. Deliberately crude: it is a sanity check on a thesis, not a signal.
 */
export function sessionDrift(history: MarketSnapshot[], sinceMinutes: number, now: Date): number | null {
  const today = istDayKey(now.getTime());
  const stamped = history
    .filter(s => typeof s.niftyLtp === 'number' && isFinite(s.niftyLtp) && s.niftyLtp > 0)
    .filter(s => (s.timestamp ? istDayKey(s.timestamp) === today : true))
    .map(s => ({ snap: s, at: snapshotMinutes(s) }))
    .filter((x): x is { snap: MarketSnapshot; at: number } => x.at !== null && x.at >= sinceMinutes)
    // history arrives newest-first, so sort ascending before taking the ends.
    .sort((a, b) => a.at - b.at);

  if (stamped.length < 2) return null;
  return round(stamped[stamped.length - 1].snap.niftyLtp - stamped[0].snap.niftyLtp);
}

/**
 * Reconcile the morning's plan with what the market has actually done.
 *
 * Returns the levels to trade, an honest score, and a veto when the thesis has
 * failed in a way that should stop the day.
 */
export function reconcile(params: {
  playbook: SniperPlaybook | null;
  range: OpeningRange | null;
  /** Net points the session has travelled since the open, if known. */
  drift: number | null;
  /** Latest breadth reading, -100..100. Null when the feed is silent. */
  breadth: number | null;
  /**
   * True when the plan was cut before any real price from today existed, so
   * its verdict is a forecast rather than a reading of the session.
   */
  planIsProvisional: boolean;
}): LiveThesis {
  const { playbook, range, drift, breadth, planIsProvisional } = params;

  if (!playbook) {
    // No plan is not an error. The sniper has always been able to trade the
    // range on its own; it just does so without the morning's evidence.
    return {
      ...EMPTY,
      state: 'NO_PLAN',
      support: range?.support ?? null,
      resistance: range?.resistance ?? null,
      levelSource: range ? 'RANGE' : 'NONE',
      adjustments: range ? ['No pre-market plan today — trading the opening range unaided.'] : []
    };
  }

  const checks: ThesisCheck[] = [];
  const adjustments: string[] = [];

  if (!range) {
    return {
      ...EMPTY,
      state: 'PENDING',
      score: 0,
      support: playbook.plannedSupport,
      resistance: playbook.plannedResistance,
      levelSource: 'PLAN',
      checks: [
        {
          id: 'levels',
          label: 'Opening range',
          verdict: 'UNKNOWN',
          detail: `The 09:15-${SNIPER.entryStart} range is not marked yet. Holding the plan's ${fmt(playbook.plannedSupport)} / ${fmt(playbook.plannedResistance)} until the tape says otherwise.`,
          weight: 0
        }
      ],
      adjustments: [],
      confidenceDelta: 0,
      veto: null,
      bias: 'NEUTRAL'
    };
  }

  // --- check 1: did the tape put its walls where the plan said? ------------
  const sGap = round(range.support - playbook.plannedSupport);
  const rGap = round(range.resistance - playbook.plannedResistance);
  const sConfluent = Math.abs(sGap) <= CONFLUENCE_PTS;
  const rConfluent = Math.abs(rGap) <= CONFLUENCE_PTS;
  const divorced = Math.abs(sGap) > DIVORCED_PTS && Math.abs(rGap) > DIVORCED_PTS;

  let support: number;
  let resistance: number;
  let levelSource: LiveThesis['levelSource'];

  if (sConfluent && rConfluent) {
    // Both walls agree. Take the plan's numbers: they are the ones with OI and
    // multi-chart backing behind them, and the range merely ratified them.
    support = playbook.plannedSupport;
    resistance = playbook.plannedResistance;
    levelSource = 'CONFLUENCE';
    checks.push({
      id: 'levels',
      label: 'Levels',
      verdict: 'CONFIRMED',
      detail: `The tape marked its walls within ${Math.max(Math.abs(sGap), Math.abs(rGap))} pts of the plan. Trading the planned ${fmt(support)} / ${fmt(resistance)} — they carry the chart and OI evidence the raw range does not.`,
      weight: 20
    });
  } else if (divorced) {
    support = range.support;
    resistance = range.resistance;
    levelSource = 'RANGE';
    checks.push({
      id: 'levels',
      label: 'Levels',
      verdict: 'BROKEN',
      detail: `The tape is nowhere near the plan — support out by ${sGap > 0 ? '+' : ''}${sGap}, resistance by ${rGap > 0 ? '+' : ''}${rGap}. The morning's levels described a different market.`,
      weight: -25
    });
    adjustments.push(
      `Levels re-cut from the tape: ${fmt(support)} / ${fmt(resistance)} (plan said ${fmt(playbook.plannedSupport)} / ${fmt(playbook.plannedResistance)}).`
    );
  } else {
    // Partial agreement. Take the confirmed wall from the plan and the
    // contested one from the tape - the best available evidence on each side
    // rather than a blanket choice of source.
    support = sConfluent ? playbook.plannedSupport : range.support;
    resistance = rConfluent ? playbook.plannedResistance : range.resistance;
    levelSource = 'RANGE';
    checks.push({
      id: 'levels',
      label: 'Levels',
      verdict: 'UNKNOWN',
      detail: `One wall held, one moved — support ${sGap > 0 ? '+' : ''}${sGap}, resistance ${rGap > 0 ? '+' : ''}${rGap} against the plan. Keeping the confirmed side, taking the other from the tape.`,
      weight: -5
    });
    adjustments.push(
      `${sConfluent ? 'Resistance' : 'Support'} re-cut from the tape to ${fmt(sConfluent ? resistance : support)}.`
    );
  }

  // --- check 2: is the room still there? ------------------------------------
  const width = round(resistance - support);
  if (width < SNIPER.minZoneWidth) {
    checks.push({
      id: 'room',
      label: 'Room',
      verdict: 'BROKEN',
      detail: `Reconciled zone is only ${width} pts. The ${SNIPER.targetPoints}-pt target cannot be reached before the far wall — ${SNIPER.minZoneWidth} is the minimum.`,
      weight: -100
    });
  } else {
    checks.push({
      id: 'room',
      label: 'Room',
      verdict: 'CONFIRMED',
      detail: `${width} pts wall to wall — enough for the ${SNIPER.targetPoints}-pt target with room to spare.`,
      weight: width >= SNIPER.comfortableZoneWidth ? 10 : 0
    });
  }

  // --- check 3: did it open where the plan expected? ------------------------
  const gapPts = playbook.closePrice > 0 ? round(range.open - playbook.closePrice) : null;
  if (gapPts === null) {
    checks.push({
      id: 'gap',
      label: 'Open',
      verdict: 'UNKNOWN',
      detail: 'The plan carried no reference close, so the open cannot be scored against it.',
      weight: 0
    });
  } else {
    // The plan modelled opens out to +/-100. Landing outside that band means
    // every scenario it priced is off the map.
    const modelled = Math.max(...playbook.scenarios.map(s => Math.abs(s.openPrice - playbook.closePrice)), 0);
    const outside = Math.abs(gapPts) > modelled + SNIPER.zoneBuffer;
    checks.push({
      id: 'gap',
      label: 'Open',
      verdict: outside ? 'BROKEN' : 'CONFIRMED',
      detail: outside
        ? `Opened ${gapPts > 0 ? '+' : ''}${gapPts} from the ${fmt(playbook.closePrice)} close — outside every branch the plan modelled (±${round(modelled)}). Its levels are stale by construction.`
        : `Opened ${gapPts > 0 ? '+' : ''}${gapPts} from the ${fmt(playbook.closePrice)} close, inside the modelled ±${round(modelled)} band.`,
      weight: outside ? -20 : 5
    });
    if (outside) {
      adjustments.push(`Open landed outside the plan's modelled range — the morning's bias is being ignored.`);
    }
  }

  // --- check 4: is the tape moving the way the plan leaned? -----------------
  const planLong = playbook.primaryPlay?.direction === 'LONG';
  const planShort = playbook.primaryPlay?.direction === 'SHORT';
  const gapOutside = checks.find(c => c.id === 'gap')?.verdict === 'BROKEN';

  if (drift === null || (!planLong && !planShort)) {
    checks.push({
      id: 'direction',
      label: 'Direction',
      verdict: 'UNKNOWN',
      detail:
        drift === null
          ? 'Not enough session history yet to see which way the tape is leaning.'
          : 'The plan took no directional side, so there is nothing to contradict.',
      weight: 0
    });
  } else {
    const meaningful = Math.abs(drift) >= SNIPER.targetPoints;
    const agrees = (planLong && drift > 0) || (planShort && drift < 0);
    checks.push({
      id: 'direction',
      label: 'Direction',
      verdict: !meaningful ? 'UNKNOWN' : agrees ? 'CONFIRMED' : 'BROKEN',
      detail: !meaningful
        ? `Session has drifted only ${drift > 0 ? '+' : ''}${drift} pts — too flat to confirm or deny the ${planLong ? 'long' : 'short'} lean.`
        : agrees
          ? `Tape has moved ${drift > 0 ? '+' : ''}${drift} pts, the way the plan leaned.`
          : `Plan leaned ${planLong ? 'long' : 'short'} but the tape has gone ${drift > 0 ? '+' : ''}${drift} pts the other way.`,
      weight: !meaningful ? 0 : agrees ? 15 : -20
    });
    if (meaningful && !agrees) {
      adjustments.push(
        `Morning's ${planLong ? 'long' : 'short'} lean dropped — the tape is going the other way. Zone entries only.`
      );
    }
  }

  // --- check 5: breadth, as a cross-check on the lean -----------------------
  if (breadth === null || !isFinite(breadth)) {
    checks.push({
      id: 'breadth',
      label: 'Breadth',
      verdict: 'UNKNOWN',
      detail: 'No breadth reading on the feed.',
      weight: 0
    });
  } else {
    const strong = Math.abs(breadth) >= 20;
    const agrees = (planLong && breadth > 0) || (planShort && breadth < 0) || (!planLong && !planShort);
    checks.push({
      id: 'breadth',
      label: 'Breadth',
      verdict: !strong ? 'UNKNOWN' : agrees ? 'CONFIRMED' : 'BROKEN',
      detail: !strong
        ? `Breadth ${breadth > 0 ? '+' : ''}${round(breadth)}% — no conviction either way.`
        : agrees
          ? `Breadth ${breadth > 0 ? '+' : ''}${round(breadth)}% backs the plan.`
          : `Breadth ${breadth > 0 ? '+' : ''}${round(breadth)}% is against the plan's ${planLong ? 'long' : 'short'} lean.`,
      weight: !strong ? 0 : agrees ? 8 : -12
    });
  }

  // --- check 6: the plan's own verdict --------------------------------------
  //
  // A stand-aside cut against a REAL price is the morning's considered answer
  // and is respected. A stand-aside cut before any price from today existed is
  // a forecast, and a forecast that the tape has since contradicted must not
  // veto a clean session - that is precisely the "adjust immediately" case.
  const standAside = playbook.verdict === 'STAND_ASIDE';
  const tapeIsClean = width >= SNIPER.comfortableZoneWidth && !divorced;

  if (standAside && !planIsProvisional) {
    checks.push({
      id: 'verdict',
      label: 'Verdict',
      verdict: 'BROKEN',
      detail: `The plan stood aside on a real price: "${playbook.verdictReason}". That decision stands.`,
      weight: -100
    });
  } else if (standAside && planIsProvisional && tapeIsClean) {
    checks.push({
      id: 'verdict',
      label: 'Verdict',
      verdict: 'CONFIRMED',
      detail: `The plan stood aside before the open, but the session opened clean with a ${width}-pt zone. The forecast is overruled by the tape.`,
      weight: 0
    });
    adjustments.push(
      `Provisional "stand aside" overruled — it was cut before any price from today existed and the ${width}-pt live zone is tradable.`
    );
  } else if (standAside) {
    checks.push({
      id: 'verdict',
      label: 'Verdict',
      verdict: 'BROKEN',
      detail: `The plan stood aside ("${playbook.verdictReason}") and the tape has given no reason to overrule it.`,
      weight: -100
    });
  } else {
    checks.push({
      id: 'verdict',
      label: 'Verdict',
      verdict: 'CONFIRMED',
      detail: `${playbook.verdictHeadline}`,
      weight: playbook.verdict === 'GO' ? 10 : 0
    });
  }

  // --- roll up ---------------------------------------------------------------
  const hardFail = checks.find(c => c.weight <= -100);
  const broken = checks.filter(c => c.verdict === 'BROKEN');
  const confirmed = checks.filter(c => c.verdict === 'CONFIRMED');
  const scorable = checks.filter(c => c.verdict !== 'UNKNOWN').length;

  const score = scorable === 0 ? 0 : Math.round((confirmed.length / scorable) * 100);

  // Confidence moves by the sum of the soft weights only. A hard fail is a
  // veto, not a number - letting it also drive confidence would double-count.
  const confidenceDelta = Math.max(
    -30,
    Math.min(30, checks.filter(c => c.weight > -100).reduce((sum, c) => sum + c.weight, 0))
  );

  const state: ThesisState = hardFail
    ? 'INVALIDATED'
    : broken.length === 0
      ? 'CONFIRMED'
      : 'DRIFTED';

  // Bias survives only when nothing contradicted it.
  const directionBroken = checks.find(c => c.id === 'direction')?.verdict === 'BROKEN';
  const bias: LiveThesis['bias'] =
    directionBroken || gapOutside || !playbook.primaryPlay
      ? 'NEUTRAL'
      : planLong
        ? 'LONG'
        : planShort
          ? 'SHORT'
          : 'NEUTRAL';

  return {
    state,
    score,
    support,
    resistance,
    levelSource,
    checks,
    adjustments,
    confidenceDelta,
    veto: hardFail ? hardFail.detail : null,
    bias
  };
}
