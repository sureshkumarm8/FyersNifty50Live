/**
 * The pre-market zone's edges must be option walls when the OI charts were read.
 *
 * 2026-11-27 08:49: the charts-only plan cut a 25,880-25,900 zone (20 pts) and
 * stood aside. Sensibull showed the put wall at 25,800 and calls at 25,900; the
 * 25,880 came from a minor level that won only because it sat nearest to spot.
 * 2026-11-26 had the same shape: intraday levels 25,791/25,807 beside an OI floor of 25,800.
 */
import { buildDecision } from '../components/PreMarketAnalyzer';
import { ChartEntry, ChartSlotId } from '../components/premarket/model';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};

const chart = (slot: ChartSlotId, supports: number[], resistances: number[]): ChartEntry => ({
  slot,
  data: '',
  fileName: `${slot}.png`,
  uploadedAt: Date.parse('2026-11-27T03:17:00Z'),
  analyzedAt: Date.parse('2026-11-27T03:18:00Z'),
  verdict: { bias: 'NEUTRAL', confidence: 60, summary: '', supports, resistances, notes: [], structured: true, raw: '' }
});

const now = Date.parse('2026-11-27T03:19:00Z'); // 08:49 IST

// 1. 2026-11-27 shape: a minor intraday level just under spot, the OI walls further out.
{
  const d = buildDecision({
    charts: [
      chart('DAILY_1Y', [25620, 25500], [26000]),
      chart('INTRADAY_1M', [25880, 25850, 25820], [25900, 25930]),
      chart('OI_SNAPSHOT', [25800, 25600, 25500], [25900, 26000])
    ],
    spot: 25885,
    spotSource: 'CHARTS',
    now
  });
  check('11-27: support is the 25,800 put wall, not the 25,880 swing', d.expectedSupport === 25800, `got ${d.expectedSupport}`);
  check('11-27: resistance is the 25,900 call wall', d.expectedResistance === 25900, `got ${d.expectedResistance}`);
  check('11-27: zone is 100 pts, not 20', d.expectedResistance - d.expectedSupport === 100);
  check('11-27: the 25,880 level is still in the ladder', d.supports.includes(25880));
}

// 2. 2026-11-26 shape (from that day's export): intraday 25,807/25,791 beside the OI floor of 25,800.
{
  const d = buildDecision({
    charts: [
      chart('DAILY_1Y', [25620, 25500], [25950, 26000]),
      chart('INTRADAY_1M', [25807, 25791, 25770, 25757, 25717], []),
      chart('OI_SNAPSHOT', [25800, 25700, 25600, 25500], [25900, 26000, 26100]),
      chart('MULTI_OI', [25800], [])
    ],
    spot: 25840,
    spotSource: 'LIVE',
    now: Date.parse('2026-11-26T03:45:00Z')
  });
  check('11-26: support is the 25,800 OI floor', d.expectedSupport === 25800, `got ${d.expectedSupport}`);
  check('11-26: resistance is 25,900', d.expectedResistance === 25900, `got ${d.expectedResistance}`);
}

// 3. No OI chart readable: behaviour is unchanged (nearest chart level).
{
  const d = buildDecision({
    charts: [chart('DAILY_1Y', [25620], [26000]), chart('INTRADAY_1M', [25880, 25820], [25930])],
    spot: 25885,
    spotSource: 'CHARTS',
    now
  });
  check('no OI chart: falls back to the nearest chart level', d.expectedSupport === 25880 && d.expectedResistance === 25930,
    `got ${d.expectedSupport}-${d.expectedResistance}`);
}

// 4. OI chart read but it names nothing below spot: fall back for that side only.
{
  const d = buildDecision({
    charts: [chart('INTRADAY_1M', [25850], [25930]), chart('OI_SNAPSHOT', [], [26000])],
    spot: 25885,
    spotSource: 'CHARTS',
    now
  });
  check('OI side empty: support falls back to the chart level', d.expectedSupport === 25850, `got ${d.expectedSupport}`);
  check('OI side present: resistance is the OI wall', d.expectedResistance === 26000, `got ${d.expectedResistance}`);
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall premarket zone checks passed');
