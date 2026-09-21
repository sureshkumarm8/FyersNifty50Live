import type { FyersQuote, MarketSnapshot } from '../types';
import type {
  PilotAssessment, PilotBook, PilotContract, PilotObservation, PilotPlan,
  PilotPosition, PilotScenario, PilotSide, PilotTrade
} from './openingPilotTypes';
import { computeCharges, parseOptionQuote } from './paperTradingService';
import { istDayKey, istMinutesOf } from './sniperEngine';
import { isMarketLive } from './marketSession';

export const PILOT_POLICY = {
  maxQuoteAgeMs: 90_000,
  maxObservationAgeMs: 300_000,
  nearWallPoints: 20,
  minRoomPoints: 40,
  itmPoints: 200,
  strikeTolerancePoints: 25,
  entryMinute: 9 * 60 + 25,
  openingMinute: 9 * 60 + 15,
  warmupMs: 600_000,
  minuteToleranceMs: 15_000,
  fiveMinuteToleranceMs: 30_000,
  minDaySentiment: 5,
  minSentimentDelta: 2,
  minMove1m: 2,
  minMove5m: 10,
  rejectionPoints: 10,
  approachPoints: 5,
  premiumRiskFraction: 0.1
} as const;

const MINUTE = 60_000;
const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
const validTime = (n: unknown): n is number => positive(n) && Number.isFinite(new Date(n).getTime());
const round = (n: number) => Math.round(n * 100) / 100;
const live = (now: number) => validTime(now) && isMarketLive(new Date(now));
const sameDay = (at: number, now: number) => validTime(at) && validTime(now) && istDayKey(at) === istDayKey(now);

export function emptyPilotBook(): PilotBook {
  return { version: 1, plans: [], observations: [], frames: [], decisions: [], position: null, trades: [] };
}

export function pilotPremiumLevels(premium: number): { stopPremium: number; targetPremium: number } {
  if (!positive(premium)) throw new Error('Entry premium must be finite and positive.');
  return {
    stopPremium: round(premium * (1 - PILOT_POLICY.premiumRiskFraction)),
    targetPremium: round(premium * (1 + PILOT_POLICY.premiumRiskFraction))
  };
}

function validGapBands(plan: Pick<PilotPlan, 'flatBand' | 'mediumBand' | 'outerBand'>): boolean {
  return Number.isFinite(plan.flatBand) && plan.flatBand >= 0 && positive(plan.mediumBand)
    && positive(plan.outerBand) && plan.flatBand < plan.mediumBand && plan.mediumBand < plan.outerBand;
}

export function classifyPilotGap(
  gap: number, plan: Pick<PilotPlan, 'flatBand' | 'mediumBand' | 'outerBand'>
): PilotScenario {
  const { flatBand, mediumBand, outerBand } = plan;
  if (!Number.isFinite(gap) || !validGapBands(plan)) {
    throw new Error('Gap must be finite; bands must satisfy 0 <= flatBand < mediumBand < outerBand.');
  }
  const size = Math.abs(gap);
  if (size <= flatBand) return 'FLAT';
  if (size > outerBand) return 'OUTSIDE';
  if (gap > 0) return size <= mediumBand ? 'UP_50' : 'UP_100';
  return size <= mediumBand ? 'DOWN_50' : 'DOWN_100';
}

function canonicalDate(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const at = new Date(Date.UTC(year, month - 1, day));
  return at.getUTCFullYear() === year && at.getUTCMonth() === month - 1 && at.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim()))) {
    const number = Number(value);
    const at = number < 100_000_000_000 ? number * 1000 : number;
    return validTime(at) ? at : null;
  }
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/i.exec(text);
  if (!iso || !canonicalDate(+iso[1], +iso[2], +iso[3]) || +iso[4] > 23 ||
      +iso[5] > 59 || +(iso[6] || 0) > 59) return null;
  const at = Date.parse(text);
  return validTime(at) ? at : null;
}

export function pilotQuoteTime(quote: Pick<FyersQuote, 'tt'>): number | null {
  return parseTimestamp(quote.tt);
}

