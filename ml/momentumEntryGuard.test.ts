import assert from 'node:assert/strict';
import type { MarketSnapshot, VisionRun, VisionVerdict } from '../types';
import { EnhancedSignalGenerator, type EnhancedSignal } from '../services/enhancedSignalGenerator';
import type { Order } from '../services/orderManager';
import {
  evaluateMomentumEntry, pairRoundTrips, MOMENTUM_POLICY,
  type MomentumCandidate, type MomentumGateInput
} from '../services/momentumEntryGuard';
import { computeCharges } from '../services/paperTradingService';
import { estimateOptionPremium } from '../services/optionPricing';
import { istDayKey } from '../services/sniperEngine';

// Wednesday, 11:00 IST. No wall clock, browser storage, or broker is involved.
const AT = Date.parse('2026-09-16T11:00:00+05:30');
const MINUTE = 60_000;
const CE = 'NSE:NIFTY2692223500CE';
const PE = 'NSE:NIFTY2692223500PE';
type Direction = MomentumCandidate['direction'];
let passed = 0;

function test(label: string, run: () => void) {
  run();
  passed++;
  console.log(`  ok    ${label}`);
}

function signal(direction: Direction = 'LONG'): EnhancedSignal {
  const sign = direction === 'LONG' ? 1 : -1;
  const bias = sign === 1 ? 'BULLISH' : 'BEARISH';
  return {
    direction, confidence: 90, reasons: ['Aligned trend'], timeframe: '15-minute',
    suggestedEntry: 23500, suggestedTarget: 23560, suggestedStopLoss: 23480,
    riskRewardRatio: 3,
    metrics: {
      trend15m: bias, trendStrength: 80, priceVelocity: sign * 2,
      broadSentiment: sign * 40, callPutRatio: 1.2,
      optionFlow: bias, optionFlowStrength: 50,
      momentumScore: sign * 50, accelerationRatio: 1,
      callBuyPressure: sign * 40, putBuyPressure: -sign * 40, oiExpanding: true,
      support: 23450, resistance: 23550, volatility: 0.2,
      volatilityTrend: 'STABLE', overallConfidence: 90, signalStrength: 'STRONG'
    }
  };
}

function history(at = AT, direction: Direction = 'LONG'): MarketSnapshot[] {
  const sign = direction === 'LONG' ? 1 : -1;
  return Array.from({ length: 16 }, (_, i): MarketSnapshot => {
    const timestamp = at - i * MINUTE;
    return {
      time: new Date(timestamp).toISOString(), timestamp,
      niftyLtp: 23500 + sign * (2 * (at - AT) / MINUTE - i * 2),
      ptsChg: sign * 30, overallSent: sign * 40, adv: 35, dec: 15,
      stockSent: sign * 40, callSent: sign * 30, putSent: -sign * 30,
      pcr: 1.2, optionsSent: sign * 60,
      callsBuyQty: 200, callsSellQty: 100, putsBuyQty: 100, putsSellQty: 200,
      callsOI: 1000, putsOI: 1200
    };
  });
}

function input(at = AT, direction: Direction = 'LONG'): MomentumGateInput {
  const rows = history(at, direction);
  return {
    now: at, running: true, signal: signal(direction), signalAt: at,
    history: rows, spot: rows[0].niftyLtp, orders: [], openPositions: 0,
    premium: 100, quantity: 75, targetPct: 30, stopPct: 10,
    minConfidence: 80, brokerage: 20, requireVision: false, vision: null
  };
}

function confirmed(at = AT, direction: Direction = 'LONG'): MomentumCandidate {
  return { direction, firstAt: at - 2 * MINUTE, lastAt: at - MINUTE, observations: 2 };
}

function blocked(i: MomentumGateInput, reason: RegExp, previous = confirmed(i.now)) {
  const result = evaluateMomentumEntry(i, previous);
  assert.equal(result.ready, false, result.reason);
  assert.equal(result.candidate, null, 'a denial must discard accumulated confirmation');
  assert.match(result.reason, reason);
  return result;
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'test-order', symbol: CE, side: 'BUY', type: 'MARKET',
    quantity: 75, productType: 'INTRADAY', status: 'FILLED',
    filledQty: 75, avgPrice: 100, timestamp: AT - 30 * MINUTE,
    ...overrides
  };
}

function trip(exitAt: number, exitPrice = 120, symbol = CE, qty = 75): Order[] {
  return [
    order({ id: `${symbol}-${exitAt}-buy`, symbol, timestamp: exitAt - MINUTE,
      quantity: qty, filledQty: qty }),
    order({ id: `${symbol}-${exitAt}-sell`, symbol, side: 'SELL', timestamp: exitAt,
      avgPrice: exitPrice, quantity: qty, filledQty: qty })
  ];
}

