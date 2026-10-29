/**
 * OPS STATE BRIDGE — lets the server-side Nifty50Ops agent see the browser.
 *
 * The paper book, Sniper/Momentum and Opening Pilot all live in this tab
 * (IndexedDB/localStorage), so a server process has no way to answer "what is
 * my position?". Every 5 s the tab that holds OPS_PUBLISHER_LOCK posts one
 * OpsStateSnapshot to POST /api/ops/state.
 *
 * Read-only by construction: the collector takes plain values and returns a
 * new object. Engines push their state in through `reportEngine` /
 * `reportPositions`; nothing here ever writes back into an engine, a book or
 * a store. A second tab waits on the lock and takes over when the first closes.
 */

import { onHeartbeat, scheduleBackground } from './heartbeat';
import { journalService, logJournal } from './journal';

export type BookKind = 'paper' | 'pilot' | 'live';
export type MarketSource = 'fyers' | 'paytm' | 'redis' | null;

export interface OpsPosition {
  book: BookKind;
  /** SNIPER, MOMENTUM, PILOT or MANUAL. */
  strategy: string;
  symbol: string;
  qty: number;
  entry: number;
  ltp: number | null;
  stop?: number;
  /** A Sniper stop is a Nifty spot level; everything else is an option premium. */
  stopBasis?: 'premium' | 'spot';
  target?: number;
  openedAt: number;
}

export interface OpsStateSnapshot {
  schema: 1;
  at: number;
  tabId: string;
  market: { spot: number | null; quoteAgeSec: number | null; source: MarketSource };
  engines: {
    autotrade: { mode: 'PAPER' | 'LIVE'; requestedMode: 'PAPER' | 'LIVE'; armed: boolean; killed: boolean; broker: string | null };
    sniper: { state: string; armed: boolean; playbookDate: string | null; lastDecision?: string };
    momentum: { state: string; guardWarm: boolean; lastGate?: string };
    pilot: { phase: string; readiness?: string };
  };
  positions: OpsPosition[];
  premarket: { decisionDate: string | null; generatedAt: number | null; bias?: string };
  vision: { lastCaptureAt: number | null; stale: boolean; verdict?: string; runId?: string };
  health: { heartbeatLagMs: number; storageOk: boolean; journalQueue: number };
}

// --- engine reports ---------------------------------------------------------

export interface EngineReports {
  autotrade?: Partial<OpsStateSnapshot['engines']['autotrade']>;
  sniper?: Partial<OpsStateSnapshot['engines']['sniper']>;
  momentum?: Partial<OpsStateSnapshot['engines']['momentum']>;
}

const engineReports: EngineReports = {};
const positionReports = new Map<string, OpsPosition[]>();

/** Called by an engine panel when its state changes. Shallow-merged. */
export function reportEngine<K extends keyof EngineReports>(name: K, patch: EngineReports[K]): void {
  engineReports[name] = { ...(engineReports[name] as object), ...(patch as object) } as EngineReports[K];
}

/** Replace one engine's open positions (an empty array means flat). */
export function reportPositions(source: string, positions: OpsPosition[]): void {
  positionReports.set(source, positions.map(p => ({ ...p })));
}

export function getEngineReports(): { engines: EngineReports; positions: OpsPosition[] } {
  return {
    engines: JSON.parse(JSON.stringify(engineReports)),
    positions: Array.from(positionReports.values()).flat().map(p => ({ ...p }))
  };
}

// --- collector --------------------------------------------------------------

