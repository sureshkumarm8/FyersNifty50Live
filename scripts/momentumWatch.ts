import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Redis } from '@upstash/redis';
import { EnhancedSignalGenerator } from '../services/enhancedSignalGenerator';
import { evaluateMomentumEntry, MOMENTUM_POLICY } from '../services/momentumEntryGuard';
import { MarketSnapshot } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

async function run() {
  const index = await redis.zrange('snapshots:index', 0, -1);
  const keys = index.map(ts => 'snapshot:' + ts);
  if (keys.length === 0) {
    console.log('No snapshots found');
    return;
  }
  const pipeline = redis.pipeline();
  keys.forEach(k => pipeline.get(k));
  const results = await pipeline.exec();
  const rawList = results
    .filter(Boolean)
    .map(r => (typeof r === 'string' ? JSON.parse(r) : r))
    .sort((a: any, b: any) => a.timestamp - b.timestamp);

  // Map into MarketSnapshot
  const historyLog: MarketSnapshot[] = rawList.map((s: any) => {
    let callsBuy = 0, callsSell = 0, putsBuy = 0, putsSell = 0;
    let callOI = 0, putOI = 0;
    (s.options || []).forEach((opt: any) => {
      const sym = opt.symbol || '';
      const desc = opt.description || '';
      const isCall = sym.endsWith('CE') || sym.includes('-CE') || desc.includes(' CE');
      const buyQty = opt.total_buy_qty || 0;
      const sellQty = opt.total_sell_qty || 0;
      const oi = opt.oi || 0;
      if (isCall) {
        callsBuy += buyQty; callsSell += sellQty; callOI += oi;
      } else {
        putsBuy += buyQty; putsSell += sellQty; putOI += oi;
      }
    });

    const adv = s.stocks ? s.stocks.filter((x: any) => x.ch > 0).length : 0;
    const dec = s.stocks ? s.stocks.filter((x: any) => x.ch < 0).length : 0;
    const pcr = callOI > 0 ? (putOI / callOI) : (s.pcr || 0.85);
    const overallSent = (adv + dec > 0) ? Math.round(((adv - dec) / (adv + dec)) * 1000) / 10 : 0;

    const d = new Date(s.timestamp);
    const timeStr = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

    return {
      timestamp: s.timestamp,
      time: timeStr,
      niftyLtp: s.niftyLTP,
      ptsChg: 0,
      overallSent,
      adv,
      dec,
      stockSent: s.stockSent || 0,
      callSent: s.callSent || 0,
      putSent: s.putSent || 0,
      optionsSent: s.optionsSent || 0,
      pcr,
      callsBuyQty: callsBuy,
      callsSellQty: callsSell,
      putsBuyQty: putsBuy,
      putsSellQty: putsSell,
      callsOI: callOI,
      putsOI: putOI
    };
  });

  // Calculate ptsChg
  for (let i = 1; i < historyLog.length; i++) {
    historyLog[i].ptsChg = Math.round((historyLog[i].niftyLtp - historyLog[i - 1].niftyLtp) * 10) / 10;
  }

  // Sort newest first as expected by MomentumEntryGuard and EnhancedSignalGenerator
  historyLog.sort((a, b) => b.timestamp - a.timestamp);

  const latest = historyLog[0];
  const signal = EnhancedSignalGenerator.generateSignal(
    historyLog,
    latest.niftyLtp - 50,
    latest.niftyLtp + 50,
    latest.niftyLtp
  );
  const now = latest.timestamp + 5000;

  const gateResult = evaluateMomentumEntry({
    now,
    running: true,
    tradingMode: 'PAPER',
    signal,
    signalAt: latest.timestamp,
    history: historyLog,
    spot: latest.niftyLtp,
    orders: [],
    openPositions: 0,
    premium: 120,
    quantity: 75,
    targetPct: 25,
    stopPct: 15,
    minConfidence: MOMENTUM_POLICY.minConfidence,
    maxDailyTrades: 4,
    brokerage: 40,
    fastTrackConfirmation: false,
    requireVision: false,
    vision: null,
  }, null);

  console.log(JSON.stringify({
    time: latest.time,
    ltp: latest.niftyLtp,
    advDec: `${latest.adv} / ${latest.dec}`,
    pcr: latest.pcr.toFixed(2),
    signal: {
      direction: signal.direction,
      confidence: signal.confidence,
      trend15m: signal.metrics.trend15m,
      trendStrength: signal.metrics.trendStrength,
      broadSentiment: signal.metrics.broadSentiment,
      momentumScore: signal.metrics.momentumScore,
      optionFlow: signal.metrics.optionFlow,
      reasons: signal.reasons,
      suggestedEntry: signal.suggestedEntry,
      suggestedTarget: signal.suggestedTarget,
      suggestedStopLoss: signal.suggestedStopLoss,
      riskRewardRatio: signal.riskRewardRatio,
    },
    gate: {
      ready: gateResult.ready,
      reason: gateResult.reason,
      blockedBy: gateResult.blockedBy,
      checks: gateResult.checks.map(c => ({ id: c.id, label: c.label, status: c.status, detail: c.detail })),
    }
  }, null, 2));
}

run().catch(console.error);
