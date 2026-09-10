/**
 * SNIPER PANEL — "Nifty Sniper: The Office Protocol"
 *
 * A mission console for exactly one trade a day, taken between 09:25 and 09:45,
 * managed to a hard stop at 10:15.
 *
 * This panel shares NOTHING with the Momentum panel: its own OrderManager, its
 * own log, its own positions, its own day statistics. The two strategies can
 * never show each other's numbers.
 *
 * All protocol rules live in services/sniperEngine.ts so they are unit tested
 * rather than tangled into rendering.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CalendarCheck, Crosshair, Lock, Pause, Play, Timer } from 'lucide-react';
import { FyersCredentials, MarketSnapshot, PivotPoints } from '../../types';
import { OrderManager, Position } from '../../services/orderManager';
import { EnhancedSignalGenerator } from '../../services/enhancedSignalGenerator';
import { imageStorageService } from '../../services/imageStorage';
import { SNIPER, SniperPlaybook } from '../../services/sniperPlaybook';
import {
  OpeningRange, SniperEvaluation, SniperSetup, buildOpeningRange, checkExit,
  evaluate, istDayKey, istMinutesOf, phaseAt, phaseLabelOf, ENTRY_OPEN, ENTRY_CLOSE,
  HARD_STOP, MARKET_OPEN
} from '../../services/sniperEngine';
import { getNextExpiryDate } from '../../constants/niftyExpiryDates';
import { LiveThesis, reconcile, sessionDrift } from '../../services/sniperReconcile';
import { LiveVerdict, isLiveReviewConfigured, requestLiveVerdict } from '../../services/sniperReview';
import { getAIProviderLabel } from '../../services/aiProvider';
import { isMarketLive, readFlag, writeFlag } from '../../services/marketSession';
import { estimateOptionPremium } from '../../services/optionPricing';
import { PaperExitReason, paperTradingEngine } from '../../services/paperTradingService';
import { BlockList, Card, LogEntry, LogFeed, Meter, Pill, PositionsTable, Stat, Toggle, inr } from './shared';
import { RangeBoard, SetupBoard, ThesisBoard, fmt } from './SniperViews';

const LOTS_KEY = 'sniper_lots';
const DAY_KEY = 'sniper_day_state';
const AUTOSTART_KEY = 'sniper_autostart';
const AUTO_PAPER_KEY = 'sniper_auto_paper';
const AUTO_LIVE_KEY = 'sniper_auto_live';
const LOT_SIZE = 75;

interface DayState {
  day: string;
  tradeTaken: boolean;
  pointsCaptured: number | null;
  exitReason: string | null;
  entrySymbol: string | null;
  /**
   * The live setup is persisted, not just held in memory: a refresh mid-trade
   * would otherwise orphan the +30/-30 and 10:15 exit rules while the position
   * stayed open.
   */
  setup: SniperSetup | null;
}

const freshDay = (day: string): DayState => ({
  day,
  tradeTaken: false,
  pointsCaptured: null,
  exitReason: null,
  entrySymbol: null,
  setup: null
});

function loadDayState(): DayState {
  const today = istDayKey(Date.now());
  try {
    const raw = localStorage.getItem(DAY_KEY);
    if (!raw) return freshDay(today);
    const parsed = JSON.parse(raw) as Partial<DayState>;
    // A yesterday flag must never block today's trade.
    if (!parsed || parsed.day !== today) return freshDay(today);
    return { ...freshDay(today), ...parsed, day: today };
  } catch {
    return freshDay(today);
  }
}

interface Props {
  credentials: FyersCredentials;
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  tradingMode: 'PAPER' | 'LIVE';
  /** Lets the shell show that this panel is still working while its tab is hidden. */
  onStatus?: (status: { active: boolean; openPositions: number }) => void;
}

const mmss = (mins: number | null) => (mins == null ? '—' : `${mins}m`);

