/**
 * Replay provider for tests: returns scripted model turns in order, so the
 * agent loop, guard and audit can be exercised with no network and no cost.
 *
 * Each script step is `{ text?, toolCalls?: [{ name, args }] }` or a function
 * `(request) => step` that can inspect what the loop sent.
 */

export function createFakeProvider(script = []) {
  const requests = [];
  let i = 0;
  return {
    name: 'fake',
    requests,
    async chat(request) {
      requests.push(JSON.parse(JSON.stringify({ messages: request.messages, tools: request.tools.map(t => t.name) })));
      const step = typeof script[i] === 'function' ? script[i](request) : script[i];
      i += 1;
      if (!step) return { text: '', toolCalls: [], usage: { inputTokens: 0, outputTokens: 0 } };
      return {
        text: step.text || '',
        toolCalls: (step.toolCalls || []).map((c, k) => ({ id: `fake_${i}_${k}`, name: c.name, args: c.args || {} })),
        usage: { inputTokens: 10, outputTokens: 10 }
      };
    }
  };
}
