/**
 * Pre-Market Intelligence — presentational layer.
 *
 * Pure props-in / markup-out components. Two reasons they live apart from the
 * screen: the screen was a single ~1000-line render that no one could follow,
 * and every interesting state here (a generated verdict, an unreadable chart, a
 * stale screenshot) only appears after async work, which made it invisible to
 * tests. As pure components they can be rendered against fabricated states.
 *
 * The visual language is deliberately the same slate/emerald system as the
 * AutoTrade panels: one neutral surface, colour used only to carry meaning
 * (green = support/bullish, rose = resistance/bearish, amber = caution).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, BarChart2, Brain, CheckCircle2, ClipboardCopy, Clock, Copy, Crosshair,
  ChevronDown, Download, FileDown, FileJson, FileUp, GitCompareArrows, Image as ImageIcon, Loader2,
  RefreshCw, Shield, Sparkles, Target, Trash2, Upload, X, Zap
} from 'lucide-react';
import { GapScenario, SNIPER, SniperPlaybook, ZonePlay, istMinutes, phaseLabelOf, resolvePhase } from '../../services/sniperPlaybook';
import { BASIS_LABEL, BASIS_NOTE, DecisionBasis } from '../../services/premarketSchedule';
import { PhaseReview, ReviewLevelNote } from '../../services/premarketReview';
import { Card, Meter, Pill, Stat } from '../ui/panels';
import {
  CHART_SLOTS, ChartEntry, ChartSlotId, LevelSource, PendingImage, PhaseSnapshot, PreMarketDecision,
  SLOT_ICONS, STALE_AFTER_MS, SlotConfig, biasClasses, isStale, isUnreadable
} from './model';

const num = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');

export type SlotState = 'empty' | 'pending' | 'busy' | 'unreadable' | 'done';

export const slotState = (
  slot: SlotConfig,
  entry: ChartEntry | undefined,
  analyzing: ChartSlotId[]
): SlotState => {
  if (analyzing.includes(slot.id)) return 'busy';
  if (entry?.verdict) return isUnreadable(entry.verdict) ? 'unreadable' : 'done';
  return entry ? 'pending' : 'empty';
};

const STATE_TONE: Record<SlotState, string> = {
  done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  busy: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  unreadable: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  pending: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
  empty: 'bg-slate-900 text-slate-600 border-slate-800'
};

// ---------------------------------------------------------------------------
// Session transfer — the workspace as a portable JSON file.
// ---------------------------------------------------------------------------

/**
 * Export / import, folded into one menu.
 *
 * Three actions, not one button: a full export is a restore point (it carries
 * the base64 screenshots and can be worth megabytes), a data-only export is the
 * same envelope minus the images for downstream consumers, and import replaces
 * the workspace outright. Collapsing them into a single control would hide the
 * size/fidelity trade-off at exactly the moment it matters.
 */
const SessionTransfer: React.FC<{
  hasWorkspace: boolean;
  onExport: (includeImages: boolean) => void;
  onImport: (file: File) => void;
}> = ({ hasWorkspace, onExport, onImport }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Export or import this session as JSON"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:bg-slate-800"
      >
        <FileJson size={13} />
        <ChevronDown size={11} className={open ? 'rotate-180 transition' : 'transition'} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/40">
          <button
            disabled={!hasWorkspace}
            onClick={() => pick(() => onExport(true))}
            className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <FileDown size={13} className="mt-0.5 shrink-0 text-emerald-300" />
            <span>
              <span className="block text-xs font-semibold text-slate-100">Export full session</span>
              <span className="block text-[10px] text-slate-500">
                Screenshots, verdicts and every phase — re-importable anywhere.
              </span>
            </span>
          </button>

          <button
            disabled={!hasWorkspace}
            onClick={() => pick(() => onExport(false))}
            className="flex w-full items-start gap-2 border-t border-slate-800 px-3 py-2.5 text-left transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Download size={13} className="mt-0.5 shrink-0 text-sky-300" />
            <span>
              <span className="block text-xs font-semibold text-slate-100">Export data only</span>
              <span className="block text-[10px] text-slate-500">
                Same JSON without the images — small enough to feed other systems.
              </span>
            </span>
          </button>

          <label className="flex cursor-pointer items-start gap-2 border-t border-slate-800 px-3 py-2.5 transition hover:bg-slate-800">
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setOpen(false);
                // Import replaces the workspace, so a loaded session is never
                // silently overwritten by a file dropped on the wrong tab.
                if (
                  hasWorkspace &&
                  !window.confirm('Importing replaces the current charts and plan. Continue?')
                ) {
                  return;
                }
                onImport(file);
              }}
            />
            <FileUp size={13} className="mt-0.5 shrink-0 text-amber-300" />
            <span>
              <span className="block text-xs font-semibold text-slate-100">Import session JSON</span>
              <span className="block text-[10px] text-slate-500">
                Restores charts and the plan from an exported file.
              </span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Command bar — everything you can *do* on this screen, in one sticky strip.
// ---------------------------------------------------------------------------

