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
import { AlertTriangle, Crosshair, ShieldCheck, Waves } from 'lucide-react';
import { EnrichedFyersQuote, FyersCredentials, MarketSnapshot, PivotPoints } from '../types';
import { SNIPER } from '../services/sniperPlaybook';
import { istMinutesOf, phaseAt, phaseLabelOf } from '../services/sniperEngine';
import { ErrorBoundary } from './ErrorBoundary';
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
    tagline: 'One trade · 09:25–10:15 · ±30 pts',
    icon: <Crosshair className="h-4 w-4" />,
    activeCls: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'momentum',
    label: 'Momentum',
    tagline: 'All session · multi-factor · R:R sized',
    icon: <Waves className="h-4 w-4" />,
    activeCls: 'border-sky-500/50 bg-sky-500/10 text-sky-300'
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

  const panelProps = useMemo(
    () => ({ credentials, niftyLtp, historyLog, pivots, tradingMode: mode }),
    [credentials, niftyLtp, historyLog, pivots, mode]
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        {/* ---- shell header ---- */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">AutoTrade</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Nifty {niftyLtp ? niftyLtp.toLocaleString('en-IN') : '—'} ·{' '}
              {new Date(clock).toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}{' '}
              IST · {phaseLabelOf(phase)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
              {(['PAPER', 'LIVE'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    if (m === 'LIVE' && mode !== 'LIVE') {
                      setConfirmLive(true);
                      return;
                    }
                    setMode(m);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m
                      ? m === 'LIVE'
                        ? 'bg-rose-500 text-rose-950'
                        : 'bg-slate-700 text-slate-100'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </header>

        {confirmLive && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3">
            <p className="flex items-center gap-2 text-xs text-rose-200">
              <AlertTriangle className="h-4 w-4" />
              LIVE mode places real orders with real money. Both strategies switch together and their order books reset.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLive(false)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                Stay on paper
              </button>
              <button
                onClick={() => {
                  setMode('LIVE');
                  setConfirmLive(false);
                }}
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-rose-950 hover:bg-rose-400"
              >
                Go live
              </button>
            </div>
          </div>
        )}

        {/* ---- strategy tabs ---- */}
        <nav className="grid grid-cols-2 gap-3">
          {TABS.map(t => {
            const active = tab === t.id;
            const st = status[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  active ? t.activeCls : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  {t.icon}
                  {t.label}
                  {t.id === 'sniper' && inProtocolWindow && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                  )}
                </div>
                <p className="mt-0.5 text-[11px] opacity-70">{t.tagline}</p>
                {/* Proof the hidden strategy is still alive — it keeps running when
                    its tab is not on screen, and that must never be a surprise. */}
                {(st.active || st.openPositions > 0) && (
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    {st.active ? 'Running' : 'Idle'}
                    {st.openPositions > 0 &&
                      ` · ${st.openPositions} open position${st.openPositions > 1 ? 's' : ''}`}
                  </p>
                )}
              </button>
            );
          })}
        </nav>

        {/* A gentle nudge, never a redirect — the tab stays where the user put it. */}
        {tab === 'momentum' && inProtocolWindow && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-[11px] text-emerald-200/80">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            The Office Protocol window is open ({SNIPER.entryStart}–{SNIPER.hardStop}). Your primary system is on the
            Sniper tab; momentum trades taken now compete with it for attention.
          </p>
        )}
        {tab === 'sniper' && mins > 0 && !inProtocolWindow && phase !== 'PRE_OPEN' && (
          <p className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-[11px] text-slate-400">
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
  );
};

export default UnifiedAutoTrade;
