/**
 * MARKET PULSE — one brief per minute of what changed, so the trader does not
 * have to cycle Cockpit · Stocks · Options · History · Vision to see it.
 *
 *   price      1-min and 5-min move
 *   OI flow    per-strike put/call OI added or cut (ATM ± 300) over the last ~5 min
 *              and the last minute, with the standard writer read
 *   breadth    advances/declines now vs ~5 min ago, PCR and sentiment change
 *   drivers    heavyweights moving Nifty in the last minute, and today's leaders
 *
 * Descriptive only: "put writers added 7L at 25800" is a fact; whether to trade
 * it is the trader's call. Plain TS (no enums) so the Node ops server can import it.
 *
 * Pure module: no React, no I/O, no clock.
 */
// Same format as services/oiWalls.ts parseOiLadder; kept local so the Node ops server
// can import this file directly (Node's type stripping needs explicit extensions).
function parseOiLadder(ladder: string | null | undefined): { strike: number; putOI: number; callOI: number }[] {
  return (ladder || '')
    .split(';')
    .map(part => /^(\d+(?:\.\d+)?):([\d.]+)\/([\d.]+)$/.exec(part.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map(m => ({ strike: Number(m[1]), putOI: Number(m[2]) * 1e5, callOI: Number(m[3]) * 1e5 }));
}

export interface PulseTick {
  t: number;
  spot: number;
  oiLadder?: string | null;
  adv?: number | null;
  dec?: number | null;
  pcr?: number | null;
  sent?: number | null;
  callsOI?: number | null;
  putsOI?: number | null;
  /** Heavyweights: symbol, weight %, 1-min %, day % (from prev close). */
  movers?: { s: string; w: number; m1: number; day: number }[] | null;
}

export interface StrikeFlow { strike: number; side: 'PE' | 'CE'; changeL: number; nowL: number }

export type FlowRead = 'BULLISH' | 'BEARISH' | 'RANGE' | 'UNWINDING' | 'QUIET' | 'UNKNOWN';

export interface Pulse {
  t: number;
  spot: number;
  move1: number | null;
  move5: number | null;
  flow: FlowRead;
  /** Sum of put OI change below price / call OI change above price, lakhs, over ~5 min. */
  putsBelowL: number | null;
  callsAboveL: number | null;
  /** Biggest per-strike changes over ~5 min (and over the last minute). */
  top5m: StrikeFlow[];
  top1m: StrikeFlow[];
  adv: number | null; dec: number | null; advChange5: number | null;
  pcr: number | null; pcrChange5: number | null;
  sent: number | null; sentChange5: number | null;
  drivers1m: { s: string; pts: number }[];
  leadersDay: { s: string; pts: number }[];
  headline: string;
  lines: string[];
}

const L = (contracts: number) => Math.round((contracts / 1e5) * 10) / 10;
const r1 = (n: number) => Math.round(n * 10) / 10;
const sgn = (n: number, d = 1) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(d)}`;
const name = (s: string) => s.replace(/^NSE:/, '').replace(/-EQ$/, '');

function at(ticks: PulseTick[], t: number): PulseTick | null {
  let best: PulseTick | null = null;
  for (const x of ticks) if (x.t <= t && (!best || x.t > best.t)) best = x;
  return best;
}
function laddered(ticks: PulseTick[], t: number): PulseTick | null {
  let best: PulseTick | null = null;
  for (const x of ticks) if (x.oiLadder && x.t <= t && (!best || x.t > best.t)) best = x;
  return best;
}

/** Per-strike OI change between two ladders, within ±reach of spot. */
export function strikeFlows(nowLadder: string | null | undefined, thenLadder: string | null | undefined, spot: number, reach = 300): StrikeFlow[] {
  const now = parseOiLadder(nowLadder), then = new Map(parseOiLadder(thenLadder).map(r => [r.strike, r]));
  const out: StrikeFlow[] = [];
  for (const r of now) {
    if (Math.abs(r.strike - spot) > reach) continue;
    const p = then.get(r.strike);
    if (!p) continue;
    out.push({ strike: r.strike, side: 'PE', changeL: L(r.putOI - p.putOI), nowL: L(r.putOI) });
    out.push({ strike: r.strike, side: 'CE', changeL: L(r.callOI - p.callOI), nowL: L(r.callOI) });
  }
  return out;
}

/** The standard writer read of put OI below price and call OI above it. */
export function readFlow(putsBelowL: number | null, callsAboveL: number | null, noise = 2): FlowRead {
  if (putsBelowL === null || callsAboveL === null) return 'UNKNOWN';
  const p = Math.abs(putsBelowL) < noise ? 0 : Math.sign(putsBelowL);
  const c = Math.abs(callsAboveL) < noise ? 0 : Math.sign(callsAboveL);
  if (p === 0 && c === 0) return 'QUIET';
  if (p >= 0 && c <= 0 && (p > 0 || c < 0)) return 'BULLISH';   // support written, resistance covered
  if (c >= 0 && p <= 0 && (c > 0 || p < 0)) return 'BEARISH';   // resistance written, support covered
  if (p > 0 && c > 0) return 'RANGE';                           // both sides writing: price boxed in
  return 'UNWINDING';                                           // both sides covering: walls thinning
}

const FLOW_TEXT: Record<FlowRead, string> = {
  BULLISH: 'bullish flow — puts written below, calls covered above',
  BEARISH: 'bearish flow — calls written above, puts covered below',
  RANGE: 'range flow — writers adding on both sides',
  UNWINDING: 'unwinding — writers covering on both sides (walls thinning)',
  QUIET: 'OI quiet',
  UNKNOWN: 'OI flow unknown (no ladder)'
};

export function buildPulse(ticks: PulseTick[], t: number): Pulse | null {
  const now = at(ticks, t);
  if (!now) return null;
  const p1 = at(ticks, t - 60_000), p5 = at(ticks, t - 300_000);
  const move1 = p1 && p1 !== now ? r1(now.spot - p1.spot) : null;
  const move5 = p5 && p5 !== now ? r1(now.spot - p5.spot) : null;

  const lNow = laddered(ticks, t), l5 = laddered(ticks, t - 270_000), l1 = laddered(ticks, t - 50_000);
  const f5 = lNow && l5 && l5 !== lNow ? strikeFlows(lNow.oiLadder, l5.oiLadder, now.spot) : [];
  const f1 = lNow && l1 && l1 !== lNow ? strikeFlows(lNow.oiLadder, l1.oiLadder, now.spot) : [];
  const putsBelowL = f5.length ? r1(f5.filter(f => f.side === 'PE' && f.strike <= now.spot).reduce((a, f) => a + f.changeL, 0)) : null;
  const callsAboveL = f5.length ? r1(f5.filter(f => f.side === 'CE' && f.strike >= now.spot).reduce((a, f) => a + f.changeL, 0)) : null;
  const flow = readFlow(putsBelowL, callsAboveL);
  const big = (fs: StrikeFlow[], n: number, min: number) => fs.filter(f => Math.abs(f.changeL) >= min).sort((a, b) => Math.abs(b.changeL) - Math.abs(a.changeL)).slice(0, n);
  const top5m = big(f5, 4, 1);
  const top1m = big(f1, 3, 0.5);

  const num = (x: number | null | undefined) => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const adv = num(now.adv), dec = num(now.dec);
  const advChange5 = adv !== null && p5 && num(p5.adv) !== null ? adv - (p5.adv as number) : null;
  const pcr = num(now.pcr) !== null && (now.pcr as number) > 0 ? Math.round((now.pcr as number) * 100) / 100 : null;
  const pcrChange5 = pcr !== null && p5 && num(p5.pcr) && (p5.pcr as number) > 0 ? Math.round((pcr - (p5.pcr as number)) * 100) / 100 : null;
  const sent = num(now.sent) !== null ? Math.round(now.sent as number) : null;
  const sentChange5 = sent !== null && p5 && num(p5.sent) !== null ? Math.round(sent - (p5.sent as number)) : null;

  // Index points a stock moved Nifty: spot × weight% × move%.
  const pts = (w: number, pct: number) => r1(now.spot * (w / 100) * (pct / 100));
  const movers = now.movers ?? [];
  const drivers1m = movers.map(m => ({ s: name(m.s), pts: pts(m.w, m.m1) })).filter(m => Math.abs(m.pts) >= 0.5).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 3);
  const leadersDay = movers.map(m => ({ s: name(m.s), pts: pts(m.w, m.day) })).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 3);

  const parts = [
    move1 !== null ? `${sgn(move1)} pts 1m${move5 !== null ? ` (${sgn(move5)} 5m)` : ''}` : 'first minute',
    FLOW_TEXT[flow] + (putsBelowL !== null ? ` (puts ${sgn(putsBelowL)}L · calls ${sgn(callsAboveL ?? 0)}L)` : ''),
    adv !== null && dec !== null ? `breadth ${adv}/${dec}${advChange5 !== null ? ` (${sgn(advChange5, 0)})` : ''}` : null,
    pcr !== null ? `PCR ${pcr.toFixed(2)}${pcrChange5 !== null ? ` (${sgn(pcrChange5, 2)})` : ''}` : null
  ].filter(Boolean);
  const verb = (f: StrikeFlow) => (f.changeL > 0 ? (f.side === 'PE' ? 'put writers adding' : 'call writers adding') : f.side === 'PE' ? 'puts covering' : 'calls covering');
  const lines = [
    ...(top5m.length ? [`OI 5m: ${top5m.map(f => `${f.strike} ${f.side} ${sgn(f.changeL)}L (${verb(f)})`).join(' · ')}`] : []),
    ...(top1m.length ? [`OI 1m: ${top1m.map(f => `${f.strike} ${f.side} ${sgn(f.changeL)}L`).join(' · ')}`] : []),
    ...(drivers1m.length ? [`Moving Nifty now: ${drivers1m.map(d => `${d.s} ${sgn(d.pts)}`).join(' · ')} pts`] : []),
    ...(leadersDay.length ? [`Today's drivers: ${leadersDay.map(d => `${d.s} ${sgn(d.pts)}`).join(' · ')} pts`] : []),
    ...(sent !== null ? [`Sentiment ${sent}%${sentChange5 !== null ? ` (${sgn(sentChange5, 0)} in 5m)` : ''}`] : [])
  ];
  return {
    t, spot: now.spot, move1, move5, flow, putsBelowL, callsAboveL, top5m, top1m,
    adv, dec, advChange5, pcr, pcrChange5, sent, sentChange5, drivers1m, leadersDay,
    headline: parts.join(' · '), lines
  };
}
