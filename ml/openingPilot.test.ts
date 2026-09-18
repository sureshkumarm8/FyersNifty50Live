import assert from 'node:assert/strict';
import type { FyersQuote, MarketSnapshot } from '../types';
import type { PilotAssessment, PilotContract, PilotObservation, PilotPlan, PilotSide } from '../services/openingPilotTypes';
import {
  PILOT_POLICY, assessOpeningPilot, classifyPilotGap, closePilotPosition, emptyPilotBook,
  markPilotPosition, openPilotPosition, pilotExpiry, pilotQuoteTime, reconcilePilotPosition, selectPilotContract
} from '../services/openingPilot';
import { computeCharges } from '../services/paperTradingService';

const MINUTE = 60_000;
const NOW = Date.parse('2026-09-17T09:25:00+05:30');
const DAY = '2026-09-17';
const EXPIRY = '2026-09-22';
let passed = 0;

function test(label: string, run: () => void) {
  run();
  passed++;
  console.log(`  ok    ${label}`);
}

function plan(patch: Partial<PilotPlan> = {}): PilotPlan {
  return {
    id: 'plan', day: DAY, savedAt: NOW - 30 * MINUTE, previousClose: 23500,
    flatBand: 20, mediumBand: 75, outerBand: 125, notes: '', scenarios: [], ...patch
  };
}

function observation(patch: Partial<PilotObservation> = {}): PilotObservation {
  return {
    id: 'oi', day: DAY, observedAt: NOW - 4 * MINUTE, recordedAt: NOW - 3 * MINUTE,
    preOpen: 23500, giftChange: null, support: 23400, resistance: 23700,
    supportTrend: 'BUILDING', resistanceTrend: 'UNCHANGED', notes: '', ...patch
  };
}

function history(sign = 1): MarketSnapshot[] {
  return Array.from({ length: 11 }, (_, i) => ({
    timestamp: NOW - (10 - i) * MINUTE, time: `09:${15 + i}:00`,
    niftyLtp: 23500 + sign * i * 5, ptsChg: sign * i * 5,
    overallSent: sign * (10 + 2 * i), adv: 35, dec: 15,
    stockSent: sign * 40, callSent: 10, putSent: -10, pcr: 1.1, optionsSent: 20,
    callsBuyQty: 100, callsSellQty: 80, putsBuyQty: 80, putsSellQty: 100,
    callsOI: 1000, putsOI: 1200
  }));
}

function quote(strike = 23350, side: PilotSide = 'CE', patch: Partial<FyersQuote> = {}): FyersQuote {
  return {
    symbol: `NSE:NIFTY-${strike}-${side}`, expiry_date: EXPIRY, tt: NOW, lp: 100,
    ask: 101, bid: 99, ch: 0, chp: 0, description: '', exchange: 'NSE', fyToken: '',
    high_price: 200, low_price: 50, open_price: 100, original_name: `NIFTY ${strike} ${side}`,
    prev_close_price: 100, short_name: '', spread: 2, volume: 1000, ...patch
  };
}

function ready(): PilotAssessment {
  const result = assessOpeningPilot(history(), plan(), observation(), NOW);
  assert.equal(result.status, 'PAPER ENTRY READY', result.reason);
  return result;
}

function contract(): PilotContract {
  const result = selectPilotContract([quote()], 23550, 'CE', EXPIRY, NOW);
  assert.ok(result);
  return result;
}

function entry(patch: Partial<Parameters<typeof openPilotPosition>[0]> = {}) {
  return {
    contract: contract(), spot: 23550, lots: 2, lotSize: 75, brokerage: 20, now: NOW,
    assessment: ready(), planId: 'plan', observationId: 'oi', reason: 'Observed continuation', override: false,
    ...patch
  };
}

function tick(at: number, premium: number, patch: Partial<FyersQuote> = {}) {
  return quote(23350, 'CE', { tt: at, lp: premium, ...patch });
}

test('fresh independent empty paper books', () => {
  const a = emptyPilotBook();
  const b = emptyPilotBook();
  assert.deepEqual(a, { version: 1, plans: [], observations: [], frames: [], decisions: [], position: null, trades: [] });
  a.plans.push(plan());
  assert.equal(b.plans.length, 0);
});

test('all configurable gap boundaries are inclusive and symmetric', () => {
  const cases = [
    [-126, 'OUTSIDE'], [-125, 'DOWN_100'], [-75.01, 'DOWN_100'], [-75, 'DOWN_50'],
    [-20.01, 'DOWN_50'], [-20, 'FLAT'], [0, 'FLAT'], [20, 'FLAT'],
    [20.01, 'UP_50'], [75, 'UP_50'], [75.01, 'UP_100'], [125, 'UP_100'], [126, 'OUTSIDE']
  ] as const;
  for (const [gap, expected] of cases) assert.equal(classifyPilotGap(gap, plan()), expected);
  assert.equal(classifyPilotGap(0, plan({ flatBand: 0 })), 'FLAT');
});

