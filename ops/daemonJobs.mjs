/**
 * DAEMON JOBS — the daily routine, one function per job.
 *
 * Deterministic code decides everything. The model is used only to word the
 * 09:05 readiness note and the debrief narrative, with a deterministic
 * fallback if it is slow or unavailable. Watchdog alerts are never routed
 * through the model: a critical alert must not wait on an API call.
 *
 * Every job goes through the same guard and audit as chat (at L1), so the
 * daemon has no capability the chat tab does not.
 */

import { execFile } from 'node:child_process';
import { appendJournal, readJournal } from './journal.mjs';
import { countBrokerOpen, emptyWatchdogMemory, evaluateWatchdog } from './watchdog.mjs';
import { gradeDay } from './scorecard.mjs';
import { buildDebriefData } from './debrief.mjs';
import { TOOL_BY_NAME } from './tools.mjs';
import { hhmm, istDateStr, istTimeStr } from './time.mjs';

export const SCHEDULE = Object.freeze({
  preflight: hhmm(8, 35),
  charts: hhmm(8, 50),
  verify: hhmm(9, 5),
  watchStart: hhmm(9, 15),
  watchEnd: hhmm(15, 30),
  debrief: hhmm(15, 35),
  exit: hhmm(15, 45)
});

/** Jobs already completed today, so a restarted daemon does not repeat them. */
export function completedJobs(date = istDateStr()) {
  return new Set(readJournal('ops', { date, limit: 0 }).filter(r => r.kind === 'run' && r.status === 'done').map(r => r.job));
}

/** Run a tool exactly as chat would: guard check, audit, result. */
export async function runTool(rt, name, args = {}) {
  const tool = TOOL_BY_NAME.get(name);
  const verdict = rt.guard.check(tool, args);
  if (!verdict.ok) {
    rt.audit.toolDenied('daemon', name, args, verdict.reason);
    return { error: `denied: ${verdict.reason}` };
  }
  rt.audit.toolCall('daemon', name, args);
  try {
    const result = await tool.run(args, { ...rt.ctx, audit: rt.audit });
    rt.audit.toolResult('daemon', name, !result?.error, result);
    return result;
  } catch (err) {
    rt.audit.toolResult('daemon', name, false, { error: err.message });
    return { error: err.message };
  }
}

/** Notifications go through the guarded `notify` tool (rate limit + audit). */
export async function notify(rt, topic, title, message) {
  if (rt.dryRun) {
    console.log(`[ops-daemon] (dry run) ${title} — ${message}`);
    return;
  }
  rt.guard.startTurn();
  await runTool(rt, 'notify', { topic, title, message });
}

