/**
 * ANTIGRAVITY SIGN-IN FROM THE APP.
 *
 * The Antigravity CLI only logs in from a terminal: in print mode with a
 * controlling TTY it prints a Google OAuth link, waits 60 s, and accepts the
 * code that https://antigravity.google/oauth-callback shows ("Paste this code
 * into your application to complete authentication"). Without a TTY it just
 * fails. So the server runs `agy` under macOS `script`, which gives it a
 * pseudo-terminal, reads the link out of its output, and types the code the
 * user pastes into the app. The CLI stores the token in the keychain itself;
 * the app never sees or keeps it.
 *
 * One sign-in at a time. The link is tied to that process (PKCE), so a new
 * attempt always means a new link.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { childEnv, cliBinary } from './localAI.mjs';

export const LOGIN_WINDOW_MS = 60_000; // the CLI's own wait
const URL_RE = /https:\/\/accounts\.google\.com\/o\/oauth2\/[^\s\u001b"']+/;
const CODE_RE = /^[A-Za-z0-9._~\-/+=]{10,2048}$/;

let session = null;

const stripAnsi = s => s.replace(/\u001b\[[0-9;?>]*[a-zA-Z]/g, '').replace(/\u001b\][^\u0007]*\u0007/g, '');

/** Pure: did this print-mode output end in a working answer? */
export function loginOutcome(output) {
  const text = stripAnsi(output);
  if (/token exchange failed/i.test(text)) {
    if (/invalid_grant|bad request|malformed/i.test(text)) {
      return { ok: false, message: 'Google rejected that code. A code works once and only with the latest link — start again.' };
    }
    if (/write tcp|dial tcp|no such host|network|timeout|connection/i.test(text)) {
      return { ok: false, message: 'Antigravity could not reach Google (oauth2.googleapis.com) to exchange the code. Check the network and try again.' };
    }
    return { ok: false, message: 'Antigravity could not exchange that code with Google. Start again.' };
  }
  if (/no longer valid|invalid_grant/i.test(text)) return { ok: false, message: 'Google rejected that code. A code works once and only with the latest link — start again.' };
  const json = text.match(/\{"conversation_id"[\s\S]*?\}\s*\}/g)?.pop();
  if (json) {
    try {
      const r = JSON.parse(json);
      if (r.status === 'ERROR' || r.error) {
        return { ok: false, message: /timed out/i.test(r.error || '') ? 'The 60-second sign-in window closed. Start again and paste the code sooner.' : r.error || 'Antigravity reported an error' };
      }
      return { ok: true, message: 'Signed in to Antigravity.' };
    } catch {
      /* fall through */
    }
  }
  return { ok: false, message: 'Antigravity did not confirm the sign-in.' };
}

/** True once print mode has written its final JSON result. */
export const outputFinished = output => /\{"conversation_id"[\s\S]*?\}\s*\}/.test(stripAnsi(output));

/** `code` is what the callback page shows. Rejects anything that is not a plausible OAuth code. */
export function validCode(code) {
  return CODE_RE.test(String(code || '').trim());
}

/** Signed in = `agy models` can list models. Sends no prompt. */
export function antigravitySignedIn(env = process.env) {
  return new Promise(resolve => {
    const child = spawn(cliBinary('antigravity', env), ['models'], { stdio: ['ignore', 'pipe', 'pipe'], env: childEnv(env) });
    let out = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 20_000);
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('error', () => { clearTimeout(timer); resolve({ installed: false, signedIn: false }); });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ installed: true, signedIn: code === 0 && !/sign in/i.test(out) });
    });
  });
}

export function loginState() {
  if (!session) return { state: 'idle' };
  const { state, url, expiresAt, message } = session;
  return { state, url: state === 'awaiting_code' ? url : undefined, expiresAt, message };
}

