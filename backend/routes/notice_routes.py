import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status

from database import get_db
from auth import get_current_user, require_staff, require_student
from schemas import NoticeCreate

router = APIRouter(prefix="/api/notices", tags=["Targeted Notices"])

@router.get("")
def get_notices(current_user: Dict[str, Any] = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()

    if current_user["role"] == "student":
        student_id = current_user.get("student_id") or current_user["id"]
        hostel = current_user.get("hostel", "")
        branch = current_user.get("branch", "")
        batch = current_user.get("batch", "")

        # Target filtering: notice must match student's hostel, batch, and branch or be 'All'
        cursor.execute("""
            SELECT n.*,
                   nr.read_at,
                   COALESCE(nr.actioned, 0) as is_actioned,
                   nr.actioned_at
            FROM notices n
            LEFT JOIN notice_reads nr ON n.id = nr.notice_id AND nr.student_id = ?
            WHERE (n.target_hostel = 'All' OR n.target_hostel = ?)
              AND (n.target_branch = 'All' OR n.target_branch = ?)
              AND (n.target_batch = 'All' OR n.target_batch = ?)
            ORDER BY n.created_at DESC
        """, (student_id, hostel, branch, batch))
        notices = cursor.fetchall()
        for n in notices:
            n["is_read"] = bool(n.get("read_at"))
    else:
        # Staff and admin view all notices enriched with live engagement analytics
        cursor.execute("SELECT * FROM notices ORDER BY created_at DESC")
        notices = cursor.fetchall()

        # Total student count for computing percentage
        cursor.execute("SELECT COUNT(*) as cnt FROM students")
        total_students_count = cursor.fetchone()["cnt"] or 1

        for n in notices:
            cursor.execute("""
                SELECT COUNT(*) as read_cnt,
                       SUM(actioned) as act_cnt
                FROM notice_reads
                WHERE notice_id = ?
            """, (n["id"],))
            stats = cursor.fetchone()
            n["read_count"] = stats["read_cnt"] or 0
            n["action_count"] = stats["act_cnt"] or 0
            n["total_eligible"] = total_students_count
            n["read_rate"] = round((n["read_count"] / total_students_count) * 100, 1)
            n["action_rate"] = round((n["action_count"] / total_students_count) * 100, 1)

    conn.close()
    return notices

@router.post("")
def create_notice(
    payload: NoticeCreate,
    current_user: Dict[str, Any] = Depends(require_staff)
):
    conn = get_db()
    cursor = conn.cursor()

    notice_id = f"not-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    posted_by = current_user.get("name") or "Campus Administration"

    cursor.execute("""
        INSERT INTO notices (
            id, title, body, posted_by, target_hostel, target_batch, target_branch, actionable, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        notice_id, payload.title, payload.body, posted_by,
        payload.target_hostel or "All",
        payload.target_batch or "All",
        payload.target_branch or "All",
        1 if payload.actionable else 0,
        now
    ))
    conn.commit()

    cursor.execute("SELECT * FROM notices WHERE id = ?", (notice_id,))
    item = cursor.fetchone()
    conn.close()
    return item

@router.post("/{notice_id}/read")
def mark_notice_read(
    notice_id: str,
    current_user: Dict[str, Any] = Depends(require_student)
):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    read_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO notice_reads (id, notice_id, student_id, read_at, actioned)
        VALUES (?, ?, ?, ?, 0)
        ON CONFLICT(notice_id, student_id) DO NOTHING
    """, (read_id, notice_id, student_id, now))
    conn.commit()
    conn.close()
    return {"status": "success", "notice_id": notice_id, "read_at": now}

@router.post("/{notice_id}/action")
def mark_notice_action(
    notice_id: str,
    current_user: Dict[str, Any] = Depends(require_student)
):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        INSERT INTO notice_reads (id, notice_id, student_id, read_at, actioned, actioned_at)
        VALUES (?, ?, ?, ?, 1, ?)
        ON CONFLICT(notice_id, student_id) DO UPDATE SET actioned = 1, actioned_at = ?
    """, (str(uuid.uuid4()), notice_id, student_id, now, now, now))
    conn.commit()
    conn.close()
    return {"status": "success", "notice_id": notice_id, "actioned_at": now}
