/**
 * The reframe path: what happens when the morning's direction is wrong.
 *
 * This is a regression test for a real session. The plan leaned long, the tape
 * opened against it with negative breadth and call writing, and the risk
 * officer answered BLOCK at 09:26 — ending a day that still had nineteen
 * minutes of entry window and a perfectly tradable fade at resistance in it.
 * The evidence was correct; spending it on the whole day was not.
 */
import assert from 'node:assert';
import {
  LiveReviewInput, allowedDirectionOf, needsFreshVerdict, parseLiveVerdict, VERDICT_TTL_MS
} from '../services/sniperReview';
import { OpeningRange, evaluate } from '../services/sniperEngine';
import { LiveThesis } from '../services/sniperReconcile';
import { SNIPER } from '../services/sniperPlaybook';

const AT = Date.UTC(2026, 0, 15, 4, 0); // 09:30 IST — inside the entry window

const thesis: LiveThesis = {
  state: 'DRIFTED',
  score: 67,
  support: 23300,
  resistance: 23600,
  levelSource: 'RANGE',
  checks: [],
  adjustments: [],
  confidenceDelta: 3,
  veto: null,
  bias: 'NEUTRAL'
};

const input: LiveReviewInput = {
  now: AT,
  spot: 23450,
  phase: 'ENTRY_WINDOW',
  thesis,
  range: { open: 23420, high: 23500, low: 23398, support: 23300, resistance: 23600, samples: 11 },
  planHeadline: 'GO — setup is clean',
  planReason: 'bullish bias',
  signalDirection: 'SHORT',
  signalConfidence: 78,
  signalReasons: [],
  breadth: -34,
  pcr: 0.7,
  optionsSent: -40,
  drift: 12,
  engineCanEnter: false,
  engineBlocks: ['Price is mid-range'],
  engineSetup: null
};

const parse = (obj: Record<string, unknown>) => parseLiveVerdict(JSON.stringify(obj), input, 'test-model');

// 1. The reported failure: a directional objection must not end the day -------
{
  const v = parse({
    call: 'BLOCK',
    allow: 'SHORT_ONLY',
    reason: 'Negative breadth and bearish options flow contradict the morning bullish bias.',
    read: 'Sellers in control but price is respecting the walls.',
    waitFor: 'price back at 23,600 with breadth still red',
    confidencePenalty: -8
  });

  // The model named a side that still works, so it described a reframe.
  assert.equal(v.call, 'REFRAME');
  assert.equal(v.allow, 'SHORT_ONLY');
  assert.equal(allowedDirectionOf(v), 'SHORT');
  assert.ok(v.confidencePenalty > -100, 'a reframe must not carry a day-killing penalty');
  assert.ok(v.confidencePenalty <= 0 && v.confidencePenalty >= -10);
  assert.match(v.waitFor, /23,600/);

  // A REFRAME in the model's own words needs no rescuing.
  const direct = parse({ call: 'REFRAME', allow: 'SHORT_ONLY', reason: 'tape is heavy', confidencePenalty: 0 });
  assert.equal(direct.call, 'REFRAME');
  assert.equal(allowedDirectionOf(direct), 'SHORT');
}

// 1b. But a BLOCK is only downgraded when the model is internally consistent --
{
  // -100 is the block sentinel: the model meant the day, whatever `allow` says.
  const sentinel = parse({ call: 'BLOCK', allow: 'LONG_ONLY', reason: 'feed cannot be trusted', confidencePenalty: -100 });
  assert.equal(sentinel.call, 'BLOCK', 'a fully-formed BLOCK is never talked down into a trade');
  assert.equal(sentinel.allow, 'NONE');
  assert.equal(allowedDirectionOf(sentinel), null);

  // `side` is not a field this desk defines; a model may use it to name the
  // direction it is objecting TO, so it must not dissolve a veto on its own.
  const alias = parse({ call: 'BLOCK', side: 'LONG', reason: 'range built from 3 ticks' });
  assert.equal(alias.call, 'BLOCK', 'the loose alias cannot reopen a blocked day');
  assert.equal(alias.allow, 'NONE');
}

