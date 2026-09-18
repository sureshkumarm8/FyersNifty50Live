/**
 * Pre-Market Intelligence — the deck.
 *
 * This is the screen you actually trade from. Everything here answers one of
 * four questions and nothing else:
 *
 *   1. What step of the morning am I on, and what do I owe it?   (StepRail)
 *   2. Am I trading today, and if so, what exactly?              (TheCall)
 *   3. Where is price relative to the only two levels that matter? (ZoneStrip)
 *   4. What has to happen next, and what kills it?               (NextMoves)
 *
 * The full analysis - chart confluence, level ladders, gap branches, raw AI -
 * still exists and is still correct, but it is folded away behind one link. It
 * is evidence for the call, not the call. A morning where you read four boards
 * and then guess is worse than a morning where you read one line and act.
 *
 * The hard rule encoded throughout: before a real price from today exists, this
 * screen is not allowed to say "trade". It can only prepare.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRight, Ban, Brain, Check, ChevronDown, ClipboardCopy, Clock, Crosshair, Loader2,
  Lock, RefreshCw, Shield, Target, TrendingDown, TrendingUp
} from 'lucide-react';
import { SNIPER, ZonePlay, istMinutes } from '../../services/sniperPlaybook';
import { BASIS_LABEL, DecisionBasis } from '../../services/premarketSchedule';
import { PhaseReview } from '../../services/premarketReview';
import { PhaseSnapshot, PreMarketDecision } from './model';

const num = (n: number | null | undefined) =>
  n == null || !isFinite(n) ? '—' : Math.round(n).toLocaleString('en-IN');

const ORDER: DecisionBasis[] = ['CHARTS_ONLY', 'PREOPEN', 'INTRADAY'];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// ---------------------------------------------------------------------------
// Step 1 — where am I in the morning
// ---------------------------------------------------------------------------

/**
 * What each checkpoint is for, in the user's own words rather than the
 * system's. The `owe` line is the important one: it says what has to be put in
 * before the step can produce anything, which is the single most common reason
 * a phase sits empty.
 */
const STEP: Record<DecisionBasis, { n: string; when: string; title: string; owe: string; input: string; hint: string }> = {
  CHARTS_ONLY: {
    n: '1',
    when: 'before 09:00',
    title: 'Read the charts',
    owe: 'Four screenshots. No trade decision is possible yet — this step only draws the map.',
    input: 'Previous close',
    hint: 'Blank uses the last price your charts reported.'
  },
  PREOPEN: {
    n: '2',
    when: '09:10',
    title: 'Pre-open auction',
    owe: 'The 09:08–09:14 indicative price. First real number from today — it tells us the gap.',
    input: 'Pre-open indicative price',
    hint: 'Blank uses the live feed, which may not carry the auction print.'
  },
  INTRADAY: {
    n: '3',
    when: '09:15+',
    title: 'Entry window',
    owe: 'Price plus today\'s measured high and low — the zones are anchored to the real range, not modelled.',
    input: 'Price to test',
    hint: 'Blank uses the live feed. Add today\'s high and low so support/resistance sit on the real range.'
  }
};

