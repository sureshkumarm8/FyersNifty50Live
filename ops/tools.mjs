/**
 * TOOL REGISTRY — everything the Nifty50Ops agent can do, and nothing else.
 *
 * Each tool is `{ name, tier, description, parameters, run(args, ctx) }`.
 * `ctx.client` (ops/client.mjs) is the only network route a tool has; it is
 * bound to this machine's server and refuses order placement at any level.
 *
 * Results carry `asOf` timestamps so the answer can cite its source and age.
 * The protective `latch_kill_switch` tool is milestone M5 and is not here.
 */

import { readJournal, BROWSER_STREAMS, SERVER_STREAMS } from './journal.mjs';
import { runPreflight, checkLotSize, checkExpiry, checkServer, checkToken, checkKill, checkSidecar, checkRedis } from './preflight.mjs';
import { gradeDay } from './scorecard.mjs';
import { pullPremarketCharts } from './charts.mjs';
import { writeDebrief } from './debrief.mjs';
import { istDateStr, istTimeStr } from './time.mjs';

const READABLE_STREAMS = [...BROWSER_STREAMS, ...SERVER_STREAMS];
const ist = ms => (Number.isFinite(ms) && ms > 0 ? `${istTimeStr(ms)} IST` : null);

/** "10:42" (IST, today) or epoch ms → epoch ms. */
export function parseSince(since, date = istDateStr()) {
  if (since === undefined || since === null || since === '') return 0;
  if (typeof since === 'number') return since;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(since).trim());
  if (m) return Date.parse(`${date}T${m[1].padStart(2, '0')}:${m[2]}:00+05:30`);
  const n = Number(since);
  return Number.isFinite(n) ? n : 0;
}

/** Drop the full snapshot body from state rows; the agent asks get_app_state for that. */
function compactRow(stream, row) {
  if (stream === 'state' && row.snapshot) {
    const s = row.snapshot;
    return {
      timestamp: row.timestamp, at: ist(row.timestamp), spot: s.market?.spot, quoteAgeSec: s.market?.quoteAgeSec,
      mode: s.engines?.autotrade?.mode, killed: s.engines?.autotrade?.killed, positions: s.positions?.length ?? 0,
      sniper: s.engines?.sniper?.state, momentum: s.engines?.momentum?.state
    };
  }
  return { at: ist(row.timestamp), ...row };
}

