/**
 * Verifies that an auto-trade taken by an engine arrives in the ledger with the
 * full record the history views render: strategy, entry rationale, exit
 * rationale, MFE/MAE, charges and net P&L.
 *
 * This is the contract between the engines and both history screens. A missing
 * field here renders as "no rationale recorded", which looks like a UI bug but
 * is actually a lost decision record.
 */
import { paperTradingEngine, PaperTrade } from '../services/paperTradingService';
import { TradeHistoryTable } from '../components/ui/TradeHistoryTable';
import React from 'react';
import { renderToString } from 'react-dom/server';

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

async function run() {
  const SYMBOL = 'NIFTY25O0723200CE';

  const opened = await paperTradingEngine.openExternal({
    symbol: SYMBOL,
    displayName: 'NIFTY 23200 CE',
    strike: 23200,
    optionType: 'CE',
    lots: 2,
    entryPrice: 100,
    spot: 23150,
    strategy: 'SNIPER',
    entryReason: 'Price held support and the overnight thesis read BULLISH.',
    tags: ['AUTOTRADE', 'SNIPER', 'AT-SUPPORT']
  });
  check('openExternal accepts a strategy and rationale', opened.ok, opened.message);

  // Walk the premium up and back down so the high/low-water marks are exercised
  // exactly as a live tick stream would drive them.
  paperTradingEngine.markExternal(SYMBOL, 130);
  paperTradingEngine.markExternal(SYMBOL, 85);
  paperTradingEngine.markExternal(SYMBOL, 120);

  const closed = await paperTradingEngine.closeExternal(
    SYMBOL,
    120,
    'TARGET',
    23210,
    'Exited at ₹120.00 — target +30 hit.'
  );
  check('closeExternal books the trade', closed.ok, closed.message);

  const trade: PaperTrade | undefined = paperTradingEngine.getBook().trades[0];
  check('trade landed in the book', !!trade);
  if (!trade) return;

  check('strategy survives the round trip', trade.strategy === 'SNIPER', String(trade.strategy));
  check('source is AUTOTRADE', trade.source === 'AUTOTRADE', String(trade.source));
  check(
    'entry rationale survives the round trip',
    trade.entryReason?.includes('overnight thesis') === true,
    String(trade.entryReason)
  );
  check(
    'exit rationale survives the round trip',
    trade.exitNote?.includes('target +30') === true,
    String(trade.exitNote)
  );
  check('exit bucket is TARGET', trade.exitReason === 'TARGET', trade.exitReason);
  check('MFE tracks the 130 peak', trade.maxFavourable === 30, String(trade.maxFavourable));
  check('MAE tracks the 85 trough', trade.maxAdverse === -15, String(trade.maxAdverse));
  check('quantity is lots × lot size', trade.quantity === 2 * 75, String(trade.quantity));
  check('gross P&L is (120-100) × 150', trade.grossPnl === 3000, String(trade.grossPnl));
  check('charges are non-zero', trade.charges > 0, String(trade.charges));
  check('net P&L is gross minus charges', Math.abs(trade.netPnl - (trade.grossPnl - trade.charges)) < 0.01);
  check('hold time is recorded', trade.holdMs >= 0, String(trade.holdMs));
  check('tags survive the round trip', trade.tags?.includes('SNIPER') === true, String(trade.tags));

  // A second close of the same contract must not book a phantom trade.
  const again = await paperTradingEngine.closeExternal(SYMBOL, 120, 'TARGET', 23210, 'duplicate');
  check('closing twice is refused', !again.ok, again.message);
  check('book still holds exactly one trade', paperTradingEngine.getBook().trades.length === 1);

  // The table must render the trade without throwing on any optional field.
  const html = renderToString(React.createElement(TradeHistoryTable, { trades: [trade] }));
  check('history table renders the contract', html.includes('23200'));
  check('history table renders the exit bucket', html.includes('TARGET'));
  // SSR inserts a `<!-- -->` marker between a literal and an interpolated value,
  // so the rendered MFE reads "+<!-- -->30.0". Assert on the numbers themselves.
  check('history table renders MFE/MAE', html.includes('30.0') && html.includes('-15.0'));

  // A legacy trade with no rationale at all must degrade gracefully rather than
  // render an empty panel that reads as a bug.
  const legacy = { ...trade, id: 'legacy', entryReason: undefined, exitNote: undefined, strategy: undefined };
  const legacyHtml = renderToString(React.createElement(TradeHistoryTable, { trades: [legacy] }));
  check('legacy trade without rationale still renders', legacyHtml.includes('23200'));

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
