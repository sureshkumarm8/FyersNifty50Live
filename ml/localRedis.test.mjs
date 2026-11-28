/**
 * scripts/localRedisServer.mjs keeps under its limit: TTLs honoured, expired keys
 * dropped, a hard size cap that evicts only TTL'd cache keys (oldest snapshot first).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let failures = 0;
const check = (name, cond, detail = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`); if (!cond) failures++; };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'localredis-'));
const file = path.join(dir, 'db.json');
const now = Date.now();
// Old-format file: two stale snapshots (no TTL recorded), a fresh one, a token without TTL.
fs.writeFileSync(file, JSON.stringify({
  strings: { [`snapshot:${now - 3 * 86_400_000}`]: 'old', [`snapshot:${now - 2 * 86_400_000}`]: 'old', [`snapshot:${now - 60_000}`]: 'fresh', 'paytm:token': 'keep-me', 'snapshot:latest': 'L' },
  sortedSets: { 'snapshots:index': [] }
}));
const PORT = 5000 + Math.floor(Math.random() * 900) + 5100;
const proc = spawn(process.execPath, ['scripts/localRedisServer.mjs'], { env: { ...process.env, LOCAL_REDIS_FILE: file, LOCAL_REDIS_PORT: String(PORT), LOCAL_REDIS_MAX_MB: '8' }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
proc.stdout.on('data', d => { log += d; });
const cmd = async c => (await (await fetch(`http://127.0.0.1:${PORT}`, { method: 'POST', body: JSON.stringify(c) })).json()).result;
const sleep = ms => new Promise(r => setTimeout(r, ms));

try {
  for (let i = 0; i < 40 && !/running at/.test(log); i++) await sleep(100);
  check('startup drops snapshots older than 24 h', /Dropped 2 expired/.test(log), log.split('\n').find(l => /Dropped/.test(l)));
  check('fresh snapshot, token and latest survive', (await cmd(['get', `snapshot:${now - 60_000}`])) === 'fresh' && (await cmd(['get', 'paytm:token'])) === 'keep-me' && (await cmd(['get', 'snapshot:latest'])) === 'L');

  await cmd(['set', 'short', 'v', 'ex', 1]);
  check('EX is recorded', (await cmd(['ttl', 'short'])) === 1);
  await sleep(1200);
  check('key is gone after its EX', (await cmd(['get', 'short'])) === null);
  await cmd(['set', 'obj', 'v', { ex: 100 }]);
  check('Upstash options object {ex} is honoured', (await cmd(['ttl', 'obj'])) > 90);
  check('NX does not overwrite', (await cmd(['set', 'paytm:token', 'x', 'nx'])) === null && (await cmd(['get', 'paytm:token'])) === 'keep-me');
  check('plain SET clears an old TTL', (await cmd(['set', 'obj', 'v2']), await cmd(['ttl', 'obj'])) === -1);

  // Cap: 8 MB. Write 20 snapshots of 1 MB each with a 24 h TTL.
  const big = 'x'.repeat(1024 * 1024);
  for (let i = 0; i < 20; i++) await cmd(['set', `snapshot:${now + i}`, big, 'ex', 86400]);
  const keys = (await cmd(['scan', 0, 'match', 'snapshot:*']))[1];
  const kept = keys.filter(k => /^snapshot:\d+$/.test(k)).map(k => Number(k.split(':')[1])).sort((a, b) => a - b);
  check('size cap holds: at most ~8 MB of snapshots kept', kept.length <= 8 && kept.length >= 5, `${kept.length} kept`);
  check('the newest snapshot is kept, the oldest evicted', kept.includes(now + 19) && !kept.includes(now));
  check('keys without a TTL are never evicted', (await cmd(['get', 'paytm:token'])) === 'keep-me' && (await cmd(['get', 'snapshot:latest'])) === 'L');

  await cmd(['zadd', 'snapshots:index', { score: 1, member: 'a' }, { score: 2, member: 'b' }]);
  check('sorted sets still work', JSON.stringify(await cmd(['zrange', 'snapshots:index', 0, -1])) === '["a","b"]');
  check('scan with match works', (await cmd(['scan', 0, { match: 'paytm:*' }]))[1].join() === 'paytm:token');
} finally {
  proc.kill('SIGTERM');
  await sleep(300);
}
const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
check('file is saved compact with TTLs on shutdown', saved.expires && !fs.readFileSync(file, 'utf8').includes('\n  '), `${fs.statSync(file).size} bytes`);
fs.rmSync(dir, { recursive: true, force: true });
if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall local redis checks passed');
