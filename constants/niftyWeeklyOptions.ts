// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-11-17 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-11-17';
export const CURRENT_EXPIRY_FORMATTED = '17-NOV-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "45144",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "45143",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "45146",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "45145",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "45148",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "45147",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "45150",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "45149",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "45152",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "45151",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "45154",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "45153",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "45156",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "45155",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "45160",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "45159",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "45162",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "45161",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "45164",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "45163",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "45166",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "45165",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "45168",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "45167",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "45170",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "45169",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "45174",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "45173",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "45176",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "45175",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "45178",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "45177",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "45188",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "45179",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "45193",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "45189",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "45197",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "45194",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "45199",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "45198",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "45201",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "45200",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "45205",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "45202",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "45209",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "45206",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "45211",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "45210",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "45213",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "45212",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "45217",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "45216",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "45225",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "45222",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "45227",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "45226",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "45229",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "45228",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "45231",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "45230",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "45233",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "45232",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "45235",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "45234",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "45237",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "45236",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "45239",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "45238",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "45241",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "45240",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "45249",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "45242",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "45251",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "45250",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "45253",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "45252",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "45255",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "45254",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "45257",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "45256",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "45259",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "45258",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "45261",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "45260",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "45265",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "45264",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "45270",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "45269",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "45272",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "45271",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "45275",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "45273",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "45278",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "45277",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "45282",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "45281",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "45284",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "45283",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "45290",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "45289",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "45292",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "45291",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "45294",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "45293",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "45297",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "45296",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "45300",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "45299",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "45303",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "45301",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "45308",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "45306",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "45313",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "45309",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "45315",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "45314",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "45317",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "45316",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "45319",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "45318",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "45321",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "45320",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "45329",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "45328",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "45337",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "45336",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "45339",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "45338",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "45343",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "45342",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "45345",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "45344",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "45347",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "45346",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "45349",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "45348",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "45351",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "45350",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "45353",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "45352",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "45355",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "45354",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "45359",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "45356",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "45365",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "45360",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "45367",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "45366",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "45369",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "45368",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "45371",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "45370",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "45376",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "45375",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "45378",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "45377",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "45383",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "45381",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "45385",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "45384",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "45387",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "45386",
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
