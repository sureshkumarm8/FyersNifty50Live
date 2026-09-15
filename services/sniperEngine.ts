/**
 * SNIPER ENGINE - "Nifty Sniper: The Office Protocol"
 * ---------------------------------------------------
 * The live half of the system. Where services/sniperPlaybook.ts plans the day
 * before the open, this decides - minute by minute - what the protocol permits
 * right now.
 *
 * Every rule traces to my_system_template_*.json:
 *   09:15-09:25  The Download   watch only, mark the 5-min high/low
 *   09:25-09:45  Entry Window   buy CE at support / PE at resistance
 *   09:45-10:15  Manage only    no new entries
 *   10:15        Hard Stop      flat, win or lose
 *   Target +30 / Stop -30, strike 250 points ITM, one trade per day.
 *
 * Pure module: no React, no I/O, no clock of its own (the time is always an
 * argument) so every branch is unit testable.
 */

import { SNIPER } from './sniperPlaybook';
import { MarketSnapshot } from '../types';

export type SniperPhase =
  | 'PRE_OPEN'      // before 09:15 - nothing to do
  | 'DOWNLOAD'      // 09:15-09:25 - watch, mark the range
  | 'ENTRY_WINDOW'  // 09:25-09:45 - the only window that may open a trade
  | 'MANAGE_ONLY'   // 09:45-10:15 - existing trade only
  | 'HARD_STOP'     // >= 10:15 - flat
  | 'AFTER_HOURS';

export interface OpeningRange {
  /** Highest print seen between 09:15 and 09:25. */
  high: number;
  /** Lowest print seen between 09:15 and 09:25. */
  low: number;
  /** First print at/after 09:15. */
  open: number;
  /** Support = low - 50, floored to the strike step (matches MySystem). */
  support: number;
  /** Resistance = high + 50, ceiled to the strike step. */
  resistance: number;
  openType: 'GAP_UP' | 'GAP_DOWN' | 'FLAT';
  /** How many snapshots the range was built from - low counts are unreliable. */
  samples: number;
  lockedAt: number;
}

export type ZoneState = 'NEAR_SUPPORT' | 'NEAR_RESISTANCE' | 'MID_RANGE' | 'BELOW_SUPPORT' | 'ABOVE_RESISTANCE';

export interface SniperSetup {
  direction: 'LONG' | 'SHORT';
  optionType: 'CE' | 'PE';
  strike: number;
  itmPoints: number;
  /** Spot level the trade is anchored to. */
  entrySpot: number;
  targetSpot: number;
  stopSpot: number;
  zone: ZoneState;
  confidence: number;
  reasoning: string[];
  expiry: string;
  symbol: string;
  createdAt: number;
}

export interface SniperBlock {
  code:
    | 'PHASE'
    | 'NO_RANGE'
    | 'DAILY_DONE'
    | 'IN_TRADE'
    | 'MID_RANGE'
    | 'ZONE_BROKEN'
    | 'CONFIDENCE'
    | 'DIRECTION_CONFLICT'
    | 'SIDE_RESTRICTED'
    | 'NO_ROOM'
    | 'THESIS'
    | 'NO_DATA';
  message: string;
}

export interface SniperEvaluation {
  phase: SniperPhase;
  phaseLabel: string;
  minutesToEntry: number | null;
  minutesToNoNewEntries: number | null;
  minutesToHardStop: number | null;
  zone: ZoneState | null;
  distanceToSupport: number | null;
  distanceToResistance: number | null;
  setup: SniperSetup | null;
  blocks: SniperBlock[];
  /** True only when a trade may be opened right now. */
  canEnter: boolean;
  /** True when the protocol demands any open position be closed. */
  mustExit: boolean;
  /** The walls this evaluation actually used, after reconciliation. */
  tradedSupport: number | null;
  tradedResistance: number | null;
  /** Confidence after the thesis adjustment, so the UI can show the real bar. */
  effectiveConfidence: number;
  /** The only side still open today, when the day has been narrowed to one. */
  restrictedTo: 'LONG' | 'SHORT' | null;
}

// --- time -------------------------------------------------------------------

