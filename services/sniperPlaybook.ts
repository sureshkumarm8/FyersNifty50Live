/**
 * Nifty Sniper: The Office Protocol
 * ---------------------------------
 * Turns pre-market chart reads into the exact decision this trading system
 * needs: is today a trade day, at which zone, with which 250-ITM option, and
 * what would invalidate the plan.
 *
 * Every rule here mirrors my_system_template + components/MySystemAutoTrade.tsx
 * so the pre-market screen can never suggest something the live engine would
 * refuse to execute.
 *
 * Pure module - no React, no I/O - so it can be unit tested directly.
 */

export const SNIPER = {
  name: 'Nifty Sniper: The Office Protocol',
  /** Watch the open, do not trade. */
  downloadStart: '09:15',
  /** Entry window opens. */
  entryStart: '09:25',
  /** "If choppy or confusing by 09:45, close the laptop." */
  reviewBy: '09:45',
  /** Hard stop. No exceptions. */
  hardStop: '10:15',
  targetPoints: 30,
  stopPoints: 30,
  /** MySystemAutoTrade uses a fixed 250-point ITM strike. */
  itmPoints: 250,
  strikeStep: 50,
  /** MySystemAutoTrade rejects live signals below this confidence. */
  minEngineConfidence: 75,
  /** MySystemAutoTrade treats price within this distance as "at the zone". */
  zoneBuffer: 30,
  /**
   * Minimum wall-to-wall room. Entry happens up to `zoneBuffer` inside the
   * zone and needs `targetPoints` of travel, so anything under 60 makes the
   * 30-point target mathematically unreachable before the opposite wall.
   */
  minZoneWidth: 60,
  /** Below this the day is technically tradable but uncomfortably tight. */
  comfortableZoneWidth: 90,
  /**
   * Chart levels further apart than this are positional, not intraday - the
   * real zones will come from the 09:15-09:25 five-minute range instead.
   */
  maxUsefulZoneWidth: 400,
  /** Approximate delta of a 250-point ITM weekly Nifty option. */
  itmDelta: 0.85
} as const;

export type SniperVerdict = 'GO' | 'CAUTION' | 'STAND_ASIDE';
export type SniperPhase = 'PRE_MARKET' | 'DOWNLOAD' | 'ENTRY_WINDOW' | 'LATE_WINDOW' | 'CLOSED';
export type PlayStatus = 'PRIMARY' | 'SECONDARY' | 'BLOCKED';

export interface ZonePlay {
  side: 'CE' | 'PE';
  direction: 'LONG' | 'SHORT';
  zoneKind: 'SUPPORT' | 'RESISTANCE';
  /** The level price must reach for this play to arm. */
  zone: number;
  /** Inclusive trigger band - MySystemAutoTrade arms within 30 points. */
  triggerFrom: number;
  triggerTo: number;
  strike: number;
  optionLabel: string;
  itmPoints: number;
  targetSpot: number;
  stopSpot: number;
  /** Spot distance from the zone to the opposite wall. */
  roomToOpposite: number;
  /** Approximate premium move for the 30-point spot target. */
  approxPremiumTarget: number;
  approxPremiumStop: number;
  status: PlayStatus;
  notes: string[];
}

export interface SniperGate {
  id: string;
  label: string;
  pass: boolean;
  /** Soft gates warn but do not by themselves stop the day. */
  severity: 'BLOCKER' | 'WARNING';
  detail: string;
}

export interface ConfluenceLevel {
  level: number;
  kind: 'SUPPORT' | 'RESISTANCE';
  sources: string[];
  /** Number of independent charts that reported this level. */
  votes: number;
}

export interface PhaseStep {
  time: string;
  title: string;
  items: string[];
  state: 'DONE' | 'ACTIVE' | 'UPCOMING';
}

