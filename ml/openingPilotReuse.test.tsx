import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { buildDecision } from '../components/PreMarketAnalyzer';
import { ChartEntry, CHART_SLOTS } from '../components/premarket/model';
import { derivePilotSources } from '../services/openingPilotSources';
import { assessOpeningPilot, emptyPilotBook } from '../services/openingPilot';
import { decodePilotBook } from '../services/openingPilotStore';
import { makePilotFrame, mergePilotSources, pilotContext } from '../components/OpeningPilot';
import { PilotSourceBoard } from '../components/openingPilot/PilotSourceBoard';
import { WallPanel } from '../components/openingPilot/PilotViews';
import { SentimentHistory } from '../components/SentimentHistory';
import { MarketSnapshot, VisionRun } from '../types';

const at = (time: string) => Date.parse(`2026-09-17T${time}+05:30`);
const now = at('09:25:10');
const charts: ChartEntry[] = CHART_SLOTS.map(slot => ({
  slot: slot.id, data: '', fileName: `${slot.id}.png`,
  uploadedAt: Date.parse('2026-09-16T15:30:00+05:30'), analyzedAt: at('08:54:00'),
  verdict: {
    bias: 'BULLISH', confidence: 80, summary: 'Price holds support below overhead resistance.',
    lastPrice: 25000, supports: [24900, 24800], resistances: [25300, 25400], notes: [], structured: true, raw: ''
  }
}));
const chartMeta = Object.fromEntries(charts.map(({ data, ...chart }) => [chart.slot, chart]));
const history: MarketSnapshot[] = Array.from({ length: 11 }, (_, i) => ({
  timestamp: at(`09:${String(15 + i).padStart(2, '0')}:00`), time: `09:${15 + i}:00`,
  niftyLtp: 25000 + i * 4, ptsChg: i * 4, overallSent: 15 + i * 2,
  adv: 35, dec: 15, stockSent: 20, callSent: 15, putSent: -5, pcr: 1.1,
  optionsSent: 20, callsBuyQty: 1000, callsSellQty: 500, putsBuyQty: 500,
  putsSellQty: 1000, callsOI: 2e6, putsOI: 2.2e6
})).reverse();
const morning = buildDecision({ charts, spot: 25000, spotSource: 'CHARTS', now: at('08:55:00'), basis: 'CHARTS_ONLY' });
const preopen = buildDecision({
  charts, spot: 25050, spotSource: 'LIVE', now: at('09:10:00'),
  basis: 'PREOPEN', phases: morning.phases
});
const decision = buildDecision({
  charts, spot: 25020, spotSource: 'LIVE', now: at('09:20:00'),
  historyLog: history.filter(s => s.timestamp! <= at('09:20:00')),
  basis: 'INTRADAY', phases: preopen.phases
});
function vision(id: string, started: string, finished: string): VisionRun {
  return {
    id, manual: false, startedAt: new Date(at(started)).toISOString(),
    finishedAt: new Date(at(finished)).toISOString(), durationMs: 5000,
    shots: [
      { id: 'kite', label: 'Nifty', url: '', ok: true },
      { id: 'sensibull', label: 'OI', url: '', ok: true }
    ],
    analysis: { ok: true, parsed: {
      readable: true, bias: 'bullish', confidence: 85, spot_estimate: '25,040',
      price_action: 'Nifty rising with higher lows', supports: ['25,000'], resistances: ['25,300'],
      highest_put_oi_strike: '25,000', highest_call_oi_strike: '25,300',
      oi_read: 'Put OI remains concentrated at 25000; call wall at 25300.',
      expected_range: '25000-25300', combined_view: 'Bullish price structure with room overhead.',
      watch_for: ['Watch resistance reaction'], risks: ['A failed continuation']
    } }
  };
}
const visionRuns = [vision('vision-0922', '09:22:00', '09:22:05'), vision('vision-0924', '09:24:00', '09:24:05')];
const update = derivePilotSources({ decision, chartMeta, visionRuns, now });
const book = mergePilotSources(emptyPilotBook(), update, now);
const context = pilotContext(book, now);
assert.ok(context.plan, update.premarketStatus);
assert.equal(context.plan.source?.kind, 'PREMARKET');
assert.equal(context.plan.previousClose, 25000, 'live anchor must not replace the original close');
assert.equal(context.plan.scenarios.length, 5);
assert.equal(context.observation?.source?.kind, 'VISION', update.visionStatus);
assert.equal(context.observation.support, 25000);
assert.equal(context.observation.resistance, 25300);
assert.equal(context.observation.supportTrend, 'UNKNOWN', 'no manual OI trend required or fabricated');
assert.equal(context.observation.vision?.supportRepeated, true);
assert.equal(context.observation.observedAt, at('09:24:00'));
const assessment = assessOpeningPilot(history, context.plan, context.observation, now);
assert.equal(assessment.status, 'PAPER ENTRY READY', assessment.reason);
assert.equal(assessment.side, 'CE');
assert.equal(assessment.setup, 'CONTINUATION');
assert.equal(assessment.scenario, 'FLAT', 'actual sampled opening replaces indicative +50 gap');
assert.equal(book.observations.some(o => o.preOpen === 25050), true, 'preopen checkpoint reused separately');
assert.equal(book.observations.some(o => o.giftChange !== null), false, 'GIFT is not invented');
assert.deepEqual(decodePilotBook(book), book, 'source provenance survives persisted pilot reload');
const frame = makePilotFrame(book, history, now);
assert.equal(frame?.observationId, context.observation.id);
assert.equal(frame?.planId, context.plan.id);
const polledAgain = derivePilotSources({ decision, chartMeta, visionRuns, now: now + 15_000 });
assert.equal(mergePilotSources(book, polledAgain, now + 15_000), book, 'polling cannot rewrite or rejuvenate source records');

