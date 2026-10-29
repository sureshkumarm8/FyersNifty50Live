/**
 * Ollama adapter: /api/chat with tools. Local, no key, works offline — the
 * fallback when no Gemini key is configured. Needs a tool-capable model.
 */

function toMessages(system, messages) {
  const out = [{ role: 'system', content: system }];
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content });
    else if (m.role === 'assistant') {
      out.push({
        role: 'assistant',
        content: m.content || '',
        ...(m.toolCalls?.length ? { tool_calls: m.toolCalls.map(c => ({ function: { name: c.name, arguments: c.args || {} } })) } : {})
      });
    } else if (m.role === 'tool') out.push({ role: 'tool', content: m.content, tool_name: m.name });
  }
  return out;
}

export function createOllamaProvider({ baseUrl = 'http://127.0.0.1:11434', model = 'gemma4:latest', fetchImpl = fetch }) {
  return {
    name: `ollama:${model}`,
    async chat({ system, messages, tools, signal }) {
      const res = await fetchImpl(`${baseUrl}/api/chat`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          options: { temperature: 0.2 },
          messages: toMessages(system, messages),
          tools: tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }))
        })
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      const msg = json.message || {};
      const toolCalls = (msg.tool_calls || []).map((c, i) => {
        let args = c.function?.arguments ?? {};
        if (typeof args === 'string') {
          try { args = JSON.parse(args); } catch { args = {}; }
        }
        return { id: `call_${Date.now()}_${i}`, name: c.function?.name, args };
      });
      return {
        text: String(msg.content || '').trim(),
        toolCalls,
        usage: { inputTokens: json.prompt_eval_count ?? 0, outputTokens: json.eval_count ?? 0 }
      };
    }
  };
}
