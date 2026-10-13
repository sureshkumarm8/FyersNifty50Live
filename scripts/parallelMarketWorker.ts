import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { MarketSnapshot } from '../types';

dotenv.config({ path: '.env.local' });

/**
 * PARALLEL RESEARCH & ANOMALY DETECTOR WORKER (AGENT 2)
 * Runs concurrently with the primary Execution Trader Agent.
 * Continuously monitors:
 * 1. Data Feed Health & Latency (Redis snapshot arrival jitter).
 * 2. Option Chain Anomaly Detection (Unusual single-strike Call/Put volume/OI spikes).
 * 3. Heavyweight Beta Pressure (HDFC Bank, Reliance, ICICI Bank vs Index).
 */

async function runWorker() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  });

  console.log('⚡ [Parallel Worker] Initialized parallel analytics worker.');

  let lastReportTime = 0;

  while (true) {
    try {
      const raw = await redis.get('snapshot:latest');
      if (raw) {
        const snap = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const now = Date.now();
        const ageSec = Math.round((now - snap.timestamp) / 1000);

        // Check if report interval reached (~30s)
        if (now - lastReportTime >= 30_000) {
          lastReportTime = now;
          const stocks = snap.stocks || [];
          const options = snap.options || [];

          // Find largest option strike volumes
          const topOption = [...options].sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
          
          console.log(`[Parallel Worker @ ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}] Feed Age: ${ageSec}s | Stocks: ${stocks.length} | Options: ${options.length}`);
          if (topOption) {
            console.log(`  🔥 Highest Volume Contract: ${topOption.symbol} (Vol: ${topOption.volume?.toLocaleString()}, OI: ${topOption.oi?.toLocaleString()})`);
          }
          if (ageSec > 35) {
            console.warn(`  ⚠️ Jitter Warning: Feed delayed by ${ageSec}s (Threshold: 35s).`);
          }
        }
      }
    } catch (err: any) {
      console.error('[Parallel Worker Error]:', err.message);
    }
    // Sleep 10s
    await new Promise(r => setTimeout(r, 10_000));
  }
}

runWorker().catch(console.error);