test('invalid gap and non-increasing or negative bands throw', () => {
  for (const patch of [
    { flatBand: -1 }, { flatBand: 75 }, { mediumBand: 125 }, { outerBand: 0 },
    { flatBand: NaN }, { mediumBand: Infinity }, { outerBand: NaN }
  ]) assert.throws(() => classifyPilotGap(0, plan(patch)), /bands/);
  for (const gap of [NaN, Infinity, -Infinity]) assert.throws(() => classifyPilotGap(gap, plan()));
});

test('quote timestamps parse epoch seconds/ms, numeric strings and explicitly zoned ISO only', () => {
  for (const tt of [NOW, NOW / 1000, String(NOW), String(NOW / 1000), '2026-09-17T09:25:00+05:30', '2026-09-17T03:55:00Z']) {
    assert.equal(pilotQuoteTime(quote(23350, 'CE', { tt })), NOW);
  }
  for (const tt of ['', '09:25:00', '2026-09-17', '2026-09-17T09:25:00', '2026-02-30T09:25:00Z', '2026-09-17T24:00:00Z', NaN, Infinity, -1, 0]) {
    assert.equal(pilotQuoteTime(quote(23350, 'CE', { tt })), null, String(tt));
  }
});

test('expiry parsing is calendar-validated and never guesses monthly expiry', () => {
  for (const expiry_date of ['22-SEP-26', '22-09-2026', EXPIRY, `${EXPIRY}T00:00:00+05:30`]) {
    assert.equal(pilotExpiry(quote(23350, 'CE', { expiry_date })), EXPIRY);
  }
  assert.equal(pilotExpiry(quote(23350, 'CE', { expiry_date: '07-APR-26' })), '2026-04-07');
  assert.equal(pilotExpiry(quote(23350, 'CE', { expiry_date: '29-FEB-28' })), '2028-02-29');
  for (const expiry_date of ['31-SEP-26', '29-FEB-26', '2026-13-01', '22-XYZ-26', '22/09/26', '2026-09-22T00:00:00']) {
    assert.equal(pilotExpiry(quote(23350, 'CE', { expiry_date })), null, expiry_date);
  }
  assert.equal(pilotExpiry(quote(23350, 'CE', { symbol: 'NSE:NIFTY2692223350CE', expiry_date: undefined })), EXPIRY);
  assert.equal(pilotExpiry(quote(23350, 'CE', { symbol: 'NSE:NIFTY26O0623350CE', expiry_date: undefined })), '2026-10-06');
  assert.equal(pilotExpiry(quote(23350, 'CE', { symbol: 'NSE:NIFTY2693123350CE', expiry_date: undefined })), null);
  assert.equal(pilotExpiry(quote(23350, 'CE', { symbol: 'NSE:NIFTY26SEP23350CE', expiry_date: undefined })), null);
  assert.equal(pilotExpiry(quote(23350, 'CE', { expiry_date: undefined })), null);
});

test('selects deterministic CE below spot and PE above spot, 200 ±25 ITM, exact expiry', () => {
  const quotes = [
    quote(23300), quote(23350), quote(23400), quote(23550),
    quote(23750, 'PE'), quote(23700, 'PE'), quote(23800, 'PE'),
    quote(23350, 'CE', { expiry_date: '2026-09-29', lp: 999 })
  ];
  assert.equal(selectPilotContract(quotes, 23550, 'CE', EXPIRY, NOW)?.strike, 23350);
  assert.equal(selectPilotContract(quotes, 23550, 'PE', EXPIRY, NOW)?.strike, 23750);
  assert.equal(selectPilotContract(quotes, 23575, 'CE', EXPIRY, NOW)?.strike, 23350);
  assert.deepEqual(selectPilotContract(quotes, 23575, 'CE', EXPIRY, NOW),
    selectPilotContract([...quotes].reverse(), 23575, 'CE', EXPIRY, NOW));
  assert.equal(selectPilotContract([quote(23350)], 23576, 'CE', EXPIRY, NOW), null);
  assert.equal(selectPilotContract([quote(23550), quote(23100)], 23550, 'CE', EXPIRY, NOW), null);
  assert.equal(selectPilotContract([quote(23350)], 23550, 'PE', EXPIRY, NOW), null);
});