const late = buildDecision({
  charts, spot: 25100, spotSource: 'LIVE', now: at('09:26:00'), basis: 'INTRADAY',
  phases: decision.phases, historyLog: history
});
const afterCutoff = mergePilotSources(book, derivePilotSources({ decision: late, chartMeta, visionRuns, now: at('09:26:10') }), at('09:26:10'));
assert.equal(pilotContext(afterCutoff, at('09:26:10')).plan?.id, context.plan.id, 'later PreMkt recuts cannot rewrite the 09:25 handoff');
const failed = { ...vision('vision-failed', '09:25:20', '09:25:25'), analysis: { ok: false, parsed: null, error: 'Chart unreadable' } };
const withFailure = mergePilotSources(book, derivePilotSources({ decision, chartMeta, visionRuns: [...visionRuns, failed], now: at('09:25:30') }), at('09:25:30'));
const failedContext = pilotContext(withFailure, at('09:25:30'));
assert.equal(failedContext.observation?.source?.kind, 'VISION');
assert.notEqual(assessOpeningPilot(history, failedContext.plan, failedContext.observation, at('09:25:30')).status, 'PAPER ENTRY READY',
  'a newer failed Vision run cannot be hidden by an older successful run');
const lateFailure = { ...failed, id: 'slow-failed-read', startedAt: new Date(at('09:23:00')).toISOString() };
const overlapping = mergePilotSources(book, derivePilotSources({
  decision, chartMeta, visionRuns: [...visionRuns, lateFailure], now: at('09:25:30')
}), at('09:25:30'));
assert.equal(pilotContext(overlapping, at('09:25:30')).observation?.source?.id, 'slow-failed-read',
  'latest completion takes precedence even when an older capture finished after a newer capture');
const opposite = { ...context.observation, vision: { ...context.observation.vision!, bias: 'bearish' as const } };
assert.notEqual(assessOpeningPilot(history, context.plan, opposite, now).status, 'PAPER ENTRY READY',
  'Vision disagreement blocks confirmation even when minute-history momentum is positive');
const reversalPrices = [25000, 25005, 25008, 25012, 25016, 25012, 25008, 25002, 25012, 25020, 25030];
const reversalHistory = history.map(s => {
  const index = Math.round((s.timestamp! - at('09:15:00')) / 60000);
  return { ...s, niftyLtp: reversalPrices[index], overallSent: -35 + index * 2 };
});
const reversalUpdate = derivePilotSources({
  decision, chartMeta, now, visionRuns: [
    vision('known-before-touch', '09:21:00', '09:21:05'),
    vision('confirm-after-rejection', '09:24:00', '09:24:05')
  ]
});
const reversalContext = pilotContext(mergePilotSources(emptyPilotBook(), reversalUpdate, now), now);
const reversal = assessOpeningPilot(reversalHistory, reversalContext.plan, reversalContext.observation, now);
assert.equal(reversal.status, 'PAPER ENTRY READY', reversal.reason);
assert.equal(reversal.setup, 'REVERSAL', 'two existing Vision reads plus minute-price rejection need no manual OI trend');
const staleRepeat = {
  ...reversalContext.observation!,
  vision: { ...reversalContext.observation!.vision!, supportObservedSince: at('09:19:00') }
};
assert.notEqual(assessOpeningPilot(reversalHistory, reversalContext.plan, staleRepeat, now).status, 'PAPER ENTRY READY',
  'an expired prior wall observation cannot support a new reversal');
const oneRead = {
  ...reversalContext.observation!,
  vision: { ...reversalContext.observation!.vision!, supportRepeated: false }
};
assert.notEqual(assessOpeningPilot(reversalHistory, reversalContext.plan, oneRead, now).status, 'PAPER ENTRY READY');
const unzoned = derivePilotSources({
  decision, chartMeta, now, visionRuns: [{ ...visionRuns[0], startedAt: '2026-09-17T09:22:00' }]
});
assert.equal(unzoned.observations.filter(o => o.source?.kind === 'VISION').length, 0,
  'unqualified source timestamps cannot be interpreted using the browser timezone');

const boardHtml = renderToString(<PilotSourceBoard shared={{
  decision, chartMeta, visionRuns, loading: false, checkedAt: now, errors: []
}} update={update} plan={context.plan} observation={context.observation} history={history} now={now} />);
assert.ok(boardHtml.includes('no duplicate analysis'));
assert.ok(boardHtml.includes('reused market analysis'));
assert.ok(!boardHtml.includes('<textarea'), 'automatic source board has no re-entry form');
const wallHtml = renderToString(<WallPanel observation={context.observation} assessment={assessment} at={now} />);
assert.ok(wallHtml.includes('Nifty rising with higher lows'));
assert.ok(wallHtml.includes('Put OI remains concentrated'));
assert.ok(!wallHtml.includes('NaN'));
const historyHtml = renderToString(<SentimentHistory history={history}
  credentials={{ appId: '', accessToken: '' }} readOnly aiEnabled={false} />);
assert.ok(historyHtml.includes('09:15:00') && historyHtml.includes('09:25:00'),
  'the reused History component includes samples from before the pilot was opened');
assert.ok(historyHtml.includes('Shared minute history'));
assert.ok(!historyHtml.includes('Analyze with AI'), 'embedding does not introduce a second analysis workflow');
console.log('Opening Pilot reuse: existing PreMkt -> shared history -> Vision -> entry-ready, cutoff, failed-source and replay provenance cases passed.');
