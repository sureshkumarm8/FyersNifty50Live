/**
 * LOCAL AI CLIs — Claude Code, GitHub Copilot CLI and the Antigravity CLI.
 *
 * These use whatever account the CLI is already signed into on this Mac, so
 * no API key is configured in the app. They are coding agents with their own
 * tools (shell, file edits, MCP servers), and a model that can run a shell
 * can also `curl` the order endpoint, which the loopback guard would allow.
 * So every call is locked down:
 *
 *   - runs in a fresh, empty temp folder, deleted afterwards
 *   - stdin is closed, so any "allow this?" prompt is answered no instead of hanging
 *   - Claude Code: built-in tools off (--tools ""), no MCP servers, no
 *     settings/hooks loaded, no session saved
 *   - Copilot: shell and write denied, built-in and user MCP servers disabled,
 *     no AGENTS.md instructions (--allow-all-tools is required for -p mode;
 *     the denials take precedence over it)
 *   - Antigravity: plan mode (no edits) inside its terminal sandbox
 *
 * Only text comes back. Tool use for the ops agent is a text protocol
 * (ops/providers/localCli.mjs) executed by our own guard, never by the CLI.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const LOCAL_CLI_PROVIDERS = Object.freeze(['claude-code', 'copilot', 'antigravity']);

const LABELS = { 'claude-code': 'Claude Code (local)', copilot: 'GitHub Copilot CLI (local)', antigravity: 'Antigravity CLI (local)' };
const MAX_PROMPT_CHARS = 200_000;
const MAX_CONCURRENT = 2;

const DEFAULT_BIN = { 'claude-code': 'claude', copilot: 'copilot', antigravity: 'agy' };
const BIN_ENV = { 'claude-code': 'OPS_CLAUDE_BIN', copilot: 'OPS_COPILOT_BIN', antigravity: 'OPS_AGY_BIN' };

/**
 * The CLI's path. launchd and `npm run` often have a thinner PATH than a
 * terminal (agy installs to ~/.local/bin), so the usual install folders are
 * searched too. OPS_CLAUDE_BIN / OPS_COPILOT_BIN / OPS_AGY_BIN override.
 */
export function cliBinary(provider, env = process.env) {
  if (!DEFAULT_BIN[provider]) throw new Error(`Unknown local AI provider: ${provider}`);
  if (env[BIN_ENV[provider]]) return env[BIN_ENV[provider]];
  const name = DEFAULT_BIN[provider];
  const dirs = [...String(env.PATH || '').split(':'), '/opt/homebrew/bin', '/usr/local/bin', join(homedir(), '.local', 'bin')];
  for (const dir of dirs) {
    if (dir && existsSync(join(dir, name))) return join(dir, name);
  }
  return name;
}

/** Copilot loads ~/.copilot/mcp-config.json; each server there is switched off by name. */
function copilotUserMcpServers() {
  try {
    const cfg = JSON.parse(readFileSync(join(homedir(), '.copilot', 'mcp-config.json'), 'utf8'));
    return Object.keys(cfg.mcpServers || {});
  } catch {
    return [];
  }
}

/**
 * Pure: the argv for one call, and whether the prompt goes on stdin.
 * Exported so the lockdown flags are tested, not just documented.
 */
