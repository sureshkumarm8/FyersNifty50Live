import assert from 'node:assert/strict';
import { DECISION_SCHEMA } from '../components/premarket/model';
import { derivePilotSources } from '../services/openingPilotSources';
import type { VisionRun, VisionVerdict } from '../types';

const at = (clock: string, day = '2026-09-17') => Date.parse(`${day}T${clock}+05:30`);
const NOW = at('09:26:00');
let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed++;
  console.log(`  ok    ${name}`);
}

function phase(basis = 'CHARTS_ONLY', clock = '08:50:00', patch: Record<string, unknown> = {}) {
  return {
    schema: DECISION_SCHEMA, basis, generatedAt: at(clock), spot: 24500,
    spotSource: basis === 'CHARTS_ONLY' ? 'CHARTS' : 'LIVE',
    aiSummary: 'Price is consolidating near support.', riskReason: 'Overhead supply remains.',
    supports: [24400], resistances: [24700],
    scenarios: {
      flat: { description: 'A balanced open within the range.' },
      gapUp: { description: 'An opening gap tests overhead supply.' },
      gapDown: { description: 'An opening gap tests lower demand.' },
    },
    playbook: {
      closePrice: 24999, targetPoints: 30, itmPoints: 250, hardStop: '10:15',
      scenarios: [
        ['FLAT', 0], ['GAP_UP_50', 50], ['GAP_UP_100', 100],
        ['GAP_DOWN_50', -50], ['GAP_DOWN_100', -100],
      ].map(([id, offset]) => ({
        id, offset, support: 24400, resistance: 24700,
        location: 'INSIDE_ZONE', likelihood: 20, tradable: false,
        headline: 'Use 250 ITM with a 30-point target until 10:15.',
        plays: [{ itmPoints: 250, targetSpot: 24530, stopSpot: 24470 }],
        invalidations: ['Hard stop 10:15'], clock: [{ time: '10:15' }],
      })),
    },
    ...patch,
  };
}

function decision() {
  return phase('INTRADAY', '09:25:00', {
    spot: 24650,
    phases: {
      CHARTS_ONLY: phase(),
      PREOPEN: phase('PREOPEN', '09:12:00', { spot: 24550 }),
      INTRADAY: phase('INTRADAY', '09:25:00', { spot: 24650 }),
    },
  });
}

function chart(slot: string, clock = '08:45:00', patch: Record<string, unknown> = {}) {
  return {
    slot, uploadedAt: at(clock), analyzedAt: at(clock) + 10_000,
    verdict: {
      structured: true, confidence: 80, summary: 'Readable chart',
      supports: [24400], resistances: [24700], lastPrice: 24450,
    },
    ...patch,
  };
}

function run(id = 'one', start = '09:24:00', finish = '09:24:30', parsed: Partial<VisionVerdict> = {}): VisionRun {
  return {
    id, manual: false, startedAt: new Date(at(start)).toISOString(),
    finishedAt: new Date(at(finish)).toISOString(), durationMs: 30_000,
    shots: [
      { id: 'kite', label: 'Kite', url: 'local:kite', ok: true },
      { id: 'sensibull', label: 'Sensibull', url: 'local:sensibull', ok: true },
    ],
    analysis: {
      ok: true,
      parsed: {
        readable: true, bias: 'bullish', confidence: 90, spot_estimate: '24500',
        price_action: 'Price reclaimed support.', supports: ['24350'], resistances: ['24750'],
        oi_read: 'Put OI is prominent.', highest_call_oi_strike: '24,700',
        highest_put_oi_strike: '24,400', expected_range: '24400–24700',
        combined_view: 'Bullish support reclaim.', watch_for: ['Hold support'], risks: ['Failure to hold'],
        ...parsed,
      },
    },
  };
}

function derive(patch: Partial<Parameters<typeof derivePilotSources>[0]> = {}) {
  return derivePilotSources({ decision: null, chartMeta: null, visionRuns: [], now: NOW, ...patch });
}
const vision = (runs: VisionRun[], now = NOW) => derive({ visionRuns: runs, now }).observations.filter(o => o.source?.kind === 'VISION');

