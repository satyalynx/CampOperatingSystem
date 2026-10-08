import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from database import get_db

# Core Base SLA Deadlines in Hours
BASE_SLA_HOURS = {
    "complaint": 48.0,      # 48 hours base for facility/canteen complaints
    "leave": 2.0,           # 2 hours for leave/gatepass approvals
    "document": 72.0        # 72 hours for certificate/document requests
}

def calculate_effective_sla(req_type: str, upvotes_count: int = 0) -> float:
    """
    Computes dynamic SLA resolution window.
    Community student upvotes dynamically compress the resolution deadline for facility/canteen issues.
    Formula: Base SLA - (upvotes * 4 hours), with an emergency floor of 6.0 hours.
    """
    base = BASE_SLA_HOURS.get(req_type.lower(), 48.0)
    if req_type.lower() == "complaint" and upvotes_count > 0:
        # Each upvote shortens the window by 4 hours down to minimum 6 hours
        compressed = max(6.0, base - (upvotes_count * 4.0))
        return round(compressed, 1)
    return base

def check_sla_escalations() -> Dict[str, Any]:
    """
    Deterministic Multi-Tier Administrative Chain Auto-Escalation Engine.
    1. Dynamically shortens resolution window when student upvotes increase urgency.
    2. Escalates unactioned tickets up the administrative hierarchy:
       Tier 0: Assigned Warden -> Tier 1: Chief Warden -> Tier 2: Dean of Student Affairs
    """
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    escalated_items = []

    try:
        # Fetch open or in-progress tickets
        cursor.execute("""
            SELECT id, type, category, title, student_id, student_name, hostel, room,
                   status, priority, created_at, assigned_to, assigned_staff_name,
                   upvotes_count, escalation_level, escalation_target, escalated
            FROM requests
            WHERE status IN ('Open', 'In Progress', 'Escalated')
        """)
        pending_requests = cursor.fetchall()

        for req in pending_requests:
            req_type = req["type"].lower()
            upvotes = req.get("upvotes_count", 0)
            effective_sla = calculate_effective_sla(req_type, upvotes)

            created_dt = None
            try:
                dt_str = req["created_at"].replace("Z", "+00:00")
                created_dt = datetime.fromisoformat(dt_str)
                if created_dt.tzinfo is None:
                    created_dt = created_dt.replace(tzinfo=timezone.utc)
            except Exception:
                continue

            elapsed_hours = (now - created_dt).total_seconds() / 3600.0
            current_level = req.get("escalation_level", 0)

            # Tier 1 Breach: Elapsed >= Effective SLA (Escalates to Chief Warden)
            if elapsed_hours >= effective_sla and current_level == 0:
                new_target = "Chief Warden / Campus Supervisor"
                cursor.execute("""
                    UPDATE requests
                    SET escalated = 1,
                        escalated_at = ?,
                        escalation_level = 1,
                        escalation_target = ?,
                        priority = 'High',
                        status = 'Escalated'
                    WHERE id = ?
                """, (now_iso, new_target, req["id"]))

                audit_id = str(uuid.uuid4())
                note = (
                    f"Tier-1 SLA Breach: Breached {effective_sla}h deadline (Upvotes: {upvotes}, Elapsed: {elapsed_hours:.1f}h). "
                    f"Server daemon auto-escalated from Warden to {new_target}."
                )
                cursor.execute("""
                    INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
                    VALUES (?, ?, 'AUTO_ESCALATED_L1_CHIEF_WARDEN', 'CampOS SLA Daemon', 'daemon-sla-worker', 'system_daemon', ?, 'Escalated', ?, '127.0.0.1 (Internal Daemon)', 'CampOS-SLA-Daemon/2.0', ?)
                """, (audit_id, req["id"], req["status"], note, now_iso))

                escalated_items.append({
                    "id": req["id"],
                    "title": req["title"],
                    "tier": "Chief Warden",
                    "elapsed_hours": round(elapsed_hours, 1),
                    "effective_sla": effective_sla
                })

            # Tier 2 Breach: Elapsed >= 1.5x Effective SLA (Escalates to Dean of Student Affairs)
            elif elapsed_hours >= (effective_sla * 1.5) and current_level == 1:
                new_target = "Dean of Student Affairs"
                cursor.execute("""
                    UPDATE requests
                    SET escalation_level = 2,
                        escalation_target = ?,
                        priority = 'Critical',
                        status = 'Escalated'
                    WHERE id = ?
                """, (new_target, req["id"]))

                audit_id = str(uuid.uuid4())
                note = (
                    f"Tier-2 Executive Escalation: Severe unactioned delay ({elapsed_hours:.1f}h elapsed vs {effective_sla}h SLA). "
                    f"Server daemon auto-escalated to {new_target}."
                )
                cursor.execute("""
                    INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
                    VALUES (?, ?, 'AUTO_ESCALATED_L2_DEAN', 'CampOS SLA Daemon', 'daemon-sla-worker', 'system_daemon', 'Escalated', 'Escalated', ?, '127.0.0.1 (Internal Daemon)', 'CampOS-SLA-Daemon/2.0', ?)
                """, (audit_id, req["id"], note, now_iso))

                escalated_items.append({
                    "id": req["id"],
                    "title": req["title"],
                    "tier": "Dean of Student Affairs",
                    "elapsed_hours": round(elapsed_hours, 1),
                    "effective_sla": effective_sla
                })

            # Tier 3 Apex Breach: Elapsed >= 2.0x Effective SLA (Escalates to Director of Campus Operations)
            elif elapsed_hours >= (effective_sla * 2.0) and current_level == 2:
                new_target = "Director of Campus Operations"
                cursor.execute("""
                    UPDATE requests
                    SET escalation_level = 3,
                        escalation_target = ?,
                        priority = 'Critical',
                        status = 'Escalated'
                    WHERE id = ?
                """, (new_target, req["id"]))

                audit_id = str(uuid.uuid4())
                note = (
                    f"Tier-3 Apex Governance Escalation: Critical systemic failure ({elapsed_hours:.1f}h elapsed vs {effective_sla}h SLA). "
                    f"Server daemon auto-escalated to Apex Administrative Authority: {new_target}."
                )
                cursor.execute("""
                    INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
                    VALUES (?, ?, 'AUTO_ESCALATED_L3_DIRECTOR', 'CampOS SLA Daemon', 'daemon-sla-worker', 'system_daemon', 'Escalated', 'Escalated', ?, '127.0.0.1 (Internal Daemon)', 'CampOS-SLA-Daemon/2.0', ?)
                """, (audit_id, req["id"], note, now_iso))

                escalated_items.append({
                    "id": req["id"],
                    "title": req["title"],
                    "tier": "Director of Campus Operations",
                    "elapsed_hours": round(elapsed_hours, 1),
                    "effective_sla": effective_sla
                })

        conn.commit()
        if escalated_items:
            print(f"[SLA Engine] Multi-Tier Escalation executed for {len(escalated_items)} request(s).")
    except Exception as e:
        print(f"[SLA Scheduler Error]: {e}")
    finally:
        conn.close()

    return {
        "timestamp": now_iso,
        "checked_at": now_iso,
        "escalated_count": len(escalated_items),
        "escalated_requests": escalated_items
    }