import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { PAYTM_NIFTY50_MAP } from '../constants/generated/paytmMappings.js';
import { NIFTY_WEEKLY_OPTIONS } from '../constants/generated/niftyWeeklyOptions.js';
import { readJournal } from '../ops/journal.mjs';

// Robust DNS patch for developer.paytmmoney.com
const origLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === 'developer.paytmmoney.com') {
    dns.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        if (options && options.all) {
          return callback(null, addresses.map(a => ({ address: a, family: 4 })));
        }
        return callback(null, addresses[0], 4);
      }
      origLookup(hostname, options, callback);
    });
    return;
  }
  return origLookup(hostname, options, callback);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const scratchDir = join(rootDir, 'scratch');
if (!existsSync(scratchDir)) mkdirSync(scratchDir, { recursive: true });
const LAST_TICK_FILE = join(scratchDir, 'last_market_tick.json');

function getPaytmToken() {
  const files = readdirSync(rootDir)
    .filter(f => f.startsWith('paytm_tokens_') && f.endsWith('.json'))
    .sort()
    .reverse();
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(join(rootDir, f), 'utf8'));
      const token = data?.paytm?.tokens?.accessToken;
      if (token) return token;
    } catch (e) { }
  }
  return process.env.PAYTM_ACCESS_TOKEN || null;
}

const token = getPaytmToken();
if (!token) {
  console.error('ERROR: No valid Paytm token found');
  process.exit(1);
}

const HEAVYWEIGHTS = [
  'HDFCBANK', 'RELIANCE', 'ICICIBANK', 'INFY', 'ITC',
  'TCS', 'LT', 'BHARTIARTL', 'AXISBANK', 'KOTAKBANK',
  'SBIN', 'BAJFINANCE', 'M&M', 'MARUTI', 'HINDUNILVR'
];

