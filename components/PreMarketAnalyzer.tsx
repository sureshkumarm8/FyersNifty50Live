import React, { useState, useEffect, useMemo } from 'react';
import { FyersCredentials, MarketSnapshot, EnrichedFyersQuote } from '../types';
import { imageStorageService } from '../services/imageStorage';
import { callAIVision, getVisionProviderLabel, isVisionConfigured, resolveVisionProvider } from '../services/aiProvider';
import { SNIPER, buildSniperPlaybook, resolvePhase, istMinutes, SniperPlaybook, ZonePlay } from '../services/sniperPlaybook';
import { AlertCircle } from 'lucide-react';
import {
  ActivityLog, CaptureChecklist, ChartWorkspace, CommandBar, EvidenceGrid, KeyNumbers,
  PreviewModal, ScenarioBoard, VerdictBoard
} from './premarket/PreMarketViews';

// ---------------------------------------------------------------------------
import {
  CHART_SLOTS, ChartContribution, ChartEntry, ChartSlotId, ChartVerdict, DECISION_SCHEMA,
  DECISION_STATE_KEY, IMAGE_KEY, META_STATE_KEY, PendingImage, PreMarketDecision, SLOT_BY_ID,
  SLOT_ICONS, STALE_AFTER_MS, SlotConfig, biasClasses, isStale, isUnreadable
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
  historyLog?: MarketSnapshot[];
  stocks?: EnrichedFyersQuote[];
  now?: number;
}): PreMarketDecision {
  const { charts, spot, spotSource } = params;
  const historyLog = params.historyLog || [];
  const stocks = params.stocks || [];
  const now = params.now ?? Date.now();
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

  const expectedSupport = Math.round(nearestReachable(supports) ?? spot - fallbackRange);
  const expectedResistance = Math.round(nearestReachable(resistances) ?? spot + fallbackRange);
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
  const tradePlan: string[] = [
    playbook.verdictHeadline + ' — ' + playbook.verdictReason,
    `Bounce: price into ${ce.triggerFrom}–${ce.triggerTo} → buy ${ce.optionLabel} (${SNIPER.itmPoints} ITM) → target ${ce.targetSpot}, stop ${ce.stopSpot}. [${ce.status}]`,
    `Fade: price into ${pe.triggerFrom}–${pe.triggerTo} → buy ${pe.optionLabel} (${SNIPER.itmPoints} ITM) → target ${pe.targetSpot}, stop ${pe.stopSpot}. [${pe.status}]`,
    `No entries after ${SNIPER.reviewBy}. Everything is flat at ${SNIPER.hardStop}, win or lose.`
  ];
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

  return {
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
    primaryBias,
    biasStrength: Math.abs(combined),
    riskLevel,
    riskReason,
    tradePlan,
    aiSummary,
    playbook,
    staleCharts
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

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setLogs(p => [`[${time}] ${msg}`, ...p.slice(0, 49)]);
  };

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
            setPreMarketDecision(saved);
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

  const resolveSpot = (): { spot: number; source: 'LIVE' | 'MANUAL' | 'CHARTS' } | null => {
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

    const levels = analyzedCharts.flatMap(c => [...(c.verdict?.supports || []), ...(c.verdict?.resistances || [])]);
    if (levels.length >= 2) {
      const sorted = [...levels].sort((a, b) => a - b);
      return { spot: Math.round(sorted[Math.floor(sorted.length / 2)]), source: 'CHARTS' };
    }
    return null;
  };

  const generatePreMarketDecision = async () => {
    if (coverage === 0) {
      addLog('❌ Analyze at least one readable chart before generating a decision');
      return;
    }

    const resolved = resolveSpot();
    if (!resolved) {
      addLog('❌ No spot price available - enter the previous close manually');
      return;
    }

    setIsGenerating(true);
    addLog('🧠 Building pre-market decision...');

    try {
      const decision = buildDecision({
        charts: analyzedCharts,
        spot: resolved.spot,
        spotSource: resolved.source,
        historyLog,
        stocks
      });

      setPreMarketDecision(decision);
      imageStorageService.saveState(DECISION_STATE_KEY, decision).catch(() => {});
      addLog(`✅ Decision ready · ${decision.primaryBias} · confidence ${decision.confidence}%`);
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = async () => {
    for (const slot of CHART_SLOTS) {
      if (charts[slot.id]) await imageStorageService.deleteImage(IMAGE_KEY(slot.id)).catch(() => {});
    }
    setCharts({});
    setPendingImages([]);
    setPreMarketDecision(null);
    imageStorageService.saveState(DECISION_STATE_KEY, null).catch(() => {});
    setLogs([]);
    addLog('🔄 Workspace cleared');
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
   * Decision-first. Once a plan exists it is the first thing on screen, with the
   * evidence beneath it and the screenshots - which are inputs, not output -
   * last. Before a plan exists that order inverts: the workspace comes first,
   * because uploading is the only thing left to do.
   */
  const hasDecision = !!preMarketDecision;
  const hasUnanalyzed = CHART_SLOTS.some(s => charts[s.id] && !charts[s.id]?.verdict);

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
          onReset={clearAll}
          hasDecision={hasDecision}
          generatedAtStr={preMarketDecision?.generatedAtStr}
        />

        <div className="space-y-4">
          {hasDecision && preMarketDecision ? (
            <>
              {preMarketDecision.playbook && (
                <VerdictBoard playbook={preMarketDecision.playbook} onCopy={copyToClipboard} />
              )}

              {preMarketDecision.staleCharts.length > 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-[11px] text-rose-200">
                  <AlertCircle size={14} className="mt-px shrink-0" />
                  <span>
                    <span className="font-bold">Stale input:</span> {preMarketDecision.staleCharts.join(', ')}. This plan
                    is built on a previous session&apos;s screenshot - re-capture and regenerate before trading it.
                  </span>
                </p>
              )}

              <KeyNumbers decision={preMarketDecision} />
              <ScenarioBoard playbook={preMarketDecision.playbook} />
              <EvidenceGrid decision={preMarketDecision} visionLabel={visionLabel} />
              {workspace}
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
