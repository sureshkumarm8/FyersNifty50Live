/**
 * Round-trip and hostile-input tests for the Pre-Market JSON envelope.
 *
 * The import path is the only place in this screen where untrusted data enters
 * the decision maths, so the cases that matter are the ugly ones: a plan from an
 * older schema, a verdict whose numbers arrived as strings, a slot that no
 * longer exists.
 */
import assert from 'node:assert';
import { ChartEntry, ChartSlotId, DECISION_SCHEMA } from '../components/premarket/model';
import {
  PREMARKET_EXPORT_KIND, buildPreMarketExport, parsePreMarketExport, preMarketExportFileName,
  serializePreMarketExport
} from '../services/premarketExport';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const AT = Date.UTC(2026, 0, 15, 3, 30); // 09:00 IST

const entry = (slot: ChartSlotId, extra: Partial<ChartEntry> = {}): ChartEntry => ({
  slot,
  data: PNG,
  fileName: `${slot}.png`,
  uploadedAt: AT,
  analyzedAt: AT + 60000,
  verdict: {
    bias: 'BULLISH',
    confidence: 72,
    summary: 'Holding above the rising 20-day average.',
    supports: [24700, 24600],
    resistances: [25000],
    notes: ['Put writing at 24700'],
    lastPrice: 24850,
    structured: true,
    raw: '{}'
  },
  ...extra
});

const charts: Partial<Record<ChartSlotId, ChartEntry>> = {
  DAILY_1Y: entry('DAILY_1Y'),
  OI_SNAPSHOT: entry('OI_SNAPSHOT')
};

const decision: any = {
  schema: DECISION_SCHEMA,
  generatedAt: AT,
  generatedAtStr: '09:00:00',
  spot: 24850,
  playbook: {
    briefing: 'Buy the 24700 shelf.',
    verdictHeadline: 'Long bias',
    plannedSupport: 24700,
    plannedResistance: 25000,
    closePrice: 24850
  },
  basis: 'PREOPEN',
  supports: [24700],
  resistances: [25000],
  phases: {}
};

// 1. Full round trip ---------------------------------------------------------
{
  const payload = buildPreMarketExport({ charts, decision, includeImages: true, now: AT });
  assert.equal(payload.kind, PREMARKET_EXPORT_KIND);
  assert.equal(payload.sessionDate, '2026-01-15');
  assert.equal(payload.includesImages, true);
  assert.equal(payload.charts.length, 2);
  // Slot order, not insertion order, so repeat exports diff cleanly.
  assert.deepEqual(payload.charts.map(c => c.slot), ['DAILY_1Y', 'OI_SNAPSHOT']);
  assert.equal(preMarketExportFileName(payload), 'premarket_2026-01-15.json');

  const back = parsePreMarketExport(serializePreMarketExport(payload));
  assert.deepEqual(back.warnings, []);
  assert.equal(Object.keys(back.charts).length, 2);
  assert.deepEqual(back.charts.DAILY_1Y, charts.DAILY_1Y);
  assert.equal(back.decision?.spot, 24850);
  assert.equal(back.sessionDate, '2026-01-15');
}

// 2. Data-only export keeps the plan but is not a restore point --------------
{
  const payload = buildPreMarketExport({ charts, decision, includeImages: false, now: AT });
  assert.equal(payload.includesImages, false);
  assert.ok(payload.charts.every(c => c.image === undefined));
  assert.ok(payload.charts.every(c => c.verdict?.confidence === 72));
  assert.equal(preMarketExportFileName(payload), 'premarket_2026-01-15_data.json');

  const back = parsePreMarketExport(serializePreMarketExport(payload));
  assert.equal(Object.keys(back.charts).length, 0);
  assert.ok(back.warnings.some(w => /no screenshot/i.test(w)));
  assert.equal(back.decision?.spot, 24850);
}

// 3. A plan from another schema is refused, charts survive -------------------
{
  const payload = buildPreMarketExport({ charts, decision, includeImages: true, now: AT });
  const stale = { ...payload, decision: { ...decision, schema: DECISION_SCHEMA - 1 } };
  const back = parsePreMarketExport(JSON.stringify(stale));
  assert.equal(back.decision, null);
  assert.equal(Object.keys(back.charts).length, 2);
  assert.ok(back.warnings.some(w => /schema/i.test(w)));
}

// 3b. Levels that cannot be traded are refused before they reach the engine --
{
  const payload = buildPreMarketExport({ charts, decision, includeImages: true, now: AT });
  const cases: any[] = [
    { ...decision.playbook, plannedSupport: '24700' },        // string from a hand edit
    { ...decision.playbook, plannedResistance: null },
    { ...decision.playbook, plannedSupport: 25000, plannedResistance: 24700 }, // inverted
    { ...decision.playbook, plannedSupport: -1 }
  ];
  for (const playbook of cases) {
    const bad = { ...payload, decision: { ...decision, playbook } };
    const back = parsePreMarketExport(JSON.stringify(bad));
    assert.equal(back.decision, null, `unusable levels must not load: ${JSON.stringify(playbook)}`);
    assert.ok(back.warnings.some(w => /levels/i.test(w)));
    assert.equal(Object.keys(back.charts).length, 2, 'the charts still survive a bad plan');
  }
}

// 4. Hostile fields are coerced, not trusted ---------------------------------
{  const back = parsePreMarketExport(
    JSON.stringify({
      kind: PREMARKET_EXPORT_KIND,
      version: 1,
      exportedAt: AT,
      sessionDate: '2026-01-15',
      charts: [
        {
          slot: 'DAILY_1Y',
          image: PNG,
          fileName: 'x.png',
          uploadedAt: AT,
          verdict: {
            bias: 'very bullish indeed',
            confidence: '900',
            supports: ['24700', 24600, -5],
            resistances: null,
            notes: 'not a list',
            lastPrice: 'abc'
          }
        },
        { slot: 'NOT_A_SLOT', image: PNG },
        { slot: 'DAILY_1Y', image: PNG }
      ],
      decision: null
    })
  );

  const v = back.charts.DAILY_1Y!.verdict!;
  assert.equal(v.bias, 'NEUTRAL', 'unrecognised bias must not become directional');
  assert.equal(v.confidence, 0, 'a non-numeric confidence falls to 0, which reads as unreadable');
  assert.deepEqual(v.supports, [24600], 'string and negative levels are dropped');
  assert.deepEqual(v.resistances, []);
  assert.deepEqual(v.notes, []);
  assert.equal(v.lastPrice, undefined);
  assert.ok(back.warnings.some(w => /unknown chart slot/i.test(w)));
  assert.ok(back.warnings.some(w => /duplicate/i.test(w)));
}

// 5. Files that are not ours are rejected loudly -----------------------------
{
  assert.throws(() => parsePreMarketExport('not json'), /valid JSON/i);
  assert.throws(() => parsePreMarketExport('{"kind":"something-else"}'), /not a pre-market export/i);
  assert.throws(
    () => parsePreMarketExport(JSON.stringify({ kind: PREMARKET_EXPORT_KIND, charts: [], decision: null })),
    /nothing importable/i
  );
}

// 6. A newer envelope is read best-effort, with a warning --------------------
{
  const payload = buildPreMarketExport({ charts, decision: null, includeImages: true, now: AT });
  const back = parsePreMarketExport(JSON.stringify({ ...payload, version: 99, futureField: true }));
  assert.equal(Object.keys(back.charts).length, 2);
  assert.ok(back.warnings.some(w => /newer build/i.test(w)));
}

console.log('✅ premarketExport: export/import round trip, schema guard and input sanitisation OK');
