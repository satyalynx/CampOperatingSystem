import uuid
import io
import qrcode
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status, Request as FastAPIRequest
from fastapi.responses import StreamingResponse

from database import get_db
from auth import get_current_user, require_staff, require_student
from schemas import RequestCreate, RequestStatusUpdate, RequestVerifyPayload, ProofSubmissionPayload
from scheduler import calculate_effective_sla, check_sla_escalations, BASE_SLA_HOURS

router = APIRouter(prefix="/api/requests", tags=["Requests"])

@router.get("")
def list_requests(
    type: Optional[str] = None,
    hostel: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    escalated: Optional[bool] = None,
    community: Optional[bool] = Query(False),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()

    conditions = []
    params = []

    # Role-based scoping
    if current_user["role"] == "student":
        student_id = current_user.get("student_id") or current_user["id"]
        student_hostel = current_user.get("hostel", "")
        if community:
            # Community complaints board for upvoting & facility tracking
            conditions.append("(type = 'complaint' AND (hostel = ? OR category = 'Canteen'))")
            params.append(student_hostel)
        else:
            # Strictly the student's own requests
            conditions.append("student_id = ?")
            params.append(student_id)
    elif current_user["role"] == "warden":
        warden_hostel = current_user.get("hostel")
        if warden_hostel and warden_hostel != "All":
            conditions.append("hostel = ?")
            params.append(warden_hostel)

    # Optional query filters
    if type and type != "All":
        conditions.append("type = ?")
        params.append(type.lower())
    if hostel and hostel != "All" and current_user["role"] == "admin":
        conditions.append("hostel = ?")
        params.append(hostel)
    if status_filter and status_filter != "All":
        conditions.append("status = ?")
        params.append(status_filter)
    if escalated is not None:
        conditions.append("escalated = ?")
        params.append(1 if escalated else 0)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"SELECT * FROM requests {where_clause} ORDER BY created_at DESC"
    cursor.execute(sql, params)
    rows = cursor.fetchall()

    now = datetime.now(timezone.utc)
    curr_std_id = current_user.get("student_id") or current_user["id"]

    for r in rows:
        upvotes = r.get("upvotes_count", 0)
        eff_sla = calculate_effective_sla(r["type"], upvotes)
        r["sla_limit_hours"] = eff_sla
        r["base_sla_hours"] = BASE_SLA_HOURS.get(r["type"].lower(), 48.0)

        # Check if current student has upvoted
        cursor.execute("SELECT 1 FROM request_upvotes WHERE request_id = ? AND student_id = ?", (r["id"], curr_std_id))
        r["has_upvoted"] = bool(cursor.fetchone())

        try:
            dt_str = r["created_at"].replace("Z", "+00:00")
            cdt = datetime.fromisoformat(dt_str)
            if cdt.tzinfo is None:
                cdt = cdt.replace(tzinfo=timezone.utc)
            elapsed = (now - cdt).total_seconds() / 3600.0
            r["elapsed_hours"] = round(elapsed, 1)
            r["sla_remaining_hours"] = max(0.0, round(eff_sla - elapsed, 1))
        except Exception:
            r["elapsed_hours"] = 0
            r["sla_remaining_hours"] = eff_sla

    conn.close()
    return rows

@router.post("")
def create_request(
    payload: RequestCreate,
    http_req: FastAPIRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()

    student_id = current_user.get("student_id") or current_user["id"]
    student_name = current_user.get("name", "Student")
    hostel = current_user.get("hostel") or payload.hostel or "Girls Block A"
    room = current_user.get("room") or payload.room or "General"
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    client_ip = http_req.client.host if http_req.client else "127.0.0.1"
    user_agent = http_req.headers.get("user-agent", "Unknown")

    # Upvote Acceleration Engine: Duplicate interception for Shared Amenity issues
    is_shared = (
        payload.amenity_type == "shared_amenity" or
        payload.category.lower() in ["canteen", "mess", "sanitation", "cleanliness"] or
        room.lower() in ["canteen", "mess", "corridor", "washroom", "general"]
    )
    if payload.type.lower() == "complaint" and is_shared:
        # Check if an active ticket exists for this category/hostel
        cursor.execute("""
            SELECT id, title, upvotes_count, status, student_id, priority, created_at FROM requests
            WHERE type = 'complaint' AND status IN ('Open', 'In Progress', 'Pending Verification', 'Escalated')
              AND (
                  (category = 'Canteen' AND ? = 'Canteen') OR
                  (hostel = ? AND category = ?)
              )
            ORDER BY created_at DESC LIMIT 1
        """, (payload.category, hostel, payload.category))
        existing = cursor.fetchone()
        if existing:
            # Check if this student already upvoted
            cursor.execute("SELECT id FROM request_upvotes WHERE request_id = ? AND student_id = ?", (existing["id"], student_id))
            already_voted = cursor.fetchone()
            if not already_voted and existing["student_id"] != student_id:
                # Convert filing into a +1 Upvote!
                upvote_id = str(uuid.uuid4())
                cursor.execute("INSERT INTO request_upvotes (id, request_id, student_id, created_at) VALUES (?, ?, ?, ?)", (upvote_id, existing["id"], student_id, now_iso))
                new_votes = existing["upvotes_count"] + 1
                new_sla = calculate_effective_sla("complaint", new_votes)
                
                # Check upvote velocity: >= 5 votes accelerates priority to Critical and 6h SLA floor
                new_priority = "Critical" if new_votes >= 5 else existing["priority"]
                cursor.execute("""
                    UPDATE requests
                    SET upvotes_count = ?, priority = ?
                    WHERE id = ?
                """, (new_votes, new_priority, existing["id"]))

                audit_id = str(uuid.uuid4())
                audit_note = f"Duplicate shared complaint by {student_name} intercepted & converted to +1 Upvote (Total: {new_votes}). Resolution deadline dynamically compressed to {new_sla}h."
                cursor.execute("""
                    INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
                    VALUES (?, ?, 'DUPLICATE_CONVERTED_TO_UPVOTE', ?, ?, 'student', ?, ?, ?, ?, ?, ?)
                """, (audit_id, existing["id"], student_name, student_id, existing["status"], existing["status"], audit_note, client_ip, user_agent, now_iso))

                conn.commit()
                cursor.execute("SELECT * FROM requests WHERE id = ?", (existing["id"],))
                updated_existing = dict(cursor.fetchone())
                conn.close()
                updated_existing["duplicate_intercepted"] = True
                updated_existing["message"] = f"A complaint for '{existing['title']}' is already active. Your report was automatically converted into a Community Upvote, accelerating the resolution deadline to {new_sla}h!"
                return updated_existing

    assigned_to = None
    assigned_staff_name = None

    if payload.type.lower() in ["complaint", "leave"]:
        cursor.execute("SELECT id, name FROM staff WHERE role = 'warden' AND hostel = ? LIMIT 1", (hostel,))
        w = cursor.fetchone()
        if w:
            assigned_to = w["id"]
            assigned_staff_name = w["name"]
        else:
            cursor.execute("SELECT id, name FROM staff WHERE role = 'admin' LIMIT 1")
            adm = cursor.fetchone()
            if adm:
                assigned_to = adm["id"]
                assigned_staff_name = adm["name"]
    else:  # document / certificate
        cursor.execute("SELECT id, name FROM staff WHERE role = 'admin' LIMIT 1")
        adm = cursor.fetchone()
        if adm:
            assigned_to = adm["id"]
            assigned_staff_name = adm["name"]

    req_id = f"req-{uuid.uuid4().hex[:8]}"
    base_sla = calculate_effective_sla(payload.type.lower(), 0)
    sla_deadline = (now + timedelta(hours=base_sla)).isoformat()
    amenity_val = "shared_amenity" if is_shared else (payload.amenity_type or "individual")

    cursor.execute("""
        INSERT INTO requests (
            id, type, category, title, description,
            student_id, student_name, hostel, room,
            status, priority, created_at, assigned_to,
            assigned_staff_name, escalated, upvotes_count,
            escalation_level, escalation_target, student_verified,
            amenity_type, sla_deadline, fraud_flag
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, 0, 0, 0, 'Warden', 0, ?, ?, 0)
    """, (
        req_id, payload.type.lower(), payload.category, payload.title, payload.description,
        student_id, student_name, hostel, room,
        payload.priority or "Medium", now_iso, assigned_to, assigned_staff_name,
        amenity_val, sla_deadline
    ))

    audit_id = str(uuid.uuid4())
    action_name = f"CREATED_{payload.type.upper()}"
    cursor.execute("""
        INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, 'student', NULL, 'Open', 'Request initialized by student under Zero-Trust SLA workflow', ?, ?, ?)
    """, (audit_id, req_id, action_name, student_name, student_id, client_ip, user_agent, now_iso))

    conn.commit()

    cursor.execute("SELECT * FROM requests WHERE id = ?", (req_id,))
    created_item = cursor.fetchone()
    conn.close()

    return created_item

@router.post("/{request_id}/upvote")
def upvote_request(
    request_id: str,
    http_req: FastAPIRequest,
    current_user: Dict[str, Any] = Depends(require_student)
):
    """
    Student Community Upvoting Mechanism (Upvote Acceleration Engine).
    Endorsing complaints dynamically shortens resolution deadlines.
    When velocity hits threshold (>= 5 upvotes), mutates priority to CRITICAL and sets 6-hour floor.
    """
    conn = get_db()
    cursor = conn.cursor()

    student_id = current_user.get("student_id") or current_user["id"]
    student_name = current_user.get("name", "Student")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    client_ip = http_req.client.host if http_req.client else "127.0.0.1"
    user_agent = http_req.headers.get("user-agent", "Unknown")

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")

    if req["type"] != "complaint":
        conn.close()
        raise HTTPException(status_code=400, detail="Only facility and canteen complaints can be community upvoted")

    # Check for duplicate upvote
    cursor.execute("SELECT id FROM request_upvotes WHERE request_id = ? AND student_id = ?", (request_id, student_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="You have already upvoted this issue")

    # Record upvote
    upvote_id = str(uuid.uuid4())
    cursor.execute("INSERT INTO request_upvotes (id, request_id, student_id, created_at) VALUES (?, ?, ?, ?)", (upvote_id, request_id, student_id, now_iso))

    new_upvotes = req["upvotes_count"] + 1

    # Recalculate dynamic SLA
    new_sla = calculate_effective_sla("complaint", new_upvotes)
    # Velocity Trigger: >= 5 votes accelerates priority to Critical and 6h floor
    new_priority = "Critical" if new_upvotes >= 5 else req["priority"]

    cursor.execute("""
        UPDATE requests 
        SET upvotes_count = ?, 
            priority = ? 
        WHERE id = ?
    """, (new_upvotes, new_priority, request_id))

    dt_str = req["created_at"].replace("Z", "+00:00")
    created_dt = datetime.fromisoformat(dt_str)
    if created_dt.tzinfo is None:
        created_dt = created_dt.replace(tzinfo=timezone.utc)
    elapsed = (now - created_dt).total_seconds() / 3600.0

    # Auto-escalate immediately if shortened SLA is already breached
    escalated_now = False
    if elapsed >= new_sla and req["status"] in ["Open", "In Progress", "Pending Verification"] and req["escalation_level"] == 0:
        escalated_now = True
        cursor.execute("""
            UPDATE requests
            SET escalated = 1,
                escalated_at = ?,
                escalation_level = 1,
                escalation_target = 'Chief Warden / Campus Supervisor',
                status = 'Escalated',
                priority = 'High'
            WHERE id = ?
        """, (now_iso, request_id))

    # Immutable audit trail entry
    audit_id = str(uuid.uuid4())
    esc_tag = " (TRIGGERED TIER-1 ESCALATION!)" if escalated_now else ""
    audit_note = f"Upvoted by {student_name} (Total: {new_upvotes}). Resolution deadline dynamically compressed to {new_sla}h{esc_tag}."
    cursor.execute("""
        INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
        VALUES (?, ?, 'STUDENT_COMMUNITY_UPVOTE', ?, ?, 'student', ?, ?, ?, ?, ?, ?)
    """, (audit_id, request_id, student_name, student_id, req["status"], "Escalated" if escalated_now else req["status"], audit_note, client_ip, user_agent, now_iso))

    conn.commit()

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    updated_req = cursor.fetchone()
    conn.close()

    return {
        "status": "success",
        "upvotes_count": new_upvotes,
        "effective_sla_hours": new_sla,
        "escalated_now": escalated_now,
        "request": updated_req
    }

@router.patch("/{request_id}/status")
def update_request_status(
    request_id: str,
    payload: RequestStatusUpdate,
    http_req: FastAPIRequest,
    current_user: Dict[str, Any] = Depends(require_staff)
):
    """
    Finite State Machine (FSM) & Zero-Trust Status Transition Guard.
    Staff CANNOT mark tickets as 'Resolved' or 'Closed' directly.
    To move forward, staff MUST transition to 'Pending Verification' with mandatory proof payload
    (proof image URL + min 25-char resolution notes).
    Only the student can transition 'Pending Verification' to 'Closed'.
    """
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")

    # Warden scope verification
    if current_user["role"] == "warden":
        warden_hostel = current_user.get("hostel")
        if warden_hostel and warden_hostel != "All" and req["hostel"] != warden_hostel:
            conn.close()
            raise HTTPException(status_code=403, detail="Cannot alter requests outside assigned hostel")

    target_status = payload.status.strip()

    # ZERO-TRUST FSM GUARD: Staff CANNOT unilaterally resolve or close tickets!
    if target_status.lower() in ["resolved", "closed"]:
        conn.close()
        raise HTTPException(
            status_code=403,
            detail="Zero-Trust Operational Architecture: Staff cannot unilaterally mark tickets as Resolved or Closed. You must provide mandatory proof (photo URL + resolution steps) and transition to 'Pending Verification'. Only the filing student can verify and close the ticket."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    client_ip = http_req.client.host if http_req.client else "127.0.0.1"
    user_agent = http_req.headers.get("user-agent", "Unknown")
    actor_name = payload.actor_name or current_user.get("name") or "Staff"
    actor_id = current_user.get("id")
    actor_role = current_user.get("role")

    proof_image = payload.proof_image_url or req.get("proof_image_url")
    action_notes = payload.action_taken_notes or payload.resolution_proof or payload.note or ""
    vendor_slip = payload.vendor_invoice_or_slip or req.get("vendor_invoice_or_slip")

    if target_status in ["Pending Verification", "PENDING_VERIFICATION", "pending_verification"]:
        # MANDATORY PROOF VALIDATION:
        if not proof_image or not (proof_image.startswith("http://") or proof_image.startswith("https://")):
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="Mandatory Action Proof: A verified proof image URL (HTTP/HTTPS) is required before requesting student verification."
            )
        if not action_notes or len(action_notes.strip()) < 25:
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="Mandatory Action Proof: Action taken notes must be at least 25 characters detailing resolution steps."
            )

        cursor.execute("""
            UPDATE requests
            SET status = 'Pending Verification',
                proof_image_url = ?,
                resolution_proof = ?,
                vendor_invoice_or_slip = ?,
                student_verified = 0
            WHERE id = ?
        """, (proof_image, action_notes.strip(), vendor_slip, request_id))

        audit_id = str(uuid.uuid4())
        audit_note = f"Staff submitted proof payload: '{action_notes.strip()}' [Proof Image: {proof_image}]. Shifted to Pending Verification."
        cursor.execute("""
            INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
            VALUES (?, ?, 'PROOF_SUBMITTED', ?, ?, ?, ?, 'Pending Verification', ?, ?, ?, ?)
        """, (audit_id, request_id, actor_name, actor_id, actor_role, req["status"], audit_note, client_ip, user_agent, now_iso))

    elif target_status == "Approved" and req["type"] == "leave":
        cursor.execute("UPDATE requests SET status = 'Approved', resolved_at = ? WHERE id = ?", (now_iso, request_id))
        audit_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
            VALUES (?, ?, 'LEAVE_PASS_APPROVED', ?, ?, ?, ?, 'Approved', ?, ?, ?, ?)
        """, (audit_id, request_id, actor_name, actor_id, actor_role, req["status"], payload.note or "Digital Gatepass Approved", client_ip, user_agent, now_iso))

    elif target_status == "In Progress":
        cursor.execute("UPDATE requests SET status = 'In Progress' WHERE id = ?", (request_id,))
        audit_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
            VALUES (?, ?, 'TRIAGE_IN_PROGRESS', ?, ?, ?, ?, 'In Progress', ?, ?, ?, ?)
        """, (audit_id, request_id, actor_name, actor_id, actor_role, req["status"], payload.note or "Work initiated by staff", client_ip, user_agent, now_iso))

    elif target_status == "Rejected":
        if not payload.note or len(payload.note.strip()) < 5:
            conn.close()
            raise HTTPException(status_code=400, detail="Rejection reason note required (min 5 chars).")
        cursor.execute("UPDATE requests SET status = 'Rejected' WHERE id = ?", (request_id,))
        audit_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
            VALUES (?, ?, 'REQUEST_REJECTED', ?, ?, ?, ?, 'Rejected', ?, ?, ?, ?)
        """, (audit_id, request_id, actor_name, actor_id, actor_role, req["status"], payload.note, client_ip, user_agent, now_iso))

    else:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid FSM status transition: {target_status}")

    conn.commit()
    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    updated = cursor.fetchone()
    conn.close()
    return updated

@router.post("/{request_id}/verify")
def verify_request_resolution(
    request_id: str,
    payload: RequestVerifyPayload,
    http_req: FastAPIRequest,
    current_user: Dict[str, Any] = Depends(require_student)
):
    """
    Student Verification & Anti-Fraud Escalation Engine.
    1. If Student Approves: Ticket transitions to 'Closed'.
    2. If Student Rejects: The ticket immediately jumps Level 1/Level 2 and auto-escalates directly
       to Level 3 (Dean / Director of Campus Operations) with FRAUDULENT_RESOLUTION_ATTEMPT flag.
    """
    conn = get_db()
    cursor = conn.cursor()

    student_id = current_user.get("student_id") or current_user["id"]
    student_name = current_user.get("name", "Student")
    now_iso = datetime.now(timezone.utc).isoformat()
    client_ip = http_req.client.host if http_req.client else "127.0.0.1"
    user_agent = http_req.headers.get("user-agent", "Unknown")

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")

    if req["student_id"] != student_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Only the filing student can verify or close this ticket")

    if payload.confirmed:
        # STUDENT ACCEPTS PROOF -> Transitions to CLOSED
        cursor.execute("""
            UPDATE requests
            SET status = 'Closed',
                student_verified = 1,
                resolved_at = ?,
                student_verification_note = ?
            WHERE id = ?
        """, (now_iso, payload.note or "Verified and accepted by student", request_id))

        audit_id = str(uuid.uuid4())
        audit_note = f"Student verified resolution & accepted closure: {payload.note or 'Work confirmed complete.'}"
        cursor.execute("""
            INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
            VALUES (?, ?, 'STUDENT_ACCEPTED_CLOSURE', ?, ?, 'student', ?, 'Closed', ?, ?, ?, ?)
        """, (audit_id, request_id, student_name, student_id, req["status"], audit_note, client_ip, user_agent, now_iso))

    else:
        # ANTI-FRAUD ESCALATION: Student Rejects Fake / Inadequate Proof
        # Jumps L1 / L2 and escalates directly to Level 3 (Dean / Director) with FRAUDULENT_RESOLUTION_ATTEMPT flag!
        rejection_reason = payload.note or "Proof rejected: Problem persists or proof is fraudulent"
        cursor.execute("""
            UPDATE requests
            SET status = 'Escalated',
                student_verified = -1,
                escalated = 1,
                escalation_level = 3,
                escalation_target = 'Dean / Director of Campus Operations',
                priority = 'Critical',
                fraud_flag = 1,
                fraud_reason = ?,
                student_verification_note = ?
            WHERE id = ?
        """, (rejection_reason, rejection_reason, request_id))

        audit_id = str(uuid.uuid4())
        audit_note = f"FRAUDULENT_RESOLUTION_ATTEMPT: Student rejected proof: '{rejection_reason}'. Ticket auto-escalated directly to Level 3 (Dean / Director)."
        cursor.execute("""
            INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
            VALUES (?, ?, 'FRAUDULENT_RESOLUTION_ATTEMPT', ?, ?, 'student', ?, 'Escalated', ?, ?, ?, ?)
        """, (audit_id, request_id, student_name, student_id, req["status"], audit_note, client_ip, user_agent, now_iso))

    conn.commit()
    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    updated = cursor.fetchone()
    conn.close()
    return updated

@router.get("/similar")
def get_similar_tickets(
    type: str,
    category: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()

    student_id = current_user.get("student_id") or current_user["id"]

    cursor.execute("""
        SELECT r.id, r.type, r.category, r.title, r.status, r.created_at, r.resolved_at,
               r.hostel, r.room, r.upvotes_count, r.resolution_proof,
               (SELECT note FROM request_audit_logs WHERE request_id = r.id AND new_status = 'Resolved' ORDER BY created_at DESC LIMIT 1) as resolution_note
        FROM requests r
        WHERE r.type = ? AND r.category = ? AND r.student_id != ?
        ORDER BY CASE WHEN r.status = 'Resolved' THEN 0 WHEN r.status = 'Approved' THEN 1 ELSE 2 END,
                 r.created_at DESC
        LIMIT 3
    """, (type.lower(), category, student_id))

    matches = cursor.fetchall()
    conn.close()
    return matches

@router.get("/{request_id}")
def get_request_detail(
    request_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    if not req:
        conn.close()
        raise HTTPException(status_code=404, detail="Request not found")

    # Scoping check
    if current_user["role"] == "student":
        student_id = current_user.get("student_id") or current_user["id"]
        # Allow viewing if it's student's own OR a complaint in their hostel
        if req["student_id"] != student_id and not (req["type"] == "complaint" and req["hostel"] == current_user.get("hostel")):
            conn.close()
            raise HTTPException(status_code=403, detail="Unauthorized access to request")
    elif current_user["role"] == "warden":
        warden_hostel = current_user.get("hostel")
        if warden_hostel and warden_hostel != "All" and req["hostel"] != warden_hostel:
            conn.close()
            raise HTTPException(status_code=403, detail="Unauthorized access outside assigned hostel")

    cursor.execute("SELECT * FROM request_audit_logs WHERE request_id = ? ORDER BY created_at ASC", (request_id,))
    logs = cursor.fetchall()
    req["audit_trail"] = logs

    # Calculate effective SLA
    upvotes = req.get("upvotes_count", 0)
    req["effective_sla_hours"] = calculate_effective_sla(req["type"], upvotes)
    req["base_sla_hours"] = BASE_SLA_HOURS.get(req["type"].lower(), 48.0)

    # Has upvoted flag
    curr_std_id = current_user.get("student_id") or current_user["id"]
    cursor.execute("SELECT 1 FROM request_upvotes WHERE request_id = ? AND student_id = ?", (request_id, curr_std_id))
    req["has_upvoted"] = bool(cursor.fetchone())

    conn.close()
    return req

@router.get("/{request_id}/logs")
def get_request_logs(
    request_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM request_audit_logs WHERE request_id = ? ORDER BY created_at DESC", (request_id,))
    logs = cursor.fetchall()
    conn.close()
    return logs

@router.get("/{request_id}/qr")
def get_gatepass_qr(request_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM requests WHERE id = ?", (request_id,))
    req = cursor.fetchone()
    conn.close()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    qr_payload = (
        f"CAMPOS-VERIFIED|"
        f"ID:{req['id']}|"
        f"STUDENT:{req['student_name']}|"
        f"HOSTEL:{req['hostel']}|"
        f"ROOM:{req['room']}|"
        f"TYPE:{req['type'].upper()}|"
        f"STATUS:{req['status']}"
    )

    img = qrcode.make(qr_payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

@router.post("/escalate-check")
def trigger_escalation_engine(current_user: Dict[str, Any] = Depends(require_staff)):
    result = check_sla_escalations()
    return result
