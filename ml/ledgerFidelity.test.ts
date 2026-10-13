/**
 * Two ways the ledger disagreed with what the engines actually traded.
 *
 * 1. Quantity was recomputed from the book's own `settings.lotSize` — a manual
 *    trading preference that survives an exchange lot-size change — instead of
 *    the lot size the order filled at. A 75-lot fill was booked as 65, so every
 *    number derived from it was wrong by that ratio while looking plausible.
 *
 * 2. A fill that never reached the ledger stayed missing forever, because the
 *    only write path was the entry itself. The order book still holds both legs
 *    of those trades, so they can be replayed — which is what the Momentum
 *    panel now does on mount, and what the pairing logic here is modelled on.
 */
import { paperTradingEngine } from '../services/paperTradingService';
import { pairRoundTrips, findMissingRoundTrips } from '../components/autotrade/MomentumPanel';
import { istDayKey } from '../services/sniperEngine';
import { OrderManager } from '../services/orderManager';

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

const ENGINE_LOT = 75;

async function run() {
  await paperTradingEngine.load();
  // The stale preference this bug fed on.
  paperTradingEngine.updateSettings({ lotSize: 65 });

  // --- lot size -------------------------------------------------------------
  const SYMBOL = 'NIFTY26091523300PE';
  const opened = await paperTradingEngine.openExternal({
    symbol: SYMBOL,
    displayName: 'NIFTY 23300 PE',
    strike: 23300,
    optionType: 'PE',
    lots: 1,
    lotSize: ENGINE_LOT,
    entryPrice: 98.6,
    spot: 23310,
    strategy: 'MOMENTUM',
    tags: ['AUTOTRADE', 'MOMENTUM']
  });
  check('the fill is recorded', opened.ok, opened.message);
  check(
    'quantity follows the engine lot size, not the stale book setting',
    opened.position?.quantity === 75,
    `${opened.position?.quantity} qty`
  );

  const closed = await paperTradingEngine.closeExternal(SYMBOL, 103.95, 'TARGET', 23290, 'target');
  check('the exit books', closed.ok, closed.message);
  const trade = paperTradingEngine.getBook().trades.find((t) => t.symbol === SYMBOL)!;
  check('the closed row carries 75 qty', trade.quantity === 75, String(trade.quantity));
  check(
    'P&L is priced on what was actually traded',
    Math.abs(trade.grossPnl - (103.95 - 98.6) * 75) < 0.01,
    String(trade.grossPnl)
  );

  // Without a lot size it still honours the book, so manual trading is untouched.
  const manual = await paperTradingEngine.openExternal({
    symbol: 'NIFTY26091523400CE',
    strike: 23400,
    optionType: 'CE',
    lots: 1,
    entryPrice: 50,
    spot: 23390
  });
  check('no lot size given falls back to the book setting', manual.position?.quantity === 65, String(manual.position?.quantity));

  // --- replaying a fill the ledger never saw --------------------------------
  const ENTRY_AT = Date.now() - 20 * 60_000;
  const EXIT_AT = Date.now() - 12 * 60_000;
  const LOST = 'NIFTY26091523200CE';

  const replayed = await paperTradingEngine.openExternal({
    symbol: LOST,
    displayName: 'NIFTY 23200 CE',
    strike: 23200,
    optionType: 'CE',
    lots: 1,
    lotSize: ENGINE_LOT,
    entryPrice: 80,
    entryTime: ENTRY_AT,
    spot: null,
    strategy: 'MOMENTUM',
    tags: ['AUTOTRADE', 'MOMENTUM', 'RECOVERED']
  });
  check('a recovered entry keeps its original time', replayed.position?.entryTime === ENTRY_AT);

  const replayedExit = await paperTradingEngine.closeExternal(LOST, 92, 'MANUAL', null, 'recovered exit', EXIT_AT);
  check('the recovered exit books', replayedExit.ok, replayedExit.message);
  const lost = paperTradingEngine.getBook().trades.find((t) => t.symbol === LOST)!;
  check('the recovered exit keeps its original time', lost.exitTime === EXIT_AT, String(lost.exitTime));
  check(
    'hold time is the real one, not the time since the replay',
    Math.abs(lost.holdMs - (EXIT_AT - ENTRY_AT)) < 5,
    `${Math.round(lost.holdMs / 60000)}m`
  );
  check('it is attributed to Momentum', lost.strategy === 'MOMENTUM' && lost.source === 'AUTOTRADE');
  check('and marked as recovered', lost.tags?.includes('RECOVERED') === true, String(lost.tags));

  // The reconciler matches with 60s tolerance so latency between order placement
  // and ledger write does not cause duplicate phantom recoveries.
  const matchedMissing = findMissingRoundTrips(
    [{ symbol: LOST, entry: 80, exit: 92, qty: 75, at: ENTRY_AT - 1500, closedAt: EXIT_AT }],
    paperTradingEngine.getBook().trades
  );
  check('trade with 1.5s order latency is recognised as already journaled', matchedMissing.length === 0);

  const trulyMissing = findMissingRoundTrips(
    [{ symbol: 'NIFTY26091523900CE', entry: 50, exit: 60, qty: 75, at: ENTRY_AT, closedAt: EXIT_AT }],
    paperTradingEngine.getBook().trades
  );
  check('a truly missing round trip is identified', trulyMissing.length === 1);

  // --- rebuilding the day from the order book -------------------------------
  const t0 = Date.now() - 60 * 60_000;
  const order = (
    symbol: string,
    side: 'BUY' | 'SELL',
    avgPrice: number,
    minutes: number,
    status: 'FILLED' | 'REJECTED' = 'FILLED'
  ) => ({ symbol, side, status, filledQty: 75, avgPrice, timestamp: t0 + minutes * 60_000 });

  const today = istDayKey(Date.now());
  const trips = pairRoundTrips(
    [
      // Two round trips in the same strike, plus one still open.
      order('NIFTYA', 'BUY', 100, 0),
      order('NIFTYA', 'SELL', 120, 5),
      order('NIFTYA', 'BUY', 110, 10),
      order('NIFTYA', 'SELL', 101, 18),
      order('NIFTYB', 'BUY', 60, 20),
      order('NIFTYC', 'BUY', 70, 22, 'REJECTED'),
      order('NIFTYC', 'SELL', 80, 25, 'REJECTED'),
      // Yesterday's book must not be replayed into today.
      { symbol: 'NIFTYD', side: 'BUY' as const, status: 'FILLED' as const, filledQty: 75, avgPrice: 40, timestamp: t0 - 26 * 60 * 60_000 },
      { symbol: 'NIFTYD', side: 'SELL' as const, status: 'FILLED' as const, filledQty: 75, avgPrice: 45, timestamp: t0 - 25 * 60 * 60_000 }
    ],
    today
  );

  check('both round trips in the same strike are rebuilt', trips.length === 2, `${trips.length} pairs`);
  check('each keeps its own entry and exit', trips[0].entry === 100 && trips[0].exit === 120 && trips[1].entry === 110 && trips[1].exit === 101);
  check('re-entries are told apart by entry time', trips[0].at !== trips[1].at);
  check('an open position is not replayed', !trips.some(t => t.symbol === 'NIFTYB'));
  check('rejected orders are ignored', !trips.some(t => t.symbol === 'NIFTYC'));
  check("another day's trades stay out", !trips.some(t => t.symbol === 'NIFTYD'));
  check(
    'an orphan exit with no entry is skipped',
    pairRoundTrips([order('NIFTYE', 'SELL', 90, 3)], today).length === 0
  );

  // Exercise the exact paper fill reference used by Momentum, then restore the book.
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const saved = new Map<string, string>();
  const storage: Storage = {
    get length() { return saved.size; },
    clear: () => saved.clear(),
    getItem: key => saved.get(key) ?? null,
    key: index => [...saved.keys()][index] ?? null,
    removeItem: key => { saved.delete(key); },
    setItem: (key, value) => { saved.set(key, value); }
  };
  const originalRandom = Math.random;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Math.random = () => 0.5;
  try {
    const credentials = { appId: '', accessToken: '' };
    const manager = new OrderManager(credentials, true, 'test_momentum_paper');
    const buy = await manager.placeOrder('NIFTY_TEST_CE', 'BUY', 75, 'MARKET', undefined, undefined, 80);
    check('Momentum-style paper entry fills at the supplied premium', buy.success);
    manager.updatePositionPnL('NIFTY_TEST_CE', 100);
    const position = manager.getPositions()[0];
    const sell = await manager.placeOrder(
      position.symbol, 'SELL', position.quantity, 'MARKET', undefined, undefined, position.ltp
    );
    check('Momentum-style paper exit closes the position', sell.success && manager.getPositions().length === 0);
    const restored = new OrderManager(credentials, true, 'test_momentum_paper');
    const restoredTrips = pairRoundTrips(restored.getOrders(), today);
    check('reload preserves a priced exit, not a zero-price fill',
      restoredTrips.length === 1 && restoredTrips[0].entry === 80 && restoredTrips[0].exit === 100);
    check('the restored round trip keeps the cooldown timestamp', restoredTrips[0]?.closedAt > 0);

    // --- duplicate pruning and prevention ---
    const DUP_SYM = 'NIFTY26091522500CE';
    const nowTs = Date.now();
    await paperTradingEngine.openExternal({
      symbol: DUP_SYM,
      displayName: 'NIFTY 22500 CE',
      strike: 22500,
      optionType: 'CE',
      lots: 1,
      lotSize: 75,
      entryPrice: 79.4,
      entryTime: nowTs,
      spot: 22500,
      strategy: 'MOMENTUM',
      tags: ['AUTOTRADE', 'MOMENTUM']
    });
    await paperTradingEngine.closeExternal(DUP_SYM, 116.48, 'TARGET', 22550, 'target', nowTs + 600_000);

    // Defense-in-depth: openExternal blocks recovering a trade that is already recorded
    const duplicateAttempt = await paperTradingEngine.openExternal({
      symbol: DUP_SYM,
      displayName: 'NIFTY 22500 CE',
      strike: 22500,
      optionType: 'CE',
      lots: 1,
      lotSize: 75,
      entryPrice: 79.4,
      entryTime: nowTs - 1000,
      spot: null,
      strategy: 'MOMENTUM',
      tags: ['AUTOTRADE', 'MOMENTUM', 'RECOVERED']
    });
    check('openExternal blocks duplicate recovery when fill is already recorded', !duplicateAttempt.ok);

    // Test pruning if a duplicate was previously persisted in the book
    const originalTrade = paperTradingEngine.getBook().trades.find(t => t.symbol === DUP_SYM)!;
    const fakeDuplicate = {
      ...originalTrade,
      id: 'fake-dup-id',
      entryTime: nowTs - 1000,
      exitTime: nowTs + 599_000,
      exitReason: 'MANUAL' as const,
      tags: ['AUTOTRADE', 'MOMENTUM', 'RECOVERED'],
      notes: 'Recovered from the order book',
      maxFavourable: 0,
      maxAdverse: 0
    };
    paperTradingEngine.getBook().trades.push(fakeDuplicate);
    const beforeCount = paperTradingEngine.getBook().trades.length;
    const pruned = paperTradingEngine.pruneDuplicateTrades();
    check('pruneDuplicateTrades identifies and removes the phantom duplicate', pruned);
    check('trade count decreases by 1', paperTradingEngine.getBook().trades.length === beforeCount - 1);
    check('the retained trade is the genuine TARGET exit',
      paperTradingEngine.getBook().trades.find(t => t.symbol === DUP_SYM)?.exitReason === 'TARGET');
  } finally {
    Math.random = originalRandom;
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
