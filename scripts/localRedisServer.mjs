import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'local_redis.json');

const PORT = 5055;

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
    const stringKeys = Object.keys(db.strings).length;
    const zsetKeys = Object.keys(db.sortedSets).length;
    console.log(`[LocalRedis] Loaded from ${DATA_FILE} (${stringKeys} strings, ${zsetKeys} sorted sets)`);
  }
} catch (e) {
  console.warn('[LocalRedis] Could not load persisted data:', e.message);
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error('[LocalRedis] Save error:', e.message);
    }
  }, 500);
}

function executeCommand(cmd) {
  if (!Array.isArray(cmd) || cmd.length === 0) {
    return null;
  }
  const op = String(cmd[0]).toLowerCase();

  if (op === 'get') {
    const key = String(cmd[1]);
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
    db.strings[key] = val;
    scheduleSave();
    return 'OK';
  }

  if (op === 'del') {
    let count = 0;
    for (let i = 1; i < cmd.length; i++) {
      const k = String(cmd[i]);
      if (db.strings[k] !== undefined) {
        delete db.strings[k];
        count++;
      }
      if (db.sortedSets[k] !== undefined) {
        delete db.sortedSets[k];
        count++;
      }
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 [LocalRedis] Local Upstash-compatible Redis server running at http://127.0.0.1:${PORT}`);
});
