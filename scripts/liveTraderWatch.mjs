import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Redis } from '@upstash/redis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

function getISTTime() {
  const now = new Date();
  const istStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const ist = new Date(istStr);
  const h = ist.getHours();
  const m = ist.getMinutes();
  const s = ist.getSeconds();
  return {
    timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    totalMins: h * 60 + m,
    timeVal: h * 100 + m
  };
}

function getPhase(mins) {
  if (mins < 9 * 60) return 'OVERNIGHT';
  if (mins < 9 * 60 + 8) return 'PRE_MARKET_DISCOVERY';
  if (mins < 9 * 60 + 15) return 'PRE_MARKET_FREEZE';
  if (mins < 9 * 60 + 25) return 'THE_DOWNLOAD (09:15-09:25)';
  if (mins < 9 * 60 + 45) return 'ENTRY_WINDOW (09:25-09:45)';
  if (mins < 10 * 60 + 15) return 'MANAGE_ONLY (09:45-10:15)';
  if (mins < 15 * 60 + 30) return 'HARD_STOP_DONE';
  return 'MARKET_CLOSED';
}

console.log('='.repeat(70));
console.log('⚡ NIFTY 50 OPTIONS TRADER + ARCHITECT LIVE WATCH ENGINE');
console.log('   Target: Nifty Sniper - The Office Protocol (±30 pts, 250 ITM)');
console.log('='.repeat(70));

let opening5MinHigh = null;
let opening5MinLow = null;
let referenceOpen = null;

async function checkMarket() {
  try {
    const { timeStr, totalMins, timeVal } = getISTTime();
    const phase = getPhase(totalMins);

    const data = await redis.get('snapshot:latest');
    if (!data) {
      console.log(`[${timeStr}] Phase: ${phase} | Waiting for Redis snapshot...`);
      return;
    }

    const snapshot = typeof data === 'string' ? JSON.parse(data) : data;
    const niftyLTP = snapshot.niftyLTP;
    const snapTime = new Date(snapshot.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Track 5-min High & Low during 09:15 - 09:25
    if (totalMins >= 9 * 60 + 15 && totalMins <= 9 * 60 + 25 && niftyLTP > 0) {
      if (!referenceOpen) referenceOpen = niftyLTP;
      opening5MinHigh = opening5MinHigh === null ? niftyLTP : Math.max(opening5MinHigh, niftyLTP);
      opening5MinLow = opening5MinLow === null ? niftyLTP : Math.min(opening5MinLow, niftyLTP);
    }

    const atmStrike = Math.round(niftyLTP / 50) * 50;
    const itmCallStrike = atmStrike - 250;
    const itmPutStrike = atmStrike + 250;

    let adv = 0, dec = 0;
    if (snapshot.stocks && Array.isArray(snapshot.stocks)) {
      snapshot.stocks.forEach(st => {
        if (st.ch > 0) adv++;
        else if (st.ch < 0) dec++;
      });
    }

    console.log(`\n[${timeStr} IST] [${phase}]`);
    console.log(`  📊 Nifty LTP: ${niftyLTP} (Snapshot at ${snapTime}) | ATM: ${atmStrike}`);
    console.log(`  🎯 Sniper Strikes: Call 250-ITM: ${itmCallStrike} CE | Put 250-ITM: ${itmPutStrike} PE`);
    console.log(`  ⚖️ Breadth: ADV ${adv} | DEC ${dec} | Stocks: ${snapshot.stocks?.length || 0} | Options: ${snapshot.options?.length || 0}`);

    if (opening5MinHigh !== null && opening5MinLow !== null) {
      const support = Math.round((opening5MinLow - 50) / 50) * 50;
      const resistance = Math.round((opening5MinHigh + 50) / 50) * 50;
      console.log(`  📐 5-Min Range: High ${opening5MinHigh} | Low ${opening5MinLow} | Range: ${opening5MinHigh - opening5MinLow} pts`);
      console.log(`  🛡️ Zones: Support = ${support} (Buy CE zone) | Resistance = ${resistance} (Buy PE zone)`);

      if (totalMins >= 9 * 60 + 25 && totalMins <= 9 * 60 + 45) {
        if (niftyLTP <= support + 30) {
          console.log(`  🔥 SNIPER ALERT: Price in SUPPORT zone (${niftyLTP} <= ${support + 30}) -> TRIGGER LONG ${itmCallStrike} CE!`);
        } else if (niftyLTP >= resistance - 30) {
          console.log(`  🔥 SNIPER ALERT: Price in RESISTANCE zone (${niftyLTP} >= ${resistance - 30}) -> TRIGGER SHORT ${itmPutStrike} PE!`);
        } else {
          console.log(`  ⏳ Price mid-range (${support} < ${niftyLTP} < ${resistance}). Waiting for edge confluence.`);
        }
      }
    }
  } catch (err) {
    console.error(`[Error] ${err.message}`);
  }
}

// Run check once
await checkMarket();
