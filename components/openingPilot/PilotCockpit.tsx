import React from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, Circle, Clock, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { PilotAssessment, PilotTrade } from '../../services/openingPilotTypes';
import {
  PILOT_PHASES, PilotBucket, PilotGateSummary, PilotPhase, PilotPillar, PilotSignal,
  pilotTradeStats, summarizeGates, TRACK_POLICY
} from '../../services/openingPilotInsights';
import { clock, num, panel, scenarioLabel, signed, tone } from './PilotViews';

const pct = (v: number | null) => v === null ? '--' : `${Math.round(v * 100)}%`;
const PILLAR_LABEL: Record<PilotPillar, string> = { DATA: 'Data quality', CONTEXT: 'Market context', TRIGGER: 'Entry trigger' };

function verdict(a: PilotAssessment) {
  if (a.status === 'PAPER ENTRY READY') {
    return { title: `BUY ${a.side}`, sub: `${a.setup.toLowerCase()} setup confirmed`, ring: 'border-emerald-400/60 bg-emerald-500/10', text: 'text-emerald-300' };
  }
  if (a.status === 'CONTINUATION WATCH' || a.status === 'REVERSAL WATCH') {
    return { title: `WATCH ${a.side ?? ''}`.trim(), sub: a.status.toLowerCase(), ring: 'border-amber-400/50 bg-amber-500/10', text: 'text-amber-300' };
  }
  return { title: 'STAND ASIDE', sub: 'no qualified setup', ring: 'border-white/10 bg-slate-900/80', text: 'text-slate-200' };
}

export function PhaseRail({ phase }: { phase: PilotPhase }) {
  return <ol className="grid grid-cols-4 gap-1" aria-label="Opening workflow phase">
    {PILOT_PHASES.map((p, i) => {
      const state = i < phase.index ? 'done' : i === phase.index ? 'now' : 'next';
      return <li key={p.key} className={`rounded-lg px-2 py-1.5 text-center text-[11px] ${state === 'now' ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50' : state === 'done' ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-950/60 text-slate-500'}`}>
        <b className="block font-mono">{p.time}</b>{p.label}
      </li>;
    })}
  </ol>;
}

