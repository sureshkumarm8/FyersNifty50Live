import { MarketSnapshot, VisionRun } from '../types';
import { EnhancedSignal } from './enhancedSignalGenerator';
import { Order } from './orderManager';
import { computeCharges } from './paperTradingService';
import { istDayKey, istMinutesOf } from './sniperEngine';
import { isMarketLive } from './marketSession';

const MINUTE = 60_000;
export const MOMENTUM_POLICY = {
  minConfidence: 68,
  cooldownMinutes: 5,
  lossCooldownMinutes: 15,
  maxDailyTrades: 4,
  maxConsecutiveLosses: 2,
  maxDailyLoss: 2000,
  minNetRiskReward: 1.3,
  confirmationMinutes: 2,
  maxSnapshotAgeMs: 90_000,
  maxVisionAgeMs: 5 * MINUTE
};

export interface RoundTrip {
  symbol: string;
  entry: number;
  exit: number;
  qty: number;
  at: number;
  closedAt: number;
}

/** The Momentum book has one long option at a time; unmatched buys remain open. */
export function pairRoundTrips(
  orders: Pick<Order, 'symbol' | 'side' | 'status' | 'filledQty' | 'avgPrice' | 'timestamp'>[],
  day: string
): RoundTrip[] {
  const filled = orders
    .filter(o => o.status === 'FILLED' && istDayKey(o.timestamp) === day)
    .sort((a, b) => a.timestamp - b.timestamp);
  const open = new Map<string, { price: number; qty: number; at: number }>();
  const pairs: RoundTrip[] = [];
  for (const o of filled) {
    if (o.side === 'BUY') {
      open.set(o.symbol, { price: o.avgPrice, qty: o.filledQty, at: o.timestamp });
    } else {
      const entry = open.get(o.symbol);
      if (!entry) continue;
      open.delete(o.symbol);
      pairs.push({
        symbol: o.symbol, entry: entry.price, exit: o.avgPrice,
        qty: entry.qty || o.filledQty, at: entry.at, closedAt: o.timestamp
      });
    }
  }
  return pairs;
}

export interface MomentumCandidate {
  direction: 'LONG' | 'SHORT';
  firstAt: number;
  lastAt: number;
  observations: number;
}

export interface MomentumGate {
  ready: boolean;
  reason: string;
  candidate: MomentumCandidate | null;
  netRiskReward?: number;
}

export interface MomentumGateInput {
  now: number;
  running: boolean;
  tradingMode?: 'PAPER' | 'LIVE';
  signal: EnhancedSignal | null;
  signalAt: number;
  history: MarketSnapshot[];
  spot: number | null;
  orders: Order[];
  openPositions: number;
  premium: number;
  quantity: number;
  targetPct: number;
  stopPct: number;
  minConfidence: number;
  maxDailyTrades?: number;
  brokerage: number;
  requireVision: boolean;
  vision: VisionRun | null;
  visionError?: string | null;
}

