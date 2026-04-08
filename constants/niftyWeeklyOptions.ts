// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-04-13 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-04-13';
export const CURRENT_EXPIRY_FORMATTED = '13-APR-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "54362",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "54361",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "54364",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "54363",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "54503",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "54458",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "54601",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "54504",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "54603",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "54602",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "54605",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "54604",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "54607",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "54606",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "54609",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "54608",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "54628",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "54610",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "54634",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "54629",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "54638",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "54635",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "54648",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "54647",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "54656",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "54649",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "54658",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "54657",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "54660",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "54659",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "54662",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "54661",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "54670",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "54663",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "54675",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "54674",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "54678",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "54676",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "54680",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "54679",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "54682",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "54681",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "54684",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "54683",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "54686",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "54685",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "54688",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "54687",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "54690",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "54689",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "54692",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "54691",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "54694",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "54693",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "54696",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "54695",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "54698",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "54697",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "54700",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "54699",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "54702",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "54701",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "54704",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "54703",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "54706",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "54705",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "54710",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "54707",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "54754",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "54711",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "54756",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "54755",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "54758",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "54757",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "54760",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "54759",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "54762",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "54761",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "54764",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "54763",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "54766",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "54765",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "54768",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "54767",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "54770",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "54769",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "54772",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "54771",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "54774",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "54773",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "54776",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "54775",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "54778",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "54777",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "54787",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "54779",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "54789",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "54788",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "54791",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "54790",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "54793",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "54792",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "54795",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "54794",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "54797",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "54796",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "54799",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "54798",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "54801",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "54800",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "54803",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "54802",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "54805",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "54804",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "54807",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "54806",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "54809",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "54808",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "54811",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "54810",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "54815",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "54812",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "54817",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "54816",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "54820",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "54818",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "54832",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "54821",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "54834",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "54833",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "54863",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "54835",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "54865",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "54864",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "54867",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "54866",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "54869",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "54868",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "54871",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "54870",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "54873",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "54872",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "54875",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "54874",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "54877",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "54876",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "54879",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "54878",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "54881",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "54880",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "54883",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "54882",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "54885",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "54884",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "54887",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "54886",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "54889",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "54888",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "54891",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "54890",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "54893",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "54892",
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
