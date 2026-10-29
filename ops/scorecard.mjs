/**
 * DAY SCORECARD — measured results for one session, from the journal alone.
 *
 * Extracted from scripts/gradeDay.mjs so the ops agent and the EOD debrief can
 * call it. It reports what happened; it does not tune anything.
 */

import { join } from 'node:path';
import { readJsonl, writeJournalFile } from './journal.mjs';
import { findJournalDir, istDateStr } from './time.mjs';

export function wilson(wins, n, z = 1.96) {
  if (n === 0) return [0, 1];
  const p = wins / n;
  const d = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (centre - spread) / d), Math.min(1, (centre + spread) / d)];
}

const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;

/**
 * Each exit row is one closed trade. Exits written since the journal was wired
 * carry their own entryPrice/exitPrice/pnl; older shapes fall back to the
 * nearest earlier fill on the same symbol.
 */
export function tradesFrom({ fills = [], exits = [] }) {
  return exits.map(exit => {
    const fill = fills
      .filter(f => f.symbol === exit.symbol && (f.timestamp ?? 0) <= (exit.timestamp ?? 0) && (f.side ?? 'BUY') === 'BUY')
      .slice(-1)[0];
    const entryPrice = exit.entryPrice ?? fill?.avgPrice ?? fill?.price ?? 0;
    const exitPrice = exit.exitPrice ?? exit.avgPrice ?? exit.price ?? 0;
    const quantity = exit.quantity ?? fill?.quantity ?? 0;
    const pnl = Number.isFinite(exit.pnl) ? exit.pnl : (exitPrice - entryPrice) * quantity;
    return {
      at: exit.timestamp ?? null,
      book: exit.book ?? fill?.book ?? 'unknown',
      strategy: exit.strategy ?? fill?.strategy ?? 'UNKNOWN',
      symbol: exit.symbol,
      quantity,
      entryPrice,
      exitPrice,
      pnl: r2(pnl),
      points: r2(exitPrice - entryPrice),
      reason: exit.reason ?? null,
      synthetic: Boolean(exit.synthetic || fill?.synthetic),
      priceSource: exit.priceSource ?? 'fill',
      configVersion: exit.configVersion || fill?.configVersion || null
    };
  });
}

/** Pure scorecard over already-loaded journal rows. */
export function scoreDay(date, rows) {
  const trades = tradesFrom(rows);
  const real = trades.filter(t => !t.synthetic);
  const wins = real.filter(t => t.pnl > 0).length;
  const losses = real.filter(t => t.pnl < 0).length;
  const winRate = real.length ? wins / real.length : 0;
  const [lo, hi] = wilson(wins, real.length);
  const grossProfit = real.filter(t => t.pnl > 0).reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(real.filter(t => t.pnl < 0).reduce((a, t) => a + t.pnl, 0));
  const versions = [...new Set(trades.map(t => t.configVersion).filter(Boolean))];

  const byStrategy = {};
  for (const t of real) {
    const s = (byStrategy[t.strategy] ||= { trades: 0, wins: 0, netPnl: 0 });
    s.trades += 1;
    if (t.pnl > 0) s.wins += 1;
    s.netPnl = r2(s.netPnl + t.pnl);
  }

  return {
    date,
    configVersion: versions.join(',') || null,
    metrics: {
      totalTrades: trades.length,
      evaluatedTrades: real.length,
      syntheticExcluded: trades.length - real.length,
      wins,
      losses,
      winRate: r1(winRate * 100),
      wilsonInterval95: [r1(lo * 100), r1(hi * 100)],
      profitFactor: r2(grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0),
      netPnl: r2(real.reduce((a, t) => a + t.pnl, 0))
    },
    byStrategy,
    baselines: {
      alwaysNeutralAccuracy: 0,
      majorityClass: winRate >= 0.5 ? 'WIN' : 'LOSS',
      majorityBaselineHitRate: r1((winRate >= 0.5 ? winRate : 1 - winRate) * 100)
    },
    premarketStatus: (rows.premarket || []).length > 0 ? 'AVAILABLE' : 'NO_DATA',
    gateAudits: (rows.gates || []).length,
    orders: (rows.orders || []).length,
    trades,
    caveat: real.length > 0 && real.length < 30
      ? `Only ${real.length} trade(s): far too few to say anything about edge.`
      : null
  };
}

export function loadDayRows(date) {
  const dir = findJournalDir(date);
  const read = name => readJsonl(join(dir, `${name}.jsonl`));
  return {
    dir,
    rows: {
      orders: read('orders'),
      fills: read('fills'),
      exits: read('exits'),
      gates: read('gates'),
      premarket: read('premarket')
    }
  };
}

export function scorecardMarkdown(card) {
  const m = card.metrics;
  const strategies = Object.entries(card.byStrategy)
    .map(([k, v]) => `- ${k}: ${v.trades} trade(s), ${v.wins} win(s), net ₹${v.netPnl}`)
    .join('\n');
  return `# Trading Session Scorecard: ${card.date}

- **Config Version:** \`${card.configVersion ?? 'unknown'}\`
- **Total Trades:** ${m.totalTrades} (${m.evaluatedTrades} real, ${m.syntheticExcluded} synthetic)
- **Win / Loss:** ${m.wins}W / ${m.losses}L
- **Win Rate:** ${m.winRate}% (Wilson 95% Bound: [${m.wilsonInterval95[0]}%, ${m.wilsonInterval95[1]}%])
- **Profit Factor:** ${m.profitFactor}
- **Net P&L:** ₹${m.netPnl}
${card.caveat ? `\n> ${card.caveat}\n` : ''}
### By strategy
${strategies || '- none'}

### Baselines Comparison
- Always-Majority Accuracy: ${card.baselines.majorityBaselineHitRate}% (${card.baselines.majorityClass})
`;
}

/** Load, score and (optionally) write scorecard.json / scorecard.md. */
export function gradeDay(date = istDateStr(), { write = true } = {}) {
  const { dir, rows } = loadDayRows(date);
  const card = scoreDay(date, rows);
  let paths = null;
  if (write) {
    paths = {
      json: writeJournalFile('scorecard.json', JSON.stringify(card, null, 2), date),
      md: writeJournalFile('scorecard.md', scorecardMarkdown(card), date)
    };
  }
  return { dir, card, paths };
}
