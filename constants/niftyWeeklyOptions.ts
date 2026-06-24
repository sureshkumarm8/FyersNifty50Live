// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-06-30 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-06-30';
export const CURRENT_EXPIRY_FORMATTED = '30-JUN-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "51455",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "51453",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "79453",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "79452",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "79455",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "79454",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "79459",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "79456",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "79461",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "79460",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "79463",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "79462",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "79465",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "79464",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "79467",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "79466",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "79469",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "79468",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "79471",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "79470",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "79473",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "79472",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "79475",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "79474",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "79477",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "79476",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "79479",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "79478",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "79481",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "79480",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "79483",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "79482",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "79485",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "79484",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "79504",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "79486",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "79506",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "79505",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "79508",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "79507",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "58627",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "79509",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "79511",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "79510",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "79513",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "79512",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "79515",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "79514",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "79517",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "79516",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "79519",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "79518",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "79521",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "79520",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "79523",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "79522",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "79525",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "79524",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "79527",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "79526",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "55186",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "55185",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "79529",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "79528",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "79531",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "79530",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "79533",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "79532",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "79535",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "79534",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "79537",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "79536",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "79539",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "79538",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "79541",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "79540",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "79543",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "79542",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "79545",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "79544",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "37805",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "37799",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "79547",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "79546",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "79549",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "79548",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "79564",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "79552",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "79566",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "79565",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "79634",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "79567",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "79653",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "79652",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "79694",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "79693",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "79696",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "79695",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "79698",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "79697",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "79700",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "79699",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "79702",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "79701",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "79704",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "79703",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "79706",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "79705",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "79708",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "79707",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "79710",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "79709",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "79712",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "79711",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "79714",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "79713",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "79723",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "79722",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "79729",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "79728",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "71473",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "71472",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "79731",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "79730",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "79733",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "79732",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "79735",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "79734",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "79737",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "79736",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "79739",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "79738",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "79741",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "79740",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "79743",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "79742",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "79747",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "79746",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "79749",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "79748",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "79751",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "79750",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "79755",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "79754",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "79757",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "79756",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "79759",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "79758",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "79761",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "79760",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "79763",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "79762",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "79767",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "79766",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "79769",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "79768",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "79773",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "79770",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "79802",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "79774",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "71475",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "71474",
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
