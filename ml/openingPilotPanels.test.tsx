import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import OpeningPilot, { makePilotFrame, pilotContext } from '../components/OpeningPilot';
import { PlanEditor, ObservationEditor } from '../components/openingPilot/PilotPreparation';
import { AssessmentPanel, EvidenceMetrics, FrameTimeline, PriceChart, WallPanel } from '../components/openingPilot/PilotViews';
import { PilotJournal, PilotPositionCard, PilotTicket } from '../components/openingPilot/PilotTrading';
import { assessOpeningPilot, emptyPilotBook, markPilotPosition, openPilotPosition, reconcilePilotPosition, selectPilotContract } from '../services/openingPilot';
import { decodePilotBook, loadPilotBook, PILOT_STORE_KEY, savePilotBook } from '../services/openingPilotStore';
import { PilotObservation, PilotPlan, PilotScenarioPlan } from '../services/openingPilotTypes';
import { dbService } from '../services/db';
import { FyersQuote, MarketSnapshot } from '../types';

const at = (time: string) => new Date(`2026-09-17T${time}+05:30`).getTime();
const now = at('09:25:10');
const scenarios: PilotScenarioPlan[] = ['FLAT', 'UP_50', 'UP_100', 'DOWN_50', 'DOWN_100'].map(scenario => ({
  scenario: scenario as PilotScenarioPlan['scenario'], expectation: 'A hypothesis', confirmation: 'Price and momentum agree', invalidation: 'Wall fails'
}));
const plan: PilotPlan = {
  id: 'morning', day: '2026-09-17', savedAt: at('08:55:00'), previousClose: 25000,
  flatBand: 25, mediumBand: 75, outerBand: 150, notes: 'Prior-session context', scenarios
};
const observation: PilotObservation = {
  id: 'wall', day: plan.day, recordedAt: at('09:24:00'), observedAt: at('09:24:00'),
  support: 24900, resistance: 25200, supportTrend: 'BUILDING', resistanceTrend: 'UNCHANGED',
  giftChange: null, preOpen: null, notes: 'Fresh wall observation'
};
const history: MarketSnapshot[] = Array.from({ length: 11 }, (_, i) => ({
  timestamp: at(`09:${String(15 + i).padStart(2, '0')}:00`), time: `09:${15 + i}:00`,
  niftyLtp: 25000 + i * 4, ptsChg: i * 4, overallSent: 15 + i * 2,
  adv: 35, dec: 15, stockSent: 20, callSent: 15, putSent: -5, pcr: 1.1,
  optionsSent: 20, callsBuyQty: 1000, callsSellQty: 500, putsBuyQty: 500, putsSellQty: 1000,
  callsOI: 2e6, putsOI: 2.2e6
})).reverse();
const quote: FyersQuote = {
  symbol: 'NSE:NIFTY-24850-CE', expiry_date: '22-SEP-26', original_name: 'NIFTY 24850 CE',
  short_name: 'NIFTY 24850 CE', description: '', fyToken: '', exchange: 'NSE',
  tt: at('09:25:05') / 1000, lp: 250, ask: 251, bid: 249, ch: 0, chp: 0,
  high_price: 260, low_price: 240, open_price: 245, prev_close_price: 240, spread: 2, volume: 1000
};
const book = { ...emptyPilotBook(), plans: [plan], observations: [observation] };
const assessment = assessOpeningPilot(history, plan, observation, now);
const frame = makePilotFrame(book, history, now);
assert.ok(frame, 'fresh live evidence creates a frame');
assert.equal(frame.planId, plan.id);
assert.equal(makePilotFrame({ ...book, frames: [frame] }, history, now + 10_000), null, 'same received minute is immutable');
assert.equal(makePilotFrame(book, history, at('09:30:00')), null, 'stale history is not backfilled');
assert.equal(makePilotFrame(book, history.map(s => ({ ...s, timestamp: s.timestamp! + 86400000 })), now), null, 'future samples cannot enter replay');
assert.equal(makePilotFrame(book, history, at('16:00:00')), null, 'market closed does not record');
assert.equal(pilotContext({ ...book, plans: [{ ...plan, savedAt: now + 1000 }], observations: [{ ...observation, recordedAt: now + 1000 }] }, now).plan, null);
assert.equal(pilotContext({ ...book, observations: [{ ...observation, recordedAt: now + 1000 }] }, now).observation, null);
assert.equal(pilotContext(book, now + 86400000).plan, null, 'previous-day plan never carries into today');

const frozen = { ...book, frames: [frame] };
const revised = { ...frozen, plans: [...frozen.plans, { ...plan, id: 'revision', savedAt: now + 60000, notes: 'Hindsight' }] };
assert.equal(revised.frames[0].planId, 'morning', 'a later plan does not rewrite evidence');
assert.deepEqual(decodePilotBook(frozen), frozen);
assert.throws(() => decodePilotBook({ ...frozen, version: 2 }), /invalid|incompatible/);
assert.throws(() => decodePilotBook({ ...frozen, frames: [{ ...frame, assessment: { ...assessment, spot: NaN } }] }), /invalid|incompatible/);
assert.throws(() => decodePilotBook({ ...frozen, plans: [{ ...plan, scenarios: Array(5).fill(scenarios[0]) }] }), /invalid|incompatible/);

