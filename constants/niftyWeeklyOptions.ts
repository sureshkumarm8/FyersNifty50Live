// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-07-07 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-07-07';
export const CURRENT_EXPIRY_FORMATTED = '07-JUL-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "44429",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "44428",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "44431",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "44430",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "44433",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "44432",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "44436",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "44435",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "44438",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "44437",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "44440",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "44439",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "44453",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "44452",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "44455",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "44454",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "44457",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "44456",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "44459",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "44458",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "44461",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "44460",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "44464",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "44462",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "44467",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "44465",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "44469",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "44468",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "44471",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "44470",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "44473",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "44472",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "44475",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "44474",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "44477",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "44476",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "44483",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "44479",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "44485",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "44484",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "44499",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "44498",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "44501",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "44500",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "44511",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "44510",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "44513",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "44512",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "44515",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "44514",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "44517",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "44516",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "44519",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "44518",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "44521",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "44520",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "44523",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "44522",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "44525",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "44524",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "44536",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "44535",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "44539",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "44538",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "44541",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "44540",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "44543",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "44542",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "44545",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "44544",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "44547",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "44546",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "44549",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "44548",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "44551",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "44550",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "44559",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "44558",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "44561",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "44560",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "44563",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "44562",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "44565",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "44564",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "44567",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "44566",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "44569",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "44568",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "44571",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "44570",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "44573",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "44572",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "44575",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "44574",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "44581",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "44576",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "44585",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "44584",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "44587",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "44586",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "44589",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "44588",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "44591",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "44590",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "44593",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "44592",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "44595",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "44594",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "44606",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "44605",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "44608",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "44607",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "44613",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "44612",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "44615",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "44614",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "44617",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "44616",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "44619",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "44618",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "44621",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "44620",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "44623",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "44622",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "44634",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "44633",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "44639",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "44635",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "44641",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "44640",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "44643",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "44642",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "44646",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "44645",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "44651",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "44649",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "44655",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "44654",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "44661",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "44660",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "44663",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "44662",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "44665",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "44664",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "44667",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "44666",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "44669",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "44668",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "44671",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "44670",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "44673",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "44672",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "44675",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "44674",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "44677",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "44676",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "44679",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "44678",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "44683",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "44682",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "44685",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "44684",
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