export function pilotExpiry(quote: FyersQuote): string | null {
  const explicit = quote.expiry_date;
  if (explicit != null && explicit.trim() !== '') {
    const text = explicit.trim().toUpperCase();
    const iso = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(text);
    if (iso) {
      if (iso[4] && parseTimestamp(text) === null) return null;
      return canonicalDate(+iso[1], +iso[2], +iso[3]);
    }
    const numeric = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
    if (numeric) return canonicalDate(+numeric[3], +numeric[2], +numeric[1]);
    const named = /^(\d{2})-([A-Z]{3})-(\d{2}|\d{4})$/.exec(text);
    if (!named) return null;
    const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(named[2]) + 1;
    return canonicalDate(named[3].length === 2 ? 2000 + +named[3] : +named[3], month, +named[1]);
  }
  // Only the weekly symbol contains an actual day. Monthly symbols do not.
  const weekly = /^(?:NSE:)?NIFTY(\d{2})([1-9OND])(\d{2})(\d{3,6})(CE|PE)$/i.exec(quote.symbol);
  if (!weekly) return null;
  const code = weekly[2].toUpperCase();
  const month = { O: 10, N: 11, D: 12 }[code] ?? Number(code);
  return canonicalDate(2000 + +weekly[1], month, +weekly[3]);
}

function niftyOption(quote: FyersQuote) {
  if (!/^(?:NSE:)?NIFTY(?:-\d{3,6}-(?:CE|PE)|\d{2}(?:[1-9OND]\d{2}|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{3,6}(?:CE|PE))$/i.test(quote.symbol)) return null;
  const parsed = parseOptionQuote(quote);
  const symbolOnly = parseOptionQuote({ ...quote, original_name: '', short_name: '', description: '' });
  if (!parsed || !symbolOnly || parsed.strike !== symbolOnly.strike || parsed.optionType !== symbolOnly.optionType ||
      !positive(parsed.strike) || parsed.strike % 50 !== 0) return null;
  return parsed;
}

function freshQuote(quote: FyersQuote, now: number): number | null {
  const at = pilotQuoteTime(quote);
  return at !== null && positive(quote.lp) && sameDay(at, now) && at <= now &&
    now - at <= PILOT_POLICY.maxQuoteAgeMs && live(at) ? at : null;
}

function unambiguousQuotes(quotes: FyersQuote[]): FyersQuote[] {
  const seen = new Map<string, number>();
  const conflicting = new Set<string>();
  for (const quote of quotes) {
    const contract = `${quote.symbol}:${pilotExpiry(quote)}`;
    const timestamp = pilotQuoteTime(quote);
    if (timestamp === null || !positive(quote.lp)) continue;
    const tick = `${contract}:${timestamp}`;
    const price = seen.get(tick);
    if (price !== undefined && price !== quote.lp) conflicting.add(contract);
    seen.set(tick, quote.lp);
  }
  // Different prices with one timestamp cannot establish which bracket hit
  // first. Wait for an unambiguous refresh rather than sorting by premium.
  return quotes.filter(q => !conflicting.has(`${q.symbol}:${pilotExpiry(q)}`));
}

function validExpiry(expiry: string, now: number): boolean {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiry);
  return validTime(now) && !!parts && canonicalDate(+parts[1], +parts[2], +parts[3]) === expiry
    && expiry >= istDayKey(now);
}

function validITM(strike: number, spot: number, side: PilotSide): boolean {
  if (!positive(spot) || !positive(strike) || (side !== 'CE' && side !== 'PE')) return false;
  const target = spot + (side === 'CE' ? -PILOT_POLICY.itmPoints : PILOT_POLICY.itmPoints);
  return (side === 'CE' ? strike < spot : strike > spot) &&
    Math.abs(strike - target) <= PILOT_POLICY.strikeTolerancePoints;
}

