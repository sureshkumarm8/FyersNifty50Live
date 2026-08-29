import fs from 'fs'; import path from 'path';
export const CSV_DIR = process.env.CSV_DIR || '/Users/SureshKumar.M/Downloads/nifty_sentiment_momentum_csvFiles';

const parseCsv = (t) => {
  const L = t.split(/\r?\n/).filter(x => x.trim());
  const h = L[0].split(',').map(s => s.trim());
  return L.slice(1).map(l => {
    const c = l.match(/("([^"]*)")|([^,]+)/g) || [];
    const o = {}; h.forEach((k, i) => o[k] = (c[i] || '').replace(/^"|"$/g, '')); return o;
  });
};

/**
 * Load every export, de-duplicate re-downloads of the same session (keeping the
 * longest copy), clean the known corruptions and return sessions in
 * chronological order with rows oldest-first.
 *
 * Corruptions handled, all verified present in the exports:
 *  - niftyLTP == 0 placeholder rows at session start
 *  - pcr == 0 gaps (~10% of rows) -> forward filled
 *  - the momentum / cumulativeMomentum columns are derived from the raw feed and
 *    inherit the zero-LTP rows (values up to 24107), so they are recomputed
 *  - change/changePercent/callOI/putOI/vix/bullishStocks/bearishStocks/
 *    advanceDecline are identically zero in every row of every file
 */
export function loadSessions() {
  const files = fs.readdirSync(CSV_DIR).filter(f => f.endsWith('.csv'));
  const by = new Map();
  for (const f of files) {
    const m = f.match(/(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})/);
    if (!m) continue;
    const rows = parseCsv(fs.readFileSync(path.join(CSV_DIR, f), 'utf8'));
    const prev = by.get(m[2]);
    if (!prev || rows.length > prev.length) by.set(m[2], rows);
  }

  const out = [];
  for (const [date, raw] of [...by.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
    const rows = raw
      .map(r => ({ t: new Date(r.timestamp).getTime(), time: r.time, ltp: +r.niftyLTP, sent: +r.sentiment, pcr: +r.pcr }))
      .filter(r => Number.isFinite(r.t) && r.ltp > 1000 && Number.isFinite(r.sent))
      .sort((a, b) => a.t - b.t);
    if (rows.length < 60) continue;

    let lastPcr = NaN;
    for (const r of rows) {
      if (!(r.pcr > 0.2 && r.pcr < 3)) r.pcr = lastPcr; else lastPcr = r.pcr;
    }
    const firstGood = rows.find(r => Number.isFinite(r.pcr));
    for (const r of rows) if (!Number.isFinite(r.pcr)) r.pcr = firstGood ? firstGood.pcr : 1;

    // Minutes since 09:15 open, from the wall-clock column (timestamps are UTC).
    for (const r of rows) {
      const [hh, mm] = r.time.split(':').map(Number);
      r.mod = hh * 60 + mm - 555;
    }
    out.push({ date, rows });
  }
  return out;
}

export const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
export const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
