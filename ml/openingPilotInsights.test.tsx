import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { assessOpeningPilot } from '../services/openingPilot';
import {
  pilotGauges, pilotPhase, pilotSignals, pilotTrackRecord, pilotTradeStats, summarizeGates, TRACK_POLICY, wilson
} from '../services/openingPilotInsights';
import { PilotAssessment, PilotFrame, PilotTrade } from '../services/openingPilotTypes';
import { PilotCockpit, PilotTrackRecord } from '../components/openingPilot/PilotCockpit';

const ist = (time: string, day = '2026-10-27') => Date.parse(`${day}T${time}+05:30`);
let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; };

const base: PilotAssessment = {
  at: ist('09:30:00'), status: 'WAIT', side: null, setup: 'NONE', reason: 'WAIT', checks: [],
  spot: 25000, snapshotAt: ist('09:30:00'), daySentiment: 8, sentimentDelta: 1, move1m: 3, move5m: 6,
  openingHigh: null, openingLow: null, support: 24900, resistance: 25100, wallDistance: 100, scenario: 'FLAT'
};

test('phases follow the IST opening clock', () => {
  assert.equal(pilotPhase(ist('08:30:00')).key, 'BEFORE');
  assert.equal(pilotPhase(ist('08:30:00')).minutesToNext, 25);
  assert.equal(pilotPhase(ist('09:00:00')).key, 'PREPARE');
  assert.equal(pilotPhase(ist('09:12:00')).key, 'PREOPEN');
  const opening = pilotPhase(ist('09:18:00'));
  assert.equal(opening.key, 'OPENING_RANGE');
  assert.equal(opening.minutesToNext, 7);
  assert.equal(pilotPhase(ist('09:25:00')).key, 'DECISION');
  assert.equal(pilotPhase(ist('15:31:00')).key, 'AFTER');
  assert.equal(pilotPhase(ist('10:00:00', '2026-10-25')).key, 'CLOSED_DAY');
});

test('gauges measure progress in the leading direction', () => {
  const g = Object.fromEntries(pilotGauges(base).map(x => [x.key, x]));
  assert.equal(g.move5m.value, 6);
  assert.equal(g.move5m.progress, 0.6);
  assert.equal(g.move5m.pass, false);
  assert.equal(g.move1m.pass, true);
  const down = Object.fromEntries(pilotGauges({ ...base, move5m: -12, move1m: -3, sentimentDelta: -2, daySentiment: -6 }).map(x => [x.key, x]));
  assert.equal(down.move5m.value, 12, 'a PE-leaning move counts as positive progress');
  assert.equal(down.daySentiment.value, 6, 'day bias uses magnitude');
});

test('the blocker names the first resolvable failing gate with numbers', () => {
  const live = assessOpeningPilot([], null, null, ist('09:30:00'));
  const s = summarizeGates(live);
  assert.ok(s.blocker, 'an empty assessment always has a blocker');
  assert.ok(s.required.passed < s.required.total);
  const momentum: PilotAssessment = { ...base, checks: [
    { label: 'Live spot', pass: true, detail: '' },
    { label: 'Recent price and sentiment slope', pass: false, detail: '' },
    { label: 'Observed wall rejection', pass: false, detail: '' }
  ] };
  const m = summarizeGates(momentum);
  assert.match(m.blocker!, /5m move \+6 of \+10 pts/);
  assert.match(m.blocker!, /5m sentiment \+1 of \+2 pp/);
  assert.doesNotMatch(m.blocker!, /1m move/, 'passing gauges are not listed as missing');
  assert.equal(m.required.total, 2, 'wall rejection is optional (reversal only)');
});

test('wilson interval is conservative for small samples', () => {
  const [lo, hi] = wilson(3, 4)!;
  assert.ok(Math.abs(lo - 0.301) < 0.01 && Math.abs(hi - 0.954) < 0.01, `${lo} ${hi}`);
  assert.equal(wilson(0, 0), null);
});