test('selection blocks non-NIFTY, unknown/expired expiry, stale/future/prior-day and nonpositive quotes', () => {
  for (const patch of [
    { symbol: 'NSE:BANKNIFTY-23350-CE' }, { symbol: 'NSE:FINNIFTY-23350-CE' },
    { original_name: 'NIFTY 23550 CE' }, { expiry_date: undefined }, { expiry_date: '2026-09-16' },
    { tt: '09:25:00' }, { tt: NOW + 1 }, { tt: NOW - 90_001 }, { tt: NOW - 24 * 60 * MINUTE },
    { lp: 0 }, { lp: -1 }, { lp: NaN }
  ]) assert.equal(selectPilotContract([quote(23350, 'CE', patch)], 23550, 'CE', EXPIRY, NOW), null, JSON.stringify(patch));
  assert.equal(selectPilotContract([quote()], 23550, 'CE', '22-SEP-26', NOW), null);
  assert.ok(selectPilotContract([quote(23350, 'CE', { expiry_date: DAY })], 23550, 'CE', DAY, NOW));
  assert.ok(selectPilotContract([quote(23350, 'CE', { tt: NOW - 90_000 })], 23550, 'CE', EXPIRY, NOW));
});

test('ten actual minutes suffice at 09:25; day sentiment, slope and sampled opening range are distinct', () => {
  const result = ready();
  assert.equal(result.setup, 'CONTINUATION');
  assert.equal(result.side, 'CE');
  assert.equal(result.daySentiment, 30);
  assert.equal(result.snapshotAt, NOW);
  assert.equal(result.sentimentDelta, 10);
  assert.equal(result.move1m, 5);
  assert.equal(result.move5m, 25);
  assert.equal(result.openingLow, 23500);
  assert.equal(result.openingHigh, 23545, '09:25 tick is not opening-range OHLC');
  assert.equal(result.scenario, 'FLAT');
  assert.ok(result.checks.some(c => /not exchange OHLC/.test(c.detail)));
  const pe = assessOpeningPilot(history(-1), plan(), observation(), NOW);
  assert.equal(pe.status, 'PAPER ENTRY READY', pe.reason);
  assert.equal(pe.side, 'PE');
});

test('warmup rejects 09:24, missing minute timestamps and duplicate rows counted as minutes', () => {
  assert.notEqual(assessOpeningPilot(history(), plan(), observation(), NOW - MINUTE).status, 'PAPER ENTRY READY');
  const missing = history().filter((_, i) => i !== 3);
  assert.notEqual(assessOpeningPilot(missing, plan(), observation(), NOW).status, 'PAPER ENTRY READY');
  assert.notEqual(assessOpeningPilot([...missing, missing[0], missing[0]], plan(), observation(), NOW).status, 'PAPER ENTRY READY');
  assert.equal(assessOpeningPilot([...history(), ...history()], plan(), observation(), NOW).status, 'PAPER ENTRY READY');
  const unstamped = history().map(s => ({ ...s, timestamp: undefined }));
  assert.equal(assessOpeningPilot(unstamped, plan(), observation(), NOW).spot, null);
  const oneMinute = history().map((s, i) => ({ ...s, timestamp: NOW - i * 1000 }));
  assert.notEqual(assessOpeningPilot(oneMinute, plan(), observation(), NOW).status, 'PAPER ENTRY READY');
});

test('recent continuity uses elapsed timestamps, not array length or labels', () => {
  const missing = history().filter((_, i) => i !== 8);
  const result = assessOpeningPilot(missing, plan(), observation(), NOW);
  assert.equal(result.checks.find(c => c.label === 'Timestamp continuity')?.pass, false);
  const misdated = history().map(s => ({ ...s, timestamp: s.timestamp! - 24 * 60 * MINUTE }));
  assert.equal(assessOpeningPilot(misdated, plan(), observation(), NOW).spot, null);
  assert.equal(assessOpeningPilot(history().reverse(), plan(), observation(), NOW).status, 'PAPER ENTRY READY');
  const irregular = history().map((s, i) => i === 9 ? { ...s, timestamp: s.timestamp! + 25_000 } : s);
  assert.equal(assessOpeningPilot(irregular, plan(), observation(), NOW).checks.find(c => c.label === 'Timestamp continuity')?.pass, false);
});

test('stale data, conflicting duplicate timestamps, future data and weekends cannot be ready', () => {
  assert.equal(assessOpeningPilot(history(), plan(), observation(), NOW + 90_001).status, 'WAIT');
  const rows = history();
  const clash = { ...rows[10], niftyLtp: 23400 };
  assert.equal(assessOpeningPilot([...rows, clash], plan(), observation(), NOW).status, 'WAIT');
  const future = { ...rows[10], timestamp: NOW + 1, niftyLtp: 99999 };
  assert.equal(assessOpeningPilot([...rows, future], plan(), observation(), NOW).spot, 23550);
  assert.equal(assessOpeningPilot([future], plan(), observation(), NOW).spot, null);
  assert.equal(assessOpeningPilot(history(), plan(), observation(), Date.parse('2026-09-19T09:25:00+05:30')).status, 'WAIT');
});

