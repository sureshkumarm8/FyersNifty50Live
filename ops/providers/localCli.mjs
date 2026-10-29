/**
 * Ops-agent adapter for the local AI CLIs (Claude Code, Copilot, Antigravity).
 *
 * The CLIs have no function-calling API we can hand our tools to, and their
 * own tools are switched off (ops/localAI.mjs). So tool use is a text
 * protocol: the model sees our tool catalog and the transcript, and must
 * reply with ONE JSON object — either tool calls or a final answer. Our loop
 * then runs any calls through the same guard and audit as every provider.
 * A reply that is not that JSON is treated as the final answer.
 */

import { localCliLabel, runLocalCli } from '../localAI.mjs';

const PROTOCOL = `
You cannot use any tools of your own (no shell, files, web or MCP). You act only by replying with ONE JSON object and nothing else:
  {"tool_calls": [{"name": "<tool>", "args": { ... }}]}   to call one or more of the tools listed below, or
  {"answer": "<your final answer to the user, plain text>"}  when you have what you need.
Tool results come back in the next message. Only call tools from the list. No markdown fences, no text outside the JSON.`;

export function renderPrompt({ messages, tools }) {
  const catalog = tools.map(t => `- ${t.name}: ${t.description}\n  args schema: ${JSON.stringify(t.parameters)}`).join('\n');
  const lines = [`TOOLS:\n${catalog || '(none)'}`, '', 'CONVERSATION:'];
  for (const m of messages) {
    if (m.role === 'user') lines.push(`USER: ${m.content}`);
    else if (m.role === 'assistant') {
      if (m.toolCalls?.length) lines.push(`ASSISTANT: ${JSON.stringify({ tool_calls: m.toolCalls.map(c => ({ name: c.name, args: c.args })) })}`);
      else if (m.content) lines.push(`ASSISTANT: ${JSON.stringify({ answer: m.content })}`);
    } else if (m.role === 'tool') lines.push(`TOOL RESULT (${m.name}): ${m.content}`);
  }
  lines.push('', 'Reply now with the single JSON object.');
  return lines.join('\n');
}

/** First balanced {...} in the text, ignoring code fences. */
function firstJsonObject(text) {
  const s = text.replace(/```(?:json)?/gi, '');
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try {
        return JSON.parse(s.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Pure: protocol reply → `{ text, toolCalls }`. */
export function parseProtocolReply(raw, step = 0) {
  const text = String(raw || '').trim();
  const obj = firstJsonObject(text);
  if (obj && Array.isArray(obj.tool_calls) && obj.tool_calls.length) {
    return {
      text: '',
      toolCalls: obj.tool_calls
        .filter(c => c && typeof c.name === 'string')
        .map((c, i) => ({ id: `cli_${step}_${i}`, name: c.name, args: c.args && typeof c.args === 'object' ? c.args : {} }))
    };
  }
  if (obj && typeof obj.answer === 'string') return { text: obj.answer.trim(), toolCalls: [] };
  return { text, toolCalls: [] };
}

export function createLocalCliProvider({ provider, model = null, timeoutMs = 120_000, run = runLocalCli }) {
  let step = 0;
  return {
    name: `${provider}${model ? `:${model}` : ''}`,
    label: localCliLabel(provider),
    async chat({ system, messages, tools, signal }) {
      step += 1;
      // No tools (daemon wording): a plain prompt, plain text back.
      if (!tools.length) {
        const prompt = messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n');
        const r = await run(provider, { system, prompt, model, timeoutMs, signal });
        return { text: r.text, toolCalls: [], usage: r.usage };
      }
      const r = await run(provider, {
        system: `${system}\n${PROTOCOL}`,
        prompt: renderPrompt({ messages, tools }),
        model,
        timeoutMs,
        signal
      });
      return { ...parseProtocolReply(r.text, step), usage: r.usage };
    }
  };
}
