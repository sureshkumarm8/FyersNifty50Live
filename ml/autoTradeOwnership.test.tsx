/**
 * Guards the per-strategy trade views against the one failure that is invisible
 * in code review: a real day of trading rendering as "no trades closed today".
 *
 * `source` and `strategy` were added after both engines had already been
 * journaling their fills, and those older fills identify their engine only
 * through `tags`. A filter written against the fields alone therefore drops
 * every such trade — the book is intact, the screen just denies it exists,
 * which is far worse than an error because nothing looks broken.
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  belongsToStrategy,
  isAutoTrade,
  ownerStrategy,
  paperTradingEngine
} from '../services/paperTradingService';
import { AutoTag } from '../components/ui/TradeHistoryTable';
import AutoTradeHistory from '../components/autotrade/AutoTradeHistory';

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

/** How the engines journaled before `source`/`strategy` existed: tags only. */
const legacyTags = ['AUTOTRADE', 'MOMENTUM', 'LONG', 'CONF-82'];

async function run() {
  // --- helpers --------------------------------------------------------------
  check(
    'a tags-only trade is recognised as an auto-trade',
    isAutoTrade({ tags: legacyTags })
  );
  check(
    'its owner is read off the tags',
    ownerStrategy({ tags: legacyTags }) === 'MOMENTUM',
    String(ownerStrategy({ tags: legacyTags }))
  );
  check(
    'it belongs to Momentum',
    belongsToStrategy({ tags: legacyTags }, 'MOMENTUM')
  );
  check(
    'and not to the Sniper',
    !belongsToStrategy({ tags: legacyTags }, 'SNIPER')
  );
  check(
    'an explicit field still wins over the tags',
    ownerStrategy({ strategy: 'SNIPER', tags: legacyTags }) === 'SNIPER'
  );
  check(
    'a hand-placed trade is never claimed by an engine',
    !isAutoTrade({ source: 'MANUAL', tags: ['SWING'] }) &&
      !belongsToStrategy({ source: 'MANUAL', tags: ['MOMENTUM'] }, 'MOMENTUM')
  );

  // --- the badge ------------------------------------------------------------
  const badge = renderToString(React.createElement(AutoTag, { tags: legacyTags }));
  check('the row badge names the engine on a legacy trade', badge.includes('MOMENTUM'), badge);
  check(
    'a manual row still gets no badge',
    renderToString(React.createElement(AutoTag, { source: 'MANUAL' })) === ''
  );

  // --- the panel ------------------------------------------------------------
  const SYMBOL = 'NIFTY25O0723500CE';
  await paperTradingEngine.openExternal({
    symbol: SYMBOL,
    displayName: 'NIFTY 23500 CE',
    strike: 23500,
    optionType: 'CE',
    lots: 1,
    entryPrice: 100,
    spot: 23480,
    strategy: 'MOMENTUM',
    tags: legacyTags,
    entryReason: 'Momentum took LONG at 82% confidence.'
  });
  await paperTradingEngine.closeExternal(SYMBOL, 125, 'TARGET', 23520, 'target +25%');

  // Age it into a pre-`strategy` record, exactly as it sits in a real book.
  const trade = paperTradingEngine.getBook().trades.find((t) => t.symbol === SYMBOL)!;
  check('the trade reached the book', Boolean(trade));
  delete (trade as { source?: string }).source;
  delete (trade as { strategy?: string }).strategy;

  const html = renderToString(
    React.createElement(AutoTradeHistory, { strategy: 'MOMENTUM', tradingMode: 'PAPER' })
  );
  check(
    'the Momentum panel no longer claims nothing closed today',
    !html.includes('No Momentum trades closed today'),
    'the legacy trade was filtered out again'
  );
  check('the panel renders the contract', html.includes('23500'), 'contract missing');
  check('the panel counts it in the win rate', html.includes('Win rate'));

  const sniperHtml = renderToString(
    React.createElement(AutoTradeHistory, { strategy: 'SNIPER', tradingMode: 'PAPER' })
  );
  check(
    'a Momentum trade never leaks into the Sniper panel',
    sniperHtml.includes('No Sniper trades closed today')
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