async function fetchQuotes(securityIds, scripType = 'EQUITY') {
  // 1. Direct PayTM Money API with DNS fallback
  try {
    const preferences = securityIds.map(id => `NSE:${id}:${scripType}`).join(',');
    const paytmUrl = `https://developer.paytmmoney.com/data/v1/price/live?mode=FULL&pref=${encodeURIComponent(preferences)}`;
    const res = await fetch(paytmUrl, {
      method: 'GET',
      headers: {
        'x-jwt-token': token,
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) return json.data;
    }
  } catch (directErr) {
    // Fall back to local proxy
  }

  // 2. Fallback to local server.js proxy
  const res = await fetch('http://localhost:5001/api/paytm/quotes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ security_ids: securityIds, scrip_type: scripType })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Quote fetch failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.data || [];
}

async function getAppState() {
  try {
    const res = await fetch('http://localhost:5001/api/ops/state');
    if (res.ok) return await res.json();
  } catch (e) { }
  return null;
}

export async function runAnalysis() {
  const now = new Date();
  const istNow = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(now);

  // 1. Fetch Nifty 50 Index Quote
  const [niftyQuote] = await fetchQuotes(['13'], 'INDEX');
  const spot = niftyQuote ? niftyQuote.last_price : null;
  const prevClose = niftyQuote?.ohlc?.close || 23810.85;
  const dayOpen = niftyQuote?.ohlc?.open || spot;
  const dayHigh = niftyQuote?.ohlc?.high || spot;
  const dayLow = niftyQuote?.ohlc?.low || spot;
  const netChange = spot ? (spot - prevClose) : 0;
  const netChangePct = prevClose ? (netChange / prevClose) * 100 : 0;

  // 2. Fetch Top Heavyweights
  const hwMap = {};
  const hwIds = [];
  for (const sym of HEAVYWEIGHTS) {
    const map = PAYTM_NIFTY50_MAP[sym];
    if (map) {
      hwIds.push(map.security_id);
      hwMap[map.security_id] = sym;
    }
  }
  const hwQuotes = await fetchQuotes(hwIds, 'EQUITY');
  const heavyweightsSummary = hwQuotes.map(q => ({
    symbol: hwMap[q.security_id] || q.security_id,
    price: q.last_price,
    changePct: q.change_percent,
    changeAbs: q.change_absolute,
    totalBuyQty: q.total_buy_quantity,
    totalSellQty: q.total_sell_quantity,
    volume: q.volume_traded
  })).sort((a, b) => b.changePct - a.changePct);

  const hwAdvances = heavyweightsSummary.filter(h => h.changePct > 0).length;
  const hwDeclines = heavyweightsSummary.filter(h => h.changePct < 0).length;
  const hwUnchanged = heavyweightsSummary.filter(h => h.changePct === 0).length;

  // 3. Option Chain ATM +/- 200 points
  const roundedSpot = Math.round((spot || 23850) / 50) * 50;
  const atmStrikes = [roundedSpot - 150, roundedSpot - 100, roundedSpot - 50, roundedSpot, roundedSpot + 50, roundedSpot + 100, roundedSpot + 150];

  const optionsForStrikes = NIFTY_WEEKLY_OPTIONS.filter(o => atmStrikes.includes(o.strike));
  const optionIds = optionsForStrikes.map(o => o.security_id);
  const optionQuotes = await fetchQuotes(optionIds, 'OPTION');

  const optionQuotesMap = {};
  for (const q of optionQuotes) {
    optionQuotesMap[q.security_id] = q;
  }

  let totalCallOi = 0;
  let totalPutOi = 0;
  let totalCallOiChg = 0;
  let totalPutOiChg = 0;

  const chainTable = atmStrikes.map(strike => {
    const ceObj = optionsForStrikes.find(o => o.strike === strike && o.type === 'CE');
    const peObj = optionsForStrikes.find(o => o.strike === strike && o.type === 'PE');
    const ce = ceObj ? optionQuotesMap[ceObj.security_id] : null;
    const pe = peObj ? optionQuotesMap[peObj.security_id] : null;

    if (ce?.oi) totalCallOi += ce.oi;
    if (pe?.oi) totalPutOi += pe.oi;
    if (ce?.change_oi) totalCallOiChg += ce.change_oi;
    if (pe?.change_oi) totalPutOiChg += pe.change_oi;

    return {
      strike,
      ceLtp: ce?.last_price || 0,
      ceChgPct: ce?.change_percent || 0,
      ceOi: ce?.oi || 0,
      ceOiChg: ce?.change_oi || 0,
      peLtp: pe?.last_price || 0,
      peChgPct: pe?.change_percent || 0,
      peOi: pe?.oi || 0,
      peOiChg: pe?.change_oi || 0
    };
  });

  const pcr = totalCallOi > 0 ? (totalPutOi / totalCallOi).toFixed(2) : 'N/A';

  // 4. App tab status & Engines
  const appStateData = await getAppState();
  const appState = appStateData?.snapshot || {};
  const engines = appState.engines || {};
  const premarket = appState.premarket || {};
  const autotrade = engines.autotrade || {};
  const sniper = engines.sniper || {};
  const momentum = engines.momentum || {};
  const pilot = engines.pilot || {};
  const positions = appState.positions || [];

  // 5. Journal Decisions & Alerts
  const recentDecisions = readJournal('decisions', { limit: 2 });
  const recentGates = readJournal('gates', { limit: 2 });
  const recentAlerts = readJournal('alerts', { limit: 2 });
  const recentOrders = readJournal('orders', { limit: 2 });

  // 6. 1-Minute Delta Comparison
  let lastTick = null;
  if (existsSync(LAST_TICK_FILE)) {
    try {
      lastTick = JSON.parse(readFileSync(LAST_TICK_FILE, 'utf8'));
    } catch (e) { }
  }

  const minuteDelta = {
    spotChange: lastTick?.spot ? (spot - lastTick.spot).toFixed(2) : '0.00',
    newHigh: lastTick?.dayHigh ? spot > lastTick.dayHigh : false,
    newLow: lastTick?.dayLow ? spot < lastTick.dayLow : false,
    sniperStateChanged: lastTick?.engines?.sniper?.state ? (sniper.state !== lastTick.engines.sniper.state) : false,
    momentumStateChanged: lastTick?.engines?.momentum?.lastGate ? (momentum.lastGate !== lastTick.engines.momentum.lastGate) : false,
    positionsChanged: lastTick ? (positions.length !== lastTick.positionsCount) : false
  };

  const currentSnapshot = {
    time: istNow,
    timestamp: now.getTime(),
    spot,
    dayOpen,
    dayHigh,
    dayLow,
    prevClose,
    netChange: netChange.toFixed(2),
    netChangePct: netChangePct.toFixed(2),
    atmStrike: roundedSpot,
    pcr,
    minuteDelta,
    heavyweights: {
      advances: hwAdvances,
      declines: hwDeclines,
      unchanged: hwUnchanged,
      topGainers: heavyweightsSummary.slice(0, 4),
      topLosers: [...heavyweightsSummary].reverse().slice(0, 3)
    },
    chainTable,
    engines: {
      autotrade: {
        mode: autotrade.mode || 'OFF',
        armed: !!autotrade.armed,
        killed: !!autotrade.killed
      },
      sniper: {
        state: sniper.state || 'UNKNOWN',
        armed: !!sniper.armed,
        lastDecision: sniper.lastDecision || 'None'
      },
      momentum: {
        state: momentum.state || 'UNKNOWN',
        guardWarm: !!momentum.guardWarm,
        lastGate: momentum.lastGate || 'None'
      },
      pilot: {
        phase: pilot.phase || 'IDLE'
      }
    },
    positionsCount: positions.length,
    positions,
    premarketBias: premarket.bias || 'None',
    recentJournal: {
      lastDecision: recentDecisions[recentDecisions.length - 1],
      lastGate: recentGates[recentGates.length - 1],
      alerts: recentAlerts,
      orders: recentOrders
    }
  };

  try {
    writeFileSync(LAST_TICK_FILE, JSON.stringify(currentSnapshot, null, 2));
  } catch (e) { }

  return currentSnapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAnalysis().then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
