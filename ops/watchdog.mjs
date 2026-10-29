/**
 * WATCHDOG RULES — plain code, no LLM.
 *
 * Runs every 30 s during market hours. Each rule looks at the latest app
 * snapshot (and, in LIVE mode, the broker's open positions) and returns
 * alerts. The model never decides whether something is wrong; at most it is
 * asked to word an alert that this file already raised.
 *
 * Alerts are de-duplicated per rule+subject for 10 minutes; the kill-switch
 * alert fires once per day.
 */

import { istDateStr } from './time.mjs';

export const DEDUPE_MS = 10 * 60_000;
export const APP_SILENT_SEC = 60;
export const QUOTE_STALE_SEC = 90;
export const MISMATCH_GRACE_MS = 10_000;

export function emptyWatchdogMemory() {
  return { lastFired: {}, mismatchSince: null };
}

/**
 * @param input {{ now: number, state: { snapshot: object|null, ageSec: number|null },
 *                 brokerOpenCount?: number|null }}
 * @returns {{ alerts: Array<{rule,key,severity,message}>, memory: object }}
 */
export function evaluateWatchdog(input, memory = emptyWatchdogMemory()) {
  const { now, state } = input;
  const next = { lastFired: { ...memory.lastFired }, mismatchSince: memory.mismatchSince };
  const raised = [];
  const raise = (rule, key, severity, message) => raised.push({ rule, key: `${rule}:${key}`, severity, message });

  const snap = state?.snapshot ?? null;
  const ageSec = state?.ageSec ?? null;

  // 1. The app is not reporting: tab closed, frozen, or the Mac slept.
  if (!snap || ageSec === null || ageSec > APP_SILENT_SEC) {
    raise('app_silent', 'app', 'critical',
      snap
        ? `App tab has not reported for ${Math.round(ageSec)} s (sleep? tab closed?). Check \`pmset -g log\` for a sleep at this time.`
        : 'No app tab has reported since the server started. Open the app and keep the tab running.');
  }

  if (snap) {
    const positions = Array.isArray(snap.positions) ? snap.positions : [];
    const live = positions.filter(p => p.book === 'live');

    // 2. A live position with no stop at all.
    for (const p of live) {
      if (p.stop === undefined || p.stop === null || !Number.isFinite(Number(p.stop))) {
        raise('live_no_stop', p.symbol, 'critical', `LIVE position ${p.symbol} (${p.strategy}, qty ${p.qty}) has no stop.`);
      }
    }

    // 3. Holding a position on a stale quote.
    const quoteAge = snap.market?.quoteAgeSec;
    if (positions.length > 0 && (quoteAge === null || quoteAge === undefined || quoteAge > QUOTE_STALE_SEC)) {
      raise('quote_stale', 'market', 'warning',
        `${positions.length} open position(s) but the last quote is ${quoteAge == null ? 'unknown' : `${quoteAge} s`} old.`);
    }

    // 4. Broker and app disagree on open positions (LIVE only).
    const liveMode = snap.engines?.autotrade?.mode === 'LIVE';
    const brokerCount = input.brokerOpenCount;
    if (liveMode && Number.isFinite(brokerCount) && brokerCount !== live.length) {
      if (next.mismatchSince === null) next.mismatchSince = now;
      if (now - next.mismatchSince > MISMATCH_GRACE_MS) {
        raise('broker_mismatch', 'positions', 'critical',
          `Broker holds ${brokerCount} open position(s), the app holds ${live.length}, for ${Math.round((now - next.mismatchSince) / 1000)} s.`);
      }
    } else {
      next.mismatchSince = null;
    }

    // 5. Kill switch latched — once per day.
    if (snap.engines?.autotrade?.killed) {
      raise('kill_latched', istDateStr(now), 'critical', 'Kill switch is latched for today. AutoTrade is disarmed.');
    }
  }

  const alerts = [];
  for (const a of raised) {
    const last = next.lastFired[a.key];
    const window = a.rule === 'kill_latched' ? Infinity : DEDUPE_MS;
    if (last !== undefined && now - last < window) continue;
    next.lastFired[a.key] = now;
    alerts.push(a);
  }
  return { alerts, memory: next };
}

/** Broker positions endpoints answer in two shapes; count non-zero net quantities. */
export function countBrokerOpen(json) {
  const rows = json?.netPositions || json?.data || (Array.isArray(json) ? json : []);
  return Array.isArray(rows) ? rows.filter(p => Number(p.netQty ?? p.net_qty ?? p.quantity ?? 0) !== 0).length : null;
}
