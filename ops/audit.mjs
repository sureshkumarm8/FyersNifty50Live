/**
 * OPS AUDIT TRAIL — every tool call, denial, result and answer, plus daemon
 * runs and notifications, appended to TradingJournal/<IST date>/ops.jsonl.
 *
 * The audit is what makes "the agent never did X" checkable: a red-team test
 * reads it back and asserts no forbidden tool ever executed.
 */

import { appendJournal, readJournal } from './journal.mjs';
import { istDateStr } from './time.mjs';

const MAX_FIELD = 4000;

/** Large tool results are summarised in the audit; the model saw the full value. */
function clip(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (text === undefined) return null;
  return text.length > MAX_FIELD ? `${text.slice(0, MAX_FIELD)}… [${text.length} chars]` : value;
}

export function createAudit({ write = appendJournal } = {}) {
  const rows = [];
  const log = (kind, data) => {
    const row = { kind, ...data };
    rows.push(row);
    try {
      write('ops', row);
    } catch (err) {
      console.warn('[Ops] audit write failed:', err.message);
    }
    return row;
  };
  return {
    rows,
    turn: (turnId, data) => log('turn', { turnId, ...data }),
    toolCall: (turnId, name, args) => log('tool_call', { turnId, tool: name, args: clip(args) }),
    toolDenied: (turnId, name, args, reason) => log('tool_denied', { turnId, tool: name, args: clip(args), reason }),
    toolResult: (turnId, name, ok, result) => log('tool_result', { turnId, tool: name, ok, result: clip(result) }),
    answer: (turnId, text, meta = {}) => log('answer', { turnId, text: clip(text), ...meta }),
    run: (job, data) => log('run', { job, ...data }),
    notify: (topic, title, message, sent) => log('notify', { topic, title, message, sent }),
    alert: alert => log('alert', alert)
  };
}

/**
 * Timeline for the Nifty50Ops tab: daemon runs, notifications, answers and
 * alerts (from ops.jsonl and alerts.jsonl), oldest first.
 */
export function listEvents({ date = istDateStr(), since = 0, limit = 200 } = {}) {
  const ops = readJournal('ops', { date, since, limit: 0 })
    .filter(r => ['run', 'notify', 'alert', 'answer', 'tool_denied'].includes(r.kind))
    .map(r => ({ source: 'ops', ...r }));
  const alerts = readJournal('alerts', { date, since, limit: 0 }).map(r => ({ source: 'alerts', kind: 'alert', ...r }));
  return [...ops, ...alerts]
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    .slice(-limit);
}
