"""Triggers for Autonomous AI Trading Supervisor.
Manages time-based checkpoints and continuous risk monitoring.
"""

import asyncio
import datetime
import zoneinfo
from typing import List, Any

IST = zoneinfo.ZoneInfo("Asia/Kolkata")

def get_ist_now() -> datetime.datetime:
    return datetime.datetime.now(IST)

def is_market_day(dt: datetime.datetime) -> bool:
    # Monday is 0, Sunday is 6
    return dt.weekday() < 5

async def live_trading_watchdog(ctx: Any):
    """Continuously monitors open positions, stops, and broker synchronization during market hours (09:15 - 15:30 IST).
    Polls every 30 seconds.
    """
    while True:
        try:
            now = get_ist_now()
            if is_market_day(now):
                mins = now.hour * 60 + now.minute
                # Market hours: 09:15 (555) to 15:30 (930)
                if 555 <= mins <= 930:
                    # Send periodic audit checkpoint to the agent
                    if hasattr(ctx, "send"):
                        await ctx.send(
                            f"[MARKET SUPERVISOR WATCHDOG] Time: {now.strftime('%H:%M:%S')} IST. "
                            f"Audit positions, check for SL-M order placement, and confirm broker synchronization."
                        )
        except Exception as e:
            print(f"[Watchdog Error] {e}")
            
        await asyncio.sleep(30)

async def morning_lifecycle_trigger(ctx: Any):
    """Lifecycle triggers for morning pre-flight, token check, and pre-market snapshot auto-pull."""
    last_phase = None
    while True:
        try:
            now = get_ist_now()
            if is_market_day(now):
                mins = now.hour * 60 + now.minute
                today_str = now.strftime("%Y-%m-%d")

                # Phase 1: 08:35 Pre-flight
                if 515 <= mins < 520 and last_phase != f"preflight_{today_str}":
                    last_phase = f"preflight_{today_str}"
                    if hasattr(ctx, "send"):
                        await ctx.send("Run pre-flight check: verify API server, sidecar status, and lot size constants.")

                # Phase 2: 08:40 Token check
                elif 520 <= mins < 530 and last_phase != f"token_{today_str}":
                    last_phase = f"token_{today_str}"
                    if hasattr(ctx, "send"):
                        await ctx.send("Inspect broker token status via get_token_status. Alert if token is missing or expired.")

                # Phase 3: 08:50 Pre-Market Snapshot Auto-Pull
                elif 530 <= mins < 555 and last_phase != f"snapshot_{today_str}":
                    last_phase = f"snapshot_{today_str}"
                    if hasattr(ctx, "send"):
                        await ctx.send("Trigger pre-market chart auto-pull and build daily Sniper Playbook.")

                # Phase 4: 15:35 EOD Journaling & Performance Grading
                elif mins >= 935 and last_phase != f"eod_{today_str}":
                    last_phase = f"eod_{today_str}"
                    if hasattr(ctx, "send"):
                        await ctx.send("Market closed. Reconcile all final fills, compute Wilson score, and grade daily session.")
        except Exception as e:
            print(f"[Lifecycle Trigger Error] {e}")

        await asyncio.sleep(30)

def get_supervisor_triggers():
    return [
        live_trading_watchdog,
        morning_lifecycle_trigger
    ]

SUPERVISOR_TRIGGERS = get_supervisor_triggers()
