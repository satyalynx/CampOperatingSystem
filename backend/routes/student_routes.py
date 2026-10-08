import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status

from database import get_db
from auth import get_current_user, require_student
from schemas import MessFeedbackCreate

router = APIRouter(prefix="/api/student", tags=["Student Features"])

@router.get("/profile")
def get_student_profile(current_user: Dict[str, Any] = Depends(require_student)):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    cursor.execute("""
        SELECT s.*, u.email, u.name, u.role
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? OR s.user_id = ?
    """, (student_id, current_user["id"]))
    profile = cursor.fetchone()
    conn.close()
    return profile or current_user

@router.get("/attendance")
def get_student_attendance(current_user: Dict[str, Any] = Depends(require_student)):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    cursor.execute("""
        SELECT * FROM attendance
        WHERE student_id = ?
        ORDER BY subject ASC
    """, (student_id,))
    records = cursor.fetchall()
    conn.close()

    total_present = sum(r["present"] for r in records) if records else 0
    total_classes = sum(r["total"] for r in records) if records else 0
    overall_pct = round((total_present / total_classes * 100), 1) if total_classes > 0 else 0.0

    for r in records:
        r["is_low_attendance"] = r["percentage"] < 75.0

    return {
        "overall_percentage": overall_pct,
        "is_overall_low": overall_pct < 75.0,
        "records": records
    }

@router.get("/timetable")
def get_student_timetable(current_user: Dict[str, Any] = Depends(require_student)):
    conn = get_db()
    cursor = conn.cursor()
    branch = current_user.get("branch", "CSE")
    batch = current_user.get("batch", "2022-2026")

    cursor.execute("""
        SELECT * FROM timetable
        WHERE (branch = 'All' OR branch = ?)
          AND (batch = 'All' OR batch = ?)
        ORDER BY start_time ASC
    """, (branch, batch))
    classes = cursor.fetchall()
    conn.close()
    return classes

@router.get("/fees")
def get_student_fees(current_user: Dict[str, Any] = Depends(require_student)):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    cursor.execute("""
        SELECT * FROM fees
        WHERE student_id = ?
        ORDER BY due_date ASC
    """, (student_id,))
    fees = cursor.fetchall()
    conn.close()
    return fees

@router.get("/mess-menu")
def get_mess_menu():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mess_menu ORDER BY id ASC")
    menu = cursor.fetchall()
    conn.close()
    return menu

@router.post("/mess-feedback")
def submit_mess_feedback(
    payload: MessFeedbackCreate,
    current_user: Dict[str, Any] = Depends(require_student)
):
    conn = get_db()
    cursor = conn.cursor()
    feedback_id = str(uuid.uuid4())
    student_id = current_user.get("student_id") or current_user["id"]
    student_name = current_user.get("name", "Student")
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        INSERT INTO mess_feedback (id, student_id, student_name, day, meal, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (feedback_id, student_id, student_name, payload.day, payload.meal, payload.rating, payload.comment, now))
    conn.commit()

    cursor.execute("SELECT * FROM mess_feedback WHERE id = ?", (feedback_id,))
    created = cursor.fetchone()
    conn.close()
    return created

@router.get("/mess-feedback")
def get_my_mess_feedback(current_user: Dict[str, Any] = Depends(require_student)):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    cursor.execute("SELECT * FROM mess_feedback WHERE student_id = ? ORDER BY created_at DESC", (student_id,))
    feedbacks = cursor.fetchall()
    conn.close()
    return feedbacks

@router.get("/gate-history")
def get_my_gate_history(current_user: Dict[str, Any] = Depends(require_student)):
    conn = get_db()
    cursor = conn.cursor()
    student_id = current_user.get("student_id") or current_user["id"]
    cursor.execute("SELECT * FROM gate_logs WHERE student_id = ? ORDER BY timestamp DESC", (student_id,))
    logs = cursor.fetchall()
    conn.close()
    return logs
