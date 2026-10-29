/**
 * PROGRESS WORDING for the live preview in the Nifty50Ops chat.
 *
 * While the agent works, the tab shows what it is doing ("Checking system
 * health… 7/8 OK, Redis failing") instead of a spinner. These are short,
 * deterministic summaries of tool results — facts the user can watch arrive.
 * The answer itself still appears only after the post-check.
 */

const LABELS = {
  get_system_health: 'Checking system health',
  get_app_state: 'Reading the app snapshot',
  get_market_snapshot: 'Reading the latest market snapshot',
  get_journal: 'Reading the journal',
  get_premarket_decision: "Reading today's pre-market plan",
  get_vision_status: 'Checking the vision sidecar',
  get_day_scorecard: "Scoring the day's trades",
  run_preflight: 'Running the pre-flight checks',
  pull_premarket_charts: 'Pulling pre-market charts',
  notify: 'Sending a notification',
  write_debrief: 'Writing the debrief'
};

export function toolLabel(name, args = {}) {
  const base = LABELS[name] ?? `Calling ${name}`;
  if (name === 'get_journal' && args?.stream) {
    return `${base}: ${args.stream}${args.since ? ` since ${args.since}` : ''}${args.date ? ` (${args.date})` : ''}`;
  }
  if (name === 'get_day_scorecard' && args?.date) return `${base} (${args.date})`;
  return base;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One line, at most ~120 chars, describing what a tool returned. Never throws. */
export function summariseResult(name, r) {
  try {
    if (!r || typeof r !== 'object') return 'no data';
    if (r.error) return `failed: ${String(r.error).slice(0, 100)}`;
    switch (name) {
      case 'get_system_health': {
        const checks = r.checks || [];
        const bad = checks.filter(c => !c.ok).map(c => c.label || c.id);
        return `${checks.length - bad.length}/${checks.length} OK${bad.length ? ` · not OK: ${bad.join(', ')}` : ''}`;
      }
      case 'get_app_state': {
        const s = r.snapshot;
        if (!s) return 'no app tab has reported';
        const e = s.engines || {};
        return [
          r.stale ? `STALE (${r.ageSec}s old)` : `${r.ageSec}s old`,
          e.autotrade?.mode,
          e.autotrade?.killed ? 'kill LATCHED' : null,
          `Sniper ${e.sniper?.state ?? '?'}`,
          `Momentum ${e.momentum?.state ?? '?'}`,
          plural((s.positions || []).length, 'position')
        ].filter(Boolean).join(' · ');
      }
      case 'get_market_snapshot':
        return `Nifty ${r.niftyLtp ?? '?'} · ${r.advances ?? '?'} up / ${r.declines ?? '?'} down · ${r.ageSec ?? '?'}s old`;
      case 'get_journal':
        return `${plural(r.count ?? 0, `${r.stream} row`)}${r.date ? ` for ${r.date}` : ''}`;
      case 'get_premarket_decision':
        return `${plural((r.cuts || []).length, 'saved cut')} · app plan dated today: ${r.appHolds?.datedToday ? 'yes' : 'no'}`;
      case 'get_vision_status':
        return r.latest
          ? `last run ${r.latest.finishedAt ?? '?'} (${r.latest.ageMin ?? '?'} min ago) · ${r.latest.bias ?? 'no verdict'}${r.identicalToPrevious?.length ? ' · frozen shots' : ''}`
          : 'no runs yet';
      case 'get_day_scorecard':
        return `${plural(r.metrics?.totalTrades ?? 0, 'trade')} · net ₹${r.metrics?.netPnl ?? 0}`;
      case 'run_preflight':
        return r.ok ? `passed${r.warnings?.length ? ` · warnings: ${r.warnings.join(', ')}` : ''}` : `FAILED: ${(r.failedCritical || []).join(', ')}`;
      case 'pull_premarket_charts':
        return r.ok ? `${r.accepted} chart(s) accepted${r.rejected?.length ? `, ${r.rejected.length} rejected` : ''}` : 'no usable charts';
      case 'notify':
        return r.sent ? 'sent' : 'not sent';
      case 'write_debrief':
        return `written · ${plural(r.trades ?? 0, 'trade')}, ${plural(r.gaps ?? 0, 'data gap')}`;
      default:
        return `returned ${Object.keys(r).slice(0, 4).join(', ')}`;
    }
  } catch {
    return 'done';
  }
}
