/**
 * What changed in the Opening Pilot book, as journal rows.
 *
 * The pilot book is rewritten whole on every mutation, so the journal events
 * are the difference between the previous and the next book: a new decision,
 * a position opened, a trade closed. Pure, so it can be tested on fixtures.
 */

import type { JournalStream } from './journal';
import { PilotBook } from './openingPilotTypes';

export function pilotJournalEvents(prev: PilotBook, next: PilotBook): Array<{ stream: JournalStream; data: Record<string, any> }> {
  const out: Array<{ stream: JournalStream; data: Record<string, any> }> = [];
  const seenDecisions = new Set(prev.decisions.map(d => d.id));
  for (const d of next.decisions) {
    if (seenDecisions.has(d.id)) continue;
    out.push({
      stream: 'decisions',
      data: { strategy: 'PILOT', action: d.action, reason: d.reason, status: d.assessment.status, setup: d.assessment.setup, at: d.at }
    });
  }

  if (next.position && next.position.id !== prev.position?.id) {
    const p = next.position;
    out.push({
      stream: 'fills',
      data: {
        book: 'pilot', strategy: 'PILOT', symbol: p.symbol, side: 'BUY', quantity: p.quantity, avgPrice: p.entryPremium,
        stopPremium: p.stopPremium, targetPremium: p.targetPremium, override: p.override, reason: p.reason
      }
    });
  }

  const seenTrades = new Set(prev.trades.map(t => t.id));
  for (const t of next.trades) {
    if (seenTrades.has(t.id)) continue;
    out.push({
      stream: 'exits',
      data: {
        book: 'pilot', strategy: 'PILOT', symbol: t.symbol, side: 'SELL', quantity: t.quantity,
        entryPrice: t.entryPremium, exitPrice: t.exitPremium, pnl: Math.round(t.netPnl * 100) / 100,
        reason: t.exitReason, exitNote: t.exitNote ?? null, samplingGap: t.samplingGap
      }
    });
  }
  return out;
}
