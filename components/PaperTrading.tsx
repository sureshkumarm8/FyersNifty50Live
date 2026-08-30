import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Wallet, TrendingUp, Target, Shield, X, Plus, Minus,
  BookOpen, RotateCcw, AlertTriangle, Trophy, Clock, Settings2,
  ArrowUpRight, ArrowDownRight, GraduationCap, Zap, Check, Percent, Trash2
} from 'lucide-react';
import { EnrichedFyersQuote } from '../types';
import {
  paperTradingEngine, PaperBook, PaperPosition, PaperOptionType,
  parseOptionQuote, computeCharges, positionPnl, positionPnlPercent,
  effectiveStop
} from '../services/paperTradingService';

interface PaperTradingProps {
  optionQuotes: EnrichedFyersQuote[];
  niftyLtp: number | null;
  lastUpdated: number | null;
}

const inr = (n: number, decimals = 0) =>
  `${n < 0 ? '-' : ''}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

const signed = (n: number) => `${n >= 0 ? '+' : '-'}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

const clockTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const holdLabel = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const pnlColor = (n: number) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-slate-400');

interface StrikeRow {
  strike: number;
  ce: EnrichedFyersQuote | null;
  pe: EnrichedFyersQuote | null;
}

const MetricCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'bad';
  Icon: React.ElementType;
}> = ({ label, value, sub, tone = 'neutral', Icon }) => {
  const colour = tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-red-400' : 'text-white';
  return (
    <div className="glass-card rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-slate-500" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className={`text-lg font-black font-mono ${colour}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
};

export const PaperTrading: React.FC<PaperTradingProps> = ({ optionQuotes, niftyLtp, lastUpdated }) => {
  const [book, setBook] = useState<PaperBook>(paperTradingEngine.getBook());
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<'positions' | 'history'>('positions');
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Order ticket state
  const [side, setSide] = useState<PaperOptionType>('CE');
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [lots, setLots] = useState(1);
  const [slPercent, setSlPercent] = useState<number | ''>(30);
  const [tgtPercent, setTgtPercent] = useState<number | ''>(50);
  const [useSl, setUseSl] = useState(true);
  const [useTgt, setUseTgt] = useState(true);
  const [trailPoints, setTrailPoints] = useState<number | ''>('');
  const [useTrail, setUseTrail] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRowRef = useRef<HTMLButtonElement | null>(null);

  const flash = useCallback((text: string, ok: boolean) => {
    setToast({ text, ok });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    let alive = true;
    paperTradingEngine.load().then((b) => {
      if (!alive) return;
      setBook(b);
      setReady(true);
    });
    const unsubscribe = paperTradingEngine.subscribe(setBook);
    return () => { alive = false; unsubscribe(); };
  }, []);

  // Every time a fresh chain lands, re-mark the book and fire any pending exits.
  useEffect(() => {
    if (!ready || optionQuotes.length === 0) return;
    const fired = paperTradingEngine.markToMarket(optionQuotes, niftyLtp);
    if (fired.length > 0) {
      const summary = fired.map((f) => `${f.position.displayName} → ${f.reason}`).join(', ');
      flash(`Auto-exit: ${summary}`, fired.every((f) => f.reason === 'TARGET'));
    }
  }, [optionQuotes, niftyLtp, ready, flash]);

  // --- chain slicing -------------------------------------------------------

  const strikeRows = useMemo<StrikeRow[]>(() => {
    const map = new Map<number, StrikeRow>();
    for (const q of optionQuotes) {
      const parsed = parseOptionQuote(q);
      if (!parsed) continue;
      let row = map.get(parsed.strike);
      if (!row) {
        row = { strike: parsed.strike, ce: null, pe: null };
        map.set(parsed.strike, row);
      }
      if (parsed.optionType === 'CE') row.ce = q;
      else row.pe = q;
    }
    return [...map.values()].sort((a, b) => a.strike - b.strike);
  }, [optionQuotes]);

  const atmStrike = useMemo(() => {
    if (!niftyLtp || strikeRows.length === 0) return null;
    return strikeRows.reduce((best, r) =>
      Math.abs(r.strike - niftyLtp) < Math.abs(best - niftyLtp) ? r.strike : best, strikeRows[0].strike);
  }, [strikeRows, niftyLtp]);

  // Keep the ticket pointed at a sensible strike as the market moves.
  useEffect(() => {
    if (selectedStrike == null && atmStrike != null) setSelectedStrike(atmStrike);
  }, [atmStrike, selectedStrike]);

  // The chain is a long scroller; make sure the chosen strike is actually on
  // screen. 'nearest' leaves the list alone when it already is.
  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedStrike, side, strikeRows.length]);

  /** A window of strikes around ATM - what an option buyer actually looks at. */
  const visibleRows = useMemo(() => {
    if (atmStrike == null) return strikeRows.slice(0, 21);
    const idx = strikeRows.findIndex((r) => r.strike === atmStrike);
    if (idx < 0) return strikeRows.slice(0, 21);
    return strikeRows.slice(Math.max(0, idx - 10), idx + 11);
  }, [strikeRows, atmStrike]);

  const selectedQuote = useMemo(() => {
    const row = strikeRows.find((r) => r.strike === selectedStrike);
    if (!row) return null;
    return side === 'CE' ? row.ce : row.pe;
  }, [strikeRows, selectedStrike, side]);

  // --- ticket maths --------------------------------------------------------

  const premium = selectedQuote?.lp ?? 0;
  const quantity = lots * book.settings.lotSize;
  const entryCharges = premium > 0 ? computeCharges(premium, quantity, 'BUY', book.settings.brokeragePerOrder) : null;
  const outlay = premium * quantity + (entryCharges?.total ?? 0);

  const slPrice = useSl && slPercent !== '' && premium > 0
    ? Math.max(0.05, Number((premium * (1 - Number(slPercent) / 100)).toFixed(2))) : null;
  const tgtPrice = useTgt && tgtPercent !== '' && premium > 0
    ? Number((premium * (1 + Number(tgtPercent) / 100)).toFixed(2)) : null;

  const riskAmount = slPrice != null ? (premium - slPrice) * quantity : null;
  const rewardAmount = tgtPrice != null ? (tgtPrice - premium) * quantity : null;
  const rr = riskAmount && rewardAmount && riskAmount > 0 ? rewardAmount / riskAmount : null;

  const availableCash = ready ? paperTradingEngine.availableCash() : book.settings.startingCapital;
  const openPnl = paperTradingEngine.openPnl();
  const stats = useMemo(() => paperTradingEngine.getStats(), [book]);
  const equity = book.settings.startingCapital + book.realizedPnl + openPnl;
  const equityPercent = book.settings.startingCapital > 0
    ? ((equity - book.settings.startingCapital) / book.settings.startingCapital) * 100 : 0;

  const canBuy = !!selectedQuote && premium > 0 && outlay <= availableCash;

  const handleBuy = () => {
    if (!selectedQuote) return;
    const result = paperTradingEngine.buy({
      quote: selectedQuote,
      lots,
      spot: niftyLtp,
      stopLoss: slPrice,
      target: tgtPrice,
      trailPoints: useTrail && trailPoints !== '' ? Number(trailPoints) : null
    });
    flash(result.message, result.ok);
  };

  const handleExit = (position: PaperPosition) => {
    const result = paperTradingEngine.exit(position.id, 'MANUAL', undefined, niftyLtp);
    flash(result.message, result.ok);
  };

  const handleExitAll = () => {
    const count = paperTradingEngine.exitAll('MANUAL', niftyLtp);
    if (count) flash(`Squared off ${count} position${count > 1 ? 's' : ''}.`, true);
  };

  const staleness = lastUpdated ? Date.now() - lastUpdated : null;
  const isStale = staleness != null && staleness > 120000;

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 gap-4 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="text-teal-400" />
            PAPER <span className="text-teal-500">TRADING</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap mt-0.5">
            <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-bold uppercase tracking-wider text-teal-300">
              Simulated · No real orders
            </span>
            <span className="text-xs text-slate-400 font-mono">
              NIFTY {niftyLtp ? niftyLtp.toFixed(2) : '—'}
            </span>
            {isStale && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                <AlertTriangle size={11} /> Prices {Math.round((staleness || 0) / 60000)}m old
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {book.positions.length > 0 && (
            <button
              onClick={handleExitAll}
              className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
              <X size={14} /> Square Off All
            </button>
          )}
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* Settings drawer */}
      {showSettings && (
        <div className="glass-panel rounded-xl p-4 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Starting Capital</label>
            <input
              type="number"
              value={book.settings.startingCapital}
              onChange={(e) => paperTradingEngine.updateSettings({ startingCapital: Number(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Lot Size</label>
            <input
              type="number"
              value={book.settings.lotSize}
              onChange={(e) => paperTradingEngine.updateSettings({ lotSize: Number(e.target.value) || 1 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Brokerage / Order</label>
            <input
              type="number"
              value={book.settings.brokeragePerOrder}
              onChange={(e) => paperTradingEngine.updateSettings({ brokeragePerOrder: Number(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={book.settings.autoSquareOff}
                onChange={(e) => paperTradingEngine.updateSettings({ autoSquareOff: e.target.checked })}
                className="accent-teal-500"
              />
              Auto square-off at 15:20
            </label>
            <button
              onClick={() => {
                if (confirm('Reset the paper account? All positions and trade history will be deleted.')) {
                  paperTradingEngine.resetAccount();
                  flash('Paper account reset.', true);
                }
              }}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw size={12} /> Reset Account
            </button>
          </div>
        </div>
      )}

      {/* Account metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
        <MetricCard label="Equity" value={inr(equity)} sub={`${equityPercent >= 0 ? '+' : ''}${equityPercent.toFixed(2)}% overall`} tone={equity >= book.settings.startingCapital ? 'good' : 'bad'} Icon={Wallet} />
        <MetricCard label="Open P&L" value={signed(openPnl)} sub={`${book.positions.length} position${book.positions.length === 1 ? '' : 's'}`} tone={openPnl > 0 ? 'good' : openPnl < 0 ? 'bad' : 'neutral'} Icon={Zap} />
        <MetricCard label="Realized P&L" value={signed(book.realizedPnl)} sub={`${stats.totalTrades} closed`} tone={book.realizedPnl > 0 ? 'good' : book.realizedPnl < 0 ? 'bad' : 'neutral'} Icon={BookOpen} />
        <MetricCard label="Free Cash" value={inr(availableCash)} sub={`of ${inr(book.settings.startingCapital)}`} Icon={Wallet} />
        <MetricCard label="Win Rate" value={`${stats.winRate.toFixed(0)}%`} sub={`${stats.wins}W / ${stats.losses}L`} tone={stats.winRate >= 50 ? 'good' : stats.totalTrades ? 'bad' : 'neutral'} Icon={Trophy} />
        <MetricCard label="Charges Paid" value={inr(stats.totalCharges)} sub={stats.totalTrades ? `${inr(stats.totalCharges / stats.totalTrades)} / trade` : '—'} tone="bad" Icon={Percent} />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border ${toast.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {toast.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
      )}

      {/* Main body */}
      <div className="flex-1 flex flex-col xl:flex-row gap-4 overflow-hidden">

        {/* Order ticket */}
        <div className="xl:w-[340px] shrink-0 glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Buy Option</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* CE / PE */}
            <div className="grid grid-cols-2 gap-2">
              {(['CE', 'PE'] as PaperOptionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSide(t)}
                  className={`py-2.5 rounded-lg text-sm font-black transition-all border ${
                    side === t
                      ? t === 'CE'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/20 border-red-500/40 text-red-300'
                      : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t === 'CE' ? <ArrowUpRight size={14} className="inline mr-1" /> : <ArrowDownRight size={14} className="inline mr-1" />}
                  {t}
                </button>
              ))}
            </div>

            {/* Strike picker */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Strike</label>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-800 divide-y divide-white/5">
                {visibleRows.length === 0 && (
                  <p className="p-3 text-xs text-slate-500">Waiting for the option chain…</p>
                )}
                {visibleRows.map((row) => {
                  const q = side === 'CE' ? row.ce : row.pe;
                  const isAtm = row.strike === atmStrike;
                  const isSelected = row.strike === selectedStrike;
                  const itm = niftyLtp != null && (side === 'CE' ? niftyLtp > row.strike : niftyLtp < row.strike);
                  return (
                    <button
                      key={row.strike}
                      ref={isSelected ? selectedRowRef : undefined}
                      onClick={() => setSelectedStrike(row.strike)}
                      disabled={!q || q.lp <= 0}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors disabled:opacity-30 ${
                        isSelected ? 'bg-teal-500/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold ${isSelected ? 'text-teal-300' : 'text-slate-300'}`}>
                          {row.strike}
                        </span>
                        {isAtm && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-blue-500/20 text-blue-300">ATM</span>}
                        {!isAtm && (
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${itm ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700/40 text-slate-500'}`}>
                            {itm ? 'ITM' : 'OTM'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-white">{q && q.lp > 0 ? `₹${q.lp.toFixed(2)}` : '—'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lots */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Lots <span className="text-slate-600 normal-case font-normal">({quantity} qty)</span>
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setLots((l) => Math.max(1, l - 1))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Minus size={14} /></button>
                <input
                  type="number"
                  min={1}
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, Number(e.target.value) || 1))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-center text-sm text-white font-mono outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button onClick={() => setLots((l) => l + 1)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><Plus size={14} /></button>
              </div>
            </div>

            {/* Risk levels */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={useSl} onChange={(e) => setUseSl(e.target.checked)} className="accent-red-500" />
                <Shield size={12} className="text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-1">Stop Loss</span>
                <input
                  type="number"
                  value={slPercent}
                  disabled={!useSl}
                  onChange={(e) => setSlPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono text-right outline-none disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-500">%</span>
                <span className="w-16 text-right text-xs font-mono text-red-400">{slPrice != null ? `₹${slPrice.toFixed(2)}` : '—'}</span>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={useTgt} onChange={(e) => setUseTgt(e.target.checked)} className="accent-emerald-500" />
                <Target size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-1">Target</span>
                <input
                  type="number"
                  value={tgtPercent}
                  disabled={!useTgt}
                  onChange={(e) => setTgtPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono text-right outline-none disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-500">%</span>
                <span className="w-16 text-right text-xs font-mono text-emerald-400">{tgtPrice != null ? `₹${tgtPrice.toFixed(2)}` : '—'}</span>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={useTrail} onChange={(e) => setUseTrail(e.target.checked)} className="accent-amber-500" />
                <TrendingUp size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-1">Trail By</span>
                <input
                  type="number"
                  value={trailPoints}
                  disabled={!useTrail}
                  placeholder="pts"
                  onChange={(e) => setTrailPoints(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono text-right outline-none disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-500">pts</span>
                <span className="w-16" />
              </div>
            </div>

            {/* Cost summary */}
            <div className="glass-card rounded-lg p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Premium</span><span className="font-mono text-white">{premium > 0 ? `₹${premium.toFixed(2)}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Premium × {quantity}</span><span className="font-mono text-white">{inr(premium * quantity)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Entry charges</span><span className="font-mono text-amber-400">{entryCharges ? inr(entryCharges.total, 2) : '—'}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-1.5"><span className="text-slate-400 font-bold">Total outlay</span><span className="font-mono text-white font-bold">{inr(outlay)}</span></div>
              {riskAmount != null && (
                <div className="flex justify-between"><span className="text-slate-500">Risk at SL</span><span className="font-mono text-red-400">{inr(riskAmount)}</span></div>
              )}
              {rewardAmount != null && (
                <div className="flex justify-between"><span className="text-slate-500">Reward at target</span><span className="font-mono text-emerald-400">{inr(rewardAmount)}</span></div>
              )}
              {rr != null && (
                <div className="flex justify-between"><span className="text-slate-500">Risk : Reward</span><span className={`font-mono font-bold ${rr >= 1.5 ? 'text-emerald-400' : rr >= 1 ? 'text-amber-400' : 'text-red-400'}`}>1 : {rr.toFixed(2)}</span></div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleBuy}
              disabled={!canBuy}
              className={`w-full py-3 rounded-lg font-black text-sm transition-all ${
                canBuy
                  ? side === 'CE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              {!selectedQuote || premium <= 0
                ? 'Select a strike'
                : outlay > availableCash
                  ? 'Insufficient capital'
                  : `BUY ${selectedStrike} ${side} · ${inr(outlay)}`}
            </button>
          </div>
        </div>

        {/* Positions & history */}
        <div className="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden min-w-0">
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-white/5">
            {(['positions', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all ${
                  tab === t ? 'bg-white/5 text-teal-300 border-b-2 border-teal-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'positions' ? `Open (${book.positions.length})` : `History (${book.trades.length})`}
              </button>
            ))}
            {tab === 'history' && book.trades.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear the closed-trade log? Realized P&L and equity are kept.')) { paperTradingEngine.clearHistory(); flash('Trade history cleared.', true); } }}
                className="ml-auto mb-1 px-2 py-1 text-slate-600 hover:text-red-400 transition-colors"
                title="Clear trade history"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {tab === 'positions' ? (
              book.positions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <BookOpen size={40} className="text-slate-700 mb-3" />
                  <p className="text-sm text-slate-400">No open positions.</p>
                  <p className="text-xs text-slate-600 mt-1">Pick a strike on the left and place a simulated buy.</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-950/90 backdrop-blur text-[9px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold">Contract</th>
                      <th className="px-3 py-2.5 text-right font-bold">Qty</th>
                      <th className="px-3 py-2.5 text-right font-bold">Entry</th>
                      <th className="px-3 py-2.5 text-right font-bold">LTP</th>
                      <th className="px-3 py-2.5 text-right font-bold">SL / Target</th>
                      <th className="px-3 py-2.5 text-right font-bold">P&L</th>
                      <th className="px-3 py-2.5 text-right font-bold">Age</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {book.positions.map((p) => {
                      const pnl = positionPnl(p);
                      const pct = positionPnlPercent(p);
                      const stop = effectiveStop(p);
                      return (
                        <tr key={p.id} className="hover:bg-white/5">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${p.optionType === 'CE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                {p.optionType}
                              </span>
                              <div>
                                <div className="font-bold text-white font-mono">{p.strike}</div>
                                <div className="text-[9px] text-slate-500">{clockTime(p.entryTime)}{p.expiry ? ` · ${p.expiry}` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-300">{p.lots}L<span className="text-slate-600"> / {p.quantity}</span></td>
                          <td className="px-3 py-3 text-right font-mono text-slate-300">₹{p.entryPrice.toFixed(2)}</td>
                          <td className="px-3 py-3 text-right font-mono text-white font-bold">₹{p.ltp.toFixed(2)}</td>
                          <td className="px-3 py-3 text-right font-mono text-[10px]">
                            <div className="text-red-400">{stop != null ? `₹${stop.toFixed(2)}` : '—'}{p.trailPoints != null && <span className="text-amber-500"> ⇡</span>}</div>
                            <div className="text-emerald-400">{p.target != null ? `₹${p.target.toFixed(2)}` : '—'}</div>
                          </td>
                          <td className={`px-3 py-3 text-right font-mono font-bold ${pnlColor(pnl)}`}>
                            <div>{signed(pnl)}</div>
                            <div className="text-[10px] opacity-80">{pct >= 0 ? '+' : ''}{pct.toFixed(1)}%</div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-500 text-[10px]">{holdLabel(Date.now() - p.entryTime)}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => handleExit(p)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-red-600 border border-white/10 text-slate-300 hover:text-white rounded text-[10px] font-bold transition-all"
                            >
                              EXIT
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : book.trades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Clock size={40} className="text-slate-700 mb-3" />
                <p className="text-sm text-slate-400">No closed trades yet.</p>
              </div>
            ) : (
              <>
                {/* Performance strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-3 border-b border-white/5">
                  <div><div className="text-[9px] uppercase text-slate-500 font-bold">Avg Win</div><div className="text-sm font-mono font-bold text-emerald-400">{inr(stats.avgWin)}</div></div>
                  <div><div className="text-[9px] uppercase text-slate-500 font-bold">Avg Loss</div><div className="text-sm font-mono font-bold text-red-400">{inr(stats.avgLoss)}</div></div>
                  <div><div className="text-[9px] uppercase text-slate-500 font-bold">Expectancy</div><div className={`text-sm font-mono font-bold ${pnlColor(stats.expectancy)}`}>{signed(stats.expectancy)}</div></div>
                  <div><div className="text-[9px] uppercase text-slate-500 font-bold">Profit Factor</div><div className="text-sm font-mono font-bold text-white">{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}</div></div>
                  <div><div className="text-[9px] uppercase text-slate-500 font-bold">Avg Hold</div><div className="text-sm font-mono font-bold text-white">{stats.avgHoldMinutes.toFixed(0)}m</div></div>
                  <div><div className="text-[9px] uppercase text-slate-500 font-bold">Streaks</div><div className="text-sm font-mono font-bold"><span className="text-emerald-400">{stats.bestStreak}W</span> <span className="text-slate-600">/</span> <span className="text-red-400">{stats.worstStreak}L</span></div></div>
                </div>

                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-950/90 backdrop-blur text-[9px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-bold">Contract</th>
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
                    {book.trades.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${t.optionType === 'CE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                              {t.optionType}
                            </span>
                            <div>
                              <div className="font-bold text-white font-mono">{t.strike}</div>
                              <div className="text-[9px] text-slate-500">{clockTime(t.entryTime)} → {clockTime(t.exitTime)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-400">{t.lots}L</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-300">₹{t.entryPrice.toFixed(2)} → ₹{t.exitPrice.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-mono text-[10px]">
                          <span className="text-emerald-400">+{t.maxFavourable.toFixed(1)}</span>
                          <span className="text-slate-600"> / </span>
                          <span className="text-red-400">{t.maxAdverse.toFixed(1)}</span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-amber-400/80">{inr(t.charges, 0)}</td>
                        <td className={`px-3 py-3 text-right font-mono font-bold ${pnlColor(t.netPnl)}`}>
                          <div>{signed(t.netPnl)}</div>
                          <div className="text-[10px] opacity-80">{t.netPnlPercent >= 0 ? '+' : ''}{t.netPnlPercent.toFixed(1)}%</div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.exitReason === 'TARGET' ? 'bg-emerald-500/15 text-emerald-400'
                            : t.exitReason === 'STOPLOSS' ? 'bg-red-500/15 text-red-400'
                            : t.exitReason === 'TRAILING' ? 'bg-amber-500/15 text-amber-400'
                            : t.exitReason === 'EOD' ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-slate-700/40 text-slate-400'
                          }`}>
                            {t.exitReason}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500 text-[10px]">{holdLabel(t.holdMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperTrading;
