/**
 * EOD DEBRIEF — what happened today, what was skipped and why, and where the
 * data has holes. Facts come from the journal; the optional narrative is the
 * only LLM-written part and is labelled as such.
 *
 * Deliberately absent: "lessons" that retune thresholds. Three days of data
 * showed no proven edge, so a debrief that suggests parameter changes would
 * be fitting noise.
 */

import { join } from 'node:path';
import { readJsonl, writeJournalFile } from './journal.mjs';
import { scoreDay } from './scorecard.mjs';
import { findJournalDir, hhmm, istDateStr, istMinutes, istTimeStr } from './time.mjs';

const SESSION_OPEN = hhmm(9, 15);
const SESSION_CLOSE = hhmm(15, 30);

/** Minutes inside the session with no state.jsonl row, merged into ranges. */
export function stateGaps(stateRows, { minGapMin = 3 } = {}) {
  const covered = new Set(
    stateRows.map(r => istMinutes(r.receivedAt ?? r.timestamp)).filter(m => m >= SESSION_OPEN && m <= SESSION_CLOSE)
  );
  if (covered.size === 0) return [{ from: '09:15', to: '15:30', minutes: SESSION_CLOSE - SESSION_OPEN, note: 'no app snapshots at all' }];
  const gaps = [];
  let start = null;
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  for (let m = SESSION_OPEN; m <= SESSION_CLOSE + 1; m++) {
    const has = covered.has(m) || m > SESSION_CLOSE;
    if (!has && start === null) start = m;
    if (has && start !== null) {
      if (m - start >= minGapMin) gaps.push({ from: fmt(start), to: fmt(m), minutes: m - start });
      start = null;
    }
  }
  return gaps;
}

const countBy = (rows, key) => rows.reduce((acc, r) => {
  const k = key(r) ?? 'unknown';
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});

export function buildDebriefData(date = istDateStr()) {
  const dir = findJournalDir(date);
  const read = name => readJsonl(join(dir, `${name}.jsonl`));
  const rows = {
    orders: read('orders'), fills: read('fills'), exits: read('exits'), gates: read('gates'),
    premarket: read('premarket'), decisions: read('decisions'), alerts: read('alerts'),
    vision: read('vision'), charts: read('charts'), state: read('state')
  };
  const card = scoreDay(date, rows);
  const lastPlan = rows.premarket.slice(-1)[0] ?? null;
  const sniper = rows.decisions.filter(d => d.strategy === 'SNIPER');
  const pilot = rows.decisions.filter(d => d.strategy === 'PILOT');

  // Why nothing was taken: the blocks the Sniper reported most, and the gate
  // Momentum stopped at most often.
  const sniperBlocks = countBy(sniper.flatMap(d => (d.blocks || []).map(b => b.code)), c => c);
  const momentumBlocks = countBy(rows.gates.filter(g => !g.ready), g => g.blockedBy);

  return {
    date,
    dir,
    card,
    plan: lastPlan && {
      at: istTimeStr(lastPlan.timestamp), verdict: lastPlan.verdict, headline: lastPlan.headline,
      bias: lastPlan.primaryBias, basis: lastPlan.basis, provisional: lastPlan.provisional, cuts: rows.premarket.length
    },
    sniper: {
      decisionChanges: sniper.length,
      enteredWindow: sniper.some(d => d.phase === 'ENTRY_WINDOW'),
      everCanEnter: sniper.some(d => d.canEnter),
      topBlocks: Object.entries(sniperBlocks).sort((a, b) => b[1] - a[1]).slice(0, 5)
    },
    momentum: {
      gateChanges: rows.gates.length,
      everReady: rows.gates.some(g => g.ready),
      topBlocks: Object.entries(momentumBlocks).sort((a, b) => b[1] - a[1]).slice(0, 5)
    },
    pilot: pilot.map(d => ({ at: istTimeStr(d.timestamp), action: d.action, reason: d.reason })),
    alerts: rows.alerts.map(a => ({ at: istTimeStr(a.timestamp), rule: a.rule, severity: a.severity, message: a.message })),
    charts: rows.charts.map(c => ({ at: istTimeStr(c.timestamp ?? c.at), ok: c.ok, accepted: c.accepted ?? 0, rejected: c.rejected ?? [] })),
    visionRuns: rows.vision.length,
    gaps: stateGaps(rows.state),
    counts: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v.length]))
  };
}

