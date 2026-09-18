import { FyersQuote, VisionBias } from '../types';

export interface PilotSource {
  kind: 'PREMARKET' | 'VISION';
  id: string;
  at: number;
  label: string;
}

export interface PilotVisionRead {
  bias: VisionBias;
  priceAction: string;
  oiRead: string;
  combinedView: string;
  watchFor: string[];
  risks: string[];
  supportRepeated: boolean;
  resistanceRepeated: boolean;
  supportObservedSince?: number;
  resistanceObservedSince?: number;
}

export type PilotSide = 'CE' | 'PE';
export type PilotScenario = 'FLAT' | 'UP_50' | 'UP_100' | 'DOWN_50' | 'DOWN_100' | 'OUTSIDE';
export type PilotWallTrend = 'BUILDING' | 'UNCHANGED' | 'UNWINDING' | 'UNKNOWN';
export type PilotSetup = 'CONTINUATION' | 'REVERSAL' | 'NONE';

export interface PilotScenarioPlan {
  scenario: Exclude<PilotScenario, 'OUTSIDE'>;
  expectation: string;
  confirmation: string;
  invalidation: string;
}

export interface PilotPlan {
  id: string;
  day: string;
  savedAt: number;
  previousClose: number;
  flatBand: number;
  mediumBand: number;
  outerBand: number;
  notes: string;
  scenarios: PilotScenarioPlan[];
  source?: PilotSource;
}

export interface PilotObservation {
  id: string;
  day: string;
  recordedAt: number;
  observedAt: number;
  preOpen: number | null;
  giftChange: number | null;
  support: number | null;
  resistance: number | null;
  supportTrend: PilotWallTrend;
  resistanceTrend: PilotWallTrend;
  notes: string;
  source?: PilotSource;
  vision?: PilotVisionRead;
}

export interface PilotCheck {
  label: string;
  pass: boolean;
  detail: string;
}

export interface PilotAssessment {
  at: number;
  status: 'WAIT' | 'CONTINUATION WATCH' | 'REVERSAL WATCH' | 'PAPER ENTRY READY';
  side: PilotSide | null;
  setup: PilotSetup;
  reason: string;
  checks: PilotCheck[];
  spot: number | null;
  /** Actual source timestamp; optional only for older saved assessments. */
  snapshotAt?: number | null;
  daySentiment: number | null;
  sentimentDelta: number | null;
  move1m: number | null;
  move5m: number | null;
  openingHigh: number | null;
  openingLow: number | null;
  support: number | null;
  resistance: number | null;
  wallDistance: number | null;
  scenario: PilotScenario | null;
}

export interface PilotContract {
  quote: FyersQuote;
  strike: number;
  side: PilotSide;
  expiry: string;
  quoteAt: number;
}

export interface PilotPosition {
  id: string;
  day: string;
  symbol: string;
  expiry: string;
  strike: number;
  side: PilotSide;
  lots: number;
  lotSize: number;
  quantity: number;
  brokerage: number;
  entryAt: number;
  entryQuoteAt: number;
  entryPremium: number;
  stopPremium: number;
  targetPremium: number;
  mark: number;
  markAt: number;
  highPremium: number;
  lowPremium: number;
  assessment: PilotAssessment;
  planId: string | null;
  observationId: string | null;
  reason: string;
  override: boolean;
  samplingGap?: boolean;
}

export interface PilotTrade extends PilotPosition {
  exitAt: number;
  exitQuoteAt: number;
  exitPremium: number;
  exitReason: 'TARGET' | 'STOPLOSS' | 'MANUAL' | 'RECONCILED';
  exitNote?: string;
  exitRecordedAt?: number;
  grossPnl: number;
  charges: number;
  netPnl: number;
  samplingGap: boolean;
}

export interface PilotFrame {
  id: string;
  day: string;
  at: number;
  assessment: PilotAssessment;
  planId: string | null;
  observationId: string | null;
  callsOI: number | null;
  putsOI: number | null;
  optionsSentiment: number | null;
}

export interface PilotDecision {
  id: string;
  day: string;
  at: number;
  action: 'SKIP' | 'BUY_CE' | 'BUY_PE';
  reason: string;
  assessment: PilotAssessment;
}

export interface PilotBook {
  version: 1;
  plans: PilotPlan[];
  observations: PilotObservation[];
  frames: PilotFrame[];
  decisions: PilotDecision[];
  position: PilotPosition | null;
  trades: PilotTrade[];
}
