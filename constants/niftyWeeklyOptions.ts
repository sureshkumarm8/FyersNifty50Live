// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-04-21 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-04-21';
export const CURRENT_EXPIRY_FORMATTED = '21-APR-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "63189",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "63188",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "63196",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "63195",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "63202",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "63201",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "63255",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "63254",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "63257",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "63256",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "63272",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "63269",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "63276",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "63275",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "63278",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "63277",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "63281",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "63280",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "63285",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "63284",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "63289",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "63288",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "63293",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "63292",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "63298",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "63294",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "63302",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "63299",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "63306",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "63303",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "63308",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "63307",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "63310",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "63309",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "63315",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "63311",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "63317",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "63316",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "63319",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "63318",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "63321",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "63320",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "63323",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "63322",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "63327",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "63324",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "63329",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "63328",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "63331",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "63330",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "63333",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "63332",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "63335",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "63334",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "63338",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "63336",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "63341",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "63339",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "63343",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "63342",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "63345",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "63344",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "63352",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "63346",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "63354",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "63353",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "63356",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "63355",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "63360",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "63357",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "63363",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "63361",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "63365",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "63364",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "63369",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "63366",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "63373",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "63370",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "63375",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "63374",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "63377",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "63376",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "63379",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "63378",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "63381",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "63380",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "63383",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "63382",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "63385",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "63384",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "63387",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "63386",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "63389",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "63388",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "63391",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "63390",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "63393",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "63392",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "63395",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "63394",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "63397",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "63396",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "63399",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "63398",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "63401",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "63400",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "63403",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "63402",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "63405",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "63404",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "63407",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "63406",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "63409",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "63408",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "63411",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "63410",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "63413",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "63412",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "63415",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "63414",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "63417",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "63416",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "63421",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "63420",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "63423",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "63422",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "63425",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "63424",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "63427",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "63426",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "63429",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "63428",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "63431",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "63430",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "63435",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "63434",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "63437",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "63436",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "63445",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "63444",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "63457",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "63447",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "63463",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "63458",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "63465",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "63464",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "63467",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "63466",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "63469",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "63468",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "63471",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "63470",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "63473",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "63472",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "63475",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "63474",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "63477",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "63476",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "63479",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "63478",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "63481",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "63480",
    "strike": 25000,
    "type": "CE"
  }
];

// Get security IDs for current week (all 162 contracts)
export function getWeeklyOptionIds(): string[] {
  return NIFTY_WEEKLY_OPTIONS.map(opt => opt.security_id);
}

// Get security IDs filtered by strike range
export function getWeeklyOptionIdsByStrike(atmStrike: number, range: number = 20): string[] {
  const minStrike = atmStrike - (range * 50);
  const maxStrike = atmStrike + (range * 50);
  
  return NIFTY_WEEKLY_OPTIONS
    .filter(opt => opt.strike >= minStrike && opt.strike <= maxStrike)
    .map(opt => opt.security_id);
}