function endSession(state, message) {
  if (!session) return;
  session.state = state;
  session.message = message;
  // The whole group: `cat` outlives agy and would otherwise linger.
  try {
    process.kill(-session.child.pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
  rmSync(session.cwd, { recursive: true, force: true });
}

export function cancelLogin() {
  if (session && (session.state === 'starting' || session.state === 'awaiting_code' || session.state === 'verifying')) {
    endSession('cancelled', 'Sign-in cancelled.');
  }
  return loginState();
}

/**
 * Start a sign-in. Resolves with `{ state: 'awaiting_code', url, expiresAt }`
 * once the CLI prints its link, or `{ state: 'signed_in' }` if it turns out to
 * be signed in already.
 */
export function startLogin(env = process.env) {
  cancelLogin();
  const cwd = mkdtempSync(join(tmpdir(), 'nifty50-agy-login-'));
  // `script` needs a real pipe on stdin (it calls tcgetattr, which fails on
  // the socket Node hands a child), hence `cat |`. Detached so the whole
  // group — sh, cat, script, agy — can be stopped together.
  const child = spawn('sh', ['-c', 'cat | exec script -q /dev/null "$@"', 'sh', cliBinary('antigravity', env),
    '-p', 'Reply with exactly: OK', '--output-format', 'json', '--mode', 'plan', '--sandbox', '--disable-slash-commands'], {
    cwd,
    env: { ...childEnv(env), TERM: 'xterm-256color', NO_COLOR: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: true
  });
  const s = { child, cwd, output: '', state: 'starting', url: null, expiresAt: null, message: null, waiters: [] };
  session = s;

  return new Promise(resolve => {
    const settle = () => resolve(loginState());
    const urlTimer = setTimeout(() => {
      if (s.state === 'starting') {
        endSession('failed', 'Antigravity did not show a sign-in link within 20 s.');
        settle();
      }
    }, 20_000);

    const onData = d => {
      s.output += d.toString();
      if (outputFinished(s.output)) {
        setTimeout(() => s.finish?.(), 100);
        return;
      }
      if (s.state === 'starting') {
        const m = URL_RE.exec(stripAnsi(s.output));
        if (m) {
          clearTimeout(urlTimer);
          s.url = m[0];
          s.state = 'awaiting_code';
          s.expiresAt = Date.now() + LOGIN_WINDOW_MS;
          settle();
        }
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.stdin.on('error', () => {});
    child.on('error', err => {
      clearTimeout(urlTimer);
      endSession('failed', err.code === 'ENOENT' ? '`script` or `agy` was not found.' : err.message);
      settle();
    });
    // `cat` keeps the pipeline's streams open after agy exits, so completion is
    // read from the output (the final JSON line) or from the process exiting.
    const finish = () => {
      clearTimeout(urlTimer);
      if (session !== s || s.finished) return;
      s.finished = true;
      if (s.state === 'starting' || s.state === 'awaiting_code' || s.state === 'verifying') {
        const outcome = loginOutcome(s.output);
        // A good answer before any link means it was already signed in.
        endSession(outcome.ok ? 'signed_in' : 'failed', outcome.ok ? (s.url ? outcome.message : 'Already signed in to Antigravity.') : outcome.message);
      } else {
        endSession(s.state, s.message);
      }
      s.waiters.splice(0).forEach(w => w());
      settle();
    };
    s.finish = finish;
    child.on('exit', () => setTimeout(finish, 200));
  });
}

/** Type the pasted code into the waiting CLI and wait for it to finish. */
export function submitCode(code) {
  const s = session;
  if (!s || s.state !== 'awaiting_code') {
    return Promise.resolve({ ...loginState(), state: s?.state ?? 'idle', message: s?.message ?? 'No sign-in is waiting for a code. Start again.' });
  }
  if (!validCode(code)) return Promise.resolve({ ...loginState(), message: 'That does not look like an authorization code. Copy the whole code from the Antigravity page.' });
  if (Date.now() > s.expiresAt) {
    endSession('failed', 'The 60-second sign-in window closed. Start again and paste the code sooner.');
    return Promise.resolve(loginState());
  }
  s.state = 'verifying';
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      endSession('failed', 'Antigravity did not finish signing in within 90 s.');
      resolve(loginState());
    }, 90_000);
    s.waiters.push(() => {
      clearTimeout(timer);
      resolve(loginState());
    });
    s.child.stdin.write(`${String(code).trim()}\r`);
  });
}
