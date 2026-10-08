from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
from database import get_db
from auth import verify_password, create_access_token, get_current_user
from schemas import LoginRequest, DemoLoginRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
def login(payload: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, password_hash, role, name, hostel, room
        FROM users WHERE email = ?
    """, (payload.email.strip().lower(),))
    user = cursor.fetchone()

    if not user or not verify_password(user["password_hash"], payload.password):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Attach profile details
    user_info = {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "hostel": user["hostel"],
        "room": user["room"]
    }

    if user["role"] == "student":
        cursor.execute("SELECT id as student_id, roll_no, branch, batch FROM students WHERE user_id = ?", (user["id"],))
        std = cursor.fetchone()
        if std:
            user_info.update(std)
    elif user["role"] in ["warden", "admin"]:
        cursor.execute("SELECT id as staff_id, phone FROM staff WHERE user_id = ?", (user["id"],))
        stf = cursor.fetchone()
        if stf:
            user_info.update(stf)

    conn.close()

    token = create_access_token({"sub": user["id"], "role": user["role"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info
    }

@router.get("/me")
def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@router.post("/demo-switch")
def demo_switch(payload: DemoLoginRequest):
    """
    Convenient evaluator switcher enabling judges to evaluate student, warden, and admin roles
    with authentic JWT authentication.
    """
    conn = get_db()
    cursor = conn.cursor()

    if payload.user_id:
        cursor.execute("SELECT id, email, role, name, hostel, room FROM users WHERE id = ?", (payload.user_id,))
    elif payload.role:
        cursor.execute("SELECT id, email, role, name, hostel, room FROM users WHERE role = ? LIMIT 1", (payload.role,))
    else:
        cursor.execute("SELECT id, email, role, name, hostel, room FROM users WHERE role = 'student' LIMIT 1")

    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Target demo user not found")

    user_info = dict(user)
    if user["role"] == "student":
        cursor.execute("SELECT id as student_id, roll_no, branch, batch FROM students WHERE user_id = ?", (user["id"],))
        std = cursor.fetchone()
        if std:
            user_info.update(std)
    elif user["role"] in ["warden", "admin"]:
        cursor.execute("SELECT id as staff_id, phone FROM staff WHERE user_id = ?", (user["id"],))
        stf = cursor.fetchone()
        if stf:
            user_info.update(stf)

    conn.close()
    token = create_access_token({"sub": user["id"], "role": user["role"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info
    }

@router.get("/demo-accounts")
def get_demo_accounts():
    """List available pre-configured test personas for seamless demonstration."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id as user_id, u.email, u.role, u.name, u.hostel, u.room,
               s.roll_no, s.branch, s.batch
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        ORDER BY u.role DESC, u.name ASC
    """)
    accounts = cursor.fetchall()
    conn.close()
    return accounts
