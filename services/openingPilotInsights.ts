import type { PilotAssessment, PilotCheck, PilotFrame, PilotSide, PilotTrade } from './openingPilotTypes';
import { PILOT_POLICY } from './openingPilot';
import { istDayKey, istMinutesOf } from './sniperEngine';

// Read-only views over the existing assessment and recorded frames. Nothing
// here changes the entry rules; it explains them and measures them.

export type PilotPillar = 'DATA' | 'CONTEXT' | 'TRIGGER';

const PILLAR_OF: Record<string, PilotPillar> = {
  'Market session': 'DATA', 'Live spot': 'DATA', 'Ten-minute warmup': 'DATA',
  'Unambiguous samples': 'DATA', 'Timestamp continuity': 'DATA', 'Sampled opening range': 'DATA',
  'Saved gap plan': 'CONTEXT', 'OI wall evidence': 'CONTEXT',
  'Vision / minute-history agreement': 'CONTEXT', 'Day sentiment': 'CONTEXT',
  'Recent price and sentiment slope': 'TRIGGER', 'Observed wall rejection': 'TRIGGER',
  'Room to opposing OI wall': 'TRIGGER'
};

// Not required for readiness: the opening range is implied by the warmup check
// and wall rejection only distinguishes a reversal from a continuation.
const OPTIONAL = new Set(['Sampled opening range', 'Observed wall rejection']);

// Order in which a trader can actually resolve blockers.
const BLOCKER_ORDER = [
  'Market session', 'Live spot', 'Unambiguous samples', 'Ten-minute warmup', 'Timestamp continuity',
  'Saved gap plan', 'OI wall evidence', 'Day sentiment', 'Recent price and sentiment slope',
  'Vision / minute-history agreement', 'Room to opposing OI wall'
];

export interface PilotGate extends PilotCheck {
  pillar: PilotPillar;
  required: boolean;
}

export interface PilotGauge {
  key: 'move1m' | 'move5m' | 'sentimentDelta' | 'daySentiment' | 'wallDistance';
  label: string;
  value: number | null;
  threshold: number;
  unit: string;
  /** 0..1 progress toward the threshold in the leading direction. */
  progress: number;
  pass: boolean;
}

export interface PilotGateSummary {
  gates: PilotGate[];
  pillars: Record<PilotPillar, { passed: number; total: number }>;
  required: { passed: number; total: number };
  direction: 1 | -1;
  gauges: PilotGauge[];
  blocker: string | null;
}

const fmt = (n: number) => `${n > 0 ? '+' : ''}${Math.round(n * 10) / 10}`;

export function leadingDirection(a: PilotAssessment): 1 | -1 {
  if (a.side) return a.side === 'CE' ? 1 : -1;
  for (const value of [a.move5m, a.sentimentDelta, a.move1m, a.daySentiment]) {
    if (value !== null && Number.isFinite(value) && value !== 0) return value > 0 ? 1 : -1;
  }
  return 1;
}

export function pilotGauges(a: PilotAssessment, direction = leadingDirection(a)): PilotGauge[] {
  const gauge = (key: PilotGauge['key'], label: string, raw: number | null, threshold: number, unit: string, directional = true): PilotGauge => {
    const value = raw === null || !Number.isFinite(raw) ? null : directional ? raw * direction : raw;
    return {
      key, label, value, threshold, unit,
      progress: value === null ? 0 : Math.max(0, Math.min(1, value / threshold)),
      pass: value !== null && value >= threshold
    };
  };
  return [
    gauge('move1m', '1m move', a.move1m, PILOT_POLICY.minMove1m, 'pts'),
    gauge('move5m', '5m move', a.move5m, PILOT_POLICY.minMove5m, 'pts'),
    gauge('sentimentDelta', '5m sentiment', a.sentimentDelta, PILOT_POLICY.minSentimentDelta, 'pp'),
    // Day bias only needs magnitude; its sign decides continuation vs reversal.
    gauge('daySentiment', 'Day bias |sent|', a.daySentiment === null ? null : Math.abs(a.daySentiment), PILOT_POLICY.minDaySentiment, '', false),
    gauge('wallDistance', 'Room to wall', a.wallDistance, PILOT_POLICY.minRoomPoints, 'pts', false)
  ];
}

