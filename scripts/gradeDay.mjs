#!/usr/bin/env node
/**
 * GRADE DAY — Measured track records & statistical scorecard for trading sessions.
 * Usage: node scripts/gradeDay.mjs [YYYY-MM-DD]   (defaults to today, IST)
 *
 * The logic lives in ops/scorecard.mjs so the ops agent and debrief share it.
 */

import { gradeDay } from '../ops/scorecard.mjs';
import { istDateStr } from '../ops/time.mjs';

const dateArg = process.argv[2] || istDateStr();

console.log(`\n============================================================`);
console.log(`📊 Session Scorecard & Strategy Grading: ${dateArg}`);
console.log(`============================================================\n`);

const { dir, card, paths } = gradeDay(dateArg);

console.log(`📁 Read journal from: ${dir}`);
console.log(`📦 Loaded: ${card.orders} orders, ${card.metrics.totalTrades} closed trades, ${card.gateAudits} gate logs`);
console.log(`✅ Scorecard written to:`);
console.log(`   - ${paths.json}`);
console.log(`   - ${paths.md}\n`);
console.log(JSON.stringify(card.metrics, null, 2));
if (card.caveat) console.log(`\n⚠️  ${card.caveat}`);
