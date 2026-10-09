import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { EnhancedSignalGenerator } from '../services/enhancedSignalGenerator';
import { evaluateMomentumEntry, MOMENTUM_POLICY, MomentumCandidate } from '../services/momentumEntryGuard';
import { calculateGexProfile } from '../services/gammaExposure';
import { MarketSnapshot } from '../types';

interface EnrichedMarketSnapshot extends MarketSnapshot {
  niftyLTP?: number;
  istTime?: string;
  stocks?: any[];
  options?: any[];
  stockCount?: number;
  optionsCount?: number;
  source?: string;
}

dotenv.config({ path: '.env.local' });

let activeCandidate: MomentumCandidate | null = null;

async function runMomentumCycle() {
  const now = new Date();
  const istTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
  console.log(`\n================================================================`);
  console.log(`🤖 MOMENTUM AUTOTRADE 5-MIN CADENCE | ${istTimeStr}`);
  console.log(`================================================================`);

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  });

  try {
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

        let ceOi = 0, peOi = 0;
        optsList.forEach((o: any) => {
          if (o.type === 'CE' || (o.symbol && o.symbol.includes('CE'))) ceOi += (o.oi || 0);
          else if (o.type === 'PE' || (o.symbol && o.symbol.includes('PE'))) peOi += (o.oi || 0);
        });

        const snap: EnrichedMarketSnapshot = {
          time: s.istTime || new Date(s.timestamp).toLocaleTimeString('en-IN'),
          timestamp: s.timestamp,
          istTime: s.istTime,
          niftyLTP: s.niftyLTP,
          niftyLtp: s.niftyLTP,
          ptsChg: s.ptsChg || 0,
          overallSent: s.overallSent || 0,
          adv: s.adv || 0,
          dec: s.dec || 0,
          stockSent: s.stockSent || 0,
          callSent: s.callSent || 0,
          putSent: s.putSent || 0,
          pcr: s.pcr || (ceOi > 0 ? peOi / ceOi : 1.0),
          optionsSent: s.optionsSent || 0,
          callsBuyQty: s.callsBuyQty || 0,
          callsSellQty: s.callsSellQty || 0,
          putsBuyQty: s.putsBuyQty || 0,
          putsSellQty: s.putsSellQty || 0,
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

    // Backfill fallback options if gap
    for (let i = 0; i < snaps.length; i++) {
      if ((!snaps[i].options || snaps[i].options.length === 0) && latestWithOpts?.options) {
        snaps[i].options = latestWithOpts.options;
        snaps[i].optionsCount = latestWithOpts.options.length;
      }
    }

    if (snaps.length === 0) {
      console.log('⚠️ No market snapshots found in Redis index.');
      return;
    }

    const latest = snaps[0];
    const currentSpot = latest.niftyLTP || 0;

    const pivotSupport = Math.floor(currentSpot / 50) * 50 - 50;
    const pivotResistance = Math.ceil(currentSpot / 50) * 50 + 50;
    const signal = EnhancedSignalGenerator.generateSignal(snaps, pivotSupport, pivotResistance, currentSpot);

    const guardInput = {
      now: now.getTime(),
      signal,
      signalAt: latest.timestamp || now.getTime(),
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

    const guardDecision = evaluateMomentumEntry(guardInput, activeCandidate);
    activeCandidate = guardDecision.candidate;

    console.log(`📈 Nifty Spot: ${currentSpot.toFixed(2)} | Snapshots in Window: ${snaps.length}`);
    if (latest.options && latest.options.length > 0) {
      const gex = calculateGexProfile(latest.options, currentSpot);
      console.log(`⚡ GEX Positioning: Regime=[${gex.regime}] | Net GEX: ${gex.netGexTotal.toFixed(1)} Cr${gex.zeroGammaFlipLevel ? ' | Zero-Γ Flip: ' + gex.zeroGammaFlipLevel : ''}`);
    }
    console.log(`🌊 Signal Direction: ${signal.direction} | Confidence: ${signal.confidence.toFixed(1)}%`);
    console.log(`🛡️ Momentum Gate Status: ${guardDecision.ready ? '✅ READY TO EXECUTE' : '⛔ BLOCKED'}`);
    console.log(`   Gate Reason: ${guardDecision.reason}`);
    if (guardDecision.blockedBy) {
      console.log(`   Blocked By Gate: [${guardDecision.blockedBy}]`);
    }

    if (guardDecision.ready && guardDecision.candidate) {
      const atmStrike = Math.round(currentSpot / 50) * 50;
      const optType = guardDecision.candidate.direction === 'LONG' ? 'CE' : 'PE';
      console.log(`🔥 HIGH-CONVICTION MOMENTUM TRADE ARMED: NIFTY ${atmStrike} ${optType}`);
      console.log(`   Entry Spot: ${currentSpot} | Direction: ${guardDecision.candidate.direction} (Observed: ${guardDecision.candidate.observations}m)`);
    } else {
      console.log(`💤 Momentum Desk Stance: FLAT CASH / STAND DOWN`);
    }
    console.log(`================================================================\n`);
  } catch (err: any) {
    console.error('Error in Momentum AutoTrade Cycle:', err.message);
  }
}

// Check if running in interval daemon mode
if (process.argv.includes('--daemon')) {
  console.log('🚀 Momentum AutoTrade 5-Min Worker Started in Daemon Mode (Every 300s)...');
  runMomentumCycle();
  setInterval(runMomentumCycle, 5 * 60 * 1000);
} else {
  runMomentumCycle();
}
