/**
 * MANUAL TRADE JOURNAL - turns the broker's "Executed" order lines into round
 * trips, measures each one against recorded Nifty prices, and renders the
 * scalping-journal row.
 *
 * Input is the text a trader copies from Kite's Orders > Executed list:
 *   09:42:07  SELL  NIFTY 1st w DEC 25750 CE NFO  NRML  65 / 65  236.15  COMPLETE
 *   09:31:55  BUY   NIFTY 1st w DEC 25750 CE NFO  NRML  65 / 65  216.65  COMPLETE
 *
 * Pure module: no React, no I/O.
 */

export interface Fill {
  time: string;
  side: 'BUY' | 'SELL';
  instrument: string;
  strike: number | null;
  optionType: 'CE' | 'PE' | null;
  product: string;
  qty: number;
  price: number;
}

export interface RoundTrip {
  instrument: string;
  strike: number | null;
  optionType: 'CE' | 'PE' | null;
  /** LONG = bought a CE (or sold a PE short), SHORT = bought a PE: the view on Nifty. */
  view: 'LONG' | 'SHORT' | null;
  product: string;
  qty: number;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  gross: number;
  heldSec: number;
}

const LINE = /(\d{1,2}:\d{2}:\d{2})\s+(BUY|SELL)\s+(.+?)\s+(MIS|NRML|CNC)\s+(\d+)\s*\/\s*(\d+)\s+([\d,]+(?:\.\d+)?)\s+COMPLETE/i;

export function parseExecutedOrders(text: string): Fill[] {
  const fills: Fill[] = [];
  for (const raw of (text || '').split('\n')) {
    const m = LINE.exec(raw.replace(/\t/g, ' '));
    if (!m) continue;
    const instrument = m[3].replace(/\s+/g, ' ').trim();
    const opt = /(\d{4,6})\s+(CE|PE)\b/i.exec(instrument);
    fills.push({
      time: m[1].padStart(8, '0'),
      side: m[2].toUpperCase() as 'BUY' | 'SELL',
      instrument,
      strike: opt ? Number(opt[1]) : null,
      optionType: opt ? (opt[2].toUpperCase() as 'CE' | 'PE') : null,
      product: m[4].toUpperCase(),
      qty: Number(m[5]),
      price: Number(m[7].replace(/,/g, ''))
    });
  }
  return fills.sort((a, b) => a.time.localeCompare(b.time));
}

const secs = (hms: string) => { const [h, m, s] = hms.split(':').map(Number); return h * 3600 + m * 60 + s; };

/** Pairs fills FIFO per instrument into round trips (opening side = the first fill seen). */
export function pairRoundTrips(fills: Fill[]): RoundTrip[] {
  const open = new Map<string, Fill[]>();
  const trips: RoundTrip[] = [];
  for (const f of fills) {
    const book = open.get(f.instrument) ?? [];
    const opposite = book.length && book[0].side !== f.side;
    if (!opposite) { book.push({ ...f }); open.set(f.instrument, book); continue; }
    let remaining = f.qty;
    while (remaining > 0 && book.length) {
      const o = book[0];
      const q = Math.min(o.qty, remaining);
      const long = o.side === 'BUY';
      const entryPrice = o.price, exitPrice = f.price;
      trips.push({
        instrument: f.instrument,
        strike: f.strike,
        optionType: f.optionType,
        view: f.optionType === null ? null : (f.optionType === 'CE') === long ? 'LONG' : 'SHORT',
        product: o.product,
        qty: q,
        entryTime: o.time,
        exitTime: f.time,
        entryPrice,
        exitPrice,
        gross: Math.round((long ? exitPrice - entryPrice : entryPrice - exitPrice) * q * 100) / 100,
        heldSec: secs(f.time) - secs(o.time)
      });
      o.qty -= q;
      remaining -= q;
      if (o.qty === 0) book.shift();
    }
    if (remaining > 0) book.push({ ...f, qty: remaining });
    open.set(f.instrument, book);
  }
  return trips;
}

