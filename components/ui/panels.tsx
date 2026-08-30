/**
 * Shared building blocks for the AutoTrade panels.
 *
 * Deliberately presentation-only. The Momentum and Sniper panels own all of
 * their own state and logic - nothing about a strategy lives here, so the two
 * can never leak information into each other.
 */

import React from 'react';
import { AlertTriangle, Ban, CheckCircle2, Inbox } from 'lucide-react';
import { Position } from '../../services/orderManager';

export type Accent = 'emerald' | 'sky';

export interface AccentTheme {
  ring: string;
  text: string;
  softBg: string;
  border: string;
  solid: string;
  glow: string;
  gradient: string;
}

export const ACCENTS: Record<Accent, AccentTheme> = {
  emerald: {
    ring: 'ring-emerald-500/30',
    text: 'text-emerald-300',
    softBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    solid: 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950',
    glow: 'shadow-[0_0_40px_-12px_rgba(16,185,129,0.55)]',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
  },
  sky: {
    ring: 'ring-sky-500/30',
    text: 'text-sky-300',
    softBg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    solid: 'bg-sky-500 hover:bg-sky-400 text-sky-950',
    glow: 'shadow-[0_0_40px_-12px_rgba(14,165,233,0.55)]',
    gradient: 'from-sky-500/20 via-indigo-500/10 to-transparent'
  }
};

export const inr = (n: number) =>
  `${n < 0 ? '-' : ''}₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const Card: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, icon, right, className = '', children }) => (
  <section className={`rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur ${className}`}>
    {(title || right) && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
          {icon}
          {title}
        </h3>
        {right}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: 'default' | 'good' | 'bad' | 'warn';
}> = ({ label, value, sub, tone = 'default' }) => {
  const toneCls =
    tone === 'good'
      ? 'text-emerald-300'
      : tone === 'bad'
        ? 'text-rose-300'
        : tone === 'warn'
          ? 'text-amber-300'
          : 'text-slate-100';
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
};

export const Pill: React.FC<{
  tone?: 'good' | 'bad' | 'warn' | 'muted' | 'info';
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'muted', children, className = '' }) => {
  const map = {
    good: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bad: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    warn: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    muted: 'bg-slate-700/30 text-slate-300 border-slate-600/40'
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${map[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

/** A horizontal 0-100 meter. */
export const Meter: React.FC<{ value: number; tone?: string; height?: string }> = ({
  value,
  tone = 'bg-slate-400',
  height = 'h-1.5'
}) => (
  <div className={`w-full overflow-hidden rounded-full bg-slate-800 ${height}`}>
    <div
      className={`${height} rounded-full transition-all duration-500 ${tone}`}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

export interface LogEntry {
  ts: number;
  text: string;
  level: 'info' | 'good' | 'warn' | 'bad';
}

export const LogFeed: React.FC<{ entries: LogEntry[]; emptyHint: string }> = ({ entries, emptyHint }) => (
  <div className="max-h-72 space-y-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
    {entries.length === 0 ? (
      <p className="flex items-center justify-center gap-2 py-6 text-center text-slate-600">
        <Inbox className="h-4 w-4" /> {emptyHint}
      </p>
    ) : (
      entries.map((e, i) => (
        <div
          key={`${e.ts}-${i}`}
          className={`flex gap-2 rounded px-2 py-1 ${
            e.level === 'good'
              ? 'text-emerald-300'
              : e.level === 'bad'
                ? 'text-rose-300'
                : e.level === 'warn'
                  ? 'text-amber-300'
                  : 'text-slate-400'
          } ${i === 0 ? 'bg-slate-800/40' : ''}`}
        >
          <span className="shrink-0 text-slate-600">
            {new Date(e.ts).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
          </span>
          <span className="min-w-0 flex-1 break-words">{e.text}</span>
        </div>
      ))
    )}
  </div>
);

export const PositionsTable: React.FC<{
  positions: Position[];
  onClose: (symbol: string) => void;
  busy?: boolean;
}> = ({ positions, onClose, busy }) => {
  if (positions.length === 0) {
    return <p className="py-4 text-center text-xs text-slate-600">No open positions.</p>;
  }
  return (
    <div className="space-y-2">
      {positions.map(p => {
        const up = p.pnl >= 0;
        return (
          <div
            key={p.symbol}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-100">{p.symbol}</div>
              <div className="text-[11px] text-slate-500">
                {p.side} · {p.quantity} qty · avg {p.avgPrice.toFixed(2)} · ltp {p.ltp.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-sm font-semibold tabular-nums ${up ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {inr(p.pnl)}
                </div>
                <div className={`text-[11px] tabular-nums ${up ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                  {p.pnlPercent >= 0 ? '+' : ''}
                  {p.pnlPercent.toFixed(2)}%
                </div>
              </div>
              <button
                onClick={() => onClose(p.symbol)}
                disabled={busy}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-40"
              >
                Exit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const BlockList: React.FC<{ items: { key: string; message: string }[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map(b => (
      <li key={b.key} className="flex items-start gap-2 text-xs text-slate-400">
        <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400/70" />
        <span>{b.message}</span>
      </li>
    ))}
  </ul>
);

export const Checklist: React.FC<{ items: { label: string; ok: boolean; detail?: string }[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map(i => (
      <li key={i.label} className="flex items-start gap-2 text-xs">
        {i.ok ? (
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        ) : (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-600" />
        )}
        <span className={i.ok ? 'text-slate-300' : 'text-slate-500'}>
          {i.label}
          {i.detail && <span className="ml-1 text-slate-600">— {i.detail}</span>}
        </span>
      </li>
    ))}
  </ul>
);
