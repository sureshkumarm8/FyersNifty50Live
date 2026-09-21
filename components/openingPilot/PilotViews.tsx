import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { PilotAssessment, PilotFrame, PilotObservation, PilotScenario } from '../../services/openingPilotTypes';

export const panel = 'rounded-2xl border border-white/10 bg-slate-900/70 p-4';
export const inputClass = 'w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-40';
export const buttonClass = 'rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed';
export const primaryClass = 'rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed';
export const num = (v: number | null | undefined, places = 1) =>
  v == null || !Number.isFinite(v) ? '--' : v.toLocaleString('en-IN', { maximumFractionDigits: places, minimumFractionDigits: places });
export const signed = (v: number | null | undefined, places = 1) =>
  v == null || !Number.isFinite(v) ? '--' : `${v > 0 ? '+' : ''}${num(v, places)}`;
export const clock = (at: number) => new Date(at).toLocaleTimeString('en-IN', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
});
export const scenarioLabel: Record<PilotScenario, string> = {
  FLAT: 'Flat', UP_50: 'Gap up ~50', UP_100: 'Gap up ~100',
  DOWN_50: 'Gap down ~50', DOWN_100: 'Gap down ~100', OUTSIDE: 'Outside planned range'
};
export const tone = (v: number | null) => v == null || v === 0 ? 'text-slate-300' : v > 0 ? 'text-emerald-300' : 'text-rose-300';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0 space-y-1 text-xs text-slate-400"><span>{label}</span>{children}</label>;
}

export function PriceChart({ points, support, resistance, label = 'Sampled Nifty prices' }: {
  points: { at: number; value: number }[];
  support?: number | null;
  resistance?: number | null;
  label?: string;
}) {
  const valid = points.filter(p => Number.isFinite(p.at) && Number.isFinite(p.value) && p.value > 0);
  if (!valid.length) return <div className="flex h-40 items-center justify-center rounded-xl bg-slate-950 text-sm text-slate-500">No timestamped price samples yet.</div>;
  const prices = valid.map(p => p.value);
  const levels = [support, resistance].filter((v): v is number => v != null && Number.isFinite(v) && v > 0);
  const min = Math.min(...prices, ...levels) - 5;
  const max = Math.max(...prices, ...levels) + 5;
  const start = valid[0].at;
  const span = Math.max(60_000, valid[valid.length - 1].at - start);
  const x = (at: number) => 12 + (at - start) / span * 630;
  const y = (price: number) => 160 - (price - min) / (max - min) * 140;
  const path = valid.map((p, i) => `${i === 0 || p.at - valid[i - 1].at > 90_000 ? 'M' : 'L'}${x(p.at)},${y(p.value)}`).join(' ');
  return <div className="rounded-xl bg-slate-950 p-2">
    <svg viewBox="0 0 740 190" className="w-full" role="img" aria-label={label}>
      {[min, (min + max) / 2, max].map(v => <g key={v}>
        <line x1="12" y1={y(v)} x2="642" y2={y(v)} stroke="#334155" strokeDasharray="3 6" />
        <text x="653" y={y(v) + 4} fill="#94a3b8" fontSize="11">{num(v)}</text>
      </g>)}
      {levels.map((v, i) => <g key={`${v}:${i}`}>
        <line x1="12" y1={y(v)} x2="642" y2={y(v)} stroke={v === support ? '#34d399' : '#fb7185'} strokeDasharray="6 4" />
        <text x="18" y={y(v) - 5} fill={v === support ? '#34d399' : '#fb7185'} fontSize="10">{v === support ? 'Support' : 'Resistance'} {num(v)}</text>
      </g>)}
      <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2" />
      {valid.length === 1 && <circle cx={x(valid[0].at)} cy={y(valid[0].value)} r="3" fill="#22d3ee" />}
      <text x="12" y="185" fill="#64748b" fontSize="11">{clock(start)}</text>
      <text x="574" y="185" fill="#64748b" fontSize="11">{clock(valid[valid.length - 1].at)}</text>
    </svg>
  </div>;
}

