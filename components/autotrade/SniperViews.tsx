/**
 * Pure presentational pieces of the Sniper panel.
 *
 * They are split out of SniperPanel.tsx for one reason: every interesting
 * branch here (armed setup, blocked setup, zone radar geometry, pre-market
 * confluence) only appears after effects have run, which makes it invisible to
 * a server-render smoke test. As props-in / markup-out components they can be
 * rendered directly against fabricated states and asserted on.
 */

import React from 'react';
import { ArrowDownRight, ArrowUpRight, Brain, FileText, Radar, RefreshCw, Rocket, ShieldAlert } from 'lucide-react';
import { SNIPER, SniperPlaybook } from '../../services/sniperPlaybook';
import { OpeningRange, SniperEvaluation, SniperPhase } from '../../services/sniperEngine';
import { LiveThesis } from '../../services/sniperReconcile';
import { LiveVerdict } from '../../services/sniperReview';
import { BlockList, Card, Checklist, Pill, Stat } from './shared';

export const fmt = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');

export const RangeBoard: React.FC<{
  range: OpeningRange | null;
  spot: number | null;
  evaluation: SniperEvaluation | null;
}> = ({ range, spot, evaluation }) => {
  /**
   * The radar plots the walls the engine is ACTUALLY arming against, which
   * after reconciliation may not be the ones the raw range produced. Plotting
   * the mechanical range while `distanceToSupport` is measured against a
   * different level would put the marker and the numbers under it in
   * disagreement - the kind of small inconsistency that gets a trade taken at
   * the wrong price.
   */
  const support = evaluation?.tradedSupport ?? range?.support ?? null;
  const resistance = evaluation?.tradedResistance ?? range?.resistance ?? null;
  const substituted =
    !!range && support != null && resistance != null &&
    (Math.round(support) !== Math.round(range.support) || Math.round(resistance) !== Math.round(range.resistance));

  const zonePct =
    support != null && resistance != null && spot != null
      ? Math.max(0, Math.min(100, ((spot - support) / Math.max(1, resistance - support)) * 100))
      : null;

  const width = support != null && resistance != null ? Math.round(resistance - support) : null;

  return (
    <Card
      title="The Download — 09:15 to 09:25 range"
      icon={<Radar className="h-4 w-4 text-emerald-400" />}
      right={range ? <Pill tone={range.samples >= 4 ? 'good' : 'warn'}>{range.samples} ticks</Pill> : <Pill tone="muted">not marked</Pill>}
    >
      {!range ? (
        <p className="py-6 text-center text-xs text-slate-500">
          The range is built from live ticks between 09:15 and 09:25. Nothing to trade against until then.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="5-min high" value={fmt(range.high)} />
            <Stat label="5-min low" value={fmt(range.low)} />
            <Stat label="Resistance" value={fmt(range.resistance)} sub="high + 50" tone="bad" />
            <Stat label="Support" value={fmt(range.support)} sub="low − 50" tone="good" />
          </div>

          {substituted && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              <strong>Not the walls being traded.</strong> Reconciliation with the pre-market plan is arming against{' '}
              {fmt(support)} / {fmt(resistance)} instead. The radar below shows those.
            </p>
          )}

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Support {fmt(support)}</span>
              <span className="font-semibold text-slate-300">
                Spot {fmt(spot)}
                {evaluation?.zone && (
                  <span className="ml-2 text-slate-500">{evaluation.zone.replace(/_/g, ' ').toLowerCase()}</span>
                )}
              </span>
              <span>Resistance {fmt(resistance)}</span>
            </div>
            <div className="relative h-8 rounded-lg border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-slate-800/40 to-rose-500/20">
              {zonePct != null && (
                <div
                  className="absolute top-0 h-8 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  style={{ left: `${zonePct}%` }}
                />
              )}
              <div className="absolute inset-y-0 left-0 w-[15%] rounded-l-lg border-r border-dashed border-emerald-500/40" />
              <div className="absolute inset-y-0 right-0 w-[15%] rounded-r-lg border-l border-dashed border-rose-500/40" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
              <span>
                {evaluation?.distanceToSupport != null ? `${evaluation.distanceToSupport} pts above support` : '—'}
              </span>
              <span className="text-slate-600">{range.openType.replace('_', ' ')} open</span>
              <span>
                {evaluation?.distanceToResistance != null ? `${evaluation.distanceToResistance} pts below resistance` : '—'}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400">
            Room wall to wall: <span className="font-semibold text-slate-200">{width} pts</span>
            {width != null && width < SNIPER.minZoneWidth && (
              <span className="ml-2 text-rose-300">too tight for a {SNIPER.targetPoints}-point target</span>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

/**
 * Plan versus tape, and what was done about the difference.
 *
 * This replaced a board that showed the pre-market plan next to the live range
 * and left the reader to reconcile them by eye. The reconciliation is now done
 * in code and this reports it: which claims survived, which levels are actually
 * being traded, and every adjustment made to the morning's read.
 */
export const ThesisBoard: React.FC<{
  playbook: SniperPlaybook | null;
  thesis: LiveThesis;
  verdict: LiveVerdict | null;
  reviewing: boolean;
  aiReady: boolean;
  aiLabel: string;
  onReload: () => void;
  onReview: () => void;
}> = ({ playbook, thesis, verdict, reviewing, aiReady, aiLabel, onReload, onReview }) => {
  const tone =
    thesis.state === 'CONFIRMED'
      ? { pill: 'good' as const, wrap: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' }
      : thesis.state === 'INVALIDATED'
        ? { pill: 'bad' as const, wrap: 'border-rose-500/30 bg-rose-500/10 text-rose-200' }
        : thesis.state === 'DRIFTED'
          ? { pill: 'warn' as const, wrap: 'border-amber-500/30 bg-amber-500/10 text-amber-200' }
          : { pill: 'muted' as const, wrap: 'border-slate-700 bg-slate-800/40 text-slate-300' };

  const STATE_LINE: Record<LiveThesis['state'], string> = {
    NO_PLAN: 'No pre-market plan today — trading the opening range unaided.',
    PENDING: 'Waiting for the 09:15–09:25 range before the morning\'s read can be checked.',
    CONFIRMED: 'The tape agrees with this morning. Highest-conviction version of the setup.',
    DRIFTED: 'Partly wrong. The levels below have been re-cut to what the tape says.',
    INVALIDATED: 'The morning\'s read has failed. Standing down.'
  };

  return (
    <Card
      title="Thesis check — plan vs tape"
      icon={<FileText className="h-4 w-4 text-emerald-400" />}
      right={
        <div className="flex items-center gap-1.5">
          <Pill tone={tone.pill}>
            {thesis.state.replace('_', ' ')}
            {thesis.state !== 'NO_PLAN' && thesis.state !== 'PENDING' ? ` · ${thesis.score}%` : ''}
          </Pill>
          <button
            onClick={onReload}
            title="Reload the pre-market plan"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {playbook && (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-100">{playbook.verdictHeadline}</div>
              <p className="mt-0.5 text-[11px] text-slate-500">{playbook.verdictReason}</p>
            </div>
            <Pill tone={playbook.verdict === 'GO' ? 'good' : playbook.verdict === 'CAUTION' ? 'warn' : 'bad'}>
              Grade {playbook.grade}
            </Pill>
          </div>
        )}

        <div className={`rounded-xl border px-3 py-2.5 text-[11px] ${tone.wrap}`}>{STATE_LINE[thesis.state]}</div>

        {/* The levels the engine is actually arming against - the single most
            important number pair on this panel, so it is stated outright
            rather than left to be inferred from the plan and the range. */}
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={`Trading support (${thesis.levelSource.toLowerCase()})`}
            value={fmt(thesis.support)}
            sub={playbook && thesis.support != null && Math.round(thesis.support) !== Math.round(playbook.plannedSupport)
              ? `plan said ${fmt(playbook.plannedSupport)}`
              : undefined}
          />
          <Stat
            label={`Trading resistance (${thesis.levelSource.toLowerCase()})`}
            value={fmt(thesis.resistance)}
            sub={playbook && thesis.resistance != null && Math.round(thesis.resistance) !== Math.round(playbook.plannedResistance)
              ? `plan said ${fmt(playbook.plannedResistance)}`
              : undefined}
          />
        </div>

        {thesis.checks.length > 0 && (
          <div className="space-y-1">
            {thesis.checks.map(c => (
              <div key={c.id} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-2.5 py-1.5">
                <span
                  className={`mt-px text-[12px] font-black ${
                    c.verdict === 'CONFIRMED' ? 'text-emerald-400' : c.verdict === 'BROKEN' ? 'text-rose-400' : 'text-slate-600'
                  }`}
                >
                  {c.verdict === 'CONFIRMED' ? '\u2713' : c.verdict === 'BROKEN' ? '\u2717' : '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-slate-300">{c.label}</span>
                  <p className="text-[10.5px] leading-snug text-slate-500">{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {thesis.adjustments.length > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-amber-400/90">Adjusted on the fly</p>
            <ul className="mt-1 space-y-0.5">
              {thesis.adjustments.map((a, i) => (
                <li key={i} className="text-[10.5px] leading-snug text-slate-400">
                  \u00b7 {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The AI is a risk officer, not a trader: it appears here, after the
            mechanics, and only ever subtracts. */}
        {aiReady && (
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.05] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-indigo-300">
                <Brain className="h-3 w-3" /> Risk officer
              </span>
              <button
                onClick={onReview}
                disabled={reviewing}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50"
              >
                {reviewing ? 'Reading…' : verdict ? 'Re-check' : `Ask ${aiLabel}`}
              </button>
            </div>
            {verdict ? (
              <>
                <p className="mt-1.5 text-[11px] leading-snug text-slate-300">
                  <span
                    className={`font-bold ${
                      verdict.call === 'BLOCK' ? 'text-rose-300' : verdict.call === 'TRIM' ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {verdict.call}
                  </span>{' '}
                  — {verdict.reason}
                </p>
                {verdict.read && <p className="mt-1 text-[10.5px] italic leading-snug text-slate-500">{verdict.read}</p>}
                {verdict.watchFor.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {verdict.watchFor.map((w, i) => (
                      <li key={i} className="text-[10px] leading-snug text-slate-500">
                        \u00b7 {w}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1.5 font-mono text-[9px] text-slate-600">
                  {verdict.atStr} @ {fmt(verdict.spot)} · can only block or trim, never authorise
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-[10.5px] leading-snug text-slate-500">
                Runs automatically when the range locks at {SNIPER.entryStart}. It can block a trade or shave
                confidence; it can never create one.
              </p>
            )}
          </div>
        )}

        {playbook && (playbook.blockers ?? []).length > 0 && (
          <BlockList items={playbook.blockers.map((m, i) => ({ key: `pb${i}`, message: m }))} />
        )}

        {!playbook && (
          <p className="text-[11px] text-slate-600">
            Run the Pre-Market screen with this morning\'s charts and its levels, verdict and 250-ITM strikes will be
            reconciled here against the live range.
          </p>
        )}
      </div>
    </Card>
  );
};

export const SetupBoard: React.FC<{
  evaluation: SniperEvaluation | null;
  phase: SniperPhase;
  range: OpeningRange | null;
  lots: number;
  lotSize: number;
  armed: boolean;
  busy: boolean;
  tradeTaken: boolean;
  hasPosition: boolean;
  tradingMode: 'PAPER' | 'LIVE';
  onLots: (n: number) => void;
  onExecute: () => void;
}> = ({
  evaluation, phase, range, lots, lotSize, armed, busy, tradeTaken, hasPosition, tradingMode, onLots, onExecute
}) => {
  const setup = evaluation?.setup ?? null;
  return (
    <Card
      title="Today's shot"
      icon={<Rocket className="h-4 w-4 text-emerald-400" />}
      right={
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-500">Lots</label>
          <input
            type="number"
            min={1}
            max={20}
            value={lots}
            onChange={e => onLots(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          />
          <Pill tone={tradingMode === 'LIVE' ? 'bad' : 'info'}>{tradingMode}</Pill>
        </div>
      }
    >
      {setup ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                setup.direction === 'LONG' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
              }`}
            >
              {setup.direction === 'LONG' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black text-slate-100">
                BUY {fmt(setup.strike)} {setup.optionType}
              </div>
              <div className="text-[11px] text-slate-500">
                {setup.symbol} · {setup.itmPoints} pts ITM · {lots} lot{lots > 1 ? 's' : ''} ({lots * lotSize} qty)
              </div>
            </div>
            <Pill tone="good" className="ml-auto">
              {setup.confidence}% confidence
            </Pill>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Entry (spot)" value={fmt(setup.entrySpot)} />
            <Stat label={`Target +${SNIPER.targetPoints}`} value={fmt(setup.targetSpot)} tone="good" />
            <Stat label={`Stop −${SNIPER.stopPoints}`} value={fmt(setup.stopSpot)} tone="bad" />
          </div>

          <ul className="space-y-1 text-xs text-slate-400">
            {setup.reasoning.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>

          <button
            onClick={onExecute}
            disabled={busy || !armed || tradeTaken || hasPosition}
            className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {!armed
              ? 'Arm the sniper to enable execution'
              : tradeTaken
                ? "Today's trade is already taken"
                : `Take the shot — BUY ${fmt(setup.strike)} ${setup.optionType}`}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            <ShieldAlert className="h-4 w-4 text-amber-400" /> No setup — no trade
          </div>
          {evaluation && evaluation.blocks.length > 0 ? (
            <BlockList items={evaluation.blocks.map((b, i) => ({ key: `${b.code}${i}`, message: b.message }))} />
          ) : (
            <p className="text-xs text-slate-500">Waiting for live data…</p>
          )}
          <Checklist
            items={[
              { label: 'Inside the 09:25–09:45 entry window', ok: phase === 'ENTRY_WINDOW' },
              { label: 'Opening range marked', ok: !!range, detail: range ? `${range.samples} ticks` : undefined },
              {
                label: 'Price sitting at a zone',
                ok: evaluation?.zone === 'NEAR_SUPPORT' || evaluation?.zone === 'NEAR_RESISTANCE'
              },
              {
                label: `Signal confidence ≥ ${SNIPER.minEngineConfidence}%`,
                ok: !!evaluation && !evaluation.blocks.some(b => b.code === 'CONFIDENCE')
              },
              {
                label: 'Trend agrees with the zone',
                ok: !!evaluation && !evaluation.blocks.some(b => b.code === 'DIRECTION_CONFLICT')
              },
              { label: 'Daily trade still available', ok: !tradeTaken }
            ]}
          />
        </div>
      )}
    </Card>
  );
};
