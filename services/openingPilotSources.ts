import { DECISION_SCHEMA, STALE_AFTER_MS } from '../components/premarket/model';
import type { VisionBias, VisionRun } from '../types';
import type { PilotObservation, PilotPlan, PilotScenarioPlan, PilotVisionRead } from './openingPilotTypes';
import { pilotQuoteTime } from './openingPilot';

export interface PilotSourceUpdate {
  plans: PilotPlan[];
  observations: PilotObservation[];
  premarketStatus: string;
  visionStatus: string;
  giftStatus: string;
}

type RecordValue = Record<string, unknown>;
type Basis = 'CHARTS_ONLY' | 'PREOPEN' | 'INTRADAY';
interface Phase {
  value: RecordValue;
  basis: Basis;
  at: number;
  spot: number;
}
interface Chart {
  value: RecordValue;
  verdict: RecordValue;
  capturedAt: number;
  availableAt: number;
}
interface VisionCandidate {
  value: RecordValue;
  started: number;
  finished: number;
  support: number | null;
  resistance: number | null;
  read?: PilotVisionRead;
  rejection: string;
}

const IST_OFFSET = 330 * 60_000;
const DAY = 24 * 60 * 60_000;
const FRESH = 5 * 60_000;
const BASES: Basis[] = ['CHARTS_ONLY', 'PREOPEN', 'INTRADAY'];
const GIFT_STATUS = 'Not supplied by existing sources; no confirmation assumed';
const record = (value: unknown): RecordValue | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : null;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const timestamp = (value: unknown): value is number => finite(value) && value > 0 && value < 8.64e15;
const price = (value: unknown): number | null =>
  finite(value) && value >= 1000 && value <= 100000 ? value : null;
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const texts = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : [];
const levels = (value: unknown): number[] =>
  Array.isArray(value) ? value.map(price).filter((n): n is number => n !== null) : [];
const dayOf = (at: number): string => new Date(at + IST_OFFSET).toISOString().slice(0, 10);

// Only hash normalized scalar/array output, never arbitrary persisted objects.
function fingerprint(value: unknown): string {
  const serialized = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/** A single strike, not a range, prose, decimal approximation or inferred chart level. */
function strike(value: unknown): number | null {
  if (typeof value === 'string') {
    const clean = value.trim();
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})$/.test(clean)) return null;
    value = Number(clean.replace(/,/g, ''));
  }
  const n = price(value);
  return n !== null && n % 50 === 0 ? n : null;
}

// Source narrative is context, not permission to import the other engine's trade rules.
function context(value: unknown): string {
  return text(value).split(/(?<=[.!?;])\s+|\n/)
    .filter(part => !/(?:\b30[\s-]*(?:point|pt)s?\b|\b250[\s-]*(?:point|pt|ITM)|\b250\b.*\bITM\b|\b10:15\b|\bsniper\b|\b(?:target|stoploss|stop.loss|hard.stop|ITM)\b)/i.test(part))
    .join(' ');
}

function chartFrom(meta: RecordValue | null, slot: string, cutoff: number, issues: string[]): Chart | null {
  const raw = meta?.[slot];
  if (raw == null) return null;
  const value = record(raw);
  const verdict = record(value?.verdict);
  if (!value || (value.slot !== undefined && value.slot !== slot) ||
      !timestamp(value.uploadedAt) || !verdict || verdict.structured !== true ||
      !finite(verdict.confidence) || verdict.confidence <= 15 || value.error ||
      /cannot|can not|unable|not (visible|provided|clear)|no (chart|data|image)|insufficient/i.test(text(verdict.summary))) {
    issues.push(`${slot} rejected: malformed or unreadable chart metadata`);
    return null;
  }
  const availableAt = value.analyzedAt;
  if (!timestamp(availableAt) || availableAt < value.uploadedAt ||
      value.uploadedAt > cutoff || availableAt > cutoff) {
    issues.push(`${slot} rejected: missing analysis time, future or after-cutoff capture/analysis`);
    return null;
  }
  return { value, verdict, capturedAt: value.uploadedAt, availableAt };
}