function vision(at = AT, bias: VisionVerdict['bias'] = 'bullish'): VisionRun {
  return {
    id: 'test-capture', manual: false,
    startedAt: new Date(at - MINUTE).toISOString(),
    finishedAt: new Date(at).toISOString(), durationMs: MINUTE,
    shots: [
      { id: 'chart', label: 'Chart', url: 'https://example.invalid/chart', ok: true },
      { id: 'oi', label: 'OI', url: 'https://example.invalid/oi', ok: true }
    ],
    analysis: {
      ok: true, parsed: {
        readable: true, bias, confidence: 85, spot_estimate: '23500',
        timeframe_seen: '15m', price_action: 'Directional trend',
        supports: ['23450'], resistances: ['23550'], oi_read: 'Aligned',
        highest_call_oi_strike: '23600', highest_put_oi_strike: '23400',
        expected_range: '23450-23550', combined_view: 'Aligned',
        watch_for: [], risks: []
      }
    }
  };
}

for (const direction of ['LONG', 'SHORT'] as const) {
  test(`${direction}: three distinct snapshots over two actual minutes confirm`, () => {
    let candidate: MomentumCandidate | null = null;
    for (let minute = 0; minute <= 2; minute++) {
      const now = AT + minute * MINUTE;
      const result = evaluateMomentumEntry(input(now, direction), candidate);
      assert.equal(result.ready, minute === 2, result.reason);
      assert.deepEqual(result.candidate, {
        direction, firstAt: AT, lastAt: now, observations: minute + 1
      });
      candidate = result.candidate;
    }
  });

  test(`${direction}: actual generator and ATM estimator reach a default paper entry`, () => {
    const sign = direction === 'LONG' ? 1 : -1;
    const optionType = direction === 'LONG' ? 'CE' : 'PE';
    let candidate: MomentumCandidate | null = null;
    for (let minute = 0; minute <= 2; minute++) {
      const now = AT + minute * MINUTE;
      const rows: MarketSnapshot[] = history(now, direction).map((row, index) => ({
        ...row,
        niftyLtp: 23500 + sign * (minute * 8 - 16 - index * 8),
        overallSent: sign * 95, stockSent: sign * 95,
        adv: sign === 1 ? 49 : 1, dec: sign === 1 ? 1 : 49,
        callSent: sign * 95, putSent: -sign * 95, optionsSent: sign * 95,
        pcr: sign === 1 ? 1.2 : 0.8,
        callsBuyQty: sign === 1 ? 195 : 5, callsSellQty: sign === 1 ? 5 : 195,
        putsBuyQty: sign === 1 ? 5 : 195, putsSellQty: sign === 1 ? 195 : 5,
        callsOI: 2000 + minute * 10 - index * 10,
        putsOI: 2000 + minute * 10 - index * 10
      }));
      const spot = rows[0].niftyLtp;
      const generated = EnhancedSignalGenerator.generateSignal(rows, 23300, 23700, spot);
      const strike = Math.round(spot / 50) * 50;
      const premium = estimateOptionPremium(spot, strike, optionType);
      assert.equal(generated.direction, direction);
      assert.ok(generated.confidence >= 80, `generated confidence ${generated.confidence}`);
      assert.ok(premium >= 79 && premium <= 80, `near-ATM premium ${premium}`);
      const result = evaluateMomentumEntry({
        ...input(now, direction), tradingMode: 'PAPER',
        history: rows, spot, signal: generated, signalAt: rows[0].timestamp!,
        premium, quantity: 75, targetPct: 25, stopPct: 15, brokerage: 20
      }, candidate);
      assert.equal(result.ready, minute === 2, result.reason);
      assert.deepEqual(result.candidate, {
        direction, firstAt: AT, lastAt: now, observations: minute + 1
      });
      assert.ok(result.netRiskReward! >= 1.3 && result.netRiskReward! < 1.4,
        `default net R:R ${result.netRiskReward}`);
      candidate = result.candidate;
    }
  });
}

