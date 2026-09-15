/**
 * Pre-Market Intelligence — portable JSON envelope.
 *
 * Everything the screen knows lives in IndexedDB on one browser: the four
 * screenshots, the per-chart verdicts and the phased decision. That is fine
 * until you want yesterday's read on another machine, a journal entry another
 * system can parse, or a way back after a cache wipe. This module is the
 * boundary for that: one self-describing envelope, written and read here only.
 *
 * Two rules shape the design:
 *
 * 1. An import must never poison the workspace. Anything from disk is treated
 *    as hostile - every field is re-validated and coerced, unknown slots are
 *    dropped, and a decision cut against a different `DECISION_SCHEMA` is
 *    refused rather than rendered against a UI that no longer matches it.
 * 2. A partial import beats a failed one. Problems are reported as warnings
 *    alongside whatever *was* usable; only a structurally unrecognisable file
 *    throws.
 */

import {
  CHART_SLOTS, ChartEntry, ChartSlotId, ChartVerdict, DECISION_SCHEMA, PreMarketDecision
} from '../components/premarket/model';

export const PREMARKET_EXPORT_KIND = 'fyers-nifty50.premarket';
/** Bumped when this envelope changes shape, independently of DECISION_SCHEMA. */
export const PREMARKET_EXPORT_VERSION = 1;

const VALID_SLOTS = new Set<string>(CHART_SLOTS.map(s => s.id));

/** One screenshot slot. `image` is absent in a data-only export. */
export interface PreMarketExportChart {
  slot: ChartSlotId;
  fileName: string;
  uploadedAt: number;
  uploadedAtStr: string;
  analyzedAt?: number;
  analyzedAtStr?: string;
  verdict?: ChartVerdict;
  error?: string;
  /** Base64 data URL of the screenshot. Omitted when images were excluded. */
  image?: string;
}

export interface PreMarketExport {
  kind: typeof PREMARKET_EXPORT_KIND;
  version: number;
  exportedAt: number;
  exportedAtStr: string;
  /** IST calendar day the session belongs to - the day its levels are valid for. */
  sessionDate: string;
  /** Shape of `decision`, so a consumer can reject a plan it cannot read. */
  decisionSchema: number;
  includesImages: boolean;
  charts: PreMarketExportChart[];
  decision: PreMarketDecision | null;
}

export interface PreMarketImportResult {
  charts: Partial<Record<ChartSlotId, ChartEntry>>;
  decision: PreMarketDecision | null;
  /** Non-fatal problems: dropped slots, a refused plan, missing images. */
  warnings: string[];
  sessionDate: string;
  exportedAt: number;
  includesImages: boolean;
}

// --- helpers ---------------------------------------------------------------

const IST = 'Asia/Kolkata';

export const istDateKey = (ts: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: IST, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(ts));

const istStamp = (ts: number) =>
  new Date(ts).toLocaleString('en-IN', { hour12: false, timeZone: IST });

const isDataUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^data:image\/[a-z.+-]+;base64,/i.test(value);

const finiteNumber = (value: unknown): number | null =>
  typeof value === 'number' && isFinite(value) ? value : null;

const cleanString = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const numberArray = (value: unknown): number[] =>
  (Array.isArray(value) ? value : [])
    .map(finiteNumber)
    .filter((n): n is number => n !== null && n > 0)
    .slice(0, 12);

const stringArray = (value: unknown, max: number): string[] =>
  (Array.isArray(value) ? value : [])
    .map(v => cleanString(v, 400))
    .filter(Boolean)
    .slice(0, max);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/**
 * The imported plan's walls, checked as real numbers before it is trusted.
 *
 * `finiteNumber` is strict on purpose: the global `isFinite` the engine uses
 * downstream coerces, so `"23600"` would pass there and then propagate into the
 * zone arithmetic and the strike calculation as a string.
 */
