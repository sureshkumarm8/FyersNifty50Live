import React, { useEffect, useMemo, useState } from 'react';
import { FyersQuote } from '../../types';
import { computeCharges } from '../../services/paperTradingService';
import { pilotExpiry, pilotPremiumLevels, selectPilotContract } from '../../services/openingPilot';
import { istDayKey } from '../../services/sniperEngine';
import { PilotAssessment, PilotDecision, PilotPosition, PilotSide, PilotTrade } from '../../services/openingPilotTypes';
import { buttonClass, clock, Field, inputClass, num, panel, primaryClass, scenarioLabel, signed, tone } from './PilotViews';

export interface PilotBuyRequest {
  side: PilotSide;
  expiry: string;
  lots: number;
  lotSize: number;
  brokerage: number;
  reason: string;
  override: boolean;
}

export function PilotTicket({ quotes, assessment, now, disabled, onBuy, onSkip }: {
  quotes: FyersQuote[]; assessment: PilotAssessment; now: number; disabled: boolean;
  onBuy: (value: PilotBuyRequest) => Promise<void>; onSkip: (reason: string) => Promise<void>;
}) {
  const [side, setSide] = useState<PilotSide>('CE');
  const [sideChosen, setSideChosen] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [lots, setLots] = useState('1');
  const [lotSize, setLotSize] = useState('');
  const [brokerage, setBrokerage] = useState('20');
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!sideChosen && assessment.side) setSide(assessment.side);
  }, [assessment.side, sideChosen]);
  const today = istDayKey(now);
  const expiries = useMemo(() => [...new Set(quotes.map(pilotExpiry).filter((e): e is string => e !== null && e >= today))].sort(), [quotes, today]);
  const chosenExpiry = expiry || expiries[0] || '';
  const contract = assessment.spot ? selectPilotContract(quotes, assessment.spot, side, chosenExpiry, now) : null;
  const premium = contract?.quote.lp ?? null;
  const levels = premium == null ? null : pilotPremiumLevels(premium);
  const quantity = Number(lots) * Number(lotSize);
  const validQty = Number.isSafeInteger(Number(lots)) && Number(lots) > 0 && Number.isSafeInteger(Number(lotSize)) && Number(lotSize) > 0 && Number.isSafeInteger(quantity);
  const validBrokerage = brokerage.trim() !== '' && Number.isFinite(Number(brokerage)) && Number(brokerage) >= 0;
  const aligned = assessment.status === 'PAPER ENTRY READY' && assessment.side === side;
  const action = async (kind: 'buy' | 'skip') => {
    setBusy(true); setError('');
    try {
      if (kind === 'skip') await onSkip(reason.trim() || `Skipped. Pilot: ${assessment.reason}`);
      else {
        if (!validQty || !validBrokerage) throw new Error('Confirm a positive whole lot size and lots, and non-negative brokerage.');
        if (!aligned && !reason.trim()) throw new Error('Explain a manual disagreement with the pilot.');
        await onBuy({ side, expiry: chosenExpiry, lots: Number(lots), lotSize: Number(lotSize), brokerage: Number(brokerage), reason: reason.trim(), override: !aligned && override });
      }
      setReason(''); setOverride(false);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className={panel}>
    <h2 className="text-sm font-bold text-white">My decision / isolated paper ticket</h2>
    <p className="mt-1 text-xs text-slate-400">Buy only. Nearest listed strike within 25 pts of Nifty {side === 'CE' ? '- 200' : '+ 200'}. No broker connection.</p>
    <fieldset disabled={disabled || busy} className="mt-3 space-y-3 disabled:opacity-60">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Buy side (suggested from evidence)"><select className={inputClass} value={side} onChange={e => { setSideChosen(true); setSide(e.target.value === 'PE' ? 'PE' : 'CE'); setOverride(false); }}><option>CE</option><option>PE</option></select></Field>
        <Field label="Listed expiry"><select className={inputClass} value={chosenExpiry} onChange={e => setExpiry(e.target.value)}>{!expiries.length && <option value="">No dated contracts</option>}{expiries.map(e => <option key={e}>{e}</option>)}</select></Field>
        <Field label="Lots"><input type="number" min="1" step="1" className={inputClass} value={lots} onChange={e => setLots(e.target.value)} /></Field>
        <Field label="Lot size (confirm contract specification)"><input type="number" min="1" step="1" className={inputClass} value={lotSize} onChange={e => setLotSize(e.target.value)} placeholder="Enter units per lot" /></Field>
        <Field label="Brokerage per order (Rs)"><input type="number" min="0" step="0.01" className={inputClass} value={brokerage} onChange={e => setBrokerage(e.target.value)} /></Field>
      </div>
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
        <div className="text-sm font-bold text-cyan-200">{contract ? `NIFTY ${contract.strike} ${side} / ${contract.expiry}` : 'No fresh matching 200-ITM contract'}</div>
        <p className="mt-1 text-xs text-slate-400">{contract ? `Sample ${clock(contract.quoteAt)} IST / ${(now - contract.quoteAt) / 1000 < 0 ? '--' : num((now - contract.quoteAt) / 1000, 0)}s old` : 'Requires dated, unexpired, positive-premium quotes no more than 90 seconds old. No synthetic option prices.'}</p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div><span className="text-slate-500">Entry sample</span><p className="font-mono text-white">Rs {num(premium, 2)}</p></div>
          <div><span className="text-rose-400">Stop -10%</span><p className="font-mono text-white">Rs {num(levels?.stopPremium, 2)}</p></div>
          <div><span className="text-emerald-400">Target +10%</span><p className="font-mono text-white">Rs {num(levels?.targetPremium, 2)}</p></div>
        </div>
        {premium != null && validQty && validBrokerage && <p className="mt-2 text-xs text-slate-400">
          {quantity} units / premium outlay Rs {num(premium * quantity, 2)} / entry charges estimate Rs {num(computeCharges(premium, quantity, 'BUY', Number(brokerage)).total, 2)}
        </p>}
      </div>
      <Field label={aligned ? 'Optional personal note / source evidence is recorded automatically' : 'Reason for disagreeing with the pilot (required for override)'}><textarea rows={2} maxLength={2000} className={inputClass} value={reason} onChange={e => setReason(e.target.value)} placeholder={aligned ? assessment.reason : 'Explain your alternative read, or record a skip without typing.'} /></Field>
      {!aligned && <label className="flex items-start gap-2 text-xs text-amber-300"><input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)} className="mt-0.5" />Record my decision against the pilot's assessment. This does not override market hours, freshness, contract or sizing restrictions.</label>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primaryClass} disabled={!contract || !validQty || !validBrokerage || (!aligned && (!override || !reason.trim()))} onClick={() => void action('buy')}>{busy ? 'Saving...' : `Confirm paper buy ${side}`}</button>
        <button type="button" className={buttonClass} onClick={() => void action('skip')}>Record SKIP</button>
      </div>
    </fieldset>
    {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
    <p className="mt-3 text-xs text-slate-500">Targets are gross premium moves, not net returns. A sample may cross the stop; fills use the observed premium, never an invented exact stop price.</p>
  </section>;
}

export function PilotPositionCard({ position: p, now, disabled, onClose, onReconcile }: {
  position: PilotPosition; now: number; disabled: boolean; onClose: () => Promise<void>;
  onReconcile: (premium: number, exitedAt: number, note: string) => Promise<void>;
}) {
  const [premium, setPremium] = useState('');
  const [exitTime, setExitTime] = useState(`${istDayKey(p.entryAt)}T${clock(p.entryAt).slice(0, 5)}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const minutes = (now - p.entryAt) / 60_000;
  const stale = now - p.markAt > 90_000;
  const change = (p.mark / p.entryPremium - 1) * 100;
  const submit = async (reconcile: boolean) => {
    setBusy(true); setError('');
    try {
      if (reconcile) await onReconcile(Number(premium), new Date(`${exitTime}:00+05:30`).getTime(), note.trim());
      else await onClose();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return <section className={`${panel} border-cyan-500/40`}>
    <h2 className="text-sm font-bold text-cyan-300">Open paper position / NIFTY {p.strike} {p.side}</h2>
    <p className="mt-1 text-xs text-slate-400">{p.expiry} / {p.quantity} units / entered {clock(p.entryAt)} IST</p>
    <div className="my-3 grid grid-cols-3 gap-3 text-sm">
      <div><p className="text-xs text-slate-500">Entry</p><p className="text-white">Rs {num(p.entryPremium, 2)}</p></div>
      <div><p className="text-xs text-slate-500">Last sample</p><p className={tone(change)}>Rs {num(p.mark, 2)} ({signed(change)}%)</p></div>
      <div><p className="text-xs text-slate-500">Elapsed</p><p className={minutes > 20 ? 'text-amber-300' : 'text-white'}>{num(minutes)} min</p></div>
    </div>
    <p className="text-xs text-slate-300">Stop Rs {num(p.stopPremium, 2)} / target Rs {num(p.targetPremium, 2)}. First observed trigger exits automatically.</p>
    <p className="mt-1 text-xs text-slate-500">10-20 min is your expected hold, not a forced time exit.</p>
    {stale && <p role="status" className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-300">No fresh option mark. Monitoring is incomplete; P&amp;L is stale and exits cannot be inferred. Last sample {istDayKey(p.markAt)} {clock(p.markAt)} IST.</p>}
    {p.samplingGap && <p className="mt-2 text-xs text-amber-300">A monitoring gap occurred. Intraminute stop/target order is unknown.</p>}
    <p className="my-3 text-xs text-slate-400">Entry thesis: {p.reason}</p>
    <button className={primaryClass} disabled={disabled || busy} onClick={() => void submit(false)}>Exit now at fresh sampled premium</button>
    <details className="mt-4 border-t border-white/10 pt-3">
      <summary className="cursor-pointer text-xs text-amber-300">Missed monitoring? Record a reported exit (not a verified fill)</summary>
      <p className="my-2 text-xs text-slate-500">Use only to reconcile an unresolved paper position. This is labelled RECONCILED, kept separate from sampled-trade statistics, and never counted as a verified target/stop.</p>
      <fieldset disabled={disabled || busy} className="space-y-2">
        <Field label="Reported exit premium"><input type="number" min="0.01" step="0.01" className={inputClass} value={premium} onChange={e => setPremium(e.target.value)} /></Field>
        <Field label="Reported exit time (IST)"><input type="datetime-local" className={inputClass} value={exitTime} onChange={e => setExitTime(e.target.value)} /></Field>
        <Field label="Source and reason for reconciliation"><textarea rows={2} className={inputClass} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></Field>
        <button className={buttonClass} disabled={!premium || !exitTime || !note.trim()} onClick={() => void submit(true)}>Confirm reported exit</button>
      </fieldset>
    </details>
    {error && <p role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
  </section>;
}

export function PilotJournal({ trades, decisions }: { trades: PilotTrade[]; decisions: PilotDecision[] }) {
  const sampled = trades.filter(t => t.exitReason !== 'RECONCILED');
  return <section className={panel}>
    <h2 className="text-sm font-bold text-white">My decisions vs pilot / session journal</h2>
    <p className="mt-1 text-xs text-slate-500">Immutable entry evidence. Cost estimates reuse the app's charge model; verify current broker/exchange rates. Reported reconciliations are excluded below.</p>
    <div className="my-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Sampled closed trades', String(sampled.length)], ['Net after estimated costs', `Rs ${num(sampled.reduce((sum, t) => sum + t.netPnl, 0), 2)}`],
        ['Profitable trades', `${sampled.filter(t => t.netPnl > 0).length} / ${sampled.length}`], ['Reported exits', String(trades.length - sampled.length)]].map(([label, value]) =>
        <div key={label} className="rounded-xl bg-slate-950 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>)}
    </div>
    <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-400">{(['CONTINUATION', 'REVERSAL', 'NONE'] as const).map(setup => {
      const rows = sampled.filter(t => t.assessment.setup === setup);
      return <span key={setup}>{setup}: {rows.length} trades / Rs {signed(rows.reduce((sum, t) => sum + t.netPnl, 0), 2)}</span>;
    })}</div>
    <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-xs">
      <thead className="text-slate-500"><tr>{['Contract / entry', 'Premium in / out', 'Exit / hold', 'Net Rs', 'Frozen decision'].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead>
      <tbody>{[...trades].reverse().map(t => <tr key={t.id} className="border-t border-white/5">
        <td className="p-2 text-slate-200">{t.strike} {t.side} / {t.expiry}<br /><span className="text-slate-500">{clock(t.entryAt)}</span></td>
        <td className="p-2 text-slate-300">{num(t.entryPremium, 2)} / {num(t.exitPremium, 2)}</td>
        <td className="p-2 text-slate-300">{t.exitReason} / {num((t.exitAt - t.entryAt) / 60000)}m<br /><span className="text-amber-400">{t.samplingGap ? 'Monitoring gap / sampled limits' : ''}</span></td>
        <td className={`p-2 font-mono ${tone(t.netPnl)}`}>{signed(t.netPnl, 2)}</td>
        <td className="max-w-sm whitespace-normal p-2 text-slate-400"><details><summary className="cursor-pointer text-cyan-300">{t.override ? 'My override' : 'Aligned'} / {t.assessment.setup} / {t.assessment.scenario ? scenarioLabel[t.assessment.scenario] : 'No opening scenario'}</summary>
          <p className="mt-1">{t.reason}</p><p>Pilot: {t.assessment.reason}</p><p>Wall distance: {num(t.assessment.wallDistance)} pts</p>
          <p>{t.exitReason === 'RECONCILED' ? 'Reported entry/exit endpoints only; intervening extrema unknown.' : `Observed best ${num(t.highPremium, 2)} / worst ${num(t.lowPremium, 2)}`}</p>
          {t.exitNote && <p>Reported exit: {t.exitNote}</p>}
        </details></td>
      </tr>)}</tbody>
    </table></div>
    {!trades.length && <p className="py-3 text-xs text-slate-500">No closed pilot trades for this session.</p>}
    <details className="mt-3 border-t border-white/10 pt-3"><summary className="cursor-pointer text-xs font-bold text-slate-300">Decision log / {decisions.length} entries and skips</summary>
      <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">{[...decisions].reverse().map(d => <div key={d.id} className="rounded-lg bg-slate-950 p-3 text-xs">
        <p className="text-cyan-300">{clock(d.at)} / {d.action} / Pilot: {d.assessment.status} {d.assessment.side}</p>
        <p className="mt-1 text-slate-300">{d.reason}</p><p className="mt-1 text-slate-500">{d.assessment.reason}</p>
      </div>)}</div>
    </details>
  </section>;
}