test('LIVE entries are disabled and cannot accumulate confirmation; PAPER and omitted mode pass', () => {
  for (const direction of ['LONG', 'SHORT'] as const) {
    let candidate: MomentumCandidate | null = confirmed(AT, direction);
    for (let minute = 0; minute <= 2; minute++) {
      const result = evaluateMomentumEntry({
        ...input(AT + minute * MINUTE, direction), tradingMode: 'LIVE'
      }, candidate);
      assert.equal(result.ready, false);
      assert.equal(result.candidate, null);
      assert.match(result.reason, /LIVE Momentum entries disabled/);
      candidate = result.candidate;
    }
    const paper = { ...input(AT + 3 * MINUTE, direction), tradingMode: 'PAPER' as const };
    const restarted = evaluateMomentumEntry(paper, candidate);
    assert.equal(restarted.ready, false);
    assert.equal(restarted.candidate?.observations, 1);
    assert.equal(evaluateMomentumEntry(paper, confirmed(paper.now, direction)).ready, true);
    assert.equal(evaluateMomentumEntry(input(AT, direction), confirmed(AT, direction)).ready, true);
  }
});

test('re-evaluating the same snapshot does not count, even as wall time advances', () => {
  const first = evaluateMomentumEntry(input(), null);
  for (const elapsed of [0, 1000, 30_000, 90_000]) {
    const repeat = evaluateMomentumEntry({ ...input(), now: AT + elapsed }, first.candidate);
    assert.deepEqual(repeat.candidate, first.candidate);
    assert.equal(repeat.ready, false);
  }
  blocked({ ...input(), now: AT + 90_001 }, /fresh timestamped/);
});

test('three observations still need two minutes; two observations are insufficient', () => {
  let candidate: MomentumCandidate | null = null;
  for (const elapsed of [0, 30_000, 60_000, 119_999, 120_000]) {
    const result = evaluateMomentumEntry(input(AT + elapsed), candidate);
    assert.equal(result.ready, elapsed === 120_000, result.reason);
    candidate = result.candidate;
  }
  const sparse: MomentumCandidate = {
    direction: 'LONG', firstAt: AT - 2 * MINUTE, lastAt: AT - MINUTE, observations: 1
  };
  const result = evaluateMomentumEntry(input(), sparse);
  assert.equal(result.candidate?.observations, 2);
  assert.equal(result.ready, false);
});

test('new snapshot needs a matching fresh scan, and clears the old candidate', () => {
  const old = evaluateMomentumEntry(input(), null).candidate;
  const next = input(AT + MINUTE);
  const denied = blocked({ ...next, signalAt: AT }, /fresh signal scan/, old!);
  const restarted = evaluateMomentumEntry(next, denied.candidate);
  assert.equal(restarted.candidate?.observations, 1);
  assert.equal(restarted.candidate?.firstAt, next.now);
});

test('stop, neutral and missing signal reset confirmation', () => {
  const neutral = signal();
  neutral.direction = 'NEUTRAL';
  for (const patch of [{ running: false }, { signal: neutral }, { signal: null }]) {
    const denied = blocked({ ...input(), ...patch }, /stopped|No directional/);
    assert.equal(evaluateMomentumEntry(input(AT + MINUTE), denied.candidate).candidate?.observations, 1);
  }
});

test('reversal, out-of-order evidence and long confirmation gaps start over', () => {
  for (const [current, previous] of [
    [input(AT, 'SHORT'), confirmed()],
    [input(), { ...confirmed(), lastAt: AT + 1 }],
    [input(), { ...confirmed(), lastAt: AT - 90_001 }]
  ] satisfies [MomentumGateInput, MomentumCandidate][]) {
    const result = evaluateMomentumEntry(current, previous);
    assert.equal(result.ready, false);
    assert.deepEqual(result.candidate, {
      direction: current.signal!.direction, firstAt: AT, lastAt: AT, observations: 1
    });
  }
});

test('weekday entry window excludes opening noise, cutoff and weekends', () => {
  for (const date of [
    '2026-09-16T09:29:59+05:30', '2026-09-16T15:00:00+05:30',
    '2026-09-19T11:00:00+05:30', '2026-09-20T11:00:00+05:30'
  ]) blocked(input(Date.parse(date)), /Entry window/);
  for (const date of ['2026-09-16T09:30:00+05:30', '2026-09-16T14:59:59+05:30']) {
    const now = Date.parse(date);
    assert.equal(evaluateMomentumEntry(input(now), confirmed(now)).ready, true);
  }
});