const frame = (time: string, spot: number, status: PilotAssessment['status'] = 'WAIT', side: PilotAssessment['side'] = null, day = '2026-10-26'): PilotFrame => ({
  id: `${day}:${time}`, day, at: ist(time, day), planId: null, observationId: null, callsOI: null, putsOI: null, optionsSentiment: null,
  assessment: { ...base, at: ist(time, day), status, side, spot }
});

test('signals count once per episode and grade against the spot bracket', () => {
  const frames: PilotFrame[] = [];
  for (let m = 0; m <= 25; m++) {
    const t = `09:${String(25 + m).padStart(2, '0')}:00`;
    const status = m < 3 ? 'PAPER ENTRY READY' : 'WAIT';
    frames.push(frame(t, 25000 + m * 2, status, m < 3 ? 'CE' : null));
  }
  const signals = pilotSignals(frames, ist('12:00:00'));
  assert.equal(signals.length, 1, 'three consecutive READY minutes are one signal');
  assert.equal(signals[0].outcome, 'WIN', '+26 pts by minute 13 clears the 25-pt bracket');
  assert.equal(signals[0].move10, 20);
  const loss = pilotSignals([frame('09:30:00', 25000, 'PAPER ENTRY READY', 'CE'), frame('09:31:00', 24990), frame('09:32:00', 24970)], ist('12:00:00'));
  assert.equal(loss[0].outcome, 'LOSS');
  const flat = [frame('09:30:00', 25000, 'CONTINUATION WATCH', 'PE'), ...Array.from({ length: 21 }, (_, i) => frame(`09:${31 + i}:00`, 25000 + (i % 2)))];
  assert.equal(pilotSignals(flat, ist('12:00:00'))[0].outcome, 'TIMEOUT');
});

test('today\'s unfinished signals stay pending and gaps are flagged', () => {
  const day = '2026-10-27';
  const pending = pilotSignals([frame('09:30:00', 25000, 'PAPER ENTRY READY', 'CE', day), frame('09:31:00', 25005, 'PAPER ENTRY READY', 'CE', day)], ist('09:31:30', day));
  assert.equal(pending[0].outcome, 'PENDING');
  const gap = pilotSignals([frame('09:30:00', 25000, 'PAPER ENTRY READY', 'CE'), frame('09:34:00', 25030)], ist('12:00:00'));
  assert.equal(gap[0].outcome, 'WIN');
  assert.equal(gap[0].samplingGap, true);
  const buckets = pilotTrackRecord([...gap]);
  const ready = buckets.find(b => b.status === 'PAPER ENTRY READY')!;
  assert.equal(ready.wins, 1);
  assert.equal(ready.meaningful, false, `fewer than ${TRACK_POLICY.minSample} signals are not evidence`);
});

test('trade stats keep reconciled exits and overrides separate', () => {
  const t = (netPnl: number, extra: Partial<PilotTrade> = {}) => ({ netPnl, exitReason: 'TARGET', override: false, ...extra }) as PilotTrade;
  const s = pilotTradeStats([t(500), t(-200), t(300, { override: true }), t(-900, { exitReason: 'RECONCILED' })]);
  assert.equal(s.sampled, 3);
  assert.equal(s.wins, 2);
  assert.equal(s.netPnl, 600);
  assert.equal(s.reconciled, 1);
  assert.equal(s.reconciledNet, -900);
  assert.equal(s.overrides, 1);
});

test('cockpit and track record render without NaN/undefined', () => {
  const html = [
    renderToString(<PilotCockpit assessment={assessOpeningPilot([], null, null, ist('09:20:00'))} phase={pilotPhase(ist('09:20:00'))} live />),
    renderToString(<PilotCockpit assessment={{ ...base, status: 'PAPER ENTRY READY', side: 'CE', setup: 'CONTINUATION' }} phase={pilotPhase(ist('09:40:00'))} live={false} positionOpen />),
    renderToString(<PilotTrackRecord buckets={pilotTrackRecord([])} signals={[]} trades={[]} />)
  ].join('');
  assert.ok(html.includes('STAND ASIDE'));
  assert.ok(html.includes('BUY CE'));
  assert.ok(html.includes('Measured accuracy'));
  assert.ok(!html.includes('NaN') && !html.includes('undefined'));
});

console.log(`${passed} Opening Pilot insight tests passed.`);