export const istDate = (ms: number): string =>
  new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export interface CollectInputs {
  now: number;
  tabId: string;
  spot: number | null;
  lastQuoteAt: number | null;
  source: MarketSource;
  /** localStorage-backed fallbacks for when UnifiedAutoTrade has not reported yet. */
  storedMode: 'PAPER' | 'LIVE';
  storedKilled: boolean;
  engines: EngineReports;
  enginePositions: OpsPosition[];
  manualPaper: Array<{ symbol: string; quantity: number; entryPrice: number; ltp: number; stopLoss: number | null; target: number | null; entryTime: number }>;
  pilot: {
    position: { symbol: string; quantity: number; entryPremium: number; mark: number; stopPremium: number; targetPremium: number; entryAt: number } | null;
    todayDecision: { action: string; reason: string } | null;
    latestFrame: { status: string } | null;
  } | null;
  premarket: { generatedAt: number; primaryBias?: string; headline?: string } | null;
  vision: { id: string; finishedAt: number; bias?: string } | null;
  heartbeatLagMs: number;
  storageOk: boolean;
  journalQueue: number;
}

/** Vision captures run every few minutes in session; a quarter hour without one is a gap. */
export const VISION_STALE_MS = 15 * 60_000;

/** Pure. Builds a fresh snapshot and never mutates its inputs. */
export function collectOpsState(i: CollectInputs): OpsStateSnapshot {
  const at = i.engines.autotrade ?? {};
  const sn = i.engines.sniper ?? {};
  const mo = i.engines.momentum ?? {};
  const killed = at.killed ?? i.storedKilled;
  const requestedMode = at.requestedMode ?? i.storedMode;
  const mode = at.mode ?? (killed ? 'PAPER' : requestedMode);

  const positions: OpsPosition[] = i.enginePositions.map(p => ({ ...p }));
  for (const p of i.manualPaper) {
    positions.push({
      book: 'paper', strategy: 'MANUAL', symbol: p.symbol, qty: p.quantity, entry: p.entryPrice,
      ltp: Number.isFinite(p.ltp) ? p.ltp : null,
      ...(p.stopLoss != null ? { stop: p.stopLoss, stopBasis: 'premium' as const } : {}),
      ...(p.target != null ? { target: p.target } : {}),
      openedAt: p.entryTime
    });
  }

  let pilotPhase = 'IDLE';
  let pilotReadiness: string | undefined;
  if (i.pilot) {
    const pos = i.pilot.position;
    if (pos) {
      pilotPhase = 'IN_TRADE';
      positions.push({
        book: 'pilot', strategy: 'PILOT', symbol: pos.symbol, qty: pos.quantity, entry: pos.entryPremium,
        ltp: pos.mark, stop: pos.stopPremium, stopBasis: 'premium', target: pos.targetPremium, openedAt: pos.entryAt
      });
    } else if (i.pilot.todayDecision) {
      pilotPhase = `DECIDED ${i.pilot.todayDecision.action}`;
    } else if (i.pilot.latestFrame) {
      pilotPhase = 'WATCHING';
    }
    pilotReadiness = i.pilot.latestFrame?.status;
  }

  const premarketDate = i.premarket?.generatedAt ? istDate(i.premarket.generatedAt) : null;
  const bias = i.premarket ? [i.premarket.primaryBias, i.premarket.headline].filter(Boolean).join(' · ') : '';

  return {
    schema: 1,
    at: i.now,
    tabId: i.tabId,
    market: {
      spot: Number.isFinite(i.spot as number) ? i.spot : null,
      quoteAgeSec: i.lastQuoteAt ? Math.max(0, Math.round((i.now - i.lastQuoteAt) / 1000)) : null,
      source: i.source
    },
    engines: {
      autotrade: {
        mode, requestedMode, killed,
        armed: at.armed ?? Boolean(sn.armed || mo.state === 'RUNNING'),
        broker: at.broker ?? null
      },
      sniper: {
        state: sn.state ?? 'NOT_MOUNTED', armed: sn.armed ?? false, playbookDate: sn.playbookDate ?? null,
        ...(sn.lastDecision ? { lastDecision: sn.lastDecision } : {})
      },
      momentum: {
        state: mo.state ?? 'NOT_MOUNTED', guardWarm: mo.guardWarm ?? false,
        ...(mo.lastGate ? { lastGate: mo.lastGate } : {})
      },
      pilot: { phase: pilotPhase, ...(pilotReadiness ? { readiness: pilotReadiness } : {}) }
    },
    positions,
    premarket: {
      decisionDate: premarketDate,
      generatedAt: i.premarket?.generatedAt ?? null,
      ...(bias ? { bias } : {})
    },
    vision: {
      lastCaptureAt: i.vision?.finishedAt ?? null,
      stale: !i.vision || i.now - i.vision.finishedAt > VISION_STALE_MS,
      ...(i.vision?.bias ? { verdict: i.vision.bias } : {}),
      ...(i.vision?.id ? { runId: i.vision.id } : {})
    },
    health: { heartbeatLagMs: Math.max(0, Math.round(i.heartbeatLagMs)), storageOk: i.storageOk, journalQueue: i.journalQueue }
  };
}

