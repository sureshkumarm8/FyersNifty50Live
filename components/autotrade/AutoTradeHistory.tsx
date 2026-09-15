/**
 * AUTOTRADE HISTORY
 *
 * The closed trades a strategy took today, read straight out of the paper book.
 *
 * Both engines already write their fills into the paper ledger, but until now
 * that ledger could only be read on the Paper Trading screen — so reviewing
 * what the Sniper did meant leaving the Sniper. Worse, the two strategies were
 * mixed together there, which makes a per-strategy win rate impossible to read.
 * This shows one strategy's own trades, in the same columns and with the same
 * wording as the Paper screen, next to the engine that took them.
 *
 * It is a *view*. It never closes, modifies or re-books anything: the engines
 * own their positions, and a second writer would double-book the P&L.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { History, Trophy } from 'lucide-react';
import {
  belongsToStrategy,
  paperTradingEngine,
  PaperBook,
  PaperStrategy,
  PaperTrade
} from '../../services/paperTradingService';
import { TradeHistoryTable } from '../ui/TradeHistoryTable';

const inr = (n: number) =>
  `${n < 0 ? '-' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

const signed = (n: number) => `${n >= 0 ? '+' : '-'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

/** IST calendar day — the same key the engines use to expire an intraday book. */
const istDayKey = (ts: number): string =>
  new Date(ts).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

interface AutoTradeHistoryProps {
  strategy: PaperStrategy;
  /** PAPER-mode fills are the only ones mirrored into this book. */
  tradingMode: 'PAPER' | 'LIVE';
}

const Metric: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div>
    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    <div className={`font-mono text-sm font-bold ${tone ?? 'text-white'}`}>{value}</div>
  </div>
);

export const AutoTradeHistory: React.FC<AutoTradeHistoryProps> = ({ strategy, tradingMode }) => {
  const [book, setBook] = useState<PaperBook>(paperTradingEngine.getBook());
  const [scope, setScope] = useState<'today' | 'all'>('today');

  useEffect(() => {
    // The engines call load() before their first write, but this view can render
    // before any trade has been taken — without this it would show an empty book
    // that has not actually been read from storage yet.
    let alive = true;
    paperTradingEngine.load().then((b) => {
      if (alive) setBook(b);
    });
    const unsubscribe = paperTradingEngine.subscribe(setBook);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const trades = useMemo<PaperTrade[]>(() => {
    const today = istDayKey(Date.now());
    // Ownership is read through the helper, not off `t.strategy`: trades taken
    // before that field existed only carry their engine in `tags`, and matching
    // the field alone made an entire day of real trades read as "none taken".
    return book.trades.filter(
      (t) => belongsToStrategy(t, strategy) && (scope === 'all' || istDayKey(t.entryTime) === today)
    );
  }, [book.trades, strategy, scope]);

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.netPnl > 0);
    const netPnl = trades.reduce((s, t) => s + t.netPnl, 0);
    const charges = trades.reduce((s, t) => s + t.charges, 0);
    const grossProfit = wins.reduce((s, t) => s + t.netPnl, 0);
    const grossLoss = Math.abs(
      trades.filter((t) => t.netPnl <= 0).reduce((s, t) => s + t.netPnl, 0)
    );
    return {
      count: trades.length,
      wins: wins.length,
      winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
      netPnl,
      charges,
      // An unbeaten run has no denominator; showing ∞ is honest, 0 would not be.
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      avgHoldMin: trades.length
        ? trades.reduce((s, t) => s + t.holdMs, 0) / trades.length / 60000
        : 0
    };
  }, [trades]);

  const label = strategy === 'SNIPER' ? 'Sniper' : 'Momentum';

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-200">{label} trade history</h3>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {trades.length}
          </span>
        </div>

        <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
          {(['today', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                scope === s ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'today' ? 'Today' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {tradingMode === 'LIVE' && (
        // Silence here would read as "no trades taken", which is the opposite of
        // the truth when the engine is live and filling at a broker.
        <p className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-200/80">
          LIVE mode — fills go to the broker's own book and are not mirrored here. This log tracks
          simulated capital only, so posting real fills into it would corrupt every statistic on it.
        </p>
      )}

      {trades.length > 0 && (
        <div className="grid grid-cols-3 gap-3 border-b border-white/5 px-4 py-3 md:grid-cols-6">
          <Metric
            label="Net P&L"
            value={signed(stats.netPnl)}
            tone={stats.netPnl > 0 ? 'text-emerald-400' : stats.netPnl < 0 ? 'text-red-400' : 'text-slate-400'}
          />
          <Metric label="Trades" value={String(stats.count)} />
          <Metric
            label="Win rate"
            value={`${stats.winRate.toFixed(0)}%`}
            tone={stats.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}
          />
          <Metric label="Wins / losses" value={`${stats.wins}W / ${stats.count - stats.wins}L`} />
          <Metric label="Charges" value={inr(stats.charges)} tone="text-amber-400/80" />
          <Metric
            label="Profit factor"
            value={Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
          />
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto">
        <TradeHistoryTable
          trades={trades}
          showDate={scope === 'all'}
          emptyHint={
            scope === 'today'
              ? `No ${label} trades closed today. Click any closed trade to see why it was taken and what closed it.`
              : `No ${label} trades on the book yet.`
          }
        />
      </div>

      {trades.length > 0 && (
        <p className="flex items-center gap-1.5 border-t border-white/5 px-4 py-2 text-[10px] text-slate-500">
          <Trophy className="h-3 w-3" />
          Average hold {stats.avgHoldMin.toFixed(0)}m · click a row for the entry and exit rationale ·
          the full ledger lives on the Paper Trading screen.
        </p>
      )}
    </div>
  );
};

export default AutoTradeHistory;
