import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status

from database import get_db
from auth import require_staff, require_admin
from schemas import GateLogCreate, RoomCreate
from seed import seed_database

router = APIRouter(prefix="/api/admin", tags=["Admin & Warden Operations"])

@router.get("/dashboard")
def get_dashboard_analytics(current_user: Dict[str, Any] = Depends(require_staff)):
    conn = get_db()
    cursor = conn.cursor()

    hostel_scope = None
    if current_user["role"] == "warden":
        hostel_scope = current_user.get("hostel")

    # Base filter
    where_req = "WHERE hostel = ?" if hostel_scope and hostel_scope != "All" else ""
    req_params = [hostel_scope] if hostel_scope and hostel_scope != "All" else []

    # 1. Total & Status Counts
    cursor.execute(f"SELECT COUNT(*) as total FROM requests {where_req}", req_params)
    total_requests = cursor.fetchone()["total"]

    cursor.execute(f"SELECT status, COUNT(*) as cnt FROM requests {where_req} GROUP BY status", req_params)
    status_counts = {r["status"]: r["cnt"] for r in cursor.fetchall()}

    open_count = status_counts.get("Open", 0)
    in_progress_count = status_counts.get("In Progress", 0)
    pending_verification_count = status_counts.get("Pending Verification", 0)
    resolved_count = status_counts.get("Resolved", 0) + status_counts.get("Approved", 0) + status_counts.get("Closed", 0)
    rejected_count = status_counts.get("Rejected", 0)
    escalated_count = status_counts.get("Escalated", 0)

    # 2. Requests by Type
    cursor.execute(f"SELECT type, COUNT(*) as cnt FROM requests {where_req} GROUP BY type", req_params)
    by_type = {r["type"]: r["cnt"] for r in cursor.fetchall()}

    # 3. Ageing Requests (> 48h and > 7 days)
    now = datetime.now(timezone.utc)
    t_48h_ago = (now - timedelta(hours=48)).isoformat()
    t_7d_ago = (now - timedelta(days=7)).isoformat()

    ageing_sql_48 = f"SELECT COUNT(*) as cnt FROM requests WHERE status IN ('Open', 'In Progress') AND created_at < ? {'AND hostel = ?' if hostel_scope else ''}"
    p_48 = [t_48h_ago] + ([hostel_scope] if hostel_scope else [])
    cursor.execute(ageing_sql_48, p_48)
    ageing_48h = cursor.fetchone()["cnt"]

    ageing_sql_7d = f"SELECT COUNT(*) as cnt FROM requests WHERE status IN ('Open', 'In Progress') AND created_at < ? {'AND hostel = ?' if hostel_scope else ''}"
    p_7d = [t_7d_ago] + ([hostel_scope] if hostel_scope else [])
    cursor.execute(ageing_sql_7d, p_7d)
    ageing_7d = cursor.fetchone()["cnt"]

    # 4. Average Resolution Time (in hours)
    resolved_sql = f"SELECT created_at, resolved_at FROM requests WHERE resolved_at IS NOT NULL {'AND hostel = ?' if hostel_scope else ''}"
    p_res = [hostel_scope] if hostel_scope else []
    cursor.execute(resolved_sql, p_res)
    res_rows = cursor.fetchall()
    
    total_res_hours = 0.0
    for row in res_rows:
        try:
            c = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            r = datetime.fromisoformat(row["resolved_at"].replace("Z", "+00:00"))
            total_res_hours += (r - c).total_seconds() / 3600.0
        except Exception:
            pass
    avg_resolution_hours = round(total_res_hours / len(res_rows), 1) if res_rows else 0.0

    # 5. Workload & Escalation Accountability by Staff
    cursor.execute("""
        SELECT s.id, s.name, s.role, s.hostel,
               COUNT(CASE WHEN r.status IN ('Open', 'In Progress') THEN 1 END) as pending_workload,
               COUNT(CASE WHEN r.escalated = 1 THEN 1 END) as escalations_count,
               COUNT(r.id) as total_handled
        FROM staff s
        LEFT JOIN requests r ON s.id = r.assigned_to
        GROUP BY s.id, s.name, s.role, s.hostel
        ORDER BY pending_workload DESC
    """)
    staff_accountability = cursor.fetchall()

    # 6. Repeat Issues Count
    repeat_sql = f"""
        SELECT hostel, room, category, COUNT(*) as cnt
        FROM requests
        WHERE type = 'complaint' {'AND hostel = ?' if hostel_scope else ''}
        GROUP BY hostel, room, category
        HAVING COUNT(*) >= 2
    """
    p_rep = [hostel_scope] if hostel_scope else []
    cursor.execute(repeat_sql, p_rep)
    repeat_issues_list = cursor.fetchall()

    # 7. Overall Notice Engagement
    cursor.execute("SELECT COUNT(*) as total_notices FROM notices")
    tot_notices = cursor.fetchone()["total_notices"] or 1
    cursor.execute("SELECT COUNT(*) as reads, SUM(actioned) as actions FROM notice_reads")
    nr_stats = cursor.fetchone()

    conn.close()

    return {
        "scope": hostel_scope or "Institution-Wide",
        "total_requests": total_requests,
        "open_requests": open_count,
        "in_progress_requests": in_progress_count,
        "resolved_requests": resolved_count,
        "rejected_requests": rejected_count,
        "escalated_requests": escalated_count,
        "by_type": {
            "complaint": by_type.get("complaint", 0),
            "leave": by_type.get("leave", 0),
            "document": by_type.get("document", 0)
        },
        "ageing_over_48h": ageing_48h,
        "ageing_over_7d": ageing_7d,
        "avg_resolution_hours": avg_resolution_hours,
        "avg_resolution_days": round(avg_resolution_hours / 24.0, 1),
        "repeat_issues_count": len(repeat_issues_list),
        "staff_accountability": staff_accountability,
        "notice_engagement": {
            "total_notices": tot_notices,
            "total_reads": nr_stats["reads"] or 0,
            "total_actions": nr_stats["actions"] or 0
        }
    }

