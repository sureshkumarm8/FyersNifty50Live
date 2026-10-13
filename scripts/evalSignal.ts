import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { EnhancedSignalGenerator } from '../services/enhancedSignalGenerator';
import { evaluateMomentumEntry, MOMENTUM_POLICY } from '../services/momentumEntryGuard';
import { buildOpeningRange, evaluate as evaluateSniper, phaseAt, phaseLabelOf } from '../services/sniperEngine';
import { calculateGexProfile } from '../services/gammaExposure';
import { MarketSnapshot } from '../types';

export interface EnrichedMarketSnapshot extends MarketSnapshot {
  niftyLTP?: number;
  istTime?: string;
  stocks?: any[];
  options?: any[];
  stockCount?: number;
  optionsCount?: number;
  source?: string;
}

dotenv.config({ path: '.env.local' });

async function runActiveTraderEvaluation() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  });

  const timestamps = await redis.zrange('snapshots:index', 0, 80, { rev: true });
  const snaps: EnrichedMarketSnapshot[] = [];
  let latestWithOpts: EnrichedMarketSnapshot | null = null;

  for (const ts of timestamps) {
    const raw = await redis.get('snapshot:' + ts);
    if (!raw) continue;
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (s.niftyLTP) {
      const stocksList = s.stocks || [];
      const optsList = s.options || [];

      let adv = 0, dec = 0, totalWeight = 0, bullishWeight = 0, bearishWeight = 0;
      stocksList.forEach((st: any) => {
        const w = st.weight || 1;
        const chg = st.chp ?? (st.prev_close_price ? ((st.lp - st.prev_close_price) / st.prev_close_price) * 100 : 0);
        totalWeight += w;
        if (chg > 0) { adv++; bullishWeight += w; }
        else if (chg < 0) { dec++; bearishWeight += w; }
      });
      const calcOverallSent = totalWeight > 0 ? ((bullishWeight - bearishWeight) / totalWeight) * 100 : 0;

      let ceOi = 0, peOi = 0;
      optsList.forEach((o: any) => {
        if (o.type === 'CE') ceOi += (o.oi || 0);
        else if (o.type === 'PE') peOi += (o.oi || 0);
      });
      const calcPcr = ceOi > 0 ? (peOi / ceOi) : (s.pcr || 1.0);
      const optionsSent = (peOi + ceOi) > 0 ? ((peOi - ceOi) / (peOi + ceOi)) * 100 : (s.optionsSent || 0);

      const snap: EnrichedMarketSnapshot = {
        time: s.istTime || new Date(s.timestamp).toLocaleTimeString('en-IN'),
        timestamp: s.timestamp,
        istTime: s.istTime,
        niftyLTP: s.niftyLTP,
        niftyLtp: s.niftyLTP,
        ptsChg: s.ptsChg || 0,
        overallSent: s.overallSent ?? calcOverallSent,
        adv: s.adv ?? adv,
        dec: s.dec ?? dec,
        stockSent: s.stockSent ?? 0,
        callSent: s.callSent ?? 0,
        putSent: s.putSent ?? 0,
        pcr: s.pcr ?? calcPcr,
        optionsSent: s.optionsSent ?? optionsSent,
        callsBuyQty: s.callsBuyQty ?? 0,
        callsSellQty: s.callsSellQty ?? 0,
        putsBuyQty: s.putsBuyQty ?? 0,
        putsSellQty: s.putsSellQty ?? 0,
        callsOI: ceOi,
        putsOI: peOi,
        stocks: stocksList,
        options: optsList,
        stockCount: s.stockCount || stocksList.length,
        optionsCount: s.optionsCount || optsList.length,
        source: s.source || 'frontend'
      };
      snaps.push(snap);
      if (snap.options && snap.options.length > 0 && !latestWithOpts) {
        latestWithOpts = snap;
      }
    }
  }

  // Backfill ptsChg and fallback options across snaps if individual snapshots had gaps
  for (let i = 0; i < snaps.length; i++) {
    if (i < snaps.length - 1) {
      snaps[i].ptsChg = snaps[i].niftyLtp - snaps[i + 1].niftyLtp;
    }
    if ((!snaps[i].options || snaps[i].options.length === 0) && latestWithOpts?.options) {
      snaps[i].options = latestWithOpts.options;
      snaps[i].optionsCount = latestWithOpts.options.length;
    }
  }

  if (snaps.length === 0) {
    console.log('❌ No snapshots available in Redis.');
    return;
  }

  const latest = snaps[0];
  const currentSpot = latest.niftyLTP || 0;
  const now = Date.now();
  const istDate = new Date(now);

  console.log('================================================================');
  console.log(`🎯 ACTIVE TRADER DESK MONITOR | ${istDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('================================================================');
  console.log(`📈 Nifty 50 Spot: ${currentSpot.toFixed(2)} | Snapshots in Window: ${snaps.length} | Snapshot Age: ${Math.round((now - (latest.timestamp || 0)) / 1000)}s`);

  // 1. Market Breadth & Movers
  const stocks = latest.stocks || [];
  let adv = 0, dec = 0, unchanged = 0;
  const movers: { sym: string; chp: number; lp: number }[] = [];
  stocks.forEach(s => {
    const chp = s.chp !== undefined ? s.chp : (s.prev_close_price ? ((s.lp - s.prev_close_price) / s.prev_close_price) * 100 : 0);
    if (chp > 0.1) adv++;
    else if (chp < -0.1) dec++;
    else unchanged++;
    movers.push({ sym: s.short_name || s.symbol, chp, lp: s.lp });
  });
  movers.sort((a, b) => b.chp - a.chp);

  console.log('\n📊 [1. MARKET BREADTH & ADVANCE/DECLINE]');
  console.log(`   Advances: ${adv} | Declines: ${dec} | Unchanged: ${unchanged} (A/D Ratio: ${(adv / Math.max(1, dec)).toFixed(2)})`);
  console.log(`   Top Gainers: ${movers.slice(0, 3).map(m => `${m.sym} (+${m.chp.toFixed(2)}%)`).join(', ')}`);
  console.log(`   Top Losers:  ${movers.slice(-3).reverse().map(m => `${m.sym} (${m.chp.toFixed(2)}%)`).join(', ')}`);

  // 2. Options Intelligence
  const optSource = latest.options && latest.options.length > 0 ? latest : latestWithOpts;
  if (optSource && optSource.options) {
    let ceOi = 0, peOi = 0, ceVol = 0, peVol = 0;
    optSource.options.forEach(o => {
      const oi = o.oi || 0;
      const vol = o.volume || 0;
      if (o.symbol && o.symbol.includes('CE')) { ceOi += oi; ceVol += vol; }
      else if (o.symbol && o.symbol.includes('PE')) { peOi += oi; peVol += vol; }
    });
    const pcr = ceOi > 0 ? (peOi / ceOi).toFixed(2) : 'N/A';
    console.log('\n⛓️ [2. OPTIONS FLOW & SENTIMENT]');
    console.log(`   Tracked Contracts: ${optSource.options.length} | PCR (OI): ${pcr}`);
    console.log(`   Total CE OI: ${(ceOi / 100000).toFixed(1)}L | PE OI: ${(peOi / 100000).toFixed(1)}L`);
    console.log(`   Total CE Vol: ${(ceVol / 100000).toFixed(1)}L | PE Vol: ${(peVol / 100000).toFixed(1)}L`);
    const gex = calculateGexProfile(optSource.options, currentSpot);
    console.log(`   ⚡ GEX Positioning: Regime=[${gex.regime}] | Net GEX: ${gex.netGexTotal.toFixed(1)} Cr${gex.zeroGammaFlipLevel ? ' | Zero-Γ Flip: ' + gex.zeroGammaFlipLevel : ''}`);
    if (gex.majorCallWallGex || gex.majorPutWallGex) {
      console.log(`   Major GEX Concentration: Call Wall = ${gex.majorCallWallGex ?? 'N/A'} | Put Wall = ${gex.majorPutWallGex ?? 'N/A'}`);
    }
  }

  // 3. Sniper Protocol Status
  const todayKey = istDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  let persistedRange: any = null;
  try {
    const rawRange = await redis.get('sniper:range:' + todayKey);
    if (rawRange) persistedRange = typeof rawRange === 'string' ? JSON.parse(rawRange) : rawRange;
  } catch {}

  const sniperPhase = phaseAt(istDate);
  const phaseLabel = phaseLabelOf(sniperPhase);
  const chronologicalSnaps = [...snaps].reverse();
  const prevClose = 22776; // Yesterday's close / baseline
  const openingRange = buildOpeningRange(chronologicalSnaps, prevClose, istDate, persistedRange);

  if (openingRange && !persistedRange) {
    try {
      await redis.set('sniper:range:' + todayKey, JSON.stringify(openingRange), { ex: 86400 });
    } catch {}
  }

  console.log('\n🎯 [3. SNIPER ENGINE: "THE OFFICE PROTOCOL"]');
  console.log(`   Current Phase: ${sniperPhase} (${phaseLabel})`);
  if (openingRange) {
    console.log(`   Opening Range (09:15-09:25): [Low: ${openingRange.low} - High: ${openingRange.high}] (Samples: ${openingRange.samples})${persistedRange ? ' [Restored from Redis]' : ''}`);
    console.log(`   Support Wall: ${openingRange.support} | Resistance Wall: ${openingRange.resistance}`);
  } else {
    console.log('   Opening Range: Incomplete or insufficient snapshots between 09:15-09:25.');
  }

  // 4. Enhanced Signal Engine
  const pivotSupport = openingRange?.support || (Math.floor(currentSpot / 50) * 50 - 50);
  const pivotResistance = openingRange?.resistance || (Math.ceil(currentSpot / 50) * 50 + 50);
  const signal = EnhancedSignalGenerator.generateSignal(snaps, pivotSupport, pivotResistance, currentSpot);
  console.log('\n🌊 [4. MULTI-FACTOR MOMENTUM SIGNAL ENGINE]');
  console.log(`   Signal Direction: ${signal.direction} | Confidence: ${signal.confidence}% (${signal.metrics.signalStrength})`);
  console.log(`   15m Trend: ${signal.metrics.trend15m} (Strength: ${signal.metrics.trendStrength}) | Price Velocity: ${signal.metrics.priceVelocity.toFixed(2)} pts/min`);
  console.log(`   Momentum Score: ${signal.metrics.momentumScore} | Option Flow: ${signal.metrics.optionFlow}`);
  console.log(`   Suggested Levels: Entry=${signal.suggestedEntry} | Target=${signal.suggestedTarget} | SL=${signal.suggestedStopLoss} (R:R: ${signal.riskRewardRatio.toFixed(2)})`);
  console.log(`   Signal Reasons: ${signal.reasons.join('; ')}`);

  // Sniper Evaluation
  const sniperEval = evaluateSniper({
    now: istDate,
    spot: currentSpot,
    range: openingRange,
    signalDirection: signal.direction,
    signalConfidence: signal.confidence,
    signalReasons: signal.reasons,
    hasOpenPosition: false,
    dailyTradeDone: false,
    expiry: 'CURRENT'
  });
  console.log(`   Sniper Verdict: canEnter=${sniperEval.canEnter} | mustExit=${sniperEval.mustExit}`);
  if (sniperEval.blocks.length > 0) {
    console.log(`   Sniper Rules Blocked: ${sniperEval.blocks.map(b => `[${b.code}: ${b.message}]`).join(', ')}`);
  }
  if (sniperEval.setup) {
    console.log(`   Active Setup: ${sniperEval.setup.direction} ${sniperEval.setup.optionType} Strike ${sniperEval.setup.strike} @ Entry Spot: ${sniperEval.setup.entrySpot} (Target: ${sniperEval.setup.targetSpot}, SL: ${sniperEval.setup.stopSpot})`);
  }

  // 5. Momentum Entry Guard Check
  const guardInput = {
    now: now,
    signal,
    signalAt: latest.timestamp || now,
    history: snaps,
    spot: currentSpot,
    running: true,
    tradingMode: 'PAPER' as const,
    minConfidence: MOMENTUM_POLICY.minConfidence,
    maxDailyTrades: 4,
    openPositions: 0,
    orders: [],
    premium: 120,
    quantity: 50,
    targetPct: 20,
    stopPct: 10,
    brokerage: 40,
    chargesBudget: 1000,
    dailyPnL: 0,
    requireVision: false,
    vision: null,
    visionRun: null,
    fastTrackConfirmation: true
  };
  const guardDecision = evaluateMomentumEntry(guardInput, null);
  console.log('\n🛡️ [5. MOMENTUM ENTRY GUARD (RISK GATE)]');
  console.log(`   Gate Decision: ${guardDecision.ready ? '✅ READY TO EXECUTE' : '⛔ BLOCKED'}`);
  console.log(`   Primary Status/Reason: ${guardDecision.reason}`);
  if (guardDecision.blockedBy) {
    console.log(`   Blocked By Gate: [${guardDecision.blockedBy}]`);
  }
  if (guardDecision.candidate) {
    const atmStrike = Math.round(currentSpot / 50) * 50;
    const optType = guardDecision.candidate.direction === 'LONG' ? 'CE' : 'PE';
    console.log(`   Candidate Setup: ${guardDecision.candidate.direction} [${guardDecision.candidate.observations}/3 observations] | Recommended Instrument: NIFTY ${atmStrike} ${optType}`);
  }

  // 6. Active Trader Synthesis & Recommendations
  console.log('\n⚡ [6. ACTIVE TRADER VERDICT]');
  if (adv < 10 && dec > 35) {
    console.log('   Market Sentiment: STRONGLY BEARISH. 40+ out of 48 Nifty 50 components in red.');
  } else if (adv > 35 && dec < 10) {
    console.log('   Market Sentiment: STRONGLY BULLISH. Broad-based buying across heavyweights.');
  } else {
    console.log('   Market Sentiment: CONSOLIDATION / SELECTIVE STOCK MOVES.');
  }

  if (sniperPhase === 'HARD_STOP') {
    console.log('   Sniper Desk: [HARD STOP] Past 10:15 IST. Strict office protocol: Zero active Sniper positions. Day concluded.');
  } else if (sniperPhase === 'MANAGE_ONLY') {
    console.log('   Sniper Desk: [MANAGE ONLY] 09:45-10:15 IST window. No new entries permitted. Prepare to exit all positions by 10:15 IST.');
  }

  if (guardDecision.ready) {
    console.log('   Momentum Desk: [TRADE READY] High confidence setup cleared all entry filters.');
  } else {
    console.log(`   Momentum Desk: [STAND DOWN] ${guardDecision.reason}`);
  }
  console.log('================================================================\n');
}

runActiveTraderEvaluation().catch(console.error);