export interface Excursion {
  spotIn: number | null;
  spotOut: number | null;
  /** Nifty points in the trade's favour (+) / against (-) at best and worst. */
  mfe: number | null;
  mae: number | null;
  samples: number;
}

/**
 * Best/worst Nifty excursion during a hold from recorded ticks (epoch ms).
 * `day` is the IST date, YYYY-MM-DD. Accuracy is bounded by the tick spacing.
 */
export function measureExcursion(trip: RoundTrip, day: string, ticks: { t: number; spot: number }[]): Excursion {
  const at = (hms: string) => Date.parse(`${day}T${hms}+05:30`);
  const t0 = at(trip.entryTime), t1 = at(trip.exitTime);
  const near = (t: number) => {
    let best: { t: number; spot: number } | null = null;
    for (const k of ticks) if (!best || Math.abs(k.t - t) < Math.abs(best.t - t)) best = k;
    return best && Math.abs(best.t - t) <= 90_000 ? best.spot : null;
  };
  const inHold = ticks.filter(k => k.t >= t0 && k.t <= t1);
  const spotIn = near(t0), spotOut = near(t1);
  if (spotIn === null || trip.view === null) return { spotIn, spotOut, mfe: null, mae: null, samples: inHold.length };
  const sign = trip.view === 'LONG' ? 1 : -1;
  const moves = inHold.map(k => sign * (k.spot - spotIn));
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    spotIn,
    spotOut,
    mfe: moves.length ? r1(Math.max(0, ...moves)) : null,
    mae: moves.length ? r1(Math.min(0, ...moves)) : null,
    samples: inHold.length
  };
}

export interface Feelings { before: number | null; worst: number | null; after: number | null; words: string }

/** One row for TradingJournal/scalping-journal.md (unknowns stay "?"). */
export function journalRow(
  day: string,
  n: number,
  trip: RoundTrip,
  ex: Excursion,
  opts: { charges: number | null; setup: string; stop: number | null; exitDriver: string; rulesKept: string; lesson: string; feelings: Feelings }
): string {
  const q = (v: unknown) => (v === null || v === undefined || v === '' ? '?' : String(v));
  const strikeLabel = trip.strike ? `${trip.strike} ${trip.optionType}` : trip.instrument;
  const pctMove = Math.round(((trip.exitPrice - trip.entryPrice) / trip.entryPrice) * 1000) / 10;
  const net = opts.charges === null ? `gross ${trip.gross >= 0 ? '+' : ''}₹${trip.gross.toFixed(2)} (net ?)` : `**${trip.gross - opts.charges >= 0 ? '+' : ''}₹${(trip.gross - opts.charges).toFixed(2)}** (gross ${trip.gross.toFixed(2)} − charges ${opts.charges.toFixed(2)})`;
  const f = opts.feelings;
  return [
    day, n, `${trip.entryTime}→${trip.exitTime}`, `${q(trip.view)} · ${strikeLabel} (${trip.product})`,
    `~${q(ex.spotIn && Math.round(ex.spotIn))}→~${q(ex.spotOut && Math.round(ex.spotOut))}`,
    `${trip.entryPrice}→${trip.exitPrice}`, trip.qty, net,
    `spot MFE ${q(ex.mfe)} / MAE ${q(ex.mae)} (prem ${pctMove >= 0 ? '+' : ''}${pctMove}%)`,
    q(opts.setup), q(f.before), q(f.worst), `${q(f.after)}${f.words ? ` ${f.words}` : ''}`,
    q(opts.exitDriver), `${opts.stop ? `stop ${opts.stop} · ` : 'stop ? · '}${q(opts.rulesKept)}`, q(opts.lesson)
  ].reduce<string>((row, cell) => `${row} ${cell} |`, '|');
}