/** Pure decision shared by scans, manual entries and automatic entries. */
export function evaluateMomentumEntry(
  input: MomentumGateInput,
  previous: MomentumCandidate | null
): MomentumGate {
  const deny = (reason: string): MomentumGate => ({ ready: false, reason, candidate: null });
  const { now, signal: s, history, spot } = input;
  const policy = MOMENTUM_POLICY;
  if (!input.running) return deny('Engine stopped; entry confirmation reset.');
  if (input.tradingMode === 'LIVE') {
    return deny('LIVE Momentum entries disabled: verified option quotes and broker fill reconciliation are required.');
  }
  if (!Number.isFinite(input.minConfidence)) return deny('Invalid minimum signal score.');
  const maxDailyTrades = input.maxDailyTrades === undefined ? policy.maxDailyTrades : input.maxDailyTrades;
  if (!Number.isSafeInteger(maxDailyTrades) || maxDailyTrades < 1) {
    return deny('Invalid daily entry limit; enter a positive whole number.');
  }
  const minutes = istMinutesOf(new Date(now));
  if (!isMarketLive(new Date(now)) || minutes < 9 * 60 + 30 || minutes >= 15 * 60) {
    return deny('Entry window: 09:30-15:00 IST; wait outside the opening noise.');
  }
  if (input.openPositions > 0 || input.orders.some(o =>
    ['PENDING', 'PLACED', 'PARTIAL'].includes(o.status))) {
    return deny('Position or unconfirmed order already open.');
  }

  const today = istDayKey(now);
  const orders = input.orders.filter(o => istDayKey(o.timestamp) === today);
  const buys = orders.filter(o => o.side === 'BUY' && o.status === 'FILLED');
  if (buys.length >= maxDailyTrades) return deny(`Daily limit: ${maxDailyTrades} entries reached.`);
  const trips = pairRoundTrips(orders, today);
  let netPnl = 0;
  let losses = 0;
  let lastNet = 0;
  for (const trip of trips) {
    if (![trip.entry, trip.exit, trip.qty].every(v => Number.isFinite(v) && v > 0)) {
      return deny('Order book contains an unpriced fill; reconcile it before entering again.');
    }
    lastNet = (trip.exit - trip.entry) * trip.qty
      - computeCharges(trip.entry, trip.qty, 'BUY', input.brokerage).total
      - computeCharges(trip.exit, trip.qty, 'SELL', input.brokerage).total;
    netPnl += lastNet;
    losses = lastNet <= 0 ? losses + 1 : 0;
  }
  if (netPnl <= -policy.maxDailyLoss) return deny(`Daily net loss limit reached (Rs ${policy.maxDailyLoss}).`);
  if (losses >= policy.maxConsecutiveLosses) {
    return deny(`Stand down today: ${policy.maxConsecutiveLosses} consecutive net losses.`);
  }
  const lastExit = trips.at(-1)?.closedAt ?? 0;
  const cooldown = (lastNet <= 0 ? policy.lossCooldownMinutes : policy.cooldownMinutes) * MINUTE;
  const cooldownUntil = lastExit ? lastExit + cooldown : 0;
  if (now < cooldownUntil) {
    return deny(`Post-${lastNet <= 0 ? 'loss' : 'exit'} cooldown: ${Math.ceil((cooldownUntil - now) / MINUTE)}m remaining.`);
  }
  const lastAttempt = Math.max(0, ...orders.filter(o => o.side === 'BUY').map(o => o.timestamp));
  if (now - lastAttempt < MINUTE) return deny('Entry attempt consumed; wait for a fresh setup before retrying.');

  const latest = history[0];
  const snapshotAt = latest?.timestamp;
  if (!Number.isFinite(spot) || !(spot! > 0) || !Number.isFinite(snapshotAt) ||
      now - snapshotAt! > policy.maxSnapshotAgeMs || snapshotAt! > now) {
    return deny('Waiting for a fresh timestamped market snapshot (maximum age 90s).');
  }
  if (!s || s.direction === 'NEUTRAL') return deny('No directional setup.');
  if (input.signalAt !== snapshotAt) return deny('New market data arrived; waiting for a fresh signal scan.');
  if (snapshotAt! <= lastAttempt || snapshotAt! <= cooldownUntil) {
    return deny('Waiting for new market evidence after the previous trade/cooldown.');
  }
  const threshold = Math.max(policy.minConfidence, input.minConfidence);
  if (!Number.isFinite(s.confidence) || s.confidence < threshold) {
    return deny(`Signal score below ${threshold}; this score is not a win probability.`);
  }

  // Use actual elapsed time, not the generator's assumption of five minutes per row.
  const anchor = (age: number) => history.find(h =>
    Number.isFinite(h.timestamp) && h.timestamp! <= snapshotAt! - age * MINUTE);
  const one = anchor(1);
  const five = anchor(5);
  const fifteen = anchor(15);
  if (!one || !five || !fifteen ||
      snapshotAt! - one.timestamp! > 2.5 * MINUTE ||
      snapshotAt! - five.timestamp! > 6.5 * MINUTE ||
      snapshotAt! - fifteen.timestamp! > 16.5 * MINUTE) {
    return deny('Warming up: need continuous, timestamped 1m, 5m and 15m market history.');
  }
  const window = history.slice(0, history.indexOf(fifteen) + 1);
  let path = 0;
  for (let i = 0; i < window.length; i++) {
    const row = window[i];
    if (!Number.isFinite(row.niftyLtp) || row.niftyLtp <= 0 ||
        !Number.isFinite(row.timestamp) || istDayKey(row.timestamp!) !== today) {
      return deny('Invalid or previous-session data in the confirmation window.');
    }
    if (i > 0) {
      const gap = window[i - 1].timestamp! - row.timestamp!;
      if (gap <= 0 || gap > 90_000) return deny('Market history has gaps or duplicate timestamps; waiting for continuous data.');
      path += Math.abs(window[i - 1].niftyLtp - row.niftyLtp);
    }
  }
  const sign = s.direction === 'LONG' ? 1 : -1;
  const move1 = sign * (latest.niftyLtp - one.niftyLtp);
  const move5 = sign * (latest.niftyLtp - five.niftyLtp);
  const move15 = sign * (latest.niftyLtp - fifteen.niftyLtp);
  if (move1 <= 0 || move5 < 8 || move15 < 15) {
    return deny('Wait for aligned 1m, 5m and 15m price direction.');
  }
  if (path === 0 || move15 / path < 0.55) return deny('Choppy price path; directional efficiency below 55%.');
  const m = s.metrics;
  if (![m.broadSentiment, m.optionFlowStrength, m.momentumScore].every(Number.isFinite) ||
      sign * m.broadSentiment < 20 || sign * m.momentumScore < 25 ||
      m.optionFlow !== (sign === 1 ? 'BULLISH' : 'BEARISH') || m.optionFlowStrength < 20) {
    return deny('Breadth, option flow and momentum must all confirm the direction.');
  }
  const averageStep = path / (window.length - 1);
  if (move1 > Math.max(12, averageStep * 2.5) ||
      Math.abs(spot! - latest.niftyLtp) > Math.max(8, averageStep * 1.5)) {
    return deny('Price is extended or has moved away from the setup; do not chase.');
  }

  if (input.requireVision) {
    if (input.visionError) return deny(`Vision required: ${input.visionError}`);
    const run = input.vision;
    const verdict = run?.analysis.parsed;
    const capturedAt = run ? Date.parse(run.startedAt) : NaN;
    if (!run?.analysis.ok || run.analysis.skipped || !verdict || verdict.readable !== true ||
        !Number.isFinite(capturedAt) || now - capturedAt > policy.maxVisionAgeMs || capturedAt > now ||
        !Number.isFinite(verdict.confidence) || verdict.confidence < 70 ||
        run.shots.length === 0 || run.shots.some(shot => !shot.ok || shot.awaitingLogin)) {
      return deny('Vision required: waiting for a readable, successful chart capture less than 5m old.');
    }
    if (verdict.bias !== (sign === 1 ? 'bullish' : 'bearish')) {
      return deny(`Vision does not agree (${verdict.bias}); stand aside.`);
    }
  }

  const { premium, quantity, targetPct, stopPct, brokerage } = input;
  if (![premium, quantity, targetPct, stopPct, brokerage].every(Number.isFinite) ||
      premium <= 0 || quantity <= 0 || !Number.isInteger(quantity) ||
      targetPct <= 0 || stopPct <= 0 || stopPct >= 100 || brokerage < 0) {
    return deny('Invalid execution price, quantity or risk settings.');
  }
  const target = premium * (1 + targetPct / 100);
  const stop = premium * (1 - stopPct / 100);
  const entryCharges = computeCharges(premium, quantity, 'BUY', brokerage).total;
  // Budget 0.5% adverse slippage on each leg; not a promise of achievable fills.
  const reward = (target - premium) * quantity - entryCharges
    - computeCharges(target, quantity, 'SELL', brokerage).total - (premium + target) * quantity * 0.005;
  const risk = (premium - stop) * quantity + entryCharges
    + computeCharges(stop, quantity, 'SELL', brokerage).total + (premium + stop) * quantity * 0.005;
  const netRiskReward = reward / risk;
  if (netRiskReward < policy.minNetRiskReward) {
    return { ...deny(`Net reward/risk ${netRiskReward.toFixed(2)} below ${policy.minNetRiskReward} after charges and slippage.`), netRiskReward };
  }
  if (risk > policy.maxDailyLoss + netPnl) return deny('Planned stop risk exceeds the remaining daily loss budget.');

  const same = previous?.direction === s.direction &&
    previous.firstAt > Math.max(lastAttempt, cooldownUntil) &&
    snapshotAt! >= previous.lastAt && snapshotAt! - previous.lastAt <= policy.maxSnapshotAgeMs;
  const candidate: MomentumCandidate = same
    ? { ...previous, lastAt: snapshotAt!, observations: previous.observations + (snapshotAt! > previous.lastAt ? 1 : 0) }
    : { direction: s.direction, firstAt: snapshotAt!, lastAt: snapshotAt!, observations: 1 };
  const ready = candidate.observations >= 3 && candidate.lastAt - candidate.firstAt >= policy.confirmationMinutes * MINUTE;
  return {
    ready, candidate, netRiskReward,
    reason: ready
      ? `Confirmed across ${candidate.observations} fresh snapshots; net R:R ${netRiskReward.toFixed(2)}.`
      : `Confirming direction: ${candidate.observations}/3 fresh snapshots over at least ${policy.confirmationMinutes}m.`
  };
}
