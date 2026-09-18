import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Download, Pause, Play, ShieldCheck } from 'lucide-react';
import { FyersCredentials, FyersQuote, MarketSnapshot } from '../types';
import { istDayKey, istMinutesOf } from '../services/sniperEngine';
import { isMarketLive } from '../services/marketSession';
import {
  assessOpeningPilot, classifyPilotGap, closePilotPosition, markPilotPosition,
  openPilotPosition, reconcilePilotPosition, selectPilotContract
} from '../services/openingPilot';
import { PilotBook, PilotFrame, PilotObservation, PilotPlan } from '../services/openingPilotTypes';
import { usePilotBook } from './openingPilot/usePilotBook';
import { ObservationEditor, PlanEditor } from './openingPilot/PilotPreparation';
import {
  AssessmentPanel, buttonClass, clock, EvidenceMetrics, Field, FrameTimeline,
  inputClass, num, panel, PriceChart, scenarioLabel, signed, WallPanel
} from './openingPilot/PilotViews';
import { PilotBuyRequest, PilotJournal, PilotPositionCard, PilotTicket } from './openingPilot/PilotTrading';
import { usePilotSources } from './openingPilot/usePilotSources';
import { derivePilotSources, PilotSourceUpdate } from '../services/openingPilotSources';
import { PilotSourceBoard } from './openingPilot/PilotSourceBoard';
import { SentimentHistory } from './SentimentHistory';

interface OpeningPilotProps {
  history: MarketSnapshot[];
  quotes: FyersQuote[];
  active: boolean;
  feedPaused: boolean;
  refreshInterval: number;
  visionScreenActive?: boolean;
  onNavigate?: (view: 'premarket' | 'vision' | 'history') => void;
  credentials?: FyersCredentials;
}

export function pilotContext(book: PilotBook, now: number) {
  const day = istDayKey(now);
  const cutoff = Date.parse(`${day}T09:25:00+05:30`);
  const plans = book.plans.filter(p => p.day === day && p.savedAt <= now && (!p.source || p.source.at <= now)
    && (p.source?.kind !== 'PREMARKET' || p.source.at <= cutoff));
  const automatic = plans.filter(p => p.source?.kind === 'PREMARKET');
  const plan = (automatic.length ? automatic : plans)
    .sort((a, b) => (a.source?.at ?? a.savedAt) - (b.source?.at ?? b.savedAt) || a.savedAt - b.savedAt).at(-1) ?? null;
  const observations = book.observations.filter(o => o.day === day && o.recordedAt <= now && o.observedAt <= now
    && (!o.source || o.source.at <= now));
  const walls = observations.filter(o => o.source?.kind === 'VISION' || o.support !== null || o.resistance !== null);
  const evidenceOrder = (o: PilotObservation) => o.source?.kind === 'VISION' ? o.source.at : o.observedAt;
  const observation = (walls.length ? walls : observations)
    .sort((a, b) => evidenceOrder(a) - evidenceOrder(b) || a.recordedAt - b.recordedAt).at(-1) ?? null;
  return { day, plan, observation };
}

export function mergePilotSources(book: PilotBook, update: PilotSourceUpdate, now: number): PilotBook {
  const plans = update.plans.filter(p => !book.plans.some(saved => saved.id === p.id))
    .map(p => ({ ...p, savedAt: now }));
  const observations = update.observations.filter(o => !book.observations.some(saved => saved.id === o.id))
    .map(o => ({ ...o, recordedAt: now }));
  if (!plans.length && !observations.length) return book;
  return { ...book, plans: [...book.plans, ...plans], observations: [...book.observations, ...observations] };
}

export function makePilotFrame(book: PilotBook, history: MarketSnapshot[], now: number): PilotFrame | null {
  const { day, plan, observation } = pilotContext(book, now);
  const latest = history.filter(s => Number.isFinite(s.timestamp) && s.timestamp! <= now
    && istDayKey(s.timestamp!) === day).sort((a, b) => b.timestamp! - a.timestamp!)[0];
  if (!latest?.timestamp || now - latest.timestamp > 90_000 || !isMarketLive(new Date(now))) return null;
  const id = `${day}:${Math.floor(latest.timestamp / 60_000)}`;
  if (book.frames.some(f => f.id === id)) return null;
  return {
    id, day, at: now, assessment: assessOpeningPilot(history, plan, observation, now),
    planId: plan?.id ?? null, observationId: observation?.id ?? null,
    callsOI: Number.isFinite(latest.callsOI) && latest.callsOI > 0 ? latest.callsOI : null,
    putsOI: Number.isFinite(latest.putsOI) && latest.putsOI > 0 ? latest.putsOI : null,
    optionsSentiment: Number.isFinite(latest.optionsSent) ? latest.optionsSent : null
  };
}

