// services/sniperPlaybook.ts
var SNIPER = {
  name: "Nifty Sniper: The Office Protocol",
  /** Watch the open, do not trade. */
  downloadStart: "09:15",
  /** Entry window opens. */
  entryStart: "09:25",
  /** "If choppy or confusing by 09:45, close the laptop." */
  reviewBy: "09:45",
  /** Hard stop. No exceptions. */
  hardStop: "10:15",
  /**
   * When the engine switches itself off.
   *
   * Five minutes after the hard stop, so a 10:15 exit has time to fill and be
   * logged. Past this the protocol has nothing left to do today — staying armed
   * only burns CPU on a one-second loop and risks acting on a stale read.
   */
  standDown: "10:20",
  targetPoints: 30,
  stopPoints: 30,
  /** MySystemAutoTrade uses a fixed 250-point ITM strike. */
  itmPoints: 250,
  strikeStep: 50,
  /** MySystemAutoTrade rejects live signals below this confidence. */
  minEngineConfidence: 75,
  /** MySystemAutoTrade treats price within this distance as "at the zone". */
  zoneBuffer: 30,
  /**
   * Minimum wall-to-wall room. Entry happens up to `zoneBuffer` inside the
   * zone and needs `targetPoints` of travel, so anything under 60 makes the
   * 30-point target mathematically unreachable before the opposite wall.
   */
  minZoneWidth: 60,
  /** Below this the day is technically tradable but uncomfortably tight. */
  comfortableZoneWidth: 90,
  /**
   * How far outside the opening range each wall sits, as a fraction of that
   * range's own width.
   *
   * This replaced a flat 50-point pad that was rounded out to the nearest 50.
   * On a quiet open that was catastrophic: a 16-point range became a 200-point
   * zone, only 30% of which is within `zoneBuffer` of a wall, so price sat
   * mid-range for the whole entry window and the day was declined mechanically
   * rather than on merit. Scaling the pad to what the tape actually did keeps a
   * coiled open tradable and still gives a violent open real room.
   */
  zonePadRatio: 0.35,
  /**
   * Ceiling on the scaled pad. A gap-and-run open can print a huge 10-minute
   * range; without this the zone would widen past anything intraday-relevant.
   */
  maxZonePad: 50,
  /**
   * Chart levels further apart than this are positional, not intraday - the
   * real zones will come from the 09:15-09:25 five-minute range instead.
   */
  maxUsefulZoneWidth: 400,
  /** Approximate delta of a 250-point ITM weekly Nifty option. */
  itmDelta: 0.85
};

// services/sniperEngine.ts
var hhmmToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
var MARKET_OPEN = hhmmToMinutes(SNIPER.downloadStart);
var ENTRY_OPEN = hhmmToMinutes(SNIPER.entryStart);
var ENTRY_CLOSE = hhmmToMinutes(SNIPER.reviewBy);
var HARD_STOP = hhmmToMinutes(SNIPER.hardStop);
var STAND_DOWN = hhmmToMinutes(SNIPER.standDown);
function deriveWalls(high, low) {
  const width = Math.max(0, high - low);
  const scaled = Math.min(width * SNIPER.zonePadRatio, SNIPER.maxZonePad);
  const shortfall = SNIPER.minZoneWidth - (width + scaled * 2);
  const pad = shortfall > 0 ? scaled + shortfall / 2 : scaled;
  return {
    support: Math.round(low - pad),
    resistance: Math.round(high + pad)
  };
}
function classifyZone(spot, range) {
  if (spot < range.support - SNIPER.zoneBuffer) return "BELOW_SUPPORT";
  if (spot > range.resistance + SNIPER.zoneBuffer) return "ABOVE_RESISTANCE";
  const nearSupport = spot <= range.support + SNIPER.zoneBuffer;
  const nearResistance = spot >= range.resistance - SNIPER.zoneBuffer;
  if (nearSupport && nearResistance) {
    return spot - range.support <= range.resistance - spot ? "NEAR_SUPPORT" : "NEAR_RESISTANCE";
  }
  if (nearSupport) return "NEAR_SUPPORT";
  if (nearResistance) return "NEAR_RESISTANCE";
  return "MID_RANGE";
}

// ml/sniperZones.test.ts
var passed = 0;
var failed = 0;
var check = (label, ok, detail) => {
  if (ok) {
    passed++;
    console.log(`  ok    ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
};
var zoneOf = (high, low) => {
  const { support, resistance } = deriveWalls(high, low);
  return { support, resistance };
};
var today = zoneOf(23500.4, 23484);
check(
  "the 16-point open no longer inflates past the minimum zone",
  today.resistance - today.support === SNIPER.minZoneWidth,
  `width ${today.resistance - today.support}`
);
check(
  "walls are not rounded to the 50-point strike step",
  today.support % 50 !== 0 || today.resistance % 50 !== 0,
  `S ${today.support} R ${today.resistance}`
);
check(
  "09:36 spot 23,464 now reads as at a wall, not mid-range",
  classifyZone(23464, today) === "NEAR_SUPPORT",
  classifyZone(23464, today)
);
var legacy = {
  support: Math.floor((23484 - 50) / 50) * 50,
  resistance: Math.ceil((23500.4 + 50) / 50) * 50
};
check("legacy padding did produce a 200-point zone", legacy.resistance - legacy.support === 200);
check("legacy padding did declare 23,464 mid-range", classifyZone(23464, legacy) === "MID_RANGE");
var shapes = [
  ["flat 0pt", 23500, 23500],
  ["coiled 16pt", 23500.4, 23484],
  ["quiet 30pt", 23530, 23500],
  ["normal 60pt", 23560, 23500],
  ["active 100pt", 23600, 23500],
  ["violent 300pt", 23800, 23500],
  ["extreme 900pt", 24400, 23500]
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
  check(`${name}: pad is symmetric`, Math.abs(low - z.support - (z.resistance - high)) <= 1);
  check(`${name}: a break below support is still a break`, classifyZone(z.support - SNIPER.zoneBuffer - 1, z) === "BELOW_SUPPORT");
  check(`${name}: a break above resistance is still a break`, classifyZone(z.resistance + SNIPER.zoneBuffer + 1, z) === "ABOVE_RESISTANCE");
}
var tight = zoneOf(23500, 23500);
var mid = (tight.support + tight.resistance) / 2;
check("narrow zone: below the midpoint reads NEAR_SUPPORT", classifyZone(mid - 5, tight) === "NEAR_SUPPORT");
check("narrow zone: above the midpoint reads NEAR_RESISTANCE", classifyZone(mid + 5, tight) === "NEAR_RESISTANCE");
check("narrow zone: the midpoint itself ties long", classifyZone(mid, tight) === "NEAR_SUPPORT");
check(
  "narrow zone: does not bias long across the whole zone",
  classifyZone(tight.resistance, tight) === "NEAR_RESISTANCE",
  classifyZone(tight.resistance, tight)
);
var wide = zoneOf(23600, 23500);
check("wide zone keeps a real mid-range band", classifyZone((wide.support + wide.resistance) / 2, wide) === "MID_RANGE");
check("wide zone still reads its support wall", classifyZone(wide.support + 5, wide) === "NEAR_SUPPORT");
check("wide zone still reads its resistance wall", classifyZone(wide.resistance - 5, wide) === "NEAR_RESISTANCE");
console.log(`
${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