test('manual observations must be known, fresh, same-day and have ordered positive walls', () => {
  for (const patch of [
    { observedAt: NOW + 1 }, { recordedAt: NOW + 1 }, { observedAt: NOW - 300_001 },
    { recordedAt: NOW - 300_001 }, { day: '2026-09-16' },
    { observedAt: NOW - 24 * 60 * MINUTE }, { recordedAt: NOW - 24 * 60 * MINUTE },
    { support: 0 }, { support: 23800 }, { resistance: null }, { resistance: NaN }
  ]) {
    const result = assessOpeningPilot(history(), plan(), observation(patch), NOW);
    assert.notEqual(result.status, 'PAPER ENTRY READY', JSON.stringify(patch));
    assert.equal(result.support, null);
  }
  assert.equal(assessOpeningPilot(history(), plan(), observation({
    observedAt: NOW - 300_000, recordedAt: NOW - 300_000
  }), NOW).status, 'PAPER ENTRY READY');
});

test('gap prefers the 09:15 sample over indicative pre-open and never substitutes current spot', () => {
  const actual = assessOpeningPilot(history(), plan(), observation({ preOpen: 23600 }), NOW);
  assert.equal(actual.scenario, 'FLAT');
  assert.match(actual.checks.find(c => c.label === 'Saved gap plan')!.detail, /Reference: 09:15 sampled spot 23500, not official/);
  assert.equal(assessOpeningPilot(history(), plan(), observation({ preOpen: null }), NOW).scenario, 'FLAT');
  assert.equal(assessOpeningPilot(history(), plan(), observation({ preOpen: 23600, recordedAt: NOW + 1 }), NOW).scenario, 'FLAT');
  assert.equal(assessOpeningPilot(history().slice(1), plan(), null, NOW).scenario, null);
  const indicative = assessOpeningPilot(history().slice(1), plan(), observation({
    preOpen: 23600, observedAt: NOW - 15 * MINUTE, recordedAt: NOW - 14 * MINUTE
  }), NOW);
  assert.equal(indicative.scenario, 'UP_100', 'historical pre-open is only an indicative fallback, separate from OI freshness');
  assert.match(indicative.checks.find(c => c.label === 'Saved gap plan')!.detail, /Reference: recorded indicative pre-open 23600/);
  assert.equal(assessOpeningPilot([history()[10]], plan(), null, NOW).scenario, null);
  assert.equal(assessOpeningPilot(history().slice(1), plan(), observation({
    preOpen: 23600, recordedAt: NOW + 1
  }), NOW).scenario, null);
  for (const patch of [
    { savedAt: NOW + 1 }, { day: '2026-09-16' }, { savedAt: NOW - 24 * 60 * MINUTE },
    { previousClose: 0 }, { previousClose: NaN }, { flatBand: 99 }
  ]) {
    const result = assessOpeningPilot(history(), plan(patch), observation(), NOW);
    assert.equal(result.scenario, null);
    assert.notEqual(result.status, 'PAPER ENTRY READY');
  }
  assert.notEqual(assessOpeningPilot(history(), plan({ previousClose: 23000 }), observation(), NOW).status, 'PAPER ENTRY READY');
});

test('near opposing wall, flat tape or conflicting sentiment stays watch/WAIT, not reversal', () => {
  const near = assessOpeningPilot(history(), plan(), observation({ resistance: 23560 }), NOW);
  assert.notEqual(near.status, 'PAPER ENTRY READY');
  assert.notEqual(near.setup, 'REVERSAL');
  assert.equal(near.wallDistance, 10);
  const flat = history().map(s => ({ ...s, niftyLtp: 23550 }));
  assert.equal(assessOpeningPilot(flat, plan(), observation(), NOW).status, 'WAIT');
  const fallingBreadth = history().map((s, i) => ({ ...s, overallSent: 30 - i * 2 }));
  assert.equal(assessOpeningPilot(fallingBreadth, plan(), observation(), NOW).status, 'WAIT');
  const oppositeDay = history().map(s => ({ ...s, overallSent: s.overallSent - 50 }));
  assert.notEqual(assessOpeningPilot(oppositeDay, plan(), observation(), NOW).status, 'PAPER ENTRY READY');
});

function reversalHistory(sign = 1) {
  const spots = [23590, 23580, 23570, 23560, 23550, 23530, 23510, 23520, 23530, 23540, 23550];
  return history().map((s, i) => ({
    ...s, niftyLtp: sign === 1 ? spots[i] : 47000 - spots[i], overallSent: sign * (-30 + 2 * i)
  }));
}