function phaseFrom(raw: unknown, key: string | undefined, start: number, cutoff: number, issues: string[]): Phase | null {
  const value = record(raw);
  const basis = value?.basis;
  const at = value?.generatedAt;
  if (!value || value.schema !== DECISION_SCHEMA || !timestamp(at) ||
      !BASES.includes(basis as Basis) || (key !== undefined && basis !== key) ||
      price(value.spot) === null || !['CHARTS', 'MANUAL', 'LIVE'].includes(text(value.spotSource)) ||
      !Array.isArray(record(value.playbook)?.scenarios)) {
    issues.push(`${key ?? 'Root'} rejected: malformed phase or unsupported schema`);
    return null;
  }
  if (at < start || at > cutoff) {
    issues.push(`${basis} rejected: not today's phase, future, or after 09:25 cutoff`);
    return null;
  }
  const minute = (at - start) / 60_000;
  const expected = minute < 550 ? 'CHARTS_ONLY' : minute < 555 ? 'PREOPEN' : 'INTRADAY';
  if (basis !== expected || value.forced === true ||
      (basis !== 'CHARTS_ONLY' && value.spotSource === 'CHARTS')) {
    issues.push(`${basis} rejected: forced/mislabeled phase or no genuine live/manual price`);
    return null;
  }
  return { value, basis: basis as Basis, at, spot: value.spot as number };
}

const SCENARIOS: [PilotScenarioPlan['scenario'], string, string][] = [
  ['FLAT', 'FLAT', 'flat'],
  ['UP_50', 'GAP_UP_50', 'gapUp'],
  ['UP_100', 'GAP_UP_100', 'gapUp'],
  ['DOWN_50', 'GAP_DOWN_50', 'gapDown'],
  ['DOWN_100', 'GAP_DOWN_100', 'gapDown'],
];

function scenarioPlans(phase: Phase, previousClose: number): PilotScenarioPlan[] {
  const source = (record(phase.value.playbook)?.scenarios as unknown[]).map(record).filter((v): v is RecordValue => v !== null);
  const summaries = record(phase.value.scenarios);
  return SCENARIOS.map(([scenario, sourceId, summaryKey]) => {
    const found = source.find(s => s.id === sourceId);
    const support = price(found?.support);
    const resistance = price(found?.resistance);
    const offset = scenario === 'UP_50' ? 50 : scenario === 'UP_100' ? 100 : scenario === 'DOWN_50' ? -50 : scenario === 'DOWN_100' ? -100 : 0;
    const facts = [
      `Opening hypothesis ${previousClose + offset} (${offset > 0 ? '+' : ''}${offset} points versus previous close).`,
      phase.basis === 'CHARTS_ONLY' ? context(record(summaries?.[summaryKey])?.description) : '',
      support !== null ? `Source scenario support ${support}.` : '',
      resistance !== null ? `Source scenario resistance ${resistance}.` : '',
      ['INSIDE_ZONE', 'AT_SUPPORT', 'AT_RESISTANCE', 'ABOVE_ALL_LEVELS', 'BELOW_ALL_LEVELS'].includes(text(found?.location))
        ? `Source open location: ${text(found?.location)}.` : '',
      finite(found?.likelihood) && found.likelihood >= 0 && found.likelihood <= 100
        ? `Source likelihood ${found.likelihood}%.` : '',
    ].filter(Boolean);
    return {
      scenario,
      expectation: facts.join(' ') || `${phase.basis} market context; this opening scenario has no supplied levels.`,
      confirmation: 'Require fresh chart/OI agreement and a price-confirmed hold, break or reversal at the relevant wall.',
      invalidation: 'Contradictory price action, missing/stale OI, or a failed wall confirmation invalidates the setup.',
    };
  });
}