export function buildCliArgs(provider, { system, prompt, model, timeoutMs = 120_000, mcpServers = copilotUserMcpServers() }) {
  if (provider === 'claude-code') {
    const args = [
      '-p', '--output-format', 'json',
      '--tools', '',
      '--strict-mcp-config',
      '--setting-sources', '',
      '--no-session-persistence'
    ];
    if (system) args.push('--system-prompt', system);
    if (model) args.push('--model', model);
    return { args, stdin: prompt };
  }
  // Copilot and Antigravity take no separate system prompt in print mode.
  const full = system ? `${system}\n\n---\n\n${prompt}` : prompt;
  if (provider === 'copilot') {
    const args = [
      '-p', full, '--no-color',
      '--allow-all-tools', '--deny-tool', 'shell', '--deny-tool', 'write',
      '--disable-builtin-mcps', '--no-custom-instructions'
    ];
    for (const name of mcpServers) args.push('--disable-mcp-server', name);
    if (model) args.push('--model', model);
    return { args, stdin: null };
  }
  if (provider === 'antigravity') {
    const args = [
      '-p', full, '--output-format', 'json',
      '--mode', 'plan', '--sandbox', '--disable-slash-commands',
      '--print-timeout', `${Math.max(10, Math.round(timeoutMs / 1000))}s`
    ];
    if (model) args.push('--model', model);
    return { args, stdin: null };
  }
  throw new Error(`Unknown local AI provider: ${provider}`);
}

/** Pure: turn one CLI's stdout/stderr into `{ text, usage }`, or throw a readable error. */
export function parseCliOutput(provider, stdout, stderr = '') {
  if (provider === 'claude-code') {
    let json;
    try {
      json = JSON.parse(stdout);
    } catch {
      throw new Error(`Claude Code returned no JSON: ${(stderr || stdout).trim().slice(0, 300)}`);
    }
    if (json.is_error) throw new Error(`Claude Code: ${String(json.result || json.subtype || 'error').slice(0, 300)}`);
    return {
      text: String(json.result ?? '').trim(),
      usage: {
        inputTokens: (json.usage?.input_tokens ?? 0) + (json.usage?.cache_read_input_tokens ?? 0) + (json.usage?.cache_creation_input_tokens ?? 0),
        outputTokens: json.usage?.output_tokens ?? 0
      },
      model: Object.keys(json.modelUsage || {})[0] ?? null
    };
  }
  if (provider === 'copilot') {
    const text = stdout.trim();
    if (!text) throw new Error(`Copilot CLI returned nothing: ${stderr.trim().slice(0, 300) || 'is it signed in? run `copilot` once'}`);
    // Usage lines go to stderr: "claude-haiku-4.5  14.0k input, 4 output, ..."
    const m = /\n\s*(\S+)\s+([\d.]+)(k?) input, ([\d.]+)(k?) output/.exec(`\n${stderr}`);
    const n = (v, k) => Math.round(Number(v) * (k ? 1000 : 1));
    return { text, usage: m ? { inputTokens: n(m[2], m[3]), outputTokens: n(m[4], m[5]) } : { inputTokens: 0, outputTokens: 0 }, model: m?.[1] ?? null };
  }
  if (provider === 'antigravity') {
    let json;
    try {
      json = JSON.parse(stdout);
    } catch {
      throw new Error(`Antigravity CLI returned no JSON: ${(stderr || stdout).trim().slice(0, 300)}`);
    }
    if (json.status && json.status !== 'SUCCESS' && json.status !== 'COMPLETED' && !json.response) {
      const hint = /auth/i.test(json.error || '') ? ' — not signed in: use "Sign in with Google" under Settings → AI Provider → Antigravity (or run `agy` in a terminal)' : '';
      throw new Error(`Antigravity CLI: ${json.error || json.status}${hint}`);
    }
    return {
      text: String(json.response ?? '').trim(),
      usage: { inputTokens: json.usage?.input_tokens ?? 0, outputTokens: json.usage?.output_tokens ?? 0 },
      model: null
    };
  }
  throw new Error(`Unknown local AI provider: ${provider}`);
}

/** CLIs like copilot are `#!/usr/bin/env node` scripts; make sure node and the install dirs are on PATH. */
export function childEnv(env) {
  const extra = [dirname(process.execPath), '/opt/homebrew/bin', '/usr/local/bin', join(homedir(), '.local', 'bin')];
  const path = [...String(env.PATH || '').split(':').filter(Boolean), ...extra].filter((d, i, a) => a.indexOf(d) === i).join(':');
  return { ...env, PATH: path, NO_COLOR: '1', CI: '1' };
}