/** Ask the model to word some facts; fall back to `fallback` on any problem. */
export async function wordWithModel(rt, instruction, facts, fallback, timeoutMs = rt.config?.local ? 120_000 : 20_000) {
  if (!rt.useModel) return fallback;
  try {
    const provider = rt.provider();
    const reply = await Promise.race([
      provider.chat({
        system: 'You word operational notes for a trading app. Use only the facts given. No predictions, probabilities, advice or parameter suggestions. Plain text.',
        messages: [{ role: 'user', content: `${instruction}\n\nFacts (JSON):\n${JSON.stringify(facts)}` }],
        tools: []
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ]);
    const text = String(reply.text || '').trim();
    return text || fallback;
  } catch (err) {
    console.warn(`[ops-daemon] model wording skipped: ${err.message}`);
    return fallback;
  }
}

// --- jobs -------------------------------------------------------------------

export async function jobPreflight(rt, { startServer } = {}) {
  rt.guard.startTurn();
  let report = await runTool(rt, 'run_preflight');
  const serverDown = report.checks?.some(c => c.id === 'server' && !c.ok);
  if (serverDown && startServer) {
    await startServer();
    await new Promise(r => setTimeout(r, 6000));
    rt.guard.startTurn();
    report = await runTool(rt, 'run_preflight');
  }
  const failed = (report.checks || []).filter(c => !c.ok);
  const summary = failed.length
    ? failed.map(c => `${c.critical ? '❌' : '⚠️'} ${c.label}: ${c.detail}`).join('\n')
    : 'All checks passed.';
  await notify(rt, 'preflight', report.ok ? 'Pre-flight passed' : 'Pre-flight FAILED', summary);
  return { ok: Boolean(report.ok), failed: failed.map(c => c.id) };
}

export async function jobCharts(rt) {
  rt.guard.startTurn();
  const r = await runTool(rt, 'pull_premarket_charts');
  const text = r.error
    ? `Chart pull failed: ${r.error}`
    : `${r.accepted} chart(s) accepted${r.rejected?.length ? `; rejected: ${r.rejected.map(x => `${x.file} (${x.why})`).join('; ')}` : ''}. Open PreMkt to build the plan.`;
  await notify(rt, 'charts', r.ok ? 'Charts pulled' : 'Chart pull problem', text);
  return { ok: Boolean(r.ok), accepted: r.accepted ?? 0 };
}

/** Pure: the 09:05 readiness verdict from the app state and today's journal. */
export function readiness({ state, today, chartsToday }) {
  const snap = state?.snapshot;
  const reasons = [];
  if (!snap || state.stale) reasons.push(snap ? `app tab silent for ${state.ageSec}s` : 'no app tab has reported');
  if (snap) {
    if (snap.premarket?.decisionDate !== today) reasons.push(`no pre-market plan dated ${today}${snap.premarket?.decisionDate ? ` (latest is ${snap.premarket.decisionDate})` : ''}`);
    if (snap.engines?.sniper?.playbookDate !== today) reasons.push('Sniper has not loaded a playbook for today');
    if (snap.engines?.autotrade?.killed) reasons.push('kill switch is latched');
  }
  if (!chartsToday.some(c => c.ok)) reasons.push('no accepted chart pull today');
  return { ready: reasons.length === 0, reasons, mode: snap?.engines?.autotrade?.mode ?? null };
}

export async function jobVerify(rt) {
  const today = istDateStr(rt.ctx.now());
  const state = (await rt.ctx.client.get('/api/ops/state')).json;
  const verdict = readiness({ state, today, chartsToday: readJournal('charts', { date: today, limit: 0 }) });
  const fallback = verdict.ready
    ? `Ready for the open (${verdict.mode ?? 'mode unknown'}).`
    : `NOT ready: ${verdict.reasons.join('; ')}.`;
  const text = await wordWithModel(rt, 'Write one short notification (max 2 sentences) saying whether the app is ready for the 09:15 open and why.', verdict, fallback);
  await notify(rt, 'verify', verdict.ready ? 'Ready for open' : 'NOT ready for open', text);
  return verdict;
}

/** Last sleep/wake lines from the power log, to attach to an "app silent" alert. */
export function lastSleepWake() {
  if (process.platform !== 'darwin') return Promise.resolve(null);
  return new Promise(resolve => {
    execFile('pmset', ['-g', 'log'], { maxBuffer: 64 * 1024 * 1024, timeout: 10_000 }, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      // Rows look like "2026-10-28 22:36:07 +0530 Sleep  Entering Sleep state due to …".
      const lines = stdout.split('\n').filter(l => /^\S+ \S+ [+-]\d{4}\s+(Sleep|Wake|DarkWake)\s+(?!Requests)/.test(l));
      resolve(lines.slice(-2).map(l => l.trim().replace(/\s+/g, ' ').slice(0, 120)).join(' | ') || null);
    });
  });
}

export function createWatchdog(rt) {
  let memory = emptyWatchdogMemory();
  return async function tick() {
    const state = (await rt.ctx.client.get('/api/ops/state')).json ?? { snapshot: null, ageSec: null };
    let brokerOpenCount = null;
    const snap = state.snapshot;
    if (snap?.engines?.autotrade?.mode === 'LIVE') {
      const broker = snap.engines.autotrade.broker === 'paytm' ? 'paytm' : 'fyers';
      const r = await rt.ctx.client.get(`/api/${broker}/positions`);
      brokerOpenCount = r.ok ? countBrokerOpen(r.json) : null;
    }
    const out = evaluateWatchdog({ now: rt.ctx.now(), state, brokerOpenCount }, memory);
    memory = out.memory;
    for (const alert of out.alerts) {
      let message = alert.message;
      if (alert.rule === 'app_silent') {
        const power = await lastSleepWake();
        if (power) message += ` Last power events: ${power}`;
      }
      appendJournal('alerts', { rule: alert.rule, severity: alert.severity, message, source: 'watchdog' });
      await notify(rt, `watchdog:${alert.rule}`, alert.severity === 'critical' ? '🚨 Watchdog' : '⚠️ Watchdog', message);
    }
    return out.alerts;
  };
}

export async function jobDebrief(rt) {
  const today = istDateStr(rt.ctx.now());
  const { card } = gradeDay(today, { write: true });
  const data = buildDebriefData(today);
  const facts = {
    trades: card.metrics, plan: data.plan, sniper: data.sniper, momentum: data.momentum,
    pilot: data.pilot, alerts: data.alerts.length, gaps: data.gaps
  };
  const narrative = await wordWithModel(
    rt,
    'Write a short narrative (max 6 sentences) of the trading day: what happened, what was skipped and why, any data gaps. No lessons, no parameter changes, no predictions.',
    facts,
    null
  );
  rt.guard.startTurn();
  const r = await runTool(rt, 'write_debrief', narrative ? { narrative } : {});
  await notify(rt, 'debrief', 'Debrief written',
    `${card.metrics.totalTrades} trade(s), net ₹${card.metrics.netPnl}; ${data.gaps.length} data gap(s), ${data.alerts.length} alert(s). ${r.path ?? ''}`);
  return { path: r.path ?? null, trades: card.metrics.totalTrades };
}

export const JOB_LABEL = { preflight: 'Pre-flight', charts: 'Charts', verify: 'Verify', debrief: 'Debrief' };

/** Wraps a job with run audit rows (started/done/failed) and timing. */
export async function runJob(rt, job, fn) {
  const started = Date.now();
  rt.audit.run(job, { status: 'started', at: istTimeStr(started) });
  try {
    const result = await fn();
    rt.audit.run(job, { status: 'done', ms: Date.now() - started, result });
    return result;
  } catch (err) {
    rt.audit.run(job, { status: 'failed', ms: Date.now() - started, error: err.message });
    console.error(`[ops-daemon] ${job} failed:`, err);
    return null;
  }
}