@router.get("/repeat-issues")
def get_repeat_issues(current_user: Dict[str, Any] = Depends(require_staff)):
    """
    Root Cause Facility Repeat Issue Detection Engine.
    Groups complaints by room + category and identifies systemic recurring issues (count >= 2).
    """
    conn = get_db()
    cursor = conn.cursor()

    hostel_scope = current_user.get("hostel") if current_user["role"] == "warden" else None
    where_clause = "WHERE r.type = 'complaint' AND r.hostel = ?" if hostel_scope and hostel_scope != "All" else "WHERE r.type = 'complaint'"
    params = [hostel_scope] if hostel_scope and hostel_scope != "All" else []

    sql = f"""
        SELECT r.hostel, r.room, r.category, COUNT(r.id) as complaint_count,
               MAX(r.created_at) as latest_complaint_at,
               GROUP_CONCAT(r.title, ' || ') as complaint_titles,
               GROUP_CONCAT(r.id, ',') as ticket_ids
        FROM requests r
        {where_clause}
        GROUP BY r.hostel, r.room, r.category
        HAVING COUNT(r.id) >= 2
        ORDER BY complaint_count DESC, latest_complaint_at DESC
    """
    cursor.execute(sql, params)
    rows = cursor.fetchall()

    for r in rows:
        r["titles_list"] = r["complaint_titles"].split(" || ") if r.get("complaint_titles") else []
        r["ticket_id_list"] = r["ticket_ids"].split(",") if r.get("ticket_ids") else []

    conn.close()
    return rows

@router.get("/rooms")
def get_rooms(current_user: Dict[str, Any] = Depends(require_staff)):
    conn = get_db()
    cursor = conn.cursor()

    hostel_scope = current_user.get("hostel") if current_user["role"] == "warden" else None
    where_clause = "WHERE hostel = ?" if hostel_scope and hostel_scope != "All" else ""
    params = [hostel_scope] if hostel_scope and hostel_scope != "All" else []

    cursor.execute(f"SELECT * FROM rooms {where_clause} ORDER BY hostel ASC, room_number ASC", params)
    rooms = cursor.fetchall()

    for rm in rooms:
        cursor.execute("SELECT * FROM assets WHERE room_id = ?", (rm["id"],))
        rm["assets"] = cursor.fetchall()

    conn.close()
    return rooms

@router.post("/rooms")
def create_room(payload: RoomCreate, current_user: Dict[str, Any] = Depends(require_admin)):
    conn = get_db()
    cursor = conn.cursor()
    room_id = f"room-{payload.room_number}"
    cursor.execute("""
        INSERT INTO rooms (id, room_number, hostel, floor, capacity, occupied_count, notes)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    """, (room_id, payload.room_number, payload.hostel, payload.floor, payload.capacity, payload.notes))
    conn.commit()
    cursor.execute("SELECT * FROM rooms WHERE id = ?", (room_id,))
    item = cursor.fetchone()
    conn.close()
    return item

@router.get("/gate-logs")
def get_all_gate_logs(
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(require_staff)
):
    conn = get_db()
    cursor = conn.cursor()

    hostel_scope = current_user.get("hostel") if current_user["role"] == "warden" else None
    where_clause = "WHERE hostel = ?" if hostel_scope and hostel_scope != "All" else ""
    params = [hostel_scope] if hostel_scope and hostel_scope != "All" else []

    cursor.execute(f"SELECT * FROM gate_logs {where_clause} ORDER BY timestamp DESC LIMIT ?", params + [limit])
    logs = cursor.fetchall()
    conn.close()
    return logs

@router.post("/gate-logs")
def create_gate_log(payload: GateLogCreate, current_user: Dict[str, Any] = Depends(require_staff)):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    log_id = str(uuid.uuid4())

    cursor.execute("SELECT name, roll_no, hostel FROM students WHERE id = ? OR roll_no = ?", (payload.student_id, payload.student_id))
    std = cursor.fetchone()
    if not std:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found for roll number or ID")

    cursor.execute("""
        INSERT INTO gate_logs (id, student_id, student_name, roll_no, hostel, type, gate, timestamp, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (log_id, payload.student_id, std["name"], std["roll_no"], std["hostel"], payload.type, payload.gate, now, payload.remarks))
    conn.commit()

    cursor.execute("SELECT * FROM gate_logs WHERE id = ?", (log_id,))
    created = cursor.fetchone()
    conn.close()
    return created

@router.get("/mess-feedback")
def get_aggregated_mess_feedback(current_user: Dict[str, Any] = Depends(require_staff)):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT meal, AVG(rating) as avg_rating, COUNT(*) as total_reviews
        FROM mess_feedback
        GROUP BY meal
    """)
    meal_stats = cursor.fetchall()

    cursor.execute("SELECT * FROM mess_feedback ORDER BY created_at DESC LIMIT 20")
    recent = cursor.fetchall()
    conn.close()

    return {
        "meal_summary": meal_stats,
        "recent_reviews": recent
    }

@router.post("/reset-demo")
def reset_demo_data(current_user: Dict[str, Any] = Depends(require_staff)):
    """Reset complete database state to clean demonstration seed data."""
    seed_database()
    return {"status": "success", "message": "CampOS database reset to initial demonstration state."}
