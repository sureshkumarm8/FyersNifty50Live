/**
 * Zone derivation regression tests.
 *
 * On 2026-09-15 the Sniper declined the day without a trade. The 09:15-09:25
 * range was 16 points, but a flat 50-point pad rounded out to the 50-point
 * strike step turned it into a 200-point zone. Only `2 * zoneBuffer` of any
 * zone counts as "at a wall", so 30% of that zone was tradable and price sat
 * mid-range for the entire entry window. The day was declined mechanically,
 * not on merit.
 *
 * These tests pin the replacement: a pad scaled to the range's own width,
 * floored so a 30-point target still fits and capped so a violent open cannot
 * widen the zone past anything intraday-relevant.
 */
import { deriveWalls, classifyZone, OpeningRange } from '../services/sniperEngine';
import { SNIPER } from '../services/sniperPlaybook';

let passed = 0;
let failed = 0;

const check = (label: string, ok: boolean, detail?: string) => {
  if (ok) {
    passed++;
    console.log(`  ok    ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const zoneOf = (high: number, low: number): OpeningRange => {
  const { support, resistance } = deriveWalls(high, low);
  return { support, resistance } as OpeningRange;
};

// --- the session that prompted this -----------------------------------------

const today = zoneOf(23500.4, 23484);

check(
  'the 16-point open no longer inflates past the minimum zone',
  today.resistance - today.support === SNIPER.minZoneWidth,
  `width ${today.resistance - today.support}`
);
check(
  'walls are not rounded to the 50-point strike step',
  today.support % 50 !== 0 || today.resistance % 50 !== 0,
  `S ${today.support} R ${today.resistance}`
);
check(
  '09:36 spot 23,464 now reads as at a wall, not mid-range',
  classifyZone(23464, today) === 'NEAR_SUPPORT',
  classifyZone(23464, today)
);

// The old behaviour, reproduced, to prove the regression is real.
const legacy = {
  support: Math.floor((23484 - 50) / 50) * 50,
  resistance: Math.ceil((23500.4 + 50) / 50) * 50
} as OpeningRange;
check('legacy padding did produce a 200-point zone', legacy.resistance - legacy.support === 200);
check('legacy padding did declare 23,464 mid-range', classifyZone(23464, legacy) === 'MID_RANGE');

// --- invariants across every shape of open ----------------------------------

const shapes: [string, number, number][] = [
  ['flat 0pt', 23500, 23500],
  ['coiled 16pt', 23500.4, 23484],
  ['quiet 30pt', 23530, 23500],
  ['normal 60pt', 23560, 23500],
  ['active 100pt', 23600, 23500],
  ['violent 300pt', 23800, 23500],
  ['extreme 900pt', 24400, 23500]
];

for (const [name, high, low] of shapes) {
  const z = zoneOf(high, low);
  const width = z.resistance - z.support;

  check(`${name}: zone houses a ${SNIPER.targetPoints}-point target`, width >= SNIPER.minZoneWidth, `width ${width}`);
  check(`${name}: walls bracket the observed range`, z.support <= low && z.resistance >= high);
  check(
    `${name}: pad never exceeds the cap`,
    low - z.support <= SNIPER.maxZonePad + 1 && z.resistance - high <= SNIPER.maxZonePad + 1,
    `pads ${low - z.support} / ${z.resistance - high}`
  );
  check(`${name}: pad is symmetric`, Math.abs((low - z.support) - (z.resistance - high)) <= 1);
  check(`${name}: a break below support is still a break`, classifyZone(z.support - SNIPER.zoneBuffer - 1, z) === 'BELOW_SUPPORT');
  check(`${name}: a break above resistance is still a break`, classifyZone(z.resistance + SNIPER.zoneBuffer + 1, z) === 'ABOVE_RESISTANCE');
}

// --- the narrow-zone bias that the floor would otherwise introduce ----------

/**
 * At the minimum width the two `zoneBuffer` bands overlap, so every price is
 * "at" both walls. Testing support first would label a coiled market
 * NEAR_SUPPORT wherever it sat and bias every tight open long.
 */
const tight = zoneOf(23500, 23500);
const mid = (tight.support + tight.resistance) / 2;
check('narrow zone: below the midpoint reads NEAR_SUPPORT', classifyZone(mid - 5, tight) === 'NEAR_SUPPORT');
check('narrow zone: above the midpoint reads NEAR_RESISTANCE', classifyZone(mid + 5, tight) === 'NEAR_RESISTANCE');
check('narrow zone: the midpoint itself ties long', classifyZone(mid, tight) === 'NEAR_SUPPORT');
check(
  'narrow zone: does not bias long across the whole zone',
  classifyZone(tight.resistance, tight) === 'NEAR_RESISTANCE',
  classifyZone(tight.resistance, tight)
);

// --- a wide zone must still keep a genuine mid-range -------------------------

const wide = zoneOf(23600, 23500);
check('wide zone keeps a real mid-range band', classifyZone((wide.support + wide.resistance) / 2, wide) === 'MID_RANGE');
check('wide zone still reads its support wall', classifyZone(wide.support + 5, wide) === 'NEAR_SUPPORT');
check('wide zone still reads its resistance wall', classifyZone(wide.resistance - 5, wide) === 'NEAR_RESISTANCE');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