export function AssessmentPanel({ value }: { value: PilotAssessment }) {
  const ready = value.status === 'PAPER ENTRY READY';
  return <section className={`${panel} ${ready ? 'border-emerald-500/40' : ''}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-white">Pilot decision</h2>
      <span className="text-xs text-slate-500">Rules v1 / not a win probability</span>
    </div>
    <div className={`mt-3 text-xl font-black ${ready ? 'text-emerald-300' : 'text-amber-300'}`}>{value.status}</div>
    <div className="mt-1 text-sm text-slate-300">{value.side ? `Buy ${value.side} watch / ${value.setup.toLowerCase()}` : 'No directional entry'}</div>
    <p className="my-3 text-sm leading-relaxed text-slate-400">{value.reason}</p>
    <div className="space-y-2">{value.checks.map((check, i) => <div key={`${check.label}:${i}`} className="flex items-start gap-2 rounded-lg bg-slate-950/70 p-2">
      {check.pass ? <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" /> : <Circle size={15} className="mt-0.5 shrink-0 text-amber-400" />}
      <div><p className="text-xs font-semibold text-slate-200">{check.label}</p><p className="text-xs text-slate-500">{check.detail}</p></div>
    </div>)}</div>
  </section>;
}

export function EvidenceMetrics({ assessment: a }: { assessment: PilotAssessment }) {
  const items = [
    ['Nifty sample', num(a.spot), null],
    ['Day sentiment', signed(a.daySentiment), a.daySentiment],
    ['5m sentiment change', `${signed(a.sentimentDelta)} pp`, a.sentimentDelta],
    ['1m / 5m spot move', `${signed(a.move1m)} / ${signed(a.move5m)}`, a.move5m],
  ] as const;
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{items.map(([label, value, trend]) =>
    <div key={label} className={panel}><div className="text-xs text-slate-500">{label}</div><div className={`mt-1 font-mono text-lg font-bold ${tone(trend)}`}>{value}</div></div>
  )}</div>;
}

export function WallPanel({ observation, assessment, at }: {
  observation: PilotObservation | null; assessment: PilotAssessment; at: number;
}) {
  const age = observation ? Math.max(0, (at - observation.observedAt) / 60_000) : null;
  return <section className={panel}>
    <h2 className="text-sm font-bold text-white">OI walls / {observation?.source?.kind === 'VISION' ? 'reused Vision + Sensibull read' : observation?.source?.kind === 'PREMARKET' ? 'reused premarket chart capture' : observation ? 'manual fallback' : 'waiting for shared Vision evidence'}</h2>
    <p className={`mt-1 text-xs ${age == null || age > 5 ? 'text-amber-300' : 'text-slate-400'}`}>
      {observation ? `Observed ${clock(observation.observedAt)} IST / ${num(age)}m old` : 'No observation saved.'}
      {' '}Freshness follows the original capture, not the time the pilot reads it.
    </p>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
        <p className="text-xs text-emerald-400">Put-OI support</p><p className="text-xl font-bold text-white">{num(observation?.support)}</p>
        <p className="text-xs text-slate-400">{observation?.vision ? (observation.vision.supportRepeated ? 'Same level in two captured Vision reads' : 'First read / wall not yet repeated') : observation?.supportTrend ?? 'UNKNOWN'}</p>
      </div>
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
        <p className="text-xs text-rose-400">Call-OI resistance</p><p className="text-xl font-bold text-white">{num(observation?.resistance)}</p>
        <p className="text-xs text-slate-400">{observation?.vision ? (observation.vision.resistanceRepeated ? 'Same level in two captured Vision reads' : 'First read / wall not yet repeated') : observation?.resistanceTrend ?? 'UNKNOWN'}</p>
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-400">Opening sample range: {num(assessment.openingLow)} - {num(assessment.openingHigh)}. Directional wall distance: {num(assessment.wallDistance)} pts.</p>
    {observation?.vision && <div className="mt-3 space-y-2 rounded-xl bg-slate-950 p-3 text-xs">
      <p className="font-bold uppercase text-cyan-300">Vision: {observation.vision.bias}</p>
      <p className="text-slate-300"><b>Nifty structure:</b> {observation.vision.priceAction}</p>
      <p className="text-slate-300"><b>OI changes:</b> {observation.vision.oiRead}</p>
      <p className="text-slate-400">{observation.vision.combinedView}</p>
      {observation.vision.watchFor.length > 0 && <p className="text-slate-400">Watch: {observation.vision.watchFor.join(' / ')}</p>}
      {observation.vision.risks.length > 0 && <p className="text-amber-300">Risks: {observation.vision.risks.join(' / ')}</p>}
    </div>}
    {observation?.notes && !observation.vision && <p className="mt-2 text-xs text-slate-400">{observation.notes}</p>}
    <p className="mt-2 text-xs text-slate-500">Touching a wall is not a reversal. Repeated wall levels do not establish OI quantity changes or writing. Stale, failed or contradictory Vision reads cannot confirm a new entry.</p>
  </section>;
}

export function FrameTimeline({ frames }: { frames: PilotFrame[] }) {
  return <div className="overflow-x-auto">
    <table className="w-full whitespace-nowrap text-left text-xs">
      <thead className="text-slate-500"><tr>{['IST', 'Nifty', 'Day sent.', '5m change', 'Options sent.', 'Call / Put OI', 'Pilot / what changed'].map(h => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
      <tbody>{frames.slice(-30).reverse().map(frame => <tr key={frame.id} className="border-t border-white/5">
        <td className="px-2 py-2 text-slate-400">{clock(frame.at)}</td>
        <td className="px-2 py-2 font-mono text-white">{num(frame.assessment.spot)}</td>
        <td className={`px-2 py-2 ${tone(frame.assessment.daySentiment)}`}>{signed(frame.assessment.daySentiment)}</td>
        <td className={`px-2 py-2 ${tone(frame.assessment.sentimentDelta)}`}>{signed(frame.assessment.sentimentDelta)} pp</td>
        <td className={`px-2 py-2 ${tone(frame.optionsSentiment)}`}>{signed(frame.optionsSentiment)}</td>
        <td className="px-2 py-2 text-slate-400">{num(frame.callsOI == null ? null : frame.callsOI / 1e6, 2)} / {num(frame.putsOI == null ? null : frame.putsOI / 1e6, 2)} M</td>
        <td className="max-w-md whitespace-normal px-2 py-2 text-slate-300"><b>{frame.assessment.status}</b><br /><span className="text-slate-500">{frame.assessment.reason}</span></td>
      </tr>)}</tbody>
    </table>
    {!frames.length && <p className="flex items-center gap-2 py-5 text-sm text-slate-500"><Clock size={16} />Live minute evidence will appear here when recording is on.</p>}
  </div>;
}
