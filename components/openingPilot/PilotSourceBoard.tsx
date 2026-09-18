import React from 'react';
import { MarketSnapshot } from '../../types';
import { PilotObservation, PilotPlan } from '../../services/openingPilotTypes';
import { PilotSourceUpdate } from '../../services/openingPilotSources';
import { istDayKey, istMinutesOf } from '../../services/sniperEngine';
import { PilotSharedSources } from './usePilotSources';
import { buttonClass, clock, num, panel, scenarioLabel } from './PilotViews';

export function PilotSourceBoard({ shared, update, plan, observation, history, now, onNavigate }: {
  shared: PilotSharedSources;
  update: PilotSourceUpdate;
  plan: PilotPlan | null;
  observation: PilotObservation | null;
  history: MarketSnapshot[];
  now: number;
  onNavigate?: (view: 'premarket' | 'vision' | 'history') => void;
}) {
  const today = istDayKey(now);
  const samples = history.filter(s => Number.isFinite(s.timestamp) && s.timestamp! <= now && istDayKey(s.timestamp!) === today)
    .sort((a, b) => b.timestamp! - a.timestamp!);
  const fresh = !!samples[0]?.timestamp && now - samples[0].timestamp <= 90_000;
  const cards = [
    { label: '08:55 - 09:25 / PreMkt', text: update.premarketStatus, view: 'premarket' as const,
      detail: plan?.source ? `${plan.source.label} / original ${clock(plan.source.at)} IST` : 'Waiting for existing PreMkt analysis; no duplicate form required.' },
    { label: '09:15 onward / Minute history', text: fresh ? 'Connected to the same Day Sentiment & Momentum History feed.' : 'Waiting for fresh current-session minute history.',
      view: 'history' as const, detail: `${samples.length} samples today${samples[0]?.timestamp ? ` / latest ${clock(samples[0].timestamp)} IST` : ''}` },
    { label: 'Live / Vision + Sensibull', text: update.visionStatus, view: 'vision' as const,
      detail: observation?.source?.kind === 'VISION' ? `${observation.source.label} / capture ${clock(observation.observedAt)} IST` : 'Reads the existing Vision service and imported archive automatically.' }
  ];
  return <section className={`${panel} border-cyan-500/25`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-bold text-cyan-300">Connected workflow / no duplicate analysis</h2>
      <span className="text-xs text-slate-500">{shared.loading ? 'Connecting existing sources...' : `Sources checked ${shared.checkedAt ? clock(shared.checkedAt) : '--'} IST`}</span>
    </div>
    <div className="mt-3 grid gap-3 lg:grid-cols-3">{cards.map(card => <div key={card.label} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
      <h3 className="text-xs font-bold text-white">{card.label}</h3><p className="mt-2 text-xs text-slate-300">{card.text}</p>
      <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
      {onNavigate && <button className={`${buttonClass} mt-3`} onClick={() => onNavigate(card.view)}>Open existing {card.view === 'premarket' ? 'PreMkt' : card.view === 'vision' ? 'Vision' : 'History'}</button>}
    </div>)}</div>
    <p className="mt-3 text-xs text-slate-400">{istMinutesOf(new Date(now)) >= 565
      ? '09:25 handoff: the last available premarket checkpoint is frozen; minute history and fresh Vision now drive the setup.'
      : 'The existing PreMkt checkpoint engine stays active while this screen is open before 09:25. Its saved updates are reused here automatically.'}</p>
    {plan && <>
      <h3 className="mt-4 text-xs font-bold text-white">Five opening scenarios / {plan.source ? 'reused market analysis' : 'manual fallback'}</h3>
      <p className="mt-1 text-xs text-slate-500">Reference close {num(plan.previousClose)}. Scenario context only; the pilot retains 200-ITM contracts and +/-10% premium exits.</p>
      <div className="mt-3 grid gap-2 md:grid-cols-5">{plan.scenarios.map(s => <div key={s.scenario} className="rounded-xl border border-white/10 bg-slate-950 p-3">
        <h4 className="text-xs font-bold text-cyan-300">{scenarioLabel[s.scenario]}</h4>
        <p className="mt-2 text-xs text-slate-300">{s.expectation}</p>
        <p className="mt-2 text-xs text-emerald-300">Confirm: {s.confirmation}</p>
        <p className="mt-2 text-xs text-amber-300">Invalidate: {s.invalidation}</p>
      </div>)}</div>
    </>}
    {shared.errors.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-xs text-amber-300">Source availability / {shared.errors.length} notice(s)</summary>
      <div className="mt-2 space-y-1">{shared.errors.map((error, index) => <p key={index} className="text-xs text-slate-400">{error}</p>)}</div>
    </details>}
  </section>;
}
