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

/**
 * Who opened the position.
 *
 * MANUAL   placed on the Paper Trading screen and managed by this engine.
 * AUTOTRADE placed by a strategy panel (the Sniper) which owns its own exit
 *          rules. The paper book is its ledger, not its risk manager - see
 *          `openExternal` for why that distinction has to be enforced here.
 */
export type PaperTradeSource = 'MANUAL' | 'AUTOTRADE';
export type PaperExitReason = 'MANUAL' | 'TARGET' | 'STOPLOSS' | 'TRAILING' | 'EOD';

/**
 * Which engine took the trade. `exitReason` is a coarse bucket shared with
 * manual trading; this says *who* was responsible, so the Sniper's one trade a
 * day can be reviewed separately from Momentum's all-session scalping.
 */
export type PaperStrategy = 'SNIPER' | 'MOMENTUM';

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
  /** Absent on positions written before sources were tracked - treat as MANUAL. */
  source?: PaperTradeSource;
  /** Which engine opened it. Only meaningful when `source` is AUTOTRADE. */
  strategy?: PaperStrategy;
  /**
   * Why this trade was taken, in the engine's own words.
   *
   * `notes` is a free-form one-liner shown next to the row; this is the full
   * decision record - the signal, the levels and the confluence that justified
   * risking money. Without it a closed trade is a number with no lesson in it,
   * which is exactly what makes a journal useless for improving.
   */
  entryReason?: string;
  /** Free-form labels, e.g. ['AUTOTRADE', 'SNIPER', 'CONFLUENCE']. */
  tags?: string[];
  /**
   * True when this engine may close the position on its own stop/target.
   * False for strategy-owned positions: two systems exiting the same trade
   * would double-count the P&L and race each other on a fast tick.
   */
  managed?: boolean;
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
  /** Absent on trades written before sources were tracked - treat as MANUAL. */
  source?: PaperTradeSource;
  /** Which engine took the trade. Only meaningful when `source` is AUTOTRADE. */
  strategy?: PaperStrategy;
  /** The full decision record captured at entry. See PaperPosition.entryReason. */
  entryReason?: string;
  /**
   * Why the position was closed, verbatim from the engine.
   *
   * `exitReason` collapses every exit into one of five buckets, so "10:15 hard
   * stop", "stand-down" and "manual click" all arrive as EOD or MANUAL and
   * become indistinguishable afterwards. This preserves the actual trigger.
   */
  exitNote?: string;
  tags?: string[];
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

// ---------------------------------------------------------------------------
// Ownership (which engine took a trade)
// ---------------------------------------------------------------------------

/**
 * `source` and `strategy` are younger than the `tags` both engines have always
 * written, so trades journaled before those fields existed carry their owner in
 * the tag list only. Reading ownership through these helpers — rather than off
 * the field — keeps those trades visible instead of silently dropping them from
 * every per-strategy view.
 */
const hasTag = (record: { tags?: string[] }, tag: string): boolean =>
  Array.isArray(record.tags) && record.tags.some((t) => String(t).toUpperCase() === tag);

/** Which engine owns this record, falling back to its tags. */
export function ownerStrategy(record: {
  strategy?: PaperStrategy;
  tags?: string[];
}): PaperStrategy | undefined {
  if (record.strategy) return record.strategy;
  if (hasTag(record, 'SNIPER')) return 'SNIPER';
  if (hasTag(record, 'MOMENTUM')) return 'MOMENTUM';
  return undefined;
}

/** True when an engine — not a hand-placed order — put this on the book. */
export function isAutoTrade(record: { source?: PaperTradeSource; tags?: string[] }): boolean {
  return record.source === 'AUTOTRADE' || hasTag(record, 'AUTOTRADE');
}

/** True when this record belongs to the given engine. */
export const belongsToStrategy = (
  record: { source?: PaperTradeSource; strategy?: PaperStrategy; tags?: string[] },
  strategy: PaperStrategy
): boolean => isAutoTrade(record) && ownerStrategy(record) === strategy;

/**
 * Writes the derived owner back onto records that predate the fields, so the
 * rest of the app (and any future query) can trust `source`/`strategy`.
 * Returns true when anything changed and the book is worth re-saving.
 */
