// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-05-12 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-05-12';
export const CURRENT_EXPIRY_FORMATTED = '12-MAY-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "41562",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "41561",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "41564",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "41563",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "41566",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "41565",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "41568",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "41567",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "41578",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "41569",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "41580",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "41579",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "41584",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "41581",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "41590",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "41585",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "41592",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "41591",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "41594",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "41593",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "41596",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "41595",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "41598",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "41597",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "41600",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "41599",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "41616",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "41601",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "41622",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "41617",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "41624",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "41623",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "41628",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "41625",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "41630",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "41629",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "41632",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "41631",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "41636",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "41633",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "41638",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "41637",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "41640",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "41639",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "41642",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "41641",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "41644",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "41643",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "41646",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "41645",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "41649",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "41647",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "41651",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "41650",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "41655",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "41653",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "41657",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "41656",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "41661",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "41660",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "41663",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "41662",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "41665",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "41664",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "41675",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "41674",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "41679",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "41678",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "41681",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "41680",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "41683",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "41682",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "41685",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "41684",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "41687",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "41686",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "41689",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "41688",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "41691",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "41690",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "41693",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "41692",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "41695",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "41694",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "41697",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "41696",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "41699",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "41698",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "41709",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "41700",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "41711",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "41710",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "41713",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "41712",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "41717",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "41716",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "41723",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "41722",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "41725",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "41724",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "41729",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "41726",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "41731",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "41730",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "41735",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "41734",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "41737",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "41736",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "41739",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "41738",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "41741",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "41740",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "41743",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "41742",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "41745",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "41744",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "41747",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "41746",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "41749",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "41748",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "41755",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "41754",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "41757",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "41756",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "41759",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "41758",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "41761",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "41760",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "41763",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "41762",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "41777",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "41774",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "41779",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "41778",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "41785",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "41784",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "41789",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "41788",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "41791",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "41790",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "41795",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "41794",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "41801",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "41800",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "41803",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "41802",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "41805",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "41804",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "41815",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "41814",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "41817",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "41816",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "41825",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "41824",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "41827",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "41826",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "41829",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "41828",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "41831",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "41830",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "41833",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "41832",
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