export default function OpeningPilot({ history, quotes, active, feedPaused, refreshInterval, visionScreenActive = false, onNavigate, credentials }: OpeningPilotProps) {
  const { book, loaded, writer, error, lockMessage, mutate } = usePilotBook();
  const [now, setNow] = useState(Date.now);
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<'live' | 'replay'>('live');
  const [replayDay, setReplayDay] = useState('');
  const [journalDay, setJournalDay] = useState('');
  const [replayIndex, setReplayIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const seen = useRef(false);
  const updating = useRef(false);
  const today = istDayKey(now);
  const shared = usePilotSources(active || recording || !!book.position, visionScreenActive);
  const sourceUpdate = useMemo(() => derivePilotSources({
    decision: shared.decision, chartMeta: shared.chartMeta, visionRuns: shared.visionRuns, now
  }), [shared.decision, shared.chartMeta, shared.visionRuns, now]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (active && !seen.current) {
      seen.current = true;
      setRecording(true);
    }
  }, [active]);

  useEffect(() => {
    if (!loaded || !writer || updating.current) return;
    if (!active && !book.position && !recording) return;
    updating.current = true;
    void mutate(previous => {
      const at = Date.now();
      let next = mergePilotSources(previous, sourceUpdate, at);
      if (previous.position && !feedPaused) {
        const marked = markPilotPosition(previous.position, quotes, at);
        if (marked.trade) {
          next = { ...next, position: null, trades: [...next.trades, marked.trade] };
        } else if (marked.position.markAt !== previous.position.markAt
          || marked.position.mark !== previous.position.mark
          || marked.position.samplingGap !== previous.position.samplingGap) {
          next = { ...next, position: marked.position };
        }
      }
      if (recording && !feedPaused) {
        const frame = makePilotFrame(next, history, at);
        if (frame) next = { ...next, frames: [...next.frames, frame] };
      }
      return next;
    }).catch(e => setNotice(`Pilot monitoring could not save: ${e instanceof Error ? e.message : String(e)}`))
      .finally(() => { updating.current = false; });
  }, [book, history, quotes, recording, now, loaded, writer, feedPaused, mutate, sourceUpdate, active]);

  const context = useMemo(() => pilotContext(book, now), [book, now]);
  const liveAssessment = useMemo(() => assessOpeningPilot(history, context.plan, context.observation, now), [history, context, now]);
  const replayDays = [...new Set(book.frames.map(f => f.day))].sort().reverse();
  const selectedReplayDay = replayDay || replayDays[0] || today;
  const journalDays = [...new Set([today, ...book.trades.map(t => t.day), ...book.decisions.map(d => d.day)])].sort().reverse();
  const selectedJournalDay = journalDay || today;
  const sessionFrames = book.frames.filter(f => f.day === (mode === 'replay' ? selectedReplayDay : today)).sort((a, b) => a.at - b.at);
  const index = Math.min(replayIndex, Math.max(0, sessionFrames.length - 1));
  const replayFrame = mode === 'replay' ? sessionFrames[index] : null;
  const assessment = replayFrame?.assessment ?? liveAssessment;
  const visibleFrames = mode === 'replay' ? sessionFrames.slice(0, index + 1) : sessionFrames;
  const displayedObservation = mode === 'replay'
    ? book.observations.find(o => o.id === replayFrame?.observationId) ?? null : context.observation;
  const displayedPlan = mode === 'replay'
    ? book.plans.find(p => p.id === replayFrame?.planId) ?? null : context.plan;
  const sampledPoints = mode === 'replay'
    ? visibleFrames.filter(f => f.assessment.spot !== null).map(f => ({ at: f.at, value: f.assessment.spot! }))
    : history.filter(s => Number.isFinite(s.timestamp) && s.timestamp! <= now
      && istDayKey(s.timestamp!) === today && istMinutesOf(new Date(s.timestamp!)) >= 555
      && istMinutesOf(new Date(s.timestamp!)) < 930)
      .map(s => ({ at: s.timestamp!, value: s.niftyLtp })).sort((a, b) => a.at - b.at);
  const latestPreOpen = book.observations.filter(o => o.day === today && o.recordedAt <= now && o.observedAt <= now && o.preOpen != null).at(-1);
  const latestGift = book.observations.filter(o => o.day === today && o.recordedAt <= now && o.observedAt <= now && o.giftChange != null).at(-1);
  const indicativeScenario = latestPreOpen?.preOpen && context.plan
    ? classifyPilotGap(latestPreOpen.preOpen - context.plan.previousClose, context.plan) : null;
  const disabled = !loaded || !writer;
  const entryDisabled = disabled || feedPaused || !isMarketLive(new Date(now)) || istMinutesOf(new Date(now)) < 565;
  const runAction = async (action: () => Promise<void>, message: string) => {
    setNotice('');
    await action();
    setNotice(message);
  };
  const savePlan = (plan: PilotPlan) => runAction(() => mutate(previous => {
    if (plan.day !== istDayKey(Date.now())) throw new Error('The IST session changed. Reload the plan for today.');
    return { ...previous, plans: [...previous.plans, plan] };
  }), 'Morning plan revision saved. Earlier evidence is unchanged.');
  const saveObservation = (observation: PilotObservation) => runAction(() => mutate(previous => {
    if (observation.day !== istDayKey(Date.now())) throw new Error('The IST session changed. Save an observation for today.');
    return { ...previous, observations: [...previous.observations, observation] };
  }), 'Timestamped observation saved.');
  const buy = (request: PilotBuyRequest) => runAction(() => mutate(previous => {
    if (feedPaused) throw new Error('Resume the shared market feed before entering.');
    if (previous.position) throw new Error('Close the existing pilot position first.');
    const at = Date.now();
    const c = pilotContext(previous, at);
    const fresh = assessOpeningPilot(history, c.plan, c.observation, at);
    if (!fresh.spot) throw new Error('No valid Nifty spot sample.');
    const contract = selectPilotContract(quotes, fresh.spot, request.side, request.expiry, at);
    if (!contract) throw new Error('The 200-ITM contract is unavailable, stale, or expired. Wait for fresh quotes.');
    const reason = request.reason.trim() || (fresh.status === 'PAPER ENTRY READY' && fresh.side === request.side ? fresh.reason : '');
    const position = openPilotPosition({ ...request, reason, contract, spot: fresh.spot, now: at, assessment: fresh, planId: c.plan?.id ?? null, observationId: c.observation?.id ?? null });
    return {
      ...previous, position,
      decisions: [...previous.decisions, {
        id: crypto.randomUUID(), day: c.day, at, action: request.side === 'CE' ? 'BUY_CE' : 'BUY_PE',
        reason: position.reason, assessment: fresh
      }]
    };
  }), 'Paper entry saved with fixed -10% stop and +10% target on entry premium.');
  const skip = (reason: string) => runAction(() => mutate(previous => {
    const at = Date.now();
    const c = pilotContext(previous, at);
    if (!reason.trim()) throw new Error('A skip needs a reason.');
    return { ...previous, decisions: [...previous.decisions, {
      id: crypto.randomUUID(), day: c.day, at, action: 'SKIP', reason,
      assessment: assessOpeningPilot(history, c.plan, c.observation, at)
    }] };
  }), 'SKIP saved alongside the pilot assessment.');
  const close = () => runAction(() => mutate(previous => {
    if (feedPaused) throw new Error('Resume the shared market feed or explicitly reconcile a reported exit.');
    if (!previous.position) throw new Error('The pilot position has already closed.');
    const trade = closePilotPosition(previous.position, quotes, Date.now());
    return { ...previous, position: null, trades: [...previous.trades, trade] };
  }), 'Sampled paper exit saved.');
  const reconcile = (premium: number, exitedAt: number, note: string) => runAction(() => mutate(previous => {
    if (!previous.position) throw new Error('The pilot position has already closed.');
    const trade = reconcilePilotPosition(previous.position, premium, exitedAt, Date.now(), note);
    return { ...previous, position: null, trades: [...previous.trades, trade] };
  }), 'Reported exit saved as RECONCILED, separate from sampled-trade results.');
  const exportJournal = () => {
    const blob = new Blob([JSON.stringify({ kind: 'nifty-opening-pilot', exportedAt: Date.now(), book }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `opening-pilot-${today}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="h-full overflow-y-auto bg-slate-950/40 p-3 md:p-5">
    <div className="mx-auto max-w-screen-2xl space-y-4">
      <header className={`${panel} bg-gradient-to-r from-cyan-950/70 to-slate-900`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="flex items-center gap-2 text-xl font-black text-white"><Compass className="text-cyan-400" size={24} /> Opening Pilot <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] tracking-wider text-cyan-300">EXPERIMENT</span></h1>
            <p className="mt-1 text-xs text-slate-400">Your existing PreMkt analysis + minute history + Vision, connected into one opening workflow.</p></div>
          <div className="flex flex-wrap gap-2">
            <button className={buttonClass} disabled={disabled} onClick={() => setRecording(v => !v)}>{recording ? <Pause size={12} className="mr-1 inline" /> : <Play size={12} className="mr-1 inline" />}{recording ? 'Pause evidence recording' : 'Record live evidence'}</button>
            <button className={buttonClass} disabled={!loaded} onClick={exportJournal}><Download size={12} className="mr-1 inline" />Export journal</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-300"><ShieldCheck size={13} />Paper only / no broker orders</span>
          <span className={feedPaused ? 'text-amber-300' : 'text-slate-400'}>{feedPaused ? 'Shared feed paused' : `Shared refresh: ${num(refreshInterval / 1000, 0)}s / evidence: once per minute`}</span>
          <span className="text-slate-400">{mode === 'live' ? `${today} / ${clock(now)} IST` : 'REPLAY / frozen evidence only'}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">Sampled-price simulator: provider timestamps can be approximations; quotes are not verified executable fills. Monitoring continues across app tabs, not while the browser is closed or suspended. Missing samples cannot establish which intraminute exit happened first. No automatic 20-minute exit.</p>
      </header>
      {lockMessage && <p role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">{lockMessage}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error} No failed transaction is treated as a saved fill.</p>}
      {notice && <p role="status" className="rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-slate-200">{notice}</p>}
      {!loaded ? <p className="p-4 text-sm text-slate-400">{error ? 'Pilot data could not be loaded. Existing storage has been preserved.' : 'Loading the isolated pilot journal...'}</p> : <>
        <nav className="flex flex-wrap items-center gap-2">
          <button className={`${buttonClass} ${mode === 'live' ? 'border-cyan-500 text-cyan-300' : ''}`} onClick={() => setMode('live')}>Live workspace</button>
          <button className={`${buttonClass} ${mode === 'replay' ? 'border-cyan-500 text-cyan-300' : ''}`} onClick={() => { setMode('replay'); setReplayIndex(0); }}>Evidence replay</button>
          <span className="text-xs text-slate-500">Recording: {recording && writer ? 'on' : 'off'}. Position exits are monitored independently of recording.</span>
        </nav>
        {mode === 'live' ? <>
          <div className="grid gap-2 sm:grid-cols-4">{[['08:55', 'Prepare five scenarios'], ['09:10', 'Observe pre-open + GIFT'], ['09:15', 'Read price + sentiment'], ['09:25+', 'Confirm or stand aside']].map(([time, label]) => <div key={time} className="rounded-xl border border-white/10 bg-slate-900 p-3"><b className="text-xs text-cyan-300">{time} IST</b><p className="text-xs text-slate-400">{label}</p></div>)}</div>
          <PilotSourceBoard shared={shared} update={sourceUpdate} plan={context.plan} observation={context.observation}
            history={history} now={now} onNavigate={onNavigate} />
          <details className={panel}><summary className="cursor-pointer text-xs text-slate-500">Optional manual fallback / only for missing source data</summary>
            <p className="my-3 text-xs text-slate-500">No re-entry is needed when the source screens have data. A shared PreMkt plan takes priority over a manual plan. A newer manual wall observation is explicitly journalled as manual.</p>
            <PlanEditor key={`${today}:${context.plan?.id ?? 'draft'}`} day={today} initial={context.plan} disabled={disabled || context.plan?.source?.kind === 'PREMARKET'} onSave={savePlan} />
            <div className="mt-3"><ObservationEditor key={today} day={today} initial={context.observation} disabled={disabled} onSave={saveObservation} /></div>
          </details>
          <div className={`${panel} grid gap-3 text-xs sm:grid-cols-3`}>
            <div className="text-slate-400">Indicative pre-open: <b className="text-white">{num(latestPreOpen?.preOpen)}</b><p>{indicativeScenario ? scenarioLabel[indicativeScenario] : 'No saved pre-open comparison'}{latestPreOpen ? ` / observed ${clock(latestPreOpen.observedAt)}` : ''}</p></div>
            <div className="text-slate-400">GIFT reported change: <b className="text-white">{signed(latestGift?.giftChange)} pts</b><p>{latestGift ? `Observed ${clock(latestGift.observedAt)} IST / supporting context only` : sourceUpdate.giftStatus}</p></div>
            <div className="text-slate-400">Opening scenario: <b className="text-cyan-300">{assessment.scenario ? scenarioLabel[assessment.scenario] : 'Waiting for opening evidence'}</b><p>Not a guarantee of direction.</p></div>
          </div>
        </> : <section className={panel}>
          <h2 className="text-sm font-bold text-cyan-300">Replay only what was recorded at the time</h2>
          <p className="my-2 text-xs text-slate-500">No backfilled decisions, future price samples or paper orders in replay. An existing live position still monitors in the background.</p>
          <Field label="Recorded session"><select className={inputClass} value={selectedReplayDay} onChange={e => { setReplayDay(e.target.value); setReplayIndex(0); }}>{!replayDays.length && <option value={today}>No recorded sessions</option>}{replayDays.map(day => <option key={day}>{day}</option>)}</select></Field>
          {!!sessionFrames.length && <div className="mt-3 flex items-center gap-3">
            <button className={buttonClass} disabled={index === 0} onClick={() => setReplayIndex(index - 1)}>Previous</button>
            <input aria-label="Replay evidence minute" type="range" min={0} max={sessionFrames.length - 1} value={index} onChange={e => setReplayIndex(Number(e.target.value))} className="min-w-0 flex-1 accent-cyan-500" />
            <button className={buttonClass} disabled={index === sessionFrames.length - 1} onClick={() => setReplayIndex(index + 1)}>Next</button>
            <span className="text-xs text-slate-300">{replayFrame ? clock(replayFrame.at) : '--'} IST / {index + 1} of {sessionFrames.length}</span>
          </div>}
          {!sessionFrames.length && <p className="mt-3 text-sm text-slate-400">Open the live workspace during a session to begin recording.</p>}
        </section>}
        {(mode === 'live' || replayFrame) && <>
          <EvidenceMetrics assessment={assessment} />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <section className={panel}><h2 className="mb-3 text-sm font-bold text-white">Nifty / sampled price structure</h2>
                <PriceChart points={sampledPoints} support={assessment.support} resistance={assessment.resistance} />
                <p className="mt-2 text-xs text-slate-500">Line samples, not OHLC candles. Gaps are not interpolated into trading evidence.</p>
              </section>
              {mode === 'live' && credentials && <section className={panel}>
                <p className="mb-3 text-xs text-slate-500">The existing History table, using every available current-session minute, including data received before you opened the pilot. No duplicate AI chat or history writes.</p>
                <div className="h-96"><SentimentHistory history={history.filter(s => Number.isFinite(s.timestamp) && s.timestamp! <= now && istDayKey(s.timestamp!) === today).sort((a, b) => b.timestamp! - a.timestamp!)}
                  credentials={credentials} aiEnabled={false} readOnly /></div>
              </section>}
              <WallPanel observation={displayedObservation} assessment={assessment} at={replayFrame?.at ?? now} />
              {displayedPlan && assessment.scenario && assessment.scenario !== 'OUTSIDE' && <section className={panel}>
                <h2 className="text-xs font-bold text-cyan-300">{scenarioLabel[assessment.scenario]} / plan saved {clock(displayedPlan.savedAt)}</h2>
                {displayedPlan.scenarios.filter(s => s.scenario === assessment.scenario).map(s => <div key={s.scenario} className="mt-2 space-y-1 text-xs text-slate-400">
                  <p>Expected: {s.expectation}</p><p>Confirm: {s.confirmation}</p><p>Invalidate: {s.invalidation}</p>
                </div>)}
                <p className="mt-2 text-xs text-slate-500">Scenario notes are your checklist, not machine-evaluated rules.</p>
              </section>}
              <section className={panel}><h2 className="mb-2 text-sm font-bold text-white">What changed? / frozen minute timeline</h2><FrameTimeline frames={visibleFrames} /></section>
            </div>
            <div className="space-y-4">
              <AssessmentPanel value={assessment} />
              {mode === 'live' && (book.position
                ? <PilotPositionCard key={book.position.id} position={book.position} now={now} disabled={disabled} onClose={close} onReconcile={reconcile} />
                : <PilotTicket quotes={quotes} assessment={liveAssessment} now={now} disabled={entryDisabled} onBuy={buy} onSkip={skip} />)}
              {mode === 'live' && entryDisabled && !book.position && <p className="text-xs text-amber-300">Paper entries require the active shared feed, this tab's writer lock, and market hours from 09:25 IST. Freshness and sizing checks still apply.</p>}
            </div>
          </div>
        </>}
        {mode === 'live' && <div className="space-y-3">
          <div className="max-w-xs"><Field label="Review journal session"><select className={inputClass} value={selectedJournalDay} onChange={e => setJournalDay(e.target.value)}>{journalDays.map(day => <option key={day}>{day}</option>)}</select></Field></div>
          <PilotJournal trades={book.trades.filter(t => t.day === selectedJournalDay)} decisions={book.decisions.filter(d => d.day === selectedJournalDay)} />
        </div>}
      </>}
    </div>
  </div>;
}