export function selectPilotContract(
  quotes: FyersQuote[], spot: number, side: PilotSide, expiry: string, now: number
): PilotContract | null {
  if (!positive(spot) || !validExpiry(expiry, now) || (side !== 'CE' && side !== 'PE')) return null;
  const target = spot + (side === 'CE' ? -PILOT_POLICY.itmPoints : PILOT_POLICY.itmPoints);
  const candidates: PilotContract[] = [];
  for (const quote of unambiguousQuotes(quotes)) {
    const parsed = niftyOption(quote);
    const quoteAt = freshQuote(quote, now);
    if (parsed?.optionType === side && quoteAt !== null && pilotExpiry(quote) === expiry &&
        validITM(parsed.strike, spot, side)) {
      candidates.push({ quote: { ...quote }, strike: parsed.strike, side, expiry, quoteAt });
    }
  }
  return candidates.sort((a, b) => Math.abs(a.strike - target) - Math.abs(b.strike - target) ||
    a.strike - b.strike || a.quote.symbol.localeCompare(b.quote.symbol) || b.quoteAt - a.quoteAt ||
    a.quote.lp - b.quote.lp)[0] ?? null;
}

export function assessOpeningPilot(
  history: MarketSnapshot[], plan: PilotPlan | null, observation: PilotObservation | null, now: number
): PilotAssessment {
  const result: PilotAssessment = {
    at: now, status: 'WAIT', side: null, setup: 'NONE', reason: 'Waiting for evidence.',
    checks: [], spot: null, snapshotAt: null, daySentiment: null, sentimentDelta: null, move1m: null, move5m: null,
    openingHigh: null, openingLow: null, support: null, resistance: null, wallDistance: null, scenario: null
  };
  const check = (label: string, pass: boolean, detail: string) => {
    result.checks.push({ label, pass, detail });
    return pass;
  };
  if (!check('Market session', live(now), 'Paper fills only on weekdays, 09:15–15:30 IST; holidays need a fresh feed.')) {
    result.reason = 'Market is closed or the assessment clock is invalid.';
    return result;
  }
  const day = istDayKey(now);
  const openingAt = Date.parse(`${day}T09:15:00+05:30`);
  const entryAt = openingAt + PILOT_POLICY.warmupMs;
  const eligible = history.filter(s => validTime(s.timestamp) && s.timestamp >= openingAt && s.timestamp <= now &&
    sameDay(s.timestamp, now) && positive(s.niftyLtp) && Number.isFinite(s.overallSent))
    .sort((a, b) => a.timestamp! - b.timestamp! || a.niftyLtp - b.niftyLtp || a.overallSent - b.overallSent);
  const byMinute = new Map<number, MarketSnapshot>();
  let conflict = false;
  const byTime = new Map<number, MarketSnapshot>();
  for (const row of eligible) {
    const previous = byTime.get(row.timestamp!);
    if (previous && (previous.niftyLtp !== row.niftyLtp || previous.overallSent !== row.overallSent)) conflict = true;
    byTime.set(row.timestamp!, row);
    byMinute.set(Math.floor(row.timestamp! / MINUTE), row);
  }
  const rows = [...byMinute.values()];
  const last = rows.at(-1);
  const opening = rows.filter(s => s.timestamp! < entryAt);
  if (opening.length) {
    result.openingHigh = Math.max(...opening.map(s => s.niftyLtp));
    result.openingLow = Math.min(...opening.map(s => s.niftyLtp));
  }
  check('Sampled opening range', opening.length === 10,
    `09:15–09:25 IST, end exclusive: ${opening.length}/10 distinct minute spot samples; sampled extrema, not exchange OHLC.`);
  const knownObservation = !!observation && observation.day === day && sameDay(observation.observedAt, now) &&
    sameDay(observation.recordedAt, now) && observation.observedAt <= observation.recordedAt && observation.recordedAt <= now;
  let validPlan = false;
  let gapReference = 'unavailable (no valid 09:15 sample or known indicative pre-open)';
  if (plan && plan.day === day && sameDay(plan.savedAt, now) && plan.savedAt <= now
      && positive(plan.previousClose) && validGapBands(plan)) {
    validPlan = true;
    const sampledOpen = opening.find(s => Math.floor((s.timestamp! - openingAt) / MINUTE) === 0)?.niftyLtp;
    const indicativeOpen = knownObservation && positive(observation!.preOpen) ? observation!.preOpen : undefined;
    const reference = sampledOpen ?? indicativeOpen;
    if (sampledOpen !== undefined) gapReference = `09:15 sampled spot ${sampledOpen}, not official opening OHLC`;
    else if (indicativeOpen !== undefined) gapReference = `recorded indicative pre-open ${indicativeOpen}, not a sampled market open`;
    if (reference !== undefined && reference !== null) result.scenario = classifyPilotGap(reference - plan.previousClose, plan);
  }
  check('Saved gap plan', validPlan && result.scenario !== null && result.scenario !== 'OUTSIDE',
    `Same-day plan saved no later than now, positive previous close, 0 ≤ flat < medium < outer. ` +
    `Absolute gap ≤ flat is FLAT, ≤ medium is ±50, ≤ outer is ±100; beyond is OUTSIDE. ` +
    `Reference: ${gapReference}. Prefer the genuine 09:15 sample; never substitute a later spot sample for the open. ` +
    `Bands: ${plan?.flatBand ?? '—'}/${plan?.mediumBand ?? '—'}/${plan?.outerBand ?? '—'} points.`);
  const wallsValid = knownObservation && now - observation!.observedAt <= PILOT_POLICY.maxObservationAgeMs &&
    now - observation!.recordedAt <= PILOT_POLICY.maxObservationAgeMs &&
    positive(observation!.support) && positive(observation!.resistance) && observation!.support! < observation!.resistance!;
  check('OI wall evidence', wallsValid,
    'Reused Vision / premarket capture or optional manual observation: source capture AND first receipt must be known, same IST day and no more than 5 minutes old; 0 < support < resistance. Polling never renews a capture.');
  if (wallsValid) {
    result.support = observation!.support;
    result.resistance = observation!.resistance;
  }
  if (last) {
    result.spot = last.niftyLtp;
    result.snapshotAt = last.timestamp!;
    result.daySentiment = last.overallSent;
  }
  const fresh = check('Live spot', !!last && now - last.timestamp! <= PILOT_POLICY.maxQuoteAgeMs,
    'Latest timestamped, same-day 09:15+ spot sample must be ≤90 seconds old and never in the future.');
  const warm = check('Ten-minute warmup', now >= entryAt && !!last && opening.length === 10 &&
    last.timestamp! - rows[0].timestamp! >= PILOT_POLICY.warmupMs,
  'No readiness before 09:25 IST; ten distinct opening minute samples and ≥10 actual elapsed minutes, not 15 minutes or duplicate rows.');
  const consistent = check('Unambiguous samples', !conflict,
    'Duplicate timestamps never count twice; conflicting spot/sentiment at the same timestamp blocks readiness.');
  const anchor = (duration: number, tolerance: number) => {
    if (!last) return undefined;
    return rows.filter(s => s.timestamp! < last.timestamp! &&
      Math.abs(last.timestamp! - s.timestamp! - duration) <= tolerance)
      .sort((a, b) => Math.abs(last.timestamp! - a.timestamp! - duration) -
        Math.abs(last.timestamp! - b.timestamp! - duration) || a.timestamp! - b.timestamp!)[0];
  };
  const one = anchor(MINUTE, PILOT_POLICY.minuteToleranceMs);
  const five = anchor(5 * MINUTE, PILOT_POLICY.fiveMinuteToleranceMs);
  const recent = five ? rows.filter(s => s.timestamp! >= five.timestamp!) : [];
  const continuous = check('Timestamp continuity', !!one && !!five && recent.length === 6 &&
    recent.every((s, i) => i === 0 || (
      Math.floor(s.timestamp! / MINUTE) - Math.floor(recent[i - 1].timestamp! / MINUTE) === 1 &&
      s.timestamp! - recent[i - 1].timestamp! <= PILOT_POLICY.maxQuoteAgeMs)),
  '1-minute anchor ±15s and 5-minute anchor ±30s; six distinct consecutive recent minute samples, adjacent gaps ≤90s.');
  if (last && one) result.move1m = last.niftyLtp - one.niftyLtp;
  if (last && five) {
    result.move5m = last.niftyLtp - five.niftyLtp;
    result.sentimentDelta = last.overallSent - five.overallSent;
  }
  const momentum = (sign: number) => result.move1m !== null && result.move5m !== null &&
    result.sentimentDelta !== null && sign * result.move1m >= PILOT_POLICY.minMove1m &&
    sign * result.move5m >= PILOT_POLICY.minMove5m &&
    sign * result.sentimentDelta >= PILOT_POLICY.minSentimentDelta;
  const direction = momentum(1) ? 1 : momentum(-1) ? -1 : 0;
  const fromVision = observation?.source?.kind === 'VISION';
  const visionAgrees = !fromVision || (wallsValid && direction !== 0
    && observation?.vision?.bias === (direction === 1 ? 'bullish' : 'bearish'));
  if (fromVision) check('Vision / minute-history agreement', visionAgrees,
    'The latest readable Nifty + Sensibull Vision bias must agree with recent price/sentiment direction. Choppy, unclear, failed or opposing reads cannot confirm an entry.');
  check('Recent price and sentiment slope', direction !== 0,
    'Aligned 1m price move ≥2 points, 5m move ≥10 points and 5m breadth sentiment change ≥2 points in the chosen direction; no probability estimate.');
  const dayDirection = result.daySentiment !== null && Math.abs(result.daySentiment) >= PILOT_POLICY.minDaySentiment
    ? Math.sign(result.daySentiment) : 0;
  check('Day sentiment', dayDirection !== 0,
    'Absolute current day breadth sentiment ≥5; its sign is day bias, distinct from its 5m change and from spot price direction.');
  const nearSupport = wallsValid && !!last && Math.abs(last.niftyLtp - result.support!) <= PILOT_POLICY.nearWallPoints;
  const nearResistance = wallsValid && !!last && Math.abs(last.niftyLtp - result.resistance!) <= PILOT_POLICY.nearWallPoints;
  const rejection = (sign: number) => {
    if (!last || !wallsValid || !continuous) return false;
    const wall = sign === 1 ? result.support! : result.resistance!;
    const trend = sign === 1 ? observation!.supportTrend : observation!.resistanceTrend;
    const repeatedSince = sign === 1 ? observation?.vision?.supportObservedSince : observation?.vision?.resistanceObservedSince;
    const repeatedVisionWall = fromVision && (sign === 1
      ? observation?.vision?.supportRepeated : observation?.vision?.resistanceRepeated)
      && validTime(repeatedSince) && sameDay(repeatedSince, now)
      && repeatedSince <= observation!.observedAt && now - repeatedSince <= PILOT_POLICY.maxObservationAgeMs
      && repeatedSince <= now;
    if (trend !== 'BUILDING' && trend !== 'UNCHANGED' && !repeatedVisionWall) return false;
    const knownSince = repeatedVisionWall ? repeatedSince : observation!.observedAt;
    return recent.some((touch, i) => i > 0 && i < recent.length - 1 &&
      touch.timestamp! >= knownSince &&
      Math.abs(touch.niftyLtp - wall) <= PILOT_POLICY.nearWallPoints &&
      sign * (recent[i - 1].niftyLtp - touch.niftyLtp) >= PILOT_POLICY.approachPoints &&
      sign * (last.niftyLtp - touch.niftyLtp) >= PILOT_POLICY.rejectionPoints &&
      sign * (last.niftyLtp - wall) >= PILOT_POLICY.rejectionPoints &&
      recent.slice(i + 1).every((s, j) => sign * (s.niftyLtp - recent[i + j].niftyLtp) > 0));
  };
  const rejected = direction !== 0 && rejection(direction);
  check('Observed wall rejection', rejected,
    'After a known wall capture: approach at least 5 pts into its +/-20-pt zone, then retreat at least 10 pts from touch and wall with consecutive moves away. Requires a repeated wall across two fresh Vision reads or a manually observed BUILDING/UNCHANGED wall. Repeated levels do not imply unchanged OI. Touch alone is not reversal.');
  if (direction !== 0 && dayDirection !== 0) {
    result.side = direction === 1 ? 'CE' : 'PE';
    result.setup = rejected ? 'REVERSAL' : direction === dayDirection ? 'CONTINUATION' : 'NONE';
  }
  if (wallsValid && last && direction) {
    result.wallDistance = direction === 1 ? result.resistance! - last.niftyLtp : last.niftyLtp - result.support!;
  }
  const room = check('Room to opposing OI wall', result.wallDistance !== null &&
    result.wallDistance >= PILOT_POLICY.minRoomPoints && !!last &&
    last.niftyLtp > result.support! && last.niftyLtp < result.resistance!,
  'Spot must remain between the observed walls, with ≥40 points to the opposing wall; no continuation into a nearby wall.');
  const prerequisites = fresh && warm && consistent && continuous && wallsValid && visionAgrees &&
    validPlan && result.scenario !== null && result.scenario !== 'OUTSIDE';
  if (prerequisites && room && result.setup !== 'NONE') {
    result.status = 'PAPER ENTRY READY';
    result.reason = `${result.side} ${result.setup.toLowerCase()}: aligned recent momentum, ${Math.round(result.wallDistance!)} points of observed wall room. Paper only; no win probability.`;
  } else if (!fresh || !consistent) {
    result.reason = 'WAIT: fresh, unambiguous timestamped spot data is required.';
  } else if (result.setup !== 'NONE') {
    result.status = result.setup === 'REVERSAL' ? 'REVERSAL WATCH' : 'CONTINUATION WATCH';
    result.reason = `Watch only: ${result.checks.filter(c => !c.pass && c.label !== 'Observed wall rejection').map(c => c.label).join(', ')}.`;
  } else if ((nearSupport || nearResistance) && direction !== 0) {
    result.status = 'REVERSAL WATCH';
    result.reason = 'Near an observed wall, but touching or unwinding does not confirm rejection with aligned momentum.';
  } else {
    result.reason = 'WAIT: consolidation, conflicting day bias/recent momentum, or insufficient directional evidence.';
  }
  return result;
}

