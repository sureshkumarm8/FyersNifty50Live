/**
 * CLOSED-TRADE HISTORY TABLE
 *
 * One table, used by both the Paper Trading screen and the AutoTrade screen, so
 * a trade is described identically wherever it is read. Previously the Paper
 * screen had its own inline table and AutoTrade had no history at all, which
 * meant the trades the system took automatically could only be reviewed on a
 * screen that presented them as if they had been placed by hand.
 *
 * Every row answers the two questions that actually matter after the fact:
 * why the position was opened, and what closed it. Those live behind a click so
 * the table stays scannable, but they are never more than one click away.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { isAutoTrade, ownerStrategy, PaperTrade } from '../../services/paperTradingService';

const inr = (n: number, decimals = 0) =>
  `${n < 0 ? '-' : ''}₹${Math.abs(n).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;

const signed = (n: number) => `${n >= 0 ? '+' : '-'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

const clockTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

const dayLabel = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' });

const holdLabel = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return `${Math.max(0, Math.round(ms / 1000))}s`;
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const pnlColor = (n: number) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-slate-400');

const REASON_STYLE: Record<string, string> = {
  TARGET: 'bg-emerald-500/15 text-emerald-400',
  STOPLOSS: 'bg-red-500/15 text-red-400',
  TRAILING: 'bg-amber-500/15 text-amber-400',
  EOD: 'bg-blue-500/15 text-blue-400'
};

/** Marks a row the system took on its own, rather than one placed by hand. */
export const AutoTag: React.FC<{ source?: string; strategy?: string; tags?: string[] }> = ({
  source,
  strategy,
  tags
}) => {
  // Matched through the helpers so rows written before `source`/`strategy`
  // existed still show which engine took them, instead of passing as manual.
  if (!isAutoTrade({ source: source as any, tags })) return null;
  const owner = ownerStrategy({ strategy: strategy as any, tags });
  const label = owner ?? 'AUTO';
  return (
    <span
      title={tags?.length ? tags.join(' \u00b7 ') : 'Placed automatically'}
      className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
        owner === 'MOMENTUM'
          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
      }`}
    >
      {label}
    </span>
  );
};

/**
 * The entry and exit rationale, revealed under an expanded row.
 *
 * `entryReason` and `exitNote` are only present on trades closed after they
 * were introduced, so both fall back to something honest rather than rendering
 * an empty panel that looks like a bug.
 */
const Rationale: React.FC<{ trade: PaperTrade; columns: number }> = ({ trade, columns }) => (
  <tr className="bg-slate-900/40">
    <td colSpan={columns} className="px-3 pb-3 pt-0">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-400/90">
            <LogIn size={11} />
            Why this trade was taken
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {trade.entryReason?.trim() || (
              <span className="italic text-slate-500">
                No entry rationale was recorded for this trade.
              </span>
            )}
          </p>
          {trade.spotAtEntry != null && (
            <p className="mt-1.5 font-mono text-[10px] text-slate-500">
              Nifty at entry {trade.spotAtEntry.toFixed(2)} · {clockTime(trade.entryTime)}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-rose-400/90">
            <LogOut size={11} />
            Why it was closed
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            {trade.exitNote?.trim() || (
              <span className="italic text-slate-500">
                Closed as {trade.exitReason}. No further detail was recorded.
              </span>
            )}
          </p>
          {trade.spotAtExit != null && (
            <p className="mt-1.5 font-mono text-[10px] text-slate-500">
              Nifty at exit {trade.spotAtExit.toFixed(2)} · {clockTime(trade.exitTime)}
              {trade.spotAtEntry != null &&
                ` · ${trade.spotAtExit - trade.spotAtEntry >= 0 ? '+' : ''}${(
                  trade.spotAtExit - trade.spotAtEntry
                ).toFixed(1)} pts of spot`}
            </p>
          )}
        </div>
      </div>

      {trade.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {trade.tags.map((t) => (
            <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </td>
  </tr>
);

export interface TradeHistoryTableProps {
  trades: PaperTrade[];
  /** Adds a date column — needed once the log spans more than the current day. */
  showDate?: boolean;
  emptyHint?: string;
}

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  trades,
  showDate = false,
  emptyHint = 'No closed trades yet.'
}) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (trades.length === 0) {
    return <div className="px-3 py-10 text-center text-xs text-slate-500">{emptyHint}</div>;
  }

  const columns = showDate ? 9 : 8;

  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-slate-950/90 text-[9px] uppercase tracking-wider text-slate-500 backdrop-blur">
        <tr>
          <th className="px-3 py-2.5 text-left font-bold">Contract</th>
          {showDate && <th className="px-3 py-2.5 text-left font-bold">Date</th>}
          <th className="px-3 py-2.5 text-right font-bold">Qty</th>
          <th className="px-3 py-2.5 text-right font-bold">Entry → Exit</th>
          <th className="px-3 py-2.5 text-right font-bold">MFE / MAE</th>
          <th className="px-3 py-2.5 text-right font-bold">Charges</th>
          <th className="px-3 py-2.5 text-right font-bold">Net P&L</th>
          <th className="px-3 py-2.5 text-center font-bold">Reason</th>
          <th className="px-3 py-2.5 text-right font-bold">Held</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {trades.map((t) => {
          const open = expanded.has(t.id);
          return (
            <React.Fragment key={t.id}>
              <tr
                onClick={() => toggle(t.id)}
                className="cursor-pointer hover:bg-white/5"
                title="Show why this trade was taken and what closed it"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {open ? (
                      <ChevronDown size={12} className="shrink-0 text-slate-500" />
                    ) : (
                      <ChevronRight size={12} className="shrink-0 text-slate-600" />
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
                        t.optionType === 'CE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {t.optionType}
                    </span>
                    <AutoTag source={t.source} strategy={t.strategy} tags={t.tags} />
                    <div>
                      <div className="font-mono font-bold text-white">{t.strike}</div>
                      <div className="text-[9px] text-slate-500">
                        {clockTime(t.entryTime)} → {clockTime(t.exitTime)}
                      </div>
                    </div>
                  </div>
                </td>
                {showDate && (
                  <td className="px-3 py-3 font-mono text-[10px] text-slate-400">{dayLabel(t.entryTime)}</td>
                )}
                <td className="px-3 py-3 text-right font-mono text-slate-400">
                  <div>{t.lots}L</div>
                  <div className="text-[9px] text-slate-600">{t.quantity} qty</div>
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-300">
                  ₹{t.entryPrice.toFixed(2)} → ₹{t.exitPrice.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-[10px]">
                  <span className="text-emerald-400">+{t.maxFavourable.toFixed(1)}</span>
                  <span className="text-slate-600"> / </span>
                  <span className="text-red-400">{t.maxAdverse.toFixed(1)}</span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-amber-400/80">{inr(t.charges, 0)}</td>
                <td className={`px-3 py-3 text-right font-mono font-bold ${pnlColor(t.netPnl)}`}>
                  <div>{signed(t.netPnl)}</div>
                  <div className="text-[10px] opacity-80">
                    {t.netPnlPercent >= 0 ? '+' : ''}
                    {t.netPnlPercent.toFixed(1)}%
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      REASON_STYLE[t.exitReason] ?? 'bg-slate-700/40 text-slate-400'
                    }`}
                    title={t.exitNote ?? undefined}
                  >
                    {t.exitReason}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-[10px] text-slate-500">{holdLabel(t.holdMs)}</td>
              </tr>
              {open && <Rationale trade={t} columns={columns} />}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

export default TradeHistoryTable;
