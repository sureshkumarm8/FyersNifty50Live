/**
 * Local AI CLIs (Claude Code, Copilot, Antigravity): the lockdown flags, the
 * output parsers, the text tool protocol, and the agent loop running through
 * a CLI provider. No CLI is started unless LOCAL_AI_LIVE=claude-code|copilot|antigravity.
 */
import assert from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = mkdtempSync(join(tmpdir(), 'opslocalai-'));
process.env.OPS_JOURNAL_ROOT = root;

const { buildCliArgs, parseCliOutput, runLocalCli }: any = await import('../ops/localAI.mjs');
const { createLocalCliProvider, parseProtocolReply, renderPrompt }: any = await import('../ops/providers/localCli.mjs');
const { extractJson } = await import('../ops/localAiRoute.mjs');
const { opsConfig } = await import('../ops/config.mjs');
const { isLocalOnlyPath } = await import('../ops/net.mjs');
const { runAgent } = await import('../ops/agent.mjs');
const { createGuard } = await import('../ops/guard.mjs');
const { createAudit } = await import('../ops/audit.mjs');

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };

async function run() {
  console.log('\n--- Local AI CLIs ---');

  // Lockdown flags
  const claude = buildCliArgs('claude-code', { system: 'S', prompt: 'P', model: 'haiku' });
  assert.deepStrictEqual(claude.args.slice(claude.args.indexOf('--tools'), claude.args.indexOf('--tools') + 2), ['--tools', '']);
  for (const f of ['-p', '--strict-mcp-config', '--no-session-persistence', '--setting-sources']) assert.ok(claude.args.includes(f), f);
  assert.strictEqual(claude.stdin, 'P');
  assert.ok(claude.args.includes('haiku'));
  const copilot = buildCliArgs('copilot', { system: 'S', prompt: 'P', mcpServers: ['devicely', 'artemis'] });
  const denied = copilot.args.flatMap((a: string, i: number) => (a === '--deny-tool' ? [copilot.args[i + 1]] : []));
  assert.deepStrictEqual(denied.sort(), ['shell', 'write']);
  const disabled = copilot.args.flatMap((a: string, i: number) => (a === '--disable-mcp-server' ? [copilot.args[i + 1]] : []));
  assert.deepStrictEqual(disabled, ['devicely', 'artemis']);
  assert.ok(copilot.args.includes('--disable-builtin-mcps') && copilot.args.includes('--no-custom-instructions'));
  assert.strictEqual(copilot.stdin, null);
  const agy = buildCliArgs('antigravity', { system: 'S', prompt: 'P', timeoutMs: 90_000 });
  assert.strictEqual(agy.args[agy.args.indexOf('--mode') + 1], 'plan');
  assert.ok(agy.args.includes('--sandbox') && agy.args.includes('90s'));
  assert.throws(() => buildCliArgs('bash' as any, { prompt: 'x' }));
  ok('each CLI is called with its own tools, MCP servers and settings switched off');

  // Output parsers
  const c = parseCliOutput('claude-code', JSON.stringify({ result: ' hi ', is_error: false, usage: { input_tokens: 2, cache_read_input_tokens: 10, output_tokens: 3 }, modelUsage: { 'claude-haiku-4-5': {} } }));
  assert.deepStrictEqual([c.text, c.usage.inputTokens, c.usage.outputTokens, c.model], ['hi', 12, 3, 'claude-haiku-4-5']);
  assert.throws(() => parseCliOutput('claude-code', JSON.stringify({ is_error: true, result: 'Credit balance is too low' })), /Credit balance/);
  const cp = parseCliOutput('copilot', 'ok\n', 'Usage by model:\n    claude-haiku-4.5     14.0k input, 4 output, 0 cache read');
  assert.deepStrictEqual([cp.text, cp.usage.inputTokens, cp.usage.outputTokens, cp.model], ['ok', 14000, 4, 'claude-haiku-4.5']);
  assert.throws(() => parseCliOutput('copilot', '', ''), /signed in/);
  const ag = parseCliOutput('antigravity', JSON.stringify({ status: 'SUCCESS', response: 'yo', usage: { input_tokens: 5, output_tokens: 1 } }));
  assert.strictEqual(ag.text, 'yo');
  assert.throws(() => parseCliOutput('antigravity', JSON.stringify({ status: 'ERROR', response: '', error: 'authentication failed or timed out' })), /Sign in with Google/);
  ok('Claude Code JSON, Copilot text + usage, Antigravity JSON are parsed; failures are readable');

  // Text tool protocol
  assert.deepStrictEqual(parseProtocolReply('{"tool_calls":[{"name":"get_app_state","args":{}}]}').toolCalls.map((t: any) => t.name), ['get_app_state']);
  assert.strictEqual(parseProtocolReply('```json\n{"answer": "All clear {really}"}\n```').text, 'All clear {really}');
  assert.strictEqual(parseProtocolReply('Sure! {"answer":"x"} hope that helps').text, 'x');
  assert.strictEqual(parseProtocolReply('Plain text reply').text, 'Plain text reply');
  const prompt = renderPrompt({
    messages: [{ role: 'user', content: 'Q' }, { role: 'assistant', toolCalls: [{ name: 't', args: {} }] }, { role: 'tool', name: 't', content: '{"a":1}' }],
    tools: [{ name: 't', description: 'd', parameters: { type: 'object' } }]
  });
  assert.ok(prompt.includes('TOOL RESULT (t): {"a":1}') && prompt.includes('- t: d'));
  assert.strictEqual(extractJson('Here:\n```json\n{"a":[1]}\n```'), '{"a":[1]}');
  ok('JSON tool-call protocol parses fenced, chatty and plain replies');

  // The agent loop through a CLI provider: tool calls still pass our guard.
  const replies = [
    '{"tool_calls":[{"name":"place_order","args":{"qty":65}},{"name":"get_app_state","args":{}}]}',
    '{"answer":"Sniper is WAITING as of 10:42 IST (app snapshot)."}'
  ];
  const calls: any[] = [];
  const fakeRun = async (p: string, o: any) => { calls.push({ p, o }); return { text: replies[calls.length - 1], usage: { inputTokens: 1, outputTokens: 1 } }; };
  const provider = createLocalCliProvider({ provider: 'claude-code', run: fakeRun });
  const ctx = {
    client: { get: async () => ({ ok: true, status: 200, json: { snapshot: { engines: { sniper: { state: 'WAITING' } }, positions: [] }, ageSec: 2, stale: false, receivedAt: Date.now() } }), post: async () => ({}), getBytes: async () => null },
    now: () => Date.now(),
    notify: async () => {}
  };
  const r = await runAgent({ question: 'What is the Sniper doing?', provider, guard: createGuard({ level: 0 }), audit: createAudit(), ctx, level: 0 });
  assert.match(r.text, /WAITING/);
  assert.deepStrictEqual(r.toolCalls.map((t: any) => t.name), ['get_app_state'], 'place_order denied, never run');
  assert.ok(calls[0].o.system.includes('You cannot use any tools of your own'));
  assert.ok(calls[1].o.prompt.includes('denied: unknown tool'));
  ok('a CLI provider drives the same guarded loop; forbidden calls are denied');

  // Config and network
  assert.strictEqual(opsConfig({ OPS_AI_PROVIDER: 'claude' } as any, null).provider, 'claude-code');
  assert.strictEqual(opsConfig({ OPS_AI_PROVIDER: 'agy' } as any, null).provider, 'antigravity');
  const cfg = opsConfig({ OPS_AI_PROVIDER: 'copilot' } as any, null);
  assert.ok(cfg.local && cfg.model === null);
  assert.ok(isLocalOnlyPath('/api/local-ai/chat') && isLocalOnlyPath('/api/local-ai/status'));
  ok('OPS_AI_PROVIDER accepts claude / claude-code / copilot / antigravity / agy; /api/local-ai is loopback-only');

  // The provider picked in Settings wins over .env.local and survives a restart.
  const { saveProviderChoice, readProviderChoice }: any = await import('../ops/config.mjs');
  const file = join(root, 'ops-provider.json');
  assert.strictEqual(readProviderChoice(file), null);
  saveProviderChoice({ provider: 'antigravity', model: '' }, file);
  const saved = readProviderChoice(file);
  const fromSettings = opsConfig({ OPS_AI_PROVIDER: 'gemini', OPS_AI_MODEL: 'gemini-2.5-flash', GEMINI_API_KEY: 'k' } as any, saved);
  assert.deepStrictEqual([fromSettings.provider, fromSettings.model, fromSettings.source, fromSettings.local], ['antigravity', null, 'settings', true]);
  saveProviderChoice({ provider: 'claude-code', model: 'haiku' }, file);
  assert.strictEqual(opsConfig({} as any, readProviderChoice(file)).model, 'haiku');
  assert.throws(() => saveProviderChoice({ provider: 'groq' }, file), /cannot run on the server/);
  assert.strictEqual(opsConfig({ OPS_AI_PROVIDER: 'copilot' } as any, null).source, 'env');
  ok('the Settings provider choice overrides .env.local; browser-key providers are refused');

  // Optional live call
  const live = process.env.LOCAL_AI_LIVE;
  if (live) {
    const out = await runLocalCli(live, { system: 'You are a connectivity check.', prompt: 'Reply with exactly: OK', model: process.env.LOCAL_AI_MODEL || null, timeoutMs: 120_000 });
    assert.match(out.text, /OK/i);
    ok(`live ${live} call answered "${out.text}" in ${(out.ms / 1000).toFixed(1)} s`);
  } else {
    console.log('  skip  live CLI call (set LOCAL_AI_LIVE=claude-code|copilot|antigravity)');
  }

  console.log(`\n✅ PASS — ${passed} local AI checks\n`);
}

run()
  .catch(err => {
    console.error('❌ FAIL', err);
    process.exitCode = 1;
  })
  .finally(() => rmSync(root, { recursive: true, force: true }));
