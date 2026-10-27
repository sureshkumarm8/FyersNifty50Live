/**
 * AUTOTRADE — two strategies, deliberately kept apart.
 *
 *   SNIPER    "Nifty Sniper: The Office Protocol" — one trade a day, 09:25–09:45,
 *             250-ITM option, +30 / −30, flat by 10:15.
 *   MOMENTUM  Multi-factor signal engine that runs all session.
 *
 * This file is only a shell. It owns the trading mode and the tab, and nothing
 * else. Each panel constructs its own OrderManager and keeps its own log,
 * positions and statistics, so a number shown under one strategy can never have
 * come from the other. That separation is the point — the previous version
 * shared a single log and a single "close all positions" button, which meant
 * exiting a momentum trade could close the day's sniper position.
 *
 * Both panels stay MOUNTED for the whole session; the tab only decides which one
 * is visible. Unmounting the inactive one — as this shell used to do — threw away
 * its OrderManager, its log, its positions and its armed flag, so a glance at the
 * other strategy silently killed a running engine and any open position with it.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertOctagon, AlertTriangle, Crosshair, ShieldCheck, Waves } from 'lucide-react';
import { EnrichedFyersQuote, FyersCredentials, MarketSnapshot, PivotPoints } from '../types';
import { SNIPER } from '../services/sniperPlaybook';
import { istMinutesOf, phaseAt, phaseLabelOf } from '../services/sniperEngine';
import { validateExpiryDate } from '../services/expiryValidator';
import { ErrorBoundary } from './ErrorBoundary';
import { DenseProvider } from './ui/panels';
import MomentumPanel from './autotrade/MomentumPanel';
import SniperPanel from './autotrade/SniperPanel';

type TradeMode = 'PAPER' | 'LIVE';
type ActiveTab = 'sniper' | 'momentum';

/** What a background panel reports up so its tab can show it is still working. */
export interface PanelStatus {
  active: boolean;
  openPositions: number;
}

const IDLE_STATUS: PanelStatus = { active: false, openPositions: 0 };

const TAB_KEY = 'autotrade_tab';
const MODE_KEY = 'autotrade_mode';

interface UnifiedAutoTradeProps {
  credentials: FyersCredentials;
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  pivots: PivotPoints | null;
  aiEnabled: boolean;
}

const readTab = (): ActiveTab => (localStorage.getItem(TAB_KEY) === 'momentum' ? 'momentum' : 'sniper');
const readMode = (): TradeMode => (localStorage.getItem(MODE_KEY) === 'LIVE' ? 'LIVE' : 'PAPER');

const TABS: {
  id: ActiveTab;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  activeCls: string;
}[] = [
  {
    id: 'sniper',
    label: 'Sniper',
    tagline: '1 trade · 09:25–10:15',
    icon: <Crosshair className="h-3.5 w-3.5" />,
    activeCls: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40'
  },
  {
    id: 'momentum',
    label: 'Momentum',
    tagline: 'All session',
    icon: <Waves className="h-3.5 w-3.5" />,
    activeCls: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/40'
  }
];

