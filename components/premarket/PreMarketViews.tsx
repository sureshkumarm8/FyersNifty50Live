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
  Download, GitCompareArrows, Image as ImageIcon, Loader2, RefreshCw, Shield, Sparkles, Target,
  Trash2, Upload, X, Zap
} from 'lucide-react';
import { SNIPER, SniperPlaybook, ZonePlay, istMinutes, resolvePhase } from '../../services/sniperPlaybook';
import { Card, Meter, Pill, Stat } from '../ui/panels';
import {
  CHART_SLOTS, ChartEntry, ChartSlotId, PendingImage, PreMarketDecision, SLOT_ICONS,
  STALE_AFTER_MS, SlotConfig, biasClasses, isStale, isUnreadable
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
  onReset: () => void;
  hasDecision: boolean;
  generatedAtStr?: string;
}> = ({
  visionReady, visionLabel, charts, analyzingSlots, coverage, liveLtp, manualSpot, onManualSpot,
  onFiles, onAnalyzeRemaining, hasUnanalyzed, onGenerate, isGenerating, onCopy, onReset,
  hasDecision, generatedAtStr
}) => {
  const pct = Math.round((coverage / CHART_SLOTS.length) * 100);
  const busy = analyzingSlots.length > 0;

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
            {isCe ? 'Bounce · buy call at support' : 'Fade · buy put at resistance'}
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

export const VerdictBoard: React.FC<{ playbook?: SniperPlaybook; onCopy: (text: string) => void }> = ({
  playbook,
  onCopy
}) => {
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
    return { phase: resolvePhase(now), toEntry: toMin(SNIPER.entryStart) - mins, toStop: toMin(SNIPER.hardStop) - mins };
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
                <span className="text-[11px] text-slate-500">{playbook.phaseLabel}</span>
              </div>
              <h2 className={`mt-1.5 text-2xl font-black leading-tight sm:text-3xl ${tone.text}`}>
                {playbook.verdictHeadline}
              </h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-400">{playbook.verdictReason}</p>
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

        {/* the two plays */}
        <div className="grid gap-3 md:grid-cols-2">
          {(playbook.plays ?? []).map(play => (
            <PlayCard key={play.side} play={play} />
          ))}
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

        {/* invalidations + timeline */}
        <div className="grid gap-4 md:grid-cols-2">
          {(playbook.invalidations ?? []).length > 0 && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-300">Tear the plan up if…</p>
              <ul className="space-y-1.5">
                {(playbook.invalidations ?? []).map((line, i) => (
                  <li key={i} className="flex gap-2 text-[11px] leading-snug text-slate-300">
                    <span className="shrink-0 text-rose-400">✕</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(playbook.timeline ?? []).length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Today's clock</p>
              <ol className="space-y-2">
                {(playbook.timeline ?? []).map(step => {
                  const active = step.state === 'ACTIVE';
                  return (
                    <li key={step.time} className="flex gap-3">
                      <span
                        className={`shrink-0 font-mono text-[11px] font-bold ${
                          active ? 'text-amber-300' : step.state === 'DONE' ? 'text-slate-700' : 'text-slate-600'
                        }`}
                      >
                        {step.time}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold ${active ? 'text-slate-100' : 'text-slate-400'}`}>
                          {step.title}
                        </p>
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
            </div>
          )}
        </div>

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

export const KeyNumbers: React.FC<{ decision: PreMarketDecision }> = ({ decision }) => (
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

export const EvidenceGrid: React.FC<{ decision: PreMarketDecision; visionLabel: string }> = ({
  decision,
  visionLabel
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
        <Card title="Market summary" icon={<Brain className="h-4 w-4 text-indigo-400" />} right={<Pill>{visionLabel}</Pill>}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{decision.aiSummary}</p>
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

        {/* scenarios */}
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
      </div>

      {/* level ladder */}
      {(decision.supports.length > 0 || decision.resistances.length > 0) && (
        <Card title="Level ladder" icon={<BarChart2 className="h-4 w-4 text-indigo-400" />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-300">Resistances above</p>
              <div className="space-y-1.5">
                {decision.resistances.length ? (
                  decision.resistances.map((level, i) => (
                    <div
                      key={level}
                      className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5"
                    >
                      <span className="font-mono text-sm font-bold text-rose-300">{num(level)}</span>
                      <span className="text-[10px] text-slate-500">
                        R{i + 1} · +{level - decision.spot}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600">None detected</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Supports below</p>
              <div className="space-y-1.5">
                {decision.supports.length ? (
                  decision.supports.map((level, i) => (
                    <div
                      key={level}
                      className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5"
                    >
                      <span className="font-mono text-sm font-bold text-emerald-300">{num(level)}</span>
                      <span className="text-[10px] text-slate-500">
                        S{i + 1} · −{decision.spot - level}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600">None detected</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* trade plan */}
      <Card
        title="Opening playbook"
        icon={<Target className="h-4 w-4 text-indigo-400" />}
        right={
          <button
            onClick={() => window.print()}
            title="Export as a printable report"
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"
          >
            <Download size={13} />
          </button>
        }
      >
        <ol className="space-y-2">
          {decision.tradePlan.map((line, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="font-bold text-emerald-400">{i + 1}.</span>
              <span className="flex-1 leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
        {decision.riskReason && (
          <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">Risk — {decision.riskLevel}.</span> {decision.riskReason}
          </p>
        )}
      </Card>
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