const hasTradableWalls = (playbook: any): boolean => {
  const support = finiteNumber(playbook?.plannedSupport);
  const resistance = finiteNumber(playbook?.plannedResistance);
  return support !== null && resistance !== null && support > 0 && resistance > support;
};

const normalizeBias = (value: unknown): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  const text = String(value ?? '').toUpperCase();
  return text === 'BULLISH' || text === 'BEARISH' ? text : 'NEUTRAL';
};

/**
 * A verdict from disk is rebuilt field by field rather than spread in - an
 * imported `confidence` of `"90%"` or a `supports` full of strings would sail
 * through the type system and only surface as NaN inside the zone maths.
 */
const sanitizeVerdict = (value: any): ChartVerdict | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const lastPrice = finiteNumber(value.lastPrice);
  return {
    bias: normalizeBias(value.bias),
    confidence: clamp(Math.round(finiteNumber(value.confidence) ?? 0), 0, 100),
    summary: cleanString(value.summary, 400) || 'No summary returned.',
    supports: numberArray(value.supports),
    resistances: numberArray(value.resistances),
    notes: stringArray(value.notes, 6),
    lastPrice: lastPrice !== null && lastPrice > 0 ? lastPrice : undefined,
    structured: value.structured !== false,
    raw: typeof value.raw === 'string' ? value.raw : ''
  };
};

// --- export ----------------------------------------------------------------

export function buildPreMarketExport(params: {
  charts: Partial<Record<ChartSlotId, ChartEntry>>;
  decision: PreMarketDecision | null;
  /** False produces a compact, shareable file with verdicts but no screenshots. */
  includeImages?: boolean;
  now?: number;
}): PreMarketExport {
  const includeImages = params.includeImages !== false;
  const now = params.now ?? Date.now();

  // Slot order, not insertion order, so two exports of the same session diff cleanly.
  const charts: PreMarketExportChart[] = CHART_SLOTS.map(slot => params.charts[slot.id])
    .filter((entry): entry is ChartEntry => !!entry)
    .map(entry => ({
      slot: entry.slot,
      fileName: entry.fileName,
      uploadedAt: entry.uploadedAt,
      uploadedAtStr: istStamp(entry.uploadedAt),
      ...(entry.analyzedAt ? { analyzedAt: entry.analyzedAt, analyzedAtStr: istStamp(entry.analyzedAt) } : {}),
      ...(entry.verdict ? { verdict: entry.verdict } : {}),
      ...(entry.error ? { error: entry.error } : {}),
      ...(includeImages && entry.data ? { image: entry.data } : {})
    }));

  // The session is the day the plan was cut for, falling back to the newest
  // screenshot, then to now - an empty export still has to name a day.
  const anchor =
    params.decision?.generatedAt ??
    charts.reduce((max, c) => Math.max(max, c.uploadedAt), 0) ??
    now;

  return {
    kind: PREMARKET_EXPORT_KIND,
    version: PREMARKET_EXPORT_VERSION,
    exportedAt: now,
    exportedAtStr: istStamp(now),
    sessionDate: istDateKey(anchor || now),
    decisionSchema: DECISION_SCHEMA,
    includesImages: includeImages && charts.some(c => !!c.image),
    charts,
    decision: params.decision ?? null
  };
}

export const serializePreMarketExport = (payload: PreMarketExport): string =>
  JSON.stringify(payload, null, 2);

export const preMarketExportFileName = (payload: PreMarketExport): string =>
  `premarket_${payload.sessionDate}${payload.includesImages ? '' : '_data'}.json`;

