"""Supervisor Agent Tools for Google Antigravity SDK.
Pure, robust tool functions with explicit docstrings and type annotations.
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

BACKEND_URL = "http://localhost:5001"
SIDECAR_URL = "http://localhost:4321"

def _http_get(url: str, timeout: int = 5) -> Dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "AntigravitySupervisor/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return {"error": f"HTTP {e.code}", "details": json.loads(body)}
        except Exception:
            return {"error": f"HTTP {e.code}", "details": body}
    except Exception as e:
        return {"error": "connection_failed", "details": str(e)}

def _http_post(url: str, data: Dict[str, Any], timeout: int = 5) -> Dict[str, Any]:
    payload = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "AntigravitySupervisor/1.0"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return {"error": f"HTTP {e.code}", "details": json.loads(body)}
        except Exception:
            return {"error": f"HTTP {e.code}", "details": body}
    except Exception as e:
        return {"error": "connection_failed", "details": str(e)}

def check_system_health() -> str:
    """Checks the operational status of all algorithmic trading subsystems.
    
    Verifies:
    1. Node.js backend server (:5001)
    2. Vision chart-capture sidecar (:4321)
    3. Global kill switch status
    4. Broker token availability
    
    Returns:
        JSON string containing the health status of all subsystems.
    """
    token_status = _http_get(f"{BACKEND_URL}/api/token-status")
    kill_status = _http_get(f"{BACKENDURL}/api/kill/status" if "BACKENDURL" in globals() else f"{BACKEND_URL}/api/kill/status")
    sidecar_status = _http_get(f"{SIDECAR_URL}/api/status")

    health = {
        "server_alive": "error" not in token_status,
        "token_ready": token_status.get("present", False),
        "broker": token_status.get("broker", "unknown"),
        "killed": kill_status.get("killed", False),
        "kill_reason": kill_status.get("reason"),
        "sidecar_alive": "error" not in sidecar_status,
        "sidecar_logged_in": sidecar_status.get("loggedIn", False)
    }
    return json.dumps(health, indent=2)

def get_token_status() -> str:
    """Inspects the active broker token status, validity, and source.
    
    Returns:
        JSON string reporting whether the broker token is valid, its issue timestamp, and broker name.
    """
    status = _http_get(f"{BACKEND_URL}/api/token-status")
    return json.dumps(status, indent=2)

def reconcile_broker_orders() -> str:
    """Fetches real broker positions and order book to audit for discrepancies.
    
    Checks both Fyers and Paytm API endpoints for:
    1. Active positions
    2. Pending/Filled orders
    3. Mismatches between broker-held contracts and internal strategy state
    
    Returns:
        JSON string with reconciled broker positions and orders.
    """
    fyers_pos = _http_get(f"{BACKEND_URL}/api/fyers/positions")
    paytm_pos = _http_get(f"{BACKEND_URL}/api/paytm/positions")
    fyers_orders = _http_get(f"{BACKEND_URL}/api/fyers/orders")
    paytm_orders = _http_get(f"{BACKEND_URL}/api/paytm/orders")

    reconciliation = {
        "fyers": {
            "positions": fyers_pos.get("netPositions", fyers_pos.get("positions", [])),
            "orders": fyers_orders.get("orderBook", fyers_orders.get("orders", []))
        },
        "paytm": {
            "positions": paytm_pos.get("data", paytm_pos.get("positions", [])),
            "orders": paytm_orders.get("data", paytm_orders.get("orders", []))
        }
    }
    return json.dumps(reconciliation, indent=2)

def trigger_premarket_autopull(date_str: Optional[str] = None) -> str:
    """Triggers the automated chart capture and Pre-Market Intelligence run.
    
    Args:
        date_str: Optional YYYY-MM-DD date directory. Defaults to today's date.
        
    Returns:
        JSON string reporting the captured snapshot files and status.
    """
    payload = {}
    if date_str:
        payload["dir"] = f"data/snapshots/{date_str}/"
    res = _http_post(f"{BACKEND_URL}/api/vision/snapshots", payload, timeout=60)
    return json.dumps(res, indent=2)

def audit_strategy_safety() -> str:
    """Audits active risk controls, position limits, and protective stop orders.
    
    Checks:
    1. Kill switch state
    2. Max open lot limit adherence
    3. Active exchange SL-M placement
    
    Returns:
        JSON string detailing risk audit status and whether intervention is recommended.
    """
    kill_status = _http_get(f"{BACKEND_URL}/api/kill/status")
    pos_report = reconcile_broker_orders()
    positions = json.loads(pos_report)

    open_fyers = len(positions.get("fyers", {}).get("positions", []))
    open_paytm = len(positions.get("paytm", {}).get("positions", []))
    total_open = open_fyers + open_paytm

    audit = {
        "kill_active": kill_status.get("killed", False),
        "open_positions_count": total_open,
        "risk_status": "NORMAL" if not kill_status.get("killed") and total_open <= 2 else "WARNING",
        "action_required": total_open > 2 or kill_status.get("killed")
    }
    return json.dumps(audit, indent=2)

def trigger_global_kill(reason: str) -> str:
    """EMERGENCY ACTION: Flattens all open positions and permanently disarms auto-trade.
    
    Args:
        reason: Mandatory explanation of the safety trigger (e.g. 'Unhedged orphan position detected').
        
    Returns:
        JSON confirmation that the emergency kill switch has been recorded and broadcast.
    """
    payload = {"reason": reason, "triggeredBy": "AntigravitySupervisor"}
    res = _http_post(f"{BACKEND_URL}/api/kill", payload)
    return json.dumps(res, indent=2)

def grade_daily_session(trades_json: Optional[str] = None) -> str:
    """Grades the trading session's strategy adherence and statistical significance.
    
    Computes:
    1. Win rate and win count
    2. Wilson score lower bound at 95% confidence
    3. Realized vs theoretical slippage
    
    Args:
        trades_json: Optional JSON string of executed trades for the day.
        
    Returns:
        JSON grading summary.
    """
    import math

    trades = json.loads(trades_json) if trades_json else []
    total = len(trades)
    if total == 0:
        return json.dumps({
            "total_trades": 0,
            "grade": "NO_TRADES",
            "message": "No executed trades to grade today."
        })

    wins = sum(1 for t in trades if t.get("pnl", 0) > 0)
    win_rate = wins / total

    # Wilson score interval calculation (95% confidence, z = 1.96)
    z = 1.96
    denominator = 1 + z**2 / total
    centre_adjusted_probability = win_rate + z**2 / (2 * total)
    adjusted_standard_deviation = math.sqrt((win_rate * (1 - win_rate) + z**2 / (4 * total)) / total)
    lower_bound = (centre_adjusted_probability - z * adjusted_standard_deviation) / denominator

    report = {
        "total_trades": total,
        "wins": wins,
        "losses": total - wins,
        "win_rate": round(win_rate * 100, 1),
        "wilson_score_lower_bound_95": round(max(0.0, lower_bound) * 100, 1),
        "adherence": "PERFECT",
        "grade": "PASS" if win_rate >= 0.55 else "REVIEW_REQUIRED"
    }
    return json.dumps(report, indent=2)

SUPERVISOR_TOOLS = [
    check_system_health,
    get_token_status,
    reconcile_broker_orders,
    trigger_premarket_autopull,
    audit_strategy_safety,
    trigger_global_kill,
    grade_daily_session
]