function visionCandidate(raw: unknown, start: number, now: number, issues: string[]): VisionCandidate | null {
  const value = record(raw);
  const started = typeof value?.startedAt === 'string' ? pilotQuoteTime({ tt: value.startedAt }) : null;
  const finished = typeof value?.finishedAt === 'string' ? pilotQuoteTime({ tt: value.finishedAt }) : null;
  if (!value || !timestamp(started) || !timestamp(finished) || started < start ||
      finished < started || started > now || finished > now) {
    issues.push('Vision run rejected: malformed, previous-day, future, or incomplete timestamps');
    return null;
  }
  const analysis = record(value.analysis);
  const parsed = record(analysis?.parsed);
  const shots = Array.isArray(value.shots) ? value.shots.map(record).filter((v): v is RecordValue => v !== null) : [];
  let rejection = '';
  if (shots.some(s => s.awaitingLogin === true) ||
      !['kite', 'sensibull'].every(id => shots.some(s => s.id === id && s.ok === true && !s.awaitingLogin))) {
    rejection = 'Missing/failed chart or OI screenshot, or awaiting login';
  } else if (analysis?.ok !== true || analysis.skipped === true) {
    rejection = 'Vision analysis failed or was skipped';
  } else if (!parsed || parsed.readable !== true) {
    rejection = 'Vision analysis is unreadable or has no parsed verdict';
  }
  const support = rejection ? null : strike(parsed?.highest_put_oi_strike);
  const resistance = rejection ? null : strike(parsed?.highest_call_oi_strike);
  if (!rejection && (support === null || resistance === null || support >= resistance)) {
    rejection = 'Missing, ambiguous or unordered highest-OI strikes; chart levels are not OI walls';
  }
  let read: PilotVisionRead | undefined;
  if (analysis?.ok === true && analysis.skipped !== true && parsed?.readable === true) {
    const bias = ['bullish', 'bearish', 'neutral', 'choppy', 'unclear'].includes(text(parsed.bias))
      ? parsed.bias as VisionBias : 'unclear';
    read = {
      bias,
      priceAction: text(parsed.price_action),
      oiRead: text(parsed.oi_read),
      combinedView: text(parsed.combined_view),
      watchFor: texts(parsed.watch_for),
      risks: texts(parsed.risks),
      supportRepeated: false,
      resistanceRepeated: false,
      supportObservedSince: finished,
      resistanceObservedSince: finished,
    };
  }
  return {
    value, started, finished, rejection, read,
    support: rejection ? null : support,
    resistance: rejection ? null : resistance,
  };
}