test('missing sources are explicit and GIFT is never inferred', () => {
  const result = derive();
  assert.equal(result.giftStatus, 'Not supplied by existing sources; no confirmation assumed');
  assert.equal(result.plans.length, 0);
  assert.equal(result.observations.length, 0);
  const populated = derive({ decision: decision(), visionRuns: [run()] });
  assert.ok(populated.observations.every(o => o.giftChange === null));
});

test('malformed saved values never throw and explain rejection', () => {
  for (const value of [[], false, 3, 'saved', {}, { schema: DECISION_SCHEMA }, { schema: DECISION_SCHEMA, phases: [1] }]) {
    const result = derive({ decision: value, chartMeta: value });
    assert.equal(result.plans.length, 0);
    assert.match(result.premarketStatus, /rejected|malformed/i);
  }
  assert.doesNotThrow(() => derive({ chartMeta: { OI_SNAPSHOT: { verdict: [] }, INTRADAY_1M: true } }));
  assert.match(derive({ now: NaN }).visionStatus, /invalid current timestamp/);
});

test('old schemas, previous-day phases and future phases never become today plans', () => {
  for (const source of [
    phase('CHARTS_ONLY', '08:50:00', { schema: DECISION_SCHEMA - 1 }),
    phase('CHARTS_ONLY', '08:50:00', { generatedAt: at('08:50:00', '2026-09-16') }),
    phase('CHARTS_ONLY', '08:50:00', { generatedAt: at('08:50:00', '2026-09-18') }),
  ]) {
    const result = derive({ decision: source });
    assert.equal(result.plans.length, 0);
    assert.match(result.premarketStatus, /rejected/);
  }
  assert.equal(derive({ decision: phase(), now: at('08:40:00') }).plans.length, 0);
});

test('same-day CHARTS_ONLY is the reference, never the live playbook close', () => {
  const result = derive({ decision: decision() });
  assert.equal(result.plans.length, 3);
  for (const plan of result.plans) {
    assert.equal(plan.day, '2026-09-17');
    assert.equal(plan.previousClose, 24500);
    assert.equal(plan.savedAt, NOW);
    assert.match(plan.notes, /same-day CHARTS_ONLY/);
    assert.equal(plan.source?.kind, 'PREMARKET');
    assert.match(plan.source?.label ?? '', /CHARTS_ONLY|PREOPEN|INTRADAY/);
    assert.match(plan.id, /^preMkt/);
  }
});

test('09:25 is inclusive and later roots retain only valid earlier phases', () => {
  const source = decision();
  const first = derive({ decision: source });
  assert.ok(first.plans.some(p => p.source?.at === at('09:25:00')));
  const later = { ...source, generatedAt: at('09:40:00') };
  const result = derive({ decision: later, now: at('10:00:00') });
  assert.deepEqual(result.plans.map(p => p.id), first.plans.map(p => p.id));
  assert.ok(result.plans.every(p => p.source!.at <= at('09:25:00')));
  const excluded = derive({ decision: phase('INTRADAY', '09:25:00', {
    generatedAt: at('09:25:00') + 1, phases: { CHARTS_ONLY: phase() },
  }) });
  assert.equal(excluded.plans.length, 1);
});

test('future reference phases and live close cannot backfill earlier knowledge', () => {
  const source = phase('PREOPEN', '09:12:00', {
    phases: { CHARTS_ONLY: phase('CHARTS_ONLY', '09:13:00') },
  });
  const result = derive({ decision: source });
  assert.equal(result.plans.length, 0);
  assert.match(result.premarketStatus, /No genuine previous-close reference/);
});

test('forced phase labels and CHARTS pretend pre-open prices are rejected', () => {
  for (const invalid of [
    phase('PREOPEN', '09:12:00', { spotSource: 'CHARTS' }),
    phase('PREOPEN', '09:15:00'),
    phase('PREOPEN', '09:09:59'),
    phase('PREOPEN', '09:12:00', { forced: true }),
  ]) {
    const result = derive({ decision: { ...invalid, phases: { CHARTS_ONLY: phase() } } });
    assert.equal(result.observations.filter(o => o.preOpen !== null).length, 0);
    assert.equal(result.plans.length, 1);
    assert.match(result.premarketStatus, /forced\/mislabeled/);
  }
});