test('reversal needs an observed approach/contact/retreat plus aligned recent momentum', () => {
  const obs = observation({ support: 23500, observedAt: NOW - 5 * MINUTE });
  const result = assessOpeningPilot(reversalHistory(), plan(), obs, NOW);
  assert.equal(result.status, 'PAPER ENTRY READY', result.reason);
  assert.equal(result.setup, 'REVERSAL');
  assert.equal(result.side, 'CE');
  assert.ok(result.daySentiment! < 0 && result.sentimentDelta! > 0);
  const pe = assessOpeningPilot(reversalHistory(-1), plan(), observation({
    support: 23200, resistance: 23500, observedAt: NOW - 5 * MINUTE
  }), NOW);
  assert.equal(pe.status, 'PAPER ENTRY READY', pe.reason);
  assert.equal(pe.setup, 'REVERSAL');
  assert.equal(pe.side, 'PE');
});

test('touch alone, unknown/unwinding wall and retroactive wall observation cannot confirm reversal', () => {
  for (const supportTrend of ['UNWINDING', 'UNKNOWN'] as const) {
    assert.notEqual(assessOpeningPilot(reversalHistory(), plan(), observation({
      support: 23500, supportTrend, observedAt: NOW - 5 * MINUTE
    }), NOW).status, 'PAPER ENTRY READY');
  }
  assert.notEqual(assessOpeningPilot(reversalHistory(), plan(), observation({
    support: 23500, observedAt: NOW - MINUTE, recordedAt: NOW
  }), NOW).status, 'PAPER ENTRY READY');
  const justTouch = history(-1).map((s, i) => ({ ...s, niftyLtp: 23560 - i * 5, overallSent: -30 + 2 * i }));
  assert.notEqual(assessOpeningPilot(justTouch, plan(), observation({ support: 23500 }), NOW).status, 'PAPER ENTRY READY');
});

test('entry captures immutable evidence, quantity and fixed ±10% premium levels', () => {
  const input = entry();
  const position = openPilotPosition(input);
  assert.equal(position.stopPremium, 90);
  assert.equal(position.targetPremium, 110);
  assert.equal(position.quantity, 150);
  assert.equal(position.entryQuoteAt, NOW);
  assert.equal(position.markAt, NOW);
  input.assessment.checks[0].detail = 'changed';
  assert.notEqual(position.assessment.checks[0].detail, 'changed');
  const q = quote(23350, 'CE', { lp: 123.45 });
  const c = selectPilotContract([q], 23550, 'CE', EXPIRY, NOW)!;
  const decimal = openPilotPosition(entry({ contract: c }));
  assert.equal(decimal.stopPremium, 111.11);
  assert.equal(decimal.targetPremium, 135.8);
});

test('non-ready or wrong-side assessment requires explicit reasoned override', () => {
  const assessment = { ...ready(), status: 'WAIT' as const };
  assert.throws(() => openPilotPosition(entry({ assessment })), /override/);
  assert.throws(() => openPilotPosition(entry({ assessment, override: true, reason: ' ' })), /reason/);
  assert.ok(openPilotPosition(entry({ assessment, override: true, reason: 'Manual paper-only practice' })).override);
  assert.throws(() => openPilotPosition(entry({ assessment: { ...ready(), side: 'PE' } })), /override/);
});

test('hard entry safety gates cannot be overridden', () => {
  const invalid: Partial<Parameters<typeof openPilotPosition>[0]>[] = [
    { now: NOW - MINUTE }, { now: Date.parse('2026-09-19T09:25:00+05:30') },
    { lots: 0 }, { lots: 1.5 }, { lots: Number.MAX_SAFE_INTEGER, lotSize: 75 },
    { lotSize: -1 }, { brokerage: -1 }, { brokerage: NaN }, { spot: 0 }, { spot: 23600 },
    { assessment: { ...ready(), at: NOW + 1 } }, { assessment: { ...ready(), at: NOW - 90_001 } },
    { assessment: { ...ready(), spot: null } },
    { contract: { ...contract(), quoteAt: NOW - 1 } },
    { contract: { ...contract(), expiry: '2026-09-16' } },
    { contract: { ...contract(), strike: 23550 } },
    { contract: { ...contract(), quote: quote(23350, 'CE', { lp: 0 }) } },
    { contract: { ...contract(), quote: quote(23350, 'CE', { tt: NOW + 1 }), quoteAt: NOW + 1 } },
    { contract: { ...contract(), quote: quote(23350, 'CE', { tt: NOW - 90_001 }), quoteAt: NOW - 90_001 } }
  ];
  for (const patch of invalid) assert.throws(() => openPilotPosition(entry({ ...patch, override: true, reason: 'Override' })));
});