// --- publisher --------------------------------------------------------------

export const OPS_PUBLISHER_LOCK = 'nifty50ops-state-publisher-v1';
export const PUBLISH_MS = 5000;

export interface PublisherDeps {
  /** navigator.locks, or a test double. Absent = publish without a lock. */
  locks?: { request: (name: string, cb: (lock: unknown) => Promise<void>) => Promise<unknown> } | null;
  schedule: (fn: () => void, ms: number) => () => void;
  collect: () => Promise<OpsStateSnapshot>;
  post: (snapshot: OpsStateSnapshot) => Promise<void>;
}

/**
 * Publishes only while this tab holds the lock. Returns a stop function; stop
 * releases the lock so the next waiting tab takes over.
 */
export function startPublisher(deps: PublisherDeps): () => void {
  let stopped = false;
  let cancelTimer: (() => void) | null = null;
  let release: (() => void) | null = null;
  let inFlight = false;

  const tick = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      await deps.post(await deps.collect());
    } catch {
      /* the server may be down; the next tick tries again */
    } finally {
      inFlight = false;
    }
  };

  const run = () => {
    if (stopped) return;
    void tick();
    cancelTimer = deps.schedule(() => void tick(), PUBLISH_MS);
  };

  if (deps.locks) {
    void deps.locks.request(OPS_PUBLISHER_LOCK, async () => {
      if (stopped) return;
      run();
      await new Promise<void>(resolve => { release = resolve; });
    }).catch(() => { /* lock manager unavailable: stay silent rather than double-publish */ });
  } else {
    run();
  }

  return () => {
    stopped = true;
    cancelTimer?.();
    release?.();
  };
}

// --- browser wiring ---------------------------------------------------------

export interface LiveInputs {
  spot: number | null;
  lastQuoteAt: number | null;
  source: MarketSource;
}

const TAB_ID = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function storageOk(): boolean {
  try {
    localStorage.setItem('__ops_probe__', '1');
    localStorage.removeItem('__ops_probe__');
    return true;
  } catch {
    return false;
  }
}

/** Largest gap between ~1 s heartbeats since the last publish, minus the 1 s period. */
function trackHeartbeatLag(): { take: () => number; stop: () => void } {
  let last = Date.now();
  let worst = 0;
  const stop = onHeartbeat(() => {
    const now = Date.now();
    worst = Math.max(worst, now - last - 1000);
    last = now;
  });
  const take = () => {
    const v = Math.max(worst, Date.now() - last - 1000);
    worst = 0;
    return v;
  };
  return { take, stop };
}

/**
 * Start the bridge in this tab. `getLive` is read on every publish so the
 * caller can hand over React state through a ref.
 */