/** Pure reuse adapter. Callers deduplicate IDs and retain the first savedAt/recordedAt. */
export function derivePilotSources(input: {
  decision: unknown;
  chartMeta: unknown;
  visionRuns: VisionRun[];
  now: number;
}): PilotSourceUpdate {
  const result: PilotSourceUpdate = {
    plans: [], observations: [],
    premarketStatus: 'No existing PreMarket decision supplied',
    visionStatus: 'No completed Vision read supplied',
    giftStatus: GIFT_STATUS,
  };
  if (!timestamp(input.now) || input.now + IST_OFFSET >= 8.64e15) {
    result.premarketStatus = result.visionStatus = 'Sources rejected: invalid current timestamp';
    return result;
  }
  const { now } = input;
  const start = Math.floor((now + IST_OFFSET) / DAY) * DAY - IST_OFFSET;
  const day = dayOf(now);
  const cutoff = Math.min(now, start + 565 * 60_000);
  const preIssues: string[] = [];
  const meta = record(input.chartMeta);
  if (input.chartMeta != null && !meta) preIssues.push('Chart metadata rejected: malformed saved state');
  let referenceChart = chartFrom(meta, 'INTRADAY_1M', Math.min(cutoff, start + 550 * 60_000 - 1), preIssues);
  if (referenceChart && start + 550 * 60_000 - referenceChart.capturedAt > STALE_AFTER_MS) {
    preIssues.push('INTRADAY_1M rejected as previous close: capture is stale for this session');
    referenceChart = null;
  }
  const oiChart = chartFrom(meta, 'OI_SNAPSHOT', cutoff, preIssues);
  const root = record(input.decision);
  const phases: Phase[] = [];
  if (input.decision != null) {
    if (!root || root.schema !== DECISION_SCHEMA) {
      preIssues.push('PreMarket decision rejected: malformed saved state or unsupported schema');
    } else {
      const rawPhases = record(root.phases);
      if (root.phases != null && !rawPhases) preIssues.push('Saved phases rejected: malformed phase collection');
      if (rawPhases) {
        for (const [key, raw] of Object.entries(rawPhases)) {
          const phase = phaseFrom(raw, key, start, cutoff, preIssues);
          if (phase) phases.push(phase);
        }
      }
      const phase = phaseFrom(root, undefined, start, cutoff, preIssues);
      if (phase) phases.push(phase);
    }
  }
  phases.sort((a, b) => a.at - b.at || a.basis.localeCompare(b.basis));
  const chartPhase = phases.find(p => p.basis === 'CHARTS_ONLY');
  const chartPrice = referenceChart ? price(referenceChart.verdict.lastPrice) : null;
  const reference = chartPhase
    ? { price: chartPhase.spot, at: chartPhase.at, label: `same-day CHARTS_ONLY spot at ${new Date(chartPhase.at).toISOString()}` }
    : referenceChart && chartPrice !== null
      ? { price: chartPrice, at: referenceChart.availableAt, label: `INTRADAY_1M lastPrice; captured ${new Date(referenceChart.capturedAt).toISOString()}, known before 09:10 IST` }
      : null;
  if (phases.length && !reference) preIssues.push('No genuine previous-close reference; live playbook.closePrice is not a previous close');
  for (const phase of phases) {
    if (reference && phase.at >= reference.at) {
      const supports = levels(phase.value.supports);
      const resistances = levels(phase.value.resistances);
      const notes = [
        `Previous-close provenance: ${reference.label}.`,
        context(phase.value.aiSummary), context(phase.value.riskReason),
        supports.length ? `Chart support context: ${supports.join(', ')}.` : '',
        resistances.length ? `Chart resistance context: ${resistances.join(', ')}.` : '',
        'Market context only; Opening Pilot uses 200 ITM and ±10% premium exits, not source trade rules.',
      ].filter(Boolean).join(' ');
      const scenarios = scenarioPlans(chartPhase ?? phase, reference.price);
      const id = `preMkt-plan-${phase.basis}-${phase.at}-${fingerprint([reference.price, reference.at, notes, scenarios])}`;
      if (!result.plans.some(p => p.id === id)) {
        result.plans.push({
          id, day, savedAt: now, previousClose: reference.price,
          flatBand: 25, mediumBand: 75, outerBand: 150, notes, scenarios,
          source: { kind: 'PREMARKET', id, at: phase.at, label: `PreMarket ${phase.basis}` },
        });
      }
    }
    if (phase.basis === 'PREOPEN') {
      const id = `preMkt-preopen-${phase.at}-${fingerprint([phase.spot, phase.value.spotSource])}`;
      if (!result.observations.some(o => o.id === id)) {
        result.observations.push({
          id, day, recordedAt: now, observedAt: phase.at,
          preOpen: phase.spot, giftChange: null, support: null, resistance: null,
          supportTrend: 'UNKNOWN', resistanceTrend: 'UNKNOWN',
          notes: `Genuine PREOPEN ${phase.value.spotSource} auction price; no OI wall or GIFT confirmation inferred.`,
          source: { kind: 'PREMARKET', id, at: phase.at, label: 'PreMarket PREOPEN auction' },
        });
      }
    }
  }
  if (oiChart) {
    const support = strike(Array.isArray(oiChart.verdict.supports) ? oiChart.verdict.supports[0] : null);
    const resistance = strike(Array.isArray(oiChart.verdict.resistances) ? oiChart.verdict.resistances[0] : null);
    const valid = support !== null && resistance !== null && support < resistance;
    const stale = now - oiChart.capturedAt > FRESH || dayOf(oiChart.capturedAt) !== day;
    const notes = `OI_SNAPSHOT original upload; ${valid ? 'wall levels only, not writer classification' : 'missing or invalid ordered OI walls'}. Capture age is never refreshed by a phase update; prior-session captures are context only.`;
    const id = `preMkt-oi-${oiChart.capturedAt}-${fingerprint([oiChart.availableAt, support, resistance, valid])}`;
    result.observations.push({
      id, day: dayOf(oiChart.capturedAt), recordedAt: now, observedAt: oiChart.capturedAt,
      preOpen: null, giftChange: null, support: valid ? support : null, resistance: valid ? resistance : null,
      supportTrend: 'UNKNOWN', resistanceTrend: 'UNKNOWN', notes,
      source: { kind: 'PREMARKET', id, at: oiChart.capturedAt, label: 'PreMarket OI_SNAPSHOT original capture' },
    });
    preIssues.push(valid ? stale ? 'OI_SNAPSHOT is stale/prior-session context only' : 'OI_SNAPSHOT capture is within five minutes' : notes);
  } else {
    preIssues.push('No usable OI_SNAPSHOT chart; no fresh OI walls assumed');
  }
  result.premarketStatus = [
    result.plans.length ? `Reused ${result.plans.length} PreMarket phase plan(s), cutoff inclusive 09:25 IST` : 'No eligible PreMarket plan',
    ...new Set(preIssues),
  ].join('. ');

  const visionIssues: string[] = [];
  const candidates = (Array.isArray(input.visionRuns) ? input.visionRuns : [])
    .map(run => visionCandidate(run, start, now, visionIssues))
    .filter((run): run is VisionCandidate => run !== null)
    .sort((a, b) => a.finished - b.finished || a.started - b.started || text(a.value.id).localeCompare(text(b.value.id)));
  const priorValid: VisionCandidate[] = [];
  for (const run of candidates) {
    if (!run.rejection && run.read) {
      const prior = [...priorValid].reverse().find(p =>
        p.started < run.started && p.finished <= run.started && run.finished - p.started <= FRESH);
      run.read.supportRepeated = !!prior && prior.support === run.support;
      run.read.resistanceRepeated = !!prior && prior.resistance === run.resistance;
      // A wall was knowable only once analysis completed, not when capture began.
      run.read.supportObservedSince = run.read.supportRepeated ? prior!.finished : run.finished;
      run.read.resistanceObservedSince = run.read.resistanceRepeated ? prior!.finished : run.finished;
      priorValid.push(run);
    }
    const id = `vision-${run.started}-${run.finished}-${fingerprint([text(run.value.id), run.support, run.resistance, run.read, run.rejection])}`;
    if (result.observations.some(o => o.id === id)) continue;
    result.observations.push({
      id, day, recordedAt: now, observedAt: run.started,
      preOpen: null, giftChange: null, support: run.support, resistance: run.resistance,
      supportTrend: 'UNKNOWN', resistanceTrend: 'UNKNOWN',
      notes: run.rejection
        ? `Blocked: ${run.rejection}. This completed run supersedes earlier reads.`
        : 'Repeated strikes mean repeated wall levels only, not unchanged OI quantity or writer build-up.',
      source: { kind: 'VISION', id: text(run.value.id) || id, at: run.finished, label: `Vision chart/OI read ${text(run.value.id)}`.trim() },
      ...(run.read ? { vision: run.read } : {}),
    });
  }
  const latest = candidates[candidates.length - 1];
  result.visionStatus = latest
    ? latest.rejection
      ? `Latest Vision blocked: ${latest.rejection}`
      : now - latest.started > FRESH
        ? 'Latest valid Vision read is stale (over five minutes since capture); no fresh signal'
        : 'Latest Vision chart/OI read available; repeated levels do not classify OI writing'
    : 'No valid completed Vision run for today';
  if (visionIssues.length) result.visionStatus += `. ${[...new Set(visionIssues)].join('. ')}`;
  return result;
}