test('overrides cannot bypass missing, failed or ambiguous market-data assessment checks', () => {
  for (const label of ['Market session', 'Live spot', 'Ten-minute warmup', 'Unambiguous samples', 'Timestamp continuity']) {
    const assessment = ready();
    const original = assessment.checks.find(c => c.label === label)!;
    const variants = [
      assessment.checks.filter(c => c.label !== label),
      assessment.checks.map(c => c.label === label ? { ...c, pass: false } : c),
      [...assessment.checks, original]
    ];
    for (const checks of variants) {
      assert.throws(() => openPilotPosition(entry({
        assessment: { ...assessment, checks }, override: true, reason: 'Manual paper practice'
      })), /Market-data safety/);
    }
  }
  const missingMinute = history().filter((_, i) => i !== 8);
  const assessment = assessOpeningPilot(missingMinute, plan(), observation(), NOW);
  assert.throws(() => openPilotPosition(entry({ assessment, override: true, reason: 'Manual paper practice' })), /cannot be overridden/);
  for (const rows of [[], history().map(s => ({ ...s, timestamp: undefined }))]) {
    const unavailable = assessOpeningPilot(rows, plan(), observation(), NOW);
    assert.equal(unavailable.snapshotAt, null);
    assert.throws(() => openPilotPosition(entry({
      assessment: unavailable, override: true, reason: 'Manual paper practice'
    })), /spot-history timestamp/);
  }
});

test('entry checks actual source freshness rather than a freshly stamped assessment alone', () => {
  for (const snapshotAt of [undefined, null, NOW + 1, NOW - 90_001, NOW - 24 * 60 * MINUTE]) {
    assert.throws(() => openPilotPosition(entry({
      assessment: { ...ready(), snapshotAt }, override: true, reason: 'Manual paper practice'
    })), /spot-history timestamp/);
  }
  const assessedAt = NOW + 90_000;
  const assessment = assessOpeningPilot(history(), plan(), observation({
    observedAt: NOW, recordedAt: NOW
  }), assessedAt);
  assert.equal(assessment.status, 'PAPER ENTRY READY');
  assert.equal(assessment.snapshotAt, NOW);
  const enteredAt = assessedAt + 1;
  const freshContract = selectPilotContract([tick(enteredAt, 100)], 23550, 'CE', EXPIRY, enteredAt)!;
  assert.throws(() => openPilotPosition(entry({
    assessment, contract: freshContract, now: enteredAt, override: true, reason: 'Manual paper practice'
  })), /spot-history timestamp/, 'assessment is only 1ms old but source history has expired');
});

test('first observed target/stop fills at actual premium, with costs on both captured legs', () => {
  const position = openPilotPosition(entry());
  const result = markPilotPosition(position, [tick(NOW + 30_000, 115)], NOW + 30_000);
  assert.ok(result.trade);
  assert.equal(result.trade.exitReason, 'TARGET');
  assert.equal(result.trade.exitPremium, 115);
  assert.equal(result.trade.grossPnl, 2250);
  const charges = Math.round((computeCharges(100, 150, 'BUY', 20).total + computeCharges(115, 150, 'SELL', 20).total) * 100) / 100;
  assert.equal(result.trade.charges, charges);
  assert.equal(result.trade.netPnl, Math.round((2250 - charges) * 100) / 100);
  assert.equal(result.trade.exitAt, NOW + 30_000);
  assert.equal(result.trade.exitQuoteAt, NOW + 30_000);
  assert.equal(result.trade.samplingGap, false);
  assert.equal(position.mark, 100);
});

test('gap-stop uses observed premium, not an imagined stop fill', () => {
  const position = openPilotPosition(entry());
  const at = NOW + 3 * MINUTE;
  const trade = markPilotPosition(position, [tick(at, 70)], at + 5000).trade!;
  assert.equal(trade.exitReason, 'STOPLOSS');
  assert.equal(trade.exitPremium, 70);
  assert.equal(trade.grossPnl, -4500);
  assert.equal(trade.samplingGap, true);
  assert.equal(trade.exitAt, at + 5000);
  assert.equal(trade.exitQuoteAt, at);
});

test('marks preserve frozen risk and sampled high/low; repeated quotes do not fill', () => {
  const original = openPilotPosition(entry());
  const marked = markPilotPosition(original, [
    tick(NOW + 20_000, 105), tick(NOW + 40_000, 95)
  ], NOW + 40_000);
  assert.equal(marked.trade, null);
  assert.equal(marked.position.highPremium, 105);
  assert.equal(marked.position.lowPremium, 95);
  assert.equal(marked.position.stopPremium, 90);
  assert.equal(marked.position.targetPremium, 110);
  assert.deepEqual(markPilotPosition(marked.position, [tick(NOW + 40_000, 70)], NOW + 45_000),
    { position: marked.position, trade: null });
  assert.equal(markPilotPosition(original, [tick(NOW, 70)], NOW).trade, null);
});