/** Minutes since IST midnight. The host timezone is irrelevant. */
export function istMinutesOf(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);
  return (
    Number(parts.find(p => p.type === 'hour')?.value ?? 0) * 60 +
    Number(parts.find(p => p.type === 'minute')?.value ?? 0)
  );
}

export const hhmmToMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const MARKET_OPEN = hhmmToMinutes(SNIPER.downloadStart); // 09:15
export const ENTRY_OPEN = hhmmToMinutes(SNIPER.entryStart);     // 09:25
export const ENTRY_CLOSE = hhmmToMinutes(SNIPER.reviewBy);      // 09:45
export const HARD_STOP = hhmmToMinutes(SNIPER.hardStop);        // 10:15
/** The engine disarms itself here — the protocol's day is over. */
export const STAND_DOWN = hhmmToMinutes(SNIPER.standDown);      // 10:20

const PHASE_LABEL: Record<SniperPhase, string> = {
  PRE_OPEN: 'Pre-open — the market has not started',
  DOWNLOAD: 'The Download — watch only, marking the 5-minute range',
  ENTRY_WINDOW: 'Entry Window — the setup may be taken now',
  MANAGE_ONLY: 'Manage only — no new entries after 09:45',
  HARD_STOP: 'Hard Stop — 10:15 passed, everything is flat',
  AFTER_HOURS: 'After hours — the protocol is done for today'
};

export function phaseAt(now: Date): SniperPhase {
  const m = istMinutesOf(now);
  if (m < MARKET_OPEN) return 'PRE_OPEN';
  if (m < ENTRY_OPEN) return 'DOWNLOAD';
  if (m < ENTRY_CLOSE) return 'ENTRY_WINDOW';
  if (m < HARD_STOP) return 'MANAGE_ONLY';
  if (m < 15 * 60 + 30) return 'HARD_STOP';
  return 'AFTER_HOURS';
}

export const phaseLabelOf = (phase: SniperPhase) => PHASE_LABEL[phase];

/** IST calendar day, used to reset the one-trade-per-day flag. */
export const istDayKey = (ts: number) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(ts));

// --- opening range ----------------------------------------------------------

const floorTo = (v: number, step: number) => Math.floor(v / step) * step;
const ceilTo = (v: number, step: number) => Math.ceil(v / step) * step;

/**
 * Minutes-since-IST-midnight for a snapshot. Prefers the epoch stamp; falls
 * back to the "HH:MM:SS" label, which is already rendered in IST.
 */
