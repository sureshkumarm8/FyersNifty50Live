// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-09-15 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-09-15';
export const CURRENT_EXPIRY_FORMATTED = '15-SEP-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "46765",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "46764",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "46776",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "46766",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "46781",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "46777",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "46796",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "46782",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "46799",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "46798",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "46802",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "46801",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "46830",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "46827",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "46832",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "46831",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "46854",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "46852",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "46857",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "46855",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "46885",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "46884",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "47092",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "47091",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "47096",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "47093",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "47116",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "47098",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "47135",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "47134",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "47146",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "47145",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "47148",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "47147",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "47151",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "47150",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "47165",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "47163",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "47211",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "47201",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "47216",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "47215",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "47223",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "47222",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "47225",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "47224",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "47227",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "47226",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "47237",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "47230",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "47243",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "47240",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "47250",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "47244",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "47252",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "47251",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "47254",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "47253",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "47256",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "47255",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "47258",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "47257",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "47260",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "47259",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "47262",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "47261",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "47264",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "47263",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "47266",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "47265",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "47268",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "47267",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "47270",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "47269",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "47272",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "47271",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "47274",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "47273",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "47276",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "47275",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "47278",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "47277",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "47280",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "47279",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "47282",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "47281",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "47284",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "47283",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "47286",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "47285",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "47288",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "47287",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "47290",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "47289",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "47292",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "47291",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "47294",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "47293",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "47296",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "47295",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "47298",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "47297",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "47300",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "47299",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "47302",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "47301",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "47304",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "47303",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "47306",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "47305",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "47308",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "47307",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "47310",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "47309",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "47312",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "47311",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "47316",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "47315",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "47318",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "47317",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "47320",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "47319",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "47322",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "47321",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "47324",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "47323",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "47326",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "47325",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "47328",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "47327",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "47330",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "47329",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "47332",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "47331",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "47334",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "47333",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "47336",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "47335",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "47338",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "47337",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "47340",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "47339",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "47343",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "47341",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "47346",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "47345",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "47348",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "47347",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "47350",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "47349",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "47352",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "47351",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "47355",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "47353",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "47358",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "47356",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "47360",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "47359",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "47362",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "47361",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "47364",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "47363",
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
