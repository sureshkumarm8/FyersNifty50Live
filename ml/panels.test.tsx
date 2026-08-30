/**
 * Render smoke test for the AI Lab intelligence panels.
 *
 * Server rendering does not run effects, so the IndexedDB-backed loads stay
 * inert and the panels are exercised purely on real archived data pushed in as
 * props. This catches the class of mistake typechecking cannot: a field that
 * exists but is undefined at runtime, a .toFixed on null, a bad map.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { loadSessions } from './data.mjs';
import {
  buildLabelledSeries, buildFeatureSeries, prepareRows, MIN_LIVE_BARS, ModelInputRow
} from '../services/predictionModel';
import MarketMemoryPanel from '../components/ailab/MarketMemoryPanel';
import RegimeRadarPanel from '../components/ailab/RegimeRadarPanel';
import ScorecardPanel from '../components/ailab/ScorecardPanel';
import DebriefPanel from '../components/ailab/DebriefPanel';

const S = loadSessions();
const rows: ModelInputRow[] = S.flatMap(s => s.rows.map(x => ({ t: x.t, ltp: x.ltp, sent: x.sent, pcr: x.pcr })));
const history = buildLabelledSeries(rows);
const lastRows = S[S.length - 1].rows.map(x => ({ t: x.t, ltp: x.ltp, sent: x.sent, pcr: x.pcr }));
const live = buildFeatureSeries(lastRows);

const series = {
  history, live, now: live[live.length - 1],
  sessions: S.length, snapshots: rows.length,
  loading: false, error: null, reload: () => {}
};

const liveLog = S[S.length - 1].rows.map(x => ({
  time: x.time, timestamp: x.t, niftyLtp: x.ltp, ptsChg: 0, overallSent: x.sent,
  adv: 0, dec: 0, stockSent: 0, callSent: 0, putSent: 0, pcr: x.pcr, optionsSent: 0,
  callsBuyQty: 0, callsSellQty: 0, putsBuyQty: 0, putsSellQty: 0
}));

const empty = { ...series, history: [], live: [], now: null, snapshots: 0, sessions: 0 };

// Early-session state: only MIN_LIVE_BARS of real data, warm-up seeded from the
// previous session. This is the state the panels are in minutes after the open.
const priorRows = S.slice(0, -1).flatMap(x => x.rows.map(r => ({ t: r.t, ltp: r.ltp, sent: r.sent, pcr: r.pcr })));
const earlyLive = lastRows.slice(0, MIN_LIVE_BARS);
const prepEarly = prepareRows(earlyLive, priorRows);
const earlySeries = {
  ...series,
  live: buildFeatureSeries(prepEarly.rows),
  liveBars: prepEarly.liveBars,
  warmingUp: prepEarly.backfilledBars > 0,
  archiveRows: priorRows
};
earlySeries.now = earlySeries.live[earlySeries.live.length - 1] ?? null;

const cases: Array<[string, React.ReactElement]> = [
  ['MarketMemoryPanel (populated)', <MarketMemoryPanel series={series as any} />],
  ['MarketMemoryPanel (no data)', <MarketMemoryPanel series={empty as any} />],
  ['RegimeRadarPanel (populated)', <RegimeRadarPanel series={series as any} liveLog={liveLog as any} />],
  ['RegimeRadarPanel (no data)', <RegimeRadarPanel series={empty as any} liveLog={[]} />],
  ['ScorecardPanel', <ScorecardPanel />],
  ['DebriefPanel (populated)', <DebriefPanel series={series as any} />],
  ['DebriefPanel (no data)', <DebriefPanel series={empty as any} />],
  ['MarketMemoryPanel (warming up, 5 live bars)', <MarketMemoryPanel series={earlySeries as any} />],
  ['RegimeRadarPanel (warming up, 5 live bars)', <RegimeRadarPanel series={earlySeries as any} liveLog={liveLog.slice(0, MIN_LIVE_BARS) as any} />]
];

if (!earlySeries.warmingUp || !earlySeries.now) {
  console.log('  FAIL  early-session fixture did not produce a seeded reading');
  process.exit(1);
}
console.log(`early fixture: ${earlySeries.liveBars} live bars + ${prepEarly.backfilledBars} seeded -> usable\n`);

let fail = 0;
for (const [name, el] of cases) {
  try {
    const html = renderToString(el);
    if (html.length < 40) throw new Error(`suspiciously short output (${html.length} chars)`);
    if (html.includes('NaN')) throw new Error('rendered NaN into the DOM');
    if (html.includes('undefined')) throw new Error('rendered "undefined" into the DOM');
    console.log(`  ok    ${name} (${html.length} chars)`);
  } catch (e: any) {
    console.log(`  FAIL  ${name}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${cases.length - fail} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
