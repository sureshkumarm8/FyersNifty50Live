// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-05-05 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-05-05';
export const CURRENT_EXPIRY_FORMATTED = '05-MAY-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "73618",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "73617",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "73639",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "73619",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "73641",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "73640",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "73643",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "73642",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "73645",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "73644",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "73648",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "73646",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "73656",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "73649",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "73663",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "73662",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "73665",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "73664",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "73667",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "73666",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "73673",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "73668",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "73681",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "73680",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "73683",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "73682",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "73685",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "73684",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "73689",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "73688",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "73691",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "73690",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "73718",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "73694",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "73721",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "73720",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "73726",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "73722",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "73730",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "73729",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "73733",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "73732",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "73735",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "73734",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "73737",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "73736",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "73745",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "73738",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "73747",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "73746",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "73749",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "73748",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "73751",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "73750",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "73753",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "73752",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "73916",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "73754",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "73918",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "73917",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "73960",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "73919",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "73965",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "73961",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "73971",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "73970",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "73988",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "73983",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "73992",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "73989",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "74000",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "73993",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "74020",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "74001",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "74071",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "74021",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "74073",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "74072",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "74076",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "74074",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "74079",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "74077",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "74082",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "74080",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "74088",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "74087",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "74090",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "74089",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "74092",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "74091",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "74094",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "74093",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "74096",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "74095",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "74098",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "74097",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "74100",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "74099",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "74102",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "74101",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "74104",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "74103",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "74106",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "74105",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "74108",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "74107",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "74110",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "74109",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "74122",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "74111",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "74128",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "74123",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "74130",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "74129",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "74132",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "74131",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "74134",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "74133",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "74146",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "74135",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "74154",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "74147",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "74156",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "74155",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "74164",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "74157",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "74166",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "74165",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "74168",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "74167",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "74170",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "74169",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "74172",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "74171",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "74174",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "74173",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "74178",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "74175",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "74180",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "74179",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "74184",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "74181",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "74198",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "74185",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "74200",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "74199",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "74212",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "74209",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "74217",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "74216",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "74219",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "74218",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "74221",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "74220",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "74226",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "74225",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "74229",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "74228",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "74231",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "74230",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "74233",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "74232",
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