export const SniperPanel: React.FC<Props> = ({
  credentials, niftyLtp, historyLog, pivots, tradingMode, onStatus
}) => {
  const [armed, setArmed] = useState(false);
  const [autoStart, setAutoStart] = useState(() => readFlag(AUTOSTART_KEY, true));
  /** Auto-execute on paper. On by default — paper trades cost nothing but data. */
  const [autoPaper, setAutoPaper] = useState(() => readFlag(AUTO_PAPER_KEY, true));
  /** Auto-execute with real money. Off by default and never implied by autoPaper. */
  const [autoLive, setAutoLive] = useState(() => readFlag(AUTO_LIVE_KEY, false));
  const [log, setLog] = useState<LogEntry[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [range, setRange] = useState<OpeningRange | null>(null);
  const [evaluation, setEvaluation] = useState<SniperEvaluation | null>(null);
  const [dayState, setDayState] = useState<DayState>(loadDayState);
  const [activeSetup, setActiveSetup] = useState<SniperSetup | null>(() => loadDayState().setup);
  const [playbook, setPlaybook] = useState<SniperPlaybook | null>(null);
  /** True when the loaded plan never saw a real price from today. */
  const [planProvisional, setPlanProvisional] = useState(false);
  const [liveVerdict, setLiveVerdict] = useState<LiveVerdict | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [lots, setLots] = useState(() => Number(localStorage.getItem(LOTS_KEY)) || 1);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  const orderRef = useRef<OrderManager | null>(null);
  /** Guards the exit path: the monitor ticks every second and the close is async. */
  const exitingRef = useRef(false);
  /** Guards the entry path against the auto-execute effect firing twice. */
  const enteringRef = useRef(false);
  const latest = useRef({ niftyLtp, historyLog, pivots });
  latest.current = { niftyLtp, historyLog, pivots };
  const setupRef = useRef<SniperSetup | null>(null);
  setupRef.current = activeSetup;
  const dayRef = useRef(dayState);
  dayRef.current = dayState;

  const addLog = useCallback((text: string, level: LogEntry['level'] = 'info') => {
    setLog(prev => [{ ts: Date.now(), text, level }, ...prev].slice(0, 150));
  }, []);

  // --- services -------------------------------------------------------------
  useEffect(() => {
    orderRef.current = new OrderManager(credentials, tradingMode === 'PAPER');
    setPositions([]);
  }, [credentials, tradingMode]);

  useEffect(() => {
    onStatus?.({ active: armed, openPositions: positions.length });
  }, [armed, positions.length, onStatus]);

  useEffect(() => {
    localStorage.setItem(LOTS_KEY, String(lots));
  }, [lots]);

  useEffect(() => writeFlag(AUTOSTART_KEY, autoStart), [autoStart]);
  useEffect(() => writeFlag(AUTO_PAPER_KEY, autoPaper), [autoPaper]);
  useEffect(() => writeFlag(AUTO_LIVE_KEY, autoLive), [autoLive]);

  const persistDay = useCallback((next: DayState) => {
    setDayState(next);
    try {
      localStorage.setItem(DAY_KEY, JSON.stringify(next));
    } catch {
      /* storage disabled — the in-memory flag still guards this session */
    }
  }, []);

  // Roll the one-trade-per-day lock over at IST midnight.
  useEffect(() => {
    const today = istDayKey(tick);
    if (dayState.day !== today) persistDay(freshDay(today));
  }, [tick, dayState.day, persistDay]);

  /**
   * Auto-arm at the opening bell.
   *
   * The day key is recorded the moment we arm so the engine claims each session
   * exactly once. Without that latch this effect would fight the Pause button —
   * it re-runs every second, so a manual pause would be undone on the next tick.
   * Pressing Pause writes today's key here too, which is what makes the pause
   * stick for the rest of the session.
   */
  const autoArmedDayRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoStart) return;
    const now = new Date(tick);
    const today = istDayKey(tick);
    const live = isMarketLive(now);

    if (live && !armed && autoArmedDayRef.current !== today) {
      autoArmedDayRef.current = today;
      setArmed(true);
      // Name the phase we are actually arming into. Hard-coding "the Download"
      // is wrong for every start after 09:25, which is most of them.
      addLog(`🔔 Market open — sniper auto-armed · ${phaseLabelOf(phaseAt(now))}`, 'good');
      return;
    }
    // Stand the engine down once the bell rings so it cannot act on stale data.
    if (!live && armed && autoArmedDayRef.current === today) {
      setArmed(false);
      addLog('🌙 Market closed — sniper stood down.', 'info');
    }
  }, [autoStart, armed, tick, addLog]);

  // --- pre-market handoff ---------------------------------------------------
  /**
   * The plan the pre-market screen produced, kept in step with it.
   *
   * Two things go wrong if this is loaded once and left: a re-cut plan (09:10,
   * 09:15, or a hand-run phase) never reaches the engine, so the sniper trades
   * this morning off last night's charts; and every remount re-announces the
   * same plan, which is why "Pre-market plan loaded" appeared twice. Keying on
   * the plan's own timestamp fixes both - it reloads on a poll, but only
   * adopts and announces a plan that has actually changed.
   */
  const loadedPlanRef = useRef<number | null>(null);
  const loadPlaybook = useCallback(async () => {
    try {
      const saved = await imageStorageService.loadState<{
        playbook?: SniperPlaybook;
        generatedAt?: number;
        provisional?: boolean;
      }>('preMarketDecision');
      if (saved?.playbook && saved.generatedAt && istDayKey(saved.generatedAt) === istDayKey(Date.now())) {
        if (loadedPlanRef.current === saved.generatedAt) return;
        const isUpdate = loadedPlanRef.current !== null;
        loadedPlanRef.current = saved.generatedAt;
        setPlaybook(saved.playbook);
        // A plan cut before any real price from today is a forecast, not a
        // reading. Reconciliation is allowed to overrule a provisional
        // "stand aside"; it is not allowed to overrule a considered one.
        setPlanProvisional(saved.provisional === true);
        addLog(
          `📋 Pre-market plan ${isUpdate ? 're-cut' : 'loaded'} — ${saved.playbook.verdictHeadline}`,
          'info'
        );
      } else if (loadedPlanRef.current !== null) {
        loadedPlanRef.current = null;
        setPlaybook(null);
        setPlanProvisional(false);
        addLog('📋 Pre-market plan cleared.', 'info');
      } else {
        setPlaybook(null);
        setPlanProvisional(false);
      }
    } catch {
      loadedPlanRef.current = null;
      setPlaybook(null);
      setPlanProvisional(false);
    }
  }, [addLog]);

  /** The manual Reload button must re-announce even when nothing changed. */
  const reloadPlaybook = useCallback(() => {
    loadedPlanRef.current = null;
    loadPlaybook();
  }, [loadPlaybook]);

  // --- one-second clock so every countdown is honest ------------------------
  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /**
   * Countdowns need a one-second clock, but re-scoring the signal engine that
   * often is pure waste. This coarse tick changes once every ten seconds.
   */
  const slowTick = Math.floor(tick / 10_000);

  /**
   * Pick up a re-cut plan without a page reload.
   *
   * The pre-market screen re-cuts its decision at 09:10, 09:15 and on drift,
   * and writes it to the same key. Loading once at mount left the sniper
   * holding whichever verdict existed when the tab was opened — typically the
   * pre-open "STAND ASIDE" — while the screen next door had moved on.
   */
  useEffect(() => {
    loadPlaybook();
  }, [slowTick, loadPlaybook]);

  // --- the Download: lock the 09:15–09:25 range ------------------------------
  useEffect(() => {
    const now = new Date();
    const prevClose =
      historyLog.length > 0 && isFinite(historyLog[0].ptsChg)
        ? historyLog[0].niftyLtp - historyLog[0].ptsChg
        : null;
    const built = buildOpeningRange(historyLog, prevClose, now);
    if (!built) return;
    setRange(prev => {
      if (prev && prev.high === built.high && prev.low === built.low && prev.samples === built.samples) {
        return prev;
      }
      return built;
    });
  }, [historyLog, slowTick]);

  const rangeLockedRef = useRef(false);
  useEffect(() => {
    if (!range || rangeLockedRef.current) return;
    if (istMinutesOf(new Date(tick)) < ENTRY_OPEN) return;
    rangeLockedRef.current = true;
    addLog(
      `🔒 Range locked — high ${fmt(range.high)} / low ${fmt(range.low)} → support ${fmt(range.support)}, resistance ${fmt(range.resistance)} (${range.openType.replace('_', ' ')})`,
      'good'
    );
  }, [range, tick, addLog]);

  // --- live evaluation ------------------------------------------------------
  const expiry = useMemo(() => {
    const e = getNextExpiryDate();
    if (!e) return '';
    const d = new Date(e.date);
    return `${d.getFullYear().toString().slice(2)}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  // The protocol needs a direction opinion. It is derived here, from this
  // panel's own data, and is never read from the Momentum panel.
  const liveSignal = useMemo(() => {
    void slowTick;
    if (!niftyLtp || historyLog.length < 5) {
      return { direction: 'NEUTRAL' as const, confidence: 0, reasons: [] as string[] };
    }
    const s = EnhancedSignalGenerator.generateSignal(
      historyLog,
      range?.support ?? pivots?.s1 ?? niftyLtp - 50,
      range?.resistance ?? pivots?.r1 ?? niftyLtp + 50,
      niftyLtp
    );
    return { direction: s.direction, confidence: s.confidence, reasons: s.reasons };
  }, [slowTick, niftyLtp, historyLog, range, pivots]);

  /**
   * How far the session has travelled since the bell, from this panel's own
   * history. Used to ask whether the tape is going the way the morning said.
   */
  const drift = useMemo(() => {
    void slowTick;
    return sessionDrift(historyLog, MARKET_OPEN, new Date());
  }, [historyLog, slowTick]);

  const breadth = historyLog.length ? historyLog[0].overallSent : null;

  /**
   * THE TRADER'S LOOP.
   *
   * The morning's plan is a hypothesis. Every ten seconds it is re-checked
   * against the tape, wall by wall, and the levels the engine trades are the
   * output of that check rather than of either source alone. When the tape
   * confirms the plan the planned levels are used, because they carry chart and
   * OI evidence the mechanical range does not; when it contradicts them, the
   * plan is dropped on the spot and the tape is traded instead.
   */
  const thesis = useMemo<LiveThesis>(() => {
    void slowTick;
    return reconcile({
      playbook,
      range,
      drift,
      breadth,
      planIsProvisional: planProvisional
    });
  }, [playbook, range, drift, breadth, planProvisional, slowTick]);

  /**
   * Every adjustment is announced exactly once.
   *
   * Silent level substitution is the most dangerous thing this feature could
   * do - the log is how you find out afterwards why the sniper armed 40 points
   * from where the plan said it would.
   */
  const announcedRef = useRef<string>('');
  useEffect(() => {
    const key = `${thesis.state}|${thesis.support}|${thesis.resistance}|${thesis.adjustments.join('~')}`;
    if (key === announcedRef.current) return;
    if (thesis.state === 'NO_PLAN' || thesis.state === 'PENDING') {
      announcedRef.current = key;
      return;
    }
    announcedRef.current = key;

    const tone = thesis.state === 'INVALIDATED' ? 'bad' : thesis.state === 'CONFIRMED' ? 'good' : 'warn';
    addLog(
      `🧭 Thesis ${thesis.state.toLowerCase()} — ${thesis.score}% of the morning's read held. Trading ${fmt(
        thesis.support ?? 0
      )} / ${fmt(thesis.resistance ?? 0)} (${thesis.levelSource.toLowerCase()}), confidence ${
        thesis.confidenceDelta >= 0 ? '+' : ''
      }${thesis.confidenceDelta}.`,
      tone as LogEntry['level']
    );
    thesis.adjustments.forEach(a => addLog(`↻ ${a}`, 'warn'));
    if (thesis.veto) addLog(`⛔ ${thesis.veto}`, 'bad');
  }, [thesis, addLog]);

  useEffect(() => {
    const now = new Date(tick);
    const spot = niftyLtp;
    const { direction: signalDirection, confidence: signalConfidence, reasons: signalReasons } = liveSignal;

    // The AI pass is veto-only, so it can only ever make the thesis stricter.
    const aiPenalty =
      liveVerdict && liveVerdict.call !== 'PROCEED' ? liveVerdict.confidencePenalty : 0;
    const aiVeto =
      liveVerdict?.call === 'BLOCK' ? `Risk officer stood the day down — ${liveVerdict.reason}` : null;

    setEvaluation(
      evaluate({
        now,
        spot,
        range,
        signalDirection,
        signalConfidence,
        signalReasons: [...signalReasons, ...thesis.adjustments],
        hasOpenPosition: positions.length > 0,
        dailyTradeDone: dayState.tradeTaken,
        expiry,
        thesis: {
          support: thesis.support,
          resistance: thesis.resistance,
          confidenceDelta: thesis.confidenceDelta + (aiPenalty === -100 ? 0 : aiPenalty),
          veto: thesis.veto ?? aiVeto,
          state: thesis.state
        }
      })
    );
  }, [tick, niftyLtp, range, liveSignal, positions.length, dayState.tradeTaken, expiry, thesis, liveVerdict]);

  // --- the risk officer -----------------------------------------------------

  const aiReady = useMemo(() => isLiveReviewConfigured(credentials), [credentials]);
  const aiLabel = useMemo(() => getAIProviderLabel(credentials), [credentials]);

  /**
   * The live second opinion.
   *
   * Held deliberately outside the decision loop. The engine never waits on it:
   * if it has not answered, or fails, the mechanical decision stands. All it
   * can do is subtract - see services/sniperReview.ts for why that constraint
   * is structural rather than a matter of prompting.
   */
  const evalRef = useRef<SniperEvaluation | null>(null);
  evalRef.current = evaluation;
  const thesisRef = useRef(thesis);
  thesisRef.current = thesis;

  const runLiveReview = useCallback(async () => {
    if (!aiReady || reviewing) return;
    const t = thesisRef.current;
    const ev = evalRef.current;
    const { niftyLtp: spot, historyLog: hist } = latest.current;
    setReviewing(true);
    try {
      const verdict = await requestLiveVerdict(
        credentials,
        {
          now: Date.now(),
          spot,
          phase: ev?.phase ?? phaseAt(new Date()),
          thesis: t,
          range: range
            ? {
                open: range.open,
                high: range.high,
                low: range.low,
                support: range.support,
                resistance: range.resistance,
                samples: range.samples
              }
            : null,
          planHeadline: playbook?.verdictHeadline ?? null,
          planReason: playbook?.verdictReason ?? null,
          signalDirection: liveSignal.direction,
          signalConfidence: liveSignal.confidence,
          signalReasons: liveSignal.reasons,
          breadth: hist.length ? hist[0].overallSent : null,
          pcr: hist.length ? hist[0].pcr : null,
          optionsSent: hist.length ? hist[0].optionsSent : null,
          drift: sessionDrift(hist, MARKET_OPEN, new Date()),
          engineCanEnter: ev?.canEnter ?? false,
          engineBlocks: (ev?.blocks ?? []).map(b => b.message),
          engineSetup: ev?.setup ? `${ev.setup.optionType} ${ev.setup.strike} from ${ev.setup.entrySpot}` : null
        },
        aiLabel
      );
      setLiveVerdict(verdict);
      addLog(
        `🧠 Risk officer: ${verdict.call} — ${verdict.reason}`,
        verdict.call === 'BLOCK' ? 'bad' : verdict.call === 'TRIM' ? 'warn' : 'good'
      );
    } catch (err: any) {
      // A failed second opinion must never become a reason not to trade, nor a
      // reason to trade. It simply leaves the mechanical decision untouched.
      addLog(`🧠 Risk officer unavailable — ${err?.message ?? 'no answer'}. Mechanical read stands.`, 'warn');
    } finally {
      setReviewing(false);
    }
  }, [aiReady, aiLabel, credentials, reviewing, range, playbook, liveSignal, addLog]);

  /**
   * One automatic pass, fired when the range locks at 09:25.
   *
   * That is the moment the morning's thesis has been fully tested and the
   * entry window opens - the only point where a second opinion can change
   * anything and still leave time to act on it.
   */
  const autoReviewedRef = useRef(false);
  useEffect(() => {
    if (autoReviewedRef.current || !aiReady || !armed) return;
    if (!range || thesis.state === 'PENDING' || thesis.state === 'NO_PLAN') return;
    if (istMinutesOf(new Date(tick)) < ENTRY_OPEN) return;
    if (istMinutesOf(new Date(tick)) >= ENTRY_CLOSE) return;
    autoReviewedRef.current = true;
    addLog(`🧠 Asking ${aiLabel} to sanity-check the reconciled thesis…`, 'info');
    runLiveReview();
  }, [tick, aiReady, armed, range, thesis.state, aiLabel, runLiveReview, addLog]);

  // --- paper ledger mirror --------------------------------------------------

  /**
   * Every auto-trade is written into the Paper Trading book, tagged.
   *
   * The Sniper places its orders through its own OrderManager, so before this
   * the trades the system took automatically were absent from the paper
   * ledger - the equity curve, the win rate and the expectancy on that screen
   * described only the trades taken by hand. A journal that omits the trades
   * you did not personally click is worse than no journal.
   *
   * Only PAPER-mode fills are mirrored. The paper book runs on simulated
   * capital; posting a real fill into it would draw down that simulated
   * balance against money it never held and corrupt every statistic derived
   * from it. Live fills stay in the broker's own book, and the log says so.
   */
  const tradingModeRef = useRef(tradingMode);
  tradingModeRef.current = tradingMode;

  const journalEntry = useCallback(
    (setup: SniperSetup, premium: number) => {
      if (tradingModeRef.current !== 'PAPER') {
        addLog('📒 Live fill — not written to the paper ledger (it tracks simulated capital only).', 'info');
        return;
      }
      const t = thesisRef.current;
      const tags = [
        'AUTOTRADE',
        'SNIPER',
        setup.zone === 'NEAR_SUPPORT' ? 'AT-SUPPORT' : 'AT-RESISTANCE',
        `THESIS-${t.state}`,
        `LEVELS-${t.levelSource}`
      ];
      paperTradingEngine
        .openExternal({
          symbol: setup.symbol,
          displayName: `NIFTY ${setup.strike} ${setup.optionType}`,
          strike: setup.strike,
          optionType: setup.optionType,
          expiry: setup.expiry,
          lots,
          entryPrice: premium,
          spot: setup.entrySpot,
          tags,
          notes: `Sniper ${setup.optionType} at ${fmt(setup.entrySpot)} · target ${fmt(setup.targetSpot)} / stop ${fmt(
            setup.stopSpot
          )} · ${setup.reasoning[0] ?? ''}`
        })
        .then(r =>
          addLog(
            r.ok ? `📒 Logged to Paper Trading — tagged ${tags.join(', ')}` : `📒 Paper log skipped — ${r.message}`,
            r.ok ? 'info' : 'warn'
          )
        )
        .catch(() => addLog('📒 Could not write this trade to the paper ledger.', 'warn'));
    },
    [addLog, lots]
  );

  /** Map the protocol's exit labels onto the paper book's reasons. */
  const journalExit = useCallback(
    (symbol: string, premium: number, reason: string) => {
      if (tradingModeRef.current !== 'PAPER') return;
      const r = reason.toLowerCase();
      const mapped: PaperExitReason = r.includes('target')
        ? 'TARGET'
        : r.includes('stop -') || r.includes('stoploss') || r.includes('stop loss')
          ? 'STOPLOSS'
          : r.includes('hard stop')
            ? 'EOD'
            : 'MANUAL';
      paperTradingEngine
        .closeExternal(symbol, premium, mapped, latest.current.niftyLtp)
        .then(res => {
          if (res.ok) addLog(`📒 Paper ledger updated — ${res.message}`, 'info');
        })
        .catch(() => addLog('📒 Could not close this trade in the paper ledger.', 'warn'));
    },
    [addLog]
  );

  // --- position monitoring & the 10:15 hard stop ----------------------------
  const closeSymbol = useCallback(
    async (symbol: string, reason: string) => {
      const om = orderRef.current;
      if (!om) return;
      const pos = om.getPositions().find(p => p.symbol === symbol);
      if (!pos || exitingRef.current) return;
      exitingRef.current = true;
      setBusy(true);
      try {
        const res = await om.placeOrder(symbol, pos.side === 'LONG' ? 'SELL' : 'BUY', Math.abs(pos.quantity), 'MARKET');
        if (res.success) {
          addLog(`🚪 Exit ${symbol} — ${reason} · P&L ${inr(pos.pnl)}`, pos.pnl >= 0 ? 'good' : 'bad');
          journalExit(symbol, pos.ltp ?? pos.avgPrice, reason);
          persistDay({
            ...dayRef.current,
            pointsCaptured: setupRef.current
              ? Math.round(((niftyLtp ?? setupRef.current.entrySpot) - setupRef.current.entrySpot) *
                  (setupRef.current.direction === 'LONG' ? 1 : -1))
              : null,
            exitReason: reason,
            setup: null
          });
          setActiveSetup(null);
        } else {
          addLog(`❌ Exit rejected for ${symbol}: ${res.message ?? 'unknown error'}`, 'bad');
        }
        setPositions(om.getPositions());
      } finally {
        exitingRef.current = false;
        setBusy(false);
      }
    },
    [addLog, niftyLtp, persistDay]
  );

  useEffect(() => {
    const om = orderRef.current;
    if (!om) return;
    const open = om.getPositions();
    if (open.length === 0) {
      if (positions.length !== 0) setPositions([]);
      return;
    }

    // The hard stop is unconditional. Even with no setup in memory - a refresh,
    // a manually placed order - nothing may be held past 10:15.
    if (istMinutesOf(new Date(tick)) >= HARD_STOP) {
      closeSymbol(open[0].symbol, `${SNIPER.hardStop} hard stop`);
      return;
    }

    // Options premium is not tracked live here; the spot move drives the
    // protocol's +30 / -30 decision, exactly as the manual system does.
    const setup = setupRef.current;
    if (setup && niftyLtp) {
      const premium = Math.max(
        1,
        open[0].avgPrice + (niftyLtp - setup.entrySpot) * (setup.direction === 'LONG' ? 1 : -1) * SNIPER.itmDelta
      );
      open.forEach(p => om.updatePositionPnL(p.symbol, premium));
      // Keep the paper ledger's unrealised P&L, high-water and low-water marks
      // in step. It never exits on these - the protocol's spot rules do.
      if (tradingModeRef.current === 'PAPER') paperTradingEngine.markExternal(open[0].symbol, premium);
      const verdict = checkExit({ setup, spot: niftyLtp, now: new Date(tick) });
      if (verdict.exit) {
        const label =
          verdict.reason === 'TARGET'
            ? `target +${SNIPER.targetPoints} hit`
            : verdict.reason === 'STOP'
              ? `stop -${SNIPER.stopPoints} hit`
              : `${SNIPER.hardStop} hard stop`;
        closeSymbol(open[0].symbol, label);
        return;
      }
    }
    setPositions(om.getPositions());
  }, [tick, niftyLtp, closeSymbol, positions.length]);

  // --- execution ------------------------------------------------------------
  const execute = useCallback(async () => {
    const om = orderRef.current;
    const setup = evaluation?.setup;
    if (!om || !setup) return;
    if (dayRef.current.tradeTaken) {
      addLog('🛑 Blocked — today\'s single trade is already spent.', 'bad');
      return;
    }
    // `busy` is React state and lands a render later; the auto-execute effect
    // re-runs every second, so only a ref can stop a second order going out
    // before the first has been acknowledged.
    if (enteringRef.current) return;
    enteringRef.current = true;
    setBusy(true);
    try {
      const qty = lots * LOT_SIZE;
      const fill = estimateOptionPremium(setup.entrySpot, setup.strike, setup.optionType);
      const res = await om.placeOrder(setup.symbol, 'BUY', qty, 'MARKET', undefined, undefined, fill);
      if (res.success) {
        setActiveSetup(setup);
        setPositions(om.getPositions());
        persistDay({ ...dayRef.current, tradeTaken: true, entrySymbol: setup.symbol, setup });
        addLog(
          `🎯 ENTERED ${setup.symbol} · ${qty} qty · spot ${fmt(setup.entrySpot)} → target ${fmt(setup.targetSpot)} / stop ${fmt(setup.stopSpot)}`,
          'good'
        );
        journalEntry(setup, fill);
      } else {
        addLog(`❌ Order rejected: ${res.message ?? 'unknown error'}`, 'bad');
      }
    } finally {
      enteringRef.current = false;
      setBusy(false);
    }
  }, [evaluation, lots, addLog, persistDay]);

  /**
   * Hands-off entry. Every gate the manual button enforces is re-checked here —
   * the engine must be armed, the protocol must say `canEnter`, the day's single
   * trade must still be unspent and nothing may already be open.
   *
   * Real money needs its own opt-in: `autoPaper` never implies `autoLive`.
   */
  const autoExecuteOn = tradingMode === 'PAPER' ? autoPaper : autoLive;
  useEffect(() => {
    if (!armed || !autoExecuteOn || busy || enteringRef.current) return;
    if (!evaluation?.canEnter || !evaluation.setup) return;
    if (dayState.tradeTaken || positions.length > 0) return;
    addLog(
      `🤖 Auto-execute (${tradingMode}) — every protocol gate is green, taking the shot.`,
      'warn'
    );
    execute();
  }, [
    armed, autoExecuteOn, busy, evaluation, dayState.tradeTaken, positions.length,
    tradingMode, execute, addLog
  ]);

  // --- derived view data ----------------------------------------------------
  const phase = evaluation?.phase ?? 'PRE_OPEN';
  const nowMins = istMinutesOf(new Date(tick));

  const banner = useMemo(() => {
    if (!evaluation) return { text: 'Initialising', tone: 'muted' as const, sub: '' };
    if (evaluation.mustExit) return { text: 'HARD STOP', tone: 'bad' as const, sub: 'Closing everything — 10:15 has passed.' };
    if (positions.length > 0)
      return { text: 'IN TRADE', tone: 'info' as const, sub: 'Managing the position. Target +30, stop −30, out by 10:15.' };
    if (dayState.tradeTaken)
      return { text: 'DAY COMPLETE', tone: 'muted' as const, sub: 'One trade taken. The protocol is finished for today.' };
    if (evaluation.canEnter)
      return { text: 'ARMED — TAKE IT', tone: 'good' as const, sub: 'Every gate is green. This is the trade.' };
    if (phase === 'ENTRY_WINDOW')
      return { text: 'WAITING', tone: 'warn' as const, sub: 'Inside the window, but the setup has not appeared.' };
    return { text: 'STAND DOWN', tone: 'muted' as const, sub: phaseLabelOf(phase) };
  }, [evaluation, positions.length, dayState.tradeTaken, phase]);

  const bannerCls = {
    good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_60px_-20px_rgba(16,185,129,0.8)]',
    bad: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    info: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
    muted: 'border-slate-700 bg-slate-800/40 text-slate-300'
  }[banner.tone];

  const timeline = [
    { label: 'Download', from: MARKET_OPEN, to: ENTRY_OPEN, note: 'watch only' },
    { label: 'Entry', from: ENTRY_OPEN, to: ENTRY_CLOSE, note: 'the only window' },
    { label: 'Manage', from: ENTRY_CLOSE, to: HARD_STOP, note: 'no new trades' }
  ];

  return (
    <div className="space-y-4">
      {/* ---- command banner ---- */}
      <div className={`rounded-2xl border p-5 ${bannerCls}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] opacity-70">
              <Crosshair className="h-3.5 w-3.5" /> Office Protocol
            </div>
            <h2 className="mt-1 text-3xl font-black tracking-tight">{banner.text}</h2>
            <p className="mt-1 max-w-xl text-xs opacity-80">{banner.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Claim today for the manual choice so the auto-arm effect,
                // which re-runs every second, cannot immediately undo a pause.
                autoArmedDayRef.current = istDayKey(Date.now());
                setArmed(a => !a);
                addLog(armed ? '⏸️ Sniper monitoring paused.' : '▶️ Sniper monitoring armed.', 'info');
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                armed
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
              }`}
            >
              {armed ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {armed ? 'Pause' : 'Arm'}
            </button>
          </div>
        </div>

        {/* countdowns */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="IST now" value={new Date(tick).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })} />
          <Stat label="Entry opens in" value={mmss(evaluation?.minutesToEntry ?? null)} sub={SNIPER.entryStart} />
          <Stat
            label="No new entries in"
            value={mmss(evaluation?.minutesToNoNewEntries ?? null)}
            sub={SNIPER.reviewBy}
            tone={(evaluation?.minutesToNoNewEntries ?? 99) <= 5 ? 'warn' : 'default'}
          />
          <Stat
            label="Hard stop in"
            value={mmss(evaluation?.minutesToHardStop ?? null)}
            sub={SNIPER.hardStop}
            tone={(evaluation?.minutesToHardStop ?? 99) <= 10 ? 'bad' : 'default'}
          />
        </div>
      </div>

      {/* ---- phase timeline ---- */}
      <Card title="Protocol timeline" icon={<Timer className="h-4 w-4 text-emerald-400" />}>
        <div className="space-y-3">
          {timeline.map(t => {
            const active = nowMins >= t.from && nowMins < t.to;
            const done = nowMins >= t.to;
            const pct = active ? ((nowMins - t.from) / (t.to - t.from)) * 100 : done ? 100 : 0;
            return (
              <div key={t.label}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className={active ? 'font-semibold text-emerald-300' : done ? 'text-slate-500' : 'text-slate-400'}>
                    {t.label} <span className="text-slate-600">· {t.note}</span>
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {String(Math.floor(t.from / 60)).padStart(2, '0')}:{String(t.from % 60).padStart(2, '0')} —{' '}
                    {String(Math.floor(t.to / 60)).padStart(2, '0')}:{String(t.to % 60).padStart(2, '0')}
                  </span>
                </div>
                <Meter value={pct} tone={active ? 'bg-emerald-400' : done ? 'bg-slate-600' : 'bg-slate-800'} />
              </div>
            );
          })}
        </div>
      </Card>

      {/* ---- automation ---- */}
      <Card title="Automation" icon={<Bot className="h-4 w-4 text-emerald-400" />}>
        <div className="space-y-2">
          <Toggle
            label="Auto-arm at market open"
            hint="Arms the Download at 09:15 IST without anyone pressing Arm."
            checked={autoStart}
            onChange={setAutoStart}
          />
          <Toggle
            label="Auto-execute on PAPER"
            hint="Takes the shot by itself the moment every protocol gate turns green."
            checked={autoPaper}
            onChange={setAutoPaper}
          />
          <Toggle
            label="Auto-execute on LIVE"
            hint="Real money, placed with no confirmation. Off unless you say otherwise."
            checked={autoLive}
            onChange={setAutoLive}
            danger
          />
        </div>
        <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
          Currently in <span className="font-semibold text-slate-200">{tradingMode}</span> mode — auto-execute is{' '}
          <span className={autoExecuteOn ? 'font-semibold text-emerald-300' : 'font-semibold text-slate-300'}>
            {autoExecuteOn ? 'ON' : 'OFF'}
          </span>
          . The one-trade-a-day lock, the 09:25–09:45 window and the 10:15 hard stop still apply.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <RangeBoard range={range} spot={niftyLtp} evaluation={evaluation} />
        <ThesisBoard
          playbook={playbook}
          thesis={thesis}
          verdict={liveVerdict}
          reviewing={reviewing}
          aiReady={aiReady}
          aiLabel={aiLabel}
          onReload={reloadPlaybook}
          onReview={() => { runLiveReview(); }}
        />
      </div>

      <SetupBoard
        evaluation={evaluation}
        phase={phase}
        range={range}
        lots={lots}
        lotSize={LOT_SIZE}
        armed={armed}
        busy={busy}
        tradeTaken={dayState.tradeTaken}
        hasPosition={positions.length > 0}
        tradingMode={tradingMode}
        onLots={setLots}
        onExecute={execute}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Sniper positions" icon={<Lock className="h-4 w-4 text-emerald-400" />}>
          <PositionsTable positions={positions} onClose={s => closeSymbol(s, 'manual exit')} busy={busy} />
          {positions.length > 0 && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
              Auto-exit at +{SNIPER.targetPoints} / −{SNIPER.stopPoints} spot points, or {SNIPER.hardStop} — whichever
              comes first.
            </p>
          )}
        </Card>

        <Card title="Today" icon={<CalendarCheck className="h-4 w-4 text-emerald-400" />}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Trade used" value={dayState.tradeTaken ? '1 of 1' : '0 of 1'} tone={dayState.tradeTaken ? 'warn' : 'good'} />
            <Stat
              label="Spot points"
              value={dayState.pointsCaptured == null ? '—' : `${dayState.pointsCaptured > 0 ? '+' : ''}${dayState.pointsCaptured}`}
              tone={dayState.pointsCaptured == null ? 'default' : dayState.pointsCaptured >= 0 ? 'good' : 'bad'}
              sub={dayState.exitReason ?? undefined}
            />
          </div>
          {dayState.tradeTaken && (
            <button
              onClick={() => {
                persistDay(freshDay(istDayKey(Date.now())));
                addLog('🔓 Daily lock reset manually.', 'warn');
              }}
              className="mt-3 w-full rounded-lg border border-slate-700 py-2 text-[11px] text-slate-400 hover:bg-slate-800"
            >
              Reset daily lock (use only if the trade was cancelled)
            </button>
          )}
        </Card>
      </div>

      <Card title="Sniper log" icon={<Crosshair className="h-4 w-4 text-emerald-400" />}>
        <LogFeed entries={log} emptyHint="Arm the sniper to start the Download." />
      </Card>
    </div>
  );
};

export default SniperPanel;
