import React from 'react';
import { renderToString } from 'react-dom/server';
import { loadSessions } from './data.mjs';
import { PredictionTable } from '../components/PredictionsPanel';
import { isForecastFailure, forecast, toModelRows } from '../services/predictionModel';

const s = loadSessions().slice(-1)[0];
const snaps = s.rows.map(x => ({
  time: x.time, timestamp: x.t, niftyLtp: x.ltp, ptsChg: 0, overallSent: x.sent,
  adv: 0, dec: 0, stockSent: 0, callSent: 0, putSent: 0, pcr: x.pcr, optionsSent: 0,
  callsBuyQty: 0, callsSellQty: 0, putsBuyQty: 0, putsSellQty: 0
})).reverse();

const f = forecast(toModelRows(snaps as any));
if (isForecastFailure(f)) { console.log('FAIL forecast:', f.reason); process.exit(1); }
console.log('Forecast from real session', s.date, '| last LTP', s.rows[s.rows.length-1].ltp);
console.table(f.horizons.map(h => ({
  time: h.time, '+min': h.minutes, expected: +h.niftyLtp.toFixed(1), dPts: +h.ptsChg.toFixed(1),
  low: +h.low.toFixed(0), high: +h.high.toFixed(0), band: +h.bandPts.toFixed(1),
  pUp: +(h.probUp*100).toFixed(1), sent: +h.overallSent.toFixed(1), pcr: +h.pcr.toFixed(3),
  conf: +h.confidence.toFixed(0)
})));
for (const t of ['archived','hybrid']) {
  const html = renderToString(React.createElement(PredictionTable, { predictions: f.horizons, type: t }));
  if (!html.includes('80% Range')) { console.log('FAIL: table missing for', t); process.exit(1); }
  console.log(`rendered ${t} table ok (${html.length} chars)`);
}
console.log('PASS');
