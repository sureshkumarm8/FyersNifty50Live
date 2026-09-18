import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FyersCredentials, MarketSnapshot, EnrichedFyersQuote } from '../types';
import { imageStorageService } from '../services/imageStorage';
import { callAI, callAIVision, getAIProviderLabel, getVisionProviderLabel, isAIConfigured, isVisionConfigured, resolveVisionProvider } from '../services/aiProvider';
import { SNIPER, buildSniperPlaybook, resolvePhase, istMinutes, SniperPlaybook, ZonePlay } from '../services/sniperPlaybook';
import {
  BASIS_LABEL, BASIS_NOTE, DecisionBasis, OPEN_MINS, basisFor, basisRank, driftRevalidationDue,
  dueRevalidation, isProvisional
} from '../services/premarketSchedule';
import { PhaseReview, ReviewInput, requestPhaseReview } from '../services/premarketReview';
import {
  buildPreMarketExport, downloadPreMarketExport, readPreMarketExportFile
} from '../services/premarketExport';
import { AlertCircle } from 'lucide-react';
import {
  ActivityLog, CaptureChecklist, ChartWorkspace, CommandBar, EvidenceGrid, ForwardBoard, KeyNumbers,
  PhaseBoard, PreviewModal, VerdictBoard
} from './premarket/PreMarketViews';
import { Drawer, NextMoves, StepRail, TheCall, ZoneStrip } from './premarket/DecisionDeck';

// ---------------------------------------------------------------------------
import {
  CHART_SLOTS, ChartContribution, ChartEntry, ChartSlotId, ChartVerdict, DECISION_SCHEMA,
  DECISION_STATE_KEY, IMAGE_KEY, META_STATE_KEY, MarketContext, LevelSource, PendingImage, PhaseSnapshot,
  PreMarketDecision, SLOT_BY_ID, SLOT_ICONS, STALE_AFTER_MS, SlotConfig, biasClasses, isStale,
  isUnreadable
} from './premarket/model';

export { CHART_SLOTS } from './premarket/model';


/** IST calendar date, used to expire a plan the moment the trading day turns over. */
const istDateKey = (ts: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(ts));

// --- parsing helpers -------------------------------------------------------

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const toNumber = (value: any): number | null => {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (value && typeof value === 'object') {
    return toNumber(value.strike ?? value.level ?? value.price ?? value.value);
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s₹]/g, '').match(/-?\d+(\.\d+)?/);
    if (cleaned) return parseFloat(cleaned[0]);
  }
  return null;
};

const toNumberList = (value: any): number[] => {
  const list = Array.isArray(value) ? value : value != null ? [value] : [];
  return list
    .map(toNumber)
    .filter((n): n is number => n !== null && n > 0)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .slice(0, 6);
};

const toStringList = (value: any): string[] => {
  const list = Array.isArray(value) ? value : value != null ? [value] : [];
  return list
    .map(v => (typeof v === 'string' ? v : JSON.stringify(v)))
    .map(v => v.trim())
    .filter(Boolean)
    .slice(0, 4);
};

/** Pulls the first JSON object out of a model reply, tolerating fences and prose. */
const extractJsonObject = (raw: string): any | null => {
  const attempts: string[] = [raw.trim()];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) attempts.push(fenced[1].trim());
  const braced = raw.match(/\{[\s\S]*\}/);
  if (braced) attempts.push(braced[0]);

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
};

const normalizeBias = (value: any): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  const text = String(value ?? '').toUpperCase();
  if (/BULL|LONG|BUY|POSITIVE|UP/.test(text)) return 'BULLISH';
  if (/BEAR|SHORT|SELL|NEGATIVE|DOWN/.test(text)) return 'BEARISH';
  return 'NEUTRAL';
};

const biasFromProse = (text: string): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  const lower = text.toLowerCase();
  const bull = (lower.match(/bullish|buy|long|uptrend|support holding|put writing/g) || []).length;
  const bear = (lower.match(/bearish|sell|short|downtrend|resistance|call writing/g) || []).length;
  if (bull > bear) return 'BULLISH';
  if (bear > bull) return 'BEARISH';
  return 'NEUTRAL';
};

export const parseVerdict = (raw: string): ChartVerdict => {
  const json = extractJsonObject(raw);

  if (json) {
    const summary = String(json.summary ?? json.trend ?? json.view ?? '').trim();
    return {
      bias: normalizeBias(json.bias ?? json.signal ?? json.direction),
      confidence: clamp(Math.round(toNumber(json.confidence) ?? 60), 0, 100),
      summary: summary || 'No summary returned.',
      supports: toNumberList(json.supports ?? json.support ?? json.putWalls ?? json.put_walls),
      resistances: toNumberList(json.resistances ?? json.resistance ?? json.callWalls ?? json.call_walls),
      notes: toStringList(json.notes ?? json.keyObservations ?? json.observations),
      lastPrice: toNumber(json.lastPrice ?? json.last_price ?? json.spot ?? json.close) ?? undefined,
      structured: true,
      raw
    };
  }

  const firstLine = raw.split('\n').map(l => l.trim()).find(Boolean) || raw.trim();
  return {
    bias: biasFromProse(raw),
    confidence: 45,
    summary: firstLine.slice(0, 220),
    supports: [],
    resistances: [],
    notes: [],
    structured: false,
    raw
  };
};

