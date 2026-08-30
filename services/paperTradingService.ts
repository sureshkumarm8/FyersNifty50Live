/**
 * PAPER TRADING ENGINE
 *
 * A self-contained, broker-free simulator for buying Nifty50 options with live
 * market prices. Nothing here ever touches a broker API - it exists purely to
 * practise execution, position sizing and exit discipline against real ticks.
 *
 * Design notes:
 *  - Option BUYING only (long CE / long PE), which is how this book is traded.
 *    Premium is debited in full at entry, so there is no margin model to fake.
 *  - Fills are marked at the live traded price. There is no synthetic slippage
 *    or random rejection: the point is to learn the market, not a dice roll.
 *  - Indian F&O statutory charges are modelled properly, because for an option
 *    buyer scalping small moves the charges are often the difference between a
 *    winning and a losing month.
 */

import { EnrichedFyersQuote, FyersQuote } from '../types';
import { dbService } from './db';

export const NIFTY_LOT_SIZE = 75;
const STORE_KEY = 'paper_trading_book_v1';
const DEFAULT_CAPITAL = 100000;

export type PaperOptionType = 'CE' | 'PE';
export type PaperExitReason = 'MANUAL' | 'TARGET' | 'STOPLOSS' | 'TRAILING' | 'EOD';

export interface ChargeBreakdown {
  brokerage: number;
  stt: number;
  transaction: number;
  sebi: number;
  stamp: number;
  gst: number;
  total: number;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  displayName: string;
  strike: number;
  optionType: PaperOptionType;
  expiry?: string;
  lots: number;
  lotSize: number;
  quantity: number;
  entryPrice: number;
  entryTime: number;
  spotAtEntry: number | null;
  ltp: number;
  lastTick: number;
  stopLoss: number | null;
  target: number | null;
  /** Points of premium to trail behind the high-water mark. null = disabled. */
  trailPoints: number | null;
  highWaterPremium: number;
  lowWaterPremium: number;
  entryCharges: ChargeBreakdown;
  notes?: string;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  displayName: string;
  strike: number;
  optionType: PaperOptionType;
  expiry?: string;
  lots: number;
  lotSize: number;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  holdMs: number;
  spotAtEntry: number | null;
  spotAtExit: number | null;
  grossPnl: number;
  charges: number;
  netPnl: number;
  /** Return on the premium actually deployed, in percent. */
  netPnlPercent: number;
  exitReason: PaperExitReason;
  /** Best unrealised profit seen while the trade was open (points of premium). */
  maxFavourable: number;
  /** Worst unrealised loss seen while the trade was open (points of premium). */
  maxAdverse: number;
  notes?: string;
}

export interface PaperSettings {
  startingCapital: number;
  lotSize: number;
  /** Flat brokerage charged per executed order, in rupees. */
  brokeragePerOrder: number;
  /** Automatically square off every open position at 15:20 IST. */
  autoSquareOff: boolean;
}

export interface PaperBook {
  version: 1;
  settings: PaperSettings;
  positions: PaperPosition[];
  trades: PaperTrade[];
  realizedPnl: number;
  totalCharges: number;
  createdAt: number;
}

export interface PaperStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  grossPnl: number;
  totalCharges: number;
  netPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
  avgHoldMinutes: number;
  bestStreak: number;
  worstStreak: number;
}

export interface OrderRequest {
  quote: FyersQuote | EnrichedFyersQuote;
  lots: number;
  spot: number | null;
  stopLoss?: number | null;
  target?: number | null;
  trailPoints?: number | null;
  notes?: string;
}

export interface OrderResult {
  ok: boolean;
  message: string;
  position?: PaperPosition;
}

export interface ParsedOptionSymbol {
  strike: number;
  optionType: PaperOptionType;
  displayName: string;
}

// ---------------------------------------------------------------------------
// Symbol parsing
// ---------------------------------------------------------------------------

/** Nifty strikes are always multiples of 50, which disambiguates packed symbols. */
const isPlausibleStrike = (n: number) => n >= 1000 && n <= 100000 && n % 50 === 0;

/**
 * Reads the strike and option type out of a quote. Both provider formats are
 * supported: PayTM's "NSE:NIFTY-23200-PE" and Fyers' "NSE:NIFTY25O0723200PE".
 */