test('phase map keys must match actual phase labels', () => {
  const result = derive({ decision: phase('CHARTS_ONLY', '08:50:00', {
    phases: { PREOPEN: phase('INTRADAY', '09:16:00') },
  }) });
  assert.equal(result.plans.length, 1);
  assert.match(result.premarketStatus, /malformed phase/);
});

test('genuine LIVE or MANUAL pre-open prices preserve their time, without invented OI', () => {
  for (const spotSource of ['LIVE', 'MANUAL']) {
    const result = derive({ decision: phase('PREOPEN', '09:10:00', { spotSource, spot: 24555 }) });
    const obs = result.observations[0];
    assert.equal(obs.preOpen, 24555);
    assert.equal(obs.observedAt, at('09:10:00'));
    assert.equal(obs.source?.at, at('09:10:00'));
    assert.equal(obs.support, null);
    assert.equal(obs.resistance, null);
  }
});

test('valid early intraday chart reference is labeled and respects analysis availability', () => {
  const meta = { INTRADAY_1M: chart('INTRADAY_1M') };
  const result = derive({ decision: phase('PREOPEN', '09:12:00'), chartMeta: meta });
  assert.equal(result.plans[0].previousClose, 24450);
  assert.match(result.plans[0].notes, /INTRADAY_1M lastPrice/);
  assert.equal(derive({ decision: phase('PREOPEN', '09:12:00'), chartMeta: {
    INTRADAY_1M: chart('INTRADAY_1M', '08:45:00', { analyzedAt: at('09:10:00') }),
  } }).plans.length, 0);
  const prior = derive({ decision: phase('PREOPEN', '09:12:00'), chartMeta: {
    INTRADAY_1M: chart('INTRADAY_1M', '08:45:00', {
      uploadedAt: at('15:29:00', '2026-09-16'), analyzedAt: at('15:30:00', '2026-09-16'),
    }),
  } });
  assert.equal(prior.plans[0].previousClose, 24450);
});

test('unreadable/late charts are not close references and future analysis never supplies walls', () => {
  for (const bad of [
    chart('INTRADAY_1M', '09:11:00'),
    chart('INTRADAY_1M', '08:45:00', { verdict: { lastPrice: 24500, structured: false } }),
    chart('INTRADAY_1M', '08:45:00', { analyzedAt: NOW + 1 }),
    chart('INTRADAY_1M', '08:45:00', { analyzedAt: undefined }),
    chart('INTRADAY_1M', '08:45:00', { uploadedAt: 'yesterday' }),
    chart('INTRADAY_1M', '08:45:00', {
      uploadedAt: at('15:30:00', '2026-09-15'), analyzedAt: at('15:31:00', '2026-09-15'),
    }),
  ]) assert.equal(derive({ decision: phase('PREOPEN', '09:12:00'), chartMeta: { INTRADAY_1M: bad } }).plans.length, 0);
  assert.equal(derive({ chartMeta: { OI_SNAPSHOT: chart('OI_SNAPSHOT', '09:24:00', { analyzedAt: NOW + 1 }) } }).observations.length, 0);
});

test('chart fallback cannot import a phase generated before that reference was known', () => {
  const result = derive({
    decision: phase('INTRADAY', '09:16:00', { phases: { CHARTS_ONLY: phase('CHARTS_ONLY', '08:40:00', { forced: true }) } }),
    chartMeta: { INTRADAY_1M: chart('INTRADAY_1M', '08:45:00') },
  });
  assert.equal(result.plans.length, 1);
  assert.equal(result.plans[0].source?.at, at('09:16:00'));
});

test('five scenario contexts map without importing Sniper executions or trade rules', () => {
  const source = phase('CHARTS_ONLY', '08:50:00', {
    aiSummary: 'Support is holding. Buy 250 ITM for a 30-point target. Close at 10:15.',
    riskReason: 'Supply above price. Fixed stoploss 30 points.',
  });
  const plan = derive({ decision: source }).plans[0];
  assert.deepEqual(plan.scenarios.map(s => s.scenario), ['FLAT', 'UP_50', 'UP_100', 'DOWN_50', 'DOWN_100']);
  assert.deepEqual([plan.flatBand, plan.mediumBand, plan.outerBand], [25, 75, 150]);
  assert.match(plan.scenarios[1].expectation, /opening gap tests overhead supply/);
  assert.match(plan.scenarios[0].expectation, /24400/);
  const serialized = JSON.stringify(plan);
  assert.doesNotMatch(serialized, /30-point|250|10:15|targetSpot|tradable|clock|plays/);
  assert.match(plan.notes, /200 ITM and ±10% premium/);
  assert.match(plan.notes, /Support is holding/);
});

