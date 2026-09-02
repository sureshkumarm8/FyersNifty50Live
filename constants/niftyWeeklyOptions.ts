// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-09-08 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-09-08';
export const CURRENT_EXPIRY_FORMATTED = '08-SEP-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "42504",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "42503",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "42506",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "42505",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "42508",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "42507",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "42512",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "42509",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "42514",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "42513",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "42516",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "42515",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "42518",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "42517",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "42520",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "42519",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "42525",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "42522",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "42527",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "42526",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "42529",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "42528",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "42531",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "42530",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "42533",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "42532",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "42536",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "42534",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "42538",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "42537",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "42541",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "42539",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "42543",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "42542",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "42545",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "42544",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "42547",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "42546",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "42549",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "42548",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "42551",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "42550",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "42553",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "42552",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "42555",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "42554",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "42557",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "42556",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "42559",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "42558",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "42561",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "42560",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "42564",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "42562",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "42566",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "42565",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "42568",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "42567",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "42570",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "42569",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "42572",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "42571",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "42574",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "42573",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "42576",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "42575",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "42578",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "42577",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "42580",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "42579",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "42582",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "42581",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "42584",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "42583",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "42586",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "42585",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "42588",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "42587",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "42590",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "42589",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "42592",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "42591",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "42594",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "42593",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "42596",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "42595",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "42598",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "42597",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "42600",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "42599",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "42602",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "42601",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "42604",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "42603",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "42607",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "42605",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "42609",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "42608",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "42611",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "42610",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "42614",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "42612",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "42621",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "42615",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "42624",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "42623",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "42626",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "42625",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "42628",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "42627",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "42630",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "42629",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "42632",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "42631",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "42634",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "42633",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "42636",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "42635",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "42638",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "42637",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "42640",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "42639",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "42642",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "42641",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "42644",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "42643",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "42646",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "42645",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "42648",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "42647",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "42650",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "42649",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "42652",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "42651",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "42654",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "42653",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "42658",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "42657",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "42660",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "42659",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "42662",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "42661",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "42664",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "42663",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "42666",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "42665",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "42668",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "42667",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "42670",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "42669",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "42672",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "42671",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "42674",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "42673",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "42676",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "42675",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "42680",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "42677",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "42682",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "42681",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "42684",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "42683",
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