export function openPilotPosition(input: {
  contract: PilotContract; spot: number; lots: number; lotSize: number; brokerage: number; now: number;
  assessment: PilotAssessment; planId: string | null; observationId: string | null; reason: string; override: boolean;
}): PilotPosition {
  const { contract, spot, lots, lotSize, brokerage, now, assessment } = input;
  if (!live(now) || istMinutesOf(new Date(now)) < PILOT_POLICY.entryMinute) {
    throw new Error('Paper entry requires a live weekday market, no earlier than 09:25 IST.');
  }
  if (!positive(spot) || !Number.isSafeInteger(lots) || lots <= 0 || !Number.isSafeInteger(lotSize) ||
      lotSize <= 0 || !Number.isSafeInteger(lots * lotSize) || !Number.isFinite(brokerage) || brokerage < 0) {
    throw new Error('Spot, positive integer lots/lot size, safe quantity and nonnegative brokerage are required.');
  }
  const parsed = niftyOption(contract.quote);
  const quoteAt = freshQuote(contract.quote, now);
  if (!parsed || parsed.strike !== contract.strike || parsed.optionType !== contract.side ||
      !validITM(contract.strike, spot, contract.side)) throw new Error('Contract must be NIFTY, matching side/strike and 200 ±25 points ITM.');
  if (!validExpiry(contract.expiry, now) || pilotExpiry(contract.quote) !== contract.expiry) {
    throw new Error('Contract needs an exact, valid, unexpired expiry.');
  }
  if (quoteAt === null || quoteAt !== contract.quoteAt) throw new Error('Entry quote must have a fresh, nonfuture, same-day timestamp and positive premium.');
  if (!sameDay(assessment.at, now) || assessment.at > now || now - assessment.at > PILOT_POLICY.maxQuoteAgeMs ||
      !positive(assessment.spot) || !validTime(assessment.snapshotAt) || !sameDay(assessment.snapshotAt, now) ||
      !live(assessment.snapshotAt) || assessment.snapshotAt > assessment.at ||
      now - assessment.snapshotAt > PILOT_POLICY.maxQuoteAgeMs) {
    throw new Error('A fresh same-day assessment with an actual spot-history timestamp ≤90 seconds old is required, even for an override.');
  }
  for (const label of ['Market session', 'Live spot', 'Ten-minute warmup', 'Unambiguous samples', 'Timestamp continuity']) {
    const checks = assessment.checks.filter(c => c.label === label);
    if (checks.length !== 1 || checks[0].pass !== true) {
      throw new Error(`Market-data safety check "${label}" must pass; missing, stale or discontinuous spot history cannot be overridden.`);
    }
  }
  if ((assessment.status !== 'PAPER ENTRY READY' || assessment.side !== contract.side) &&
      (!input.override || !input.reason.trim())) {
    throw new Error('Assessment is not PAPER ENTRY READY for this side; explicit override and a reason are required.');
  }
  if (input.override && !input.reason.trim()) throw new Error('An override requires a reason.');
  const entryPremium = contract.quote.lp;
  const { stopPremium, targetPremium } = pilotPremiumLevels(entryPremium);
  if (!positive(stopPremium) || stopPremium >= entryPremium || targetPremium <= entryPremium ||
      !Number.isFinite(entryPremium * lots * lotSize) || !Number.isFinite(targetPremium)) {
    throw new Error('Premium/quantity cannot produce valid two-decimal ±10% paper risk levels.');
  }
  return {
    id: crypto.randomUUID(), day: istDayKey(now), symbol: contract.quote.symbol, expiry: contract.expiry,
    strike: contract.strike, side: contract.side, lots, lotSize, quantity: lots * lotSize, brokerage,
    entryAt: now, entryQuoteAt: quoteAt, entryPremium, stopPremium, targetPremium,
    mark: entryPremium, markAt: quoteAt, highPremium: entryPremium, lowPremium: entryPremium,
    assessment: structuredClone(assessment), planId: input.planId, observationId: input.observationId,
    reason: input.reason.trim(), override: input.override, samplingGap: false
  };
}