test('plan and observation IDs stay stable across polling; knowledge is recorded at transformation', () => {
  const input = { decision: decision(), chartMeta: { OI_SNAPSHOT: chart('OI_SNAPSHOT') }, visionRuns: [run()] };
  const first = derive(input);
  const later = derive({ ...input, now: NOW + 60_000 });
  assert.deepEqual(later.plans.map(p => p.id), first.plans.map(p => p.id));
  assert.deepEqual(later.observations.map(o => o.id), first.observations.map(o => o.id));
  assert.deepEqual(later.observations.map(o => o.observedAt), first.observations.map(o => o.observedAt));
  assert.deepEqual(later.observations.map(o => o.source?.at), first.observations.map(o => o.source?.at));
  assert.ok(first.observations.every(o => o.recordedAt === NOW));
  assert.ok(later.observations.every(o => o.recordedAt === NOW + 60_000));
  const kept = new Map(first.observations.map(o => [o.id, o]));
  later.observations.forEach(o => { if (!kept.has(o.id)) kept.set(o.id, o); });
  assert.ok([...kept.values()].every(o => o.recordedAt === NOW));
});

test('source content changes produce distinct IDs without touching original timestamps', () => {
  const first = derive({ decision: phase() }).plans[0];
  const second = derive({ decision: phase('CHARTS_ONLY', '08:50:00', { aiSummary: 'Supply is increasing.' }) }).plans[0];
  assert.notEqual(first.id, second.id);
  assert.equal(first.source?.at, second.source?.at);
});

test('OI only comes from the OI screenshot with original upload time, not generic levels', () => {
  const result = derive({ decision: decision(), chartMeta: {
    OI_SNAPSHOT: chart('OI_SNAPSHOT', '08:45:00'),
    DAILY_1Y: chart('DAILY_1Y', '09:24:00'),
  } });
  const oi = result.observations.find(o => o.source?.label.includes('OI_SNAPSHOT'))!;
  assert.equal(oi.observedAt, at('08:45:00'));
  assert.equal(oi.source?.at, at('08:45:00'));
  assert.equal(oi.support, 24400);
  assert.equal(oi.supportTrend, 'UNKNOWN');
  assert.match(result.premarketStatus, /stale/);
  const noOi = derive({ decision: decision(), chartMeta: { DAILY_1Y: chart('DAILY_1Y', '09:24:00') } });
  assert.ok(noOi.observations.every(o => o.support === null && o.resistance === null));
  assert.match(noOi.premarketStatus, /No usable OI_SNAPSHOT/);
});

test('prior-session OI retains its original day and cannot get a current-day freshness waiver', () => {
  const yesterday = at('15:25:00', '2026-09-16');
  const result = derive({ chartMeta: { OI_SNAPSHOT: chart('OI_SNAPSHOT', '08:45:00', {
    uploadedAt: yesterday, analyzedAt: yesterday + 30_000,
  }) } });
  const obs = result.observations[0];
  assert.equal(obs.day, '2026-09-16');
  assert.equal(obs.observedAt, yesterday);
  assert.equal(obs.source?.at, yesterday);
  assert.match(result.premarketStatus, /stale\/prior-session/);
});

test('first Vision read has unknown writer trends, no repeats, and carries all narrative', () => {
  const obs = vision([run()])[0];
  assert.equal(obs.support, 24400);
  assert.equal(obs.resistance, 24700);
  assert.equal(obs.supportTrend, 'UNKNOWN');
  assert.equal(obs.resistanceTrend, 'UNKNOWN');
  assert.deepEqual(obs.vision, {
    bias: 'bullish', priceAction: 'Price reclaimed support.', oiRead: 'Put OI is prominent.',
    combinedView: 'Bullish support reclaim.', watchFor: ['Hold support'], risks: ['Failure to hold'],
    supportRepeated: false, resistanceRepeated: false,
    supportObservedSince: at('09:24:30'), resistanceObservedSince: at('09:24:30'),
  });
});

