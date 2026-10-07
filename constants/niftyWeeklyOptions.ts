// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-10-13 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-10-13';
export const CURRENT_EXPIRY_FORMATTED = '13-OCT-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "44513",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "44512",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "44517",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "44514",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "44519",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "44518",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "44521",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "44520",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "44523",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "44522",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "44525",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "44524",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "44527",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "44526",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "44529",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "44528",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "44531",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "44530",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "44533",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "44532",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "44541",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "44534",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "44543",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "44542",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "44555",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "44544",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "44557",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "44556",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "44561",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "44558",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "44563",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "44562",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "44565",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "44564",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "44567",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "44566",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "44569",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "44568",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "44571",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "44570",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "44581",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "44572",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "44583",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "44582",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "44585",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "44584",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "44591",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "44586",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "44595",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "44592",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "44597",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "44596",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "44599",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "44598",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "44601",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "44600",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "44604",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "44602",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "44611",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "44608",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "44613",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "44612",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "44615",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "44614",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "44617",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "44616",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "44619",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "44618",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "44621",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "44620",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "44623",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "44622",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "44625",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "44624",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "44627",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "44626",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "44629",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "44628",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "44631",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "44630",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "44633",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "44632",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "44645",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "44636",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "44647",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "44646",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "44649",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "44648",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "44653",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "44650",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "44655",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "44654",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "44657",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "44656",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "44659",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "44658",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "44661",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "44660",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "44667",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "44662",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "44669",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "44668",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "44671",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "44670",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "44681",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "44672",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "44683",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "44682",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "44691",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "44684",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "44693",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "44692",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "44697",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "44694",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "44699",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "44698",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "44709",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "44700",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "44711",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "44710",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "44715",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "44712",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "44719",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "44716",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "44721",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "44720",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "44727",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "44722",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "44729",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "44728",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "44731",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "44730",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "44739",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "44732",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "44745",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "44740",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "44747",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "44746",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "44749",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "44748",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "44755",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "44750",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "44757",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "44756",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "44759",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "44758",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "44761",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "44760",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "44763",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "44762",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "44765",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "44764",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "44767",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "44766",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "44769",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "44768",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "44775",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "44770",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "44777",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "44776",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "44779",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "44778",
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