const contract = selectPilotContract([quote], 25040, 'CE', '2026-09-22', now);
assert.ok(contract);
const position = openPilotPosition({
  contract, spot: 25040, lots: 1, lotSize: 50, brokerage: 20, now, assessment,
  planId: plan.id, observationId: observation.id, reason: 'Manual paper observation', override: true
});
assert.equal(position.stopPremium, 225);
assert.equal(position.targetPremium, 275);
assert.deepEqual(decodePilotBook({ ...frozen, position }).position, position);
assert.throws(() => decodePilotBook({ ...frozen, position: { ...position, quantity: 999 } }), /invalid|incompatible/);
assert.throws(() => decodePilotBook({ ...frozen, position: { ...position, stopPremium: 230 } }), /invalid|incompatible/);
for (let cents = 20000; cents <= 30000; cents += 5) {
  const fractional = openPilotPosition({
    contract: { ...contract, quote: { ...quote, lp: cents / 100 } }, spot: 25040,
    lots: 1, lotSize: 50, brokerage: 20, now, assessment, planId: plan.id,
    observationId: observation.id, reason: 'Fractional premium rounding', override: true
  });
  assert.deepEqual(decodePilotBook({ ...frozen, position: fractional }).position, fractional,
    `premium ${cents / 100}: storage must use the engine's exact bracket rounding`);
}
const reported = reconcilePilotPosition(
  { ...position, highPremium: 300, lowPremium: 200, markAt: at('09:40:00') },
  255, at('09:30:00'), at('09:45:00'), 'Reported from my observation notes'
);
assert.equal(reported.highPremium, 255, 'reconciliation cannot include samples after the reported exit');
assert.equal(reported.lowPremium, 250);
assert.deepEqual(decodePilotBook({ ...frozen, trades: [reported] }).trades, [reported]);
const ambiguousQuotes = [
  { ...quote, tt: at('09:26:00') / 1000, lp: 220 },
  { ...quote, tt: at('09:26:00') / 1000, lp: 280 }
];
assert.equal(markPilotPosition(position, ambiguousQuotes, at('09:26:10')).trade, null,
  'conflicting same-timestamp prices cannot establish which threshold hit first');
assert.equal(selectPilotContract(ambiguousQuotes, 25040, 'CE', '2026-09-22', at('09:26:10')), null);

const noop = async () => {};
const cases: Array<[string, React.ReactElement]> = [
  ['OpeningPilot empty/hydrating', <OpeningPilot history={[]} quotes={[]} active feedPaused={false} refreshInterval={60000} />],
  ['Assessment populated', <AssessmentPanel value={assessment} />],
  ['Assessment empty', <AssessmentPanel value={assessOpeningPilot([], null, null, now)} />],
  ['Metrics populated', <EvidenceMetrics assessment={assessment} />],
  ['Price chart', <PriceChart points={history.map(s => ({ at: s.timestamp!, value: s.niftyLtp })).reverse()} support={24900} resistance={25200} />],
  ['Price chart empty', <PriceChart points={[]} />],
  ['Walls', <WallPanel observation={observation} assessment={assessment} at={now} />],
  ['Walls empty', <WallPanel observation={null} assessment={assessment} at={now} />],
  ['Timeline', <FrameTimeline frames={[frame]} />],
  ['Plan editor', <PlanEditor day={plan.day} initial={plan} disabled={false} onSave={noop} />],
  ['Observation editor', <ObservationEditor day={plan.day} initial={observation} disabled={false} onSave={noop} />],
  ['Ticket with quote', <PilotTicket quotes={[quote]} assessment={assessment} now={now} disabled={false} onBuy={noop} onSkip={noop} />],
  ['Ticket without quote', <PilotTicket quotes={[]} assessment={assessment} now={now} disabled={false} onBuy={noop} onSkip={noop} />],
  ['Position card', <PilotPositionCard position={position} now={now + 21 * 60000} disabled={false} onClose={noop} onReconcile={noop} />],
  ['Journal empty', <PilotJournal trades={[]} decisions={[]} />]
];
for (const [name, element] of cases) {
  const html = renderToString(element);
  assert.ok(html.length > 40, name);
  assert.ok(!html.includes('NaN'), `${name}: no NaN`);
  assert.ok(!html.includes('undefined'), `${name}: no undefined`);
}

const originalGet = dbService.getMeta;
const originalSet = dbService.setMeta;
let stored: unknown;
try {
  dbService.getMeta = async key => {
    assert.equal(key, PILOT_STORE_KEY);
    return stored;
  };
  dbService.setMeta = async (key, value) => {
    assert.equal(key, PILOT_STORE_KEY, 'pilot cannot write to the existing paper book');
    stored = structuredClone(value);
  };
  assert.deepEqual(await loadPilotBook(), emptyPilotBook());
  await savePilotBook(frozen);
  assert.deepEqual(await loadPilotBook(), frozen, 'journal survives reload');
  stored = { version: -1 };
  await assert.rejects(loadPilotBook, /invalid|incompatible/);
  dbService.setMeta = async () => { throw new Error('Quota exceeded'); };
  await assert.rejects(() => savePilotBook(frozen), /Quota exceeded/, 'storage errors surface');
} finally {
  dbService.getMeta = originalGet;
  dbService.setMeta = originalSet;
}
console.log(`Opening Pilot: persistence, replay isolation, and ${cases.length} render cases passed.`);
