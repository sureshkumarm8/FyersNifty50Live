/**
 * Gemini adapter (function calling) over @google/genai, already a dependency.
 *
 * Neutral message format used by ops/agent.mjs:
 *   { role: 'user', content }
 *   { role: 'assistant', content, toolCalls: [{ id, name, args }], raw? }
 *   { role: 'tool', toolCallId, name, content }   // content is a JSON string
 *
 * The model's own content object is kept in `raw` and replayed verbatim:
 * thinking models attach thought signatures to function-call parts and expect
 * them back on the next request.
 */

import { GoogleGenAI } from '@google/genai';

function toContents(messages) {
  const contents = [];
  for (const m of messages) {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      if (m.raw) contents.push(m.raw);
      else {
        const parts = [];
        if (m.content) parts.push({ text: m.content });
        for (const c of m.toolCalls || []) parts.push({ functionCall: { id: c.id, name: c.name, args: c.args || {} } });
        contents.push({ role: 'model', parts });
      }
    } else if (m.role === 'tool') {
      let response;
      try { response = JSON.parse(m.content); } catch { response = { text: m.content }; }
      if (!response || typeof response !== 'object' || Array.isArray(response)) response = { result: response };
      const part = { functionResponse: { id: m.toolCallId, name: m.name, response } };
      // Consecutive tool results share one user turn.
      const last = contents[contents.length - 1];
      if (last?.role === 'user' && last.parts.every(p => p.functionResponse)) last.parts.push(part);
      else contents.push({ role: 'user', parts: [part] });
    }
  }
  return contents;
}

export function createGeminiProvider({ apiKey, model = 'gemini-2.5-flash' }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set');
  const ai = new GoogleGenAI({ apiKey });
  return {
    name: `gemini:${model}`,
    async chat({ system, messages, tools, signal }) {
      const res = await ai.models.generateContent({
        model,
        contents: toContents(messages),
        config: {
          systemInstruction: system,
          temperature: 0.2,
          abortSignal: signal,
          tools: tools.length
            ? [{ functionDeclarations: tools.map(t => ({ name: t.name, description: t.description, parametersJsonSchema: t.parameters })) }]
            : undefined
        }
      });
      const content = res.candidates?.[0]?.content ?? null;
      const parts = content?.parts ?? [];
      const toolCalls = parts
        .filter(p => p.functionCall)
        .map((p, i) => ({ id: p.functionCall.id || `call_${Date.now()}_${i}`, name: p.functionCall.name, args: p.functionCall.args || {} }));
      const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim();
      return {
        text,
        toolCalls,
        raw: content,
        usage: {
          inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0
        }
      };
    }
  };
}