test('Vision capture and source availability use start and finish, not polling time', () => {
  const source = run();
  const obs = vision([source])[0];
  assert.equal(obs.observedAt, at('09:24:00'));
  assert.equal(obs.source?.at, at('09:24:30'));
  assert.equal(obs.recordedAt, NOW);
  assert.equal(vision([source], at('09:24:29')).length, 0);
  assert.equal(vision([source], at('09:24:30')).length, 1);
});

test('failed, skipped, unreadable and login runs invalidate earlier usable walls', () => {
  const prior = run('prior', '09:22:00', '09:22:30');
  const changes: ((source: VisionRun) => void)[] = [
    source => { source.analysis.ok = false; },
    source => { source.analysis.skipped = true; },
    source => { source.analysis.parsed = null; },
    source => { source.analysis.parsed!.readable = false; },
    source => { source.shots[0].awaitingLogin = true; },
    source => { source.shots[1].ok = false; },
    source => { source.shots = source.shots.slice(0, 1); },
  ];
  for (const change of changes) {
    const latest = run();
    change(latest);
    const result = derive({ visionRuns: [latest, prior] });
    assert.equal(result.observations.length, 2);
    const blocked = result.observations[1];
    assert.equal(blocked.support, null);
    assert.equal(blocked.resistance, null);
    assert.equal(blocked.source?.at, at('09:24:30'));
    assert.match(blocked.notes, /Blocked/);
    assert.match(result.visionStatus, /Latest Vision blocked/);
  }
});

test('ambiguous, non-strike, negative and unordered highest OI values block, without chart fallback', () => {
  for (const candidate of ['24,400–24,450', '24400 / 24450', 'Support 24400', '~24400', '24.4k', '24400.0',
    '', '-24400', '999', '100050', '24425', '24,40,0', '24700', '24800']) {
    const source = run('ambiguous', '09:24:00', '09:24:30', { highest_put_oi_strike: candidate });
    const result = derive({ visionRuns: [source] });
    assert.equal(result.observations[0].support, null, candidate);
    assert.equal(result.observations[0].resistance, null, candidate);
    assert.match(result.visionStatus, /blocked/i);
    assert.equal(result.observations[0].vision?.supportRepeated, false);
  }
});

test('plain and correctly comma-formatted individual Nifty strikes are accepted', () => {
  for (const candidate of ['24400', '24,400', ' 24,400 ']) {
    assert.equal(vision([run('strike', '09:24:00', '09:24:30', { highest_put_oi_strike: candidate })])[0].support, 24400);
  }
});

test('repeated wall strikes are not evidence of unchanged quantities or active writing', () => {
  const first = run('prior', '09:22:00', '09:22:30', { oi_read: 'Heavy put writing.' });
  const latest = run('latest', '09:24:00', '09:24:30', { oi_read: 'Call unwinding, put writing.' });
  const obs = vision([latest, first])[1];
  assert.equal(obs.vision?.supportRepeated, true);
  assert.equal(obs.vision?.resistanceRepeated, true);
  assert.equal(obs.vision?.supportObservedSince, at('09:22:30'));
  assert.equal(obs.vision?.resistanceObservedSince, at('09:22:30'));
  assert.equal(obs.supportTrend, 'UNKNOWN');
  assert.equal(obs.resistanceTrend, 'UNKNOWN');
  assert.match(obs.notes, /not unchanged OI quantity/);
});

test('each changed wall resets only its own repeat flag', () => {
  const first = run('prior', '09:22:00', '09:22:30');
  const obs = vision([first, run('latest', '09:24:00', '09:24:30', { highest_put_oi_strike: '24450' })])[1];
  assert.equal(obs.vision?.supportRepeated, false);
  assert.equal(obs.vision?.resistanceRepeated, true);
  assert.equal(obs.vision?.supportObservedSince, at('09:24:30'));
  assert.equal(obs.vision?.resistanceObservedSince, at('09:22:30'));
});