export const CommandBar: React.FC<{
  visionReady: boolean;
  visionLabel: string;
  charts: Partial<Record<ChartSlotId, ChartEntry>>;
  analyzingSlots: ChartSlotId[];
  coverage: number;
  liveLtp: number | null;
  manualSpot: string;
  onManualSpot: (v: string) => void;
  onFiles: (files: File[]) => void;
  onAnalyzeRemaining: () => void;
  hasUnanalyzed: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
  onCopy: () => void;
  /** True exports the screenshots too, making the file a restore point. */
  onExport: (includeImages: boolean) => void;
  onImport: (file: File) => void;
  onReset: () => void;
  hasDecision: boolean;
  generatedAtStr?: string;
}> = ({
  visionReady, visionLabel, charts, analyzingSlots, coverage, liveLtp, manualSpot, onManualSpot,
  onFiles, onAnalyzeRemaining, hasUnanalyzed, onGenerate, isGenerating, onCopy, onExport, onImport,
  onReset, hasDecision, generatedAtStr
}) => {
  const pct = Math.round((coverage / CHART_SLOTS.length) * 100);
  const busy = analyzingSlots.length > 0;
  const hasWorkspace = hasDecision || CHART_SLOTS.some(s => !!charts[s.id]);

  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-100">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Pre-Market Intelligence
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            <span className={visionReady ? 'text-sky-300' : 'text-rose-300'}>
              {visionReady ? visionLabel : 'Vision AI not configured'}
            </span>
            {generatedAtStr && (
              <>
                <span className="text-slate-700">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} /> {generatedAtStr}
                </span>
              </>
            )}
          </p>
        </div>

        {/* coverage */}
        <div className="order-last w-full sm:order-none sm:ml-auto sm:w-auto">
          <div className="flex items-center gap-2">
            {CHART_SLOTS.map(slot => {
              const state = slotState(slot, charts[slot.id], analyzingSlots);
              return (
                <span
                  key={slot.id}
                  title={state === 'unreadable' ? 'The model could not read this screenshot' : slot.purpose}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold ${STATE_TONE[state]}`}
                >
                  {state === 'busy' ? <Loader2 size={10} className="animate-spin" /> : <span>{slot.emoji}</span>}
                  <span className="hidden sm:inline">{slot.short}</span>
                  {state === 'unreadable' && <AlertCircle size={9} />}
                </span>
              );
            })}
            <span className="ml-1 text-[11px] tabular-nums text-slate-500">{coverage}/4</span>
          </div>
          <div className="mt-1.5">
            <Meter value={pct} tone="bg-amber-400" height="h-1" />
          </div>
        </div>

        {/* spot */}
        <label className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {liveLtp ? 'Spot override' : 'Prev close'}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={manualSpot}
            onChange={e => onManualSpot(e.target.value)}
            placeholder={liveLtp ? `${liveLtp.toFixed(0)} live` : 'e.g. 24850'}
            title={
              liveLtp
                ? 'Live LTP is used unless you type a value here.'
                : 'The market is closed — levels are anchored to this price.'
            }
            className="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </label>

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2">
          <label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={async e => {
                onFiles(Array.from(e.target.files || []));
                e.target.value = '';
              }}
            />
            <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800">
              <Upload size={13} /> Charts
            </span>
          </label>

          {hasUnanalyzed && (
            <button
              onClick={onAnalyzeRemaining}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-40"
            >
              <Brain size={13} /> Analyze
            </button>
          )}

          <button
            onClick={onGenerate}
            disabled={isGenerating || coverage === 0}
            title={coverage === 0 ? 'Upload and analyze at least one chart first' : undefined}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
            {isGenerating ? 'Building…' : 'Generate decision'}
          </button>

          {hasDecision && (
            <button
              onClick={onCopy}
              title="Copy the full analysis"
              className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:bg-slate-800"
            >
              <Copy size={13} />
            </button>
          )}

          <SessionTransfer hasWorkspace={hasWorkspace} onExport={onExport} onImport={onImport} />

          <button
            onClick={onReset}
            title="Clear every chart and the saved plan"
            className="rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// The verdict — the only part of this screen that makes a decision.
// ---------------------------------------------------------------------------

/**
 * The analyst's own call, kept visually distinct from the mechanical verdict.
 *
 * It is shown *beside* our verdict, never in place of it. When the two agree
 * that is worth knowing; when they disagree that is worth knowing more.
 */
const STANCE_TONE: Record<'ACT' | 'WAIT' | 'STAND_ASIDE', string> = {
  ACT: 'bg-emerald-500/20 text-emerald-300',
  WAIT: 'bg-amber-500/20 text-amber-300',
  STAND_ASIDE: 'bg-slate-600/30 text-slate-300'
};

/**
 * Two different vocabularies for the same judgement. GO means "the setup is
 * there", ACT means "take it" — close enough to call agreement. A CAUTION
 * against an ACT is a real disagreement and must be surfaced, not smoothed.
 */
const agreesWithVerdict = (verdict: SniperPlaybook['verdict'], stance: PhaseReview['stance']): boolean =>
  (verdict === 'GO' && stance === 'ACT') ||
  (verdict === 'CAUTION' && stance === 'WAIT') ||
  (verdict === 'STAND_ASIDE' && stance === 'STAND_ASIDE');

const VERDICT_TONE = {
  GO: {
    wrap: 'border-emerald-500/40 bg-emerald-500/[0.07] shadow-[0_0_60px_-24px_rgba(16,185,129,0.9)]',
    text: 'text-emerald-300',
    chip: 'bg-emerald-500 text-emerald-950',
    Icon: CheckCircle2
  },
  CAUTION: {
    wrap: 'border-amber-500/40 bg-amber-500/[0.07]',
    text: 'text-amber-300',
    chip: 'bg-amber-500 text-amber-950',
    Icon: AlertCircle
  },
  STAND_ASIDE: {
    wrap: 'border-rose-500/40 bg-rose-500/[0.07]',
    text: 'text-rose-300',
    chip: 'bg-rose-500 text-white',
    Icon: Shield
  }
} as const;

export const PlayCard: React.FC<{ play: ZonePlay }> = ({ play }) => {
  const blocked = play.status === 'BLOCKED';
  const isCe = play.side === 'CE';
  const accent = blocked ? 'text-slate-500' : isCe ? 'text-emerald-300' : 'text-rose-300';
  const border = blocked ? 'border-slate-800' : isCe ? 'border-emerald-500/30' : 'border-rose-500/30';

  return (
    <div className={`rounded-xl border ${border} bg-slate-950/50 p-4 ${blocked ? 'opacity-50' : ''}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${accent}`}>
            {isCe ? 'Buy CALL at support' : 'Buy PUT at resistance'}
          </p>
          <p className="mt-0.5 font-mono text-xl font-black text-slate-100">{play.optionLabel}</p>
          <p className="text-[10px] text-slate-500">
            {play.itmPoints} pts ITM · {play.direction}
          </p>
        </div>
        <Pill tone={play.status === 'PRIMARY' ? 'info' : play.status === 'SECONDARY' ? 'muted' : 'muted'}>
          {play.status}
        </Pill>
      </div>

      <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Arm when spot enters</p>
        <p className="font-mono text-base font-bold text-slate-100">
          {num(play.triggerFrom)} – {num(play.triggerTo)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-800/40 py-1.5">
          <p className="text-[9px] uppercase text-slate-500">Zone</p>
          <p className="font-mono text-sm font-bold text-slate-200">{num(play.zone)}</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 py-1.5">
          <p className="text-[9px] uppercase text-slate-500">Target</p>
          <p className="font-mono text-sm font-bold text-emerald-300">{num(play.targetSpot)}</p>
        </div>
        <div className="rounded-lg bg-rose-500/10 py-1.5">
          <p className="text-[9px] uppercase text-slate-500">Stop</p>
          <p className="font-mono text-sm font-bold text-rose-300">{num(play.stopSpot)}</p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        Room to opposite wall <span className="font-semibold text-slate-300">{play.roomToOpposite} pts</span> · premium ≈
        +{play.approxPremiumTarget} / −{play.approxPremiumStop}
      </p>

      {(play.notes?.length ?? 0) > 0 && (
        <ul className="mt-2 space-y-1">
          {(play.notes ?? []).map((n, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] text-slate-400">
              <span className="shrink-0 text-slate-600">•</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Open scenarios — the heart of the plan.
//
// Nifty almost never opens on yesterday's close, and a 100-point gap can open
// beyond a mapped level, which flips that level's role and invalidates a plan
// written only for a flat open. So every open gets its own levels, its own
// position and its own clock, decided before the bell.
// ---------------------------------------------------------------------------

const LOCATION_COPY: Record<GapScenario['location'], { label: string; tone: string }> = {
  INSIDE_ZONE: { label: 'Mid-zone', tone: 'border-slate-700 bg-slate-800/40 text-slate-300' },
  AT_SUPPORT: { label: 'On support', tone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  AT_RESISTANCE: { label: 'On resistance', tone: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
  ABOVE_ALL_LEVELS: { label: 'Above all levels', tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  BELOW_ALL_LEVELS: { label: 'Below all levels', tone: 'border-amber-500/40 bg-amber-500/10 text-amber-300' }
};

const ScenarioClock: React.FC<{ steps: GapScenario['clock'] }> = ({ steps }) => (
  <ol className="space-y-2">
    {(steps ?? []).map(step => {
      const active = step.state === 'ACTIVE';
      return (
        <li key={step.time} className="flex gap-2.5">
          <span
            className={`w-24 shrink-0 font-mono text-[10px] font-bold ${
              active ? 'text-amber-300' : step.state === 'DONE' ? 'text-slate-700' : 'text-slate-500'
            }`}
          >
            {step.time}
          </span>
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold ${active ? 'text-slate-100' : 'text-slate-400'}`}>{step.title}</p>
            {(step.items ?? []).map((it, i) => (
              <p key={i} className={`text-[11px] leading-snug ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                {it}
              </p>
            ))}
          </div>
        </li>
      );
    })}
  </ol>
);

const ScenarioCard: React.FC<{ scenario: GapScenario; closePrice: number; open: boolean; onToggle: () => void }> = ({
  scenario: sc,
  closePrice,
  open,
  onToggle
}) => {
  const loc = LOCATION_COPY[sc.location] ?? LOCATION_COPY.INSIDE_ZONE;
  const armed = (sc.plays ?? []).filter(p => p.status !== 'BLOCKED');

  return (
    <div
      className={`overflow-hidden rounded-xl border transition ${
        sc.tradable ? 'border-slate-800 bg-slate-950/60' : 'border-slate-800/60 bg-slate-950/30'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-900/50"
      >
        <div className="w-32 shrink-0">
          <p className="text-xs font-bold text-slate-100">{sc.label}</p>
          <p className="font-mono text-[10px] text-slate-500">
            opens ≈ {num(sc.openPrice)}
            {sc.offset !== 0 && (
              <span className={sc.offset > 0 ? 'ml-1 text-emerald-400' : 'ml-1 text-rose-400'}>
                {sc.offset > 0 ? '+' : ''}
                {sc.offset}
              </span>
            )}
          </p>
        </div>

        {/* the numbers that actually change per scenario */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-mono text-[11px]">
            <span className="text-slate-600">S </span>
            <span className={sc.support !== null ? 'font-bold text-emerald-300' : 'text-slate-700'}>
              {sc.support !== null ? num(sc.support) : 'none'}
            </span>
          </span>
          <span className="font-mono text-[11px]">
            <span className="text-slate-600">R </span>
            <span className={sc.resistance !== null ? 'font-bold text-rose-300' : 'text-slate-700'}>
              {sc.resistance !== null ? num(sc.resistance) : 'none'}
            </span>
          </span>
          {sc.zoneWidth !== null && (
            <span className="font-mono text-[10px] text-slate-500">{sc.zoneWidth} pts</span>
          )}
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${loc.tone}`}>{loc.label}</span>
          {armed.length > 0 ? (
            <span className="font-mono text-[10px] font-bold text-sky-300">
              {armed.map(p => p.optionLabel).join(' / ')}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-600">NO TRADE</span>
          )}
        </div>

        <span className="shrink-0 font-mono text-[10px] text-slate-600">{sc.likelihood}%</span>
        <ChevronDown size={14} className={`shrink-0 text-slate-600 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-800 px-4 py-4">
          <p className="text-xs leading-relaxed text-slate-300">{sc.headline}</p>

          {(sc.plays?.length ?? 0) > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {sc.plays.map(p => (
                <PlayCard key={p.side + p.zone} play={p} />
              ))}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-300">Tear the plan up if…</p>
              <ul className="space-y-1.5">
                {(sc.invalidations ?? []).map((line, i) => (
                  <li key={i} className="flex gap-2 text-[11px] leading-snug text-slate-300">
                    <span className="shrink-0 text-rose-400">✕</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Today's clock — if it opens {num(sc.openPrice)}
              </p>
              <ScenarioClock steps={sc.clock} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * The forward look, matched to what the checkpoint actually knows.
 *
 * One board, three different questions:
 *
 *   1. CHARTS_ONLY  "where might it open?"   — five hypothetical branches
 *   2. PREOPEN      "the gap is X, so what?" — which walls the gap activates
 *   3. INTRADAY     "it opened, it moved."   — the real zone on today's range
 *
 * Showing branch 1 at the live checkpoint is the failure this replaces: five modelled
 * opens sitting next to a real price, four of them describing a market that
 * never happened, is an invitation to trade the wrong row.
 */
export const ForwardBoard: React.FC<{
  decision: PhaseSnapshot;
  basis: DecisionBasis;
  liveSpot?: number | null;
  previousClose?: number | null;
  reviewing?: boolean;
}> = ({ decision, basis, liveSpot, previousClose, reviewing }) => {
  if (basis === 'CHARTS_ONLY') {
    return <ScenarioBoard playbook={decision.playbook} basis={basis} />;
  }
  if (basis === 'PREOPEN') {
    return <PreOpenBoard decision={decision} previousClose={previousClose} reviewing={reviewing} />;
  }
  return <LiveZoneBoard decision={decision} basis={basis} liveSpot={liveSpot} reviewing={reviewing} />;
};

/** How a gap of this size changes what the day can be. */
const gapCharacter = (pts: number): { label: string; tone: string; meaning: string } => {
  const a = Math.abs(pts);
  if (a < 25)
    return {
      label: 'Flat open',
      tone: 'text-slate-300',
      meaning:
        'The gap is noise. Yesterday\'s levels survive intact and the chart read carries over unchanged — this is the cleanest case for a zone trade.'
    };
  if (a < 75)
    return {
      label: pts > 0 ? 'Mild gap up' : 'Mild gap down',
      tone: pts > 0 ? 'text-emerald-300' : 'text-rose-300',
      meaning:
        'A normal gap. The nearer wall on the gap side loses some meaning; the wall price is opening toward is the one to watch.'
    };
  if (a < 150)
    return {
      label: pts > 0 ? 'Gap up' : 'Gap down',
      tone: pts > 0 ? 'text-emerald-300' : 'text-rose-300',
      meaning:
        'A real gap. Levels behind price are now scenery. Expect the first move to either fill part of the gap or run — neither is a zone trade until it settles.'
    };
  return {
    label: pts > 0 ? 'Strong gap up' : 'Strong gap down',
    tone: pts > 0 ? 'text-emerald-200' : 'text-rose-200',
    meaning:
      'A gap this size rewrites the chart. Most of the levels the screenshots produced are now behind price and irrelevant. Treat the read as unproven until the first 10 minutes print.'
  };
};

/** Within this distance a level is reachable inside the 50-minute window. */
const IN_PLAY_PTS = 150;

const PreOpenBoard: React.FC<{
  decision: PhaseSnapshot;
  previousClose?: number | null;
  reviewing?: boolean;
}> = ({ decision, previousClose, reviewing }) => {
  const spot = decision.spot;
  const gap = previousClose && isFinite(previousClose) ? Math.round(spot - previousClose) : null;
  const character = gap === null ? null : gapCharacter(gap);
  const review = decision.aiReview;

  const levels = decision.levelSources ?? [];
  const inPlay = levels.filter(l => Math.abs(l.distance) <= IN_PLAY_PTS);
  const scenery = levels.filter(l => Math.abs(l.distance) > IN_PLAY_PTS);

  const zone = decision.expectedResistance - decision.expectedSupport;
  const toSupport = spot - decision.expectedSupport;
  const toResistance = decision.expectedResistance - spot;
  // Whichever wall the auction has parked price nearest is the side that can
  // actually arm inside the window; the far one is a spectator.
  const liveSide = toSupport <= toResistance ? 'SUPPORT' : 'RESISTANCE';

  return (
    <Card title="Pre-open read · what the gap changes" icon={<Crosshair size={15} className="text-amber-400" />}>
      <p className="-mt-1 mb-3 text-[11px] text-slate-500">
        The auction has indicated the open, so the guessing is over — but the range is not set. These are the levels
        that gap actually puts in play.
      </p>

      {/* ---- the gap ---- */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Indicative open</p>
            <p className="font-mono text-2xl font-black text-slate-100">{num(spot)}</p>
          </div>
          {gap !== null && character ? (
            <>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Gap</p>
                <p className={`font-mono text-2xl font-black ${character.tone}`}>
                  {gap > 0 ? '+' : ''}
                  {gap}
                </p>
                <p className="text-[10px] text-slate-500">vs {num(previousClose!)} close</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Character</p>
                <p className={`text-sm font-black ${character.tone}`}>{character.label}</p>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-slate-500">
              No previous close on record — cut the <span className="font-semibold text-slate-400">Charts only</span>{' '}
              phase first and the gap will be measured here.
            </p>
          )}
        </div>
        {character && <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">{character.meaning}</p>}
      </div>

      {/* ---- which levels the gap activated ---- */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.05] p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-sky-300">
            In play · within {IN_PLAY_PTS} pts
          </p>
          {inPlay.length ? (
            <div className="space-y-1.5">
              {inPlay.map(l => (
                <LevelRow key={`${l.kind}-${l.level}`} level={l} note={noteFor(review, l.level)} />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Nothing within reach of the indicative open. A 50-minute window cannot travel to any wall the charts
              named — that is a stand-aside, not a setup.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Now scenery · the gap moved past these
          </p>
          {scenery.length ? (
            <div className="space-y-1.5 opacity-60">
              {scenery.map(l => (
                <LevelRow key={`${l.kind}-${l.level}`} level={l} note={noteFor(review, l.level)} />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-600">Every level the charts named is still within reach.</p>
          )}
        </div>
      </div>

      {/* ---- the two actions ---- */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ActionCard
          kind="SUPPORT"
          live={liveSide === 'SUPPORT'}
          level={decision.expectedSupport}
          distance={toSupport}
          play={decision.playbook?.plays?.find(p => p.side === 'CE')}
        />
        <ActionCard
          kind="RESISTANCE"
          live={liveSide === 'RESISTANCE'}
          level={decision.expectedResistance}
          distance={toResistance}
          play={decision.playbook?.plays?.find(p => p.side === 'PE')}
        />
      </div>

      <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-300">Room {zone} pts.</span>{' '}
        {zone >= SNIPER.minZoneWidth
          ? `Wide enough for the ${SNIPER.targetPoints}-point target with the ${SNIPER.stopPoints}-point stop. Wait for the 09:15 print before committing — the auction indicates the open, it does not set the range.`
          : `Below the ${SNIPER.minZoneWidth}-point minimum, so neither side can pay for the trade as things stand. Re-cut at 09:15; the real open often opens the zone up.`}
      </p>

      <AnalystNotes review={review} reviewing={reviewing} />
    </Card>
  );
};

const LiveZoneBoard: React.FC<{
  decision: PhaseSnapshot;
  basis: DecisionBasis;
  liveSpot?: number | null;
  reviewing?: boolean;
}> = ({ decision, basis, liveSpot, reviewing }) => {
  const anchor = decision.spot;
  const review = decision.aiReview;
  const support = decision.expectedSupport;
  const resistance = decision.expectedResistance;
  const zone = resistance - support;

  // Where price sits between the walls, as a percentage. This is the single
  // most decision-relevant number after the open: at 8% you are at support
  // with the whole zone in front of you; at 50% there is no trade.
  const position = zone > 0 ? Math.min(100, Math.max(0, ((anchor - support) / zone) * 100)) : 50;
  const toSupport = Math.round(anchor - support);
  const toResistance = Math.round(resistance - anchor);
  const nearer = toSupport <= toResistance ? 'SUPPORT' : 'RESISTANCE';
  const drift = liveSpot && isFinite(liveSpot) ? Math.round(liveSpot - anchor) : null;

  const levels = decision.levelSources ?? [];
  const inPlay = levels.filter(l => Math.abs(l.distance) <= IN_PLAY_PTS);

  return (
    <Card
      title={'Live zone · real levels on today\'s range'}
      icon={<Crosshair size={15} className="text-emerald-400" />}
      right={
        drift !== null && Math.abs(drift) >= 5 ? (
          <Pill tone={Math.abs(drift) >= SPOT_DRIFT_HINT ? 'warn' : 'muted'}>
            live {num(liveSpot!)} · {drift > 0 ? '+' : ''}
            {drift} from this cut
          </Pill>
        ) : undefined
      }
    >
      <p className="-mt-1 mb-3 text-[11px] text-slate-500">
        The market is open. Every level below is measured against the live price and today&apos;s
        high/low — no modelled offsets, no branches.
      </p>

      {/* ---- position in the zone ---- */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">Support</p>
            <p className="font-mono text-xl font-black text-emerald-300">{num(support)}</p>
            <p className="text-[10px] text-slate-500">{toSupport} pts below</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Price</p>
            <p className="font-mono text-2xl font-black text-slate-100">{num(anchor)}</p>
            <p className="text-[10px] text-slate-500">{Math.round(position)}% up the zone</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-rose-400/70">Resistance</p>
            <p className="font-mono text-xl font-black text-rose-300">{num(resistance)}</p>
            <p className="text-[10px] text-slate-500">{toResistance} pts above</p>
          </div>
        </div>

        {/* the ladder as a bar - the whole read in one glance */}
        <div className="relative mt-3 h-2.5 w-full rounded-full bg-gradient-to-r from-emerald-500/30 via-slate-700 to-rose-500/30">
          <div
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-slate-100 shadow"
            style={{ left: `calc(${position}% - 2px)` }}
          />
          {/* the bands where a trade actually arms */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-full bg-emerald-500/40"
            style={{ width: `${zone > 0 ? Math.min(100, (SNIPER.zoneBuffer / zone) * 100) : 0}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 rounded-r-full bg-rose-500/40"
            style={{ width: `${zone > 0 ? Math.min(100, (SNIPER.zoneBuffer / zone) * 100) : 0}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-600">
          <span>buy zone · within {SNIPER.zoneBuffer} pts</span>
          <span className={zone >= SNIPER.minZoneWidth ? 'text-slate-400' : 'text-rose-400'}>
            {zone} pts of room
            {zone < SNIPER.minZoneWidth && ` · under the ${SNIPER.minZoneWidth}-pt minimum`}
          </span>
          <span>fade zone · within {SNIPER.zoneBuffer} pts</span>
        </div>

        <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
          {position <= 20
            ? `Price is sitting on support with ${toResistance} points of room above. This is the buy-the-zone case the system exists for.`
            : position >= 80
              ? `Price is pressed against resistance with ${toSupport} points of room below. This is the fade case.`
              : `Price is mid-zone — ${toSupport} pts from support, ${toResistance} pts from resistance. There is no trade from here; the system waits for a wall, it does not trade the middle.`}{' '}
          {nearer === 'SUPPORT'
            ? `Support is the nearer wall, so that is the level to watch first.`
            : `Resistance is the nearer wall, so that is the level to watch first.`}
        </p>
      </div>

      {/* ---- the two actions, now with real distances ---- */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <ActionCard
          kind="SUPPORT"
          live={position <= 50}
          level={support}
          distance={toSupport}
          play={decision.playbook?.plays?.find(p => p.side === 'CE')}
        />
        <ActionCard
          kind="RESISTANCE"
          live={position > 50}
          level={resistance}
          distance={toResistance}
          play={decision.playbook?.plays?.find(p => p.side === 'PE')}
        />
      </div>

      {/* ---- every level still within reach ---- */}
      {inPlay.length > 0 && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Everything within reach of {num(anchor)}
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {inPlay.map(l => (
              <LevelRow key={`${l.kind}-${l.level}`} level={l} note={noteFor(review, l.level)} />
            ))}
          </div>
        </div>
      )}

      <AnalystNotes review={review} reviewing={reviewing} />
    </Card>
  );
};

/** Beyond this the cut is far enough from live that it should be re-run. */
const SPOT_DRIFT_HINT = 40;

const noteFor = (review: PhaseReview | undefined, level: number): ReviewLevelNote | undefined =>
  review?.levelNotes.find(n => Math.abs(n.level - level) <= 15);

/** One level, with the evidence behind it. */
const LevelRow: React.FC<{ level: LevelSource; note?: ReviewLevelNote }> = ({ level, note }) => {
  const isSupport = level.kind === 'SUPPORT';
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 ${
        isSupport ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono text-sm font-bold ${isSupport ? 'text-emerald-300' : 'text-rose-300'}`}>
          {num(level.level)}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-slate-500">
          {level.distance > 0 ? '+' : ''}
          {level.distance} pts
        </span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1">
        {level.sources.map(s => (
          <span key={s} className="rounded bg-slate-800/80 px-1 py-px text-[9px] text-slate-400">
            {s}
          </span>
        ))}
        {level.sources.length > 1 && (
          <span className="rounded bg-sky-500/20 px-1 py-px text-[9px] font-bold text-sky-300">
            {level.sources.length}× confluence
          </span>
        )}
        {note?.strength === 'MAJOR' && (
          <span className="rounded bg-indigo-500/20 px-1 py-px text-[9px] font-bold text-indigo-300">MAJOR</span>
        )}
        {level.stale && (
          <span className="rounded bg-amber-500/15 px-1 py-px text-[9px] font-bold text-amber-400">STALE</span>
        )}
      </div>
      {note && <p className="mt-1 text-[10px] leading-snug text-slate-500">{note.note}</p>}
    </div>
  );
};

/** One side of the book: what arms here, and whether it can arm at all. */
const ActionCard: React.FC<{
  kind: 'SUPPORT' | 'RESISTANCE';
  live: boolean;
  level: number;
  distance: number;
  play?: ZonePlay;
}> = ({ kind, live, level, distance, play }) => {
  const isSupport = kind === 'SUPPORT';
  const blocked = play?.status === 'BLOCKED';
  return (
    <div
      className={`rounded-xl border p-3 ${
        blocked
          ? 'border-slate-800 bg-slate-950/40 opacity-60'
          : live
            ? isSupport
              ? 'border-emerald-500/40 bg-emerald-500/[0.07]'
              : 'border-rose-500/40 bg-rose-500/[0.07]'
            : 'border-slate-800 bg-slate-950/40 opacity-70'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-bold ${isSupport ? 'text-emerald-300' : 'text-rose-300'}`}>
          {isSupport ? 'Bounce · buy CE at support' : 'Fade · buy PE at resistance'}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider ${
            blocked ? 'bg-slate-700/50 text-slate-400' : live ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-500'
          }`}
        >
          {blocked ? 'BLOCKED' : live ? 'WATCH' : 'FAR SIDE'}
        </span>
      </div>
      <p className="mt-1.5 font-mono text-lg font-black text-slate-100">{num(level)}</p>
      <p className="text-[10px] text-slate-500">
        {Math.abs(Math.round(distance))} pts away
        {play && ` · arms ${num(play.triggerFrom)}–${num(play.triggerTo)}`}
      </p>
      {play && (
        <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
          {play.optionLabel} → target {num(play.targetSpot)}, stop {num(play.stopSpot)}.
        </p>
      )}
      {play?.notes?.[0] && <p className="mt-1 text-[10px] leading-snug text-slate-600">{play.notes[0]}</p>}
    </div>
  );
};

/** The analyst's steps and kill-switches, when a pass has been run. */
const AnalystNotes: React.FC<{ review?: PhaseReview; reviewing?: boolean }> = ({ review, reviewing }) => {
  if (reviewing && !review) {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] px-3 py-2 text-[11px] text-indigo-200">
        <Loader2 size={12} className="animate-spin" /> The analyst is re-reading the four charts against this price…
      </p>
    );
  }
  if (!review || (!review.playbook.length && !review.invalidators.length)) return null;

  return (
    <div className="mt-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.05] p-3">
      <div className="flex items-center gap-2">
        <Brain size={13} className="text-indigo-300" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          Analyst steps for this checkpoint
        </span>
      </div>
      {review.playbook.length > 0 && (
        <ol className="mt-2 space-y-1.5">
          {review.playbook.map((step, i) => (
            <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
              <span className="font-bold text-indigo-400">{i + 1}.</span>
              <span className="flex-1">{step}</span>
            </li>
          ))}
        </ol>
      )}
      {review.invalidators.length > 0 && (
        <div className="mt-2.5 border-t border-slate-800 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">Kills the plan</p>
          <ul className="mt-1 space-y-1">
            {review.invalidators.map((inv, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-snug text-slate-400">
                <span className="text-amber-500">·</span>
                <span className="flex-1">{inv}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * The five hypothetical opens. Checkpoint 1 only.
 *
 * These exist to answer "what do I do if it opens somewhere I have not seen
 * yet", which is a real question at 08:45 and a meaningless one at 09:16. Once
 * any price from today exists, ForwardBoard swaps this out: five modelled opens
 * sitting next to a real price, four of them describing a market that never
 * happened, is an invitation to trade the wrong row.
 */
export const ScenarioBoard: React.FC<{
  playbook?: SniperPlaybook;
  basis?: DecisionBasis;
}> = ({ playbook }) => {
  const scenarios = playbook?.scenarios ?? [];

  // The likeliest open is the one worth reading first, so it starts expanded.
  const [openId, setOpenId] = useState<string | null>(() => {
    if (scenarios.length === 0) return null;
    return scenarios.reduce((best, s) => (s.likelihood > best.likelihood ? s : best), scenarios[0]).id;
  });

  if (scenarios.length === 0) return null;
  const close = playbook?.closePrice ?? 0;

  return (
    <Card title="If Nifty opens…" icon={<GitCompareArrows size={15} className="text-sky-400" />}>
      <p className="mb-3 text-[11px] text-slate-500">
        Measured from the <span className="font-mono font-semibold text-slate-300">{num(close)}</span> close on your
        charts. Levels, position and clock are recalculated for each open. This board is replaced by a real read the
        moment the pre-open auction gives us a price from today.
      </p>
      <div className="space-y-2">
        {scenarios.map(sc => (
          <ScenarioCard
            key={sc.id}
            scenario={sc}
            closePrice={close}
            open={openId === sc.id}
            onToggle={() => setOpenId(openId === sc.id ? null : sc.id)}
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-snug text-slate-600">
        Percentages split the blended gap read across the five opens; they are a prior, not a forecast. Confirm the
        real open at 09:15 and use only that row.
      </p>
    </Card>
  );
};

/**
 * What each checkpoint wants typed in before it runs.
 *
 * The pre-open auction print and the 09:15 open are the two prices a live feed
 * most often misses or smooths over, and they are precisely the numbers those
 * phases are supposed to be anchored to. Typing one in is the normal path, not
 * an override.
 */
const PHASE_INPUT: Record<DecisionBasis, { label: string; placeholder: string; hint: string }> = {
  CHARTS_ONLY: {
    label: 'Previous close',
    placeholder: 'e.g. 24,000',
    hint: 'Blank uses the last price your charts reported.'
  },
  PREOPEN: {
    label: 'Pre-open indicative price',
    placeholder: 'from the 09:08 auction',
    hint: 'The call-auction print at 09:08-09:14. Blank uses the live feed, which may not carry it.'
  },
  INTRADAY: {
    label: 'Price to test',
    placeholder: 'live price',
    hint: 'Blank uses the live feed. Add today\'s high and low so the zones sit on the real range.'
  }
};

/**
 * Every checkpoint the decision was re-cut at, each as its own tab.
 *
 * The point is comparison: the same screenshots re-read against a different
 * Nifty50 price produce different walls, and seeing 09:10 next to 09:15 is what
 * makes an early "no trade today" verdict falsifiable rather than final.
 */
export const PhaseBoard: React.FC<{
  decision: PreMarketDecision;
  /** The checkpoint the whole screen is reading. */
  active: DecisionBasis;
  onSelect: (basis: DecisionBasis) => void;
  /** Recompute a phase now, ignoring its normal window. */
  onRunPhase?: (basis: DecisionBasis, overrideSpot?: number, rangeHigh?: number, rangeLow?: number) => void;
  /** Re-run the analyst pass for a phase. Absent when no text AI is configured. */
  onRunReview?: (basis: DecisionBasis) => void;
  reviewingPhase?: DecisionBasis | null;
  aiLabel?: string;
}> = ({ decision, active, onSelect, onRunPhase, onRunReview, reviewingPhase, aiLabel }) => {
  const ORDER: DecisionBasis[] = ['CHARTS_ONLY', 'PREOPEN', 'INTRADAY'];
  const captured = ORDER.filter(b => decision.phases?.[b]);
  const [spotInput, setSpotInput] = useState('');
  const [highInput, setHighInput] = useState('');
  const [lowInput, setLowInput] = useState('');
  const clearInputs = () => { setSpotInput(''); setHighInput(''); setLowInput(''); };
  const parsePrice = (raw: string) => {
    const n = parseFloat(raw.replace(/[,\s]/g, ''));
    return isFinite(n) && n > 0 ? n : undefined;
  };

  const current = active;
  if (!captured.length && !onRunPhase) return null;

  const phase = decision.phases?.[current];
  const capturedBefore = captured.filter(b => ORDER.indexOf(b) < ORDER.indexOf(current));
  const prevBasis = capturedBefore[capturedBefore.length - 1];
  const prev = prevBasis ? decision.phases?.[prevBasis] : undefined;
  const tone = VERDICT_TONE[phase?.playbook?.verdict as keyof typeof VERDICT_TONE] ?? VERDICT_TONE.CAUTION;

  const zone = phase ? phase.expectedResistance - phase.expectedSupport : 0;
  const prevZone = prev ? prev.expectedResistance - prev.expectedSupport : null;
  const mc = phase?.marketContext;
  const busy = reviewingPhase === current;

  const delta = (now: number, before: number | null | undefined) => {
    if (before == null || !isFinite(before)) return null;
    const d = Math.round(now - before);
    if (d === 0) return <span className="text-slate-600">no change</span>;
    return (
      <span className={d > 0 ? 'text-emerald-400' : 'text-rose-400'}>
        {d > 0 ? '+' : ''}
        {d}
      </span>
    );
  };

  return (
    <Card title="Session phases" icon={<GitCompareArrows size={15} />}>
      <p className="-mt-1 mb-3 text-[11px] text-slate-500">
        The same charts, re-read at each checkpoint against the live market. The tab you pick drives every board on
        this screen.
      </p>
      {/* ---- tabs ---- */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {ORDER.map((b, i) => {
          const has = !!decision.phases?.[b];
          const isActive = b === current;
          const p = decision.phases?.[b];
          return (
            <button
              key={b}
              onClick={() => {
                // A price typed for the pre-open must never be carried into
                // another phase by an accidental tab switch.
                onSelect(b);
                clearInputs();
              }}
              title={BASIS_NOTE[b]}
              className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${
                isActive
                  ? 'border-sky-500/60 bg-sky-500/15 text-sky-200'
                  : has
                    ? 'border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    : 'border-slate-800 bg-slate-900/30 text-slate-600 hover:bg-slate-800/50'
              }`}
            >
              <span className="block font-semibold">
                <span className="mr-1 opacity-50">{i + 1}.</span>
                {BASIS_LABEL[b]}
                {p?.forced && <span className="ml-1 text-[9px] font-black text-violet-300">TEST</span>}
              </span>
              <span className="block font-mono text-[10px] opacity-70">
                {p
                  ? `${new Date(p.generatedAt).toLocaleTimeString('en-IN', {
                      hour12: false,
                      timeZone: 'Asia/Kolkata'
                    }).slice(0, 5)} · ${num(p.spot)}`
                  : 'not cut yet'}
                {p?.aiReview && <span className="ml-1 text-[9px] text-indigo-300">🤖</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- run control ---- */}
      {onRunPhase && (
        <div className="mb-3 rounded-lg border border-violet-500/25 bg-violet-500/[0.06] px-3 py-2.5">
          <p className="text-[11px] text-slate-400">
            {phase
              ? `Re-read the charts as "${BASIS_LABEL[current]}" against a price you supply.`
              : 'This phase runs automatically in its window. Supply its price to run it now.'}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="min-w-[190px] flex-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">
                {PHASE_INPUT[current].label}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={spotInput}
                onChange={e => setSpotInput(e.target.value)}
                placeholder={PHASE_INPUT[current].placeholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 font-mono text-sm text-slate-100 outline-none transition placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-600 focus:border-violet-500/60"
              />
            </label>
            {current === 'INTRADAY' && (
              <>
                <label className="w-24">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">Day high</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={highInput}
                    onChange={e => setHighInput(e.target.value)}
                    placeholder={phase?.rangeHigh ? num(phase.rangeHigh) : 'high'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 font-mono text-sm text-slate-100 outline-none transition placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-600 focus:border-violet-500/60"
                  />
                </label>
                <label className="w-24">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">Day low</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={lowInput}
                    onChange={e => setLowInput(e.target.value)}
                    placeholder={phase?.rangeLow ? num(phase.rangeLow) : 'low'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-1.5 font-mono text-sm text-slate-100 outline-none transition placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-600 focus:border-violet-500/60"
                  />
                </label>
              </>
            )}
            <button
              onClick={() => {
                onRunPhase(
                  current,
                  parsePrice(spotInput),
                  current === 'INTRADAY' ? parsePrice(highInput) : undefined,
                  current === 'INTRADAY' ? parsePrice(lowInput) : undefined
                );
                clearInputs();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/25"
            >
              <RefreshCw size={12} />
              {phase ? 'Recompute' : 'Run now'}
            </button>
            {onRunReview && phase && (
              <button
                onClick={() => onRunReview(current)}
                disabled={busy}
                title={aiLabel ? `Re-read the four charts with ${aiLabel} against this phase's price` : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-[11px] font-semibold text-indigo-200 transition hover:bg-indigo-500/25 disabled:opacity-50"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                {busy ? 'Analysing…' : phase.aiReview ? 'Re-run AI analysis' : 'Run AI analysis'}
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{PHASE_INPUT[current].hint}</p>
        </div>
      )}

      {!phase ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-300">{BASIS_LABEL[current]} not cut yet</p>
          <p className="mx-auto mt-1 max-w-md text-[11px] leading-snug text-slate-500">{BASIS_NOTE[current]}</p>
        </div>
      ) : (
      <>
      {/* ---- verdict for this phase ---- */}
      <div className={`rounded-xl border p-3 ${tone.wrap}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <tone.Icon className={`h-4 w-4 ${tone.text}`} />
            <span className={`text-sm font-black ${tone.text}`}>{phase.playbook?.verdictHeadline}</span>
          </div>
          <div className="flex items-center gap-2">
            {phase.provisional && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-300">
                PROVISIONAL
              </span>
            )}
            <span className="font-mono text-[10px] text-slate-500">{phase.generatedAtStr}</span>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">{phase.playbook?.verdictReason}</p>
      </div>

      {/* ---- the analyst's read of this checkpoint ---- */}
      {phase.aiReview ? (
        <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.07] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-indigo-300" />
              <span className="text-[11px] font-bold text-indigo-200">Analyst pass</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider ${STANCE_TONE[phase.aiReview.stance]}`}>
                {phase.aiReview.stance.replace('_', ' ')}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {phase.aiReview.conviction}% conviction · {phase.aiReview.atStr.slice(0, 5)} · @{num(phase.aiReview.spot)}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-200">{phase.aiReview.headline}</p>
          {phase.aiReview.expectation && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{phase.aiReview.expectation}</p>
          )}
        </div>
      ) : phase.aiReviewError ? (
        <p className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-[11px] text-amber-400/80">
          Analyst pass unavailable — {phase.aiReviewError}. The mechanical read above stands on its own.
        </p>
      ) : busy ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] px-3 py-2 text-[11px] text-indigo-200">
          <Loader2 size={12} className="animate-spin" /> Re-reading the four charts against {num(phase.spot)}…
        </p>
      ) : null}

      {/* ---- Nifty50 at this checkpoint ---- */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Nifty 50 at this checkpoint
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Anchor" value={num(phase.spot)} sub={phase.spotSource.toLowerCase()} />
          <Stat
            label="Last snapshot"
            value={mc?.niftyLtp != null ? num(mc.niftyLtp) : '—'}
            sub={mc?.snapshotTime ? mc.snapshotTime.slice(0, 5) : 'no feed'}
          />
          <Stat
            label="Pts change"
            value={mc?.ptsChg != null ? (mc.ptsChg > 0 ? `+${mc.ptsChg}` : `${mc.ptsChg}`) : '—'}
          />
          <Stat label="PCR" value={mc?.pcr != null ? mc.pcr.toFixed(2) : '—'} />
          <Stat
            label="Adv / Dec"
            value={mc?.adv != null && mc?.dec != null ? `${mc.adv} / ${mc.dec}` : '—'}
          />
          <Stat
            label="Option flow"
            value={mc?.optionsSent != null ? `${mc.optionsSent > 0 ? '+' : ''}${mc.optionsSent.toFixed(1)}%` : '—'}
          />
          <Stat
            label="Stock flow"
            value={mc?.stockSent != null ? `${mc.stockSent > 0 ? '+' : ''}${mc.stockSent.toFixed(1)}%` : '—'}
          />
          <Stat label="Snapshots" value={mc?.snapshots != null ? String(mc.snapshots) : '—'} />
        </div>
        {(!mc || mc.snapshots === 0) && (
          <p className="mt-2 text-[10px] text-amber-400/80">
            No live snapshots had arrived when this phase was cut — the read is chart-derived only.
          </p>
        )}
      </div>

      {/* ---- recalculated zones ---- */}
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Support &amp; resistance, recalculated
        </p>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">Support</p>
              <p className="font-mono text-xl font-black text-emerald-300">{num(phase.expectedSupport)}</p>
              {prev && <p className="text-[10px] text-slate-500">{delta(phase.expectedSupport, prev.expectedSupport)}</p>}
            </div>
            <div className="flex-1 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Room</p>
              <p
                className={`font-mono text-lg font-black ${
                  zone >= SNIPER.minZoneWidth ? 'text-slate-200' : 'text-rose-300'
                }`}
              >
                {zone} pts
              </p>
              <p className="text-[10px] text-slate-500">
                {zone >= SNIPER.minZoneWidth
                  ? `${SNIPER.targetPoints}-pt target fits`
                  : `below the ${SNIPER.minZoneWidth}-pt minimum`}
                {prevZone != null && <> · {delta(zone, prevZone)}</>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-rose-400/70">Resistance</p>
              <p className="font-mono text-xl font-black text-rose-300">{num(phase.expectedResistance)}</p>
              {prev && (
                <p className="text-[10px] text-slate-500">{delta(phase.expectedResistance, prev.expectedResistance)}</p>
              )}
            </div>
          </div>

          {(phase.supports?.length > 0 || phase.resistances?.length > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-800 pt-2.5">
              <div>
                <p className="text-[10px] text-slate-500">All supports</p>
                <p className="font-mono text-[11px] text-emerald-300/90">
                  {phase.supports?.length ? phase.supports.map(n => num(n)).join(' · ') : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">All resistances</p>
                <p className="font-mono text-[11px] text-rose-300/90">
                  {phase.resistances?.length ? phase.resistances.map(n => num(n)).join(' · ') : '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- what changed ---- */}
      {prev && prevBasis && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Versus {BASIS_LABEL[prevBasis]}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Anchor {num(prev.spot)} → {num(phase.spot)} ({delta(phase.spot, prev.spot)} pts). Zone {prevZone} → {zone}{' '}
            pts.{' '}
            {prev.playbook?.verdict !== phase.playbook?.verdict ? (
              <span className="font-semibold text-sky-300">
                Verdict changed: {prev.playbook?.verdict?.replace('_', ' ')} →{' '}
                {phase.playbook?.verdict?.replace('_', ' ')}.
              </span>
            ) : (
              <span className="text-slate-500">Verdict unchanged ({phase.playbook?.verdict?.replace('_', ' ')}).</span>
            )}
          </p>
        </div>
      )}

      <p className="mt-3 text-[10px] leading-snug text-slate-600">
        {BASIS_NOTE[current]}
        {phase.forced && (
          <span className="text-violet-300/80">
            {' '}
            This phase was recomputed by hand, so its timestamp is when you ran it, not {BASIS_LABEL[current]}.
          </span>
        )}
      </p>
      </>
      )}
    </Card>
  );
};

export const VerdictBoard: React.FC<{
  playbook?: SniperPlaybook;
  onCopy: (text: string) => void;
  basis?: DecisionBasis;
  provisional?: boolean;
  revalidations?: PreMarketDecision['revalidations'];
  /** The analyst's independent call, shown beside ours - never instead of it. */
  review?: PhaseReview;
}> = ({ playbook, onCopy, basis, provisional, revalidations, review }) => {
  // The verdict is fixed at generation time, but the clock is not — the phase
  // line has to stay honest as 09:25 and 10:15 come and go.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 20000);
    return () => clearInterval(id);
  }, []);

  const live = useMemo(() => {
    const now = new Date(tick);
    const mins = istMinutes(now);
    const toMin = (t: string) => Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]);
    return {
      phase: resolvePhase(now),
      // The plan's own phaseLabel is frozen at generation time, so a plan cut
      // before the bell keeps claiming "Pre-market · plan now, do not trade"
      // long after the entry window has opened. Resolve it against now.
      phaseLabel: phaseLabelOf(now),
      toEntry: toMin(SNIPER.entryStart) - mins,
      toStop: toMin(SNIPER.hardStop) - mins
    };
  }, [tick]);

  // Defence in depth. A plan restored from IndexedDB may predate the current
  // schema, so treat every field as optional rather than trusting the type.
  if (!playbook || !playbook.verdict) return null;

  const tone = VERDICT_TONE[playbook.verdict] ?? VERDICT_TONE.CAUTION;
  const countdown =
    live.toEntry > 0
      ? `${Math.floor(live.toEntry / 60)}h ${live.toEntry % 60}m to the ${SNIPER.entryStart} entry window`
      : live.toStop > 0
        ? `${live.toStop} min before the ${SNIPER.hardStop} hard stop`
        : 'Hard stop passed — the day is over';

  return (
    <section className={`rounded-2xl border ${tone.wrap}`}>
      <div className="space-y-5 p-5 sm:p-6">
        {/* verdict */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <tone.Icon className={`mt-0.5 h-7 w-7 shrink-0 ${tone.text}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-black tracking-wider ${tone.chip}`}>
                  {playbook.verdict.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-500">{live.phaseLabel}</span>
              </div>
              <h2 className={`mt-1.5 text-2xl font-black leading-tight sm:text-3xl ${tone.text}`}>
                {playbook.verdictHeadline}
                {provisional && (
                  <span className="ml-2 align-middle rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-300">
                    PROVISIONAL
                  </span>
                )}
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-400">{playbook.verdictReason}</p>
              {basis && (
                <p className="mt-1.5 max-w-2xl text-[11px] text-slate-500">
                  <span className="text-slate-400">Basis: {BASIS_LABEL[basis]}.</span> {BASIS_NOTE[basis]}
                </p>
              )}
              {revalidations && revalidations.length > 1 && (
                <p className="mt-1 max-w-2xl text-[11px] text-slate-600">
                  Re-cuts:{' '}
                  {revalidations
                    .map(r => `${r.atStr.slice(0, 5)} @${r.spot} → ${r.verdict.split('—')[0].trim()}`)
                    .join('  ·  ')}
                </p>
              )}
              {review && (
                <div className="mt-2.5 max-w-2xl rounded-lg border border-indigo-500/25 bg-indigo-500/[0.07] px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Brain size={12} className="text-indigo-300" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Analyst
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-wider ${STANCE_TONE[review.stance]}`}>
                      {review.stance.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">{review.conviction}% conviction</span>
                    {/* Agreement is cheap to compute and expensive to miss. */}
                    {agreesWithVerdict(playbook.verdict, review.stance) ? (
                      <span className="text-[10px] text-slate-600">· agrees with the mechanical read</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-400">· dissents from the mechanical read</span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{review.headline}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Grade</p>
              <p className="text-3xl font-black leading-none text-slate-100">{playbook.grade}</p>
            </div>
            <button
              onClick={() => onCopy(playbook.briefing)}
              title="Copy the briefing"
              className="rounded-lg border border-slate-700 bg-slate-900/60 p-2.5 text-slate-300 transition hover:bg-slate-800"
            >
              <ClipboardCopy size={15} />
            </button>
          </div>
        </div>

        {/* zone summary */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-xs">
          <span className="text-slate-500">
            Support <span className="font-mono font-bold text-emerald-300">{num(playbook.plannedSupport)}</span>
          </span>
          <span className="text-slate-500">
            Resistance <span className="font-mono font-bold text-rose-300">{num(playbook.plannedResistance)}</span>
          </span>
          <span className="text-slate-500">
            Room <span className="font-semibold text-slate-200">{playbook.zoneWidth} pts</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-slate-400">
            <Clock size={12} /> {countdown}
          </span>
        </div>

        {/* open plan */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">The open</p>
          <p className="text-sm leading-relaxed text-slate-200">{playbook.openPlan}</p>
        </div>

        {/* gates */}
        {(playbook.gates ?? []).length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Gates</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(playbook.gates ?? []).map(gate => (
                <div
                  key={gate.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                    gate.pass
                      ? 'border-emerald-500/25 bg-emerald-500/5'
                      : gate.severity === 'BLOCKER'
                        ? 'border-rose-500/25 bg-rose-500/5'
                        : 'border-amber-500/25 bg-amber-500/5'
                  }`}
                >
                  {gate.pass ? (
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                  ) : gate.severity === 'BLOCKER' ? (
                    <X size={14} className="mt-0.5 shrink-0 text-rose-400" />
                  ) : (
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold ${
                        gate.pass ? 'text-emerald-200' : gate.severity === 'BLOCKER' ? 'text-rose-200' : 'text-amber-200'
                      }`}
                    >
                      {gate.label}
                    </p>
                    <p className="text-[11px] leading-snug text-slate-500">{gate.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* confluence */}
        {(playbook.confluence?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Levels more than one chart agreed on
            </p>
            <div className="flex flex-wrap gap-2">
              {(playbook.confluence ?? []).map(c => (
                <span
                  key={`${c.kind}-${c.level}`}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold ${
                    c.kind === 'SUPPORT'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                  title={c.sources.join(', ')}
                >
                  {num(c.level)}
                  <span className="ml-1.5 font-sans text-[10px] font-normal opacity-70">×{c.sources.length}</span>
                </span>
              ))}
            </div>
          </div>
        )}


        {/* reality check */}
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-2.5 text-[11px] leading-relaxed text-amber-200/90">
          {playbook.deltaNote}
        </p>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Key numbers — replaces the old sidebar, which used to sit beside an empty box.
// ---------------------------------------------------------------------------

export const KeyNumbers: React.FC<{ decision: PhaseSnapshot }> = ({ decision }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
    <Stat
      label="Reference spot"
      value={num(decision.spot)}
      sub={decision.spotSource === 'LIVE' ? 'live LTP' : decision.spotSource === 'MANUAL' ? 'manual' : 'read from charts'}
    />
    <Stat label="Support" value={num(decision.expectedSupport)} tone="good" />
    <Stat label="Resistance" value={num(decision.expectedResistance)} tone="bad" />
    <Stat label="Expected range" value={`${decision.expectedRange} pts`} sub={decision.openSentiment.toLowerCase()} />
    <Stat
      label="Primary bias"
      value={decision.primaryBias}
      tone={decision.primaryBias === 'LONG' ? 'good' : decision.primaryBias === 'SHORT' ? 'bad' : 'default'}
      sub={`${decision.biasStrength}% strength`}
    />
    <Stat
      label="Risk"
      value={decision.riskLevel}
      tone={decision.riskLevel === 'LOW' ? 'good' : decision.riskLevel === 'HIGH' ? 'bad' : 'warn'}
      sub={`${decision.confidence}% confidence`}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Evidence — why the verdict says what it says.
// ---------------------------------------------------------------------------

export const EvidenceGrid: React.FC<{ decision: PhaseSnapshot; visionLabel: string; aiLabel?: string }> = ({
  decision,
  visionLabel,
  aiLabel
}) => {
  const scenarios = [
    { key: 'flat' as const, label: 'Flat open', emoji: '➡️' },
    { key: 'gapUp' as const, label: 'Gap up', emoji: '📈' },
    { key: 'gapDown' as const, label: 'Gap down', emoji: '📉' }
  ];
  const best = Math.max(
    decision.scenarios.flat.probability,
    decision.scenarios.gapUp.probability,
    decision.scenarios.gapDown.probability
  );
  const review = decision.aiReview;
  const [showRaw, setShowRaw] = useState(false);
  const bySide = (kind: LevelSource['kind']) => (decision.levelSources ?? []).filter(l => l.kind === kind);

  // Before the bell the open is a distribution; after it, it is a fact.
  const openUnknown = !decision.basis || decision.basis === 'CHARTS_ONLY' || decision.basis === 'PREOPEN';
  const zoneWidth = Math.max(0, Math.round(decision.expectedResistance - decision.expectedSupport));
  const wallDistances = [decision.expectedSupport, decision.expectedResistance]
    .filter(l => l > 0)
    .map(l => Math.abs(Math.round(decision.spot - l)));
  const nearestWall = wallDistances.length ? Math.min(...wallDistances) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* confluence matrix */}
      <Card
        title="Chart confluence"
        icon={<GitCompareArrows className="h-4 w-4 text-indigo-400" />}
        right={
          <Pill tone={decision.agreement >= 75 ? 'good' : decision.agreement >= 60 ? 'warn' : 'bad'}>
            {decision.agreement >= 75 ? 'Aligned' : decision.agreement >= 60 ? 'Mixed' : 'Conflicted'} ·{' '}
            {decision.agreement}%
          </Pill>
        }
      >
        <div className="space-y-2">
          {decision.contributions.map(c => (
            <div key={c.slot} className="flex items-center gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
              <span className="text-base">{c.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-200">{c.short}</p>
                  <span className="font-mono text-[9px] text-slate-600">{Math.round(c.weight * 100)}%</span>
                </div>
                <p className="truncate text-[11px] text-slate-500">{c.summary}</p>
              </div>
              <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${biasClasses(c.bias)}`}>
                {c.bias} {c.confidence}%
              </span>
            </div>
          ))}
          {CHART_SLOTS.filter(s => !decision.contributions.some(c => c.slot === s.id)).map(slot => (
            <div
              key={slot.id}
              className="flex items-center gap-3 rounded-lg border border-dashed border-slate-800 px-3 py-2"
            >
              <span className="text-base opacity-30">{slot.emoji}</span>
              <p className="flex-1 text-xs text-slate-600">{slot.short} not provided</p>
              <span className="text-[10px] font-semibold text-slate-700">MISSING</span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat
            label="Chart bias"
            value={`${(decision.chartBias ?? 0) > 0 ? '+' : ''}${decision.chartBias ?? 0}%`}
            tone={(decision.chartBias ?? 0) > 0 ? 'good' : (decision.chartBias ?? 0) < 0 ? 'bad' : 'default'}
          />
          <Stat
            label="Live market bias"
            value={
              decision.marketBias === null
                ? 'No feed'
                : `${decision.marketBias > 0 ? '+' : ''}${decision.marketBias}%`
            }
            tone={
              decision.marketBias === null
                ? 'default'
                : decision.marketBias > 0
                  ? 'good'
                  : decision.marketBias < 0
                    ? 'bad'
                    : 'default'
            }
          />
        </div>
      </Card>

      <div className="space-y-4">
        {/* summary */}
        <Card
          title="Market summary"
          icon={<Brain className="h-4 w-4 text-indigo-400" />}
          right={<Pill tone={review ? 'info' : 'muted'}>{review ? aiLabel ?? review.model : visionLabel}</Pill>}
        >
          {review ? (
            <>
              {/* The analyst's read leads: it is the only text on this screen
                  written against this checkpoint's price rather than assembled
                  from the chart verdicts. */}
              <p className="text-sm leading-relaxed text-slate-200">{review.summary}</p>
              {review.expectation && (
                <div className="mt-3 rounded-lg border border-indigo-500/25 bg-indigo-500/[0.06] px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                    What to expect · {BASIS_LABEL[review.basis]}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{review.expectation}</p>
                </div>
              )}
              <button
                onClick={() => setShowRaw(v => !v)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-slate-300"
              >
                <ChevronDown size={13} className={`transition ${showRaw ? 'rotate-180' : ''}`} />
                {showRaw ? 'Hide' : 'Show'} the raw chart read
              </button>
              {showRaw && (
                <p className="mt-2 whitespace-pre-line border-l-2 border-slate-800 pl-3 text-[12px] leading-relaxed text-slate-400">
                  {decision.aiSummary}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{decision.aiSummary}</p>
              {decision.aiReviewError && (
                <p className="mt-2 text-[11px] text-amber-400/80">
                  The analyst pass could not run ({decision.aiReviewError}), so this is the mechanical read only.
                </p>
              )}
            </>
          )}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Combined sentiment</span>
              <span
                className={`font-semibold tabular-nums ${
                  decision.sentimentStrength >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {decision.sentimentStrength > 0 ? '+' : ''}
                {decision.sentimentStrength}%
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-600" />
              <div
                className={`absolute h-full ${
                  decision.sentimentStrength >= 0
                    ? 'left-1/2 rounded-r-full bg-emerald-400'
                    : 'right-1/2 rounded-l-full bg-rose-400'
                }`}
                style={{ width: `${Math.min(Math.abs(decision.sentimentStrength) / 2, 50)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Before the bell, how the day opens is the open question. After it,
            the answer is on the screen and these probabilities are history -
            so the slot is given to the gates that decide whether to trade. */}
        {openUnknown ? (
          <Card title="Open scenarios" icon={<Activity className="h-4 w-4 text-indigo-400" />}>
            <div className="grid grid-cols-3 gap-2">
              {scenarios.map(s => {
                const data = decision.scenarios[s.key];
                const top = data.probability === best;
                return (
                  <div
                    key={s.key}
                    className={`rounded-xl border p-3 ${
                      top ? 'border-sky-500/40 bg-sky-500/10' : 'border-slate-800 bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{s.emoji}</span>
                      <span className="text-[11px] font-semibold text-slate-300">{s.label}</span>
                    </div>
                    <p className={`mt-1 text-2xl font-black ${top ? 'text-sky-300' : 'text-slate-400'}`}>
                      {data.probability}%
                    </p>
                    <p className="mt-1 text-[10px] leading-tight text-slate-500">{data.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card title="Go / no-go gates" icon={<Activity className="h-4 w-4 text-indigo-400" />}>
            <p className="-mt-1 mb-3 text-[11px] text-slate-500">
              Every one of these has to be true before size goes on. One red gate is a stand-aside, however good the
              story sounds.
            </p>
            <div className="space-y-1.5">
              <GateRow
                label="Zone is wide enough to trade"
                detail={`${zoneWidth} pts between ${num(decision.expectedSupport)} and ${num(decision.expectedResistance)} · need ${SNIPER.minZoneWidth}`}
                ok={zoneWidth >= SNIPER.minZoneWidth}
              />
              <GateRow
                label="Price is at a wall, not mid-zone"
                detail={
                  nearestWall === null
                    ? 'No level within reach'
                    : `${nearestWall} pts from the nearest working level · arm inside ${SNIPER.zoneBuffer}`
                }
                ok={nearestWall !== null && nearestWall <= SNIPER.zoneBuffer}
              />
              <GateRow
                label="Charts agree with each other"
                detail={`${decision.agreement}% confluence across ${decision.chartCoverage} charts · need 60%`}
                ok={decision.agreement >= 60}
              />
              <GateRow
                label="Analyst pass is not standing aside"
                detail={
                  review
                    ? `${review.stance.replace('_', ' ')} at ${review.conviction}% conviction`
                    : 'Analyst pass has not run for this cut'
                }
                ok={!!review && review.stance !== 'STAND_ASIDE'}
              />
            </div>
          </Card>
        )}
      </div>

      {/* level ladder */}
      {(decision.supports.length > 0 || decision.resistances.length > 0) && (
        <Card
          title="Level ladder"
          icon={<BarChart2 className="h-4 w-4 text-indigo-400" />}
          right={<Pill tone="muted">measured from {num(decision.spot)}</Pill>}
        >
          <p className="-mt-1 mb-3 text-[11px] text-slate-500">
            Every level with the chart that named it. Two independent charts on the same number is the strongest
            evidence this system produces — an OI wall is defended intraday by the writers who put it there.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-300">Resistances above</p>
              <div className="space-y-1.5">
                {bySide('RESISTANCE').length ? (
                  bySide('RESISTANCE').map((l, i) => (
                    <LadderRow
                      key={l.level}
                      rank={`R${i + 1}`}
                      level={l}
                      note={noteFor(review, l.level)}
                      working={l.level === decision.expectedResistance}
                    />
                  ))
                ) : decision.resistances.length ? (
                  // A plan restored from a build before provenance existed.
                  decision.resistances.map((level, i) => (
                    <PlainLevelRow key={level} rank={`R${i + 1}`} level={level} spot={decision.spot} kind="RESISTANCE" />
                  ))
                ) : (
                  <p className="text-xs text-slate-600">None detected</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Supports below</p>
              <div className="space-y-1.5">
                {bySide('SUPPORT').length ? (
                  bySide('SUPPORT').map((l, i) => (
                    <LadderRow
                      key={l.level}
                      rank={`S${i + 1}`}
                      level={l}
                      note={noteFor(review, l.level)}
                      working={l.level === decision.expectedSupport}
                    />
                  ))
                ) : decision.supports.length ? (
                  decision.supports.map((level, i) => (
                    <PlainLevelRow key={level} rank={`S${i + 1}`} level={level} spot={decision.spot} kind="SUPPORT" />
                  ))
                ) : (
                  <p className="text-xs text-slate-600">None detected</p>
                )}
              </div>
            </div>
          </div>
          {!review && (
            <p className="mt-3 text-[10px] text-slate-600">
              Run the analyst pass from Session phases to annotate each level with what happens at it.
            </p>
          )}
        </Card>
      )}

      {/* trade plan */}
      <Card
        title="Opening playbook"
        icon={<Target className="h-4 w-4 text-indigo-400" />}
        right={
          <div className="flex items-center gap-2">
            {decision.basis && <Pill tone="muted">{BASIS_LABEL[decision.basis]}</Pill>}
            <button
              onClick={() => window.print()}
              title="Export as a printable report"
              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"
            >
              <Download size={13} />
            </button>
          </div>
        }
      >
        {review?.playbook.length ? (
          <>
            {/* The analyst's steps are written for this checkpoint's price, so
                they lead. The mechanical plan is kept underneath because it is
                the one the execution engine will actually follow. */}
            <div className="mb-1.5 flex items-center gap-2">
              <Brain size={13} className="text-indigo-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Analyst plan · {BASIS_LABEL[review.basis]} @ {num(review.spot)}
              </span>
            </div>
            <ol className="space-y-2">
              {review.playbook.map((line, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-200">
                  <span className="font-bold text-indigo-400">{i + 1}.</span>
                  <span className="flex-1 leading-relaxed">{line}</span>
                </li>
              ))}
            </ol>
            {review.invalidators.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">Abandon the plan if</p>
                <ul className="mt-1 space-y-0.5">
                  {review.invalidators.map((inv, i) => (
                    <li key={i} className="text-[11px] leading-snug text-slate-400">
                      · {inv}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <details className="group mt-3">
              <summary className="cursor-pointer list-none text-[11px] font-semibold text-slate-500 transition hover:text-slate-300">
                <ChevronDown size={13} className="inline transition group-open:rotate-180" /> The mechanical plan the
                engine executes
              </summary>
              <ol className="mt-2 space-y-1.5 border-l-2 border-slate-800 pl-3">
                {decision.tradePlan.map((line, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-slate-400">
                    <span className="font-bold text-emerald-500/70">{i + 1}.</span>
                    <span className="flex-1 leading-relaxed">{line}</span>
                  </li>
                ))}
              </ol>
            </details>
          </>
        ) : (
          <ol className="space-y-2">
            {decision.tradePlan.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="font-bold text-emerald-400">{i + 1}.</span>
                <span className="flex-1 leading-relaxed">{line}</span>
              </li>
            ))}
          </ol>
        )}
        {decision.riskReason && (
          <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">Risk — {decision.riskLevel}.</span> {decision.riskReason}
          </p>
        )}
      </Card>
    </div>
  );
};

/** One pass/fail condition from the go/no-go checklist. */
const GateRow: React.FC<{ label: string; detail: string; ok: boolean }> = ({ label, detail, ok }) => (
  <div
    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
      ok ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-rose-500/25 bg-rose-500/[0.05]'
    }`}
  >
    <span className={`mt-px text-[13px] font-black ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>{ok ? '✓' : '✗'}</span>
    <div className="min-w-0 flex-1">
      <p className={`text-[12px] font-semibold ${ok ? 'text-slate-200' : 'text-slate-300'}`}>{label}</p>
      <p className="mt-0.5 font-mono text-[10px] leading-snug text-slate-500">{detail}</p>
    </div>
  </div>
);

/** A ladder row that can show where the number came from. */
const LadderRow: React.FC<{
  rank: string;
  level: LevelSource;
  note?: ReviewLevelNote;
  working: boolean;
}> = ({ rank, level, note, working }) => {
  const isSupport = level.kind === 'SUPPORT';
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        isSupport
          ? working
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : 'border-emerald-500/20 bg-emerald-500/5'
          : working
            ? 'border-rose-500/50 bg-rose-500/10'
            : 'border-rose-500/20 bg-rose-500/5'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-bold ${isSupport ? 'text-emerald-300' : 'text-rose-300'}`}>
            {num(level.level)}
          </span>
          {working && (
            <span className="rounded bg-sky-500/20 px-1.5 py-px text-[9px] font-black tracking-wider text-sky-300">
              WORKING
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {rank} · {level.distance > 0 ? '+' : ''}
          {level.distance}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {level.sources.map(s => (
          <span key={s} className="rounded bg-slate-800/80 px-1 py-px text-[9px] text-slate-400">
            {s}
          </span>
        ))}
        {level.sources.length > 1 && (
          <span className="rounded bg-sky-500/20 px-1 py-px text-[9px] font-bold text-sky-300">
            {level.sources.length}× confluence
          </span>
        )}
        {note?.strength === 'MAJOR' && (
          <span className="rounded bg-indigo-500/20 px-1 py-px text-[9px] font-bold text-indigo-300">MAJOR</span>
        )}
        {level.stale && (
          <span className="rounded bg-amber-500/15 px-1 py-px text-[9px] font-bold text-amber-400">STALE</span>
        )}
      </div>
      {note && <p className="mt-1 text-[10px] leading-snug text-slate-500">{note.note}</p>}
    </div>
  );
};

/** Fallback for plans cut before level provenance was recorded. */
const PlainLevelRow: React.FC<{ rank: string; level: number; spot: number; kind: LevelSource['kind'] }> = ({
  rank,
  level,
  spot,
  kind
}) => {
  const isSupport = kind === 'SUPPORT';
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-1.5 ${
        isSupport ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
      }`}
    >
      <span className={`font-mono text-sm font-bold ${isSupport ? 'text-emerald-300' : 'text-rose-300'}`}>
        {num(level)}
      </span>
      <span className="text-[10px] text-slate-500">
        {rank} · {level > spot ? '+' : '−'}
        {Math.abs(level - spot)}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Chart workspace — the four inputs, compact.
// ---------------------------------------------------------------------------

export const ChartWorkspace: React.FC<{
  charts: Partial<Record<ChartSlotId, ChartEntry>>;
  analyzingSlots: ChartSlotId[];
  pendingImages: PendingImage[];
  visionEngineName: string;
  nowTick: number;
  onFiles: (files: File[], slot?: ChartSlotId) => void;
  onAssignPending: (id: string, slot: ChartSlotId) => void;
  onDiscardPending: (id: string) => void;
  onAnalyze: (slot: ChartSlotId) => void;
  onRemove: (slot: ChartSlotId) => void;
  onPreview: (data: string) => void;
}> = ({
  charts, analyzingSlots, pendingImages, visionEngineName, nowTick, onFiles, onAssignPending,
  onDiscardPending, onAnalyze, onRemove, onPreview
}) => (
  <Card
    title="Chart workspace"
    icon={<ImageIcon className="h-4 w-4 text-slate-400" />}
    right={
      <span className="text-[11px] text-slate-600">
        Name files <span className="font-mono text-slate-500">daily</span>,{' '}
        <span className="font-mono text-slate-500">1min</span>, <span className="font-mono text-slate-500">oi</span>,{' '}
        <span className="font-mono text-slate-500">multi-oi</span> to auto-route
      </span>
    }
  >
    {pendingImages.length > 0 && (
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-300">
          <AlertCircle size={13} /> Which chart is this? ({pendingImages.length} waiting)
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pendingImages.map(p => (
            <div key={p.id} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
              <button onClick={() => onPreview(p.data)} className="block h-24 w-full bg-slate-900">
                <img src={p.data} alt={p.fileName} className="h-full w-full object-cover" />
              </button>
              <div className="space-y-2 p-2">
                <p className="truncate font-mono text-[10px] text-slate-500">{p.fileName}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CHART_SLOTS.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => onAssignPending(p.id, slot.id)}
                      title={charts[slot.id] ? `Replaces the current ${slot.short}` : slot.purpose}
                      className={`rounded-md border border-slate-700 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800 ${
                        charts[slot.id] ? 'opacity-50' : ''
                      }`}
                    >
                      {slot.emoji} {slot.short}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onDiscardPending(p.id)}
                  className="w-full rounded-md py-1 text-[10px] text-slate-500 hover:text-rose-300"
                >
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="grid gap-3 lg:grid-cols-2">
      {CHART_SLOTS.map(slot => {
        const entry = charts[slot.id];
        const busy = analyzingSlots.includes(slot.id);
        // Something else is being read, so this one is waiting its turn rather
        // than sitting idle - say so, or it looks like the upload failed.
        const queueActive = !busy && analyzingSlots.length > 0;
        const verdict = entry?.verdict;
        const SlotIcon = SLOT_ICONS[slot.id];
        const stale = !!entry && slot.freshnessCritical && isStale(entry.uploadedAt, nowTick);

        return (
          <div
            key={slot.id}
            className={`rounded-xl border bg-slate-950/50 p-3 ${
              stale ? 'border-rose-500/40' : entry ? 'border-slate-800' : 'border-dashed border-slate-800'
            }`}
          >
            <div className="mb-2.5 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <SlotIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-200">{slot.label}</h3>
                  <p className="text-[10px] leading-snug text-slate-500">{slot.purpose}</p>
                </div>
              </div>
              <span className="shrink-0 rounded border border-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                {Math.round(slot.weight * 100)}%
              </span>
            </div>

            {!entry ? (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    onFiles(Array.from(e.target.files || []), slot.id);
                    e.target.value = '';
                  }}
                />
                <div className="rounded-lg border border-dashed border-slate-700 py-5 text-center transition hover:border-slate-500 hover:bg-slate-900/50">
                  <Upload className="mx-auto mb-1.5 h-5 w-5 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-400">Upload {slot.short}</p>
                  <p className="mt-0.5 px-3 text-[10px] leading-snug text-slate-600">{slot.capture}</p>
                </div>
              </label>
            ) : (
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => onPreview(entry.data)}
                    className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-800"
                  >
                    <img src={entry.data} alt={slot.label} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-[10px] font-semibold text-sky-300 opacity-0 transition group-hover:opacity-100">
                      View
                    </span>
                  </button>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    {busy ? (
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-300">
                        <Loader2 size={12} className="animate-spin" /> Reading with {visionEngineName}…
                      </p>
                    ) : verdict ? (
                      <>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black ${biasClasses(verdict.bias)}`}>
                            {verdict.bias}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{verdict.confidence}%</span>
                          {!verdict.structured && <Pill tone="warn">inferred</Pill>}
                        </div>
                        <Meter
                          value={verdict.confidence}
                          tone={
                            verdict.bias === 'BULLISH'
                              ? 'bg-emerald-400'
                              : verdict.bias === 'BEARISH'
                                ? 'bg-rose-400'
                                : 'bg-slate-500'
                          }
                          height="h-1"
                        />
                        <p className="text-[11px] leading-snug text-slate-300">{verdict.summary}</p>
                      </>
                    ) : entry.error ? (
                      <p className="text-[11px] leading-snug text-rose-300">{entry.error}</p>
                    ) : queueActive ? (
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock size={11} className="shrink-0" /> Queued — charts are read one at a time.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500">Uploaded, not analyzed yet.</p>
                    )}
                  </div>
                </div>

                {verdict && isUnreadable(verdict) && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] leading-snug text-amber-200">
                    The model could not read this screenshot, so it is excluded from the decision. Capture it larger with
                    the price scale visible, or pick a stronger vision model in Settings.
                  </p>
                )}

                {stale && (
                  <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[10px] leading-snug text-rose-200">
                    <span className="font-black">STALE</span> — over {Math.round(STALE_AFTER_MS / 3600000)}h old.
                    Re-capture it; a previous session's {slot.short.toLowerCase()} will send you into the wrong zone.
                  </p>
                )}

                {verdict && ((verdict.supports?.length ?? 0) > 0 || (verdict.resistances?.length ?? 0) > 0) && (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Class names are written out in full — Tailwind's JIT scans
                        literal strings, so an interpolated colour never compiles. */}
                    {(
                      [
                        {
                          key: 'supports',
                          levels: verdict.supports ?? [],
                          label: slot.id === 'OI_SNAPSHOT' || slot.id === 'MULTI_OI' ? 'Put walls' : 'Supports',
                          box: 'border-emerald-500/20 bg-emerald-500/5',
                          head: 'text-emerald-300',
                          chip: 'bg-emerald-500/10 text-emerald-300'
                        },
                        {
                          key: 'resistances',
                          levels: verdict.resistances ?? [],
                          label: slot.id === 'OI_SNAPSHOT' || slot.id === 'MULTI_OI' ? 'Call walls' : 'Resistances',
                          box: 'border-rose-500/20 bg-rose-500/5',
                          head: 'text-rose-300',
                          chip: 'bg-rose-500/10 text-rose-300'
                        }
                      ] as const
                    ).map(group => (
                      <div key={group.key} className={`rounded-lg border p-2 ${group.box}`}>
                        <p className={`mb-1 text-[9px] font-bold uppercase ${group.head}`}>{group.label}</p>
                        <div className="flex flex-wrap gap-1">
                          {group.levels.length ? (
                            group.levels.map(l => (
                              <span
                                key={l}
                                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${group.chip}`}
                              >
                                {l}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-600">–</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {verdict && (verdict.notes?.length ?? 0) > 0 && (
                  <ul className="space-y-0.5">
                    {(verdict.notes ?? []).map((n, i) => (
                      <li key={i} className="flex gap-1.5 text-[10px] leading-snug text-slate-400">
                        <span className="shrink-0 text-slate-600">•</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    onClick={() => onAnalyze(slot.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                  >
                    <RefreshCw size={10} className={busy ? 'animate-spin' : ''} />
                    {verdict ? 'Re-analyze' : 'Analyze'}
                  </button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        onFiles(Array.from(e.target.files || []), slot.id);
                        e.target.value = '';
                      }}
                    />
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-slate-800">
                      <Upload size={10} /> Replace
                    </span>
                  </label>
                  <button
                    onClick={() => onRemove(slot.id)}
                    className="ml-auto rounded-md p-1 text-slate-600 transition hover:text-rose-300"
                    title="Remove this chart"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <p className="truncate font-mono text-[9px] text-slate-600">
                  {entry.fileName} · {new Date(entry.analyzedAt || entry.uploadedAt).toLocaleString('en-IN', { hour12: false })}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Empty state — the capture checklist, shown instead of a decision.
// ---------------------------------------------------------------------------

export const CaptureChecklist: React.FC<{
  charts: Partial<Record<ChartSlotId, ChartEntry>>;
  analyzingSlots: ChartSlotId[];
  coverage: number;
}> = ({ charts, analyzingSlots, coverage }) => (
  <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <Crosshair className="mt-1 h-6 w-6 shrink-0 text-slate-600" />
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-300">No decision yet</h2>
        <p className="mt-0.5 max-w-2xl text-xs text-slate-500">
          Capture the four screenshots below. Each is read on its own, then combined into one Office Protocol verdict —
          the zones, the 250-ITM strikes and whether today is worth trading at all.
        </p>
      </div>
    </div>

    <div className="mt-5 grid gap-2 sm:grid-cols-2">
      {CHART_SLOTS.map(slot => {
        const state = slotState(slot, charts[slot.id], analyzingSlots);
        const done = state === 'done';
        return (
          <div key={slot.id} className="flex gap-2.5 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
            <div
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                done ? 'border-emerald-500/50 bg-emerald-500/20' : 'border-slate-700'
              }`}
            >
              {done && <CheckCircle2 size={10} className="text-emerald-400" />}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${done ? 'text-emerald-300' : 'text-slate-300'}`}>
                {slot.emoji} {slot.short}
              </p>
              <p className="text-[11px] leading-snug text-slate-500">{slot.capture}</p>
            </div>
          </div>
        );
      })}
    </div>

    {coverage > 0 && (
      <p className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-200">
        {coverage} of {CHART_SLOTS.length} charts read. Hit <span className="font-semibold">Generate decision</span> —
        the verdict works with what it has and tells you what is missing.
      </p>
    )}
  </section>
);

// ---------------------------------------------------------------------------

export const ActivityLog: React.FC<{ logs: string[] }> = ({ logs }) => (
  <details className="rounded-2xl border border-slate-800 bg-slate-900/40">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200">
      <Activity className="h-3.5 w-3.5" />
      Activity log
      <span className="text-slate-600">({logs.length})</span>
    </summary>
    <div className="max-h-48 space-y-1 overflow-y-auto border-t border-slate-800 px-4 py-3">
      {logs.length ? (
        logs.map((l, i) => (
          <p key={i} className="font-mono text-[11px] leading-relaxed text-slate-500">
            {l}
          </p>
        ))
      ) : (
        <p className="py-3 text-center text-[11px] text-slate-600">Nothing yet.</p>
      )}
    </div>
  </details>
);

export const PreviewModal: React.FC<{ image: string | null; onClose: () => void }> = ({ image, onClose }) =>
  image ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-slate-300 transition hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="overflow-hidden rounded-2xl border border-slate-700">
          <img src={image} alt="chart preview" className="max-h-[80vh] w-full object-contain" />
        </div>
      </div>
    </div>
  ) : null;
