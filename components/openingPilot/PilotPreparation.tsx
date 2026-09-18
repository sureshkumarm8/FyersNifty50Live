import React, { useEffect, useState } from 'react';
import { DailyArchive } from '../../types';
import { dbService } from '../../services/db';
import { istDayKey } from '../../services/sniperEngine';
import { classifyPilotGap } from '../../services/openingPilot';
import { PilotObservation, PilotPlan, PilotScenarioPlan, PilotWallTrend } from '../../services/openingPilotTypes';
import { buttonClass, clock, Field, inputClass, num, panel, PriceChart, primaryClass, scenarioLabel } from './PilotViews';

const scenarioDefaults: PilotScenarioPlan[] = [
  { scenario: 'FLAT', expectation: 'Range or breakout from the opening balance.', confirmation: 'Price leaves consolidation with aligned momentum and room to the wall.', invalidation: 'Repeated failed breaks or conflicting sentiment.' },
  { scenario: 'UP_50', expectation: 'Watch continuation versus a gap fade.', confirmation: 'Opening support holds; recent momentum agrees with price.', invalidation: 'Opening support fails or overhead room disappears.' },
  { scenario: 'UP_100', expectation: 'Avoid chasing; watch acceptance or rejection of the gap.', confirmation: 'A pullback holds above support, or resistance rejection confirms a fade.', invalidation: 'Price stalls while sentiment weakens; no clean confirmation.' },
  { scenario: 'DOWN_50', expectation: 'Watch continuation down versus recovery.', confirmation: 'Resistance holds with negative momentum and room below.', invalidation: 'Resistance is reclaimed or downside room disappears.' },
  { scenario: 'DOWN_100', expectation: 'Avoid chasing; watch gap acceptance or recovery.', confirmation: 'A bounce rejects resistance, or support rejection confirms recovery.', invalidation: 'Price stops falling while sentiment improves; no clean confirmation.' }
];
const toInputTime = (at: number) => `${istDayKey(at)}T${clock(at).slice(0, 5)}`;
const optionalPositive = (value: string, label: string) => {
  if (!value.trim()) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} must be a positive number.`);
  return n;
};

export function PlanEditor({ day, initial, disabled, onSave }: {
  day: string; initial: PilotPlan | null; disabled: boolean; onSave: (plan: PilotPlan) => Promise<void>;
}) {
  const [close, setClose] = useState(initial ? String(initial.previousClose) : '');
  const [bands, setBands] = useState(initial ? [initial.flatBand, initial.mediumBand, initial.outerBand].map(String) : ['25', '75', '150']);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [scenarios, setScenarios] = useState(initial?.scenarios ?? scenarioDefaults);
  const [archives, setArchives] = useState<DailyArchive[]>([]);
  const [archiveDay, setArchiveDay] = useState('');
  const [error, setError] = useState('');
  const [archiveError, setArchiveError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    void dbService.getArchives(20).then(rows => {
      if (alive) {
        const prior = rows.filter(row => row.date < day);
        setArchives(prior);
        setArchiveDay(prior[0]?.date ?? '');
      }
    }).catch(e => { if (alive) setArchiveError(`Archive load failed: ${e instanceof Error ? e.message : String(e)}`); });
    return () => { alive = false; };
  }, [day]);
  const archive = archives.find(row => row.date === archiveDay);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const previousClose = optionalPositive(close, 'Previous close');
      if (!previousClose) throw new Error('Enter the previous cash-session close.');
      const [flatBand, mediumBand, outerBand] = bands.map(Number);
      classifyPilotGap(0, { flatBand, mediumBand, outerBand });
      await onSave({ id: crypto.randomUUID(), day, savedAt: Date.now(), previousClose, flatBand, mediumBand, outerBand, notes: notes.trim(), scenarios });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  };
  return <section className={panel}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-bold text-white">08:55 / Five-scenario morning plan</h2>
      <span className="text-xs text-slate-500">{initial ? `Revision saved ${clock(initial.savedAt)} IST` : 'Draft / not saved'}</span></div>
    <p className="mt-2 text-xs text-slate-400">Editable hypotheses, not predictions. Saving creates a new revision; previous decisions keep their original plan.</p>
    <details className="my-3 rounded-xl border border-white/10 p-3">
      <summary className="cursor-pointer text-xs font-bold text-cyan-300">Previous-session reference / read-only archive</summary>
      {archiveError && <p role="alert" className="mt-2 text-xs text-rose-300">{archiveError}</p>}
      {!archives.length && !archiveError && <p className="mt-2 text-xs text-slate-500">No prior sessions archived in this browser. Review your external charts and record the levels below.</p>}
      {!!archives.length && <div className="mt-3 space-y-2">
        <Field label="Archived session"><select className={inputClass} value={archiveDay} onChange={e => setArchiveDay(e.target.value)}>{archives.map(a => <option key={a.date} value={a.date}>{a.date}</option>)}</select></Field>
        {archive && <>
          <p className="text-xs text-slate-400">O {num(archive.summary.open)} / H {num(archive.summary.high)} / L {num(archive.summary.low)} / C {num(archive.summary.close)}</p>
          <PriceChart points={archive.snapshots.filter(s => s.timestamp).map(s => ({ at: s.timestamp!, value: s.niftyLtp })).sort((a, b) => a.at - b.at)} label={`Archived Nifty samples for ${archive.date}`} />
          <button type="button" className={buttonClass} disabled={disabled} onClick={() => setClose(String(archive.summary.close))}>Use this session's close</button>
        </>}
      </div>}
    </details>
    <form onSubmit={save} className="space-y-3">
      <fieldset disabled={disabled || busy} className="space-y-3 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label="Previous Nifty cash close"><input required type="number" min="1" step="0.05" className={inputClass} value={close} onChange={e => setClose(e.target.value)} /></Field>
          {['Flat band (+/- pts)', '~50 band upper edge', '~100 band upper edge'].map((label, i) => <Field key={label} label={label}>
            <input required type="number" min={i === 0 ? 0 : 1} className={inputClass} value={bands[i]} onChange={e => setBands(bands.map((v, j) => i === j ? e.target.value : v))} />
          </Field>)}
        </div>
        <Field label="Previous-day chart read / levels / context"><textarea rows={2} maxLength={4000} className={inputClass} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What held yesterday? Where is the range? What would change your mind?" /></Field>
        <div className="grid gap-3 lg:grid-cols-5">
          {scenarios.map((scenario, index) => <div key={scenario.scenario} className="space-y-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
            <h3 className="text-xs font-bold text-cyan-300">{scenarioLabel[scenario.scenario]}</h3>
            {(['expectation', 'confirmation', 'invalidation'] as const).map(key => <Field key={key} label={key}>
              <textarea rows={3} maxLength={1000} className={`${inputClass} text-xs`} value={scenario[key]} onChange={e => setScenarios(scenarios.map((s, i) => i === index ? { ...s, [key]: e.target.value } : s))} />
            </Field>)}
          </div>)}
        </div>
        <button className={primaryClass} type="submit">{busy ? 'Saving...' : 'Save plan revision'}</button>
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </form>
  </section>;
}

export function ObservationEditor({ day, initial, disabled, onSave }: {
  day: string; initial: PilotObservation | null; disabled: boolean; onSave: (value: PilotObservation) => Promise<void>;
}) {
  const [observed, setObserved] = useState(toInputTime(Date.now()));
  const [preOpen, setPreOpen] = useState('');
  const [gift, setGift] = useState('');
  const [support, setSupport] = useState(initial?.support == null ? '' : String(initial.support));
  const [resistance, setResistance] = useState(initial?.resistance == null ? '' : String(initial.resistance));
  const [supportTrend, setSupportTrend] = useState<PilotWallTrend>(initial?.supportTrend ?? 'UNKNOWN');
  const [resistanceTrend, setResistanceTrend] = useState<PilotWallTrend>(initial?.resistanceTrend ?? 'UNKNOWN');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const now = Date.now();
      const observedAt = new Date(`${observed}:00+05:30`).getTime();
      if (!Number.isFinite(observedAt) || observedAt > now || istDayKey(observedAt) !== day) throw new Error('Observation time must be today in IST and cannot be in the future.');
      const s = optionalPositive(support, 'Support');
      const r = optionalPositive(resistance, 'Resistance');
      if ((s == null) !== (r == null) || (s != null && r != null && s >= r)) throw new Error('Enter both OI walls with support below resistance, or leave both blank.');
      const p = optionalPositive(preOpen, 'Pre-open price');
      const giftChange = gift.trim() ? Number(gift) : null;
      if (giftChange !== null && !Number.isFinite(giftChange)) throw new Error('GIFT change must be a finite signed point value.');
      if (p == null && giftChange == null && s == null && !notes.trim()) throw new Error('Add a pre-open price, GIFT change, OI walls, or an observation note.');
      await onSave({ id: crypto.randomUUID(), day, recordedAt: now, observedAt, preOpen: p, giftChange, support: s, resistance: r, supportTrend, resistanceTrend, notes: notes.trim() });
      setNotes('');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className={panel}>
    <h2 className="text-sm font-bold text-white">09:10 onward / Add observed evidence</h2>
    <p className="mt-2 text-xs text-slate-400">Manual inputs only. GIFT change is versus its own previous settlement, not an exact cash opening gap. Re-observe walls before refreshing their timestamp.</p>
    <form onSubmit={save} className="mt-3 space-y-3">
      <fieldset disabled={disabled || busy} className="space-y-3 disabled:opacity-60">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label="Observed time (IST)"><input required type="datetime-local" className={inputClass} value={observed} onChange={e => setObserved(e.target.value)} /></Field>
          <div className="flex items-end"><button type="button" className={buttonClass} onClick={() => setObserved(toInputTime(Date.now()))}>I observed this now</button></div>
          <Field label="Indicative cash pre-open (optional)"><input type="number" min="1" step="0.05" className={inputClass} value={preOpen} onChange={e => setPreOpen(e.target.value)} /></Field>
          <Field label="GIFT change in points (optional)"><input type="number" step="0.05" className={inputClass} value={gift} onChange={e => setGift(e.target.value)} /></Field>
          <Field label="Put-OI support strike"><input type="number" min="1" step="0.05" className={inputClass} value={support} onChange={e => setSupport(e.target.value)} /></Field>
          <Field label="Support OI change"><select className={inputClass} value={supportTrend} onChange={e => setSupportTrend(e.target.value as PilotWallTrend)}>{['UNKNOWN', 'BUILDING', 'UNCHANGED', 'UNWINDING'].map(v => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Call-OI resistance strike"><input type="number" min="1" step="0.05" className={inputClass} value={resistance} onChange={e => setResistance(e.target.value)} /></Field>
          <Field label="Resistance OI change"><select className={inputClass} value={resistanceTrend} onChange={e => setResistanceTrend(e.target.value as PilotWallTrend)}>{['UNKNOWN', 'BUILDING', 'UNCHANGED', 'UNWINDING'].map(v => <option key={v}>{v}</option>)}</select></Field>
        </div>
        <Field label="What changed on Nifty / Sensibull?"><textarea rows={2} maxLength={2000} className={inputClass} value={notes} onChange={e => setNotes(e.target.value)} /></Field>
        <button type="submit" className={primaryClass}>{busy ? 'Saving...' : 'Save timestamped observation'}</button>
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    </form>
  </section>;
}