const biasSign = (bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => (bias === 'BULLISH' ? 1 : bias === 'BEARISH' ? -1 : 0);

export const guessSlot = (fileName: string, taken: ChartSlotId[]): ChartSlotId | null => {
  const free = CHART_SLOTS.filter(s => !taken.includes(s.id));
  return free.find(s => s.match.test(fileName))?.id ?? null;
};

/**
 * Turns the per-chart verdicts (plus the live feed, when the market is open)
 * into the opening plan. Pure on purpose - all inputs are arguments.
 */
export function buildDecision(params: {
  charts: ChartEntry[];
  spot: number;
  spotSource: 'LIVE' | 'MANUAL' | 'CHARTS';
  /** Today's measured session high/low, used by the Entry-window re-cut to anchor the zone. */
  rangeHigh?: number;
  rangeLow?: number;
  historyLog?: MarketSnapshot[];
  stocks?: EnrichedFyersQuote[];
  now?: number;
  /** Quality of information available when this was cut. Defaults to the clock. */
  basis?: DecisionBasis;
  /** Carried forward across re-cuts. */
  revalidations?: PreMarketDecision['revalidations'];
  /** Previously captured phases, carried forward so history is not lost. */
  phases?: PreMarketDecision['phases'];
  /** Set when the operator recomputed this phase outside its window. */
  forced?: boolean;
  /** An existing review, reused when this cut lands on the same price. */
  carryReview?: PhaseReview;
}): PreMarketDecision {
  const { charts, spot, spotSource } = params;
  const historyLog = params.historyLog || [];
  const stocks = params.stocks || [];
  const now = params.now ?? Date.now();
  const basis = params.basis ?? basisFor(new Date(now));
  const coverage = charts.length;

  // 1. Weighted chart bias ---------------------------------------------------
  const contributions: ChartContribution[] = charts.map(entry => {
    const config = SLOT_BY_ID[entry.slot];
    return {
      slot: entry.slot,
      label: config.label,
      short: config.short,
      emoji: config.emoji,
      bias: entry.verdict!.bias,
      confidence: entry.verdict!.confidence,
      weight: config.weight,
      summary: entry.verdict!.summary
    };
  });

  const weightSum = contributions.reduce((sum, c) => sum + c.weight, 0) || 1;
  const chartBias = clamp(
    Math.round(
      (contributions.reduce((sum, c) => sum + c.weight * biasSign(c.bias) * (c.confidence / 100), 0) / weightSum) * 100
    ),
    -100,
    100
  );

  const directional = contributions.filter(c => c.bias !== 'NEUTRAL');
  const dominant = chartBias >= 0 ? 'BULLISH' : 'BEARISH';
  const agreement = directional.length
    ? Math.round((directional.filter(c => c.bias === dominant).length / directional.length) * 100)
    : 50;

  // 2. Live market bias, only when the dashboard actually has a feed ---------
  const latest = historyLog[0];
  let marketBias: number | null = null;
  if (latest && historyLog.length >= 5) {
    const reference = historyLog[Math.min(historyLog.length - 1, 30)];
    const bullishStocks = stocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
    const stockSentiment = stocks.length ? (bullishStocks / stocks.length) * 100 - 50 : 0;
    const optionSentiment = latest.optionsSent || 0;
    const momentum = reference?.niftyLtp ? ((latest.niftyLtp - reference.niftyLtp) / reference.niftyLtp) * 100 : 0;
    marketBias = clamp(Math.round(stockSentiment * 0.5 + optionSentiment * 0.3 + momentum * 20), -100, 100);
  }

  const combined = marketBias === null ? chartBias : Math.round(chartBias * 0.65 + marketBias * 0.35);

  const openSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    combined > 20 ? 'BULLISH' : combined < -20 ? 'BEARISH' : 'NEUTRAL';
  const primaryBias: 'LONG' | 'SHORT' | 'NEUTRAL' = combined > 30 ? 'LONG' : combined < -30 ? 'SHORT' : 'NEUTRAL';

  // 3. Levels the charts actually reported -----------------------------------
  // Levels are deduplicated within 10 points of each other: two models reading
  // 24,700 and 24,705 are naming the same wall, not two.
  const collect = (pick: (v: ChartVerdict) => number[]) => {
    const raw = charts
      .flatMap(c => pick(c.verdict!))
      .filter(n => isFinite(n) && n > spot * 0.8 && n < spot * 1.2)
      .sort((a, b) => a - b);
    return raw.filter((n, i) => i === 0 || n - raw[i - 1] > 10);
  };

  const supports = collect(v => v.supports)
    .filter(n => n <= spot)
    .sort((a, b) => b - a);
  const resistances = collect(v => v.resistances)
    .filter(n => n >= spot)
    .sort((a, b) => a - b);

  /**
   * Which charts named each surviving level.
   *
   * The dedupe above collapses 24,700 and 24,705 into one wall, which is right,
   * but it also throws away the single most useful fact about that wall: how
   * many independent reads produced it. Two charts agreeing is the strongest
   * evidence this system generates, and an OI wall carries different meaning
   * from a swing high. Recovering the provenance costs one pass.
   */
  const LEVEL_TOLERANCE = 10;
  const sourcesFor = (level: number, pick: (v: ChartVerdict) => number[]): LevelSource['sources'] =>
    charts
      .filter(c => pick(c.verdict!).some(n => Math.abs(n - level) <= LEVEL_TOLERANCE))
      .sort((a, b) => SLOT_BY_ID[b.slot].weight - SLOT_BY_ID[a.slot].weight)
      .map(c => SLOT_BY_ID[c.slot].short);

  const describeLevel = (
    level: number,
    kind: LevelSource['kind'],
    pick: (v: ChartVerdict) => number[]
  ): LevelSource => {
    const named = charts.filter(c => pick(c.verdict!).some(n => Math.abs(n - level) <= LEVEL_TOLERANCE));
    return {
      level: Math.round(level),
      kind,
      sources: sourcesFor(level, pick),
      weight: Math.round(named.reduce((sum, c) => sum + SLOT_BY_ID[c.slot].weight, 0) * 100) / 100,
      distance: Math.round(level - spot),
      stale:
        named.length > 0 &&
        named.every(c => SLOT_BY_ID[c.slot].freshnessCritical && isStale(c.uploadedAt, now))
    };
  };

  const levelSources: LevelSource[] = [
    ...resistances.slice(0, 4).map(l => describeLevel(l, 'RESISTANCE', v => v.resistances)),
    ...supports.slice(0, 4).map(l => describeLevel(l, 'SUPPORT', v => v.supports))
  ];

  /**
   * The protocol needs a zone price can actually reach inside a 50-minute
   * window, so a nearby level always beats a technically-valid distant one.
   * Only when nothing sits within reach do we fall back to the far level.
   */
  const INTRADAY_REACH = 400;
  const nearestReachable = (levels: number[]) =>
    levels.find(n => Math.abs(n - spot) <= INTRADAY_REACH) ?? levels[0];

  const fallbackRange = Math.max(
    60,
    Math.round(
      (latest && historyLog.length > 5
        ? Math.abs(latest.niftyLtp - historyLog[Math.min(historyLog.length - 1, 60)].niftyLtp) * 0.8
        : spot * 0.006) / 10
    ) * 10
  );

  let expectedSupport = Math.round(nearestReachable(supports) ?? spot - fallbackRange);
  let expectedResistance = Math.round(nearestReachable(resistances) ?? spot + fallbackRange);

  // Entry window: anchor the zone to today's measured range when it is supplied.
  // The session low is a real, tested support and the high a real resistance, so
  // on each side the wall that matters is the nearer of {chart level, range
  // extreme}: max(chart support, low) below price, min(chart resistance, high)
  // above it. rangePosition then says where price sits inside [low, high].
  const rangeHigh = params.rangeHigh;
  const rangeLow = params.rangeLow;
  const hasRange =
    typeof rangeHigh === 'number' && typeof rangeLow === 'number' &&
    isFinite(rangeHigh) && isFinite(rangeLow) && rangeHigh > rangeLow;
  let rangePosition: number | undefined;
  if (hasRange) {
    if (rangeLow! <= spot) expectedSupport = Math.round(Math.min(spot, Math.max(expectedSupport, rangeLow!)));
    if (rangeHigh! >= spot) expectedResistance = Math.round(Math.max(spot, Math.min(expectedResistance, rangeHigh!)));
    rangePosition = clamp(Math.round(((spot - rangeLow!) / (rangeHigh! - rangeLow!)) * 100), 0, 100);
  }
  const expectedRange = Math.max(1, expectedResistance - expectedSupport);

  // 4. Opening scenarios ------------------------------------------------------
  let flatProb = Math.max(5, 34 + Math.round((100 - Math.abs(combined)) / 6));
  let gapUpProb = Math.max(5, 33 + Math.round(combined / 3));
  let gapDownProb = Math.max(5, 33 - Math.round(combined / 3));
  const totalProb = flatProb + gapUpProb + gapDownProb;
  flatProb = Math.round((flatProb / totalProb) * 100);
  gapUpProb = Math.round((gapUpProb / totalProb) * 100);
  gapDownProb = 100 - flatProb - gapUpProb;

  // 5. Confidence & risk ------------------------------------------------------
  const avgModelConfidence = contributions.reduce((sum, c) => sum + c.confidence, 0) / (contributions.length || 1);
  const confidence = clamp(
    Math.round(
      30 + (coverage / CHART_SLOTS.length) * 25 + agreement * 0.2 + avgModelConfidence * 0.15 + (marketBias !== null ? 5 : 0)
    ),
    20,
    95
  );

  const unanimous = directional.length >= 2 && agreement === 100;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  let riskReason: string;
  if (directional.length >= 2 && agreement < 75) {
    riskLevel = 'HIGH';
    riskReason = `Charts disagree (only ${agreement}% aligned). Timeframes are pulling in opposite directions - let the first 15 minutes resolve it.`;
  } else if (Math.abs(combined) > 65 && !unanimous) {
    riskLevel = 'HIGH';
    riskReason = 'Strong one-sided positioning without full agreement. Gap risk and sharp reversals are both elevated.';
  } else if (coverage < 3) {
    riskLevel = 'MEDIUM';
    riskReason = `Only ${coverage} of ${CHART_SLOTS.length} charts usable. Add the missing ones for a fuller picture.`;
  } else if (Math.abs(combined) < 20) {
    riskLevel = 'LOW';
    riskReason = 'Positioning is balanced. A range-bound open between the OI walls is the base case.';
  } else if (unanimous && coverage >= 3) {
    riskLevel = 'LOW';
    riskReason = `All ${directional.length} readable charts point the same way. Cleanest setup available - respect the stop anyway.`;
  } else {
    riskLevel = 'MEDIUM';
    riskReason = 'Normal conditions with a clear but not extreme lean.';
  }

  // 6. The Office Protocol playbook -------------------------------------------
  const staleCharts = charts
    .filter(c => SLOT_BY_ID[c.slot].freshnessCritical && isStale(c.uploadedAt, now))
    .map(c => SLOT_BY_ID[c.slot].short);

  const playbook = buildSniperPlaybook({
    support: expectedSupport,
    resistance: expectedResistance,
    spot,
    sentimentStrength: combined,
    openSentiment,
    chartCoverage: coverage,
    totalCharts: CHART_SLOTS.length,
    agreement,
    confidence,
    staleCharts,
    missingCharts: CHART_SLOTS.filter(s => !charts.some(c => c.slot === s.id)).map(s => s.short),
    hasOiChart: charts.some(c => c.slot === 'OI_SNAPSHOT'),
    gapScenario: { flat: flatProb, gapUp: gapUpProb, gapDown: gapDownProb },
    levelReports: charts.map(c => ({
      source: SLOT_BY_ID[c.slot].short,
      supports: c.verdict!.supports,
      resistances: c.verdict!.resistances
    })),
    now: new Date(now)
  });

  const ce = playbook.plays.find(p => p.side === 'CE')!;
  const pe = playbook.plays.find(p => p.side === 'PE')!;

  // The plan is a zone play, never a breakout - this system buys AT support
  // and fades AT resistance, it does not chase closes through a level.
  const provisional = isProvisional(basis);

  // The Nifty50 read this phase was cut against, kept so each checkpoint can be
  // audited later against the market it actually saw.
  const num = (v: number | undefined | null): number | null =>
    typeof v === 'number' && isFinite(v) ? Math.round(v * 100) / 100 : null;
  const marketContext: MarketContext = {
    niftyLtp: num(latest?.niftyLtp) ?? (spotSource === 'LIVE' ? Math.round(spot) : null),
    ptsChg: num(latest?.ptsChg),
    pcr: num(latest?.pcr),
    optionsSent: num(latest?.optionsSent),
    stockSent: num(latest?.stockSent),
    adv: num(latest?.adv),
    dec: num(latest?.dec),
    snapshotTime: latest?.time ?? null,
    snapshots: historyLog.length
  };

  // A STAND ASIDE cut from last session's charts is a forecast, not a ruling.
  // Saying so prevents the day being written off at 07:00 on stale levels.
  const verdictLine = provisional
    ? `${playbook.verdictHeadline} (PROVISIONAL — ${BASIS_LABEL[basis]}) — ${playbook.verdictReason}`
    : `${playbook.verdictHeadline} — ${playbook.verdictReason}`;

  const tradePlan: string[] = [
    verdictLine,
    `Bounce: price into ${ce.triggerFrom}–${ce.triggerTo} → buy ${ce.optionLabel} (${SNIPER.itmPoints} ITM) → target ${ce.targetSpot}, stop ${ce.stopSpot}. [${ce.status}]`,
    `Fade: price into ${pe.triggerFrom}–${pe.triggerTo} → buy ${pe.optionLabel} (${SNIPER.itmPoints} ITM) → target ${pe.targetSpot}, stop ${pe.stopSpot}. [${pe.status}]`,
    `No entries after ${SNIPER.reviewBy}. Everything is flat at ${SNIPER.hardStop}, win or lose.`
  ];
  if (provisional) {
    tradePlan.splice(1, 0, BASIS_NOTE[basis]);
  }
  if (coverage < CHART_SLOTS.length) {
    const missing = CHART_SLOTS.filter(s => !charts.some(c => c.slot === s.id)).map(s => s.short);
    tradePlan.push(`Missing input: ${missing.join(', ')} - confidence stays capped until they are added.`);
  }

  const aiSummary = [
    `${openSentiment} open expected around ${Math.round(spot)} (${
      spotSource === 'LIVE' ? 'live LTP' : spotSource === 'MANUAL' ? 'manual close' : 'derived from charts'
    }).`,
    `Chart bias ${chartBias > 0 ? '+' : ''}${chartBias}% from ${coverage}/${CHART_SLOTS.length} charts at ${agreement}% agreement` +
      (marketBias !== null ? `, live market bias ${marketBias > 0 ? '+' : ''}${marketBias}%.` : '.'),
    `Working range ${expectedSupport} – ${expectedResistance} (${expectedRange} pts).`,
    '',
    ...contributions.map(c => `${c.emoji} ${c.short} · ${c.bias} ${c.confidence}% — ${c.summary}`)
  ].join('\n');

  const core: PhaseSnapshot = {
    schema: DECISION_SCHEMA,
    generatedAt: now,
    generatedAtStr: new Date(now).toLocaleString('en-IN', { hour12: false }),
    spot: Math.round(spot),
    spotSource,
    expectedRange,
    chartCoverage: coverage,
    chartBias,
    marketBias,
    agreement,
    contributions,
    openSentiment,
    sentimentStrength: combined,
    scenarios: {
      flat: { probability: flatProb, description: `Opens inside ${expectedSupport}–${expectedResistance}` },
      gapUp: { probability: gapUpProb, description: `Opens above ${Math.round(spot + expectedRange * 0.35)}` },
      gapDown: { probability: gapDownProb, description: `Opens below ${Math.round(spot - expectedRange * 0.35)}` }
    },
    confidence,
    supports: supports.slice(0, 4).map(Math.round),
    resistances: resistances.slice(0, 4).map(Math.round),
    expectedResistance,
    expectedSupport,
    rangeHigh: hasRange ? rangeHigh : undefined,
    rangeLow: hasRange ? rangeLow : undefined,
    rangePosition,
    primaryBias,
    biasStrength: Math.abs(combined),
    riskLevel,
    riskReason,
    tradePlan,
    aiSummary,
    playbook,
    staleCharts,
    basis,
    provisional,
    forced: params.forced ?? false,
    marketContext,
    levelSources,
    // A review belongs to the price it was written against, so it is only
    // carried forward when this cut is at the same price and checkpoint.
    aiReview:
      params.carryReview && params.carryReview.basis === basis && params.carryReview.spot === Math.round(spot)
        ? params.carryReview
        : undefined
  };

  return {
    ...core,
    // Each checkpoint keeps its own recalculated analysis. A later cut replaces
    // only its own phase, so the earlier reads stay inspectable.
    phases: { ...(params.phases || {}), [basis]: core },
    revalidations: [
      ...(params.revalidations || []),
      {
        basis,
        at: now,
        atStr: new Date(now).toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }),
        spot: Math.round(spot),
        verdict: playbook.verdictHeadline,
        zoneWidth: expectedRange
      }
    ].slice(-8)
  };
}

