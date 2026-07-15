// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-07-21 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-07-21';
export const CURRENT_EXPIRY_FORMATTED = '21-JUL-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "57211",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "57210",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "57213",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "57212",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "57215",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "57214",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "57217",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "57216",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "57219",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "57218",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "57221",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "57220",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "57223",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "57222",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "57231",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "57230",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "57233",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "57232",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "57235",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "57234",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "57237",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "57236",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "57239",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "57238",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "57241",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "57240",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "57243",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "57242",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "57245",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "57244",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "57247",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "57246",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "57249",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "57248",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "57251",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "57250",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "57256",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "57255",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "57258",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "57257",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "57260",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "57259",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "57262",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "57261",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "57264",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "57263",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "57266",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "57265",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "57268",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "57267",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "57270",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "57269",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "57272",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "57271",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "57274",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "57273",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "57276",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "57275",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "57278",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "57277",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "57280",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "57279",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "57282",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "57281",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "57284",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "57283",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "57286",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "57285",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "57288",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "57287",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "57290",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "57289",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "57292",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "57291",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "57294",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "57293",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "57296",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "57295",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "57298",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "57297",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "57300",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "57299",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "57302",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "57301",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "57304",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "57303",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "57306",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "57305",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "57308",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "57307",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "57310",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "57309",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "57312",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "57311",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "57314",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "57313",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "57316",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "57315",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "57318",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "57317",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "57320",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "57319",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "57322",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "57321",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "57324",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "57323",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "57326",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "57325",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "57328",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "57327",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "57330",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "57329",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "57333",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "57331",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "57335",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "57334",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "57337",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "57336",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "57339",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "57338",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "57341",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "57340",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "57343",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "57342",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "57345",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "57344",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "57347",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "57346",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "57349",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "57348",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "57351",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "57350",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "57353",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "57352",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "57355",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "57354",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "57357",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "57356",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "57359",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "57358",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "57362",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "57360",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "57364",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "57363",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "57367",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "57365",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "57370",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "57369",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "57372",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "57371",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "57374",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "57373",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "57376",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "57375",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "57389",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "57386",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "57391",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "57390",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "57393",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "57392",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "57395",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "57394",
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