export function snapshotMinutes(snap: MarketSnapshot): number | null {
  if (typeof snap.timestamp === 'number' && isFinite(snap.timestamp)) {
    return istMinutesOf(new Date(snap.timestamp));
  }
  const m = /^(\d{1,2}):(\d{2})/.exec(snap.time ?? '');
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Builds the 09:15-09:25 opening range.
 *
 * The old implementation used `history.slice(0, 10)` - but historyLog[0] is the
 * NEWEST snapshot, so that was a rolling window of the last ten minutes and had
 * nothing to do with the opening range. Snapshots are filtered by their actual
 * IST timestamp instead.
 */
export function buildOpeningRange(
  history: MarketSnapshot[],
  prevClose: number | null,
  now: Date
): OpeningRange | null {
  const today = istDayKey(now.getTime());

  const stamped = history
    .map(s => ({ snap: s, at: snapshotMinutes(s), day: s.timestamp ? istDayKey(s.timestamp) : today }))
    .filter(x => x.at !== null && x.day === today)
    .filter(x => (x.at as number) >= MARKET_OPEN && (x.at as number) < ENTRY_OPEN)
    // history is newest-first; sort ascending so [0] really is the open.
    .sort((a, b) => (a.at as number) - (b.at as number));

  if (stamped.length === 0) return null;

  const prices = stamped
    .map(x => x.snap.niftyLtp)
    .filter(p => typeof p === 'number' && isFinite(p) && p > 0);
  if (prices.length === 0) return null;

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const open = prices[0];

  let openType: OpeningRange['openType'] = 'FLAT';
  if (prevClose && prevClose > 0) {
    if (open > prevClose + SNIPER.targetPoints) openType = 'GAP_UP';
    else if (open < prevClose - SNIPER.targetPoints) openType = 'GAP_DOWN';
  }

  return {
    high,
    low,
    open,
    support: floorTo(low - 50, SNIPER.strikeStep),
    resistance: ceilTo(high + 50, SNIPER.strikeStep),
    openType,
    samples: prices.length,
    lockedAt: now.getTime()
  };
}

export function classifyZone(spot: number, range: OpeningRange): ZoneState {
  if (spot < range.support - SNIPER.zoneBuffer) return 'BELOW_SUPPORT';
  if (spot > range.resistance + SNIPER.zoneBuffer) return 'ABOVE_RESISTANCE';
  if (spot <= range.support + SNIPER.zoneBuffer) return 'NEAR_SUPPORT';
  if (spot >= range.resistance - SNIPER.zoneBuffer) return 'NEAR_RESISTANCE';
  return 'MID_RANGE';
}

// --- setup ------------------------------------------------------------------

export function buildSetup(params: {
  zone: 'NEAR_SUPPORT' | 'NEAR_RESISTANCE';
  spot: number;
  range: OpeningRange;
  confidence: number;
  reasons: string[];
  expiry: string;
  now: Date;
}): SniperSetup {
  const { zone, spot, range, confidence, reasons, expiry, now } = params;
  const isLong = zone === 'NEAR_SUPPORT';
  const anchor = isLong ? range.support : range.resistance;

  // MySystem derives the strike from the ATM at entry, 250 points in the money.
  const atm = Math.round(spot / SNIPER.strikeStep) * SNIPER.strikeStep;
  const strike = isLong ? atm - SNIPER.itmPoints : atm + SNIPER.itmPoints;

  return {
    direction: isLong ? 'LONG' : 'SHORT',
    optionType: isLong ? 'CE' : 'PE',
    strike,
    itmPoints: SNIPER.itmPoints,
    entrySpot: Math.round(spot),
    targetSpot: Math.round(spot + (isLong ? SNIPER.targetPoints : -SNIPER.targetPoints)),
    stopSpot: Math.round(spot - (isLong ? SNIPER.stopPoints : -SNIPER.stopPoints)),
    zone,
    confidence: Math.round(confidence),
    reasoning: [
      isLong
        ? `Price at support ${anchor} — buying the bounce`
        : `Price at resistance ${anchor} — fading the push`,
      `${SNIPER.itmPoints}-point ITM ${isLong ? 'call' : 'put'} for delta`,
      `Target +${SNIPER.targetPoints} / stop -${SNIPER.stopPoints} on spot`,
      ...reasons
    ],
    expiry,
    symbol: `NIFTY${expiry}${strike}${isLong ? 'CE' : 'PE'}`,
    createdAt: now.getTime()
  };
}

// --- the decision -----------------------------------------------------------

export interface SniperContext {
  now: Date;
  spot: number | null;
  range: OpeningRange | null;
  /** Direction the live signal engine currently favours. */
  signalDirection: 'LONG' | 'SHORT' | 'NEUTRAL';
  signalConfidence: number;
  signalReasons: string[];
  hasOpenPosition: boolean;
  dailyTradeDone: boolean;
  expiry: string;
  /**
   * The morning's thesis after it has been checked against the tape.
   *
   * Optional so the engine keeps working with no pre-market plan at all - it
   * then trades the raw opening range exactly as it always did. When present it
   * does three things: replaces the range's walls with the reconciled ones,
   * moves the confidence bar by the weight of the day's evidence, and can veto
   * the day outright.
   */
  thesis?: {
    support: number | null;
    resistance: number | null;
    confidenceDelta: number;
    veto: string | null;
    state: string;
    /**
     * The only side still open today, when something has ruled the other one
     * out - a risk officer REFRAME, typically.
     *
     * This is the difference between "the morning's direction was wrong" and
     * "there is no trade today". A bearish tape under a bullish plan does not
     * end the session; it ends the bounce and leaves the fade at resistance
     * standing. Set to 'SHORT' it blocks entries at support while price is
     * there, and arms normally the moment price reaches resistance. Null means
     * both plays stand, which is the default and the behaviour when no opinion
     * has been given.
     */
    allowedDirection?: 'LONG' | 'SHORT' | null;
    /** Shown on the blocked side, so the restriction explains itself. */
    allowedReason?: string | null;
  } | null;
}

export function evaluate(ctx: SniperContext): SniperEvaluation {
  const phase = phaseAt(ctx.now);
  const mins = istMinutesOf(ctx.now);
  const blocks: SniperBlock[] = [];

  /**
   * The walls actually traded.
   *
   * Reconciliation may replace either wall with the pre-market level when the
   * tape confirmed it - a level three charts and an OI wall agree on is worth
   * more than one derived mechanically from ten minutes of ticks. Only finite
   * positive numbers in the right order are accepted; anything else falls back
   * to the raw range, because a malformed thesis must never widen a zone into
   * a trade that the range itself would have refused.
   */
  const t = ctx.thesis;
  const usable =
    !!ctx.range &&
    !!t &&
    t.support != null &&
    t.resistance != null &&
    isFinite(t.support) &&
    isFinite(t.resistance) &&
    t.resistance > t.support;

  const range: OpeningRange | null = !ctx.range
    ? null
    : usable
      ? { ...ctx.range, support: t!.support as number, resistance: t!.resistance as number }
      : ctx.range;

  const confidenceDelta = t && isFinite(t.confidenceDelta) ? t.confidenceDelta : 0;
  const effectiveConfidence = Math.max(0, Math.min(100, ctx.signalConfidence + confidenceDelta));

  const base: SniperEvaluation = {
    phase,
    phaseLabel: PHASE_LABEL[phase],
    minutesToEntry: mins < ENTRY_OPEN ? ENTRY_OPEN - mins : null,
    minutesToNoNewEntries: mins < ENTRY_CLOSE ? ENTRY_CLOSE - mins : null,
    minutesToHardStop: mins < HARD_STOP ? HARD_STOP - mins : null,
    zone: null,
    distanceToSupport: null,
    distanceToResistance: null,
    setup: null,
    blocks,
    canEnter: false,
    mustExit: mins >= HARD_STOP && ctx.hasOpenPosition,
    tradedSupport: range?.support ?? null,
    tradedResistance: range?.resistance ?? null,
    effectiveConfidence,
    restrictedTo: t?.allowedDirection ?? null
  };

  if (base.mustExit) {
    blocks.push({ code: 'PHASE', message: `${SNIPER.hardStop} hard stop — closing everything, win or lose.` });
    return base;
  }

  if (ctx.spot == null) {
    blocks.push({ code: 'NO_DATA', message: 'No Nifty price yet.' });
    return base;
  }

  if (range) {
    base.zone = classifyZone(ctx.spot, range);
    base.distanceToSupport = Math.round(ctx.spot - range.support);
    base.distanceToResistance = Math.round(range.resistance - ctx.spot);
  }

  // The thesis veto is checked first and stated plainly. It is the answer to
  // "the morning's read was wrong, now what" - and the answer is: not today.
  if (t?.veto) {
    blocks.push({ code: 'THESIS', message: t.veto });
  }

  if (phase !== 'ENTRY_WINDOW') {
    blocks.push({
      code: 'PHASE',
      message:
        phase === 'DOWNLOAD'
          ? `The Download runs until ${SNIPER.entryStart}. Watching only — no trade may be opened.`
          : phase === 'MANAGE_ONLY'
            ? `Past ${SNIPER.reviewBy}. Your rule: if there was no setup by now, close the laptop.`
            : phase === 'PRE_OPEN'
              ? `Market opens at ${SNIPER.downloadStart}.`
              : 'Outside the protocol window.'
    });
  }

  if (ctx.dailyTradeDone) {
    blocks.push({ code: 'DAILY_DONE', message: 'Today\'s one trade is already done. No second trade — ever.' });
  }
  if (ctx.hasOpenPosition) {
    blocks.push({ code: 'IN_TRADE', message: 'A position is open. Manage it; do not stack another.' });
  }
  if (!range) {
    blocks.push({
      code: 'NO_RANGE',
      message: `The 09:15-${SNIPER.entryStart} range is not marked yet — there is nothing to trade against.`
    });
  }

  if (range) {
    const width = range.resistance - range.support;
    if (width < SNIPER.minZoneWidth) {
      blocks.push({
        code: 'NO_ROOM',
        message: `Range is only ${width} points. A ${SNIPER.targetPoints}-point target cannot fit. Skip the day.`
      });
    }

    switch (base.zone) {
      case 'MID_RANGE':
        blocks.push({
          code: 'MID_RANGE',
          message: `Price is mid-range (${base.distanceToSupport} from support, ${base.distanceToResistance} from resistance). Let it come to a zone.`
        });
        break;
      case 'BELOW_SUPPORT':
        blocks.push({
          code: 'ZONE_BROKEN',
          message: 'Support has broken. That is a breakout, not the reversion this system trades.'
        });
        break;
      case 'ABOVE_RESISTANCE':
        blocks.push({
          code: 'ZONE_BROKEN',
          message: 'Resistance has broken. That is a breakout, not the reversion this system trades.'
        });
        break;
    }
  }

  if (effectiveConfidence < SNIPER.minEngineConfidence) {
    blocks.push({
      code: 'CONFIDENCE',
      message:
        confidenceDelta === 0
          ? `Signal confidence ${Math.round(ctx.signalConfidence)}% is below the ${SNIPER.minEngineConfidence}% the protocol demands.`
          : `Signal confidence ${Math.round(ctx.signalConfidence)}% ${confidenceDelta > 0 ? '+' : ''}${Math.round(confidenceDelta)} from the morning's thesis = ${Math.round(effectiveConfidence)}%, below the ${SNIPER.minEngineConfidence}% the protocol demands.`
    });
  }

  const wantsLong = base.zone === 'NEAR_SUPPORT';
  const wantsShort = base.zone === 'NEAR_RESISTANCE';
  if ((wantsLong && ctx.signalDirection === 'SHORT') || (wantsShort && ctx.signalDirection === 'LONG')) {
    blocks.push({
      code: 'DIRECTION_CONFLICT',
      message: `Price is at ${wantsLong ? 'support' : 'resistance'} but the live signal says ${ctx.signalDirection}. Entry must align with the immediate trend.`
    });
  }

  /**
   * A one-sided day blocks the side that was ruled out, not the day.
   *
   * The block is raised only while price is actually at the closed wall - the
   * whole point of a restriction is that the surviving play stays armed and
   * fires normally when price gets to it.
   */
  const allowed = t?.allowedDirection ?? null;
  if (allowed && ((wantsLong && allowed === 'SHORT') || (wantsShort && allowed === 'LONG'))) {
    const survivor = allowed === 'LONG' ? 'the bounce at support' : 'the fade at resistance';
    blocks.push({
      code: 'SIDE_RESTRICTED',
      message: `Today is restricted to ${survivor}${t?.allowedReason ? ` — ${t.allowedReason}` : ''}. Price is at the other wall, so this one is not taken.`
    });
  }

  base.canEnter = blocks.length === 0 && (wantsLong || wantsShort);

  if (base.canEnter && range) {
    base.setup = buildSetup({
      zone: wantsLong ? 'NEAR_SUPPORT' : 'NEAR_RESISTANCE',
      spot: ctx.spot,
      range,
      confidence: effectiveConfidence,
      reasons: ctx.signalReasons.slice(0, 3),
      expiry: ctx.expiry,
      now: ctx.now
    });
  }

  return base;
}

/**
 * Exit check for an open sniper position, in spot points.
 * The protocol exits on whichever comes first: target, stop, or 10:15.
 */
export function checkExit(params: {
  setup: SniperSetup;
  spot: number;
  now: Date;
}): { exit: boolean; reason: 'TARGET' | 'STOP' | 'HARD_STOP' | null; pointsMoved: number } {
  const { setup, spot, now } = params;
  const sign = setup.direction === 'LONG' ? 1 : -1;
  const pointsMoved = Math.round((spot - setup.entrySpot) * sign);

  if (istMinutesOf(now) >= HARD_STOP) return { exit: true, reason: 'HARD_STOP', pointsMoved };
  if (pointsMoved >= SNIPER.targetPoints) return { exit: true, reason: 'TARGET', pointsMoved };
  if (pointsMoved <= -SNIPER.stopPoints) return { exit: true, reason: 'STOP', pointsMoved };
  return { exit: false, reason: null, pointsMoved };
}