export function renderDebrief(d, narrative = null) {
  const m = d.card.metrics;
  const lines = [
    `# Nifty50Ops debrief — ${d.date}`,
    '',
    `_Generated ${istTimeStr()} IST from ${d.dir}. Facts below are from the journal; nothing here changes a strategy parameter._`,
    '',
    '## What happened',
    `- Closed trades: **${m.totalTrades}** (${m.wins}W / ${m.losses}L), net ₹${m.netPnl}.`,
    ...d.card.trades.map(t => `  - ${t.at ? istTimeStr(t.at) : '--:--:--'} ${t.strategy} ${t.book} ${t.symbol} ×${t.quantity}: ${t.entryPrice} → ${t.exitPrice} = ₹${t.pnl}${t.reason ? ` (${t.reason})` : ''}${t.priceSource === 'mark' ? ' [exit price from last mark]' : ''}`),
    d.card.caveat ? `- ${d.card.caveat}` : null,
    d.plan
      ? `- Pre-market plan (${d.plan.cuts} cut(s), last at ${d.plan.at}): ${d.plan.headline ?? d.plan.verdict ?? 'n/a'} · bias ${d.plan.bias}${d.plan.provisional ? ' · provisional' : ''}.`
      : '- No pre-market plan was recorded.',
    ...d.pilot.map(p => `- Opening Pilot ${p.at}: ${p.action} — ${p.reason}`),
    '',
    '## What was skipped and why',
    `- Sniper: ${d.sniper.decisionChanges} verdict change(s); ${d.sniper.everCanEnter ? 'had at least one all-green moment' : 'never had all gates green'}.`,
    ...d.sniper.topBlocks.map(([code, n]) => `  - ${code}: ${n}`),
    `- Momentum: ${d.momentum.gateChanges} gate change(s); ${d.momentum.everReady ? 'reached ready at least once' : 'never reached ready'}.`,
    ...d.momentum.topBlocks.map(([gate, n]) => `  - ${gate}: ${n}`),
    '',
    '## Data gaps and alerts',
    ...(d.gaps.length ? d.gaps.map(g => `- No app snapshot ${g.from}–${g.to} (${g.minutes} min)${g.note ? ` — ${g.note}` : ''}. If unexpected, check \`pmset -g log\` for sleep.`) : ['- App snapshots covered the session.']),
    ...(d.charts.length ? d.charts.map(c => `- Chart pull ${c.at}: ${c.ok ? `${c.accepted} accepted` : 'failed'}${c.rejected.length ? `, rejected ${c.rejected.map(r => `${r.file} (${r.why})`).join('; ')}` : ''}`) : ['- No chart pull recorded.']),
    `- Vision captures journaled: ${d.visionRuns}.`,
    ...(d.alerts.length ? d.alerts.map(a => `- ${a.at} [${a.severity ?? 'info'}] ${a.rule}: ${a.message}`) : ['- No alerts.']),
    '',
    '## Journal row counts',
    `- ${Object.entries(d.counts).map(([k, v]) => `${k} ${v}`).join(' · ')}`
  ].filter(l => l !== null);
  if (narrative) {
    lines.push('', '## Narrative (model-written from the facts above)', '', narrative.trim());
  }
  return lines.join('\n') + '\n';
}

export function writeDebrief(date = istDateStr(), narrative = null) {
  const data = buildDebriefData(date);
  const path = writeJournalFile('debrief.md', renderDebrief(data, narrative), date);
  return { path, data };
}