function matchingQuotes(position: PilotPosition, quotes: FyersQuote[], now: number) {
  if (!live(now) || !validExpiry(position.expiry, now)) return [];
  return unambiguousQuotes(quotes).filter(q => q.symbol === position.symbol && pilotExpiry(q) === position.expiry &&
    freshQuote(q, now) !== null).map(quote => ({ quote, at: pilotQuoteTime(quote)! }))
    .sort((a, b) => a.at - b.at || a.quote.lp - b.quote.lp);
}

function exitReason(position: PilotPosition, premium: number): PilotTrade['exitReason'] | null {
  return premium <= position.stopPremium ? 'STOPLOSS' : premium >= position.targetPremium ? 'TARGET' : null;
}

function marked(position: PilotPosition, premium: number, at: number): PilotPosition {
  return { ...position, mark: premium, markAt: at,
    highPremium: Math.max(position.highPremium, premium), lowPremium: Math.min(position.lowPremium, premium),
    samplingGap: !!position.samplingGap || at - position.markAt > PILOT_POLICY.maxQuoteAgeMs };
}

function tradeAt(
  position: PilotPosition, premium: number, quoteAt: number, now: number, reason: PilotTrade['exitReason'],
  samplingGap: boolean
): PilotTrade {
  const grossPnl = round((premium - position.entryPremium) * position.quantity);
  const charges = round(computeCharges(position.entryPremium, position.quantity, 'BUY', position.brokerage).total +
    computeCharges(premium, position.quantity, 'SELL', position.brokerage).total);
  return { ...marked(position, premium, quoteAt), exitAt: now, exitQuoteAt: quoteAt,
    exitPremium: premium, exitReason: reason, grossPnl, charges, netPnl: round(grossPnl - charges), samplingGap };
}