// 2. A reframe with no side is only a trim; a genuine BLOCK still blocks ------
{
  const soft = parse({ call: 'REFRAME', allow: 'BOTH', reason: 'thin, but both sides stand', confidencePenalty: -8 });
  assert.equal(soft.call, 'TRIM');
  assert.equal(soft.allow, 'BOTH');
  assert.equal(allowedDirectionOf(soft), null);
  assert.equal(soft.confidencePenalty, -8);

  const hard = parse({ call: 'BLOCK', allow: 'NONE', reason: 'zone is 40 pts, no room for the target' });
  assert.equal(hard.call, 'BLOCK');
  assert.equal(hard.allow, 'NONE');
  assert.equal(hard.confidencePenalty, -100);
  assert.equal(hard.waitFor, '', 'only a reframe carries a trigger');

  const clean = parse({ call: 'PROCEED', allow: 'BOTH', reason: 'no objection', confidencePenalty: -40 });
  assert.equal(clean.confidencePenalty, 0, 'PROCEED can never carry a penalty');

  const trim = parse({ call: 'TRIM', allow: 'BOTH', reason: 'thin', confidencePenalty: 60 });
  assert.equal(trim.confidencePenalty, -15, 'a positive penalty is still a penalty, and it is clamped');
}

// 3. An opinion is re-asked when it stops fitting — but never lifted by a clock
{
  const v = parse({ call: 'REFRAME', allow: 'SHORT_ONLY', reason: 'bearish tape', confidencePenalty: 0 });
  assert.equal(needsFreshVerdict(v, 23450, AT + 60_000), false);
  assert.equal(needsFreshVerdict(v, 23450, AT + VERDICT_TTL_MS), true, 'ages out');
  assert.equal(
    needsFreshVerdict(v, 23450 + SNIPER.zoneBuffer + 1, AT + 1000),
    true,
    'a full arm band away is a different setup'
  );
  assert.equal(needsFreshVerdict(null, 23450, AT), true, 'no opinion yet always wants one');
}

// 4. The engine trades the surviving side and refuses only the closed one -----
{
  const range: OpeningRange = {
    high: 23500, low: 23398, open: 23420,
    support: 23300, resistance: 23600,
    openType: 'GAP_DOWN', samples: 11, lockedAt: AT
  };
  const base = {
    now: new Date(AT),
    range,
    signalConfidence: 82,
    signalReasons: [],
    hasOpenPosition: false,
    dailyTradeDone: false,
    expiry: '26115'
  };
  const restricted = {
    support: 23300, resistance: 23600, confidenceDelta: 0, veto: null, state: 'DRIFTED',
    allowedDirection: 'SHORT' as const, allowedReason: 'breadth and flow are against the long'
  };

  // Price at the closed wall: blocked, but as a side restriction, not a veto.
  const atSupport = evaluate({ ...base, spot: 23310, signalDirection: 'LONG', thesis: restricted });
  assert.equal(atSupport.zone, 'NEAR_SUPPORT');
  assert.equal(atSupport.canEnter, false);
  assert.equal(atSupport.restrictedTo, 'SHORT');
  assert.ok(atSupport.blocks.some(b => b.code === 'SIDE_RESTRICTED'));
  assert.ok(atSupport.blocks.every(b => b.code !== 'THESIS'), 'a reframe is not a veto');

  // Price at the surviving wall: the day is still on, exactly as asked.
  const atResistance = evaluate({ ...base, spot: 23590, signalDirection: 'SHORT', thesis: restricted });
  assert.equal(atResistance.zone, 'NEAR_RESISTANCE');
  assert.equal(atResistance.canEnter, true, 'the surviving side must still fire');
  assert.equal(atResistance.setup?.optionType, 'PE');
  assert.equal(atResistance.setup?.direction, 'SHORT');

  // A BLOCK still stops everything, from either wall.
  const vetoed = evaluate({
    ...base, spot: 23590, signalDirection: 'SHORT',
    thesis: { ...restricted, allowedDirection: null, veto: 'Risk officer stood the day down — no room' }
  });
  assert.equal(vetoed.canEnter, false);
  assert.ok(vetoed.blocks.some(b => b.code === 'THESIS'));

  // And with no opinion at all, both sides trade as they always did.
  const open = { ...restricted, allowedDirection: null };
  assert.equal(evaluate({ ...base, spot: 23310, signalDirection: 'LONG', thesis: open }).canEnter, true);
  assert.equal(evaluate({ ...base, spot: 23590, signalDirection: 'SHORT', thesis: open }).canEnter, true);
}

console.log('✅ sniperReframe: a wrong direction narrows the day to one side instead of ending it');
