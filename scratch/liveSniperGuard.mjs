import fs from 'fs';
import path from 'path';

const LOG_FILE = 'scratch/live_sniper_log.jsonl';
fs.mkdirSync('scratch', { recursive: true });

function logEvent(event, data) {
  const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const entry = { timestamp: Date.now(), ist, event, ...data };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  console.log(`[${ist}] [${event}]`, JSON.stringify(data));
}

let opening5MinHigh = null;
let opening5MinLow = null;
let openingPrice = null;
let samples = [];
let regime = 'INITIALIZING';

async function fetchQuote() {
  try {
    const res = await fetch('http://localhost:4321/api/quote?force=1');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function fetchStatus() {
  try {
    const res = await fetch('http://localhost:4321/api/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

function getISTMinutes() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(new Date());
  return Number(parts.find(p => p.type === 'hour')?.value ?? 0) * 60 +
         Number(parts.find(p => p.type === 'minute')?.value ?? 0);
}

logEvent('SYSTEM_UPGRADE', { message: 'Sniper Watch & Data Guard upgraded with dynamic session walls and live PCR confluence' });

async function tick() {
  const mins = getISTMinutes();
  const quote = await fetchQuote();
  if (!quote || !quote.spot) return;

  const spot = quote.spot;
  samples.push({ t: Date.now(), spot });

  // 09:15 - 09:25 The Download Phase
  if (mins >= 555 && mins < 565) {
    if (openingPrice === null) openingPrice = spot;
    opening5MinHigh = opening5MinHigh === null ? spot : Math.max(opening5MinHigh, spot);
    opening5MinLow = opening5MinLow === null ? spot : Math.min(opening5MinLow, spot);

    const range = opening5MinHigh - opening5MinLow;
    if (range > 75) {
      regime = 'TRENDY_EXPANDING';
    } else if (range < 35 && samples.length > 5) {
      regime = 'MUTED_COMPRESSED';
    } else {
      regime = 'ZONE_BOUND';
    }

    logEvent('DOWNLOAD_TICK', {
      spot,
      open: openingPrice,
      high: opening5MinHigh,
      low: opening5MinLow,
      range,
      regime,
      samplesCount: samples.length
    });
  }

  // 09:25 - 09:45 Sniper Entry Window
  if (mins >= 565 && mins < 585) {
    const atm = Math.round(spot / 50) * 50;
    const itmCall = atm - 250;
    const itmPut = atm + 250;

    const sessionLow = samples.reduce((min, s) => Math.min(min, s.spot), opening5MinLow || spot);
    const sessionHigh = samples.reduce((max, s) => Math.max(max, s.spot), opening5MinHigh || spot);
    const support = Math.floor(sessionLow / 50) * 50;
    const resistance = Math.ceil(sessionHigh / 50) * 50;

    let signal = 'WAIT';
    if (spot <= support + 25) {
      signal = 'BUY_CE';
    } else if (spot >= resistance - 25) {
      signal = 'BUY_PE';
    }

    logEvent('ENTRY_WINDOW_TICK', {
      spot,
      regime,
      support,
      resistance,
      sessionLow,
      sessionHigh,
      atm,
      signal,
      strike: signal === 'BUY_CE' ? itmCall : (signal === 'BUY_PE' ? itmPut : null)
    });
  }
}

setInterval(tick, 5000);
tick();
