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
 *   - Copilot (1.x): only the read-only `view` tool is available, shell and
 *     write denied on top, built-in and user MCP servers disabled, no
 *     AGENTS.md instructions (--allow-all-tools is required for -p mode; the
 *     denials take precedence over it), -s so stdout is only the answer
 *   - Antigravity: plan mode (no edits) inside its terminal sandbox
 *
 * Claude Code and Copilot can also be handed images (chart screenshots): Claude
 * Code as content blocks on stdin, Copilot as files in the temp folder (--attachment).
 *
 * Only text comes back. Tool use for the ops agent is a text protocol
 * (ops/providers/localCli.mjs) executed by our own guard, never by the CLI.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const LOCAL_CLI_PROVIDERS = Object.freeze(['claude-code', 'copilot', 'antigravity']);
/** The CLIs that can be handed chart screenshots. */
export const IMAGE_PROVIDERS = Object.freeze(['claude-code', 'copilot']);

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
export function buildCliArgs(provider, { system, prompt, model, images = [], attachments = [], timeoutMs = 120_000, mcpServers = copilotUserMcpServers() }) {
  if (images.length && provider !== 'claude-code') throw new Error(`${LABELS[provider]} takes images as attachments (files), not inline`);
  if (attachments.length && provider !== 'copilot') throw new Error(`${LABELS[provider]} cannot read images`);
  if (provider === 'claude-code') {
    // Images only go in as content blocks, which needs stream-json on both ends.
    const args = images.length
      ? ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose']
      : ['-p', '--output-format', 'json'];
    args.push(
      '--tools', '',
      '--strict-mcp-config',
      '--setting-sources', '',
      '--no-session-persistence'
    );
    if (system) args.push('--system-prompt', system);
    if (model) args.push('--model', model);
    if (!images.length) return { args, stdin: prompt };
    const content = [...images.map(imageBlock), { type: 'text', text: prompt }];
    return { args, stdin: `${JSON.stringify({ type: 'user', message: { role: 'user', content } })}\n` };
  }
  // Copilot and Antigravity take no separate system prompt in print mode.
  const full = system ? `${system}\n\n---\n\n${prompt}` : prompt;
  if (provider === 'copilot') {
    const args = [
      '-p', full, '-s', '--no-color',
      '--available-tools', 'view',
      '--allow-all-tools', '--deny-tool', 'shell', '--deny-tool', 'write',
      '--disable-builtin-mcps', '--no-custom-instructions'
    ];
    for (const name of mcpServers) args.push('--disable-mcp-server', name);
    for (const file of attachments) args.push('--attachment', file);
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

/** A data URL or bare base64 PNG as an Anthropic image content block. */
function imageBlock(image) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(String(image));
  return { type: 'image', source: { type: 'base64', media_type: m ? m[1] : 'image/png', data: m ? m[2] : String(image) } };
}

const IMAGE_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

/** Writes one data URL / bare base64 image into `dir`; returns its file name. */
function writeImage(dir, image, i) {
  const { source } = imageBlock(image);
  const name = `chart-${i + 1}.${IMAGE_EXT[source.media_type] || 'png'}`;
  writeFileSync(join(dir, name), Buffer.from(source.data, 'base64'));
  return `./${name}`;
}

/** stream-json output is one event per line; the answer is the final `result` event. */
function claudeResultJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    const lines = String(stdout).trim().split('\n').reverse();
    for (const line of lines) {
      try {
        const ev = JSON.parse(line);
        if (ev?.type === 'result') return ev;
      } catch { /* not a JSON line */ }
    }
    return null;
  }
}

/** Pure: turn one CLI's stdout/stderr into `{ text, usage }`, or throw a readable error. */
export function parseCliOutput(provider, stdout, stderr = '') {
  if (provider === 'claude-code') {
    const json = claudeResultJson(stdout);
    if (!json) throw new Error(`Claude Code returned no JSON: ${(stderr || stdout).trim().slice(0, 300)}`);
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
export async function runLocalCli(provider, { system = '', prompt, model, images = [], timeoutMs = 120_000, signal, env = process.env } = {}) {
  if (!LOCAL_CLI_PROVIDERS.includes(provider)) throw new Error(`Unknown local AI provider: ${provider}`);
  if (!prompt) throw new Error('prompt required');
  if (prompt.length + system.length > MAX_PROMPT_CHARS) throw new Error(`prompt too long for a local CLI (${prompt.length + system.length} chars)`);
  if (running >= MAX_CONCURRENT) throw new Error(`${LABELS[provider]} is busy (${running} calls running); try again shortly`);

  if (images.length && !IMAGE_PROVIDERS.includes(provider)) throw new Error(`${LABELS[provider]} cannot read images`);
  const cwd = mkdtempSync(join(tmpdir(), 'nifty50-localai-'));
  // Copilot reads images from disk; they live in the temp folder and go with it.
  const attachments = provider === 'copilot' ? images.map((img, i) => writeImage(cwd, img, i)) : [];
  const { args, stdin } = buildCliArgs(provider, { system, prompt, model, images: provider === 'copilot' ? [] : images, attachments, timeoutMs });
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
