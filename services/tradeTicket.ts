/**
 * PRE-TRADE TICKET - the trader's 5-line checklist as a check that runs itself.
 *
 *   1. Product = MIS          (NRML by mistake on 2026-11-26 and 11-27)
 *   2. Which wall             (room to the next wall must fit the target)
 *   3. Stop = a number        (no stop on 2026-11-26 -> "only hope" at -95 pts)
 *   4. Target beyond entry    (2026-11-26: target 25,800 below a 25,835 LONG entry)
 *   5. Exit on stop, no argument
 *
 * Levels are in Nifty points; premium equivalents use the trader's measured
 * rupees-per-point for the strike (0.70 on 11-26, 0.35 on 11-27 for the same
 * 25750 CE), never a pricing model. It never places an order.
 *
 * Pure module: no React, no I/O.
 */

export type Side = 'LONG' | 'SHORT';
export type Product = 'MIS' | 'NRML';
export type Severity = 'BLOCK' | 'WARN' | 'OK';

export interface TicketInput {
  side: Side;
  product: Product;
  entry: number;
  stop: number | null;
  target: number | null;
  /** Next wall in the trade's path: ceiling for LONG, floor for SHORT. */
  nextWall: number | null;
  /** The wall the trade leans on: floor for LONG, ceiling for SHORT. */
  supportWall: number | null;
  /**
   * OI change at that wall over ~5 min, %. In the 6-day replay (2026-11-19..27)
   * setups at walls whose writers were leaving won 32% (22 signals, -287 pts)
   * against 54% where they were adding. A warning, not a rule: 6 days is thin.
   */
  supportWallOIChangePct?: number | null;
  qty: number;
  /** Option premium change per Nifty point for the chosen strike. */
  premiumPerPoint: number | null;
  premium: number | null;
  /** Round-trip charges, ₹ (about 80-90 on 65 qty in Nov 2026). */
  charges: number;
  tradesToday: number;
  maxTradesPerDay: number;
  /** The system's planned move, Nifty points. */
  plannedPts: number;
}

export interface TicketCheck {
  id: 'product' | 'stop' | 'target' | 'room' | 'rr' | 'wall' | 'daily';
  severity: Severity;
  message: string;
}

export interface TicketResult {
  checks: TicketCheck[];
  /** True when nothing blocks. Warnings still need a conscious "yes". */
  ok: boolean;
  risk: number | null;
  reward: number | null;
  rr: number | null;
  room: number | null;
  /** ₹, net of charges, when premiumPerPoint is known. */
  netIfTarget: number | null;
  netIfStop: number | null;
  /** Premium levels equivalent to the spot stop/target. */
  premiumStop: number | null;
  premiumTarget: number | null;
  /** Win rate needed to break even after charges at this risk/reward. */
  breakEvenWinRate: number | null;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export const DEFAULT_CHARGES = 85;

export function checkTicket(t: TicketInput): TicketResult {
  const sign = t.side === 'LONG' ? 1 : -1;
  const checks: TicketCheck[] = [];
  const add = (id: TicketCheck['id'], severity: Severity, message: string) => checks.push({ id, severity, message });

  add('daily', t.tradesToday >= t.maxTradesPerDay ? 'BLOCK' : 'OK',
    t.tradesToday >= t.maxTradesPerDay
      ? `Day done: ${t.tradesToday}/${t.maxTradesPerDay} trade(s) taken. Your system stops here.`
      : `Trade ${t.tradesToday + 1} of ${t.maxTradesPerDay} today.`);

  add('product', t.product === 'MIS' ? 'OK' : 'WARN',
    t.product === 'MIS' ? 'MIS: auto square-off at 15:20 is your safety net.' : 'NRML: not squared off automatically. Close it yourself; nothing carries overnight.');

  let risk: number | null = null;
  if (t.stop === null || !Number.isFinite(t.stop)) {
    add('stop', 'BLOCK', 'No stop. Write the Nifty level first (e.g. wall - 5).');
  } else if (sign * (t.entry - t.stop) <= 0) {
    add('stop', 'BLOCK', `Stop ${t.stop} is on the wrong side of entry ${t.entry} for a ${t.side}.`);
  } else {
    risk = r1(sign * (t.entry - t.stop));
    const beyondWall = t.supportWall !== null && sign * (t.supportWall - t.stop) > 0;
    add('stop', 'OK', `Stop ${t.stop}: ${risk} pts${beyondWall ? `, beyond the ${t.supportWall} wall` : ''}.`);
  }

  let reward: number | null = null;
  if (t.target === null || !Number.isFinite(t.target)) {
    add('target', 'BLOCK', 'No target. Write the Nifty level (+30 pts, or 5 before the next wall).');
  } else if (sign * (t.target - t.entry) <= 0) {
    add('target', 'BLOCK', `Target ${t.target} is not beyond entry ${t.entry}. The plan does not fit the trade.`);
  } else {
    reward = r1(sign * (t.target - t.entry));
    add('target', reward < t.plannedPts * 0.5 ? 'WARN' : 'OK', `Target ${t.target}: ${reward} pts.`);
  }

  let room: number | null = null;
  if (t.nextWall !== null && Number.isFinite(t.nextWall)) {
    room = r1(sign * (t.nextWall - t.entry));
    if (room <= 0) add('room', 'WARN', `Price is already through the ${t.nextWall} wall.`);
    else if (room < t.plannedPts) add('room', 'WARN', `Only ${room} pts to the ${t.nextWall} wall: under your ${t.plannedPts}-pt rule.`);
    else add('room', 'OK', `${room} pts of room to the ${t.nextWall} wall.`);
    if (t.target !== null && room > 0 && sign * (t.target - t.nextWall) > 0) {
      add('wall', 'WARN', `Target ${t.target} is past the ${t.nextWall} wall. Writers defend walls; consider wall - 5.`);
    }
  } else {
    add('room', 'WARN', 'Next wall unknown. Check Sensibull before entering.');
  }

  if (t.supportWallOIChangePct !== undefined && t.supportWallOIChangePct !== null && t.supportWallOIChangePct <= 0) {
    add('wall', 'WARN', `Writers at the ${t.supportWall ?? ''} wall are leaving (${t.supportWallOIChangePct}%). Undefended walls lost most often in the replay.`);
  }

  const rr = risk && reward ? r1(reward / risk) : null;
  if (rr !== null) add('rr', rr < 0.8 ? 'WARN' : 'OK', `Reward/risk ${rr}.`);

  const ppp = t.premiumPerPoint && t.premiumPerPoint > 0 ? t.premiumPerPoint : null;
  const netIfTarget = ppp && reward !== null ? Math.round(reward * ppp * t.qty - t.charges) : null;
  const netIfStop = ppp && risk !== null ? Math.round(-risk * ppp * t.qty - t.charges) : null;
  const premiumStop = ppp && risk !== null && t.premium ? r1(t.premium - risk * ppp) : null;
  const premiumTarget = ppp && reward !== null && t.premium ? r1(t.premium + reward * ppp) : null;
  const breakEvenWinRate = netIfTarget !== null && netIfStop !== null && netIfTarget > 0
    ? Math.round((-netIfStop / (netIfTarget - netIfStop)) * 1000) / 10
    : null;

  return {
    checks,
    ok: !checks.some(c => c.severity === 'BLOCK'),
    risk,
    reward,
    rr,
    room,
    netIfTarget,
    netIfStop,
    premiumStop,
    premiumTarget,
    breakEvenWinRate
  };
}