/**
 * Bring a decision saved before phase tracking existed up to the current shape.
 *
 * These decisions carry a matching schema number, so they restore cleanly - but
 * with no `phases` entry the phase board has nothing to render and silently
 * disappears. Rather than discard the plan (and the user's morning work), the
 * decision is treated as its own first phase, inferred from when it was cut.
 */
export function migrateDecision(saved: PreMarketDecision): PreMarketDecision {
  if (saved.basis && saved.phases && Object.keys(saved.phases).length > 0) return saved;

  const basis = saved.basis ?? basisFor(new Date(saved.generatedAt));
  const { phases: _phases, revalidations: _revalidations, ...rest } = saved;
  const core: PhaseSnapshot = {
    ...rest,
    basis,
    provisional: saved.provisional ?? isProvisional(basis),
    marketContext: saved.marketContext ?? {
      niftyLtp: null,
      ptsChg: null,
      pcr: null,
      optionsSent: null,
      stockSent: null,
      adv: null,
      dec: null,
      snapshotTime: null,
      snapshots: 0
    }
  };

  return {
    ...core,
    phases: { ...(saved.phases || {}), [basis]: core },
    revalidations:
      saved.revalidations && saved.revalidations.length
        ? saved.revalidations
        : [
            {
              basis,
              at: saved.generatedAt,
              atStr: new Date(saved.generatedAt).toLocaleTimeString('en-IN', {
                hour12: false,
                timeZone: 'Asia/Kolkata'
              }),
              spot: saved.spot,
              verdict: saved.playbook?.verdictHeadline ?? '',
              zoneWidth: saved.expectedRange
            }
          ]
  };
}