export function markPilotPosition(
  position: PilotPosition, quotes: FyersQuote[], now: number
): { position: PilotPosition; trade: PilotTrade | null } {
  let current = position;
  let samplingGap = !!position.samplingGap;
  for (const { quote, at } of matchingQuotes(position, quotes, now)) {
    if (at <= current.markAt || at <= position.entryAt) continue;
    const reason = exitReason(current, quote.lp);
    samplingGap ||= at - current.markAt > PILOT_POLICY.maxQuoteAgeMs;
    if (reason) {
      const trade = tradeAt(current, quote.lp, at, now, reason, samplingGap);
      return { position: marked(current, quote.lp, at), trade };
    }
    current = marked(current, quote.lp, at);
  }
  return { position: current, trade: null };
}

export function closePilotPosition(position: PilotPosition, quotes: FyersQuote[], now: number): PilotTrade {
  if (!live(now)) throw new Error('Manual paper exit requires regular weekday market hours.');
  if (!validExpiry(position.expiry, now)) throw new Error('Cannot paper-fill an expired or invalid expiry.');
  const candidates = matchingQuotes(position, quotes, now).filter(q => q.at >= position.entryAt && q.at >= position.markAt);
  if (!candidates.length) {
    throw new Error('Manual exit needs a fresh positive, exact-symbol/expiry, current-day quote no earlier than entry or last mark.');
  }
  const automatic = markPilotPosition(position, quotes, now);
  if (automatic.trade) return automatic.trade;
  const latest = candidates[candidates.length - 1];
  const reason = exitReason(position, latest.quote.lp) ?? 'MANUAL';
  let previousAt = position.markAt;
  let samplingGap = !!position.samplingGap;
  for (const candidate of candidates) {
    samplingGap ||= candidate.at - previousAt > PILOT_POLICY.maxQuoteAgeMs;
    previousAt = candidate.at;
  }
  return tradeAt(automatic.position, latest.quote.lp, latest.at, now, reason, samplingGap);
}