/** Browser-only: writes the envelope out as a download. */
export function downloadPreMarketExport(payload: PreMarketExport): string {
  const fileName = preMarketExportFileName(payload);
  const blob = new Blob([serializePreMarketExport(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoked late: Safari cancels the download if the object URL dies too soon.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return fileName;
}

// --- import ----------------------------------------------------------------

export function parsePreMarketExport(text: string): PreMarketImportResult {
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Not valid JSON - pick a file exported from Pre-Market Intelligence.');
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Unexpected JSON shape - expected a pre-market export object.');
  }
  if (raw.kind !== PREMARKET_EXPORT_KIND) {
    throw new Error(`Not a pre-market export (kind="${raw.kind ?? 'missing'}").`);
  }

  const warnings: string[] = [];
  const version = finiteNumber(raw.version) ?? 0;
  if (version > PREMARKET_EXPORT_VERSION) {
    warnings.push(
      `File was written by a newer build (v${version} > v${PREMARKET_EXPORT_VERSION}); unknown fields were ignored.`
    );
  }

  const charts: Partial<Record<ChartSlotId, ChartEntry>> = {};
  let missingImages = 0;

  for (const item of Array.isArray(raw.charts) ? raw.charts : []) {
    if (!item || typeof item !== 'object') continue;
    const slot = item.slot as ChartSlotId;
    if (!VALID_SLOTS.has(slot)) {
      warnings.push(`Skipped an unknown chart slot "${String(item.slot)}".`);
      continue;
    }
    if (charts[slot]) {
      warnings.push(`Duplicate entry for ${slot} - kept the first one.`);
      continue;
    }
    // A slot without its screenshot cannot be previewed or re-analyzed, so the
    // verdict alone is not enough to occupy the slot. Data-only exports are for
    // downstream consumers; they are not a restore point.
    if (!isDataUrl(item.image)) {
      missingImages++;
      continue;
    }

    const uploadedAt = finiteNumber(item.uploadedAt) ?? Date.now();
    const analyzedAt = finiteNumber(item.analyzedAt);
    charts[slot] = {
      slot,
      data: item.image,
      fileName: cleanString(item.fileName, 200) || `${slot}.png`,
      uploadedAt,
      ...(analyzedAt ? { analyzedAt } : {}),
      ...(sanitizeVerdict(item.verdict) ? { verdict: sanitizeVerdict(item.verdict) } : {}),
      ...(cleanString(item.error, 400) ? { error: cleanString(item.error, 400) } : {})
    };
  }

  if (missingImages > 0) {
    warnings.push(
      `${missingImages} chart(s) had no screenshot in this file (data-only export) and were skipped.`
    );
  }

  let decision: PreMarketDecision | null = null;
  const savedDecision = raw.decision;
  if (savedDecision && typeof savedDecision === 'object') {
    if (savedDecision.schema !== DECISION_SCHEMA) {
      warnings.push(
        `Saved plan uses schema v${savedDecision.schema ?? '?'} but this build reads v${DECISION_SCHEMA} - plan discarded, charts kept. Re-generate the decision.`
      );
    } else if (!savedDecision.playbook) {
      warnings.push('Saved plan had no playbook - plan discarded, charts kept.');
    } else if (!hasTradableWalls(savedDecision.playbook)) {
      /**
       * These two numbers are the only values in this file that reach live
       * money: the sniper reconciles `plannedSupport` / `plannedResistance`
       * against the opening range and arms a 250-ITM strike between them. A
       * hand-edited or truncated file must not be able to hand the engine a
       * string, a NaN or an inverted pair, which a bare type assertion would.
       */
      warnings.push(
        'Saved plan has unusable levels (support/resistance must be two ordered positive numbers) - plan discarded, charts kept.'
      );
    } else {
      decision = savedDecision as PreMarketDecision;
    }
  }

  if (!decision && Object.keys(charts).length === 0) {
    throw new Error('Nothing importable in this file - no screenshots and no usable plan.');
  }

  const exportedAt = finiteNumber(raw.exportedAt) ?? Date.now();
  return {
    charts,
    decision,
    warnings,
    sessionDate: cleanString(raw.sessionDate, 10) || istDateKey(exportedAt),
    exportedAt,
    includesImages: Object.keys(charts).length > 0
  };
}

export const readPreMarketExportFile = (file: File): Promise<PreMarketImportResult> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parsePreMarketExport(String(reader.result ?? '')));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
