/**
 * THE AGENT LOOP — model ↔ tools, bounded.
 *
 *   question → policy.classifyIntent ─┬─ forbidden intent → fixed reply (+ engine state), no model call
 *                                     └─ else → up to 8 model steps, 60 s (240 s for local CLIs), token budget
 *   each tool call → guard.check → run → audit
 *   final text → policy.postCheck → audit → caller
 *
 * The answer is released only after the post-check, so tool progress streams
 * live but answer text does not: a prediction the model drafted is never shown.
 */

import crypto from 'node:crypto';
import { classifyIntent, hasPrediction, postCheck, REFUSALS } from './policy.mjs';
import { systemPrompt } from './prompt.mjs';
import { TOOL_BY_NAME, toolsForLevel } from './tools.mjs';
import { istTimeStr } from './time.mjs';
import { summariseResult, toolLabel } from './progress.mjs';

export const LIMITS = Object.freeze({ maxSteps: 8, wallMs: 60_000, tokenBudget: 80_000, maxToolResultChars: 12_000 });

function truncateResult(result, max) {
  const text = JSON.stringify(result ?? null);
  return text.length > max ? JSON.stringify({ truncated: true, chars: text.length, head: text.slice(0, max) }) : text;
}

/** One line per engine, for refusals that point at what the engines are doing. */
export function summariseState(r) {
  if (!r || r.error) return `- App state unavailable${r?.error ? `: ${r.error}` : ''}.`;
  const s = r.snapshot;
  if (!s) return '- No app tab has reported state yet.';
  const e = s.engines || {};
  return [
    `- As of ${r.asOf ?? 'unknown'}${r.stale ? ` — STALE (${r.ageSec}s old, the tab may be closed or asleep)` : ''}`,
    `- AutoTrade: ${e.autotrade?.mode ?? '?'}${e.autotrade?.killed ? ', KILL LATCHED' : ''}${e.autotrade?.armed ? ', armed' : ', not armed'}`,
    `- Sniper: ${e.sniper?.state ?? '?'}${e.sniper?.lastDecision ? ` — ${e.sniper.lastDecision}` : ''}`,
    `- Momentum: ${e.momentum?.state ?? '?'}${e.momentum?.lastGate ? ` — ${e.momentum.lastGate}` : ''}`,
    `- Opening Pilot: ${e.pilot?.phase ?? '?'}${e.pilot?.readiness ? ` (${e.pilot.readiness})` : ''}`,
    `- Open positions: ${(s.positions || []).length}`
  ].join('\n');
}