/** Unverified historical report, never an inferred target/stop or a provider-price fill. */
export function reconcilePilotPosition(
  position: PilotPosition, exitPremium: number, exitedAt: number, now: number, note: string
): PilotTrade {
  if (!positive(exitPremium)) throw new Error('Reported exit premium must be finite and positive.');
  const explanation = typeof note === 'string' ? note.trim() : '';
  if (explanation.length < 10 || !/\p{L}/u.test(explanation)) {
    throw new Error('Reconciliation needs a meaningful explanatory note of at least 10 characters.');
  }
  if (!validTime(now) || !validTime(position.entryAt) || !validTime(exitedAt) ||
      exitedAt < position.entryAt || exitedAt > now) {
    throw new Error('Reported exit time must be valid, no earlier than entry and no later than now.');
  }
  if (!live(exitedAt) || !validExpiry(position.expiry, exitedAt)) {
    throw new Error('Reported exit must be in a regular weekday market session, on or before the expiry day.');
  }
  if (!positive(position.entryPremium) || !Number.isSafeInteger(position.quantity) || position.quantity <= 0 ||
      !Number.isFinite(position.brokerage) || position.brokerage < 0) {
    throw new Error('Captured entry premium, quantity and brokerage must be valid to reconcile costs.');
  }
  // The required legacy exitQuoteAt field carries the reported time here, not a
  // verified quote timestamp. RECONCILED and exitRecordedAt distinguish the report.
  const reportedPosition = {
    ...position, highPremium: Math.max(position.entryPremium, exitPremium),
    lowPremium: Math.min(position.entryPremium, exitPremium)
  };
  const trade = tradeAt(reportedPosition, exitPremium, exitedAt, exitedAt, 'RECONCILED', true);
  if (![trade.grossPnl, trade.charges, trade.netPnl].every(Number.isFinite)) {
    throw new Error('Reported premium and captured position cannot produce finite paper costs and P&L.');
  }
  return { ...trade, exitNote: explanation, exitRecordedAt: now };
}