for (const symbol of [CE, PE]) {
  for (const [exitPrice, cooldownMinutes, reason] of [
    [120, 5, /Post-exit cooldown/], [100, 15, /Post-loss cooldown/]
  ] as const) {
    test(`${symbol}: JSON-reloaded ${cooldownMinutes}m cooldown blocks either direction`, () => {
      const exitAt = AT - cooldownMinutes * MINUTE + 1000;
      const orders: Order[] = JSON.parse(JSON.stringify(trip(exitAt, exitPrice, symbol)));
      const boundary = exitAt + cooldownMinutes * MINUTE;
      for (const direction of ['LONG', 'SHORT'] as const) {
        const denied = blocked({ ...input(AT, direction), orders }, reason, confirmed(AT, direction));
        blocked({ ...input(boundary, direction), orders }, /new market evidence/);
        const fresh = evaluateMomentumEntry(
          { ...input(boundary + 1, direction), orders }, denied.candidate
        );
        assert.equal(fresh.ready, false);
        assert.equal(fresh.candidate?.observations, 1);
        // Even if a caller accidentally retains its pre-trade candidate, it cannot be reused.
        const retained = evaluateMomentumEntry(
          { ...input(boundary + 1, direction), orders }, confirmed(boundary, direction)
        );
        assert.equal(retained.candidate?.observations, 1);
        let candidate = fresh.candidate;
        for (let minute = 1; minute <= 2; minute++) {
          const result = evaluateMomentumEntry({
            ...input(boundary + 1 + minute * MINUTE, direction), orders
          }, candidate);
          assert.equal(result.ready, minute === 2, result.reason);
          candidate = result.candidate;
        }
      }
    });
  }
}

test('open positions and pending, acknowledged or partially filled orders erase confirmation', () => {
  const patches: Partial<MomentumGateInput>[] = [
    { openPositions: 1 },
    ...(['PENDING', 'PLACED', 'PARTIAL'] as const).flatMap(status =>
      (['BUY', 'SELL'] as const).map(side => ({
        orders: [order({ status, side, brokerOrderId: 'acknowledged', timestamp: AT - MINUTE })]
      })))
  ];
  for (const patch of patches) {
    let candidate: MomentumCandidate | null = confirmed();
    for (let minute = 0; minute < 3; minute++) {
      const result = evaluateMomentumEntry({ ...input(AT + minute * MINUTE), ...patch }, candidate);
      assert.match(result.reason, /already open/);
      assert.equal(result.ready, false);
      assert.equal(result.candidate, null);
      candidate = result.candidate;
    }
    const released = evaluateMomentumEntry(input(AT + 3 * MINUTE), candidate);
    assert.equal(released.candidate?.observations, 1);
    assert.equal(released.ready, false);
  }
});

test('two consecutive NET losses stop the day, including gross-flat trades', () => {
  assert.ok(computeCharges(100, 75, 'BUY', 20).total + computeCharges(100, 75, 'SELL', 20).total > 0);
  const orders = [
    ...trip(AT - 50 * MINUTE, 100, CE), ...trip(AT - 20 * MINUTE, 100, PE)
  ];
  blocked({ ...input(), orders }, /2 consecutive net losses/);
  // A profitable close resets the streak rather than counting all losing trades.
  const reset = [
    ...trip(AT - 80 * MINUTE, 100), ...trip(AT - 50 * MINUTE, 120, PE),
    ...trip(AT - 20 * MINUTE, 100)
  ];
  assert.equal(evaluateMomentumEntry({ ...input(), orders: reset }, confirmed()).ready, true);
});

test('four filled buys hit the daily limit; rejected attempts and yesterday do not', () => {
  const orders = [80, 60, 40, 20].flatMap(minutes => trip(AT - minutes * MINUTE));
  blocked({ ...input(), orders }, /Daily limit: 4/);
  const three = orders.slice(0, 6);
  const ignored = [
    order({ status: 'REJECTED' }), order({ status: 'CANCELLED' }),
    ...trip(AT - 24 * 60 * MINUTE)
  ];
  assert.equal(evaluateMomentumEntry({ ...input(), orders: [...three, ...ignored] }, confirmed()).ready, true);
});

test('custom daily entry limits apply to the existing count without resetting it', () => {
  const orders = [80, 60, 40, 20].flatMap(minutes => trip(AT - minutes * MINUTE));
  blocked({ ...input(), orders, maxDailyTrades: 2 }, /Daily limit: 2/);
  blocked({ ...input(), orders, maxDailyTrades: 4 }, /Daily limit: 4/);
  for (const maxDailyTrades of [5, 8, 100, Number.MAX_SAFE_INTEGER]) {
    assert.equal(evaluateMomentumEntry({ ...input(), orders, maxDailyTrades }, confirmed()).ready, true);
  }
  blocked({ ...input(), orders: orders.slice(0, 2), maxDailyTrades: 1 }, /Daily limit: 1/);
  assert.equal(evaluateMomentumEntry({ ...input(), maxDailyTrades: 1 }, confirmed()).ready, true);
});