const UnifiedAutoTrade: React.FC<UnifiedAutoTradeProps> = ({ credentials, niftyLtp, historyLog, pivots }) => {
  const [tab, setTab] = useState<ActiveTab>(readTab);
  const [mode, setMode] = useState<TradeMode>(readMode);
  const [confirmLive, setConfirmLive] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [status, setStatus] = useState<Record<ActiveTab, PanelStatus>>({
    sniper: IDLE_STATUS,
    momentum: IDLE_STATUS
  });

  const getTodayIST = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [isKilled, setIsKilled] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(`autotrade_killed_${new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}`) === 'true';
  });

  const pollKillStatus = useCallback(async () => {
    try {
      const today = getTodayIST();
      if (typeof localStorage !== 'undefined' && localStorage.getItem(`autotrade_killed_${today}`) === 'true') {
        setIsKilled(true);
        return;
      }
      const res = await fetch('/api/kill/status');
      if (res.ok) {
        const data = await res.json();
        if (data.killed) {
          setIsKilled(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`autotrade_killed_${today}`, 'true');
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    pollKillStatus();
    const interval = setInterval(pollKillStatus, 5000);
    return () => clearInterval(interval);
  }, [pollKillStatus]);

  const handleFlattenAndDisarm = async () => {
    const today = getTodayIST();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`autotrade_killed_${today}`, 'true');
    }
    setIsKilled(true);
    try {
      await fetch('/api/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Header FLATTEN & DISARM button pressed' })
      });
    } catch (e) {
      console.warn('Kill API error:', e);
    }
  };

  // Panels report upward on every meaningful change; only store a genuinely new
  // value or the setState would loop against the child's effect.
  const reportStatus = useCallback((id: ActiveTab, next: PanelStatus) => {
    setStatus(prev => {
      const cur = prev[id];
      if (cur.active === next.active && cur.openPositions === next.openPositions) return prev;
      return { ...prev, [id]: next };
    });
  }, []);

  const onSniperStatus = useCallback((s: PanelStatus) => reportStatus('sniper', s), [reportStatus]);
  const onMomentumStatus = useCallback((s: PanelStatus) => reportStatus('momentum', s), [reportStatus]);

  useEffect(() => {
    localStorage.setItem(TAB_KEY, tab);
  }, [tab]);
  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const phase = phaseAt(new Date(clock));
  const mins = istMinutesOf(new Date(clock));
  const inProtocolWindow = phase === 'DOWNLOAD' || phase === 'ENTRY_WINDOW' || phase === 'MANAGE_ONLY';

  const expiryValidation = useMemo(() => validateExpiryDate(), []);

  const panelProps = useMemo(
    () => ({ credentials, niftyLtp, historyLog, pivots, tradingMode: isKilled || !expiryValidation.valid ? 'PAPER' : mode }),
    [credentials, niftyLtp, historyLog, pivots, mode, isKilled, expiryValidation.valid]
  );

  const effectiveMode = panelProps.tradingMode;
  const live = effectiveMode === 'LIVE';
  const modeLocked = isKilled || !expiryValidation.valid;
  const timeText = new Date(clock).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
  });

  return (
    <DenseProvider>
    <div className="h-full overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(30,41,59,0.55),_rgba(2,6,23,1)_55%)] text-slate-200">
      {/* ---- sticky command bar: everything that matters in one 52px row ---- */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        {/* A LIVE engine must be impossible to mistake for paper, even scrolled down. */}
        <div className={`h-0.5 ${live ? 'bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600 animate-pulse' : 'bg-gradient-to-r from-transparent via-slate-700/60 to-transparent'}`} />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-black tracking-tight text-slate-100">AutoTrade</h1>
            <span className="font-mono text-lg font-bold tabular-nums text-white">
              {niftyLtp ? niftyLtp.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
            </span>
            <span className="hidden text-[11px] text-slate-500 sm:inline">
              {timeText} IST · <span className={inProtocolWindow ? 'text-emerald-300' : ''}>{phaseLabelOf(phase)}</span>
            </span>
          </div>

          {/* strategy switcher — the hidden engine's state stays visible here */}
          <nav className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-0.5" aria-label="Strategy">
            {TABS.map(t => {
              const active = tab === t.id;
              const st = status[t.id];
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-pressed={active}
                  title={t.tagline}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    active ? t.activeCls : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  <span className="hidden text-[10px] font-medium opacity-60 md:inline">{t.tagline}</span>
                  {st.active && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" title="Running" />
                  )}
                  {st.openPositions > 0 && (
                    <span className="rounded-full bg-amber-400 px-1.5 text-[10px] font-black leading-4 text-amber-950" title={`${st.openPositions} open position${st.openPositions > 1 ? 's' : ''}`}>
                      {st.openPositions}
                    </span>
                  )}
                  {t.id === 'sniper' && inProtocolWindow && !active && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" title="Protocol window open" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-0.5" title={modeLocked ? 'Locked to PAPER' : undefined}>
              {(['PAPER', 'LIVE'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    if (modeLocked) return;
                    if (m === 'LIVE' && mode !== 'LIVE') {
                      setConfirmLive(true);
                      return;
                    }
                    setMode(m);
                  }}
                  disabled={modeLocked}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wide transition ${
                    mode === m
                      ? m === 'LIVE'
                        ? 'bg-rose-500 text-rose-950 shadow-[0_0_12px_-2px_rgba(244,63,94,0.8)]'
                        : 'bg-slate-700 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300'
                  } ${modeLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={handleFlattenAndDisarm}
              className="flex items-center gap-1.5 rounded-xl border border-rose-600/40 bg-rose-600/15 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 shadow-sm transition hover:bg-rose-600/30"
              title="Emergency: Flatten all positions and disarm auto-trade for today"
            >
              <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">FLATTEN & DISARM</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-3 p-3 sm:p-4">
        {isKilled && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/50 bg-rose-950/70 px-3 py-2 text-rose-200">
            <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-xs"><b>AUTOTRADE KILLED & DISARMED FOR TODAY.</b> <span className="text-rose-300/80">Positions have been flattened and automatic entries are disarmed until tomorrow morning.</span></p>
          </div>
        )}

        {!expiryValidation.valid && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/50 bg-rose-950/70 px-3 py-2 text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="text-xs">
              <b>STALE EXPIRY CONSTANTS DETECTED.</b>{' '}
              <span className="text-rose-300/80">
                {expiryValidation.error} Automatic entries are blocked. Run{' '}
                <code className="rounded bg-rose-900/60 px-1 py-0.5 font-mono text-rose-200">{expiryValidation.fixCommand}</code>{' '}
                to update option strikes.
              </span>
            </p>
          </div>
        )}

        {confirmLive && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2">
            <p className="flex items-center gap-2 text-xs text-rose-200">
              <AlertTriangle className="h-4 w-4" />
              LIVE mode places real orders with real money. Both strategies switch together and their order books reset.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLive(false)}
                className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Stay on paper
              </button>
              <button
                onClick={() => {
                  setMode('LIVE');
                  setConfirmLive(false);
                }}
                className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-rose-950 hover:bg-rose-400"
              >
                Go live
              </button>
            </div>
          </div>
        )}

        {/* A gentle nudge, never a redirect — the tab stays where the user put it. */}
        {tab === 'momentum' && inProtocolWindow && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-emerald-200/80">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            The Office Protocol window is open ({SNIPER.entryStart}–{SNIPER.hardStop}). Your primary system is on the
            Sniper tab; momentum trades taken now compete with it for attention.
          </p>
        )}
        {tab === 'sniper' && mins > 0 && !inProtocolWindow && phase !== 'PRE_OPEN' && (
          <p className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-[11px] text-slate-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            The protocol window has closed for today. The Momentum tab is the only engine still live.
          </p>
        )}

        {/* Both panels stay mounted for the whole session — the tab only chooses
            which is on screen. Each keeps its own ErrorBoundary so a crash in one
            strategy can never take the other down with it. */}
        <div className={tab === 'sniper' ? undefined : 'hidden'} aria-hidden={tab !== 'sniper'}>
          <ErrorBoundary label="autotrade-sniper">
            <SniperPanel {...panelProps} onStatus={onSniperStatus} />
          </ErrorBoundary>
        </div>
        <div className={tab === 'momentum' ? undefined : 'hidden'} aria-hidden={tab !== 'momentum'}>
          <ErrorBoundary label="autotrade-momentum">
            <MomentumPanel {...panelProps} onStatus={onMomentumStatus} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
    </DenseProvider>
  );
};

export default UnifiedAutoTrade;
