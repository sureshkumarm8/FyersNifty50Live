import { dbService } from './db';
import { emptyPilotBook, pilotPremiumLevels } from './openingPilot';
import {
  PilotAssessment, PilotBook, PilotDecision, PilotFrame, PilotObservation,
  PilotPlan, PilotPosition, PilotTrade
} from './openingPilotTypes';

export const PILOT_STORE_KEY = 'opening_pilot_book_v1';
export const PILOT_WRITER_LOCK = 'opening-pilot-writer-v1';
const scenarios = ['FLAT', 'UP_50', 'UP_100', 'DOWN_50', 'DOWN_100'];
const trends = ['BUILDING', 'UNCHANGED', 'UNWINDING', 'UNKNOWN'];
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const positive = (v: unknown): v is number => finite(v) && v > 0;
const optionalNumber = (v: unknown) => v === null || finite(v);
const text = (v: unknown): v is string => typeof v === 'string';
const oneOf = (v: unknown, values: string[]) => text(v) && values.includes(v);
const day = (v: unknown) => text(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const nullableId = (v: unknown) => v === null || text(v);
const arrayOf = <T>(v: unknown, guard: (item: unknown) => item is T): v is T[] =>
  Array.isArray(v) && v.every(guard);

function source(v: unknown): boolean {
  return v === undefined || (record(v) && oneOf(v.kind, ['PREMARKET', 'VISION'])
    && text(v.id) && positive(v.at) && text(v.label));
}

function vision(v: unknown): boolean {
  return v === undefined || (record(v) && oneOf(v.bias, ['bullish', 'bearish', 'neutral', 'choppy', 'unclear'])
    && text(v.priceAction) && text(v.oiRead) && text(v.combinedView)
    && arrayOf(v.watchFor, text) && arrayOf(v.risks, text)
    && (v.supportObservedSince === undefined || positive(v.supportObservedSince))
    && (v.resistanceObservedSince === undefined || positive(v.resistanceObservedSince))
    && typeof v.supportRepeated === 'boolean' && typeof v.resistanceRepeated === 'boolean');
}

function assessment(v: unknown): v is PilotAssessment {
  return record(v) && positive(v.at)
    && oneOf(v.status, ['WAIT', 'CONTINUATION WATCH', 'REVERSAL WATCH', 'PAPER ENTRY READY'])
    && (v.side === null || oneOf(v.side, ['CE', 'PE']))
    && oneOf(v.setup, ['CONTINUATION', 'REVERSAL', 'NONE']) && text(v.reason)
    && Array.isArray(v.checks) && v.checks.every(c =>
      record(c) && text(c.label) && typeof c.pass === 'boolean' && text(c.detail))
    && ['spot', 'daySentiment', 'sentimentDelta', 'move1m', 'move5m', 'openingHigh',
      'openingLow', 'support', 'resistance', 'wallDistance'].every(k => optionalNumber(v[k]))
    && (v.snapshotAt === undefined || optionalNumber(v.snapshotAt))
    && (v.scenario === null || oneOf(v.scenario, [...scenarios, 'OUTSIDE']));
}

function plan(v: unknown): v is PilotPlan {
  return record(v) && text(v.id) && day(v.day) && positive(v.savedAt)
    && positive(v.previousClose) && finite(v.flatBand) && v.flatBand >= 0 && positive(v.mediumBand)
    && positive(v.outerBand) && v.flatBand < v.mediumBand && v.mediumBand < v.outerBand
    && text(v.notes) && source(v.source) && Array.isArray(v.scenarios) && v.scenarios.length === 5
    && new Set(v.scenarios.map(s => record(s) ? s.scenario : null)).size === 5
    && v.scenarios.every(s => record(s) && oneOf(s.scenario, scenarios)
      && text(s.expectation) && text(s.confirmation) && text(s.invalidation));
}

function observation(v: unknown): v is PilotObservation {
  return record(v) && text(v.id) && day(v.day) && positive(v.recordedAt) && positive(v.observedAt)
    && ['preOpen', 'giftChange', 'support', 'resistance'].every(k => optionalNumber(v[k]))
    && oneOf(v.supportTrend, trends) && oneOf(v.resistanceTrend, trends) && text(v.notes)
    && source(v.source) && vision(v.vision);
}

function position(v: unknown): v is PilotPosition {
  return record(v) && text(v.id) && day(v.day) && text(v.symbol) && day(v.expiry)
    && oneOf(v.side, ['CE', 'PE'])
    && ['strike', 'lots', 'lotSize', 'quantity', 'entryAt', 'entryQuoteAt', 'entryPremium',
      'stopPremium', 'targetPremium', 'mark', 'markAt', 'highPremium', 'lowPremium'].every(k => positive(v[k]))
    && finite(v.brokerage) && v.brokerage >= 0
    && Number.isSafeInteger(v.lots) && Number.isSafeInteger(v.lotSize) && Number.isSafeInteger(v.quantity)
    && finite(v.lots) && finite(v.lotSize) && v.quantity === v.lots * v.lotSize
    && positive(v.entryPremium) && v.stopPremium === pilotPremiumLevels(v.entryPremium).stopPremium
    && v.targetPremium === pilotPremiumLevels(v.entryPremium).targetPremium
    && assessment(v.assessment) && nullableId(v.planId) && nullableId(v.observationId)
    && text(v.reason) && typeof v.override === 'boolean'
    && (v.samplingGap === undefined || typeof v.samplingGap === 'boolean');
}

function trade(v: unknown): v is PilotTrade {
  return record(v) && position(v) && positive(v.exitAt) && positive(v.exitQuoteAt)
    && positive(v.exitPremium) && oneOf(v.exitReason, ['TARGET', 'STOPLOSS', 'MANUAL', 'RECONCILED'])
    && (v.exitNote === undefined || text(v.exitNote))
    && (v.exitRecordedAt === undefined || positive(v.exitRecordedAt))
    && finite(v.grossPnl) && finite(v.charges) && v.charges >= 0 && finite(v.netPnl)
    && typeof v.samplingGap === 'boolean';
}

function frame(v: unknown): v is PilotFrame {
  return record(v) && text(v.id) && day(v.day) && positive(v.at) && assessment(v.assessment)
    && nullableId(v.planId) && nullableId(v.observationId)
    && optionalNumber(v.callsOI) && optionalNumber(v.putsOI) && optionalNumber(v.optionsSentiment);
}

function decision(v: unknown): v is PilotDecision {
  return record(v) && text(v.id) && day(v.day) && positive(v.at)
    && oneOf(v.action, ['SKIP', 'BUY_CE', 'BUY_PE']) && text(v.reason) && assessment(v.assessment);
}

export function decodePilotBook(value: unknown): PilotBook {
  if (!record(value) || value.version !== 1 || !arrayOf(value.plans, plan)
    || !arrayOf(value.observations, observation) || !arrayOf(value.frames, frame)
    || !arrayOf(value.decisions, decision) || !arrayOf(value.trades, trade)) {
    throw new Error('Opening Pilot storage is invalid or incompatible. Existing data has not been overwritten.');
  }
  let storedPosition: PilotPosition | null = null;
  if (value.position !== null) {
    if (!position(value.position)) throw new Error('Opening Pilot position is invalid. Existing data has not been overwritten.');
    storedPosition = value.position;
  }
  return {
    version: 1, plans: value.plans, observations: value.observations, frames: value.frames,
    decisions: value.decisions, position: storedPosition, trades: value.trades
  };
}

export async function loadPilotBook(): Promise<PilotBook> {
  const value: unknown = await dbService.getMeta(PILOT_STORE_KEY);
  return value === undefined ? emptyPilotBook() : decodePilotBook(value);
}

export async function savePilotBook(book: PilotBook): Promise<void> {
  await dbService.setMeta(PILOT_STORE_KEY, decodePilotBook(book));
}