export const TOOLS = [
  {
    name: 'get_system_health',
    tier: 'read',
    description: 'Health of every subsystem right now: server, broker token, kill switch, vision sidecar, Redis, lot size, weekly expiry, and how long ago the app tab last reported.',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      const get = ctx.client.get;
      const [server, token, kill, sidecar, redis, expiry, state] = await Promise.all([
        checkServer(get), checkToken(get), checkKill(get), checkSidecar(get), checkRedis(), checkExpiry(), get('/api/ops/state')
      ]);
      const appAge = state.json?.ageSec ?? null;
      const app = {
        id: 'app', label: 'App tab reporting', critical: false,
        ok: Boolean(state.json?.snapshot) && !state.json?.stale,
        detail: state.json?.snapshot ? `last snapshot ${appAge} s ago (${ist(state.json.receivedAt)})` : 'no app tab has reported'
      };
      return { asOf: ist(ctx.now()), checks: [server, token, kill, sidecar, redis, checkLotSize(), expiry, app] };
    }
  },
  {
    name: 'get_app_state',
    tier: 'read',
    description: 'The latest snapshot the app tab published: trading mode, kill state, engine states (Sniper, Momentum, Opening Pilot), open positions with stops, pre-market plan date, vision status. Includes its age; a stale snapshot means the tab is not reporting.',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      const r = await ctx.client.get('/api/ops/state');
      if (!r.ok || !r.json) return { error: `state unavailable (${r.error || `HTTP ${r.status}`})` };
      return { asOf: ist(r.json.receivedAt), ageSec: r.json.ageSec, stale: r.json.stale, snapshot: r.json.snapshot };
    }
  },
  {
    name: 'get_market_snapshot',
    tier: 'read',
    description: 'Latest market snapshot stored in Redis (written by the app or the failover fetcher): Nifty spot, advances/declines across the Nifty 50, option-chain size, with its timestamp and age.',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      const r = await ctx.client.get('/api/get-redis-data');
      const d = r.json?.data;
      if (!r.ok || !d) return { error: r.json?.error || r.error || `HTTP ${r.status}` };
      const ts = d.timestamp ?? null;
      const stocks = Array.isArray(d.stocks) ? d.stocks : [];
      return {
        source: `redis snapshot:latest (${d.source ?? 'unknown'})`,
        asOf: ist(ts),
        ageSec: ts ? Math.round((ctx.now() - ts) / 1000) : null,
        niftyLtp: d.niftyLTP ?? d.niftyLtp ?? null,
        advances: stocks.filter(s => Number(s.ch) > 0).length,
        declines: stocks.filter(s => Number(s.ch) < 0).length,
        stockCount: d.stockCount ?? stocks.length,
        optionsCount: d.optionsCount ?? null
      };
    }
  },
  {
    name: 'get_journal',
    tier: 'read',
    description: `Rows from today's (or another day's) journal stream. Streams: ${READABLE_STREAMS.join(', ')}. decisions = Sniper/Pilot verdict changes; gates = Momentum gate changes; orders/fills/exits = trades; alerts = safety alerts; ops = this agent's own audit. Newest rows are kept when limited.`,
    parameters: {
      type: 'object',
      properties: {
        stream: { type: 'string', enum: READABLE_STREAMS },
        since: { type: 'string', description: 'IST time "HH:MM" to start from (optional)' },
        limit: { type: 'integer', description: 'Max rows, newest kept (default 50, max 200)' },
        date: { type: 'string', description: 'YYYY-MM-DD (IST); default today' }
      },
      required: ['stream']
    },
    async run(args) {
      const stream = String(args?.stream || '');
      if (!READABLE_STREAMS.includes(stream)) return { error: `unknown stream ${stream}` };
      const date = /^\d{4}-\d{2}-\d{2}$/.test(args?.date || '') ? args.date : istDateStr();
      const limit = Math.max(1, Math.min(200, Number(args?.limit) || 50));
      const rows = readJournal(stream, { date, since: parseSince(args?.since, date), limit });
      return { stream, date, count: rows.length, rows: rows.map(r => compactRow(stream, r)) };
    }
  },
  {
    name: 'get_premarket_decision',
    tier: 'read',
    description: "Today's pre-market plan: every saved cut (time, basis, verdict, bias, levels) and whether the app currently holds a plan dated today.",
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      const date = istDateStr(ctx.now());
      const cuts = readJournal('premarket', { date, limit: 20 }).map(r => compactRow('premarket', r));
      const state = await ctx.client.get('/api/ops/state');
      const pm = state.json?.snapshot?.premarket ?? null;
      return {
        date,
        cuts,
        appHolds: pm ? { ...pm, generatedAtIst: ist(pm.generatedAt), datedToday: pm.decisionDate === date } : null,
        appStateAgeSec: state.json?.ageSec ?? null
      };
    }
  },
  {
    name: 'get_vision_status',
    tier: 'read',
    description: 'Vision capture sidecar: scheduler status, the latest run (time, bias, shots), and a staleness check (a shot byte-identical to the previous run means the page did not refresh).',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      const [status, history] = await Promise.all([ctx.client.get('/api/vision/status'), ctx.client.get('/api/vision/history?limit=2')]);
      if (!status.ok) return { error: status.json?.message || status.error || `sidecar HTTP ${status.status}` };
      const runs = Array.isArray(history.json) ? history.json : [];
      const [latest, previous] = runs;
      const finished = latest ? Date.parse(latest.finishedAt) : null;
      const frozen = latest && previous
        ? (latest.shots || []).filter(s => s.ok && s.bytes && (previous.shots || []).some(p => p.id === s.id && p.bytes === s.bytes)).map(s => s.id)
        : [];
      return {
        asOf: ist(ctx.now()),
        status: status.json,
        latest: latest
          ? {
              id: latest.id, finishedAt: ist(finished), ageMin: finished ? Math.round((ctx.now() - finished) / 60000) : null,
              bias: latest.analysis?.parsed?.bias ?? null, readable: latest.analysis?.parsed?.readable ?? null,
              shots: (latest.shots || []).map(s => ({ id: s.id, ok: s.ok, bytes: s.bytes ?? null, awaitingLogin: s.awaitingLogin ?? false }))
            }
          : null,
        identicalToPrevious: frozen
      };
    }
  },
  {
    name: 'get_day_scorecard',
    tier: 'read',
    description: 'Measured results for a day from the journal: trades, wins/losses, Wilson interval, profit factor, net P&L, per strategy. Reports results only; it is not evidence of edge on small samples.',
    parameters: { type: 'object', properties: { date: { type: 'string', description: 'YYYY-MM-DD (IST); default today' } } },
    async run(args, ctx) {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(args?.date || '') ? args.date : istDateStr(ctx.now());
      const { card } = gradeDay(date, { write: false });
      return { ...card, trades: card.trades.slice(-20).map(t => ({ ...t, at: ist(t.at) })) };
    }
  },
  {
    name: 'run_preflight',
    tier: 'ops',
    description: 'Run the full pre-flight (lot size, expiry, disk, server, token, kill switch, Redis, sidecar, app) and report pass/fail per check.',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      return runPreflight({ get: ctx.client.get, today: istDateStr(ctx.now()) });
    }
  },
  {
    name: 'pull_premarket_charts',
    tier: 'ops',
    description: 'Ask the vision sidecar to capture the pre-market chart set and verify each file (size, and not byte-identical to the previous pull). Limited to once per 10 minutes.',
    parameters: { type: 'object', properties: {} },
    async run(_args, ctx) {
      return pullPremarketCharts({ post: ctx.client.post, getBytes: ctx.client.getBytes });
    }
  },
  {
    name: 'notify',
    tier: 'ops',
    description: 'Send a notification (macOS, plus Telegram if configured). One per minute per topic.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Short topic key, e.g. "preflight", "charts", "watchdog"' },
        title: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['topic', 'title', 'message']
    },
    async run(args, ctx) {
      const title = String(args?.title || '').slice(0, 80);
      const message = String(args?.message || '').slice(0, 600);
      if (!title || !message) return { error: 'title and message are required' };
      await ctx.notify(title, message);
      ctx.audit?.notify(String(args.topic || 'general'), title, message, true);
      return { sent: true, at: ist(ctx.now()) };
    }
  },
  {
    name: 'write_debrief',
    tier: 'ops',
    description: "Write today's debrief.md from the journal (what happened, what was skipped and why, data gaps). Optional `narrative` is appended as a clearly labelled model-written section; it must not recommend parameter changes.",
    parameters: { type: 'object', properties: { narrative: { type: 'string' } } },
    async run(args, ctx) {
      const { path, data } = writeDebrief(istDateStr(ctx.now()), args?.narrative ? String(args.narrative).slice(0, 4000) : null);
      return { path, trades: data.card.metrics.totalTrades, gaps: data.gaps.length, alerts: data.alerts.length };
    }
  }
];

export const TOOL_BY_NAME = new Map(TOOLS.map(t => [t.name, t]));

/** Tools visible to a session at `level`: the model is never shown what it cannot call. */
export function toolsForLevel(level, tiers = { read: 0, ops: 1, protective: 2 }) {
  return TOOLS.filter(t => tiers[t.tier] <= level);
}
