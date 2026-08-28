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
import { ArrowDownRight, ArrowUpRight, FileText, Radar, RefreshCw, Rocket, ShieldAlert } from 'lucide-react';
import { SNIPER, SniperPlaybook } from '../../services/sniperPlaybook';
import { OpeningRange, SniperEvaluation, SniperPhase } from '../../services/sniperEngine';
import { BlockList, Card, Checklist, Pill, Stat } from './shared';

export const fmt = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');

export interface Handoff {
  sDelta: number;
  rDelta: number;
  tight: boolean;
}

export const RangeBoard: React.FC<{
  range: OpeningRange | null;
  spot: number | null;
  evaluation: SniperEvaluation | null;
}> = ({ range, spot, evaluation }) => {
  const zonePct =
    range && spot != null
      ? Math.max(0, Math.min(100, ((spot - range.support) / Math.max(1, range.resistance - range.support)) * 100))
      : null;

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

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Support {fmt(range.support)}</span>
              <span className="font-semibold text-slate-300">
                Spot {fmt(spot)}
                {evaluation?.zone && (
                  <span className="ml-2 text-slate-500">{evaluation.zone.replace(/_/g, ' ').toLowerCase()}</span>
                )}
              </span>
              <span>Resistance {fmt(range.resistance)}</span>
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
            Room wall to wall: <span className="font-semibold text-slate-200">{range.resistance - range.support} pts</span>
            {range.resistance - range.support < SNIPER.minZoneWidth && (
              <span className="ml-2 text-rose-300">too tight for a {SNIPER.targetPoints}-point target</span>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export const HandoffBoard: React.FC<{
  playbook: SniperPlaybook | null;
  handoff: Handoff | null;
  onReload: () => void;
}> = ({ playbook, handoff, onReload }) => (
  <Card
    title="Pre-market plan"
    icon={<FileText className="h-4 w-4 text-emerald-400" />}
    right={
      <button
        onClick={onReload}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800"
      >
        <RefreshCw className="h-3 w-3" /> Reload
      </button>
    }
  >
    {!playbook ? (
      <p className="py-6 text-center text-xs text-slate-500">
        No plan for today. Run the Pre-Market screen with this morning's charts and the verdict, zones and 250-ITM
        strikes will appear here.
      </p>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-100">{playbook.verdictHeadline}</div>
            <p className="mt-0.5 text-[11px] text-slate-500">{playbook.verdictReason}</p>
          </div>
          <Pill tone={playbook.verdict === 'GO' ? 'good' : playbook.verdict === 'CAUTION' ? 'warn' : 'bad'}>
            Grade {playbook.grade}
          </Pill>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Planned support" value={fmt(playbook.plannedSupport)} />
          <Stat label="Planned resistance" value={fmt(playbook.plannedResistance)} />
        </div>

        {handoff ? (
          <div
            className={`rounded-xl border px-3 py-2.5 text-[11px] ${
              handoff.tight
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}
          >
            {handoff.tight ? (
              <>
                <strong>Confluence.</strong> The live 5-minute range agrees with last night's charts (support{' '}
                {handoff.sDelta >= 0 ? '+' : ''}
                {handoff.sDelta}, resistance {handoff.rDelta >= 0 ? '+' : ''}
                {handoff.rDelta}). This is the highest-conviction version of the setup.
              </>
            ) : (
              <>
                <strong>Levels moved.</strong> The live range differs from the plan (support{' '}
                {handoff.sDelta >= 0 ? '+' : ''}
                {handoff.sDelta}, resistance {handoff.rDelta >= 0 ? '+' : ''}
                {handoff.rDelta}). Trade the live range — the chart levels are stale.
              </>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-600">Waiting for the live range to compare against.</p>
        )}

        {(playbook.blockers ?? []).length > 0 && (
          <BlockList items={playbook.blockers.map((m, i) => ({ key: `pb${i}`, message: m }))} />
        )}
      </div>
    )}
  </Card>
);

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