function blockerText(label: string, a: PilotAssessment, gauges: PilotGauge[]): string {
  const g = Object.fromEntries(gauges.map(x => [x.key, x])) as Record<PilotGauge['key'], PilotGauge>;
  const need = (x: PilotGauge) => `${x.label} ${x.value === null ? '--' : fmt(x.value)} of ${fmt(x.threshold)}${x.unit ? ` ${x.unit}` : ''}`;
  switch (label) {
    case 'Market session': return 'Market is closed.';
    case 'Live spot': return 'Waiting for a fresh Nifty sample (≤90s old).';
    case 'Unambiguous samples': return 'Conflicting samples at one timestamp; waiting for a clean refresh.';
    case 'Ten-minute warmup': return 'Opening range still forming; readiness starts 09:25 IST with 10 minute samples.';
    case 'Timestamp continuity': return 'Need six consecutive minute samples; the feed skipped a minute.';
    case 'Saved gap plan': return a.scenario === 'OUTSIDE'
      ? 'Gap is outside the planned bands; the pilot stands aside today.'
      : 'Waiting for the PreMkt plan (previous close + gap bands).';
    case 'OI wall evidence': return 'Need a fresh (≤5 min) support/resistance read from Vision or PreMkt.';
    case 'Day sentiment': return `Day bias too weak: ${need(g.daySentiment)}.`;
    case 'Recent price and sentiment slope': {
      const missing = [g.move1m, g.move5m, g.sentimentDelta].filter(x => !x.pass).map(need);
      return `Momentum not aligned: ${missing.join(', ')}.`;
    }
    case 'Vision / minute-history agreement': return 'Latest Vision bias disagrees with recent momentum.';
    case 'Room to opposing OI wall': return `Too close to the opposing wall: ${need(g.wallDistance)}.`;
    default: return label;
  }
}

export function summarizeGates(a: PilotAssessment): PilotGateSummary {
  const gates: PilotGate[] = a.checks.map(c => ({
    ...c, pillar: PILLAR_OF[c.label] ?? 'CONTEXT', required: !OPTIONAL.has(c.label)
  }));
  const pillars = { DATA: { passed: 0, total: 0 }, CONTEXT: { passed: 0, total: 0 }, TRIGGER: { passed: 0, total: 0 } };
  for (const gate of gates) {
    if (!gate.required) continue;
    pillars[gate.pillar].total++;
    if (gate.pass) pillars[gate.pillar].passed++;
  }
  const required = gates.filter(g => g.required);
  const direction = leadingDirection(a);
  const gauges = pilotGauges(a, direction);
  const failing = new Set(required.filter(g => !g.pass).map(g => g.label));
  let label = BLOCKER_ORDER.find(l => failing.has(l)) ?? [...failing][0] ?? null;
  // Every check passes but the setup is NONE: day bias opposes momentum without a rejection.
  let blocker = label ? blockerText(label, a, gauges) : null;
  if (!blocker && a.status !== 'PAPER ENTRY READY') {
    blocker = 'Day bias opposes recent momentum and no wall rejection confirms a reversal.';
  }
  return {
    gates, pillars, direction, gauges, blocker,
    required: { passed: required.filter(g => g.pass).length, total: required.length }
  };
}

export type PilotPhaseKey = 'CLOSED_DAY' | 'BEFORE' | 'PREPARE' | 'PREOPEN' | 'OPENING_RANGE' | 'DECISION' | 'AFTER';

export interface PilotPhase {
  key: PilotPhaseKey;
  label: string;
  hint: string;
  /** Minutes until the next milestone, when there is one today. */
  minutesToNext: number | null;
  nextLabel: string | null;
  index: number;
}

export const PILOT_PHASES = [
  { key: 'PREPARE', at: 8 * 60 + 55, time: '08:55', label: 'Prepare' },
  { key: 'PREOPEN', at: 9 * 60 + 10, time: '09:10', label: 'Pre-open' },
  { key: 'OPENING_RANGE', at: 9 * 60 + 15, time: '09:15', label: 'Opening range' },
  { key: 'DECISION', at: PILOT_POLICY.entryMinute, time: '09:25', label: 'Decide' }
] as const;