test('stale, overlapping, invalid and future prior runs cannot establish repeated levels', () => {
  const latest = run();
  const invalid = run('bad', '09:22:00', '09:22:30');
  invalid.analysis.ok = false;
  for (const prior of [
    run('old', '09:18:00', '09:18:30'),
    run('overlap', '09:23:50', '09:24:10'),
    run('future', '09:27:00', '09:27:30'),
    invalid,
  ]) {
    const obs = vision([prior, latest]).find(o => o.observedAt === at('09:24:00'))!;
    assert.equal(obs.vision?.supportRepeated, false);
    assert.equal(obs.vision?.resistanceRepeated, false);
    assert.equal(obs.vision?.supportObservedSince, at('09:24:30'));
    assert.equal(obs.vision?.resistanceObservedSince, at('09:24:30'));
  }
});

test('wall knowledge starts at prior analysis completion, never at its earlier capture', () => {
  const prior = run('slow-prior', '09:20:00', '09:23:45');
  const latest = run();
  const obs = vision([prior, latest])[1];
  assert.equal(obs.vision?.supportRepeated, true);
  assert.equal(obs.vision?.supportObservedSince, at('09:23:45'));
  assert.ok(obs.vision!.supportObservedSince! > at('09:22:00'), 'a touch before analysis finished was not informed by that wall');
  const polled = vision([prior, latest], NOW + 60_000)[1];
  assert.equal(polled.id, obs.id);
  assert.equal(polled.vision?.supportObservedSince, at('09:23:45'));
});

test('matching-wall availability does not carry forward a stale ancestral capture', () => {
  const earliest = run('ancestor', '09:17:00', '09:17:30');
  const prior = run('prior', '09:21:00', '09:21:30');
  const latest = run();
  const obs = vision([earliest, prior, latest])[2];
  assert.equal(obs.vision?.supportRepeated, true);
  assert.equal(obs.vision?.supportObservedSince, at('09:21:30'));
  assert.notEqual(obs.vision?.supportObservedSince, at('09:17:30'));
});

test('five-minute prior-capture boundary is inclusive and does not reset source time', () => {
  const prior = run('boundary', '09:19:30', '09:20:00');
  const boundary = vision([prior, run()])[1];
  assert.equal(boundary.vision?.supportRepeated, true);
  assert.equal(boundary.vision?.supportObservedSince, at('09:20:00'));
  const expired = { ...prior, startedAt: new Date(at('09:19:30') - 1).toISOString() };
  const notRepeated = vision([expired, run()])[1];
  assert.equal(notRepeated.vision?.supportRepeated, false);
  assert.equal(notRepeated.vision?.supportObservedSince, at('09:24:30'));
});

test('slow analysis cannot make an old capture fresh for repeated-wall confirmation', () => {
  const prior = run('old-capture', '09:18:00', '09:23:00');
  const obs = vision([prior, run()])[1];
  assert.equal(obs.vision?.supportRepeated, false);
});

test('stale latest Vision remains observable at original time with an explicit stale status', () => {
  const source = run('stale', '09:18:00', '09:18:30');
  const result = derive({ visionRuns: [source] });
  assert.equal(result.observations.length, 1);
  assert.equal(result.observations[0].observedAt, at('09:18:00'));
  assert.equal(result.observations[0].source?.at, at('09:18:30'));
  assert.match(result.visionStatus, /stale.*no fresh signal/);
});

test('previous-day, future, reversed and malformed Vision timestamps are excluded', () => {
  const sources = [
    { ...run(), startedAt: new Date(at('09:24:00', '2026-09-16')).toISOString(), finishedAt: new Date(at('09:24:30', '2026-09-16')).toISOString() },
    run('future', '09:27:00', '09:27:30'),
    run('reversed', '09:24:30', '09:24:00'),
    { ...run(), finishedAt: '' },
  ];
  const result = derive({ visionRuns: sources });
  assert.equal(result.observations.length, 0);
  assert.match(result.visionStatus, /No valid completed Vision run for today/);
});

test('polling and duplicate live/archive copies do not create distinct Vision records', () => {
  const source = run();
  const first = vision([source, structuredClone(source)]);
  const second = vision([source], NOW + 60_000);
  assert.equal(first.length, 1);
  assert.equal(first[0].id, second[0].id);
  assert.equal(first[0].observedAt, second[0].observedAt);
});

console.log(`\n${passed} Opening Pilot source-adapter tests passed.`);