function backfillOwnership(records: Array<{ source?: PaperTradeSource; strategy?: PaperStrategy; tags?: string[] }>): boolean {
  let changed = false;
  for (const record of records) {
    if (!record.source && isAutoTrade(record)) {
      record.source = 'AUTOTRADE';
      changed = true;
    }
    if (!record.strategy && record.source === 'AUTOTRADE') {
      const owner = ownerStrategy(record);
      if (owner) {
        record.strategy = owner;
        changed = true;
      }
    }
  }
  return changed;
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
    // Heal records written before `source`/`strategy` existed, once, on the way in.
    if (backfillOwnership([...this.book.positions, ...this.book.trades])) this.persist();
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
      notes: request.notes,
      // A hand-placed trade has no engine reasoning, so record the plan that was
      // set at entry. It is what the exit will later have to be judged against.
      entryReason:
        request.notes?.trim() ||
        `Manual entry at ₹${price.toFixed(2)}${spot ? ` with Nifty at ${spot.toFixed(2)}` : ''}` +
          `${target != null ? ` · target ₹${target.toFixed(2)}` : ''}` +
          `${stopLoss != null ? ` · stop ₹${stopLoss.toFixed(2)}` : ''}`
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

  public exit(
    positionId: string,
    reason: PaperExitReason = 'MANUAL',
    priceOverride?: number,
    spot?: number | null,
    exitNote?: string,
    /** Defaults to now. Supplied when replaying an exit that already happened. */
    exitTime?: number
  ): OrderResult {
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
    const now = exitTime ?? Date.now();
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
      notes: position.notes,
      source: isAutoTrade(position) ? 'AUTOTRADE' : position.source ?? 'MANUAL',
      strategy: ownerStrategy(position),
      entryReason: position.entryReason,
      exitNote,
      tags: position.tags
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

  /**
   * Record a position opened by a strategy panel that manages its own exits.
   *
   * The Sniper places its trade through its own OrderManager and runs its own
   * +30/-30 and 10:15 rules. Before this existed those trades were invisible
   * in the paper book, so the ledger, the equity curve and every statistic on
   * the Paper Trading screen silently excluded the trades the system took
   * automatically - which is the opposite of what a journal is for.
   *
   * Two deliberate differences from `buy()`:
   *
   *   - `managed: false`. This engine will mark the position to market but
   *     will never close it on a stop or target. The strategy owns the exit;
   *     if both systems could exit it, a fast tick would book the trade twice.
   *   - No capital check. The order has already been placed. Refusing to
   *     record it would not un-place it, it would only lose the record.
   */
  public async openExternal(params: {
    symbol: string;
    displayName?: string;
    strike: number;
    optionType: PaperOptionType;
    expiry?: string;
    lots: number;
    entryPrice: number;
    spot: number | null;
    tags?: string[];
    notes?: string;
    /** Which engine is taking the trade. */
    strategy?: PaperStrategy;
    /**
     * The contract's lot size, as the engine that placed the order used it.
     *
     * The book's own `settings.lotSize` is a manual-trading preference and can
     * be stale (it survives an exchange lot-size change). Recomputing quantity
     * from it booked a different size than the order actually filled, so the
     * logged P&L silently disagreed with the trade that was taken.
     */
    lotSize?: number;
    /** The full reasoning behind the entry, preserved for later review. */
    entryReason?: string;
    /** Defaults to now. Supplied so a restored trade keeps its real entry time. */
    entryTime?: number;
  }): Promise<OrderResult> {
    // Critical: a strategy panel can fire before the Paper screen has ever been
    // opened, and this engine starts on an EMPTY book until `load()` runs.
    // Writing first would persist that empty book over the saved one and wipe
    // the user's entire trade history.
    await this.load();

    const { symbol, strike, optionType, lots, entryPrice, spot } = params;

    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      return { ok: false, message: 'External entry needs a positive premium.' };
    }
    if (!Number.isFinite(lots) || lots < 1) {
      return { ok: false, message: 'External entry needs at least one lot.' };
    }
    // Recording the same fill twice would corrupt realized P&L, and the entry
    // effect can re-run on a re-render.
    if (this.book.positions.some((p) => p.symbol === symbol && isAutoTrade(p))) {
      return { ok: false, message: 'That auto-trade is already on the book.' };
    }

    const lotSize = params.lotSize && params.lotSize > 0 ? params.lotSize : this.book.settings.lotSize;
    const quantity = lots * lotSize;
    const charges = computeCharges(entryPrice, quantity, 'BUY', this.book.settings.brokeragePerOrder);
    const now = params.entryTime ?? Date.now();

    const position: PaperPosition = {
      id: `A${now}-${Math.random().toString(36).slice(2, 7)}`,
      symbol,
      displayName: params.displayName ?? `${strike} ${optionType}`,
      strike,
      optionType,
      expiry: params.expiry,
      lots,
      lotSize,
      quantity,
      entryPrice,
      entryTime: now,
      spotAtEntry: spot,
      ltp: entryPrice,
      lastTick: now,
      // Null so markToMarket has nothing to trigger on even if `managed` were
      // ever ignored - belt and braces on the double-exit risk.
      stopLoss: null,
      target: null,
      trailPoints: null,
      highWaterPremium: entryPrice,
      lowWaterPremium: entryPrice,
      entryCharges: charges,
      notes: params.notes,
      source: 'AUTOTRADE',
      strategy: params.strategy,
      entryReason: params.entryReason,
      tags: params.tags,
      managed: false
    };

    this.book.positions = [position, ...this.book.positions];
    this.book.totalCharges += charges.total;
    this.commit();

    return { ok: true, position, message: `Logged auto-trade ${position.displayName} at ₹${entryPrice.toFixed(2)}` };
  }

  /**
   * Mark an externally-managed position's premium without any exit check.
   *
   * Intentionally synchronous and load-guarded rather than load-awaiting: it
   * runs on every tick, and if the book is not loaded there is no external
   * position to mark anyway (openExternal loads before it creates one).
   */
  public markExternal(symbol: string, premium: number) {
    if (!this.loaded) return;
    const position = this.book.positions.find((p) => p.symbol === symbol && isAutoTrade(p));
    if (!position || !Number.isFinite(premium) || premium <= 0) return;
    if (premium === position.ltp) return;
    position.ltp = premium;
    position.lastTick = Date.now();
    if (premium > position.highWaterPremium) position.highWaterPremium = premium;
    if (premium < position.lowWaterPremium) position.lowWaterPremium = premium;
    this.book.positions = [...this.book.positions];
    this.commit();
  }

  /** Close a strategy-owned position into the log. Safe to call twice. */
  public async closeExternal(
    symbol: string,
    exitPrice: number,
    reason: PaperExitReason,
    spot: number | null,
    /** The engine's own words for why it exited, kept alongside the bucket. */
    exitNote?: string,
    /** Defaults to now. Supplied when replaying an exit that already happened. */
    exitTime?: number
  ): Promise<OrderResult> {
    await this.load();
    const position = this.book.positions.find((p) => p.symbol === symbol && isAutoTrade(p));
    if (!position) return { ok: false, message: 'No open auto-trade for that contract.' };
    return this.exit(
      position.id,
      reason,
      Number.isFinite(exitPrice) && exitPrice > 0 ? exitPrice : undefined,
      spot,
      exitNote,
      exitTime
    );
  }

  public exitAll(reason: PaperExitReason = 'MANUAL', spot?: number | null, exitNote?: string): number {
    const ids = this.book.positions.map((p) => p.id);
    ids.forEach((id) => this.exit(id, reason, undefined, spot, exitNote));
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

      // A strategy-owned position is marked but never exited here. The Sniper
      // runs the +30/-30 and 10:15 rules on SPOT, not premium; letting this
      // engine also exit on a premium level would close the trade twice and
      // book the P&L twice with it.
      if (position.managed === false) continue;

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
        if (position.managed === false) continue;
        if (!triggered.some((t) => t.position.id === position.id)) {
          triggered.push({ position, reason: 'EOD', price: position.ltp });
        }
      }
    }

    triggered.forEach((t) => {
      // Spell out the level that fired, so the history row explains itself
      // rather than showing a bare bucket name.
      const stop = effectiveStop(t.position);
      const note =
        t.reason === 'TARGET'
          ? `Premium reached the ₹${t.position.target?.toFixed(2)} target (exit ₹${t.price.toFixed(2)}).`
          : t.reason === 'TRAILING'
            ? `Trailing stop ₹${stop?.toFixed(2)} hit after the premium peaked at ₹${t.position.highWaterPremium.toFixed(2)}.`
            : t.reason === 'STOPLOSS'
              ? `Premium broke the ₹${stop?.toFixed(2)} stop (exit ₹${t.price.toFixed(2)}).`
              : 'Auto square-off at 15:20 IST — no position is carried overnight.';
      this.exit(t.position.id, t.reason, t.price, spot, note);
    });

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