export function startOpsStatePublisher(getLive: () => LiveInputs): () => void {
  const lag = trackHeartbeatLag();
  let cachedSlow: { at: number; pilot: CollectInputs['pilot']; premarket: CollectInputs['premarket']; vision: CollectInputs['vision'] } | null = null;
  let lastVisionRun: string | null = null;

  // Slow sources (IndexedDB, the vision sidecar) are re-read every 30 s.
  const readSlow = async (now: number) => {
    if (cachedSlow && now - cachedSlow.at < 30_000) return cachedSlow;
    const today = istDate(now);
    const [pilot, premarket, vision] = await Promise.all([
      import('./openingPilotStore')
        .then(m => m.loadPilotBook())
        .then(book => ({
          position: book.position,
          todayDecision: book.decisions.filter(d => d.day === today).slice(-1)[0] ?? null,
          latestFrame: (() => {
            const f = book.frames.filter(fr => fr.day === today).slice(-1)[0];
            return f ? { status: f.assessment.status } : null;
          })()
        }))
        .catch(() => null),
      import('./imageStorage')
        .then(m => m.imageStorageService.loadState<any>('preMarketDecision'))
        .then(d => (d?.generatedAt ? { generatedAt: d.generatedAt, primaryBias: d.primaryBias, headline: d.playbook?.verdictHeadline } : null))
        .catch(() => null),
      fetch('/api/vision/latest', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(run => (run?.id ? { id: run.id, finishedAt: Date.parse(run.finishedAt) || now, bias: run.analysis?.parsed?.bias } : null))
        .catch(() => null)
    ]);
    // A new capture is a journal event; the first one seen after load is not.
    if (vision && lastVisionRun && vision.id !== lastVisionRun) {
      logJournal('vision', { runId: vision.id, finishedAt: vision.finishedAt, bias: vision.bias ?? null });
    }
    if (vision) lastVisionRun = vision.id;
    cachedSlow = { at: now, pilot, premarket, vision };
    return cachedSlow;
  };

  const readPaper = async () => {
    const { paperTradingEngine, isAutoTrade } = await import('./paperTradingService');
    // Never call load(): it can persist a healed book. The engine's in-memory
    // book is used once something else has loaded it; until then, read IDB.
    let positions = paperTradingEngine.isLoaded() ? paperTradingEngine.getBook().positions : null;
    if (!positions) {
      const { dbService } = await import('./db');
      const { PAPER_STORE_KEY } = await import('./paperTradingService');
      const stored = await dbService.getMeta(PAPER_STORE_KEY).catch(() => null);
      positions = Array.isArray(stored?.positions) ? stored.positions : [];
    }
    return (positions ?? []).filter(p => !isAutoTrade(p));
  };

  const stopPublisher = startPublisher({
    locks: typeof navigator !== 'undefined' && navigator.locks ? navigator.locks : null,
    schedule: scheduleBackground,
    collect: async () => {
      const now = Date.now();
      const live = getLive();
      const [slow, manualPaper] = await Promise.all([readSlow(now), readPaper().catch(() => [])]);
      const reports = getEngineReports();
      const today = istDate(now);
      void journalService.flush();
      return collectOpsState({
        now,
        tabId: TAB_ID,
        spot: live.spot,
        lastQuoteAt: live.lastQuoteAt,
        source: live.source,
        storedMode: localStorage.getItem('autotrade_mode') === 'LIVE' ? 'LIVE' : 'PAPER',
        storedKilled: localStorage.getItem(`autotrade_killed_${today}`) === 'true',
        engines: reports.engines,
        enginePositions: reports.positions,
        manualPaper,
        pilot: slow.pilot,
        premarket: slow.premarket,
        vision: slow.vision,
        heartbeatLagMs: lag.take(),
        storageOk: storageOk(),
        journalQueue: journalService.pending()
      });
    },
    post: async snapshot => {
      const res = await fetch('/api/ops/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });
      // The deployed (Vercel) build has no ops server; stop rather than 404 every 5 s.
      if (res.status === 404) {
        stopPublisher();
        lag.stop();
      }
    }
  });
  return () => {
    stopPublisher();
    lag.stop();
  };
}