export interface SniperPlaybook {
  verdict: SniperVerdict;
  verdictHeadline: string;
  verdictReason: string;
  grade: 'A' | 'B' | 'C' | 'D';
  phase: SniperPhase;
  phaseLabel: string;
  minutesToEntry: number | null;
  minutesToHardStop: number | null;
  plannedSupport: number;
  plannedResistance: number;
  zoneWidth: number;
  plays: ZonePlay[];
  primaryPlay: ZonePlay | null;
  gates: SniperGate[];
  blockers: string[];
  warnings: string[];
  confluence: ConfluenceLevel[];
  openPlan: string;
  invalidations: string[];
  timeline: PhaseStep[];
  deltaNote: string;
  /** Compact text for pasting into a journal / sharing. */
  briefing: string;
}

// --- helpers ---------------------------------------------------------------

const roundToStep = (value: number, step = SNIPER.strikeStep) => Math.round(value / step) * step;

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

/** Minutes since midnight IST, robust across the host machine's timezone. */
export function istMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function resolvePhase(now: Date = new Date()): SniperPhase {
  const mins = istMinutes(now);
  if (mins < toMinutes(SNIPER.downloadStart)) return 'PRE_MARKET';
  if (mins < toMinutes(SNIPER.entryStart)) return 'DOWNLOAD';
  if (mins < toMinutes(SNIPER.reviewBy)) return 'ENTRY_WINDOW';
  if (mins < toMinutes(SNIPER.hardStop)) return 'LATE_WINDOW';
  return 'CLOSED';
}

const PHASE_LABELS: Record<SniperPhase, string> = {
  PRE_MARKET: 'Pre-market · plan now, do not trade',
  DOWNLOAD: 'Download 09:15-09:25 · watch only, mark the 5-min range',
  ENTRY_WINDOW: 'Entry window 09:25-09:45 · prime time for the setup',
  LATE_WINDOW: 'Late window 09:45-10:15 · only already-armed setups',
  CLOSED: 'Closed · 10:15 hard stop passed, day is over'
};

/**
 * Groups levels reported by different charts that point at the same price.
 * Two charts independently naming ~the same level is the strongest signal
 * this system gets, so it is surfaced explicitly.
 */
export function findConfluence(
  reports: { source: string; supports: number[]; resistances: number[] }[],
  tolerance = 25
): ConfluenceLevel[] {
  const out: ConfluenceLevel[] = [];

  (['SUPPORT', 'RESISTANCE'] as const).forEach(kind => {
    const points = reports.flatMap(r =>
      (kind === 'SUPPORT' ? r.supports : r.resistances).map(level => ({ level, source: r.source }))
    );
    const clusters: { levels: number[]; sources: string[] }[] = [];

    points
      .slice()
      .sort((a, b) => a.level - b.level)
      .forEach(point => {
        const last = clusters[clusters.length - 1];
        if (last && Math.abs(point.level - last.levels[last.levels.length - 1]) <= tolerance) {
          last.levels.push(point.level);
          if (!last.sources.includes(point.source)) last.sources.push(point.source);
        } else {
          clusters.push({ levels: [point.level], sources: [point.source] });
        }
      });

    clusters
      .filter(c => c.sources.length >= 2)
      .forEach(c =>
        out.push({
          level: Math.round(c.levels.reduce((a, b) => a + b, 0) / c.levels.length),
          kind,
          sources: c.sources,
          votes: c.sources.length
        })
      );
  });

  return out.sort((a, b) => b.votes - a.votes);
}

function buildPlay(
  kind: 'SUPPORT' | 'RESISTANCE',
  zone: number,
  opposite: number,
  status: PlayStatus,
  notes: string[]
): ZonePlay {
  const isSupport = kind === 'SUPPORT';
  // The engine derives the strike from the ATM at entry time, and at entry
  // time price is sitting on the zone - so the zone is the right anchor.
  const atm = roundToStep(zone);
  const strike = isSupport ? atm - SNIPER.itmPoints : atm + SNIPER.itmPoints;
  const side = isSupport ? 'CE' : 'PE';

  return {
    side,
    direction: isSupport ? 'LONG' : 'SHORT',
    zoneKind: kind,
    zone: Math.round(zone),
    triggerFrom: Math.round(isSupport ? zone : zone - SNIPER.zoneBuffer),
    triggerTo: Math.round(isSupport ? zone + SNIPER.zoneBuffer : zone),
    strike,
    optionLabel: `${fmt(strike)} ${side}`,
    itmPoints: SNIPER.itmPoints,
    targetSpot: Math.round(isSupport ? zone + SNIPER.targetPoints : zone - SNIPER.targetPoints),
    stopSpot: Math.round(isSupport ? zone - SNIPER.stopPoints : zone + SNIPER.stopPoints),
    roomToOpposite: Math.round(Math.abs(opposite - zone)),
    approxPremiumTarget: Math.round(SNIPER.targetPoints * SNIPER.itmDelta),
    approxPremiumStop: Math.round(SNIPER.stopPoints * SNIPER.itmDelta),
    status,
    notes
  };
}