test('ordered batch stops at first observed threshold, not a later attractive price', () => {
  const position = openPilotPosition(entry());
  const result = markPilotPosition(position, [
    tick(NOW + 50_000, 130), tick(NOW + 10_000, 80), tick(NOW + 30_000, 100)
  ], NOW + MINUTE);
  assert.equal(result.trade?.exitPremium, 80);
  assert.equal(result.trade?.exitQuoteAt, NOW + 10_000);
  assert.equal(result.trade?.highPremium, 100);
});

test('no automatic fills on missing, stale, future, repeated, prior-day or wrong-expiry data', () => {
  const position = openPilotPosition(entry());
  const now = NOW + 2 * MINUTE;
  for (const quotes of [
    [], [tick(NOW + 20_000, 70)], [tick(now + 1, 70)],
    [tick(now - 24 * 60 * MINUTE, 70)], [tick(now, 70, { expiry_date: undefined })],
    [tick(now, 70, { expiry_date: '2026-09-29' })], [tick(now, 70, { tt: '09:27:00' })],
    [tick(now, 70, { symbol: 'NSE:NIFTY-23400-CE' })], [tick(now, 0)]
  ]) assert.deepEqual(markPilotPosition(position, quotes, now), { position, trade: null });
});

test('10–20 minutes is expectation only; no forced time or after-hours fill', () => {
  const position = openPilotPosition(entry());
  assert.equal(markPilotPosition(position, [tick(NOW + 25 * MINUTE, 101)], NOW + 25 * MINUTE).trade, null);
  const closed = Date.parse(`${DAY}T15:30:00+05:30`);
  assert.equal(markPilotPosition(position, [tick(closed, 70)], closed).trade, null);
  assert.throws(() => closePilotPosition(position, [tick(closed, 100)], closed), /hours/);
});

test('manual exit accepts the same valid last quote, not one before entry', () => {
  const position = openPilotPosition(entry());
  const marked = markPilotPosition(position, [tick(NOW + 30_000, 103)], NOW + 30_000).position;
  const trade = closePilotPosition(marked, [tick(NOW + 30_000, 103)], NOW + 45_000);
  assert.equal(trade.exitReason, 'MANUAL');
  assert.equal(trade.exitQuoteAt, NOW + 30_000);
  assert.equal(trade.exitAt, NOW + 45_000);
  assert.equal(closePilotPosition(position, [tick(NOW, 100)], NOW).exitReason, 'MANUAL');
  const c = selectPilotContract([tick(NOW - 1000, 100)], 23550, 'CE', EXPIRY, NOW)!;
  const olderEntryQuote = openPilotPosition(entry({ contract: c }));
  assert.throws(() => closePilotPosition(olderEntryQuote, [tick(NOW - 1000, 100)], NOW), /no earlier/);
  assert.equal(markPilotPosition(olderEntryQuote, [tick(NOW, 80)], NOW).trade, null);
});

test('manual close preserves auto-threshold precedence and rejects invalid data', () => {
  const position = openPilotPosition(entry());
  assert.equal(closePilotPosition(position, [tick(NOW + 10_000, 88)], NOW + 10_000).exitReason, 'STOPLOSS');
  assert.equal(closePilotPosition(position, [tick(NOW, 112)], NOW).exitReason, 'TARGET');
  for (const quotes of [
    [], [tick(NOW - 1, 100)], [tick(NOW + 1, 100)],
    [tick(NOW, 100, { expiry_date: undefined })], [tick(NOW, 100, { expiry_date: '2026-09-29' })],
    [tick(NOW, 100, { symbol: 'NSE:NIFTY-23400-CE' })]
  ]) assert.throws(() => closePilotPosition(position, quotes, NOW), /fresh/);
  assert.throws(() => closePilotPosition(position, [tick(NOW, 100)], NOW + 90_001), /fresh/);
});

test('exit batch gap flag measures adjacent observations, not total holding time', () => {
  const position = openPilotPosition(entry());
  const continuous = [tick(NOW + MINUTE, 102), tick(NOW + 2 * MINUTE, 104)];
  assert.equal(closePilotPosition(position, continuous, NOW + 2 * MINUTE).samplingGap, false);
  const gapped = [tick(NOW + 3 * MINUTE, 102), tick(NOW + 4 * MINUTE, 115)];
  assert.equal(markPilotPosition(position, gapped, NOW + 4 * MINUTE).trade?.samplingGap, true);
});

