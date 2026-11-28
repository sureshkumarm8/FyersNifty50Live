/**
 * The pre-market call must not contradict itself (2026-11-27 screen):
 *  - "TAKE THE TRADE" next to "past 10:30, the day is over"
 *  - "Price is at 25,900" while Nifty was 25,876
 *  - a fade whose target (25,875) equalled the price it was "taken" at
 */
import { deriveCall, measureFromSpot, MIN_REWARD_NOW } from '../components/premarket/DecisionDeck';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!cond) failures++;
};
const ist = (hhmm: string) => new Date(`2026-11-27T${hhmm}:00+05:30`);
const fade = { side: 'PE', zoneKind: 'RESISTANCE', zone: 25900, triggerFrom: 25875, triggerTo: 25900, optionLabel: '26150 PE', itmPoints: 250, targetSpot: 25875, stopSpot: 25915, roomToOpposite: 100, status: 'PRIMARY', approxPremiumTarget: 21, approxPremiumStop: 13 };
const view: any = {
  spot: 25876, expectedSupport: 25800, expectedResistance: 25900, chartCoverage: 3, staleCharts: [],
  playbook: { verdict: 'GO', verdictReason: '', primaryPlay: fade, plays: [fade], invalidations: [] },
  aiReview: null, riskReason: ''
};

{
  const c = deriveCall(view, 'INTRADAY', 25876, ist('16:20'));
  check('after 10:30 the call is DAY OVER, never TAKE THE TRADE', c.word === 'DAY OVER', c.word);
}
{
  const c = deriveCall(view, 'INTRADAY', 25876, ist('09:30'));
  check('in band but 1 pt left to target: WAIT, not TAKE', c.word === 'WAIT FOR THE LEVEL' && c.rewardNow === 1, `${c.word} reward ${c.rewardNow}`);
  check('the line quotes the real price (25,876), not the zone', /25,876/.test(c.line) && !/Price is at 25,900/.test(c.line), c.line);
}
{
  const c = deriveCall(view, 'INTRADAY', 25898, ist('09:30'));
  check('at 25,898 in the entry window: TAKE THE TRADE', c.word === 'TAKE THE TRADE', c.word);
  check('levels measured from the price now (+23 / -17)', c.rewardNow === 23 && c.riskNow === 17 && /25,898/.test(c.line), c.line);
}
{
  const c = deriveCall(view, 'INTRADAY', 25898, ist('09:20'));
  check('in band before 09:25: wait for the entry window', c.word === 'WAIT FOR THE LEVEL' && /09:25/.test(c.line), c.line);
}
{
  const c = deriveCall(view, 'INTRADAY', 25850, ist('09:30'));
  check('mid-zone: WAIT with the distance', c.word === 'WAIT FOR THE LEVEL' && /50 pts from 25,900/.test(c.line), c.line);
}
{
  const c = deriveCall({ ...view, expectedSupport: 25880 }, 'INTRADAY', 25890, ist('09:30'));
  check('a 20-pt zone is NO TRADE', c.word === 'NO TRADE');
}
{
  const m = measureFromSpot(fade as any, 25876);
  check('measureFromSpot: SHORT reward/risk from spot', m.rewardNow === 1 && m.riskNow === 39 && m.inBand);
  check('minimum reward is 60% of the 25-pt target', MIN_REWARD_NOW === 15);
}
if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log('\nall pre-market call checks passed');
