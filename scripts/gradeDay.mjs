#!/usr/bin/env node
/**
 * GRADE DAY — Measured track records & statistical scorecard for trading sessions.
 * Usage: node scripts/gradeDay.mjs [YYYY-MM-DD]
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const dateArg = process.argv[2] || new Date().toISOString().split('T')[0];

console.log(`\n============================================================`);
console.log(`📊 Session Scorecard & Strategy Grading: ${dateArg}`);
console.log(`============================================================\n`);

function wilson(wins, n, z = 1.96) {
  if (n === 0) return [0, 1];
  const p = wins / n;
  const d = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (centre - spread) / d), Math.min(1, (centre + spread) / d)];
}

// Locate journal directory
const primaryDir = path.join(os.homedir(), 'TradingJournal', dateArg);
const fallbackDir = path.join(process.cwd(), 'TradingJournal', dateArg);
const journalDir = fs.existsSync(primaryDir) ? primaryDir : fallbackDir;

console.log(`📁 Reading journal from: ${journalDir}`);

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  const records = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line));
    } catch {}
  }
  return records;
}

const orders = readJsonl(path.join(journalDir, 'orders.jsonl'));
const fills = readJsonl(path.join(journalDir, 'fills.jsonl'));
const exits = readJsonl(path.join(journalDir, 'exits.jsonl'));
const gates = readJsonl(path.join(journalDir, 'gates.jsonl'));
const premarket = readJsonl(path.join(journalDir, 'premarket.jsonl'));

console.log(`📦 Loaded: ${orders.length} orders, ${fills.length} fills, ${exits.length} exits, ${gates.length} gate logs`);

// Match trades from fills & exits
const trades = [];
for (const exit of exits) {
  const fill = fills.find(f => f.symbol === exit.symbol && f.timestamp <= exit.timestamp);
  const entryPrice = fill?.avgPrice || fill?.price || exit.entryPrice || 0;
  const exitPrice = exit.avgPrice || exit.price || exit.exitPrice || 0;
  const pnl = (exitPrice - entryPrice) * (exit.quantity || 65);
  trades.push({
    symbol: exit.symbol,
    side: exit.side || 'BUY',
    entryPrice,
    exitPrice,
    pnl,
    points: exitPrice - entryPrice,
    synthetic: exit.synthetic || fill?.synthetic || false,
    configVersion: exit.configVersion || fill?.configVersion || 'v1-bd5a65d2'
  });
}

// Compute metrics
const totalTrades = trades.length;
const nonSynthetic = trades.filter(t => !t.synthetic);
const wins = nonSynthetic.filter(t => t.pnl > 0).length;
const losses = nonSynthetic.filter(t => t.pnl < 0).length;
const winRate = nonSynthetic.length > 0 ? wins / nonSynthetic.length : 0;
const [wilsonLo, wilsonHi] = wilson(wins, nonSynthetic.length);

const grossProfits = nonSynthetic.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
const grossLosses = Math.abs(nonSynthetic.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 99.0 : 0.0;
const netPnl = nonSynthetic.reduce((acc, t) => acc + t.pnl, 0);

// Baseline comparison vs always-neutral and always-majority
const majorityClass = winRate >= 0.5 ? 'WIN' : 'LOSS';
const majorityHitRate = winRate >= 0.5 ? winRate : 1 - winRate;

const scorecard = {
  date: dateArg,
  configVersion: 'v1-bd5a65d2',
  metrics: {
    totalTrades,
    evaluatedTrades: nonSynthetic.length,
    syntheticExcluded: totalTrades - nonSynthetic.length,
    wins,
    losses,
    winRate: Math.round(winRate * 1000) / 10,
    wilsonInterval95: [Math.round(wilsonLo * 1000) / 10, Math.round(wilsonHi * 1000) / 10],
    profitFactor: Math.round(profitFactor * 100) / 100,
    netPnl: Math.round(netPnl * 100) / 100
  },
  baselines: {
    alwaysNeutralAccuracy: 0.0,
    majorityClass,
    majorityBaselineHitRate: Math.round(majorityHitRate * 1000) / 10
  },
  premarketStatus: premarket.length > 0 ? 'AVAILABLE' : 'NO_DATA',
  gateAudits: gates.length,
  trades
};

// Write output scorecard
fs.mkdirSync(journalDir, { recursive: true });
const scorecardJsonPath = path.join(journalDir, 'scorecard.json');
const scorecardMdPath = path.join(journalDir, 'scorecard.md');

fs.writeFileSync(scorecardJsonPath, JSON.stringify(scorecard, null, 2));

const mdContent = `# Trading Session Scorecard: ${dateArg}

- **Config Version:** \`${scorecard.configVersion}\`
- **Total Trades:** ${scorecard.metrics.totalTrades} (${scorecard.metrics.evaluatedTrades} real, ${scorecard.metrics.syntheticExcluded} synthetic)
- **Win / Loss:** ${scorecard.metrics.wins}W / ${scorecard.metrics.losses}L
- **Win Rate:** ${scorecard.metrics.winRate}% (Wilson 95% Bound: [${scorecard.metrics.wilsonInterval95[0]}%, ${scorecard.metrics.wilsonInterval95[1]}%])
- **Profit Factor:** ${scorecard.metrics.profitFactor}
- **Net P&L:** ₹${scorecard.metrics.netPnl}

### Baselines Comparison
- Always-Majority Accuracy: ${scorecard.baselines.majorityBaselineHitRate}% (${scorecard.baselines.majorityClass})
`;

fs.writeFileSync(scorecardMdPath, mdContent);

console.log(`✅ Scorecard written to:`);
console.log(`   - ${scorecardJsonPath}`);
console.log(`   - ${scorecardMdPath}\n`);
console.log(JSON.stringify(scorecard.metrics, null, 2));