test('monitoring gaps persist across marks and flow into automatic and manual trades', () => {
  const initial = openPilotPosition(entry());
  assert.equal(initial.samplingGap, false);
  const gapAt = NOW + 3 * MINUTE;
  const gapped = markPilotPosition(initial, [tick(gapAt, 102)], gapAt);
  assert.equal(gapped.trade, null);
  assert.equal(gapped.position.samplingGap, true);
  assert.equal(initial.samplingGap, false);
  const restored = JSON.parse(JSON.stringify(gapped.position));
  const nextAt = gapAt + MINUTE;
  const continuous = markPilotPosition(restored, [tick(nextAt, 104)], nextAt);
  assert.equal(continuous.position.samplingGap, true);
  assert.equal(markPilotPosition(continuous.position, [], nextAt).position.samplingGap, true);
  assert.equal(markPilotPosition(continuous.position, [tick(nextAt, 104)], nextAt).position.samplingGap, true);
  const exited = markPilotPosition(continuous.position, [tick(nextAt + MINUTE, 115)], nextAt + MINUTE);
  assert.equal(exited.position.samplingGap, true);
  assert.equal(exited.trade?.samplingGap, true);
  assert.equal(closePilotPosition(continuous.position, [tick(nextAt, 104)], nextAt).samplingGap, true);
});

test('legacy positions without the optional gap flag begin with uninterrupted monitoring', () => {
  const position = openPilotPosition(entry());
  delete position.samplingGap;
  const at = NOW + MINUTE;
  const result = markPilotPosition(position, [tick(at, 103)], at);
  assert.equal(result.position.samplingGap, false);
  assert.equal(closePilotPosition(result.position, [tick(at, 103)], at).samplingGap, false);
});

test('reconciliation reports a historical exit even after expiry without inferring stop/target success', () => {
  const position = openPilotPosition(entry());
  const recordedAt = Date.parse('2026-09-26T22:00:00+05:30');
  const exitedAt = Date.parse(`${EXPIRY}T15:29:59+05:30`);
  for (const premium of [70, 103, 140]) {
    const report = reconcilePilotPosition(position, premium, exitedAt, recordedAt, '  Browser was closed; exit manually reported from my notes.  ');
    assert.equal(report.exitReason, 'RECONCILED');
    assert.equal(report.exitPremium, premium);
    assert.equal(report.exitAt, exitedAt);
    assert.equal(report.exitQuoteAt, exitedAt, 'legacy timestamp is reported, not quote-verified');
    assert.equal(report.exitRecordedAt, recordedAt);
    assert.equal(report.exitNote, 'Browser was closed; exit manually reported from my notes.');
    assert.equal(report.samplingGap, true);
    const costs = Math.round((computeCharges(100, 150, 'BUY', 20).total +
      computeCharges(premium, 150, 'SELL', 20).total) * 100) / 100;
    assert.equal(report.charges, costs);
    assert.equal(report.grossPnl, (premium - 100) * 150);
    assert.equal(report.netPnl, Math.round((report.grossPnl - costs) * 100) / 100);
    assert.equal(position.mark, 100, 'report does not mutate the position');
    assert.equal(position.samplingGap, false);
  }
  assert.equal(reconcilePilotPosition(position, 100, NOW, NOW, 'Reported immediate paper exit').exitAt, NOW);
  assert.throws(() => closePilotPosition(position, [tick(recordedAt, 103)], recordedAt), /hours/);
});

test('reconciliation rejects invalid premium/note, future/before-entry and closed-session exit times', () => {
  const position = openPilotPosition(entry());
  const recordedAt = Date.parse('2026-09-26T22:00:00+05:30');
  const note = 'Manually reported after missing monitoring';
  for (const premium of [0, -1, NaN, Infinity]) {
    assert.throws(() => reconcilePilotPosition(position, premium, NOW, recordedAt, note), /premium/);
  }
  for (const text of ['', '   ', 'missed', '.............', '1234567890123']) {
    assert.throws(() => reconcilePilotPosition(position, 100, NOW, recordedAt, text), /note/);
  }
  for (const at of [NOW - 1, recordedAt + 1, NaN, Infinity]) {
    assert.throws(() => reconcilePilotPosition(position, 100, at, recordedAt, note), /time/);
  }
  for (const timestamp of [
    '2026-09-18T09:14:59+05:30', '2026-09-18T15:30:00+05:30',
    '2026-09-19T10:00:00+05:30', '2026-09-23T10:00:00+05:30'
  ]) {
    assert.throws(() => reconcilePilotPosition(position, 100, Date.parse(timestamp), recordedAt, note), /session/);
  }
  assert.throws(() => reconcilePilotPosition({ ...position, expiry: 'unknown' }, 100, NOW, recordedAt, note), /expiry/);
  assert.throws(() => reconcilePilotPosition(position, 100, NOW, NaN, note), /time/);
  assert.throws(() => reconcilePilotPosition({ ...position, quantity: 0 }, 100, NOW, recordedAt, note), /costs/);
});

assert.equal(PILOT_POLICY.maxQuoteAgeMs, 90_000);
assert.equal(PILOT_POLICY.maxObservationAgeMs, 300_000);
console.log(`\n${passed} Opening Pilot tests passed.`);