let running = 0;

/**
 * Run one prompt through a local CLI. Resolves `{ text, usage, model, ms }`.
 * `signal` aborts (kills the process).
 */
export async function runLocalCli(provider, { system = '', prompt, model, timeoutMs = 120_000, signal, env = process.env } = {}) {
  if (!LOCAL_CLI_PROVIDERS.includes(provider)) throw new Error(`Unknown local AI provider: ${provider}`);
  if (!prompt) throw new Error('prompt required');
  if (prompt.length + system.length > MAX_PROMPT_CHARS) throw new Error(`prompt too long for a local CLI (${prompt.length + system.length} chars)`);
  if (running >= MAX_CONCURRENT) throw new Error(`${LABELS[provider]} is busy (${running} calls running); try again shortly`);

  const { args, stdin } = buildCliArgs(provider, { system, prompt, model, timeoutMs });
  const cwd = mkdtempSync(join(tmpdir(), 'nifty50-localai-'));
  const started = Date.now();
  running += 1;
  try {
    const { code, stdout, stderr, killed } = await new Promise((resolve, reject) => {
      const child = spawn(cliBinary(provider, env), args, {
        cwd,
        env: childEnv(env),
        stdio: [stdin === null ? 'ignore' : 'pipe', 'pipe', 'pipe']
      });
      let out = '';
      let err = '';
      let wasKilled = false;
      const kill = () => {
        wasKilled = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 3000).unref();
      };
      const timer = setTimeout(kill, timeoutMs);
      signal?.addEventListener('abort', kill, { once: true });
      child.stdout.on('data', d => { out += d; });
      child.stderr.on('data', d => { err += d; });
      child.on('error', e => {
        clearTimeout(timer);
        reject(e.code === 'ENOENT' ? new Error(`${LABELS[provider]}: \`${cliBinary(provider, env)}\` not found on PATH`) : e);
      });
      child.on('close', c => {
        clearTimeout(timer);
        resolve({ code: c, stdout: out, stderr: err, killed: wasKilled });
      });
      if (stdin !== null) {
        child.stdin.on('error', () => {});
        child.stdin.end(stdin);
      }
    });
    if (killed) throw new Error(signal?.aborted ? `${LABELS[provider]} call cancelled` : `${LABELS[provider]} did not answer within ${Math.round(timeoutMs / 1000)} s`);
    let parsed;
    try {
      parsed = parseCliOutput(provider, stdout, stderr);
    } catch (err) {
      if (code !== 0 && !stdout.trim()) throw new Error(`${LABELS[provider]} exited ${code}: ${stderr.trim().slice(0, 300)}`);
      throw err;
    }
    return { ...parsed, ms: Date.now() - started };
  } finally {
    running -= 1;
    rmSync(cwd, { recursive: true, force: true });
  }
}

/** Which CLIs are installed, and their versions. Never sends a prompt. */
export async function localCliStatus(env = process.env) {
  const probe = (provider, versionArgs) => new Promise(resolve => {
    const child = spawn(cliBinary(provider, env), versionArgs, { stdio: ['ignore', 'pipe', 'pipe'], env: childEnv(env) });
    let out = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 8000);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('error', () => { clearTimeout(timer); resolve({ provider, label: LABELS[provider], installed: false, version: null }); });
    // Installed = the binary started at all; `agy --help` exits non-zero by design.
    child.on('close', () => {
      clearTimeout(timer);
      resolve({ provider, label: LABELS[provider], installed: true, version: out.trim().split('\n')[0]?.slice(0, 80) || null });
    });
  });
  return Promise.all([
    probe('claude-code', ['--version']),
    probe('copilot', ['--version']),
    probe('antigravity', ['--help'])
  ]).then(rows => rows.map(r => (r.provider === 'antigravity' && r.installed ? { ...r, version: 'installed' } : r)));
}

export const localCliLabel = provider => LABELS[provider] ?? provider;