export function GaugeRow({ summary }: { summary: PilotGateSummary }) {
  const dir = summary.direction === 1 ? 'up / CE' : 'down / PE';
  return <div>
    <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Distance to trigger / measured {dir}</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{summary.gauges.map(g => <div key={g.key} className="rounded-lg bg-slate-950/70 p-2">
      <div className="flex items-center justify-between text-[11px] text-slate-400"><span>{g.label}</span>{g.pass ? <CheckCircle2 size={12} className="text-emerald-400" /> : null}</div>
      <div className={`font-mono text-sm font-bold ${g.pass ? 'text-emerald-300' : g.value !== null && g.value < 0 ? 'text-rose-300' : 'text-slate-200'}`}>
        {signed(g.value)}<span className="text-[10px] font-normal text-slate-500"> / {g.threshold}{g.unit ? ` ${g.unit}` : ''}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={g.label} aria-valuenow={Math.round(g.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${g.pass ? 'bg-emerald-400' : 'bg-cyan-500'}`} style={{ width: `${Math.round(g.progress * 100)}%` }} />
      </div>
    </div>)}</div>
  </div>;
}

export function GateRail({ summary }: { summary: PilotGateSummary }) {
  return <div className="grid gap-2 sm:grid-cols-3">{(['DATA', 'CONTEXT', 'TRIGGER'] as PilotPillar[]).map(pillar => {
    const { passed, total } = summary.pillars[pillar];
    const done = total > 0 && passed === total;
    return <details key={pillar} className={`group rounded-xl border p-2 ${done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-slate-950/60'}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-slate-200">{done ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Circle size={14} className="text-amber-400" />}{PILLAR_LABEL[pillar]}</span>
        <span className="flex items-center gap-1 font-mono text-slate-400">{passed}/{total}<ChevronRight size={12} className="transition group-open:rotate-90" /></span>
      </summary>
      <ul className="mt-2 space-y-1">{summary.gates.filter(g => g.pillar === pillar).map(g => <li key={g.label} title={g.detail} className="flex items-start gap-1.5 text-[11px]">
        {g.pass ? <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" /> : <Circle size={12} className={`mt-0.5 shrink-0 ${g.required ? 'text-amber-400' : 'text-slate-600'}`} />}
        <span className={g.pass ? 'text-slate-300' : 'text-slate-400'}>{g.label}{!g.required && <span className="text-slate-600"> (reversal only)</span>}</span>
      </li>)}</ul>
    </details>;
  })}</div>;
}

export function PilotCockpit({ assessment, phase, live, readyRecord, positionOpen }: {
  assessment: PilotAssessment;
  phase: PilotPhase;
  live: boolean;
  readyRecord?: PilotBucket | null;
  positionOpen?: boolean;
}) {
  const summary = summarizeGates(assessment);
  const v = verdict(assessment);
  const Arrow = assessment.side === 'PE' ? TrendingDown : TrendingUp;
  return <section className={`${panel} space-y-4`} aria-label="Opening Pilot cockpit">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className={`rounded-2xl border-2 p-4 ${v.ring}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Pilot verdict{live ? '' : ' / replay'}</p>
            <p className={`mt-1 flex items-center gap-2 text-3xl font-black md:text-4xl ${v.text}`} role="status" aria-live="polite">
              {assessment.side && assessment.status !== 'WAIT' && <Arrow size={30} />}{v.title}
            </p>
            <p className="mt-0.5 text-sm capitalize text-slate-300">{v.sub}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold text-white">{num(assessment.spot)}</p>
            <p className="text-[11px] text-slate-500">Nifty{assessment.snapshotAt ? ` @ ${clock(assessment.snapshotAt)}` : ''}</p>
            {assessment.scenario && <p className="mt-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-300">{scenarioLabel[assessment.scenario]}</p>}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Required gates passed" aria-valuenow={summary.required.passed} aria-valuemin={0} aria-valuemax={summary.required.total}>
            <div className={`h-full rounded-full ${assessment.status === 'PAPER ENTRY READY' ? 'bg-emerald-400' : 'bg-cyan-500'}`} style={{ width: `${summary.required.total ? summary.required.passed / summary.required.total * 100 : 0}%` }} />
          </div>
          <span className="font-mono text-xs text-slate-300">{summary.required.passed}/{summary.required.total} gates</span>
        </div>
        {positionOpen
          ? <p className="mt-3 flex items-start gap-2 text-sm text-cyan-200"><Target size={16} className="mt-0.5 shrink-0" />A paper position is open. Exits at the fixed ±10% premium are monitored automatically.</p>
          : summary.blocker
            ? <p className="mt-3 flex items-start gap-2 text-sm text-amber-200"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span><b>Next blocker:</b> {summary.blocker}</span></p>
            : <p className="mt-3 flex items-start gap-2 text-sm text-emerald-200"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{assessment.reason}</p>}
        {readyRecord && readyRecord.signals > 0 && <p className="mt-2 text-[11px] text-slate-400">
          READY track record: {readyRecord.wins}W / {readyRecord.losses}L{readyRecord.hitRate !== null ? ` (${pct(readyRecord.hitRate)})` : ''}
          {readyRecord.meaningful ? '' : ` / under ${TRACK_POLICY.minSample} resolved signals, not yet evidence`}
        </p>}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold text-white"><Clock size={14} className="text-cyan-400" />{phase.label}</p>
          {phase.minutesToNext !== null && phase.nextLabel && <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">{phase.nextLabel} in {phase.minutesToNext}m</span>}
        </div>
        <PhaseRail phase={phase} />
        <p className="text-xs text-slate-400">{phase.hint}</p>
        <GateRail summary={summary} />
      </div>
    </div>
    <GaugeRow summary={summary} />
  </section>;
}

export function PilotTrackRecord({ buckets, signals, trades }: { buckets: PilotBucket[]; signals: PilotSignal[]; trades: PilotTrade[] }) {
  const stats = pilotTradeStats(trades);
  return <section className={panel}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-sm font-bold text-white">Measured accuracy / the pilot grading itself</h2>
      <span className="text-[11px] text-slate-500">From recorded minute frames only. No backfill, no tuning.</span>
    </div>
    <p className="mt-1 text-xs text-slate-500">
      Each signal is the first minute a status appears. Win = Nifty moves {TRACK_POLICY.bracketPoints} pts in the signal's favour before {TRACK_POLICY.bracketPoints} pts against,
      within {TRACK_POLICY.windowMin} minutes (a rough proxy for ±10% on a 200-ITM premium). Ranges are 95% Wilson intervals.
    </p>
    <div className="mt-3 grid gap-3 md:grid-cols-4">
      {buckets.map(b => <div key={b.status} className={`rounded-xl border p-3 ${b.status === 'PAPER ENTRY READY' ? 'border-emerald-500/30' : 'border-white/10'} bg-slate-950/60`}>
        <p className="text-[11px] uppercase tracking-wider text-slate-400">{b.status === 'PAPER ENTRY READY' ? 'READY signals' : b.status.toLowerCase()}</p>
        <p className="mt-1 font-mono text-2xl font-bold text-white">{pct(b.hitRate)}</p>
        <p className="text-[11px] text-slate-400">{b.ci ? `95%: ${pct(b.ci[0])} to ${pct(b.ci[1])}` : 'No resolved signals'}</p>
        <p className="mt-1 text-[11px] text-slate-500">{b.wins}W / {b.losses}L / {b.timeouts} flat{b.pending ? ` / ${b.pending} pending` : ''} / avg 20m {signed(b.avgMove20)} pts</p>
        {!b.meaningful && <p className="mt-1 text-[11px] text-amber-300/80">Under {TRACK_POLICY.minSample} resolved; not yet evidence.</p>}
      </div>)}
      <div className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-3">
        <p className="text-[11px] uppercase tracking-wider text-slate-400">Paper trades (sampled)</p>
        <p className={`mt-1 font-mono text-2xl font-bold ${tone(stats.netPnl)}`}>Rs {num(stats.netPnl, 0)}</p>
        <p className="text-[11px] text-slate-400">{stats.sampled ? `${stats.wins}/${stats.sampled} net winners (${pct(stats.winRate)})` : 'No sampled exits yet'}</p>
        <p className="mt-1 text-[11px] text-slate-500">Overrides: {stats.overrides} / Rs {num(stats.overrideNet, 0)}{stats.reconciled ? ` / reconciled ${stats.reconciled} kept separate` : ''}</p>
      </div>
    </div>
    {signals.length > 0 && <div className="mt-3 max-h-64 overflow-auto">
      <table className="w-full whitespace-nowrap text-left text-xs">
        <thead className="sticky top-0 bg-slate-900 text-slate-500"><tr>{['Day', 'IST', 'Signal', 'Nifty', '10m', '20m', 'Best / worst', 'Outcome'].map(h => <th key={h} className="px-2 py-1.5">{h}</th>)}</tr></thead>
        <tbody>{signals.slice(0, 60).map(s => <tr key={`${s.day}:${s.at}`} className="border-t border-white/5">
          <td className="px-2 py-1.5 text-slate-500">{s.day}</td>
          <td className="px-2 py-1.5 text-slate-400">{clock(s.at)}</td>
          <td className="px-2 py-1.5 text-slate-200">{s.status === 'PAPER ENTRY READY' ? 'READY' : s.status.split(' ')[0]} {s.side}</td>
          <td className="px-2 py-1.5 font-mono text-slate-300">{num(s.entrySpot)}</td>
          <td className={`px-2 py-1.5 font-mono ${tone(s.move10)}`}>{signed(s.move10)}</td>
          <td className={`px-2 py-1.5 font-mono ${tone(s.move20)}`}>{signed(s.move20)}</td>
          <td className="px-2 py-1.5 font-mono text-slate-400">{signed(s.mfe)} / {signed(s.mae)}</td>
          <td className={`px-2 py-1.5 font-bold ${s.outcome === 'WIN' ? 'text-emerald-300' : s.outcome === 'LOSS' ? 'text-rose-300' : 'text-slate-400'}`}>{s.outcome}{s.samplingGap ? <span className="font-normal text-amber-300" title="A minute is missing inside the window; bracket order is uncertain."> *gap</span> : null}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {!signals.length && <p className="mt-3 text-sm text-slate-500">No recorded signals yet. Keep evidence recording on during the open and this fills in automatically.</p>}
  </section>;
}
