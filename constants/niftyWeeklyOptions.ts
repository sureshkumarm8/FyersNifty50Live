// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-11-23 (Next Tuesday)
// Range: every listed strike (17000 to 29600); callers filter ATM ± 20 strikes

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-11-23';
export const CURRENT_EXPIRY_FORMATTED = '23-NOV-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "41770",
    "strike": 17000,
    "type": "PE"
  },
  {
    "security_id": "41769",
    "strike": 17000,
    "type": "CE"
  },
  {
    "security_id": "41772",
    "strike": 17050,
    "type": "PE"
  },
  {
    "security_id": "41771",
    "strike": 17050,
    "type": "CE"
  },
  {
    "security_id": "41776",
    "strike": 17100,
    "type": "PE"
  },
  {
    "security_id": "41773",
    "strike": 17100,
    "type": "CE"
  },
  {
    "security_id": "35431",
    "strike": 17150,
    "type": "PE"
  },
  {
    "security_id": "35430",
    "strike": 17150,
    "type": "CE"
  },
  {
    "security_id": "35451",
    "strike": 17200,
    "type": "PE"
  },
  {
    "security_id": "35450",
    "strike": 17200,
    "type": "CE"
  },
  {
    "security_id": "35457",
    "strike": 17250,
    "type": "PE"
  },
  {
    "security_id": "35456",
    "strike": 17250,
    "type": "CE"
  },
  {
    "security_id": "35473",
    "strike": 17300,
    "type": "PE"
  },
  {
    "security_id": "35472",
    "strike": 17300,
    "type": "CE"
  },
  {
    "security_id": "35063",
    "strike": 17350,
    "type": "PE"
  },
  {
    "security_id": "35062",
    "strike": 17350,
    "type": "CE"
  },
  {
    "security_id": "35065",
    "strike": 17400,
    "type": "PE"
  },
  {
    "security_id": "35064",
    "strike": 17400,
    "type": "CE"
  },
  {
    "security_id": "61771",
    "strike": 17450,
    "type": "PE"
  },
  {
    "security_id": "61734",
    "strike": 17450,
    "type": "CE"
  },
  {
    "security_id": "61774",
    "strike": 17500,
    "type": "PE"
  },
  {
    "security_id": "61772",
    "strike": 17500,
    "type": "CE"
  },
  {
    "security_id": "58228",
    "strike": 17550,
    "type": "PE"
  },
  {
    "security_id": "58227",
    "strike": 17550,
    "type": "CE"
  },
  {
    "security_id": "58232",
    "strike": 17600,
    "type": "PE"
  },
  {
    "security_id": "58229",
    "strike": 17600,
    "type": "CE"
  },
  {
    "security_id": "58234",
    "strike": 17650,
    "type": "PE"
  },
  {
    "security_id": "58233",
    "strike": 17650,
    "type": "CE"
  },
  {
    "security_id": "58236",
    "strike": 17700,
    "type": "PE"
  },
  {
    "security_id": "58235",
    "strike": 17700,
    "type": "CE"
  },
  {
    "security_id": "58240",
    "strike": 17750,
    "type": "PE"
  },
  {
    "security_id": "58237",
    "strike": 17750,
    "type": "CE"
  },
  {
    "security_id": "56127",
    "strike": 17800,
    "type": "PE"
  },
  {
    "security_id": "56126",
    "strike": 17800,
    "type": "CE"
  },
  {
    "security_id": "47762",
    "strike": 17850,
    "type": "PE"
  },
  {
    "security_id": "47761",
    "strike": 17850,
    "type": "CE"
  },
  {
    "security_id": "47764",
    "strike": 17900,
    "type": "PE"
  },
  {
    "security_id": "47763",
    "strike": 17900,
    "type": "CE"
  },
  {
    "security_id": "47770",
    "strike": 17950,
    "type": "PE"
  },
  {
    "security_id": "47765",
    "strike": 17950,
    "type": "CE"
  },
  {
    "security_id": "47772",
    "strike": 18000,
    "type": "PE"
  },
  {
    "security_id": "47771",
    "strike": 18000,
    "type": "CE"
  },
  {
    "security_id": "47774",
    "strike": 18050,
    "type": "PE"
  },
  {
    "security_id": "47773",
    "strike": 18050,
    "type": "CE"
  },
  {
    "security_id": "47776",
    "strike": 18100,
    "type": "PE"
  },
  {
    "security_id": "47775",
    "strike": 18100,
    "type": "CE"
  },
  {
    "security_id": "45896",
    "strike": 18150,
    "type": "PE"
  },
  {
    "security_id": "45895",
    "strike": 18150,
    "type": "CE"
  },
  {
    "security_id": "42519",
    "strike": 18200,
    "type": "PE"
  },
  {
    "security_id": "42518",
    "strike": 18200,
    "type": "CE"
  },
  {
    "security_id": "42522",
    "strike": 18250,
    "type": "PE"
  },
  {
    "security_id": "42520",
    "strike": 18250,
    "type": "CE"
  },
  {
    "security_id": "42526",
    "strike": 18300,
    "type": "PE"
  },
  {
    "security_id": "42525",
    "strike": 18300,
    "type": "CE"
  },
  {
    "security_id": "42528",
    "strike": 18350,
    "type": "PE"
  },
  {
    "security_id": "42527",
    "strike": 18350,
    "type": "CE"
  },
  {
    "security_id": "45047",
    "strike": 18400,
    "type": "PE"
  },
  {
    "security_id": "45046",
    "strike": 18400,
    "type": "CE"
  },
  {
    "security_id": "45051",
    "strike": 18450,
    "type": "PE"
  },
  {
    "security_id": "45048",
    "strike": 18450,
    "type": "CE"
  },
  {
    "security_id": "45053",
    "strike": 18500,
    "type": "PE"
  },
  {
    "security_id": "45052",
    "strike": 18500,
    "type": "CE"
  },
  {
    "security_id": "43656",
    "strike": 18550,
    "type": "PE"
  },
  {
    "security_id": "43655",
    "strike": 18550,
    "type": "CE"
  },
  {
    "security_id": "42737",
    "strike": 18600,
    "type": "PE"
  },
  {
    "security_id": "42731",
    "strike": 18600,
    "type": "CE"
  },
  {
    "security_id": "41911",
    "strike": 18650,
    "type": "PE"
  },
  {
    "security_id": "41910",
    "strike": 18650,
    "type": "CE"
  },
  {
    "security_id": "41913",
    "strike": 18700,
    "type": "PE"
  },
  {
    "security_id": "41912",
    "strike": 18700,
    "type": "CE"
  },
  {
    "security_id": "41915",
    "strike": 18750,
    "type": "PE"
  },
  {
    "security_id": "41914",
    "strike": 18750,
    "type": "CE"
  },
  {
    "security_id": "41154",
    "strike": 18800,
    "type": "PE"
  },
  {
    "security_id": "41153",
    "strike": 18800,
    "type": "CE"
  },
  {
    "security_id": "35133",
    "strike": 18850,
    "type": "PE"
  },
  {
    "security_id": "35132",
    "strike": 18850,
    "type": "CE"
  },
  {
    "security_id": "35155",
    "strike": 18900,
    "type": "PE"
  },
  {
    "security_id": "35154",
    "strike": 18900,
    "type": "CE"
  },
  {
    "security_id": "35071",
    "strike": 18950,
    "type": "PE"
  },
  {
    "security_id": "35070",
    "strike": 18950,
    "type": "CE"
  },
  {
    "security_id": "35073",
    "strike": 19000,
    "type": "PE"
  },
  {
    "security_id": "35072",
    "strike": 19000,
    "type": "CE"
  },
  {
    "security_id": "35075",
    "strike": 19050,
    "type": "PE"
  },
  {
    "security_id": "35074",
    "strike": 19050,
    "type": "CE"
  },
  {
    "security_id": "64072",
    "strike": 19100,
    "type": "PE"
  },
  {
    "security_id": "64071",
    "strike": 19100,
    "type": "CE"
  },
  {
    "security_id": "64074",
    "strike": 19150,
    "type": "PE"
  },
  {
    "security_id": "64073",
    "strike": 19150,
    "type": "CE"
  },
  {
    "security_id": "64076",
    "strike": 19200,
    "type": "PE"
  },
  {
    "security_id": "64075",
    "strike": 19200,
    "type": "CE"
  },
  {
    "security_id": "64078",
    "strike": 19250,
    "type": "PE"
  },
  {
    "security_id": "64077",
    "strike": 19250,
    "type": "CE"
  },
  {
    "security_id": "64081",
    "strike": 19300,
    "type": "PE"
  },
  {
    "security_id": "64080",
    "strike": 19300,
    "type": "CE"
  },
  {
    "security_id": "64083",
    "strike": 19350,
    "type": "PE"
  },
  {
    "security_id": "64082",
    "strike": 19350,
    "type": "CE"
  },
  {
    "security_id": "64085",
    "strike": 19400,
    "type": "PE"
  },
  {
    "security_id": "64084",
    "strike": 19400,
    "type": "CE"
  },
  {
    "security_id": "64087",
    "strike": 19450,
    "type": "PE"
  },
  {
    "security_id": "64086",
    "strike": 19450,
    "type": "CE"
  },
  {
    "security_id": "64089",
    "strike": 19500,
    "type": "PE"
  },
  {
    "security_id": "64088",
    "strike": 19500,
    "type": "CE"
  },
  {
    "security_id": "64091",
    "strike": 19550,
    "type": "PE"
  },
  {
    "security_id": "64090",
    "strike": 19550,
    "type": "CE"
  },
  {
    "security_id": "64093",
    "strike": 19600,
    "type": "PE"
  },
  {
    "security_id": "64092",
    "strike": 19600,
    "type": "CE"
  },
  {
    "security_id": "64095",
    "strike": 19650,
    "type": "PE"
  },
  {
    "security_id": "64094",
    "strike": 19650,
    "type": "CE"
  },
  {
    "security_id": "64097",
    "strike": 19700,
    "type": "PE"
  },
  {
    "security_id": "64096",
    "strike": 19700,
    "type": "CE"
  },
  {
    "security_id": "64103",
    "strike": 19750,
    "type": "PE"
  },
  {
    "security_id": "64102",
    "strike": 19750,
    "type": "CE"
  },
  {
    "security_id": "64105",
    "strike": 19800,
    "type": "PE"
  },
  {
    "security_id": "64104",
    "strike": 19800,
    "type": "CE"
  },
  {
    "security_id": "64109",
    "strike": 19850,
    "type": "PE"
  },
  {
    "security_id": "64108",
    "strike": 19850,
    "type": "CE"
  },
  {
    "security_id": "64111",
    "strike": 19900,
    "type": "PE"
  },
  {
    "security_id": "64110",
    "strike": 19900,
    "type": "CE"
  },
  {
    "security_id": "64113",
    "strike": 19950,
    "type": "PE"
  },
  {
    "security_id": "64112",
    "strike": 19950,
    "type": "CE"
  },
  {
    "security_id": "64115",
    "strike": 20000,
    "type": "PE"
  },
  {
    "security_id": "64114",
    "strike": 20000,
    "type": "CE"
  },
  {
    "security_id": "64117",
    "strike": 20050,
    "type": "PE"
  },
  {
    "security_id": "64116",
    "strike": 20050,
    "type": "CE"
  },
  {
    "security_id": "64119",
    "strike": 20100,
    "type": "PE"
  },
  {
    "security_id": "64118",
    "strike": 20100,
    "type": "CE"
  },
  {
    "security_id": "64121",
    "strike": 20150,
    "type": "PE"
  },
  {
    "security_id": "64120",
    "strike": 20150,
    "type": "CE"
  },
  {
    "security_id": "64129",
    "strike": 20200,
    "type": "PE"
  },
  {
    "security_id": "64128",
    "strike": 20200,
    "type": "CE"
  },
  {
    "security_id": "64131",
    "strike": 20250,
    "type": "PE"
  },
  {
    "security_id": "64130",
    "strike": 20250,
    "type": "CE"
  },
  {
    "security_id": "64133",
    "strike": 20300,
    "type": "PE"
  },
  {
    "security_id": "64132",
    "strike": 20300,
    "type": "CE"
  },
  {
    "security_id": "64135",
    "strike": 20350,
    "type": "PE"
  },
  {
    "security_id": "64134",
    "strike": 20350,
    "type": "CE"
  },
  {
    "security_id": "64137",
    "strike": 20400,
    "type": "PE"
  },
  {
    "security_id": "64136",
    "strike": 20400,
    "type": "CE"
  },
  {
    "security_id": "64139",
    "strike": 20450,
    "type": "PE"
  },
  {
    "security_id": "64138",
    "strike": 20450,
    "type": "CE"
  },
  {
    "security_id": "64141",
    "strike": 20500,
    "type": "PE"
  },
  {
    "security_id": "64140",
    "strike": 20500,
    "type": "CE"
  },
  {
    "security_id": "64143",
    "strike": 20550,
    "type": "PE"
  },
  {
    "security_id": "64142",
    "strike": 20550,
    "type": "CE"
  },
  {
    "security_id": "64147",
    "strike": 20600,
    "type": "PE"
  },
  {
    "security_id": "64144",
    "strike": 20600,
    "type": "CE"
  },
  {
    "security_id": "64150",
    "strike": 20650,
    "type": "PE"
  },
  {
    "security_id": "64149",
    "strike": 20650,
    "type": "CE"
  },
  {
    "security_id": "64152",
    "strike": 20700,
    "type": "PE"
  },
  {
    "security_id": "64151",
    "strike": 20700,
    "type": "CE"
  },
  {
    "security_id": "64161",
    "strike": 20750,
    "type": "PE"
  },
  {
    "security_id": "64160",
    "strike": 20750,
    "type": "CE"
  },
  {
    "security_id": "64163",
    "strike": 20800,
    "type": "PE"
  },
  {
    "security_id": "64162",
    "strike": 20800,
    "type": "CE"
  },
  {
    "security_id": "64165",
    "strike": 20850,
    "type": "PE"
  },
  {
    "security_id": "64164",
    "strike": 20850,
    "type": "CE"
  },
  {
    "security_id": "64167",
    "strike": 20900,
    "type": "PE"
  },
  {
    "security_id": "64166",
    "strike": 20900,
    "type": "CE"
  },
  {
    "security_id": "64169",
    "strike": 20950,
    "type": "PE"
  },
  {
    "security_id": "64168",
    "strike": 20950,
    "type": "CE"
  },
  {
    "security_id": "64177",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "64170",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "64179",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "64178",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "64181",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "64180",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "64185",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "64182",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "64187",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "64186",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "64189",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "64188",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "64191",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "64190",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "64197",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "64192",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "64205",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "64201",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "64207",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "64206",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "64209",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "64208",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "64215",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "64210",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "64217",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "64216",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "64219",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "64218",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "64221",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "64220",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "64226",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "64222",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "64228",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "64227",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "64233",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "64232",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "64235",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "64234",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "64237",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "64236",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "64239",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "64238",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "64241",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "64240",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "64243",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "64242",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "64245",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "64244",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "64247",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "64246",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "64267",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "64266",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "64269",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "64268",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "64271",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "64270",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "64275",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "64274",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "64277",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "64276",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "64279",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "64278",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "64285",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "64284",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "64287",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "64286",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "64290",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "64288",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "64293",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "64291",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "64295",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "64294",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "64305",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "64304",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "64324",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "64306",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "64326",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "64325",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "64334",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "64327",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "64337",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "64335",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "64346",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "64342",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "64348",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "64347",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "64350",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "64349",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "64352",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "64351",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "64356",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "64353",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "64358",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "64357",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "64360",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "64359",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "64362",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "64361",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "64372",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "64363",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "64374",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "64373",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "64376",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "64375",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "64378",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "64377",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "64380",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "64379",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "64384",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "64381",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "64386",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "64385",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "64388",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "64387",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "64390",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "64389",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "64392",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "64391",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "64396",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "64393",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "64398",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "64397",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "64400",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "64399",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "64402",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "64401",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "64404",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "64403",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "64406",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "64405",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "64408",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "64407",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "64410",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "64409",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "64412",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "64411",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "64414",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "64413",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "64416",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "64415",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "64418",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "64417",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "64420",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "64419",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "64422",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "64421",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "64424",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "64423",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "64426",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "64425",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "64428",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "64427",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "64432",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "64429",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "64434",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "64433",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "64436",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "64435",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "64438",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "64437",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "64440",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "64439",
    "strike": 25000,
    "type": "CE"
  },
  {
    "security_id": "64442",
    "strike": 25050,
    "type": "PE"
  },
  {
    "security_id": "64441",
    "strike": 25050,
    "type": "CE"
  },
  {
    "security_id": "64444",
    "strike": 25100,
    "type": "PE"
  },
  {
    "security_id": "64443",
    "strike": 25100,
    "type": "CE"
  },
  {
    "security_id": "64450",
    "strike": 25150,
    "type": "PE"
  },
  {
    "security_id": "64445",
    "strike": 25150,
    "type": "CE"
  },
  {
    "security_id": "64452",
    "strike": 25200,
    "type": "PE"
  },
  {
    "security_id": "64451",
    "strike": 25200,
    "type": "CE"
  },
  {
    "security_id": "64455",
    "strike": 25250,
    "type": "PE"
  },
  {
    "security_id": "64453",
    "strike": 25250,
    "type": "CE"
  },
  {
    "security_id": "64457",
    "strike": 25300,
    "type": "PE"
  },
  {
    "security_id": "64456",
    "strike": 25300,
    "type": "CE"
  },
  {
    "security_id": "64459",
    "strike": 25350,
    "type": "PE"
  },
  {
    "security_id": "64458",
    "strike": 25350,
    "type": "CE"
  },
  {
    "security_id": "64469",
    "strike": 25400,
    "type": "PE"
  },
  {
    "security_id": "64462",
    "strike": 25400,
    "type": "CE"
  },
  {
    "security_id": "64471",
    "strike": 25450,
    "type": "PE"
  },
  {
    "security_id": "64470",
    "strike": 25450,
    "type": "CE"
  },
  {
    "security_id": "64474",
    "strike": 25500,
    "type": "PE"
  },
  {
    "security_id": "64473",
    "strike": 25500,
    "type": "CE"
  },
  {
    "security_id": "64476",
    "strike": 25550,
    "type": "PE"
  },
  {
    "security_id": "64475",
    "strike": 25550,
    "type": "CE"
  },
  {
    "security_id": "64478",
    "strike": 25600,
    "type": "PE"
  },
  {
    "security_id": "64477",
    "strike": 25600,
    "type": "CE"
  },
  {
    "security_id": "64480",
    "strike": 25650,
    "type": "PE"
  },
  {
    "security_id": "64479",
    "strike": 25650,
    "type": "CE"
  },
  {
    "security_id": "64482",
    "strike": 25700,
    "type": "PE"
  },
  {
    "security_id": "64481",
    "strike": 25700,
    "type": "CE"
  },
  {
    "security_id": "64488",
    "strike": 25750,
    "type": "PE"
  },
  {
    "security_id": "64487",
    "strike": 25750,
    "type": "CE"
  },
  {
    "security_id": "64490",
    "strike": 25800,
    "type": "PE"
  },
  {
    "security_id": "64489",
    "strike": 25800,
    "type": "CE"
  },
  {
    "security_id": "64492",
    "strike": 25850,
    "type": "PE"
  },
  {
    "security_id": "64491",
    "strike": 25850,
    "type": "CE"
  },
  {
    "security_id": "64494",
    "strike": 25900,
    "type": "PE"
  },
  {
    "security_id": "64493",
    "strike": 25900,
    "type": "CE"
  },
  {
    "security_id": "64496",
    "strike": 25950,
    "type": "PE"
  },
  {
    "security_id": "64495",
    "strike": 25950,
    "type": "CE"
  },
  {
    "security_id": "64498",
    "strike": 26000,
    "type": "PE"
  },
  {
    "security_id": "64497",
    "strike": 26000,
    "type": "CE"
  },
  {
    "security_id": "64500",
    "strike": 26050,
    "type": "PE"
  },
  {
    "security_id": "64499",
    "strike": 26050,
    "type": "CE"
  },
  {
    "security_id": "64502",
    "strike": 26100,
    "type": "PE"
  },
  {
    "security_id": "64501",
    "strike": 26100,
    "type": "CE"
  },
  {
    "security_id": "64504",
    "strike": 26150,
    "type": "PE"
  },
  {
    "security_id": "64503",
    "strike": 26150,
    "type": "CE"
  },
  {
    "security_id": "64506",
    "strike": 26200,
    "type": "PE"
  },
  {
    "security_id": "64505",
    "strike": 26200,
    "type": "CE"
  },
  {
    "security_id": "64508",
    "strike": 26250,
    "type": "PE"
  },
  {
    "security_id": "64507",
    "strike": 26250,
    "type": "CE"
  },
  {
    "security_id": "64511",
    "strike": 26300,
    "type": "PE"
  },
  {
    "security_id": "64509",
    "strike": 26300,
    "type": "CE"
  },
  {
    "security_id": "64521",
    "strike": 26350,
    "type": "PE"
  },
  {
    "security_id": "64512",
    "strike": 26350,
    "type": "CE"
  },
  {
    "security_id": "64523",
    "strike": 26400,
    "type": "PE"
  },
  {
    "security_id": "64522",
    "strike": 26400,
    "type": "CE"
  },
  {
    "security_id": "64525",
    "strike": 26450,
    "type": "PE"
  },
  {
    "security_id": "64524",
    "strike": 26450,
    "type": "CE"
  },
  {
    "security_id": "64527",
    "strike": 26500,
    "type": "PE"
  },
  {
    "security_id": "64526",
    "strike": 26500,
    "type": "CE"
  },
  {
    "security_id": "64529",
    "strike": 26550,
    "type": "PE"
  },
  {
    "security_id": "64528",
    "strike": 26550,
    "type": "CE"
  },
  {
    "security_id": "64531",
    "strike": 26600,
    "type": "PE"
  },
  {
    "security_id": "64530",
    "strike": 26600,
    "type": "CE"
  },
  {
    "security_id": "64534",
    "strike": 26650,
    "type": "PE"
  },
  {
    "security_id": "64532",
    "strike": 26650,
    "type": "CE"
  },
  {
    "security_id": "64536",
    "strike": 26700,
    "type": "PE"
  },
  {
    "security_id": "64535",
    "strike": 26700,
    "type": "CE"
  },
  {
    "security_id": "64538",
    "strike": 26750,
    "type": "PE"
  },
  {
    "security_id": "64537",
    "strike": 26750,
    "type": "CE"
  },
  {
    "security_id": "64542",
    "strike": 26800,
    "type": "PE"
  },
  {
    "security_id": "64539",
    "strike": 26800,
    "type": "CE"
  },
  {
    "security_id": "64544",
    "strike": 26850,
    "type": "PE"
  },
  {
    "security_id": "64543",
    "strike": 26850,
    "type": "CE"
  },
  {
    "security_id": "64548",
    "strike": 26900,
    "type": "PE"
  },
  {
    "security_id": "64545",
    "strike": 26900,
    "type": "CE"
  },
  {
    "security_id": "64550",
    "strike": 26950,
    "type": "PE"
  },
  {
    "security_id": "64549",
    "strike": 26950,
    "type": "CE"
  },
  {
    "security_id": "64552",
    "strike": 27000,
    "type": "PE"
  },
  {
    "security_id": "64551",
    "strike": 27000,
    "type": "CE"
  },
  {
    "security_id": "64554",
    "strike": 27050,
    "type": "PE"
  },
  {
    "security_id": "64553",
    "strike": 27050,
    "type": "CE"
  },
  {
    "security_id": "64556",
    "strike": 27100,
    "type": "PE"
  },
  {
    "security_id": "64555",
    "strike": 27100,
    "type": "CE"
  },
  {
    "security_id": "64558",
    "strike": 27150,
    "type": "PE"
  },
  {
    "security_id": "64557",
    "strike": 27150,
    "type": "CE"
  },
  {
    "security_id": "64560",
    "strike": 27200,
    "type": "PE"
  },
  {
    "security_id": "64559",
    "strike": 27200,
    "type": "CE"
  },
  {
    "security_id": "64562",
    "strike": 27250,
    "type": "PE"
  },
  {
    "security_id": "64561",
    "strike": 27250,
    "type": "CE"
  },
  {
    "security_id": "64564",
    "strike": 27300,
    "type": "PE"
  },
  {
    "security_id": "64563",
    "strike": 27300,
    "type": "CE"
  },
  {
    "security_id": "64566",
    "strike": 27350,
    "type": "PE"
  },
  {
    "security_id": "64565",
    "strike": 27350,
    "type": "CE"
  },
  {
    "security_id": "64568",
    "strike": 27400,
    "type": "PE"
  },
  {
    "security_id": "64567",
    "strike": 27400,
    "type": "CE"
  },
  {
    "security_id": "64570",
    "strike": 27450,
    "type": "PE"
  },
  {
    "security_id": "64569",
    "strike": 27450,
    "type": "CE"
  },
  {
    "security_id": "64572",
    "strike": 27500,
    "type": "PE"
  },
  {
    "security_id": "64571",
    "strike": 27500,
    "type": "CE"
  },
  {
    "security_id": "64574",
    "strike": 27550,
    "type": "PE"
  },
  {
    "security_id": "64573",
    "strike": 27550,
    "type": "CE"
  },
  {
    "security_id": "64576",
    "strike": 27600,
    "type": "PE"
  },
  {
    "security_id": "64575",
    "strike": 27600,
    "type": "CE"
  },
  {
    "security_id": "64578",
    "strike": 27650,
    "type": "PE"
  },
  {
    "security_id": "64577",
    "strike": 27650,
    "type": "CE"
  },
  {
    "security_id": "64580",
    "strike": 27700,
    "type": "PE"
  },
  {
    "security_id": "64579",
    "strike": 27700,
    "type": "CE"
  },
  {
    "security_id": "64582",
    "strike": 27750,
    "type": "PE"
  },
  {
    "security_id": "64581",
    "strike": 27750,
    "type": "CE"
  },
  {
    "security_id": "64584",
    "strike": 27800,
    "type": "PE"
  },
  {
    "security_id": "64583",
    "strike": 27800,
    "type": "CE"
  },
  {
    "security_id": "64586",
    "strike": 27850,
    "type": "PE"
  },
  {
    "security_id": "64585",
    "strike": 27850,
    "type": "CE"
  },
  {
    "security_id": "64588",
    "strike": 27900,
    "type": "PE"
  },
  {
    "security_id": "64587",
    "strike": 27900,
    "type": "CE"
  },
  {
    "security_id": "64590",
    "strike": 27950,
    "type": "PE"
  },
  {
    "security_id": "64589",
    "strike": 27950,
    "type": "CE"
  },
  {
    "security_id": "64592",
    "strike": 28000,
    "type": "PE"
  },
  {
    "security_id": "64591",
    "strike": 28000,
    "type": "CE"
  },
  {
    "security_id": "64594",
    "strike": 28050,
    "type": "PE"
  },
  {
    "security_id": "64593",
    "strike": 28050,
    "type": "CE"
  },
  {
    "security_id": "64596",
    "strike": 28100,
    "type": "PE"
  },
  {
    "security_id": "64595",
    "strike": 28100,
    "type": "CE"
  },
  {
    "security_id": "64598",
    "strike": 28150,
    "type": "PE"
  },
  {
    "security_id": "64597",
    "strike": 28150,
    "type": "CE"
  },
  {
    "security_id": "64600",
    "strike": 28200,
    "type": "PE"
  },
  {
    "security_id": "64599",
    "strike": 28200,
    "type": "CE"
  },
  {
    "security_id": "64602",
    "strike": 28250,
    "type": "PE"
  },
  {
    "security_id": "64601",
    "strike": 28250,
    "type": "CE"
  },
  {
    "security_id": "64604",
    "strike": 28300,
    "type": "PE"
  },
  {
    "security_id": "64603",
    "strike": 28300,
    "type": "CE"
  },
  {
    "security_id": "64606",
    "strike": 28350,
    "type": "PE"
  },
  {
    "security_id": "64605",
    "strike": 28350,
    "type": "CE"
  },
  {
    "security_id": "64609",
    "strike": 28400,
    "type": "PE"
  },
  {
    "security_id": "64607",
    "strike": 28400,
    "type": "CE"
  },
  {
    "security_id": "64611",
    "strike": 28450,
    "type": "PE"
  },
  {
    "security_id": "64610",
    "strike": 28450,
    "type": "CE"
  },
  {
    "security_id": "64614",
    "strike": 28500,
    "type": "PE"
  },
  {
    "security_id": "64612",
    "strike": 28500,
    "type": "CE"
  },
  {
    "security_id": "64616",
    "strike": 28550,
    "type": "PE"
  },
  {
    "security_id": "64615",
    "strike": 28550,
    "type": "CE"
  },
  {
    "security_id": "64618",
    "strike": 28600,
    "type": "PE"
  },
  {
    "security_id": "64617",
    "strike": 28600,
    "type": "CE"
  },
  {
    "security_id": "64620",
    "strike": 28650,
    "type": "PE"
  },
  {
    "security_id": "64619",
    "strike": 28650,
    "type": "CE"
  },
  {
    "security_id": "64623",
    "strike": 28700,
    "type": "PE"
  },
  {
    "security_id": "64621",
    "strike": 28700,
    "type": "CE"
  },
  {
    "security_id": "64626",
    "strike": 28750,
    "type": "PE"
  },
  {
    "security_id": "64625",
    "strike": 28750,
    "type": "CE"
  },
  {
    "security_id": "64628",
    "strike": 28800,
    "type": "PE"
  },
  {
    "security_id": "64627",
    "strike": 28800,
    "type": "CE"
  },
  {
    "security_id": "64630",
    "strike": 28850,
    "type": "PE"
  },
  {
    "security_id": "64629",
    "strike": 28850,
    "type": "CE"
  },
  {
    "security_id": "64632",
    "strike": 28900,
    "type": "PE"
  },
  {
    "security_id": "64631",
    "strike": 28900,
    "type": "CE"
  },
  {
    "security_id": "64634",
    "strike": 28950,
    "type": "PE"
  },
  {
    "security_id": "64633",
    "strike": 28950,
    "type": "CE"
  },
  {
    "security_id": "64636",
    "strike": 29000,
    "type": "PE"
  },
  {
    "security_id": "64635",
    "strike": 29000,
    "type": "CE"
  },
  {
    "security_id": "64638",
    "strike": 29050,
    "type": "PE"
  },
  {
    "security_id": "64637",
    "strike": 29050,
    "type": "CE"
  },
  {
    "security_id": "64640",
    "strike": 29100,
    "type": "PE"
  },
  {
    "security_id": "64639",
    "strike": 29100,
    "type": "CE"
  },
  {
    "security_id": "64642",
    "strike": 29150,
    "type": "PE"
  },
  {
    "security_id": "64641",
    "strike": 29150,
    "type": "CE"
  },
  {
    "security_id": "64644",
    "strike": 29200,
    "type": "PE"
  },
  {
    "security_id": "64643",
    "strike": 29200,
    "type": "CE"
  },
  {
    "security_id": "64646",
    "strike": 29250,
    "type": "PE"
  },
  {
    "security_id": "64645",
    "strike": 29250,
    "type": "CE"
  },
  {
    "security_id": "64648",
    "strike": 29300,
    "type": "PE"
  },
  {
    "security_id": "64647",
    "strike": 29300,
    "type": "CE"
  },
  {
    "security_id": "64650",
    "strike": 29350,
    "type": "PE"
  },
  {
    "security_id": "64649",
    "strike": 29350,
    "type": "CE"
  },
  {
    "security_id": "64652",
    "strike": 29400,
    "type": "PE"
  },
  {
    "security_id": "64651",
    "strike": 29400,
    "type": "CE"
  },
  {
    "security_id": "64660",
    "strike": 29450,
    "type": "PE"
  },
  {
    "security_id": "64659",
    "strike": 29450,
    "type": "CE"
  },
  {
    "security_id": "64662",
    "strike": 29500,
    "type": "PE"
  },
  {
    "security_id": "64661",
    "strike": 29500,
    "type": "CE"
  },
  {
    "security_id": "64664",
    "strike": 29550,
    "type": "PE"
  },
  {
    "security_id": "64663",
    "strike": 29550,
    "type": "CE"
  },
  {
    "security_id": "64666",
    "strike": 29600,
    "type": "PE"
  },
  {
    "security_id": "64665",
    "strike": 29600,
    "type": "CE"
  }
];

// Get security IDs for current week (all 506 contracts)
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