export function pilotPhase(now: number): PilotPhase {
  const minutes = istMinutesOf(new Date(now));
  const weekday = new Date(now + 330 * 60_000).getUTCDay();
  if (weekday === 0 || weekday === 6) {
    return { key: 'CLOSED_DAY', label: 'Market closed', hint: 'Weekend. Use Replay or the Journal to review recorded sessions.', minutesToNext: null, nextLabel: null, index: -1 };
  }
  const hints: Record<string, string> = {
    PREPARE: 'PreMkt builds the five gap scenarios. Nothing to do here yet.',
    PREOPEN: 'Pre-open price discovery. The gap scenario is indicative only.',
    OPENING_RANGE: 'Let the first ten minutes print. No entries before 09:25.',
    DECISION: 'Enter only on PAPER ENTRY READY, otherwise stand aside or record a skip.'
  };
  if (minutes >= 15 * 60 + 30) {
    return { key: 'AFTER', label: 'Session over', hint: 'Review the journal and today’s signal record.', minutesToNext: null, nextLabel: null, index: PILOT_PHASES.length };
  }
  const index = PILOT_PHASES.filter(p => minutes >= p.at).length - 1;
  if (index < 0) {
    return { key: 'BEFORE', label: 'Before prep', hint: 'The opening workflow starts at 08:55 IST.', minutesToNext: PILOT_PHASES[0].at - minutes, nextLabel: PILOT_PHASES[0].label, index: -1 };
  }
  const phase = PILOT_PHASES[index];
  const next = PILOT_PHASES[index + 1];
  return {
    key: phase.key, label: phase.label, hint: hints[phase.key], index,
    minutesToNext: next ? next.at - minutes : null, nextLabel: next?.label ?? null
  };
}

// ---------------------------------------------------------------------------
// Measured track record of the pilot's own recorded signals.

export const TRACK_POLICY = {
  /** Symmetric spot bracket used as a proxy for the ±10% premium exit on a 200-ITM option. */
  bracketPoints: 25,
  horizonsMin: [10, 20] as const,
  windowMin: 20,
  /** Below this many resolved signals the hit rate is shown as not yet meaningful. */
  minSample: 20,
  maxGapMs: PILOT_POLICY.maxQuoteAgeMs
};

export type PilotSignalOutcome = 'WIN' | 'LOSS' | 'TIMEOUT' | 'PENDING';

export interface PilotSignal {
  day: string;
  at: number;
  status: PilotAssessment['status'];
  side: PilotSide;
  entrySpot: number;
  /** Signed in the signal's favour. */
  move10: number | null;
  move20: number | null;
  mfe: number | null;
  mae: number | null;
  outcome: PilotSignalOutcome;
  /** A missing minute inside the window means the bracket order is uncertain. */
  samplingGap: boolean;
}

export interface PilotBucket {
  status: PilotAssessment['status'];
  signals: number;
  wins: number;
  losses: number;
  timeouts: number;
  pending: number;
  hitRate: number | null;
  ci: [number, number] | null;
  avgMove20: number | null;
  meaningful: boolean;
}

