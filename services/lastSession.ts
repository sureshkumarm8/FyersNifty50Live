/**
 * LAST SESSION SCREEN — rebuilds the stock list from the app's own saved session
 * history (IndexedDB `today_session`, one candle per refresh per symbol), so the
 * Cockpit can show the last available market data after hours without pulling
 * anything from the broker (user, 2026-11-27).
 *
 * Exact from the last candle: price, % change, volume, bid/ask quantities and
 * their day changes. Derived exactly: previous close (price ÷ (1 + %/100)) and
 * the absolute change. From the day's own samples (approximate, ~30 s spacing):
 * open, high, low. Candles after 15:30 IST are ignored (an after-hours poll is
 * not session data).
 *
 * Pure module: no React, no I/O.
 */
import { FyersQuote, SessionCandle, SessionHistoryMap } from '../types';

const istMin = (ms: number) => {
  const [h, m] = new Date(ms).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).split(':').map(Number);
  return h * 60 + m;
};

/** NSE equities only: options and the index are not Cockpit stocks. */
export const isEquitySymbol = (symbol: string) =>
  /^NSE:[A-Z0-9&-]+$/.test(symbol) && !/NIFTY/.test(symbol) && !/-(CE|PE)$/.test(symbol);

export interface LastSession {
  quotes: FyersQuote[];
  /** The last in-session candle time across all symbols (epoch ms), or null. */
  asOf: number | null;
  /** Per symbol, the last in-session candle (for the day metrics the quote lacks). */
  last: Record<string, SessionCandle>;
  /** True when no candle fell inside 09:15-15:30 and after-close reads were used (prices = the close). */
  afterClose: boolean;
}

export function quotesFromSession(session: SessionHistoryMap): LastSession {
  const quotes: FyersQuote[] = [];
  const last: Record<string, SessionCandle> = {};
  let asOf: number | null = null;
  let anyInSession = false;
  for (const [symbol, candles] of Object.entries(session || {})) {
    if (!isEquitySymbol(symbol) || !Array.isArray(candles) || candles.length === 0) continue;
    const inSession = candles.filter(c => c && c.lp > 0 && istMin(c.timestamp) >= 9 * 60 + 15 && istMin(c.timestamp) <= 15 * 60 + 30);
    const use = (inSession.length ? inSession : candles.filter(c => c && c.lp > 0)).sort((a, b) => a.timestamp - b.timestamp);
    if (inSession.length) anyInSession = true;
    if (!use.length) continue;
    const c = use[use.length - 1];
    last[symbol] = c;
    asOf = asOf === null ? c.timestamp : Math.max(asOf, c.timestamp);
    const prev = c.chp > -100 ? c.lp / (1 + (c.chp || 0) / 100) : c.lp;
    const name = symbol.replace(/^NSE:/, '').replace(/-EQ$/, '');
    quotes.push({
      symbol,
      short_name: name,
      description: name,
      original_name: symbol,
      exchange: 'NSE',
      lp: c.lp,
      chp: c.chp || 0,
      ch: Math.round((c.lp - prev) * 100) / 100,
      prev_close_price: Math.round(prev * 100) / 100,
      open_price: use[0].lp,
      high_price: Math.max(...use.map(x => x.lp)),
      low_price: Math.min(...use.map(x => x.lp)),
      ask: c.lp,
      bid: c.lp,
      spread: 0,
      tt: c.timestamp,
      volume: c.volume || 0,
      total_buy_qty: c.total_buy_qty || 0,
      total_sell_qty: c.total_sell_qty || 0
    } as FyersQuote);
  }
  return { quotes, asOf, last, afterClose: quotes.length > 0 && !anyInSession };
}
