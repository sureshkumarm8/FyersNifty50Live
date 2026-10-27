"""Autonomous AI Trading Supervisor Main Entry Point.
Built on Google Antigravity SDK.
"""

import sys
import os
import argparse
import asyncio
from typing import Optional

from agent.config import get_agent_config
from agent.tools import (
    check_system_health,
    get_token_status,
    reconcile_broker_orders,
    audit_strategy_safety,
    trigger_premarket_autopull,
    grade_daily_session
)

async def run_one_shot_health():
    """Runs a one-shot system integrity audit."""
    print("=" * 60)
    print("🤖 Autonomous AI Trading Supervisor — System Health Audit")
    print("=" * 60)
    health = check_system_health()
    print(health)
    token = get_token_status()
    print("\n[Token Status]:")
    print(token)
    risk = audit_strategy_safety()
    print("\n[Risk & Safety Audit]:")
    print(risk)

async def run_one_shot_autopull():
    """Triggers chart snapshot pull and premarket playbook generation."""
    print("=" * 60)
    print("📷 Autonomous AI Trading Supervisor — Pre-Market Snapshot Auto-Pull")
    print("=" * 60)
    res = trigger_premarket_autopull()
    print(res)

async def run_one_shot_eod():
    """Performs end-of-day reconciliation and strategy grading."""
    print("=" * 60)
    print("📊 Autonomous AI Trading Supervisor — EOD Strategy Grading")
    print("=" * 60)
    orders = reconcile_broker_orders()
    print("\n[Reconciled Orders & Positions]:")
    print(orders)
    grade = grade_daily_session()
    print("\n[Wilson Score Performance Grade]:")
    print(grade)

async def run_agent_daemon():
    """Launches the continuous Google Antigravity Agent supervisor loop."""
    print("=" * 60)
    print("🚀 Launching Autonomous AI Trading Supervisor Daemon...")
    print("=" * 60)
    
    try:
        from google.antigravity import Agent
        config = get_agent_config()
        async with Agent(config) as agent:
            print("✅ Supervisor Agent active. Triggers and safety policies armed.")
            while True:
                await asyncio.sleep(60)
    except ImportError:
        print("ℹ️ google-antigravity SDK running in headless trigger loop mode.")
        from agent.triggers import live_trading_watchdog, morning_lifecycle_trigger
        
        class DummyContext:
            async def send(self, msg: str):
                print(f"[SUPERVISOR NOTIFICATION] {msg}")

        ctx = DummyContext()
        await asyncio.gather(
            live_trading_watchdog(ctx),
            morning_lifecycle_trigger(ctx)
        )

def main():
    parser = argparse.ArgumentParser(description="Autonomous AI Trading Supervisor")
    parser.add_argument("--check", action="store_true", help="Run one-shot pre-flight health check")
    parser.add_argument("--autopull", action="store_true", help="Trigger pre-market chart auto-pull")
    parser.add_argument("--eod", action="store_true", help="Run EOD reconciliation and grading")
    parser.add_argument("--daemon", action="store_true", help="Run continuous supervisor daemon")

    args = parser.parse_args()

    if args.check:
        asyncio.run(run_one_shot_health())
    elif args.autopull:
        asyncio.run(run_one_shot_autopull())
    elif args.eod:
        asyncio.run(run_one_shot_eod())
    else:
        # Default to daemon or health check if no args
        asyncio.run(run_one_shot_health())

if __name__ == "__main__":
    main()