export async function runAgent({
  question,
  history = [],
  provider,
  guard,
  audit,
  ctx,
  level = guard?.level ?? 0,
  registry = TOOL_BY_NAME,
  onEvent = /** @type {(event: any) => void} */ (() => {}),
  limits = LIMITS,
  confirmToken = undefined,
  /** Aborts the turn, e.g. when the chat tab stops waiting. */
  signal = undefined
}) {
  const turnId = crypto.randomBytes(6).toString('hex');
  const now = ctx.now ?? (() => Date.now());
  const started = now();
  const executed = [];
  guard.startTurn();
  audit.turn(turnId, { question: String(question).slice(0, 2000), provider: provider?.name ?? null, level });

  const callTool = async (name, args) => {
    const tool = registry.get(name);
    const verdict = guard.check(tool, args, { confirmToken });
    if (!verdict.ok) {
      audit.toolDenied(turnId, name, args, verdict.reason);
      onEvent({ type: 'tool', name, args, ok: false, denied: true, reason: verdict.reason, label: toolLabel(name, args), summary: `blocked: ${verdict.reason}` });
      return { error: `denied: ${verdict.reason}` };
    }
    audit.toolCall(turnId, name, args);
    onEvent({ type: 'tool_start', name, args, label: toolLabel(name, args) });
    const toolStarted = now();
    let result;
    let ok = true;
    try {
      result = await tool.run(args || {}, { ...ctx, audit });
      if (result && result.error) ok = false;
    } catch (err) {
      ok = false;
      result = { error: err.message };
    }
    executed.push({ name, args, ok });
    audit.toolResult(turnId, name, ok, result);
    onEvent({ type: 'tool', name, args, ok, label: toolLabel(name, args), summary: summariseResult(name, result), ms: now() - toolStarted });
    return result;
  };

  const finish = (text, meta = {}) => {
    if (!meta.skipPostCheck) onEvent({ type: 'stage', label: 'Checking the answer against the data it fetched' });
    const checked = meta.skipPostCheck ? { text, flags: [] } : postCheck(text, { toolCalls: executed.filter(e => e.ok).length });
    const flags = [...(meta.flags || []), ...checked.flags];
    audit.answer(turnId, checked.text, { flags, intent: meta.intent ?? null, steps: meta.steps ?? 0, ms: now() - started, usage: meta.usage ?? null });
    onEvent({ type: 'answer', text: checked.text, flags });
    return { turnId, text: checked.text, flags, toolCalls: executed, usage: meta.usage ?? null };
  };

  // 1. Forbidden intents never reach the model.
  const intent = classifyIntent(question);
  if (intent) {
    onEvent({ type: 'stage', label: 'This asks for something Nifty50Ops never does — answering from its rules, without the model' });
    let text = REFUSALS[intent];
    if (intent === 'order' || intent === 'param_change') {
      text += `\n\n${summariseState(await callTool('get_app_state', {}))}`;
    }
    return finish(text, { intent, flags: ['refused'], skipPostCheck: true });
  }

  // 2. Model loop.
  const tools = toolsForLevel(level);
  const system = systemPrompt({ level, now: now(), toolNames: tools.map(t => t.name) });
  const messages = [
    ...history.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content).slice(-6).map(m => ({ role: m.role, content: String(m.content) })),
    { role: 'user', content: String(question) }
  ];
  const usage = { inputTokens: 0, outputTokens: 0 };
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), limits.wallMs);
  const onCancel = () => abort.abort();
  signal?.addEventListener('abort', onCancel, { once: true });
  let step = 0;
  try {
    for (; step < limits.maxSteps; step++) {
      if (now() - started > limits.wallMs) return finish(`I ran out of time (${Math.round(limits.wallMs / 1000)} s) before finishing. Partial results are in the tool list above.`, { flags: ['timeout'], steps: step, usage });
      if (signal?.aborted) return finish('Stopped before an answer.', { flags: ['cancelled'], steps: step, usage, skipPostCheck: true });
      if (usage.inputTokens + usage.outputTokens > limits.tokenBudget) return finish('I hit the token budget for one question before finishing.', { flags: ['budget'], steps: step, usage });

      const via = provider?.name ?? 'the model';
      onEvent({
        type: 'thinking',
        step,
        provider: via,
        label: step === 0 ? `Asking ${via} what to look up` : `${via} is reading ${executed.length} result${executed.length === 1 ? '' : 's'}`
      });
      const reply = await provider.chat({ system, messages, tools, signal: abort.signal });
      usage.inputTokens += reply.usage?.inputTokens ?? 0;
      usage.outputTokens += reply.usage?.outputTokens ?? 0;

      if (!reply.toolCalls?.length) return finish(reply.text, { steps: step + 1, usage });

      // The model's own note alongside its tool calls, if it wrote one.
      onEvent({
        type: 'plan',
        step,
        tools: reply.toolCalls.map(c => toolLabel(c.name, c.args)),
        // Interim notes get the same prediction screen as the final answer.
        ...(reply.text && !hasPrediction(reply.text) ? { note: String(reply.text).slice(0, 300) } : {})
      });
      messages.push({ role: 'assistant', content: reply.text || '', toolCalls: reply.toolCalls, raw: reply.raw });
      for (const call of reply.toolCalls) {
        const result = await callTool(call.name, call.args);
        messages.push({ role: 'tool', toolCallId: call.id, name: call.name, content: truncateResult(result, limits.maxToolResultChars) });
      }
    }
    return finish(`I stopped after ${limits.maxSteps} steps without a final answer.`, { flags: ['step_limit'], steps: step, usage });
  } catch (err) {
    const msg = signal?.aborted
      ? 'Stopped before an answer.'
      : abort.signal.aborted ? `The model did not answer within ${Math.round(limits.wallMs / 1000)} s.` : `The model call failed: ${err.message}`;
    return finish(`${msg} (${istTimeStr(now())} IST)`, { flags: ['provider_error'], steps: step, usage, skipPostCheck: true });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCancel);
  }
}
