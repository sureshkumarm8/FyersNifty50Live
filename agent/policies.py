"""Declarative Safety Policies for the Autonomous Trading Supervisor.
Enforces the safety boundaries of the Google Antigravity SDK.
"""

def get_supervisor_policies():
    """Returns the list of declarative safety policies for the agent."""
    try:
        from google.antigravity.hooks import policy

        return [
            # 1. Strictly deny arbitrary command line execution
            policy.deny("run_command"),
            
            # 2. Specifically allow the supervised domain tools
            policy.allow("check_system_health"),
            policy.allow("get_token_status"),
            policy.allow("reconcile_broker_orders"),
            policy.allow("trigger_premarket_autopull"),
            policy.allow("audit_strategy_safety"),
            policy.allow("trigger_global_kill"),
            policy.allow("grade_daily_session"),
            
            # 3. Allow read-only file access for logs and journal files
            policy.allow("view_file"),
            
            # 4. Fallback deny for all other unknown tools
            policy.deny("*")
        ]
    except ImportError:
        # Fallback specification when SDK is dynamically inspected
        return [
            {"action": "deny", "tool": "run_command"},
            {"action": "allow", "tools": [
                "check_system_health",
                "get_token_status",
                "reconcile_broker_orders",
                "trigger_premarket_autopull",
                "audit_strategy_safety",
                "trigger_global_kill",
                "grade_daily_session",
                "view_file"
            ]},
            {"action": "deny", "tool": "*"}
        ]

SUPERVISOR_POLICIES = get_supervisor_policies()