export interface SniperInput {
  support: number;
  resistance: number;
  spot: number;
  /** -100..100 blended chart/market bias from the pre-market decision. */
  sentimentStrength: number;
  openSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  /** How many of the four charts produced a readable verdict. */
  chartCoverage: number;
  totalCharts: number;
  /** 0-100 agreement between the directional charts. */
  agreement: number;
  confidence: number;
  /** Slots whose screenshots are older than the last session. */
  staleCharts: string[];
  /** Slots that are missing entirely. */
  missingCharts: string[];
  /** True when the Sensibull OI wall chart was read successfully. */
  hasOiChart: boolean;
  gapScenario: { flat: number; gapUp: number; gapDown: number };
  levelReports: { source: string; supports: number[]; resistances: number[] }[];
  now?: Date;
}

export function buildSniperPlaybook(input: SniperInput): SniperPlaybook {
  const now = input.now ?? new Date();
  const phase = resolvePhase(now);
  const mins = istMinutes(now);
  const support = Math.round(input.support);
  const resistance = Math.round(input.resistance);
  const zoneWidth = resistance - support;

  // --- gates ---------------------------------------------------------------
  const gates: SniperGate[] = [];

  gates.push({
    id: 'coverage',
    label: 'Enough charts read',
    severity: input.chartCoverage >= 2 ? 'WARNING' : 'BLOCKER',
    pass: input.chartCoverage >= 2,
    detail:
      input.chartCoverage >= 2
        ? `${input.chartCoverage}/${input.totalCharts} charts readable.`
        : `Only ${input.chartCoverage}/${input.totalCharts} readable. One chart is an opinion, not a plan.`
  });

  gates.push({
    id: 'oi',
    label: 'Option walls known',
    severity: 'WARNING',
    pass: input.hasOiChart,
    detail: input.hasOiChart
      ? 'Sensibull OI read - the walls that cap the 30-point move are known.'
      : 'No Sensibull OI read. You are guessing where the writers have capped the move.'
  });

  gates.push({
    id: 'fresh',
    label: 'Charts are current',
    severity: input.staleCharts.length ? 'BLOCKER' : 'WARNING',
    pass: input.staleCharts.length === 0,
    detail: input.staleCharts.length
      ? `Stale screenshot(s): ${input.staleCharts.join(', ')}. Re-capture before the open.`
      : 'All screenshots are from the current pre-market session.'
  });

  const roomOk = zoneWidth >= SNIPER.minZoneWidth;
  gates.push({
    id: 'room',
    label: '30 points actually fits',
    severity: 'BLOCKER',
    pass: roomOk,
    detail: roomOk
      ? `${zoneWidth} points wall to wall - a 30-point target fits with ${zoneWidth - SNIPER.targetPoints} points to spare.`
      : `Only ${zoneWidth} points between the walls. Entry can be up to ${SNIPER.zoneBuffer} points inside the zone, so 30 points cannot be captured. This is a no-trade day.`
  });

  const widthUsable = zoneWidth <= SNIPER.maxUsefulZoneWidth;
  gates.push({
    id: 'width',
    label: 'Zones are intraday-relevant',
    severity: 'WARNING',
    pass: widthUsable,
    detail: widthUsable
      ? 'Walls are close enough that price can realistically reach one before 10:15.'
      : `Walls are ${zoneWidth} points apart - positional, not intraday. Price may never reach either zone in the 50-minute window; defer to the 09:15-09:25 five-minute range.`
  });

  const directionClear = input.agreement >= SNIPER.minEngineConfidence || input.openSentiment === 'NEUTRAL';
  gates.push({
    id: 'agreement',
    label: 'Charts are not fighting each other',
    severity: 'BLOCKER',
    pass: directionClear,
    detail: directionClear
      ? input.openSentiment === 'NEUTRAL'
        ? 'No directional lean - a clean two-sided range play, which is the best case for this system.'
        : `${input.agreement}% of directional charts agree.`
      : `Only ${input.agreement}% agreement. "NO SETUP = NO TRADE" - conflicting timeframes are exactly the confusion your rules tell you to sit out.`
  });

  const confidenceOk = input.confidence >= SNIPER.minEngineConfidence;
  gates.push({
    id: 'confidence',
    label: `Confidence ≥ ${SNIPER.minEngineConfidence}%`,
    severity: 'WARNING',
    pass: confidenceOk,
    detail: confidenceOk
      ? `${input.confidence}% - clears the bar your live engine enforces.`
      : `${input.confidence}% pre-market. Your engine independently rejects live signals under ${SNIPER.minEngineConfidence}%, so expect it to stay silent unless the open improves the picture.`
  });

  gates.push({
    id: 'window',
    label: 'Inside the trading window',
    severity: 'WARNING',
    pass: phase !== 'CLOSED',
    detail:
      phase === 'CLOSED'
        ? 'Past the 10:15 hard stop. Whatever this plan says, today is over.'
        : PHASE_LABELS[phase]
  });

  const blockers = gates.filter(g => !g.pass && g.severity === 'BLOCKER').map(g => g.detail);
  const warnings = gates.filter(g => !g.pass && g.severity === 'WARNING').map(g => g.detail);

  // --- verdict -------------------------------------------------------------
  let verdict: SniperVerdict;
  let verdictHeadline: string;
  let verdictReason: string;

  if (blockers.length) {
    verdict = 'STAND_ASIDE';
    verdictHeadline = 'STAND ASIDE — no trade today';
    verdictReason = blockers[0];
  } else if (warnings.length >= 2) {
    verdict = 'CAUTION';
    verdictHeadline = 'CAUTION — half a setup';
    verdictReason = `${warnings.length} soft checks failed. Take the trade only if price reaches a zone cleanly and the 5-min range confirms it.`;
  } else if (warnings.length === 1) {
    verdict = 'CAUTION';
    verdictHeadline = 'CAUTION — one gap in the plan';
    verdictReason = warnings[0];
  } else {
    verdict = 'GO';
    verdictHeadline = 'GO — setup is clean';
    verdictReason = `All checks pass with ${zoneWidth} points of room. Arm the zones and wait for price to come to you.`;
  }

  const grade: SniperPlaybook['grade'] =
    verdict === 'STAND_ASIDE'
      ? 'D'
      : warnings.length === 0 && input.chartCoverage === input.totalCharts
        ? 'A'
        : warnings.length <= 1
          ? 'B'
          : 'C';

  // --- the two zone plays --------------------------------------------------
  const bias = input.sentimentStrength;
  const longBlockedByBias = bias <= -40;
  const shortBlockedByBias = bias >= 40;

  const ceNotes: string[] = [];
  const peNotes: string[] = [];

  if (longBlockedByBias) {
    ceNotes.push(
      `Bias is ${bias} (bearish). Your engine refuses a LONG when the live signal points SHORT, so this side will likely never arm.`
    );
  }
  if (shortBlockedByBias) {
    peNotes.push(
      `Bias is +${bias} (bullish). Your engine refuses a SHORT when the live signal points LONG, so this side will likely never arm.`
    );
  }
  if (input.gapScenario.gapUp >= 45) {
    peNotes.push('Gap-up is the favoured open - watch for profit booking into resistance, which is this side\'s best case.');
    ceNotes.push('On a gap-up open do not chase longs; wait for a pullback all the way to support.');
  }
  if (input.gapScenario.gapDown >= 45) {
    ceNotes.push('Gap-down is the favoured open - the recovery bounce off support is this side\'s best case.');
    peNotes.push('On a gap-down open do not chase shorts; only fade a rally that actually reaches resistance.');
  }
  if (!roomOk) {
    ceNotes.push('No room for 30 points - informational only.');
    peNotes.push('No room for 30 points - informational only.');
  }

  const cePlay = buildPlay(
    'SUPPORT',
    support,
    resistance,
    !roomOk || longBlockedByBias ? 'BLOCKED' : bias >= 0 ? 'PRIMARY' : 'SECONDARY',
    ceNotes
  );
  const pePlay = buildPlay(
    'RESISTANCE',
    resistance,
    support,
    !roomOk || shortBlockedByBias ? 'BLOCKED' : bias <= 0 ? 'PRIMARY' : 'SECONDARY',
    peNotes
  );

  const plays = [cePlay, pePlay];
  const primaryPlay = plays.find(p => p.status === 'PRIMARY') ?? null;

  // --- open plan -----------------------------------------------------------
  const { flat, gapUp, gapDown } = input.gapScenario;
  const likeliestOpen = gapUp >= flat && gapUp >= gapDown ? 'GAP_UP' : gapDown >= flat ? 'GAP_DOWN' : 'FLAT';

  const openPlan =
    likeliestOpen === 'GAP_UP'
      ? `Gap-up open is most likely (${gapUp}%). Your own rule flags this as a profit-booking risk: do not buy the gap. Let the 09:15-09:25 range form, then fade into ${fmt(resistance)} with the ${pePlay.optionLabel}, or wait for a full pullback to ${fmt(support)}.`
      : likeliestOpen === 'GAP_DOWN'
        ? `Gap-down open is most likely (${gapDown}%). Do not sell into the hole. Let the 09:15-09:25 range form and look for the bounce off ${fmt(support)} with the ${cePlay.optionLabel}.`
        : `Flat open is most likely (${flat}%). This is the cleanest case for the protocol: mark the 5-min range, then take whichever zone price touches first between 09:25 and 09:45.`;

  // --- invalidations -------------------------------------------------------
  const invalidations: string[] = [
    `The 09:15-09:25 five-minute range prints outside ${fmt(support)}-${fmt(resistance)} — the live range replaces these chart levels.`,
    `Price is sitting mid-range at 09:45 having touched neither zone — your rule says close the laptop.`,
    `Price breaks a zone and holds beyond it for a full candle — that is a breakout, not the reversion this system trades. Stand down.`,
    `Any setup that would still be open at 10:15 — the hard stop exits it regardless of P&L.`
  ];
  if (!input.hasOiChart) {
    invalidations.push('OI walls unknown — if price stalls at an unseen wall you will not know why. Treat targets as unconfirmed.');
  }
  if (zoneWidth < SNIPER.comfortableZoneWidth && roomOk) {
    invalidations.push(
      `Only ${zoneWidth} points of room. The 30-point target lands within ${zoneWidth - SNIPER.targetPoints} points of the opposite wall — take profit early rather than waiting for the full 30.`
    );
  }

  // --- timeline ------------------------------------------------------------
  const stepState = (from: string, to: string): PhaseStep['state'] => {
    if (mins >= toMinutes(to)) return 'DONE';
    if (mins >= toMinutes(from)) return 'ACTIVE';
    return 'UPCOMING';
  };

  const timeline: PhaseStep[] = [
    {
      time: `before ${SNIPER.downloadStart}`,
      title: 'Pre-market prep',
      items: [
        'All four screenshots captured and analysed.',
        `Zones armed: support ${fmt(support)}, resistance ${fmt(resistance)}.`,
        `Strikes noted: ${cePlay.optionLabel} for the bounce, ${pePlay.optionLabel} for the fade.`
      ],
      state: mins >= toMinutes(SNIPER.downloadStart) ? 'DONE' : 'ACTIVE'
    },
    {
      time: '09:15 – 09:25',
      title: 'The Download — watch only',
      items: [
        'DO NOT TRADE.',
        'Mark the 5-min high and low.',
        'Compare the live 5-min range with the chart zones above — a match is your highest-conviction day.',
        'Assess open type: gap up (profit booking?) or flat.'
      ],
      state: stepState(SNIPER.downloadStart, SNIPER.entryStart)
    },
    {
      time: '09:25 – 09:45',
      title: 'The Entry Window',
      items: [
        'Wait for price to reach a zone. Do not go to the market — let it come to you.',
        'Wait for a candle close confirmation at the zone.',
        `Buy the ${SNIPER.itmPoints}-point ITM option on the matching side.`,
        'NO SETUP = NO TRADE.'
      ],
      state: stepState(SNIPER.entryStart, SNIPER.reviewBy)
    },
    {
      time: '09:45 – 10:15',
      title: 'Manage, do not initiate',
      items: [
        'No new entries — if nothing armed by 09:45, the day is done.',
        `Target +${SNIPER.targetPoints} / stop −${SNIPER.stopPoints}, whichever hits first.`
      ],
      state: stepState(SNIPER.reviewBy, SNIPER.hardStop)
    },
    {
      time: '10:15',
      title: 'The Hard Stop',
      items: ['Exit at market regardless of P&L.', 'Close the terminal. Office work is priority #1.'],
      state: mins >= toMinutes(SNIPER.hardStop) ? 'DONE' : 'UPCOMING'
    }
  ];

  const deltaNote =
    `Your engine books +${SNIPER.targetPoints} on the option premium, but a ${SNIPER.itmPoints}-point ITM option moves at roughly ${SNIPER.itmDelta} delta. ` +
    `So +${SNIPER.targetPoints} premium points needs about ${Math.round(SNIPER.targetPoints / SNIPER.itmDelta)} points of spot movement, and the stop triggers after only about ${Math.round(SNIPER.stopPoints / SNIPER.itmDelta)} spot points against you. ` +
    `Size and expectations accordingly.`;

  const minutesToEntry = mins < toMinutes(SNIPER.entryStart) ? toMinutes(SNIPER.entryStart) - mins : null;
  const minutesToHardStop = mins < toMinutes(SNIPER.hardStop) ? toMinutes(SNIPER.hardStop) - mins : null;

  const confluence = findConfluence(input.levelReports);

  const briefing = [
    `${SNIPER.name} — ${new Date(now).toLocaleDateString('en-IN')}`,
    `VERDICT: ${verdictHeadline} (grade ${grade})`,
    verdictReason,
    '',
    `Spot reference ${fmt(input.spot)} | Support ${fmt(support)} | Resistance ${fmt(resistance)} | Room ${zoneWidth} pts`,
    `Bounce play : price ${fmt(cePlay.triggerFrom)}-${fmt(cePlay.triggerTo)} → buy ${cePlay.optionLabel} → target ${fmt(cePlay.targetSpot)} / stop ${fmt(cePlay.stopSpot)} [${cePlay.status}]`,
    `Fade play   : price ${fmt(pePlay.triggerFrom)}-${fmt(pePlay.triggerTo)} → buy ${pePlay.optionLabel} → target ${fmt(pePlay.targetSpot)} / stop ${fmt(pePlay.stopSpot)} [${pePlay.status}]`,
    '',
    openPlan,
    '',
    confluence.length
      ? `Confluence: ${confluence.map(c => `${fmt(c.level)} (${c.kind.toLowerCase()}, ${c.votes} charts)`).join(', ')}`
      : 'Confluence: none — no level was confirmed by two charts.',
    '',
    'Invalidations:',
    ...invalidations.map(i => `- ${i}`)
  ].join('\n');

  return {
    verdict,
    verdictHeadline,
    verdictReason,
    grade,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    minutesToEntry,
    minutesToHardStop,
    plannedSupport: support,
    plannedResistance: resistance,
    zoneWidth,
    plays,
    primaryPlay,
    gates,
    blockers,
    warnings,
    confluence,
    openPlan,
    invalidations,
    timeline,
    deltaNote,
    briefing
  };
}