export const PreMarketAnalyzer: React.FC<{
  credentials: FyersCredentials;
  historyLog?: MarketSnapshot[];
  stocks?: EnrichedFyersQuote[];
  aiEnabled?: boolean;
}> = ({ credentials, historyLog = [], stocks = [], aiEnabled = true }) => {
  const [charts, setCharts] = useState<Partial<Record<ChartSlotId, ChartEntry>>>({});
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [analyzingSlots, setAnalyzingSlots] = useState<ChartSlotId[]>([]);
  const [preMarketDecision, setPreMarketDecision] = useState<PreMarketDecision | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  // Drives the staleness badges without needing a re-upload to refresh.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [manualSpot, setManualSpot] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  /**
   * Which checkpoint the whole screen is reading.
   *
   * Null follows the newest cut, which is what you want all morning. Selecting
   * a tab pins every board below - summary, ladder, playbook and all - to that
   * checkpoint, because comparing 09:10 against 09:15 is worthless if only the
   * tab strip changes and the analysis underneath stays on the latest read.
   */
  const [pinnedPhase, setPinnedPhase] = useState<DecisionBasis | null>(null);
  const [reviewingPhase, setReviewingPhase] = useState<DecisionBasis | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setLogs(p => [`[${time}] ${msg}`, ...p.slice(0, 49)]);
  };

  const aiLabel = getAIProviderLabel(credentials);
  const reviewReady = isAIConfigured(credentials) && aiEnabled;

  const visionProvider = resolveVisionProvider(credentials);
  const visionLabel = getVisionProviderLabel(credentials);
  const visionEngineName = visionProvider === 'ollama' ? 'Local Llama' : 'Gemini';
  const visionReady = isVisionConfigured(credentials) && aiEnabled;

  const liveLtp = historyLog[0]?.niftyLtp ?? null;
  // Charts the model actually managed to read - these drive every number below.
  const analyzedCharts = useMemo(
    () =>
      CHART_SLOTS.map(s => charts[s.id]).filter(
        (c): c is ChartEntry => !!c?.verdict && !isUnreadable(c.verdict!)
      ),
    [charts]
  );
  const coverage = analyzedCharts.length;

  // --- persistence ---------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const [images, meta, saved] = await Promise.all([
          imageStorageService.getAllImages(),
          imageStorageService.loadState<Record<string, Omit<ChartEntry, 'data'>>>(META_STATE_KEY),
          imageStorageService.loadState<PreMarketDecision>(DECISION_STATE_KEY)
        ]);

        const restored: Partial<Record<ChartSlotId, ChartEntry>> = {};
        for (const slot of CHART_SLOTS) {
          const data = images[IMAGE_KEY(slot.id)];
          if (!data) continue;
          const entryMeta = meta?.[slot.id];
          restored[slot.id] = {
            slot: slot.id,
            data,
            fileName: entryMeta?.fileName || `${slot.short}.png`,
            uploadedAt: entryMeta?.uploadedAt || Date.now(),
            analyzedAt: entryMeta?.analyzedAt,
            verdict: entryMeta?.verdict,
            error: entryMeta?.error
          };
        }

        if (Object.keys(restored).length > 0) {
          setCharts(restored);
          addLog(`💾 Restored ${Object.keys(restored).length} saved chart(s)`);
        }
        // A stored plan is only usable if it matches the current shape AND was
        // generated today - yesterday's zones are actively dangerous to trade.
        if (saved?.schema === DECISION_SCHEMA && saved.playbook) {
          if (istDateKey(saved.generatedAt) === istDateKey(Date.now())) {
            const migrated = migrateDecision(saved);
            setPreMarketDecision(migrated);
            if (migrated !== saved) {
              imageStorageService.saveState(DECISION_STATE_KEY, migrated).catch(() => {});
              addLog(`💾 Restored today's plan · recorded as phase "${BASIS_LABEL[migrated.basis!]}"`);
            }
          } else {
            imageStorageService.saveState(DECISION_STATE_KEY, null).catch(() => {});
            addLog('🗓️ Previous plan was from another day - discarded. Re-generate for today.');
          }
        } else if (saved) {
          imageStorageService.saveState(DECISION_STATE_KEY, null).catch(() => {});
          addLog('♻️ Stored plan was from an older version - discarded. Re-generate it.');
        }
      } catch (err: any) {
        console.error('Pre-market restore failed:', err);
      } finally {
        setMetaRestored(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chart metadata (verdicts, filenames, timestamps) is mirrored to IndexedDB
  // whenever it changes; the screenshots themselves are stored per slot.
  const [metaRestored, setMetaRestored] = useState(false);
  useEffect(() => {
    if (!metaRestored) return;
    const meta: Record<string, Omit<ChartEntry, 'data'>> = {};
    for (const [slot, entry] of Object.entries(charts)) {
      if (!entry) continue;
      const { data, ...rest } = entry;
      meta[slot] = rest;
    }
    imageStorageService.saveState(META_STATE_KEY, meta).catch(() => {});
  }, [charts, metaRestored]);

  const updateChart = (slot: ChartSlotId, patch: Partial<ChartEntry> | null) => {
    setCharts(prev => {
      const next = { ...prev };
      if (patch === null) {
        delete next[slot];
      } else {
        const existing = next[slot];
        next[slot] = { ...(existing as ChartEntry), ...patch, slot } as ChartEntry;
      }
      return next;
    });
  };

  // --- uploads -------------------------------------------------------------

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  /**
   * Upload and analysis are deliberately kept in separate phases.
   *
   * Reading a file is instant; a vision pass takes tens of seconds (far longer
   * on a local Ollama model). If the two are interleaved, selecting four charts
   * shows only the first one until its analysis finishes - the rest look like
   * they never uploaded. So every file is read and attached first, which paints
   * all four previews at once, and only then are they analyzed one at a time.
   */
  const ingestFiles = async (files: File[], forcedSlot?: ChartSlotId) => {
    if (files.length === 0) return;

    // A single slot can only hold one image, so a forced drop takes the first.
    const incoming = forcedSlot ? files.slice(0, 1) : files;
    const taken = CHART_SLOTS.filter(s => charts[s.id]).map(s => s.id);

    // Phase 1 - read everything in parallel, keeping the caller's file order so
    // that slot guessing stays deterministic.
    const loaded = await Promise.all(
      incoming.map(async file => {
        try {
          return { file, data: await readFile(file) };
        } catch (err: any) {
          addLog(`❌ Could not read ${file.name}: ${err?.message || err}`);
          return null;
        }
      })
    );

    // Phase 2 - attach every image, so all previews appear together.
    const queued: { slot: ChartSlotId; data: string }[] = [];
    const unrouted: PendingImage[] = [];

    for (const item of loaded) {
      if (!item) continue;
      const slot = forcedSlot ?? guessSlot(item.file.name, taken);
      if (slot) {
        taken.push(slot);
        await attachToSlot(slot, item.data, item.file.name);
        queued.push({ slot, data: item.data });
      } else {
        unrouted.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          data: item.data,
          fileName: item.file.name
        });
      }
    }

    if (unrouted.length > 0) {
      setPendingImages(prev => [...prev, ...unrouted]);
      addLog(`📎 ${unrouted.length} image${unrouted.length > 1 ? 's need' : ' needs'} a slot - pick one below`);
    }

    // Phase 3 - analyze serially. Vision endpoints (Ollama especially) degrade
    // badly under concurrent requests, so these are not run in parallel.
    for (const item of queued) {
      await analyzeSlot(item.slot, item.data);
    }
  };

  /** Attaches and persists an image. Analysis is the caller's responsibility. */
  const attachToSlot = async (slot: ChartSlotId, data: string, fileName: string) => {
    const config = SLOT_BY_ID[slot];
    updateChart(slot, { data, fileName, uploadedAt: Date.now(), verdict: undefined, analyzedAt: undefined, error: undefined });
    await imageStorageService.putImage(IMAGE_KEY(slot), data).catch(() => {});
    addLog(`${config.emoji} ${config.short} attached (${fileName})`);
  };

  const assignPending = async (pendingId: string, slot: ChartSlotId) => {
    const pending = pendingImages.find(p => p.id === pendingId);
    if (!pending) return;
    setPendingImages(prev => prev.filter(p => p.id !== pendingId));
    await attachToSlot(slot, pending.data, pending.fileName);
    await analyzeSlot(slot, pending.data);
  };

  const removeSlot = async (slot: ChartSlotId) => {
    updateChart(slot, null);
    await imageStorageService.deleteImage(IMAGE_KEY(slot)).catch(() => {});
    addLog(`🗑️ ${SLOT_BY_ID[slot].short} removed`);
  };

  // --- vision analysis -----------------------------------------------------

  const analyzeSlot = async (slot: ChartSlotId, imageData?: string) => {
    const config = SLOT_BY_ID[slot];
    const data = imageData ?? charts[slot]?.data;
    if (!data) return;

    if (!visionReady) {
      const message = aiEnabled
        ? 'No vision AI configured - add a Gemini key or select Ollama with a vision model in Settings'
        : 'AI is switched off in Settings';
      updateChart(slot, { error: message });
      addLog(`⚠️ ${message}`);
      return;
    }

    setAnalyzingSlots(prev => [...prev, slot]);
    updateChart(slot, { error: undefined });
    addLog(`🧠 Reading ${config.short} with ${visionEngineName}...`);

    try {
      const text = await callAIVision(credentials, config.prompt, [data], {
        maxTokens: 700,
        temperature: 0.2,
        jsonMode: true
      });

      const verdict = parseVerdict(text);
      updateChart(slot, { verdict, analyzedAt: Date.now(), error: undefined });
      if (isUnreadable(verdict)) {
        addLog(`⚠️ ${config.short}: the model could not read the screenshot - excluded from the decision`);
      } else {
        addLog(
          `✅ ${config.short}: ${verdict.bias} (${verdict.confidence}%)` +
            (verdict.structured ? '' : ' · unstructured reply, bias inferred')
        );
      }
    } catch (err: any) {
      const message = err?.message || String(err);
      updateChart(slot, { error: message });
      addLog(`❌ ${config.short} failed: ${message}`);
    } finally {
      setAnalyzingSlots(prev => prev.filter(s => s !== slot));
    }
  };

  const analyzeAllPending = async () => {
    for (const slot of CHART_SLOTS) {
      const entry = charts[slot.id];
      if (entry && !entry.verdict) await analyzeSlot(slot.id);
    }
  };

  // --- decision ------------------------------------------------------------

  const resolveSpot = useCallback(
    (preferLive = false): { spot: number; source: 'LIVE' | 'MANUAL' | 'CHARTS' } | null => {
      // Once the market is open the traded price beats anything typed in by
      // hand the night before, otherwise every re-cut stays pinned to a stale
      // manual close and the levels are never re-anchored.
      if (preferLive && liveLtp) return { spot: liveLtp, source: 'LIVE' };

      const manual = parseFloat(manualSpot.replace(/[,\s]/g, ''));
      if (isFinite(manual) && manual > 0) return { spot: manual, source: 'MANUAL' };
      if (liveLtp) return { spot: liveLtp, source: 'LIVE' };

      // Prefer a price the models actually read off the charts, newest timeframe
      // first - the median of support/resistance levels is a last resort.
      const priority: ChartSlotId[] = ['INTRADAY_1M', 'OI_SNAPSHOT', 'MULTI_OI', 'DAILY_1Y'];
      for (const slot of priority) {
        const read = analyzedCharts.find(c => c.slot === slot)?.verdict?.lastPrice;
        if (read && read > 1000) return { spot: Math.round(read), source: 'CHARTS' };
      }

      const levels = analyzedCharts.flatMap(c => [
        ...(c.verdict?.supports || []),
        ...(c.verdict?.resistances || [])
      ]);
      if (levels.length >= 2) {
        const sorted = [...levels].sort((a, b) => a - b);
        return { spot: Math.round(sorted[Math.floor(sorted.length / 2)]), source: 'CHARTS' };
      }
      return null;
    },
    [liveLtp, manualSpot, analyzedCharts]
  );

  const generatePreMarketDecision = async () => {
    if (coverage === 0) {
      addLog('❌ Analyze at least one readable chart before generating a decision');
      return;
    }

    const openNow = istMinutes() >= OPEN_MINS;
    const resolved = resolveSpot(openNow);
    if (!resolved) {
      addLog('❌ No spot price available - enter the previous close manually');
      return;
    }

    setIsGenerating(true);
    addLog('🧠 Building pre-market decision...');

    try {
      const basis = basisFor();
      const decision = buildDecision({
        charts: analyzedCharts,
        spot: resolved.spot,
        spotSource: resolved.source,
        historyLog,
        stocks,
        basis,
        // Earlier checkpoints stay on the record. They are timestamped and
        // labelled, so they remain a truthful account of what was known then.
        phases: preMarketDecision?.phases,
        revalidations: preMarketDecision?.revalidations
      });

      setPreMarketDecision(decision);
      imageStorageService.saveState(DECISION_STATE_KEY, decision).catch(() => {});
      addLog(`✅ Decision ready · ${decision.primaryBias} · confidence ${decision.confidence}%`);
      if (isProvisional(basis)) {
        addLog(`🕘 Provisional (${BASIS_LABEL[basis]}) — auto re-checks at 09:10 and 09:15 IST.`);
      }
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Recompute one phase on demand, against whatever the market is doing now.
   *
   * The checkpoints exist to schedule the *automatic* re-cuts; they should not
   * stop anyone re-running a phase to compare reads. A phase that is at least
   * as current as the plan on screen becomes the plan - anything else would
   * leave the headline frozen on a "STAND ASIDE" cut from last night's charts
   * while a later, better-informed read sits one tab away. Re-running an
   * *earlier* phase is a what-if by definition, so it is filed in its own slot
   * and the headline is left alone.
   */
  const runPhase = useCallback(
    (basis: DecisionBasis, overrideSpot?: number, rangeHigh?: number, rangeLow?: number) => {
      if (!preMarketDecision || coverage === 0) {
        addLog('❌ Generate a decision before recomputing a phase');
        return;
      }
      // A supplied price wins outright. The pre-open auction print and the
      // 09:15 open are the two numbers the feed is least likely to have, and
      // they are exactly the ones these phases are named after.
      const resolved =
        typeof overrideSpot === 'number' && isFinite(overrideSpot) && overrideSpot > 0
          ? { spot: overrideSpot, source: 'MANUAL' as const }
          : resolveSpot(true);
      if (!resolved) {
        addLog('❌ No spot price available - type the price for this phase');
        return;
      }
      try {
        const built = buildDecision({
          charts: analyzedCharts,
          spot: resolved.spot,
          spotSource: resolved.source,
          // High/Low only anchor the live Entry-window zone; ignore them elsewhere.
          rangeHigh: basis === 'INTRADAY' && typeof rangeHigh === 'number' && rangeHigh > 0 ? rangeHigh : undefined,
          rangeLow: basis === 'INTRADAY' && typeof rangeLow === 'number' && rangeLow > 0 ? rangeLow : undefined,
          historyLog,
          stocks,
          basis,
          forced: true,
          // Earlier cuts stay on the record whichever way this goes.
          phases: preMarketDecision.phases,
          revalidations: preMarketDecision.revalidations
        });
        const record = built.phases?.[basis];
        if (!record) return;

        const promote = basisRank(basis) >= basisRank(preMarketDecision.basis);
        const next: PreMarketDecision = promote
          ? built
          : {
              ...preMarketDecision,
              phases: { ...(preMarketDecision.phases || {}), [basis]: record }
            };
        setPreMarketDecision(next);
        imageStorageService.saveState(DECISION_STATE_KEY, next).catch(() => {});
        addLog(
          `🧪 Recomputed "${BASIS_LABEL[basis]}" at ${Math.round(resolved.spot)} (${resolved.source.toLowerCase()}) — ` +
            `${record.playbook.verdict} · ${record.expectedSupport}–${record.expectedResistance} (${record.expectedRange} pts)`
        );
        addLog(
          promote
            ? `⬆️ Plan updated to "${BASIS_LABEL[basis]}" — ${record.playbook.verdictHeadline}${
                record.provisional ? ' (still provisional)' : ''
              }`
            : `↩️ Kept as a what-if — the live plan is already on "${BASIS_LABEL[preMarketDecision.basis ?? 'CHARTS_ONLY']}".`
        );
      } catch (e: any) {
        addLog(`❌ Recompute failed: ${e.message}`);
      }
    },
    [preMarketDecision, coverage, resolveSpot, analyzedCharts, historyLog, stocks, addLog]
  );

  /**
   * The analyst pass for one checkpoint.
   *
   * The vision models read the charts once and that read is fixed. This is the
   * second, cheaper pass that re-reasons over that fixed evidence against the
   * price this checkpoint actually saw — which is the only thing that changed,
   * and the only thing that matters. It is strictly additive: every board
   * renders without it, and a failure is logged rather than thrown.
   */
  const decisionRef = useRef<PreMarketDecision | null>(null);
  decisionRef.current = preMarketDecision;

  const runReview = useCallback(
    async (basis: DecisionBasis, opts: { silent?: boolean } = {}) => {
      const decision = decisionRef.current;
      const snapshot = decision?.phases?.[basis];
      if (!decision || !snapshot) return;
      if (!reviewReady) {
        if (!opts.silent) addLog('❌ No text AI configured — add a key in Settings to run the analyst pass');
        return;
      }

      setReviewingPhase(basis);
      try {
        // Phase 1 is cut against the previous close by definition, so it is the
        // honest reference for "what is the gap" at every later checkpoint.
        const chartsOnlySpot = decision.phases?.CHARTS_ONLY?.spot ?? null;
        const previousClose =
          basis === 'CHARTS_ONLY' || chartsOnlySpot === snapshot.spot ? null : chartsOnlySpot;

        const input: ReviewInput = {
          basis,
          spot: snapshot.spot,
          spotSource: snapshot.spotSource,
          previousClose,
          supports: snapshot.supports,
          resistances: snapshot.resistances,
          expectedSupport: snapshot.expectedSupport,
          expectedResistance: snapshot.expectedResistance,
          chartBias: snapshot.chartBias,
          marketBias: snapshot.marketBias,
          agreement: snapshot.agreement,
          openSentiment: snapshot.openSentiment,
          riskLevel: snapshot.riskLevel,
          systemVerdict: snapshot.playbook.verdictHeadline,
          systemReason: snapshot.playbook.verdictReason,
          charts: analyzedCharts.map(c => ({
            short: SLOT_BY_ID[c.slot].short,
            weight: SLOT_BY_ID[c.slot].weight,
            bias: c.verdict!.bias,
            confidence: c.verdict!.confidence,
            summary: c.verdict!.summary,
            supports: c.verdict!.supports,
            resistances: c.verdict!.resistances,
            notes: c.verdict!.notes ?? [],
            stale: SLOT_BY_ID[c.slot].freshnessCritical && isStale(c.uploadedAt, Date.now())
          })),
          missingCharts: CHART_SLOTS.filter(s => !analyzedCharts.some(c => c.slot === s.id)).map(s => s.short),
          market: snapshot.marketContext ?? {
            niftyLtp: null, ptsChg: null, pcr: null, optionsSent: null,
            stockSent: null, adv: null, dec: null, snapshotTime: null, snapshots: 0
          }
        };

        const review = await requestPhaseReview(credentials, input, aiLabel);
        // The decision may have been re-cut while the model was thinking. Merge
        // into whatever is current, and only where the price still matches -
        // a review pinned to a price that no longer exists is worse than none.
        const latest = decisionRef.current;
        const target = latest?.phases?.[basis];
        if (!latest || !target || target.spot !== review.spot) {
          addLog(`⚠️ "${BASIS_LABEL[basis]}" moved while the analyst was writing — review discarded`);
          return;
        }

        const next: PreMarketDecision = {
          ...latest,
          phases: { ...(latest.phases || {}), [basis]: { ...target, aiReview: review, aiReviewError: undefined } },
          ...(latest.basis === basis ? { aiReview: review, aiReviewError: undefined } : {})
        };
        setPreMarketDecision(next);
        imageStorageService.saveState(DECISION_STATE_KEY, next).catch(() => {});
        addLog(
          `🤖 Analyst pass on "${BASIS_LABEL[basis]}" — ${review.stance.replace('_', ' ')} at ${review.conviction}% · ${review.headline}`
        );
      } catch (e: any) {
        const message = e?.message || 'unknown error';
        const latest = decisionRef.current;
        const target = latest?.phases?.[basis];
        if (latest && target) {
          const next: PreMarketDecision = {
            ...latest,
            phases: { ...(latest.phases || {}), [basis]: { ...target, aiReviewError: message } },
            ...(latest.basis === basis ? { aiReviewError: message } : {})
          };
          setPreMarketDecision(next);
        }
        addLog(`❌ Analyst pass failed on "${BASIS_LABEL[basis]}": ${message}`);
      } finally {
        setReviewingPhase(null);
      }
    },
    [reviewReady, credentials, aiLabel, analyzedCharts, addLog]
  );

  /**
   * Re-cut the decision when better information arrives.
   *
   * Without this the verdict is frozen at whatever the previous evening's
   * screenshots implied. That is how a day gets written off with "STAND ASIDE -
   * no trade today" over a 50-point zone: the zone was measured against
   * yesterday's close, and once price opens somewhere else the walls that
   * matter are different ones entirely.
   */
  const revalidateRef = useRef<{ run: () => void }>({ run: () => {} });
  const stalledBasisRef = useRef<DecisionBasis | null>(null);
  revalidateRef.current.run = () => {
    const decision = preMarketDecision;
    if (!decision || isGenerating || coverage === 0) return;

    const now = new Date();
    const checkpoint = dueRevalidation(decision.basis, now);
    const drifted = driftRevalidationDue(decision.spot, liveLtp, now);
    if (!checkpoint && !drifted) return;

    // A checkpoint re-cut needs the price that checkpoint is named after; a
    // drift re-cut is by definition about the live price. Without a live print
    // there is nothing new to learn, so stay provisional rather than burn the
    // checkpoint on the same stale number.
    const resolved = resolveSpot(true);
    if (!resolved || resolved.source !== 'LIVE') {
      // Say so once. Silently skipping is how a plan sits on "PROVISIONAL —
      // charts only" all morning with no hint that it is waiting for a feed
      // that never arrives.
      if (checkpoint && stalledBasisRef.current !== checkpoint) {
        stalledBasisRef.current = checkpoint;
        addLog(
          `⏳ "${BASIS_LABEL[checkpoint]}" is due but no live price has arrived — ` +
            'type the price into Session phases and Recompute to move the plan on.'
        );
      }
      return;
    }
    stalledBasisRef.current = null;

    const nextBasis: DecisionBasis = checkpoint ?? basisFor(now);
    try {
      const next = buildDecision({
        charts: analyzedCharts,
        spot: resolved.spot,
        spotSource: resolved.source,
        historyLog,
        stocks,
        basis: nextBasis,
        revalidations: decision.revalidations,
        phases: decision.phases
      });
      setPreMarketDecision(next);
      imageStorageService.saveState(DECISION_STATE_KEY, next).catch(() => {});

      const changed = next.playbook.verdictHeadline !== decision.playbook.verdictHeadline;
      addLog(
        `🔁 Re-cut on ${BASIS_LABEL[nextBasis]} at ${Math.round(resolved.spot)} — ${
          changed
            ? `verdict changed: ${decision.playbook.verdict} → ${next.playbook.verdict}`
            : `verdict unchanged (${next.playbook.verdict})`
        }`
      );
    } catch (e: any) {
      addLog(`❌ Re-cut failed: ${e.message}`);
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => revalidateRef.current.run(), 15_000);
    revalidateRef.current.run();
    return () => window.clearInterval(id);
  }, []);

  /**
   * Every checkpoint from the pre-open onwards earns its own analyst pass.
   *
   * Phase 1 is deliberately excluded from the automatic run: with nothing from
   * today to reason about, the model can only restate the charts, and the gap
   * branches already say it better. From the pre-open on there is a real price,
   * so there is something genuinely new to think about at each cut - which is
   * the whole reason the checkpoints exist.
   */
  const AUTO_REVIEW: DecisionBasis[] = ['PREOPEN', 'INTRADAY'];
  const reviewedCutRef = useRef<string | null>(null);
  useEffect(() => {
    const decision = preMarketDecision;
    if (!decision?.basis || !reviewReady) return;
    if (!AUTO_REVIEW.includes(decision.basis)) return;

    const snapshot = decision.phases?.[decision.basis];
    if (!snapshot || snapshot.aiReview || snapshot.aiReviewError) return;

    // One pass per distinct cut. Re-cutting at the same price is the same
    // question, and paying a model to answer it twice teaches us nothing.
    const key = `${decision.basis}:${snapshot.spot}`;
    if (reviewedCutRef.current === key || reviewingPhase) return;
    reviewedCutRef.current = key;
    runReview(decision.basis, { silent: true });
  }, [preMarketDecision, reviewReady, reviewingPhase, runReview]);

  const clearAll = async () => {
    for (const slot of CHART_SLOTS) {
      if (charts[slot.id]) await imageStorageService.deleteImage(IMAGE_KEY(slot.id)).catch(() => {});
    }
    setCharts({});
    setPendingImages([]);
    setPreMarketDecision(null);
    setPinnedPhase(null);
    reviewedCutRef.current = null;
    imageStorageService.saveState(DECISION_STATE_KEY, null).catch(() => {});
    setLogs([]);
    addLog('🔄 Workspace cleared');
  };

  // --- portability ---------------------------------------------------------

  /**
   * Writes the whole workspace out as one JSON envelope.
   *
   * With images it is a restore point (this browser or another one); without
   * them it is a compact record other systems can read - the verdicts, the
   * levels and every phase of the plan, minus a few megabytes of base64.
   */
  const exportSession = (includeImages: boolean) => {
    if (coverage === 0 && !preMarketDecision && Object.keys(charts).length === 0) {
      addLog('⚠️ Nothing to export yet - upload charts or generate a decision first');
      return;
    }
    try {
      const payload = buildPreMarketExport({ charts, decision: preMarketDecision, includeImages });
      const fileName = downloadPreMarketExport(payload);
      addLog(
        `⬇️ Exported ${payload.charts.length} chart(s)${payload.decision ? ' + plan' : ''}` +
          `${payload.includesImages ? ' with screenshots' : ' (data only)'} → ${fileName}`
      );
    } catch (err: any) {
      addLog(`❌ Export failed: ${err?.message || err}`);
    }
  };

  /**
   * Replaces the workspace with the contents of an exported file.
   *
   * Replace, not merge: a half-imported session where two charts are from the
   * file and two are from this morning would be cut into a single plan with no
   * way to tell which read came from where.
   */
  const importSession = async (file: File) => {
    addLog(`📥 Reading ${file.name}...`);
    let result;
    try {
      result = await readPreMarketExportFile(file);
    } catch (err: any) {
      addLog(`❌ Import failed: ${err?.message || err}`);
      return;
    }

    result.warnings.forEach(w => addLog(`⚠️ ${w}`));

    try {
      /**
       * A plan-only file restores the plan, not an empty workspace.
       *
       * The data-only export deliberately carries no screenshots, so treating
       * it as a full restore would delete this morning's four captures - an
       * irreversible loss triggered by a file the menu describes as "for other
       * systems". Images are only replaced when the file actually brings some.
       */
      const carriesImages = Object.keys(result.charts).length > 0;
      if (carriesImages) {
        for (const slot of CHART_SLOTS) {
          const entry = result.charts[slot.id];
          if (entry) await imageStorageService.putImage(IMAGE_KEY(slot.id), entry.data).catch(() => {});
          else await imageStorageService.deleteImage(IMAGE_KEY(slot.id)).catch(() => {});
        }
      }

      const decision = result.decision ? migrateDecision(result.decision) : null;
      if (carriesImages) {
        setCharts(result.charts);
        setPendingImages([]);
      }
      setPinnedPhase(null);
      reviewedCutRef.current = null;
      setPreMarketDecision(decision);
      await imageStorageService.saveState(DECISION_STATE_KEY, decision).catch(() => {});

      const analyzed = CHART_SLOTS.map(s => result.charts[s.id]).filter(
        c => c?.verdict && !isUnreadable(c.verdict)
      ).length;
      addLog(
        carriesImages
          ? `✅ Imported ${Object.keys(result.charts).length} chart(s) (${analyzed} analyzed)` +
              `${decision ? ' + plan' : ''} from session ${result.sessionDate}`
          : `✅ Imported the plan from session ${result.sessionDate}. The file carried no screenshots, so the current charts were left untouched.`
      );
      // The plan is restored as-is so it can be reviewed, but a plan cut on
      // another day must never be mistaken for today's zones.
      if (decision && istDateKey(decision.generatedAt) !== istDateKey(Date.now())) {
        addLog('🗓️ This plan was cut on another day - re-generate before trading it.');
      }
    } catch (err: any) {
      addLog(`❌ Import failed while restoring: ${err?.message || err}`);
    }
  };

  const copyToClipboard = (text?: string) => {
    if (typeof text === 'string') {
      navigator.clipboard.writeText(text);
      addLog('📋 Briefing copied to clipboard');
      return;
    }
    if (!preMarketDecision) return;
    navigator.clipboard.writeText(preMarketDecision.playbook.briefing + '\n\n---\n' + preMarketDecision.aiSummary);
    addLog('📋 Decision copied to clipboard');
  };

  // --- render --------------------------------------------------------------

  /**
   * Phase-first. The checkpoint strip leads, because "which read am I looking
   * at" governs the meaning of every number under it - and a board that
   * silently shows the newest cut while the strip says otherwise is how the
   * wrong zone gets traded. Everything below renders the *selected* phase.
   */
  const hasDecision = !!preMarketDecision;
  const hasUnanalyzed = CHART_SLOTS.some(s => charts[s.id] && !charts[s.id]?.verdict);

  const ORDER: DecisionBasis[] = ['CHARTS_ONLY', 'PREOPEN', 'INTRADAY'];
  const newestPhase = useMemo(() => {
    const cut = ORDER.filter(b => preMarketDecision?.phases?.[b]);
    return cut[cut.length - 1] ?? preMarketDecision?.basis ?? 'CHARTS_ONLY';
  }, [preMarketDecision]);
  const activeBasis: DecisionBasis = pinnedPhase ?? newestPhase;
  /**
   * The snapshot every board reads.
   *
   * Null when the selected tab has not been cut yet - the tab strip lets you
   * open a future checkpoint to run it early, and rendering the *head* plan
   * under a "Live open" heading it was never cut against is exactly the
   * mislabelling this board exists to prevent. A pre-phases plan restored from
   * an older build still falls back to the head, because for it the head is
   * the only read there is.
   */
  const view: PhaseSnapshot | null = !preMarketDecision
    ? null
    : preMarketDecision.phases?.[activeBasis] ??
      (preMarketDecision.phases && Object.keys(preMarketDecision.phases).length ? null : preMarketDecision);
  const viewingOlder = !!view && activeBasis !== newestPhase;

  const workspace = (
    <ChartWorkspace
      charts={charts}
      analyzingSlots={analyzingSlots}
      pendingImages={pendingImages}
      visionEngineName={visionEngineName}
      nowTick={nowTick}
      onFiles={(files, slot) => { ingestFiles(files, slot); }}
      onAssignPending={assignPending}
      onDiscardPending={id => setPendingImages(prev => prev.filter(p => p.id !== id))}
      onAnalyze={analyzeSlot}
      onRemove={removeSlot}
      onPreview={setPreviewImage}
    />
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-200 custom-scrollbar">
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <CommandBar
          visionReady={visionReady}
          visionLabel={visionLabel}
          charts={charts}
          analyzingSlots={analyzingSlots}
          coverage={coverage}
          liveLtp={liveLtp}
          manualSpot={manualSpot}
          onManualSpot={setManualSpot}
          onFiles={files => { ingestFiles(files); }}
          onAnalyzeRemaining={analyzeAllPending}
          hasUnanalyzed={hasUnanalyzed}
          onGenerate={generatePreMarketDecision}
          isGenerating={isGenerating}
          onCopy={() => copyToClipboard()}
          onExport={exportSession}
          onImport={importSession}
          onReset={clearAll}
          hasDecision={hasDecision}
          generatedAtStr={preMarketDecision?.generatedAtStr}
        />

        <div className="space-y-4">
          {hasDecision && preMarketDecision ? (
            <>
              <StepRail
                decision={preMarketDecision}
                active={activeBasis}
                onSelect={b => setPinnedPhase(b === newestPhase ? null : b)}
                onRunPhase={runPhase}
                running={isGenerating}
              />

              {!view ? (
                <p className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-[11px] text-slate-400">
                  <AlertCircle size={14} className="mt-px shrink-0" />
                  <span>
                    Step {activeBasis === 'PREOPEN' ? '2' : activeBasis === 'CHARTS_ONLY' ? '1' : '3'} has not been run
                    yet. Enter its price above and press Run, or{' '}
                    <button onClick={() => setPinnedPhase(null)} className="font-bold underline hover:text-white">
                      go back to {BASIS_LABEL[newestPhase]}
                    </button>
                    .
                  </span>
                </p>
              ) : (
                <>
                  {viewingOlder && (
                    <p className="flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2.5 text-[11px] text-violet-200">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>
                        You are reading the older <span className="font-bold">{BASIS_LABEL[activeBasis]}</span> call.{' '}
                        <button onClick={() => setPinnedPhase(null)} className="font-bold underline hover:text-white">
                          Jump to {BASIS_LABEL[newestPhase]}
                        </button>
                      </span>
                    </p>
                  )}

                  {view.staleCharts.length > 0 && (
                    <p className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-[11px] text-rose-200">
                      <AlertCircle size={14} className="mt-px shrink-0" />
                      <span>
                        <span className="font-bold">Stale input:</span> {view.staleCharts.join(', ')}. Re-capture and
                        re-run before trading this.
                      </span>
                    </p>
                  )}

                  <TheCall
                    view={view}
                    basis={activeBasis}
                    liveSpot={activeBasis === 'CHARTS_ONLY' ? null : liveLtp}
                    nowTick={nowTick}
                    onCopy={() => copyToClipboard()}
                  />

                  <ZoneStrip view={view} liveSpot={activeBasis === 'CHARTS_ONLY' ? null : liveLtp} />

                  <NextMoves
                    view={view}
                    basis={activeBasis}
                    review={view.aiReview}
                    reviewing={reviewingPhase === activeBasis}
                    reviewError={view.aiReviewError}
                    onRunReview={reviewReady ? () => { runReview(activeBasis); } : undefined}
                    aiLabel={aiLabel}
                  />

                  {/* Evidence. Correct, occasionally decisive, and never the
                      first thing you should read - so it opens on request. */}
                  <Drawer
                    title="Why — the full analysis"
                    note={`${view.chartCoverage} charts · ${view.agreement}% agreement · ${view.riskLevel} risk`}
                  >
                    {view.playbook && (
                      <VerdictBoard
                        playbook={view.playbook}
                        onCopy={copyToClipboard}
                        basis={view.basis}
                        provisional={view.provisional}
                        revalidations={preMarketDecision.revalidations}
                        review={view.aiReview}
                      />
                    )}
                    <KeyNumbers decision={view} />
                    <ForwardBoard
                      decision={view}
                      basis={activeBasis}
                      liveSpot={liveLtp}
                      previousClose={preMarketDecision.phases?.CHARTS_ONLY?.spot ?? null}
                      reviewing={reviewingPhase === activeBasis}
                    />
                    <EvidenceGrid decision={view} visionLabel={visionLabel} aiLabel={aiLabel} />
                    <PhaseBoard
                      decision={preMarketDecision}
                      active={activeBasis}
                      onSelect={b => setPinnedPhase(b === newestPhase ? null : b)}
                      onRunPhase={runPhase}
                      onRunReview={reviewReady ? b => { runReview(b); } : undefined}
                      reviewingPhase={reviewingPhase}
                      aiLabel={aiLabel}
                    />
                  </Drawer>
                </>
              )}

              <Drawer title="Charts" note={`${coverage}% captured`}>
                {workspace}
              </Drawer>
            </>
          ) : (
            <>
              <CaptureChecklist charts={charts} analyzingSlots={analyzingSlots} coverage={coverage} />
              {workspace}
            </>
          )}

          <ActivityLog logs={logs} />
        </div>
      </div>

      <PreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};


export default PreMarketAnalyzer;
