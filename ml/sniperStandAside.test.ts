/**
 * A pre-market stand-aside about the walls must not outlive the walls.
 *
 * 2026-11-18: the 08:52 charts-only plan stood aside because its walls
 * (25380/25392) were only 12 points apart. The session opened at 25323, below
 * both, and locked a 65-point range - short of the 75 a provisional plan needs
 * to be overruled - so the stand-aside held while Nifty fell 156 points. These checks pin when that verdict is dropped
 * and, as importantly, when it still stands.
 */
import { reconcile } from '../services/sniperReconcile';
import { rangeCoverage } from '../services/sniperReview';
import { SniperGate, SniperPlaybook } from '../services/sniperPlaybook';
import { OpeningRange } from '../services/sniperEngine';

let passed = 0;
let failed = 0;

const check = (label: string, ok: boolean, detail?: string) => {
  if (ok) {
    passed++;
    console.log(`  ok    ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const roomGate: SniperGate = {
  id: 'room',
  label: '25 points actually fits',
  pass: false,
  severity: 'BLOCKER',
  detail: 'Only 12 points between the walls. Entry can be up to 25 points inside the zone, so 25 points cannot be captured. This is a no-trade day.'
};
const staleGate: SniperGate = { id: 'fresh', label: 'Charts are current', pass: false, severity: 'BLOCKER', detail: 'Stale screenshot(s): 15m.' };

const plan = (gates: SniperGate[]) =>
  ({
    verdict: 'STAND_ASIDE',
    verdictHeadline: 'STAND ASIDE — no trade today',
    verdictReason: gates[0].detail,
    closePrice: 25387,
    plannedSupport: 25380,
    plannedResistance: 25392,
    zoneWidth: 12,
    scenarios: [],
    primaryPlay: null,
    gates
  }) as unknown as SniperPlaybook;

const range = (open: number, support: number, resistance: number) =>
  ({ open, high: resistance, low: support, support, resistance, openType: 'GAP_DOWN', samples: 10, lockedAt: 0 }) as OpeningRange;

const run = (p: SniperPlaybook, r: OpeningRange, planIsProvisional = true) =>
  reconcile({ playbook: p, range: r, drift: -60, breadth: -30, planIsProvisional });

// 2026-11-18 as it happened: open 25323, range 25323-25389.
const today = run(plan([roomGate]), range(25323.15, 25323, 25389));
check('a gap through the walls drops the room-only stand-aside', today.veto === null, today.veto ?? '');
check('the drop is announced', today.adjustments.some(a => a.includes('Stand aside" dropped')), today.adjustments.join(' | '));
// Resistance 25389 is within the confluence band of the plan's 25392, so the
// plan's wall is kept; the broken support is re-cut from the tape.
check('the broken support is re-cut from the tape', today.support === 25323 && today.resistance === 25392, `${today.support}/${today.resistance}`);
check('the same holds for a plan cut on a real price', run(plan([roomGate]), range(25323.15, 25323, 25389), false).veto === null);

const inside = run(plan([roomGate]), range(25385, 25360, 25420));
check('an open between the walls keeps the stand-aside', inside.veto !== null);

const stale = run(plan([roomGate, staleGate]), range(25323.15, 25323, 25389));
check('a second blocker keeps the stand-aside even after a gap', stale.veto !== null);

const narrow = run(plan([roomGate]), range(25323.15, 25323, 25362));
check('the live zone still has to pass the room check', narrow.veto !== null && /only 39 pts/.test(narrow.veto!), narrow.veto ?? '');

// 2026-11-19: the risk officer ended the day over a range "of only 7 ticks".
// At one reading a minute, 7 is a full range; the code says so now.
check('7 readings are reported as complete', rangeCoverage(7).startsWith('COMPLETE'), rangeCoverage(7));
check('3 readings are reported as thin', rangeCoverage(3).startsWith('THIN'), rangeCoverage(3));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
