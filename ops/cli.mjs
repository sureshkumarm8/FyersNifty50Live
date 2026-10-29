#!/usr/bin/env node
/**
 * Ask Nifty50Ops from the terminal.
 *
 *   node ops/cli.mjs "Is everything ready for today?"
 *   node ops/cli.mjs --level L1 "Run the pre-flight"
 *
 * Talks to the running server on :5001 for state; the tool calls and answer
 * are audited to TradingJournal/<IST date>/ops.jsonl like any chat turn.
 */

import { runAgent } from './agent.mjs';
import { parseLevel } from './config.mjs';
import { createRuntime } from './runtime.mjs';

const args = process.argv.slice(2);
let level;
const li = args.indexOf('--level');
if (li >= 0) {
  level = parseLevel(args[li + 1], 0);
  args.splice(li, 2);
}
const question = args.join(' ').trim();
if (!question) {
  console.error('Usage: node ops/cli.mjs [--level L0|L1] "your question"');
  process.exit(2);
}

const rt = createRuntime({ level });
let provider;
try {
  provider = rt.provider();
} catch (err) {
  console.error(`No model available: ${err.message}`);
  process.exit(1);
}
console.error(`[ops] ${provider.name} · L${rt.level}`);

const result = await runAgent({
  question,
  provider,
  guard: rt.guard,
  audit: rt.audit,
  ctx: rt.ctx,
  level: rt.level,
  limits: rt.limits,
  onEvent: e => {
    if (e.type === 'tool') console.error(`[ops] ${e.denied ? '✋ denied' : e.ok ? '✓' : '✗'} ${e.name}${e.reason ? ` — ${e.reason}` : ''}`);
  }
});

console.log(`\n${result.text}\n`);
if (result.flags.length) console.error(`[ops] flags: ${result.flags.join(', ')}`);
if (result.usage) console.error(`[ops] tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`);