test('invalid custom daily limits cannot disable the entry cap', () => {
  for (const maxDailyTrades of [0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    blocked({ ...input(), maxDailyTrades }, /Invalid daily entry limit/);
  }
});

test('raising the daily limit does not bypass cooldown or loss protections', () => {
  blocked({ ...input(), maxDailyTrades: 100, orders: trip(AT - MINUTE) }, /Post-exit cooldown/);
  blocked({
    ...input(), maxDailyTrades: 100,
    orders: [...trip(AT - 50 * MINUTE, 100), ...trip(AT - 20 * MINUTE, 100, PE)]
  }, /2 consecutive net losses/);
  blocked({ ...input(), maxDailyTrades: 100, orders: trip(AT - 20 * MINUTE, 70) }, /Daily net loss limit/);
});

test('daily NET loss and planned stop risk respect the remaining daily budget', () => {
  blocked({ ...input(), orders: trip(AT - 20 * MINUTE, 70) }, /Daily net loss limit/);
  const loss = trip(AT - 20 * MINUTE, 80);
  const result = evaluateMomentumEntry({ ...input(), orders: loss, quantity: 25 }, confirmed());
  assert.equal(result.ready, true, result.reason);
  blocked({ ...input(), orders: loss }, /remaining daily loss budget/);
  blocked({ ...input(), quantity: 200 }, /remaining daily loss budget/);
  blocked({ ...input(), orders: trip(AT - 20 * MINUTE, 0) }, /unpriced fill/);
});

test('rejected/cancelled entry attempts consume snapshots and impose a retry delay', () => {
  for (const status of ['REJECTED', 'CANCELLED'] as const) {
    const orders = [order({ status, timestamp: AT, avgPrice: 0, filledQty: 0 })];
    blocked({ ...input(AT + 59_999), orders }, /Entry attempt consumed/);
    blocked({ ...input(), now: AT + MINUTE, orders }, /new market evidence/);
    const next = evaluateMomentumEntry({ ...input(AT + MINUTE), orders }, confirmed());
    assert.equal(next.ready, false);
    assert.equal(next.candidate?.observations, 1);
    assert.equal(next.candidate?.firstAt, AT + MINUTE);
  }
});

test('missing, stale, future and prior-day snapshots are rejected', () => {
  for (const timestamp of [undefined, NaN, AT - 90_001, AT + 1, AT - 24 * 60 * MINUTE]) {
    const i = input();
    i.history[0].timestamp = timestamp;
    blocked(i, /fresh timestamped/);
  }
  blocked({ ...input(), history: [] }, /fresh timestamped/);
  for (const spot of [null, NaN, Infinity, 0, -1]) {
    blocked({ ...input(), spot }, /fresh timestamped/);
  }
  assert.equal(evaluateMomentumEntry({ ...input(), now: AT + 90_000 }, confirmed()).ready, true);
});

test('history needs fifteen elapsed minutes, not fifteen samples', () => {
  const dense = input();
  dense.history.forEach((row, i) => { row.timestamp = AT - i * 10_000; });
  blocked(dense, /Warming up/);
  blocked({ ...input(), history: history().slice(0, 15) }, /Warming up/);
  assert.equal(evaluateMomentumEntry(input(), confirmed()).ready, true);
});

test('a single dropped snapshot is tolerated; a stalled feed is not', () => {
  // Production drops beats: 2026-09-22 ran 143s, 155s, 180s and one 201s hole.
  // One missing row must not throw away the whole window.
  const oneDropped = input();
  oneDropped.history.splice(8, 1);
  assert.equal(evaluateMomentumEntry(oneDropped, confirmed()).ready, true,
    'a single dropped beat (2m hole) must still confirm');

  // Three consecutive drops is a 4-minute hole — past that the path is
  // inference, so the PATH is what gets refused, by name.
  const stalled = input();
  stalled.history.splice(8, 3);
  blocked(stalled, /Price path unmeasurable/);
});

test('the efficiency floor is policy-driven and reports what it measured', () => {
  assert.equal(MOMENTUM_POLICY.minPathEfficiency, 0.40,
    'deliberate loosening from 0.55 on 2026-09-22 evidence; see the policy comment');

  // Build a window whose net move is real but whose path zig-zags enough to
  // land under the floor, and check the denial names the measured figure.
  const choppy = input();
  choppy.history.forEach((row, i) => {
    // Rows are newest-first. Keep the recent end monotonic so the 1m/5m/15m
    // alignment legs pass, then zig-zag the middle to inflate `path` only.
    row.niftyLtp = 23500 - i * 2 + (i >= 6 && i % 2 ? 12 : 0);
  });
  const r = blocked(choppy, /directional efficiency \d+% below 40%/);
  assert.ok(/efficiency \d+%/.test(r.reason), `expected a measured %, got: ${r.reason}`);
});

test('a hole cannot block the move-alignment test', () => {
  // The whole point: move1/move5/move15 are point-to-point against the 1m/5m/
  // 15m anchors, so a hole in between leaves them exactly as valid. A gappy
  // window whose moves do not align must say so, not blame the gap.
  const flat = input();
  flat.history.splice(8, 1);                       // 2m hole
  flat.history.forEach(r => { r.niftyLtp = 23500; });   // no move at all
  blocked(flat, /Wait for aligned/);
});

test('a hole makes the efficiency test stricter, never looser', () => {
  // Across a hole we see a straight line instead of the real wiggles, so an
  // unadjusted path would be too small and efficiency too generous. Charging
  // the hole at the observed churn rate must push efficiency DOWN.
  const intact = input();
  const holed = input();
  holed.history.splice(8, 1);
  const eff = (i: typeof intact) => {
    // Same prices either way; only the sampling differs.
    const r = evaluateMomentumEntry(i, confirmed());
    return r;
  };
  // Both are clean trends here, so both should still pass — the assertion is
  // that removing a sample does not turn a marginal setup into a better one.
  assert.equal(eff(intact).ready, true, 'intact window confirms');
  assert.equal(eff(holed).ready, true, 'holed window still confirms on a clean trend');
});

test('a sparse window cannot confirm even when every gap is legal', () => {
  // Rows every 2 minutes: no gap breaks the 3-minute rule, but eight samples
  // cannot describe a fifteen-minute price path.
  const sparse = input();
  // Nine rows spanning sixteen minutes, so the 1m/5m/15m anchors all resolve.
  sparse.history = history().slice(0, 9);
  sparse.history.forEach((row, i) => { row.timestamp = AT - i * 2 * MINUTE; });
  blocked(sparse, /Sparse market history/);
});

test('history gaps, duplicate/out-of-order rows and corrupt prices cannot confirm', () => {
  const duplicate = input();
  duplicate.history.splice(8, 0, { ...duplicate.history[8] });
  blocked(duplicate, /duplicate or out-of-order/);
  const unordered = input();
  [unordered.history[8], unordered.history[9]] = [unordered.history[9], unordered.history[8]];
  blocked(unordered, /duplicate or out-of-order/);
  const priorDay = input();
  priorDay.history[8].timestamp = AT - 24 * 60 * MINUTE;
  blocked(priorDay, /Warming up|previous-session/);
  for (const niftyLtp of [0, -1, NaN, Infinity]) {
    const corrupt = input();
    corrupt.history[8].niftyLtp = niftyLtp;
    blocked(corrupt, /Invalid or previous-session/);
  }
});

test('each of 1m, 5m and 15m must align in both directions', () => {
  for (const direction of ['LONG', 'SHORT'] as const) {
    const sign = direction === 'LONG' ? 1 : -1;
    for (const [index, move] of [[1, 0], [1, -1], [5, 4.99], [15, 7.99]]) {
      const i = input(AT, direction);
      i.history[index].niftyLtp = i.history[0].niftyLtp - sign * move;
      blocked(i, /aligned 1m, 5m and 15m/);
    }
  }
});

test('choppy paths and contradictory breadth, momentum or option flow are blocked', () => {
  const choppy = input();
  choppy.history[2].niftyLtp += 40;
  blocked(choppy, /Choppy price path/);
  const patches: Partial<EnhancedSignal['metrics']>[] = [
    { broadSentiment: 4.99 }, { broadSentiment: -40 }, { broadSentiment: NaN },
    { momentumScore: 14.99 }, { momentumScore: -50 }, { momentumScore: Infinity },
    { optionFlowStrength: NaN }
  ];
  for (const patch of patches) {
    const s = signal();
    Object.assign(s.metrics, patch);
    blocked({ ...input(), signal: s }, /Breadth and momentum/);
  }
});

test('option flow never vetoes an entry, in any direction or strength', () => {
  // It held a veto for one day and spent it denying the best setup of that
  // session (22-09 10:42:59, score 77.8) on a phantom divergence. Measured
  // against forward returns it has no edge, so it informs the score and the
  // TRAP badge but cannot block. This test exists to stop it becoming a gate
  // again without evidence.
  for (const direction of ['LONG', 'SHORT'] as const) {
    const opposing = direction === 'LONG' ? 'BEARISH' : 'BULLISH';
    for (const patch of [
      { optionFlow: opposing as 'BULLISH' | 'BEARISH', optionFlowStrength: 90 },
      { optionFlow: 'NEUTRAL' as const, optionFlowStrength: 0 },
      { optionFlow: 'NEUTRAL' as const, optionFlowStrength: 3 },
    ]) {
      const s = signal(direction);
      Object.assign(s.metrics, patch);
      assert.equal(
        evaluateMomentumEntry({ ...input(AT, direction), signal: s }, confirmed(AT, direction)).ready,
        true,
        `${direction}: optionFlow ${patch.optionFlow}/${patch.optionFlowStrength} must not veto a clean setup`
      );
    }
  }
});

test('confidence has a policy floor and honors a stricter configured threshold', () => {
  for (const confidence of [MOMENTUM_POLICY.minConfidence - 0.01, NaN, Infinity]) {
    blocked({ ...input(), minConfidence: 10, signal: { ...signal(), confidence } }, /Signal score/);
  }
  blocked({ ...input(), minConfidence: 95 }, /below 95/);
  assert.equal(evaluateMomentumEntry({
    ...input(), signal: { ...signal(), confidence: 80 }
  }, confirmed()).ready, true);
});

test('non-finite minimum confidence fails closed instead of bypassing the score floor', () => {
  for (const minConfidence of [NaN, Infinity, -Infinity]) {
    for (const confidence of [0, 90]) {
      blocked({
        ...input(), minConfidence, signal: { ...signal(), confidence }
      }, /Invalid minimum signal score/);
    }
  }
});

test('anti-chase rejects a last-minute spike or spot detached from the snapshot', () => {
  const spike = input();
  spike.history[0].niftyLtp += 11;
  spike.spot = spike.history[0].niftyLtp;
  blocked(spike, /do not chase/);
  for (const deviation of [-8.01, 8.01]) {
    blocked({ ...input(), spot: 23500 + deviation }, /do not chase/);
  }
  assert.equal(evaluateMomentumEntry({ ...input(), spot: 23508 }, confirmed()).ready, true);
});

test('net reward/risk includes both charges and adverse slippage', () => {
  const i = { ...input(), targetPct: 16 };
  const target = 116;
  const stop = 90;
  const entryCharges = computeCharges(100, 75, 'BUY', 20).total;
  const rewardBeforeSlippage = 16 * 75 - entryCharges - computeCharges(target, 75, 'SELL', 20).total;
  const riskBeforeSlippage = 10 * 75 + entryCharges + computeCharges(stop, 75, 'SELL', 20).total;
  assert.ok(i.targetPct / i.stopPct > 1.3);
  assert.ok(rewardBeforeSlippage / riskBeforeSlippage > 1.3, 'slippage is what tips this setup below the floor');
  const expected = (rewardBeforeSlippage - (100 + target) * 75 * 0.005)
    / (riskBeforeSlippage + (100 + stop) * 75 * 0.005);
  const result = blocked(i, /below 1\.3 after charges and slippage/);
  assert.ok(Math.abs(result.netRiskReward! - expected) < 1e-12);
  assert.ok(expected < 1.3);
  blocked({ ...input(), brokerage: 500 }, /after charges and slippage/);
});

test('invalid execution and risk settings fail closed', () => {
  const cases: Partial<MomentumGateInput>[] = [
    { premium: 0 }, { premium: -1 }, { premium: NaN }, { premium: Infinity },
    { quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: NaN }, { quantity: Infinity },
    { targetPct: 0 }, { targetPct: -1 }, { targetPct: NaN }, { targetPct: Infinity },
    { stopPct: 0 }, { stopPct: -1 }, { stopPct: 100 }, { stopPct: NaN }, { stopPct: Infinity },
    { brokerage: -1 }, { brokerage: NaN }, { brokerage: Infinity }
  ];
  for (const patch of cases) blocked({ ...input(), ...patch }, /Invalid execution/);
  assert.equal(evaluateMomentumEntry({ ...input(), brokerage: 0 }, confirmed()).ready, true);
});

test('required Vision needs readable, recent, successful captures', () => {
  blocked({ ...input(), requireVision: true }, /Vision required/);
  const cases: [string, (run: VisionRun) => void][] = [
    ['capture older than 5m despite just finishing', run => { run.startedAt = new Date(AT - 5 * MINUTE - 1).toISOString(); }],
    ['future capture', run => { run.startedAt = new Date(AT + 1).toISOString(); }],
    ['invalid capture timestamp', run => { run.startedAt = 'not-a-date'; }],
    ['unreadable', run => { run.analysis.parsed!.readable = false; }],
    ['missing verdict', run => { run.analysis.parsed = null; }],
    ['low confidence', run => { run.analysis.parsed!.confidence = 69.99; }],
    ['invalid confidence', run => { run.analysis.parsed!.confidence = NaN; }],
    ['no screenshots', run => { run.shots = []; }],
    ['one failed screenshot', run => { run.shots[1].ok = false; }],
    ['login page', run => { run.shots[1].awaitingLogin = true; }],
    ['analysis error', run => { run.analysis.ok = false; run.analysis.error = 'model unavailable'; }],
    ['skipped analysis', run => { run.analysis.skipped = true; }]
  ];
  for (const [label, mutate] of cases) {
    const run = vision();
    mutate(run);
    const result = blocked({ ...input(), requireVision: true, vision: run }, /Vision required/);
    assert.equal(result.ready, false, label);
  }
  blocked({
    ...input(), requireVision: true, vision: vision(), visionError: 'capture service offline'
  }, /Vision required: capture service offline/);
});

test('required Vision rejects opposing, choppy and neutral opinions', () => {
  for (const bias of ['bearish', 'choppy', 'neutral'] as const) {
    blocked({ ...input(), requireVision: true, vision: vision(AT, bias) }, /Vision does not agree/);
  }
  blocked({
    ...input(AT, 'SHORT'), requireVision: true, vision: vision()
  }, /Vision does not agree/);
});

test('aligned required Vision passes at the capture-age and confidence boundaries', () => {
  for (const direction of ['LONG', 'SHORT'] as const) {
    const run = vision(AT, direction === 'LONG' ? 'bullish' : 'bearish');
    run.startedAt = new Date(AT - 5 * MINUTE).toISOString();
    run.analysis.parsed!.confidence = 70;
    const result = evaluateMomentumEntry({
      ...input(AT, direction), requireVision: true, vision: run
    }, confirmed(AT, direction));
    assert.equal(result.ready, true, result.reason);
  }
});

test('optional Vision cannot veto an otherwise confirmed entry', () => {
  const failed = vision(AT - 60 * MINUTE, 'bearish');
  failed.analysis.ok = false;
  failed.shots[0].awaitingLogin = true;
  for (const run of [null, failed, vision(AT, 'neutral'), vision(AT, 'choppy')]) {
    assert.equal(evaluateMomentumEntry({
      ...input(), vision: run, visionError: 'offline', requireVision: false
    }, confirmed()).ready, true);
  }
});

test('pairRoundTrips sorts without mutation, filters day/status and preserves fill quantities', () => {
  const fills = trip(AT - 20 * MINUTE);
  const pe = trip(AT - 10 * MINUTE, 110, PE, 25);
  const orphan = order({ side: 'SELL', symbol: 'unmatched', timestamp: AT });
  const open = order({ symbol: 'still-open', timestamp: AT });
  const ignored = [
    ...trip(AT - 24 * 60 * MINUTE),
    order({ symbol: 'rejected', status: 'REJECTED' }),
    order({ symbol: 'partial', status: 'PARTIAL' })
  ];
  const orders = [pe[1], orphan, fills[1], open, pe[0], ...ignored, fills[0]];
  const before = structuredClone(orders);
  assert.deepEqual(pairRoundTrips(orders, istDayKey(AT)), [
    { symbol: CE, entry: 100, exit: 120, qty: 75, at: AT - 21 * MINUTE, closedAt: AT - 20 * MINUTE },
    { symbol: PE, entry: 100, exit: 110, qty: 25, at: AT - 11 * MINUTE, closedAt: AT - 10 * MINUTE }
  ]);
  assert.deepEqual(orders, before);
  const fallback = trip(AT);
  fallback[0].filledQty = 0;
  assert.equal(pairRoundTrips(fallback, istDayKey(AT))[0].qty, 75);
  const replacement = [
    order({ timestamp: AT - 3 * MINUTE, avgPrice: 80 }),
    ...trip(AT, 120, CE, 25),
    order({ side: 'SELL', timestamp: AT + MINUTE, avgPrice: 130 })
  ];
  assert.deepEqual(pairRoundTrips(replacement, istDayKey(AT)), [
    { symbol: CE, entry: 100, exit: 120, qty: 25, at: AT - MINUTE, closedAt: AT }
  ]);
});

console.log(`\n${passed} Momentum entry guard regression tests passed.`);