export const StepRail: React.FC<{
  decision: PreMarketDecision;
  active: DecisionBasis;
  onSelect: (basis: DecisionBasis) => void;
  onRunPhase: (basis: DecisionBasis, overrideSpot?: number, rangeHigh?: number, rangeLow?: number) => void;
  running: boolean;
}> = ({ decision, active, onSelect, onRunPhase, running }) => {
  const [spotInput, setSpotInput] = useState('');
  const [highInput, setHighInput] = useState('');
  const [lowInput, setLowInput] = useState('');
  const step = STEP[active];
  const cut = decision.phases?.[active];
  // Today's high/low only anchor the live Entry-window zone.
  const wantsRange = active === 'INTRADAY';

  // A fresh price belongs to the step it was typed under, so the boxes empty
  // whenever the user moves to a different checkpoint.
  useEffect(() => { setSpotInput(''); setHighInput(''); setLowInput(''); }, [active]);

  const parsePrice = (raw: string) => {
    const n = parseFloat(raw.replace(/[,\s]/g, ''));
    return isFinite(n) && n > 0 ? n : undefined;
  };

  const submit = () => {
    onRunPhase(
      active,
      parsePrice(spotInput),
      wantsRange ? parsePrice(highInput) : undefined,
      wantsRange ? parsePrice(lowInput) : undefined
    );
    setSpotInput(''); setHighInput(''); setLowInput('');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 p-2">
        {ORDER.map(b => {
          const done = !!decision.phases?.[b];
          const on = b === active;
          return (
            <button
              key={b}
              onClick={() => onSelect(b)}
              className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                on
                  ? 'border-violet-500/50 bg-violet-500/15'
                  : done
                    ? 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
                    : 'border-slate-800/70 bg-slate-950/30 hover:border-slate-700'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  done
                    ? 'bg-emerald-500 text-emerald-950'
                    : on
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-800 text-slate-500'
                }`}
              >
                {done ? <Check size={13} strokeWidth={3.5} /> : STEP[b].n}
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[12px] font-bold ${on ? 'text-violet-100' : done ? 'text-slate-200' : 'text-slate-500'}`}>
                  {STEP[b].title}
                </span>
                <span className="block font-mono text-[9.5px] text-slate-500">
                  {done ? `${STEP[b].when} · ${num(decision.phases![b]!.spot)}` : STEP[b].when}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-2 p-3">
        <p className="mb-0.5 min-w-[240px] flex-1 text-[11px] leading-snug text-slate-400">
          <span className="font-bold text-slate-200">Step {step.n} · {step.title}.</span> {step.owe}
        </p>
        <label className="w-40">
          <span className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-slate-500">{step.input}</span>
          <input
            type="text"
            inputMode="decimal"
            value={spotInput}
            onChange={e => setSpotInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder={cut ? num(cut.spot) : 'live price'}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 font-mono text-sm text-slate-100 outline-none transition placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-600 focus:border-violet-500/60"
          />
        </label>
        {wantsRange && (
          <>
            <label className="w-28">
              <span className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Day high</span>
              <input
                type="text"
                inputMode="decimal"
                value={highInput}
                onChange={e => setHighInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder={cut?.rangeHigh ? num(cut.rangeHigh) : 'high'}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 font-mono text-sm text-slate-100 outline-none transition placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-600 focus:border-violet-500/60"
              />
            </label>
            <label className="w-28">
              <span className="mb-1 block text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Day low</span>
              <input
                type="text"
                inputMode="decimal"
                value={lowInput}
                onChange={e => setLowInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder={cut?.rangeLow ? num(cut.rangeLow) : 'low'}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-2.5 py-2 font-mono text-sm text-slate-100 outline-none transition placeholder:font-sans placeholder:text-[11px] placeholder:text-slate-600 focus:border-violet-500/60"
              />
            </label>
          </>
        )}
        <button
          onClick={submit}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/20 px-4 py-2 text-[12px] font-bold text-violet-100 transition hover:bg-violet-500/30 disabled:opacity-50"
        >
          {running ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {cut ? 'Re-run' : 'Run'} step {step.n}
        </button>
      </div>
      <p className="px-3 pb-2.5 text-[10px] text-slate-600">{step.hint}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 2 — the call
// ---------------------------------------------------------------------------

type CallWord = 'PREPARING' | 'NO TRADE' | 'WAIT FOR THE LEVEL' | 'TAKE THE TRADE';

interface Call {
  word: CallWord;
  /** One sentence. If the user reads nothing else, they read this. */
  line: string;
  tone: (typeof TONE)[keyof typeof TONE];
  play: ZonePlay | null;
  /** Points from spot to the level the play arms at. Null when there is no play. */
  distance: number | null;
}

const TONE = {
  go: { wrap: 'border-emerald-500/50 bg-emerald-500/[0.08] shadow-[0_0_70px_-28px_rgba(16,185,129,0.9)]', chip: 'bg-emerald-500 text-emerald-950', text: 'text-emerald-300', Icon: Target },
  wait: { wrap: 'border-amber-500/45 bg-amber-500/[0.07]', chip: 'bg-amber-500 text-amber-950', text: 'text-amber-300', Icon: Clock },
  no: { wrap: 'border-rose-500/45 bg-rose-500/[0.07]', chip: 'bg-rose-500 text-white', text: 'text-rose-300', Icon: Ban },
  prep: { wrap: 'border-sky-500/40 bg-sky-500/[0.06]', chip: 'bg-sky-500 text-sky-950', text: 'text-sky-300', Icon: Lock }
} as const;

/**
 * Collapse the whole analysis into one of four words.
 *
 * The ordering of these branches is the risk policy, so it is written as one
 * readable ladder rather than spread across the render:
 *
 *   - Before a real price exists, the answer is always "preparing". The system
 *     is not permitted to issue a trade instruction against a modelled open.
 *   - A stand-aside verdict, or a zone too narrow for the fixed 30-point target,
 *     is a hard no for the day.
 *   - With a valid play, the only question left is whether price is at the
 *     level. Buying mid-zone is the single most expensive habit this protocol
 *     was built to stop, so distance decides between "take it" and "wait".
 */
export function deriveCall(view: PhaseSnapshot, basis: DecisionBasis, liveSpot: number | null): Call {
  const pb = view.playbook;
  const play = pb?.primaryPlay ?? null;
  const spot = liveSpot ?? view.spot;
  const zoneWidth = Math.round(view.expectedResistance - view.expectedSupport);
  const review = view.aiReview;

  if (basis === 'CHARTS_ONLY') {
    return {
      word: 'PREPARING',
      line: `Map drawn from your charts: ${num(view.expectedSupport)} support, ${num(view.expectedResistance)} resistance. No price from today yet, so there is nothing to trade — bring the 09:10 auction print to step 2.`,
      tone: TONE.prep,
      play: null,
      distance: null
    };
  }

  if (!pb || pb.verdict === 'STAND_ASIDE') {
    return {
      word: 'NO TRADE',
      line: pb?.verdictReason || view.riskReason || 'Conditions do not meet the protocol. Close the laptop.',
      tone: TONE.no,
      play: null,
      distance: null
    };
  }

  if (zoneWidth < SNIPER.minZoneWidth) {
    return {
      word: 'NO TRADE',
      line: `Only ${zoneWidth} pts between ${num(view.expectedSupport)} and ${num(view.expectedResistance)}. The 30-point target cannot be reached before the opposite wall — needs ${SNIPER.minZoneWidth} pts minimum.`,
      tone: TONE.no,
      play: null,
      distance: null
    };
  }

  if (review?.stance === 'STAND_ASIDE') {
    return {
      word: 'NO TRADE',
      line: review.headline || review.summary,
      tone: TONE.no,
      play: null,
      distance: null
    };
  }

  if (!play || play.status === 'BLOCKED') {
    return {
      word: 'WAIT FOR THE LEVEL',
      line: `No zone is armed at ${num(spot)}. Price has to reach ${num(view.expectedSupport)} or ${num(view.expectedResistance)} before anything triggers.`,
      tone: TONE.wait,
      play,
      distance: null
    };
  }

  const distance = Math.round(Math.abs(spot - play.zone));
  const atLevel = spot >= play.triggerFrom && spot <= play.triggerTo;

  if (atLevel) {
    return {
      word: 'TAKE THE TRADE',
      line: `Price is at ${num(play.zone)} — inside the trigger band. Buy ${play.optionLabel} now, ${SNIPER.targetPoints} pts target, ${SNIPER.stopPoints} pts stop, out by ${SNIPER.hardStop} regardless.`,
      tone: TONE.go,
      play,
      distance
    };
  }

  return {
    word: 'WAIT FOR THE LEVEL',
    line: `The plan is ready but price is ${distance} pts away from ${num(play.zone)}. Do not chase — this system buys at the level, never into a move.`,
    tone: TONE.wait,
    play,
    distance
  };
}

/** The one card the morning is decided from. */
export const TheCall: React.FC<{
  view: PhaseSnapshot;
  basis: DecisionBasis;
  liveSpot: number | null;
  nowTick: number;
  onCopy: () => void;
}> = ({ view, basis, liveSpot, nowTick, onCopy }) => {
  const call = useMemo(() => deriveCall(view, basis, liveSpot), [view, basis, liveSpot]);
  const clock = useMemo(() => {
    const mins = istMinutes(new Date());
    return { toEntry: toMin(SNIPER.entryStart) - mins, toStop: toMin(SNIPER.hardStop) - mins };
  }, [nowTick]);

  const countdown =
    clock.toEntry > 0
      ? `${clock.toEntry} min until the ${SNIPER.entryStart} entry window opens`
      : clock.toStop > 0
        ? `${clock.toStop} min left before the ${SNIPER.hardStop} hard stop`
        : `Past ${SNIPER.hardStop} — the day is over, do not open anything`;

  const { Icon } = call.tone;
  const spot = liveSpot ?? view.spot;

  return (
    <section className={`rounded-2xl border ${call.tone.wrap}`}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Icon size={30} className={`mt-0.5 shrink-0 ${call.tone.text}`} />
            <div className="min-w-0">
              <h2 className={`text-2xl font-black leading-tight tracking-tight sm:text-3xl ${call.tone.text}`}>
                {call.word}
              </h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                {BASIS_LABEL[basis]} · Nifty {num(spot)}
                {liveSpot != null && Math.round(liveSpot) !== Math.round(view.spot) && (
                  <span className="text-slate-600"> (plan cut at {num(view.spot)})</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider ${call.tone.chip}`}>
              {countdown}
            </span>
            <button
              onClick={onCopy}
              title="Copy the plan"
              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            >
              <ClipboardCopy size={14} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-slate-200">{call.line}</p>

        {call.play && <Ticket play={call.play} live={call.word === 'TAKE THE TRADE'} distance={call.distance} />}
      </div>
    </section>
  );
};

/**
 * The order, written out.
 *
 * Deliberately reads like something you would type into a broker, because that
 * is the moment it exists to survive. Every number is fixed by the protocol -
 * nothing here is a judgement call once the level is reached.
 */
const Ticket: React.FC<{ play: ZonePlay; live: boolean; distance: number | null }> = ({ play, live, distance }) => {
  const isCe = play.side === 'CE';
  return (
    <div
      className={`mt-4 rounded-xl border p-4 ${
        live ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-slate-700 bg-slate-950/50'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isCe ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-rose-400" />}
          <span className="text-[15px] font-black text-slate-100">BUY {play.optionLabel}</span>
          <span className={`rounded px-1.5 py-px text-[9.5px] font-bold tracking-wider ${isCe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {play.itmPoints} PTS ITM
          </span>
        </div>
        {!live && distance != null && (
          <span className="font-mono text-[10.5px] font-semibold text-amber-300">{distance} pts away — not yet</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cell label="Arm when spot" value={`${num(play.triggerFrom)}–${num(play.triggerTo)}`} accent="text-sky-300" />
        <Cell label="Target spot" value={num(play.targetSpot)} sub={`≈ +${Math.round(play.approxPremiumTarget)} premium`} accent="text-emerald-300" />
        <Cell label="Stop spot" value={num(play.stopSpot)} sub={`≈ −${Math.round(play.approxPremiumStop)} premium`} accent="text-rose-300" />
        <Cell label="Hard exit" value={SNIPER.hardStop} sub="no exceptions" accent="text-amber-300" />
      </div>

      <p className="mt-2.5 text-[10.5px] leading-snug text-slate-500">
        Buying the {play.zoneKind.toLowerCase()} at {num(play.zone)} with {Math.round(play.roomToOpposite)} pts of room to
        the opposite wall. One trade. If it stops out, the day is finished.
      </p>
    </div>
  );
};

const Cell: React.FC<{ label: string; value: string; sub?: string; accent: string }> = ({ label, value, sub, accent }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-2">
    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className={`mt-0.5 font-mono text-[15px] font-bold ${accent}`}>{value}</p>
    {sub && <p className="text-[9.5px] text-slate-600">{sub}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Step 3 — the only picture
// ---------------------------------------------------------------------------

/**
 * Price between its two walls, and nothing else.
 *
 * Four charts went in; one bar comes out. The bar answers the only spatial
 * question the protocol asks - "am I at a wall or stranded in the middle" -
 * and the shaded ends are the literal arm bands, so "is it close enough" stops
 * being an eyeball judgement.
 */
export const ZoneStrip: React.FC<{ view: PhaseSnapshot; liveSpot: number | null }> = ({ view, liveSpot }) => {
  const lo = view.expectedSupport;
  const hi = view.expectedResistance;
  const width = hi - lo;
  if (!(width > 0)) return null;

  const spot = liveSpot ?? view.spot;
  const pct = Math.max(0, Math.min(100, ((spot - lo) / width) * 100));
  const bandPct = Math.min(45, (SNIPER.zoneBuffer / width) * 100);
  const toSup = Math.round(spot - lo);
  const toRes = Math.round(hi - spot);
  const narrow = width < SNIPER.minZoneWidth;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[12px] font-bold text-slate-200">
          <Crosshair size={14} className="text-indigo-400" /> Where price sits
        </h3>
        <span
          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
            narrow ? 'bg-rose-500/15 text-rose-300' : width < SNIPER.comfortableZoneWidth ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
          }`}
        >
          {Math.round(width)} pt zone{narrow ? ' · too narrow to trade' : ''}
        </span>
      </div>

      <div className="relative h-11 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
        {/* the arm bands - inside these, a play triggers */}
        <div className="absolute inset-y-0 left-0 bg-emerald-500/15" style={{ width: `${bandPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-rose-500/15" style={{ width: `${bandPct}%` }} />
        <div className="absolute inset-y-0 w-px bg-emerald-500/40" style={{ left: `${bandPct}%` }} />
        <div className="absolute inset-y-0 w-px bg-rose-500/40" style={{ right: `${bandPct}%` }} />
        {/* price */}
        <div className="absolute inset-y-0 z-10 w-0.5 bg-slate-100" style={{ left: `${pct}%` }} />
        <div
          className="absolute top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-black text-slate-950"
          style={{ left: `${pct}%`, transform: `translate(-${pct}%, -50%)` }}
        >
          {num(spot)}
        </div>
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-3 font-mono text-[10.5px]">
        <span className="text-emerald-300">
          {num(lo)} <span className="text-slate-600">support · {toSup >= 0 ? `${toSup} pts below` : `${-toSup} pts above`}</span>
        </span>
        <span className="text-rose-300">
          <span className="text-slate-600">{toRes >= 0 ? `${toRes} pts above` : `${-toRes} pts below`} · resistance</span> {num(hi)}
        </span>
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-600">
        Shaded ends are the {SNIPER.zoneBuffer}-pt arm bands. Price inside one of them is a trade; price in the middle is
        not, however strong the read looks.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 4 — what happens next
// ---------------------------------------------------------------------------

/**
 * Two short lists: the next actions, and the things that void them.
 *
 * The analyst pass writes these when it has run, because it saw this
 * checkpoint's price; the mechanical plan is the fallback. Either way the cap
 * is three items a side - a checklist you cannot hold in your head during the
 * entry window is not a checklist.
 */
export const NextMoves: React.FC<{
  view: PhaseSnapshot;
  basis: DecisionBasis;
  review?: PhaseReview;
  reviewing: boolean;
  reviewError?: string;
  onRunReview?: () => void;
  aiLabel?: string;
}> = ({ view, basis, review, reviewing, reviewError, onRunReview, aiLabel }) => {
  const steps = (review?.playbook.length ? review.playbook : view.tradePlan).slice(0, 3);
  const kills = (review?.invalidators.length ? review.invalidators : view.playbook?.invalidations ?? []).slice(0, 3);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[12px] font-bold text-slate-200">
            <ArrowRight size={14} className="text-indigo-400" /> Do this next
          </h3>
          {review && (
            <span className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-indigo-300">
              <Brain size={11} /> analyst
            </span>
          )}
        </div>
        {steps.length ? (
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-slate-300">
                <span className="font-black text-indigo-400">{i + 1}.</span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[11px] text-slate-600">Nothing to do at this step.</p>
        )}

        {!review && onRunReview && basis !== 'CHARTS_ONLY' && (
          <button
            onClick={onRunReview}
            disabled={reviewing}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-200 transition hover:bg-indigo-500/25 disabled:opacity-50"
          >
            {reviewing ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
            {reviewing ? 'Reading this price…' : `Ask ${aiLabel || 'the analyst'} to re-read this step`}
          </button>
        )}
        {reviewError && !review && (
          <p className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-400/80">
            <AlertCircle size={11} className="mt-px shrink-0" /> Analyst pass failed — the mechanical plan above still
            stands. {reviewError}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
        <h3 className="mb-2.5 flex items-center gap-2 text-[12px] font-bold text-amber-300">
          <Shield size={14} /> Abandon the plan if
        </h3>
        {kills.length ? (
          <ul className="space-y-2">
            {kills.map((k, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-slate-300">
                <span className="text-amber-500">·</span>
                <span className="flex-1">{k}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-slate-500">
            Nothing specific flagged. The standing rule still applies: if it is choppy or confusing by{' '}
            {SNIPER.reviewBy}, close the laptop.
          </p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Everything else
// ---------------------------------------------------------------------------

/** One collapsible drawer for the analysis that supports the call. */
export const Drawer: React.FC<{ title: string; note?: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title,
  note,
  children,
  defaultOpen
}) => (
  <details className="group rounded-2xl border border-slate-800 bg-slate-900/25" open={defaultOpen}>
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
      <ChevronDown size={15} className="shrink-0 text-slate-500 transition group-open:rotate-180" />
      <span className="text-[12px] font-bold text-slate-300">{title}</span>
      {note && <span className="truncate text-[10.5px] text-slate-600">— {note}</span>}
    </summary>
    <div className="space-y-4 border-t border-slate-800 p-4">{children}</div>
  </details>
);
