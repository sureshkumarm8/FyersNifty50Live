/**
 * MANUAL TRADE RECORD — the trader's own trades, for the Manual tab's
 * "Am I on track?" panel.
 *
 * Sources, merged and de-duplicated by date + entry time:
 *   1. TradingJournal/scalping-journal.md (the hand-kept table, the record so far)
 *   2. ~/TradingJournal/<date>/manual.jsonl  `event: "TRADE"` rows (Manual tab → save)
 *
 * Parsing is deliberately literal: a value that is not in the row is null, never guessed.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { journalRoots, PROJECT_ROOT } from './time.mjs';
import { readJsonl } from './journal.mjs';

const num = s => Number(String(s).replace(/,/g, ''));

/** One table row → trade, or null when it is not a trade row. */
export function parseJournalRow(line) {
  const cells = line.split('|').slice(1, -1).map(c => c.trim());
  if (cells.length < 15 || !/^\d{4}-\d{2}-\d{2}$/.test(cells[0])) return null;
  const [date, , times, sideStrike, spots, prem, qty, netCell, , setup, before, worst, after, exitCell, rules, lesson] = cells;
  const side = /\bSHORT\b/.test(sideStrike) ? 'SHORT' : /\bLONG\b/.test(sideStrike) ? 'LONG' : null;
  const [entryTime, exitTime] = times.split('→').map(t => t.trim());
  const spot = spots.match(/(\d{4,6}(?:\.\d+)?)/g)?.map(Number) ?? [];
  const spotPts = side && spot.length >= 2 ? Math.round((side === 'LONG' ? spot[1] - spot[0] : spot[0] - spot[1]) * 10) / 10 : null;
  const p = prem.match(/(\d+(?:\.\d+)?)\s*→\s*(\d+(?:\.\d+)?)/);
  const netKnown = !/net \?/.test(netCell);
  const money = netCell.match(/([+−-])₹([\d,]+(?:\.\d+)?)/);
  const amount = money ? (money[1] === '+' ? 1 : -1) * num(money[2]) : null;
  const kept = (rules.match(/✅/g) || []).length || (/^yes\b/i.test(rules) ? 1 : 0);
  const broken = (rules.match(/❌/g) || []).length;
  // "1/day ✅ · stop ❌ none · target ❌ · product ❌" -> ['stop', 'target', 'product']
  const brokenRules = [...rules.matchAll(/([A-Za-z][\w/ -]*?)\s*❌/g)].map(m => m[1].trim().split(' ').pop());
  const feel = s => { const m = /^(\d)/.exec(s || ''); return m ? Number(m[1]) : null; };
  return {
    source: 'journal.md',
    date,
    entryTime: entryTime || null,
    exitTime: exitTime || null,
    side,
    strike: (sideStrike.match(/(\d{4,6})\s*(CE|PE)/) || [])[0] ?? null,
    qty: Number(qty) || null,
    premIn: p ? Number(p[1]) : null,
    premOut: p ? Number(p[2]) : null,
    net: netKnown ? amount : null,
    gross: netKnown ? null : amount,
    spotPts,
    setup: setup || null,
    exitDriver: (exitCell.match(/^(PLAN|GREED|FEAR|TIME)/) || [])[1] ?? null,
    rulesKept: kept,
    rulesBroken: broken,
    brokenRules,
    feelings: { before: feel(before), worst: feel(worst), after: feel(after) },
    lesson: lesson && lesson !== '?' ? lesson : null
  };
}

export function parseScalpingJournal(md) {
  return String(md || '').split('\n').map(parseJournalRow).filter(Boolean);
}

/** Manual tab saves (manual.jsonl TRADE rows) for every journal day on disk. */
export function readManualTradeRows(roots = journalRoots()) {
  const out = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const day of readdirSync(root).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))) {
      const f = join(root, day, 'manual.jsonl');
      for (const r of readJsonl(f)) {
        if (r.event !== 'TRADE') continue;
        out.push({
          source: 'manual.jsonl', date: day, entryTime: r.entryTime ?? null, exitTime: r.exitTime ?? null, side: r.view ?? null,
          strike: r.strike ? `${r.strike} ${r.optionType ?? ''}`.trim() : null, qty: r.qty ?? null, premIn: r.entryPrice ?? null, premOut: r.exitPrice ?? null,
          net: Number.isFinite(r.charges) ? Math.round((r.gross - r.charges) * 100) / 100 : null,
          gross: Number.isFinite(r.charges) ? null : r.gross ?? null,
          spotPts: r.excursion?.spotIn && r.excursion?.spotOut && r.view ? Math.round((r.view === 'LONG' ? r.excursion.spotOut - r.excursion.spotIn : r.excursion.spotIn - r.excursion.spotOut) * 10) / 10 : null,
          setup: null, exitDriver: null, rulesKept: 0, rulesBroken: 0, brokenRules: [],
          feelings: r.feelings ?? { before: null, worst: null, after: null }, lesson: null
        });
      }
    }
  }
  return out;
}

/** Both sources, newest first; the hand-kept journal wins on a duplicate. */
export function manualRecord({ journalFile = join(PROJECT_ROOT, 'TradingJournal', 'scalping-journal.md'), roots } = {}) {
  const fromMd = existsSync(journalFile) ? parseScalpingJournal(readFileSync(journalFile, 'utf8')) : [];
  const key = t => `${t.date} ${String(t.entryTime || '').slice(0, 5)}`;
  const seen = new Set(fromMd.map(key));
  const fromTab = readManualTradeRows(roots).filter(t => !seen.has(key(t)));
  return [...fromMd, ...fromTab].sort((a, b) => key(b).localeCompare(key(a)));
}
