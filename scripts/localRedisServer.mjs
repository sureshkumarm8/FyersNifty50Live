import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = process.env.LOCAL_REDIS_FILE || path.join(__dirname, '..', 'data', 'local_redis.json');

const PORT = Number(process.env.LOCAL_REDIS_PORT) || 5055;

// In-memory database with disk persistence
let db = {
  strings: {},
  sortedSets: {}
};

try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    db = JSON.parse(raw);
    if (!db.strings) db.strings = {};
    if (!db.sortedSets) db.sortedSets = {};
    if (!db.expires) db.expires = {};
    const stringKeys = Object.keys(db.strings).length;
    const zsetKeys = Object.keys(db.sortedSets).length;
    console.log(`[LocalRedis] Loaded from ${DATA_FILE} (${stringKeys} strings, ${zsetKeys} sorted sets)`);
  }
} catch (e) {
  console.warn('[LocalRedis] Could not load persisted data:', e.message);
}

// --- limits ---------------------------------------------------------------
// Real Redis/Upstash drops keys at their TTL; this stand-in used to ignore EX, so every
// `snapshot:<ts>` (~64 KB, set with ex: 86400) piled up forever (94 MB by 2026-11-27).
// Now: TTLs are honoured, expired keys are swept every minute, and the total stays under
// LOCAL_REDIS_MAX_MB (default 64) by evicting the oldest keys that carry a TTL (caches),
// never a key without one (tokens, config).
const MAX_BYTES = Math.max(8, Number(process.env.LOCAL_REDIS_MAX_MB) || 64) * 1024 * 1024;
const SAVE_DEBOUNCE_MS = 5000;

const sizeOf = key => (db.strings[key] === undefined ? 0 : String(db.strings[key]).length + key.length);
let totalBytes = 0;
function recount() {
  totalBytes = Object.keys(db.strings).reduce((n, k) => n + sizeOf(k), 0);
}

function isExpired(key, now = Date.now()) {
  const at = db.expires[key];
  return at !== undefined && at <= now;
}

function dropKey(key) {
  if (db.strings[key] !== undefined) {
    totalBytes -= sizeOf(key);
    delete db.strings[key];
  }
  delete db.sortedSets[key];
  delete db.expires[key];
}

function sweepExpired(now = Date.now()) {
  let n = 0;
  for (const key of Object.keys(db.expires)) {
    if (db.expires[key] <= now) { dropKey(key); n++; }
  }
  return n;
}

/** Evict TTL'd keys, oldest `snapshot:<ts>` first then soonest-expiring, until under the cap. */
function enforceCap() {
  if (totalBytes <= MAX_BYTES) return 0;
  const victims = Object.keys(db.expires)
    .filter(k => db.strings[k] !== undefined)
    .sort((a, b) => {
      const sa = /^snapshot:(\d+)$/.exec(a), sb = /^snapshot:(\d+)$/.exec(b);
      if (sa && sb) return Number(sa[1]) - Number(sb[1]);
      if (sa) return -1;
      if (sb) return 1;
      return db.expires[a] - db.expires[b];
    });
  let n = 0;
  for (const k of victims) {
    if (totalBytes <= MAX_BYTES * 0.9) break;
    dropKey(k);
    n++;
  }
  if (n) console.log(`[LocalRedis] Cap ${Math.round(MAX_BYTES / 1048576)} MB: evicted ${n} cached key(s), now ${(totalBytes / 1048576).toFixed(1)} MB`);
  return n;
}

let saveTimer = null;
function saveNow() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db));
  } catch (e) {
    console.error('[LocalRedis] Save error:', e.message);
  }
}
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow();
  }, SAVE_DEBOUNCE_MS);
}

/** Parse SET options (EX/PX/EXAT/PXAT/KEEPTTL/NX/XX), upper or lower case, or an Upstash options object. */
function parseSetOptions(args) {
  const o = { expireAt: undefined, keepTtl: false, nx: false, xx: false };
  const now = Date.now();
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a && typeof a === 'object') {
      if (a.ex) o.expireAt = now + Number(a.ex) * 1000;
      if (a.px) o.expireAt = now + Number(a.px);
      if (a.exat) o.expireAt = Number(a.exat) * 1000;
      if (a.pxat) o.expireAt = Number(a.pxat);
      if (a.keepTtl) o.keepTtl = true;
      if (a.nx) o.nx = true;
      if (a.xx) o.xx = true;
      continue;
    }
    const s = String(a).toLowerCase();
    const next = Number(args[i + 1]);
    if (s === 'ex') { o.expireAt = now + next * 1000; i++; }
    else if (s === 'px') { o.expireAt = now + next; i++; }
    else if (s === 'exat') { o.expireAt = next * 1000; i++; }
    else if (s === 'pxat') { o.expireAt = next; i++; }
    else if (s === 'keepttl') o.keepTtl = true;
    else if (s === 'nx') o.nx = true;
    else if (s === 'xx') o.xx = true;
  }
  return o;
}

