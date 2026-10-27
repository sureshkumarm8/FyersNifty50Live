"""Agent Configuration for Autonomous AI Trading Supervisor
Powered by Google Antigravity SDK.
"""

import os
from typing import Optional, List

# System instructions define the Agent persona and strict behavioral boundaries
SYSTEM_INSTRUCTIONS = """You are the Autonomous AI Trading Supervisor for the Nifty 50 algorithmic trading engine.

YOUR CORE RESPONSIBILITIES:
1. SYSTEM INTEGRITY & HEALTH: Verify all subsystems (Node.js API, Vite UI, Vision Sidecar, Redis, Broker Tokens) before market open.
2. RISK & SAFETY SUPERVISION: Monitor positions and broker sync. You have VETO / SHRINK / KILL authority. You MUST NEVER open discretionary speculative trades.
3. PRE-MARKET ORCHESTRATION: Ensure morning chart captures are pulled, validated for staleness, and converted into the daily Pre-Market Playbook by 09:00 IST.
4. BROKER RECONCILIATION: Inspect broker positions against app state. If orphan positions or unhedged exposure persist >10s, alarm and trigger protective stops or flatten.
5. POST-MARKET AUDITING: At 15:35 IST, inspect execution logs, grade slippage and strategy adherence, and write the daily audit report to the trading journal.

SAFETY INVARIANTS:
- You operate under read-only and protective-safety boundaries.
- Live entries are strictly governed by the algorithmic rulebook (Sniper Zone Play and Momentum Guard).
- If system health degrades or unexpected fills occur, invoke trigger_global_kill immediately.
"""

def get_agent_config(
    api_key: Optional[str] = None,
    model: str = "gemini-2.5-flash",
    workspace_dir: Optional[str] = None
):
    """Builds and returns the LocalAgentConfig for the Autonomous Trading Supervisor."""
    try:
        from google.antigravity import LocalAgentConfig
        from agent.tools import SUPERVISOR_TOOLS
        from agent.policies import SUPERVISOR_POLICIES
        from agent.triggers import SUPERVISOR_TRIGGERS

        resolved_api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        config = LocalAgentConfig(
            model=model,
            api_key=resolved_api_key,
            system_instructions=SYSTEM_INSTRUCTIONS,
            tools=SUPERVISOR_TOOLS,
            policies=SUPERVISOR_POLICIES,
            triggers=SUPERVISOR_TRIGGERS,
            workspaces=[workspace_dir] if workspace_dir else None
        )
        return config
    except ImportError:
        # Fallback dictionary for testing when SDK package is loaded dynamically
        return {
            "model": model,
            "system_instructions": SYSTEM_INSTRUCTIONS,
            "tools_count": 6
        }