export function wilson(successes: number, n: number, z = 1.96): [number, number] | null {
  if (n <= 0) return null;
  const p = successes / n;
  const denom = 1 + z * z / n;
  const centre = (p + z * z / (2 * n)) / denom;
  const half = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

const SIGNAL_STATUSES: PilotAssessment['status'][] = ['PAPER ENTRY READY', 'CONTINUATION WATCH', 'REVERSAL WATCH'];

export function pilotSignals(frames: PilotFrame[], now: number): PilotSignal[] {
  const byDay = new Map<string, PilotFrame[]>();
  for (const frame of frames) {
    if (frame.assessment.spot === null || !Number.isFinite(frame.assessment.spot)) continue;
    byDay.set(frame.day, [...(byDay.get(frame.day) ?? []), frame]);
  }
  const signals: PilotSignal[] = [];
  const windowMs = TRACK_POLICY.windowMin * 60_000;
  for (const [day, list] of byDay) {
    const sorted = [...list].sort((a, b) => a.at - b.at);
    sorted.forEach((frame, i) => {
      const a = frame.assessment;
      if (!a.side || !SIGNAL_STATUSES.includes(a.status)) return;
      const prev = sorted[i - 1]?.assessment;
      // One signal per episode: count only the minute the status/side first appears.
      if (prev && prev.status === a.status && prev.side === a.side) return;
      const sign = a.side === 'CE' ? 1 : -1;
      const entry = a.spot!;
      const after = sorted.slice(i + 1).filter(f => f.at - frame.at <= windowMs);
      const favour = (f: PilotFrame) => sign * (f.assessment.spot! - entry);
      const at = (minutes: number) => {
        const target = frame.at + minutes * 60_000;
        const near = after.filter(f => Math.abs(f.at - target) <= TRACK_POLICY.maxGapMs)
          .sort((x, y) => Math.abs(x.at - target) - Math.abs(y.at - target))[0];
        return near ? favour(near) : null;
      };
      let samplingGap = false;
      let previousAt = frame.at;
      let outcome: PilotSignalOutcome | null = null;
      for (const f of after) {
        samplingGap ||= f.at - previousAt > TRACK_POLICY.maxGapMs;
        previousAt = f.at;
        const move = favour(f);
        if (move >= TRACK_POLICY.bracketPoints) { outcome = 'WIN'; break; }
        if (move <= -TRACK_POLICY.bracketPoints) { outcome = 'LOSS'; break; }
      }
      const complete = (after.at(-1)?.at ?? frame.at) - frame.at >= windowMs - TRACK_POLICY.maxGapMs
        || (day !== istDayKey(now) && after.length > 0);
      if (!outcome) outcome = complete ? 'TIMEOUT' : 'PENDING';
      const moves = after.map(favour);
      signals.push({
        day, at: frame.at, status: a.status, side: a.side, entrySpot: entry,
        move10: at(10), move20: at(20),
        mfe: moves.length ? Math.max(0, ...moves) : null,
        mae: moves.length ? Math.min(0, ...moves) : null,
        outcome, samplingGap
      });
    });
  }
  return signals.sort((a, b) => b.at - a.at);
}

export function pilotTrackRecord(signals: PilotSignal[]): PilotBucket[] {
  return SIGNAL_STATUSES.map(status => {
    const own = signals.filter(s => s.status === status);
    const wins = own.filter(s => s.outcome === 'WIN').length;
    const losses = own.filter(s => s.outcome === 'LOSS').length;
    const decided = wins + losses;
    const moves = own.map(s => s.move20).filter((m): m is number => m !== null);
    return {
      status, signals: own.length, wins, losses,
      timeouts: own.filter(s => s.outcome === 'TIMEOUT').length,
      pending: own.filter(s => s.outcome === 'PENDING').length,
      hitRate: decided ? wins / decided : null,
      ci: wilson(wins, decided),
      avgMove20: moves.length ? moves.reduce((x, y) => x + y, 0) / moves.length : null,
      meaningful: decided >= TRACK_POLICY.minSample
    };
  });
}

export interface PilotTradeStats {
  sampled: number;
  wins: number;
  netPnl: number;
  reconciled: number;
  reconciledNet: number;
  overrides: number;
  overrideNet: number;
  winRate: number | null;
  ci: [number, number] | null;
}

export function pilotTradeStats(trades: PilotTrade[]): PilotTradeStats {
  const sampled = trades.filter(t => t.exitReason !== 'RECONCILED');
  const reconciled = trades.filter(t => t.exitReason === 'RECONCILED');
  const overrides = sampled.filter(t => t.override);
  const wins = sampled.filter(t => t.netPnl > 0).length;
  const sum = (list: PilotTrade[]) => Math.round(list.reduce((s, t) => s + t.netPnl, 0) * 100) / 100;
  return {
    sampled: sampled.length, wins, netPnl: sum(sampled),
    reconciled: reconciled.length, reconciledNet: sum(reconciled),
    overrides: overrides.length, overrideNet: sum(overrides),
    winRate: sampled.length ? wins / sampled.length : null,
    ci: wilson(wins, sampled.length)
  };
}
