import sqlite3
import os
from typing import Optional, List, Dict, Any
from config import DB_PATH, SUPABASE_URL, SUPABASE_KEY

# Optional Supabase client initialization
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[Supabase Init Note]: Cloud client optional fallback: {e}")

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'warden', 'admin')),
        name TEXT NOT NULL,
        hostel TEXT,
        room TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        roll_no TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        hostel TEXT NOT NULL,
        room TEXT NOT NULL,
        branch TEXT NOT NULL,
        batch TEXT NOT NULL,
        phone TEXT
    );

    CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('warden', 'admin')),
        hostel TEXT,
        phone TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('complaint', 'leave', 'document')),
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        hostel TEXT NOT NULL,
        room TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Open', 'In Progress', 'Pending Verification', 'Approved', 'Rejected', 'Resolved', 'Closed', 'Escalated')),
        priority TEXT NOT NULL DEFAULT 'Medium',
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        assigned_to TEXT,
        assigned_staff_name TEXT,
        escalated INTEGER NOT NULL DEFAULT 0,
        escalated_at TEXT,
        upvotes_count INTEGER NOT NULL DEFAULT 0,
        escalation_level INTEGER NOT NULL DEFAULT 0,
        escalation_target TEXT NOT NULL DEFAULT 'Warden',
        resolution_proof TEXT,
        student_verified INTEGER NOT NULL DEFAULT 0,
        student_verification_note TEXT,
        proof_image_url TEXT,
        vendor_invoice_or_slip TEXT,
        fraud_flag INTEGER NOT NULL DEFAULT 0,
        fraud_reason TEXT,
        amenity_type TEXT NOT NULL DEFAULT 'individual',
        sla_deadline TEXT
    );

    CREATE TABLE IF NOT EXISTS request_upvotes (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(request_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS request_audit_logs (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        actor_id TEXT,
        actor_role TEXT,
        previous_status TEXT,
        new_status TEXT,
        note TEXT,
        client_ip TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL
    );

    -- Zero-Trust Immutable Audit Ledger: UPDATE and DELETE operations are strictly revoked
    CREATE TRIGGER IF NOT EXISTS prevent_audit_update
    BEFORE UPDATE ON request_audit_logs
    BEGIN
        SELECT RAISE(ABORT, 'IMMUTABLE_LOG_VIOLATION: UPDATE is strictly revoked on audit logs.');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
    BEFORE DELETE ON request_audit_logs
    BEGIN
        SELECT RAISE(ABORT, 'IMMUTABLE_LOG_VIOLATION: DELETE is strictly revoked on audit logs.');
    END;

    CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        posted_by TEXT NOT NULL,
        target_hostel TEXT NOT NULL DEFAULT 'All',
        target_batch TEXT NOT NULL DEFAULT 'All',
        target_branch TEXT NOT NULL DEFAULT 'All',
        actionable INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notice_reads (
        id TEXT PRIMARY KEY,
        notice_id TEXT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL,
        read_at TEXT NOT NULL,
        actioned INTEGER NOT NULL DEFAULT 0,
        actioned_at TEXT,
        UNIQUE(notice_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        present INTEGER NOT NULL,
        total INTEGER NOT NULL,
        percentage REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timetable (
        id TEXT PRIMARY KEY,
        hostel TEXT NOT NULL DEFAULT 'All',
        branch TEXT NOT NULL DEFAULT 'All',
        batch TEXT NOT NULL DEFAULT 'All',
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        subject TEXT NOT NULL,
        faculty TEXT NOT NULL,
        room TEXT NOT NULL,
        is_cancelled INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fees (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        term TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Paid', 'Pending', 'Overdue')),
        payment_date TEXT
    );

    CREATE TABLE IF NOT EXISTS mess_menu (
        id TEXT PRIMARY KEY,
        day_of_week TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        items TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mess_feedback (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        day TEXT NOT NULL,
        meal TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gate_logs (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        roll_no TEXT NOT NULL,
        hostel TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('Entry', 'Exit')),
        gate TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        room_number TEXT NOT NULL,
        hostel TEXT NOT NULL,
        floor INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        occupied_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        asset_name TEXT NOT NULL,
        serial_number TEXT,
        condition TEXT NOT NULL DEFAULT 'Good',
        status TEXT NOT NULL DEFAULT 'Operational'
    );

    CREATE INDEX IF NOT EXISTS idx_requests_student ON requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_hostel ON requests(hostel);
    CREATE INDEX IF NOT EXISTS idx_requests_type_cat ON requests(type, category);
    CREATE INDEX IF NOT EXISTS idx_audit_request ON request_audit_logs(request_id);
    CREATE INDEX IF NOT EXISTS idx_notice_reads_notice ON notice_reads(notice_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_upvotes_request ON request_upvotes(request_id);
    """);

    # Dynamic migrations for existing databases
    new_cols = [
        ("requests", "upvotes_count", "INTEGER NOT NULL DEFAULT 0"),
        ("requests", "escalation_level", "INTEGER NOT NULL DEFAULT 0"),
        ("requests", "escalation_target", "TEXT NOT NULL DEFAULT 'Warden'"),
        ("requests", "resolution_proof", "TEXT"),
        ("requests", "student_verified", "INTEGER NOT NULL DEFAULT 0"),
        ("requests", "student_verification_note", "TEXT"),
        ("requests", "proof_image_url", "TEXT"),
        ("requests", "vendor_invoice_or_slip", "TEXT"),
        ("requests", "fraud_flag", "INTEGER NOT NULL DEFAULT 0"),
        ("requests", "fraud_reason", "TEXT"),
        ("requests", "amenity_type", "TEXT NOT NULL DEFAULT 'individual'"),
        ("requests", "sla_deadline", "TEXT"),
        ("request_audit_logs", "actor_id", "TEXT"),
        ("request_audit_logs", "actor_role", "TEXT"),
        ("request_audit_logs", "client_ip", "TEXT"),
        ("request_audit_logs", "user_agent", "TEXT")
    ]
    for table, col, col_type in new_cols:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type};")
        except Exception:
            pass

    # Check if requests table needs schema migration for status CHECK constraint ('Pending Verification' and 'Closed')
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='requests';")
    row = cursor.fetchone()
    if row and "Pending Verification" not in row["sql"]:
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("DROP TRIGGER IF EXISTS prevent_audit_update;")
        cursor.execute("DROP TRIGGER IF EXISTS prevent_audit_delete;")
        cursor.execute("ALTER TABLE requests RENAME TO requests_old_mig;")
        cursor.execute("""
            CREATE TABLE requests (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL CHECK(type IN ('complaint', 'leave', 'document')),
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                student_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                hostel TEXT NOT NULL,
                room TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('Open', 'In Progress', 'Pending Verification', 'Approved', 'Rejected', 'Resolved', 'Closed', 'Escalated')),
                priority TEXT NOT NULL DEFAULT 'Medium',
                created_at TEXT NOT NULL,
                resolved_at TEXT,
                assigned_to TEXT,
                assigned_staff_name TEXT,
                escalated INTEGER NOT NULL DEFAULT 0,
                escalated_at TEXT,
                upvotes_count INTEGER NOT NULL DEFAULT 0,
                escalation_level INTEGER NOT NULL DEFAULT 0,
                escalation_target TEXT NOT NULL DEFAULT 'Warden',
                resolution_proof TEXT,
                student_verified INTEGER NOT NULL DEFAULT 0,
                student_verification_note TEXT,
                proof_image_url TEXT,
                vendor_invoice_or_slip TEXT,
                fraud_flag INTEGER NOT NULL DEFAULT 0,
                fraud_reason TEXT,
                amenity_type TEXT NOT NULL DEFAULT 'individual',
                sla_deadline TEXT
            );
        """)
        cursor.execute("PRAGMA table_info(requests_old_mig);")
        old_cols = [c[1] for c in cursor.fetchall()]
        cursor.execute("PRAGMA table_info(requests);")
        new_cols_names = [c[1] for c in cursor.fetchall()]
        common_cols = [c for c in old_cols if c in new_cols_names]
        cols_str = ", ".join(common_cols)
        cursor.execute(f"INSERT OR IGNORE INTO requests ({cols_str}) SELECT {cols_str} FROM requests_old_mig;")
        cursor.execute("DROP TABLE requests_old_mig;")
        cursor.execute("PRAGMA foreign_keys = ON;")

    # Check if request_audit_logs has stale FK reference
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='request_audit_logs';")
    audit_row = cursor.fetchone()
    if audit_row and "requests_old_mig" in audit_row["sql"]:
        cursor.execute("DROP TRIGGER IF EXISTS prevent_audit_update;")
        cursor.execute("DROP TRIGGER IF EXISTS prevent_audit_delete;")
        cursor.execute("DROP TABLE IF EXISTS request_audit_logs;")
        cursor.execute("""
            CREATE TABLE request_audit_logs (
                id TEXT PRIMARY KEY,
                request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                actor_name TEXT NOT NULL,
                actor_id TEXT,
                actor_role TEXT,
                previous_status TEXT,
                new_status TEXT,
                note TEXT,
                client_ip TEXT,
                user_agent TEXT,
                created_at TEXT NOT NULL
            );
        """)

    conn.commit()
    conn.close()

# Auto initialize database on module import
init_db()