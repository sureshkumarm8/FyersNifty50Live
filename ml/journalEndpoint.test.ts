/**
 * M0: the disk journal endpoint actually writes, into the IST-dated folder;
 * unknown streams are refused; loopback-only routes refuse other machines and
 * other sites; the kill switch keys by IST date.
 *
 * Spawns server.js on a spare port with a temporary journal root and Redis
 * disabled, so nothing real is touched.
 */
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';
import { JOURNAL_STREAMS } from '../services/journal';
import { BROWSER_STREAMS } from '../ops/journal.mjs';
import { isLocalOnlyPath, localOnlyAllowed } from '../ops/net.mjs';
import { istDateStr } from '../ops/time.mjs';

let passed = 0;
const ok = (label: string) => { passed++; console.log(`  ok    ${label}`); };

const PORT = 5600 + Math.floor(Math.random() * 300);
const root = mkdtempSync(join(tmpdir(), 'opsjournal-'));
const base = `http://127.0.0.1:${PORT}`;

async function waitForServer(ms = 15000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(`${base}/api/ops/state`);
      if (r.status) return;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error('server did not start');
}

async function run() {
  console.log('\n--- Journal endpoint & loopback guard (M0) ---');

  assert.deepStrictEqual([...JOURNAL_STREAMS], [...BROWSER_STREAMS]);
  ok('browser JournalStream union matches the server whitelist');

  // Unit-level guard checks (no network needed).
  const req = (addr: string, origin?: string) => ({ socket: { remoteAddress: addr }, headers: origin ? { origin } : {} });
  assert.ok(isLocalOnlyPath('/api/ops/chat') && isLocalOnlyPath('/api/kill') && isLocalOnlyPath('/api/fyers/place-order'));
  assert.ok(!isLocalOnlyPath('/api/get-redis-data'));
  assert.strictEqual(localOnlyAllowed(req('192.168.1.20'), '/api/ops/state'), false);
  assert.strictEqual(localOnlyAllowed(req('::ffff:127.0.0.1'), '/api/ops/state'), true);
  assert.strictEqual(localOnlyAllowed(req('127.0.0.1', 'http://localhost:5173'), '/api/kill'), true);
  assert.strictEqual(localOnlyAllowed(req('127.0.0.1', 'https://evil.example'), '/api/kill'), false);
  assert.strictEqual(localOnlyAllowed(req('192.168.1.20'), '/api/get-redis-data'), true);
  ok('loopback + origin rules (unit)');

  const server = spawn(process.execPath, ['server.js'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      OPS_JOURNAL_ROOT: root,
      NODE_ENV: 'development',
      UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', KV_REST_API_URL: '', KV_REST_API_TOKEN: ''
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverLog = '';
  server.stdout.on('data', d => { serverLog += d; });
  server.stderr.on('data', d => { serverLog += d; });

  try {
    await waitForServer();

    const r1 = await fetch(`${base}/api/journal/alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rule: 'test', message: 'hello' }) });
    assert.strictEqual(r1.status, 200);
    const file = join(root, istDateStr(), 'alerts.jsonl');
    assert.ok(existsSync(file), `expected ${file}`);
    const row = JSON.parse(readFileSync(file, 'utf8').trim().split('\n').pop()!);
    assert.strictEqual(row.rule, 'test');
    assert.ok(Number.isFinite(row.timestamp));
    ok(`POST /api/journal/alerts writes ${istDateStr()}/alerts.jsonl (IST folder)`);

    const r2 = await fetch(`${base}/api/journal/not-a-stream`, { method: 'POST', body: '{}' });
    assert.strictEqual(r2.status, 400);
    const r3 = await fetch(`${base}/api/journal/..%2Fescape`, { method: 'POST', body: '{}' });
    assert.ok(r3.status === 400 || r3.status === 404);
    const r4 = await fetch(`${base}/api/journal/alerts`, { method: 'POST', body: '[1,2]' });
    assert.strictEqual(r4.status, 400);
    ok('unknown stream, path tricks and non-object bodies are refused');

    const r5 = await fetch(`${base}/api/ops/state`, { headers: { Origin: 'https://evil.example' } });
    assert.strictEqual(r5.status, 403);
    ok('a foreign Origin gets 403 on /api/ops/*');

    const lan = Object.values(networkInterfaces()).flat().find(i => i && i.family === 'IPv4' && !i.internal);
    if (lan) {
      const r6 = await fetch(`http://${lan.address}:${PORT}/api/ops/state`).catch(() => null);
      if (r6) {
        assert.strictEqual(r6.status, 403);
        ok(`a non-loopback request (${lan.address}) gets 403 on /api/ops/*`);
      } else {
        console.log('  skip  LAN request could not connect');
      }
    } else {
      console.log('  skip  no LAN interface for the live non-loopback check');
    }

    const k = await fetch(`${base}/api/kill/status`).then(r => r.json());
    assert.strictEqual(k.date, istDateStr());
    ok('kill status is keyed by the IST date');

    const st = await fetch(`${base}/api/ops/state`, { method: 'POST', body: JSON.stringify({ schema: 1, tabId: 't', at: Date.now(), engines: {}, positions: [] }) });
    assert.strictEqual(st.status, 200);
    const got = await fetch(`${base}/api/ops/state`).then(r => r.json());
    assert.strictEqual(got.stale, false);
    assert.strictEqual(got.snapshot.tabId, 't');
    assert.ok(existsSync(join(root, istDateStr(), 'state.jsonl')));
    ok('POST/GET /api/ops/state round-trips and writes state.jsonl');
  } catch (err) {
    console.log(serverLog.slice(-2000));
    throw err;
  } finally {
    server.kill();
    rmSync(root, { recursive: true, force: true });
  }

  console.log(`\n✅ PASS — ${passed} journal endpoint checks\n`);
}

run().catch(err => {
  console.error('❌ FAIL', err);
  process.exit(1);
});