export function parseOptionQuote(quote: FyersQuote): ParsedOptionSymbol | null {
  const name = quote.original_name || quote.short_name || quote.description || '';

  const build = (strike: number, type: string): ParsedOptionSymbol => ({
    strike,
    optionType: type.toUpperCase() as PaperOptionType,
    displayName: `NIFTY ${strike} ${type.toUpperCase()}`
  });

  // Preferred: the provider already gives us "NIFTY 23200 PE"
  const fromName = name.match(/(\d{3,6})\s*(CE|PE)\b/i);
  if (fromName) return build(Number(fromName[1]), fromName[2]);

  const symbol = quote.symbol || '';

  // PayTM: NSE:NIFTY-23200-PE
  const dashed = symbol.match(/-(\d{3,6})-(CE|PE)$/i);
  if (dashed) return build(Number(dashed[1]), dashed[2]);

  // Fyers monthly: NSE:NIFTY25OCT23200CE
  const monthly = symbol.match(/NIFTY\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{3,6})(CE|PE)$/i);
  if (monthly) return build(Number(monthly[1]), monthly[2]);

  // Fyers weekly: NSE:NIFTY25O0723200CE -> yy=25, month code=O, dd=07, strike=23200.
  // The month code may itself be a digit (1-9), so anchor on the two-digit day
  // and verify the remainder looks like a real strike.
  const weekly = symbol.match(/NIFTY\d{2}([1-9OND])\d{2}(\d{3,6})(CE|PE)$/i);
  if (weekly && isPlausibleStrike(Number(weekly[2]))) return build(Number(weekly[2]), weekly[3]);

  // Last resort: take the trailing digits and shrink until they look like a strike.
  const packed = symbol.match(/(\d{3,6})(CE|PE)$/i);
  if (packed) {
    let digits = packed[1];
    while (digits.length > 3 && !isPlausibleStrike(Number(digits))) {
      digits = digits.slice(1);
    }
    if (isPlausibleStrike(Number(digits))) return build(Number(digits), packed[2]);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Charges (NSE index options, buyer's side)
// ---------------------------------------------------------------------------

const RATE_STT_SELL = 0.001;        // 0.1% of premium, sell side only
const RATE_TRANSACTION = 0.0003503; // NSE F&O options transaction charge
const RATE_SEBI = 0.000001;         // Rs 10 per crore
const RATE_STAMP_BUY = 0.00003;     // 0.003% of premium, buy side only
const RATE_GST = 0.18;

export function computeCharges(
  premium: number,
  quantity: number,
  side: 'BUY' | 'SELL',
  brokeragePerOrder: number
): ChargeBreakdown {
  const turnover = premium * quantity;

  const round = (n: number) => Math.round(n * 100) / 100;

  const brokerage = turnover > 0 ? round(brokeragePerOrder) : 0;
  const stt = round(side === 'SELL' ? turnover * RATE_STT_SELL : 0);
  const transaction = round(turnover * RATE_TRANSACTION);
  const sebi = round(turnover * RATE_SEBI);
  const stamp = round(side === 'BUY' ? turnover * RATE_STAMP_BUY : 0);
  const gst = round((brokerage + transaction + sebi) * RATE_GST);

  // Sum the rounded components rather than rounding the raw sum, so the
  // breakdown shown in the UI always adds up to the total charged.
  return {
    brokerage,
    stt,
    transaction,
    sebi,
    stamp,
    gst,
    total: round(brokerage + stt + transaction + sebi + stamp + gst)
  };
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Unrealised P&L of a position at its current mark, before exit charges. */
export function positionPnl(p: PaperPosition): number {
  return (p.ltp - p.entryPrice) * p.quantity;
}

export function positionPnlPercent(p: PaperPosition): number {
  if (p.entryPrice <= 0) return 0;
  return ((p.ltp - p.entryPrice) / p.entryPrice) * 100;
}

/** Premium paid to open the position, including entry charges. */
export function positionCost(p: PaperPosition): number {
  return p.entryPrice * p.quantity + p.entryCharges.total;
}

/** Where a trailing stop currently sits, or null when trailing is off. */
export function effectiveStop(p: PaperPosition): number | null {
  if (p.trailPoints == null) return p.stopLoss;
  const trailed = p.highWaterPremium - p.trailPoints;
  if (p.stopLoss == null) return trailed;
  return Math.max(p.stopLoss, trailed);
}

function emptyBook(): PaperBook {
  return {
    version: 1,
    settings: {
      startingCapital: DEFAULT_CAPITAL,
      lotSize: NIFTY_LOT_SIZE,
      brokeragePerOrder: 20,
      autoSquareOff: true
    },
    positions: [],
    trades: [],
    realizedPnl: 0,
    totalCharges: 0,
    createdAt: Date.now()
  };
}

function istTimeValue(): number {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return ist.getHours() * 100 + ist.getMinutes();
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

type Listener = (book: PaperBook) => void;

class PaperTradingEngine {
  private book: PaperBook = emptyBook();
  private listeners = new Set<Listener>();
  private loaded = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  // --- lifecycle -----------------------------------------------------------

  public async load(): Promise<PaperBook> {
    if (this.loaded) return this.book;
    try {
      await dbService.init();
      const stored = await dbService.getMeta(STORE_KEY);
      if (stored && stored.version === 1) {
        // Merge over a fresh book so newly added settings get their defaults.
        const base = emptyBook();
        this.book = {
          ...base,
          ...stored,
          settings: { ...base.settings, ...(stored.settings || {}) }
        };
      }
    } catch (e) {
      console.warn('[Paper] Could not load saved book, starting fresh:', e);
    }
    this.loaded = true;
    this.emit();
    return this.book;
  }

  public getBook(): PaperBook {
    return this.book;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    // Hand out a shallow clone so React sees a new reference every time.
    const snapshot: PaperBook = {
      ...this.book,
      positions: [...this.book.positions],
      trades: [...this.book.trades]
    };
    this.listeners.forEach((l) => l(snapshot));
  }

  private persist() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      dbService.setMeta(STORE_KEY, this.book).catch((e) =>
        console.warn('[Paper] Save failed:', e)
      );
    }, 400);
  }

  private commit() {
    this.emit();
    this.persist();
  }

  // --- settings ------------------------------------------------------------

  public updateSettings(patch: Partial<PaperSettings>) {
    this.book.settings = { ...this.book.settings, ...patch };
    this.commit();
  }

  /** Wipes positions and history and restores the starting capital. */
  public resetAccount(startingCapital?: number) {
    const settings = {
      ...this.book.settings,
      startingCapital: startingCapital ?? this.book.settings.startingCapital
    };
    this.book = { ...emptyBook(), settings, createdAt: Date.now() };
    this.commit();
  }

  /** Drops the closed-trade log but keeps open positions and realized P&L. */
  public clearHistory() {
    this.book.trades = [];
    this.commit();
  }

  // --- account -------------------------------------------------------------

  /** Capital not currently locked up in open premium. */
  public availableCash(): number {
    const deployed = this.book.positions.reduce((sum, p) => sum + positionCost(p), 0);
    return this.book.settings.startingCapital + this.book.realizedPnl - deployed;
  }

  public openPnl(): number {
    return this.book.positions.reduce((sum, p) => sum + positionPnl(p), 0);
  }

  // --- trading -------------------------------------------------------------

  public buy(request: OrderRequest): OrderResult {
    const { quote, lots, spot } = request;
    const parsed = parseOptionQuote(quote);

    if (!parsed) {
      return { ok: false, message: 'Could not read the strike from this contract.' };
    }
    if (!Number.isFinite(lots) || lots < 1) {
      return { ok: false, message: 'Quantity must be at least 1 lot.' };
    }

    const price = quote.lp;
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, message: 'No live price for this contract yet.' };
    }

    const lotSize = this.book.settings.lotSize;
    const quantity = lots * lotSize;
    const charges = computeCharges(price, quantity, 'BUY', this.book.settings.brokeragePerOrder);
    const cost = price * quantity + charges.total;

    if (cost > this.availableCash()) {
      return {
        ok: false,
        message: `Not enough capital. This costs ₹${Math.round(cost).toLocaleString('en-IN')} but only ₹${Math.round(this.availableCash()).toLocaleString('en-IN')} is free.`
      };
    }

    const stopLoss = request.stopLoss != null && request.stopLoss > 0 ? request.stopLoss : null;
    const target = request.target != null && request.target > 0 ? request.target : null;

    if (stopLoss != null && stopLoss >= price) {
      return { ok: false, message: 'Stop loss must be below the entry premium.' };
    }
    if (target != null && target <= price) {
      return { ok: false, message: 'Target must be above the entry premium.' };
    }

    const now = Date.now();
    const position: PaperPosition = {
      id: `P${now}-${Math.random().toString(36).slice(2, 7)}`,
      symbol: quote.symbol,
      displayName: parsed.displayName,
      strike: parsed.strike,
      optionType: parsed.optionType,
      expiry: quote.expiry_date,
      lots,
      lotSize,
      quantity,
      entryPrice: price,
      entryTime: now,
      spotAtEntry: spot,
      ltp: price,
      lastTick: now,
      stopLoss,
      target,
      trailPoints: request.trailPoints != null && request.trailPoints > 0 ? request.trailPoints : null,
      highWaterPremium: price,
      lowWaterPremium: price,
      entryCharges: charges,
      notes: request.notes
    };

    this.book.positions = [position, ...this.book.positions];
    this.book.totalCharges += charges.total;
    this.commit();

    return {
      ok: true,
      position,
      message: `Bought ${lots} lot${lots > 1 ? 's' : ''} of ${parsed.displayName} at ₹${price.toFixed(2)}`
    };
  }

  public exit(positionId: string, reason: PaperExitReason = 'MANUAL', priceOverride?: number, spot?: number | null): OrderResult {
    const position = this.book.positions.find((p) => p.id === positionId);
    if (!position) return { ok: false, message: 'Position not found.' };

    const exitPrice = priceOverride != null ? priceOverride : position.ltp;
    if (!Number.isFinite(exitPrice) || exitPrice < 0) {
      return { ok: false, message: 'No valid exit price available.' };
    }

    const exitCharges = computeCharges(exitPrice, position.quantity, 'SELL', this.book.settings.brokeragePerOrder);
    const grossPnl = (exitPrice - position.entryPrice) * position.quantity;
    const charges = position.entryCharges.total + exitCharges.total;
    const netPnl = grossPnl - charges;
    const now = Date.now();
    const deployed = position.entryPrice * position.quantity;

    const trade: PaperTrade = {
      id: position.id,
      symbol: position.symbol,
      displayName: position.displayName,
      strike: position.strike,
      optionType: position.optionType,
      expiry: position.expiry,
      lots: position.lots,
      lotSize: position.lotSize,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice,
      entryTime: position.entryTime,
      exitTime: now,
      holdMs: now - position.entryTime,
      spotAtEntry: position.spotAtEntry,
      spotAtExit: spot ?? null,
      grossPnl,
      charges,
      netPnl,
      netPnlPercent: deployed > 0 ? (netPnl / deployed) * 100 : 0,
      exitReason: reason,
      maxFavourable: position.highWaterPremium - position.entryPrice,
      maxAdverse: position.lowWaterPremium - position.entryPrice,
      notes: position.notes
    };

    this.book.positions = this.book.positions.filter((p) => p.id !== positionId);
    this.book.trades = [trade, ...this.book.trades];
    this.book.realizedPnl += netPnl;
    this.book.totalCharges += exitCharges.total;
    this.commit();

    return {
      ok: true,
      message: `Exited ${position.displayName} at ₹${exitPrice.toFixed(2)} · ${netPnl >= 0 ? '+' : ''}₹${Math.round(netPnl).toLocaleString('en-IN')}`
    };
  }

  public exitAll(reason: PaperExitReason = 'MANUAL', spot?: number | null): number {
    const ids = this.book.positions.map((p) => p.id);
    ids.forEach((id) => this.exit(id, reason, undefined, spot));
    return ids.length;
  }

  public updateRisk(positionId: string, patch: { stopLoss?: number | null; target?: number | null; trailPoints?: number | null }): OrderResult {
    const position = this.book.positions.find((p) => p.id === positionId);
    if (!position) return { ok: false, message: 'Position not found.' };

    if (patch.stopLoss !== undefined) position.stopLoss = patch.stopLoss && patch.stopLoss > 0 ? patch.stopLoss : null;
    if (patch.target !== undefined) position.target = patch.target && patch.target > 0 ? patch.target : null;
    if (patch.trailPoints !== undefined) position.trailPoints = patch.trailPoints && patch.trailPoints > 0 ? patch.trailPoints : null;

    this.book.positions = [...this.book.positions];
    this.commit();
    return { ok: true, message: 'Risk levels updated.' };
  }

  /**
   * Marks every open position against the latest chain and fires any stop,
   * target or trailing exit that the new prices have triggered.
   *
   * Returns the exits that were executed so the UI can surface them.
   */
  public markToMarket(
    quotes: (FyersQuote | EnrichedFyersQuote)[],
    spot: number | null
  ): { position: PaperPosition; reason: PaperExitReason; price: number }[] {
    if (this.book.positions.length === 0) return [];

    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    const triggered: { position: PaperPosition; reason: PaperExitReason; price: number }[] = [];
    const now = Date.now();
    let changed = false;

    for (const position of this.book.positions) {
      const quote = bySymbol.get(position.symbol);
      if (!quote || !Number.isFinite(quote.lp) || quote.lp <= 0) continue;

      const ltp = quote.lp;
      if (ltp !== position.ltp) changed = true;

      position.ltp = ltp;
      position.lastTick = now;
      if (ltp > position.highWaterPremium) position.highWaterPremium = ltp;
      if (ltp < position.lowWaterPremium) position.lowWaterPremium = ltp;

      // On a fast move both levels can be crossed inside a single refresh.
      // Stops are checked first so an ambiguous tick resolves against us
      // rather than flattering the results.
      const stop = effectiveStop(position);
      if (stop != null && ltp <= stop) {
        triggered.push({
          position,
          reason: position.trailPoints != null && stop > (position.stopLoss ?? -Infinity) ? 'TRAILING' : 'STOPLOSS',
          price: ltp
        });
        continue;
      }
      if (position.target != null && ltp >= position.target) {
        triggered.push({ position, reason: 'TARGET', price: ltp });
      }
    }

    if (this.book.settings.autoSquareOff && istTimeValue() >= 1520) {
      for (const position of this.book.positions) {
        if (!triggered.some((t) => t.position.id === position.id)) {
          triggered.push({ position, reason: 'EOD', price: position.ltp });
        }
      }
    }

    triggered.forEach((t) => this.exit(t.position.id, t.reason, t.price, spot));

    if (changed && triggered.length === 0) {
      this.book.positions = [...this.book.positions];
      this.commit();
    }

    return triggered;
  }

  // --- analytics -----------------------------------------------------------

  public getStats(): PaperStats {
    const trades = this.book.trades;
    const wins = trades.filter((t) => t.netPnl > 0);
    const losses = trades.filter((t) => t.netPnl <= 0);

    const grossProfit = wins.reduce((s, t) => s + t.netPnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));
    const netPnl = trades.reduce((s, t) => s + t.netPnl, 0);

    // Longest run of winners and of losers, walking oldest -> newest.
    let bestStreak = 0;
    let worstStreak = 0;
    let runWin = 0;
    let runLoss = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].netPnl > 0) {
        runWin++;
        runLoss = 0;
        bestStreak = Math.max(bestStreak, runWin);
      } else {
        runLoss++;
        runWin = 0;
        worstStreak = Math.max(worstStreak, runLoss);
      }
    }

    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? grossLoss / losses.length : 0;
    const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;

    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      grossPnl: trades.reduce((s, t) => s + t.grossPnl, 0),
      totalCharges: trades.reduce((s, t) => s + t.charges, 0),
      netPnl,
      avgWin,
      avgLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      expectancy: trades.length ? netPnl / trades.length : 0,
      largestWin: trades.reduce((m, t) => Math.max(m, t.netPnl), 0),
      largestLoss: trades.reduce((m, t) => Math.min(m, t.netPnl), 0),
      avgHoldMinutes: trades.length
        ? trades.reduce((s, t) => s + t.holdMs, 0) / trades.length / 60000
        : 0,
      bestStreak,
      worstStreak
    };
  }
}

export const paperTradingEngine = new PaperTradingEngine();
export default paperTradingEngine;