function globToRegExp(glob) {
  return new RegExp('^' + String(glob).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
}

function executeCommand(cmd) {
  if (!Array.isArray(cmd) || cmd.length === 0) {
    return null;
  }
  const op = String(cmd[0]).toLowerCase();

  if (op === 'get') {
    const key = String(cmd[1]);
    if (isExpired(key)) { dropKey(key); scheduleSave(); return null; }
    const val = db.strings[key];
    if (val === undefined) return null;
    return val;
  }

  if (op === 'set') {
    const key = String(cmd[1]);
    let val = cmd[2];
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    } else {
      val = String(val);
    }
    const opts = parseSetOptions(cmd.slice(3));
    if (isExpired(key)) dropKey(key);
    const exists = db.strings[key] !== undefined;
    if ((opts.nx && exists) || (opts.xx && !exists)) return null;
    totalBytes -= sizeOf(key);
    db.strings[key] = val;
    totalBytes += sizeOf(key);
    if (opts.expireAt !== undefined) db.expires[key] = opts.expireAt;
    else if (!opts.keepTtl) delete db.expires[key];
    enforceCap();
    scheduleSave();
    return 'OK';
  }

  if (op === 'expire' || op === 'pexpire') {
    const key = String(cmd[1]);
    if (db.strings[key] === undefined && db.sortedSets[key] === undefined) return 0;
    db.expires[key] = Date.now() + Number(cmd[2]) * (op === 'expire' ? 1000 : 1);
    scheduleSave();
    return 1;
  }

  if (op === 'ttl') {
    const key = String(cmd[1]);
    if (isExpired(key)) dropKey(key);
    if (db.strings[key] === undefined && db.sortedSets[key] === undefined) return -2;
    return db.expires[key] === undefined ? -1 : Math.ceil((db.expires[key] - Date.now()) / 1000);
  }

  if (op === 'dbsize') {
    sweepExpired();
    return Object.keys(db.strings).length + Object.keys(db.sortedSets).length;
  }

  if (op === 'scan') {
    // Single pass: cursor 0 in, every match out, cursor "0" back.
    let match = '*';
    for (let i = 2; i < cmd.length; i++) {
      const a = cmd[i];
      if (a && typeof a === 'object' && a.match) match = a.match;
      if (String(a).toLowerCase() === 'match') match = cmd[i + 1];
    }
    sweepExpired();
    const re = globToRegExp(match);
    return ['0', [...Object.keys(db.strings), ...Object.keys(db.sortedSets)].filter(k => re.test(k))];
  }

  if (op === 'del') {
    let count = 0;
    for (let i = 1; i < cmd.length; i++) {
      const k = String(cmd[i]);
      if (db.strings[k] !== undefined || db.sortedSets[k] !== undefined) count++;
      dropKey(k);
    }
    if (count > 0) scheduleSave();
    return count;
  }

  if (op === 'zadd') {
    const key = String(cmd[1]);
    if (!db.sortedSets[key]) {
      db.sortedSets[key] = [];
    }
    const set = db.sortedSets[key];
    let added = 0;

    let idx = 2;
    // Skip options like "nx", "xx", "ch", "incr", "lt", "gt" if present
    while (idx < cmd.length && typeof cmd[idx] === 'string' && ['nx', 'xx', 'ch', 'incr', 'lt', 'gt'].includes(cmd[idx].toLowerCase())) {
      idx++;
    }

    while (idx < cmd.length) {
      const item = cmd[idx];
      if (typeof item === 'object' && item !== null && 'score' in item && 'member' in item) {
        const score = Number(item.score);
        const member = String(item.member);
        const existingIdx = set.findIndex(x => x.member === member);
        if (existingIdx >= 0) {
          set[existingIdx].score = score;
        } else {
          set.push({ score, member });
          added++;
        }
        idx++;
      } else if (idx + 1 < cmd.length) {
        const score = Number(cmd[idx]);
        const member = String(cmd[idx + 1]);
        const existingIdx = set.findIndex(x => x.member === member);
        if (existingIdx >= 0) {
          set[existingIdx].score = score;
        } else {
          set.push({ score, member });
          added++;
        }
        idx += 2;
      } else {
        idx++;
      }
    }

    set.sort((a, b) => a.score - b.score);
    scheduleSave();
    return added;
  }

  if (op === 'zrange') {
    const key = String(cmd[1]);
    const set = db.sortedSets[key] || [];
    let start = Number(cmd[2]);
    let stop = Number(cmd[3]);

    let rev = false;
    let withScores = false;

    for (let i = 4; i < cmd.length; i++) {
      const opt = cmd[i];
      if (typeof opt === 'string') {
        const s = opt.toLowerCase();
        if (s === 'rev') rev = true;
        if (s === 'withscores') withScores = true;
      } else if (typeof opt === 'object' && opt !== null) {
        if (opt.rev) rev = true;
        if (opt.withScores) withScores = true;
      }
    }

    let items = [...set];
    if (rev) {
      items.reverse();
    }

    const len = items.length;
    if (len === 0) return [];

    if (start < 0) start = Math.max(0, len + start);
    if (stop < 0) stop = len + stop;
    else stop = Math.min(len - 1, stop);

    if (start > stop || start >= len) return [];

    const sliced = items.slice(start, stop + 1);
    if (withScores) {
      const result = [];
      sliced.forEach(item => {
        result.push(item.member, item.score);
      });
      return result;
    }
    return sliced.map(item => item.member);
  }

  if (op === 'zremrangebyrank') {
    const key = String(cmd[1]);
    const set = db.sortedSets[key] || [];
    let start = Number(cmd[2]);
    let stop = Number(cmd[3]);
    const len = set.length;
    if (len === 0) return 0;

    if (start < 0) start = Math.max(0, len + start);
    if (stop < 0) stop = len + stop;
    else stop = Math.min(len - 1, stop);

    if (start > stop || start >= len) return 0;

    const removed = set.splice(start, stop - start + 1);
    scheduleSave();
    return removed.length;
  }

  if (op === 'zcard') {
    const key = String(cmd[1]);
    return (db.sortedSets[key] || []).length;
  }

  console.warn(`[LocalRedis] Unhandled op: ${op}`);
  return 'OK';
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      let parsed = null;
      if (body) {
        parsed = JSON.parse(body);
      }

      const urlPath = req.url.split('?')[0].replace(/^\/+|\/+$/g, '');

      // Pipeline execution
      if (urlPath === 'pipeline') {
        const commands = Array.isArray(parsed) ? parsed : [];
        const results = commands.map(c => {
          try {
            return { result: executeCommand(c) };
          } catch (err) {
            return { error: err.message };
          }
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(results));
        return;
      }

      // Single command execution
      let cmd = null;
      if (Array.isArray(parsed)) {
        cmd = parsed;
      } else if (urlPath) {
        cmd = urlPath.split('/').map(decodeURIComponent);
      }

      if (cmd) {
        const result = executeCommand(cmd);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: 'OK' }));
    } catch (err) {
      console.error('[LocalRedis] Request error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

// Old data was saved without TTLs: give every snapshot:<ts> its 24 h expiry from its own timestamp.
for (const k of Object.keys(db.strings)) {
  const m = /^snapshot:(\d+)$/.exec(k);
  if (m && db.expires[k] === undefined) db.expires[k] = Number(m[1]) + 86_400_000;
}
recount();
const startSwept = sweepExpired();
enforceCap();
if (startSwept) { console.log(`[LocalRedis] Dropped ${startSwept} expired key(s) at start`); saveNow(); }
console.log(`[LocalRedis] ${(totalBytes / 1048576).toFixed(1)} MB in use, cap ${Math.round(MAX_BYTES / 1048576)} MB`);

setInterval(() => {
  const n = sweepExpired();
  if (n) { console.log(`[LocalRedis] Expired ${n} key(s), ${(totalBytes / 1048576).toFixed(1)} MB in use`); scheduleSave(); }
}, 60_000).unref();

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { if (saveTimer) { clearTimeout(saveTimer); saveNow(); } process.exit(0); });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [LocalRedis] Local Upstash-compatible Redis server running at http://127.0.0.1:${PORT}`);
});
