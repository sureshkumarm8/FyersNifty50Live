/**
 * Antigravity sign-in plumbing, against a fake `agy` that behaves like the
 * real one: it refuses to log in without a terminal, prints a Google link,
 * then reads the pasted code. Checks the link is captured, the code reaches
 * the CLI through the pseudo-terminal, both outcomes are reported, and no
 * process is left behind.
 */
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'fake-agy-'));
const fake = join(dir, 'agy');
writeFileSync(fake, `#!/bin/sh
if [ "$1" = "models" ]; then echo "Error: Please sign in to view available models."; exit 1; fi
if [ ! -t 0 ]; then echo "Error: authentication required. Run 'agy' to log in, then retry."; exit 1; fi
printf 'Authentication required. Please visit the URL to log in:\\r\\n  https://accounts.google.com/o/oauth2/auth?access_type=offline&redirect_uri=https%%3A%%2F%%2Fantigravity.google%%2Foauth-callback&state=abc\\r\\n\\r\\nWaiting for authentication (timeout 60s)...\\r\\nOr, paste the authorization code here and press Enter:\\r\\n'
read code
if [ "$code" = "4/0good_code_1234567890" ]; then
  printf '{"conversation_id":"c1","status":"SUCCESS","response":"OK","error":"","usage":{"input_tokens":1,"output_tokens":1}}\\r\\n'
else
  printf 'Error: authentication failed: token exchange failed: oauth2: "invalid_grant" "Bad Request"\\r\\n{"conversation_id":"","status":"ERROR","response":"","error":"authentication failed or timed out","usage":{"input_tokens":0,"output_tokens":0}}\\r\\n'
fi
`);
chmodSync(fake, 0o755);
process.env.OPS_AGY_BIN = fake;

const auth: any = await import('../ops/antigravityAuth.mjs');

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };
const leftovers = () => Number(execSync(`ps -Ao command | grep -c "^/bin/sh ${fake}" || true`).toString().trim());

async function run() {
  console.log('\n--- Antigravity sign-in ---');

  assert.deepStrictEqual(await auth.antigravitySignedIn(), { installed: true, signedIn: false });
  ok('`agy models` failing means "not signed in"');

  let s = await auth.startLogin();
  assert.strictEqual(s.state, 'awaiting_code', JSON.stringify(s));
  assert.match(s.url, /^https:\/\/accounts\.google\.com\/o\/oauth2\/auth\?.*antigravity\.google%2Foauth-callback/);
  assert.ok(s.expiresAt > Date.now() + 50_000);
  ok('the CLI runs under a terminal and its Google link is captured (60 s window)');

  const bad = await auth.submitCode('nope');
  assert.strictEqual(bad.state, 'awaiting_code');
  assert.match(bad.message, /does not look like/);
  s = await auth.submitCode('4/0good_code_1234567890');
  assert.strictEqual(s.state, 'signed_in', JSON.stringify(s));
  ok('a malformed code is refused locally; a good code is typed into the CLI and signs in');

  await auth.startLogin();
  s = await auth.submitCode('4/0expired_code_1234567890');
  assert.strictEqual(s.state, 'failed');
  assert.match(s.message, /rejected that code/);
  ok('a code Google rejects is reported plainly');

  await auth.startLogin();
  assert.strictEqual(auth.cancelLogin().state, 'cancelled');
  assert.strictEqual((await auth.submitCode('4/0good_code_1234567890')).state, 'cancelled');
  await new Promise(r => setTimeout(r, 500));
  assert.strictEqual(leftovers(), 0, 'no fake agy left running');
  ok('cancel stops the whole process group; a late code is not accepted');

  assert.strictEqual(auth.loginOutcome('Error: authentication failed: token exchange failed: Post "https://oauth2.googleapis.com/token": write tcp [::1]:1->[::2]:443: write: socket is not connected').ok, false);
  assert.match(auth.loginOutcome('token exchange failed: Post ... write tcp ...').message, /could not reach Google/);
  ok('a network failure during the code exchange is named as such');

  console.log(`\n✅ PASS — ${passed} Antigravity sign-in checks\n`);
}

run()
  .catch(err => {
    console.error('❌ FAIL', err);
    process.exitCode = 1;
  })
  .finally(() => {
    auth.cancelLogin();
    rmSync(dir, { recursive: true, force: true });
  });
