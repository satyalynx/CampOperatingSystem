-- ====================================================================
-- CampOS — Campus Operating System: Production PostgreSQL Database Schema
-- Database schema for unified request tracking, SLAs, and operations
-- ====================================================================

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'warden', 'admin')),
    name TEXT NOT NULL,
    hostel TEXT,
    room TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STUDENTS ROSTER
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    roll_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    hostel TEXT NOT NULL,
    room TEXT NOT NULL,
    branch TEXT NOT NULL,
    batch TEXT NOT NULL,
    phone TEXT
);

-- 3. STAFF & WARDENS
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('warden', 'admin')),
    hostel TEXT,
    phone TEXT
);

-- 4. UNIFIED REQUEST ENTITY (Zero-Trust FSM Architecture)
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    assigned_to TEXT,
    assigned_staff_name TEXT,
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    upvotes_count INT NOT NULL DEFAULT 0,
    escalation_level INT NOT NULL DEFAULT 0,
    escalation_target TEXT NOT NULL DEFAULT 'Warden',
    resolution_proof TEXT,
    proof_image_url TEXT,
    vendor_invoice_or_slip TEXT,
    student_verified INT NOT NULL DEFAULT 0,
    student_verification_note TEXT,
    fraud_flag BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_reason TEXT,
    amenity_type TEXT NOT NULL DEFAULT 'individual',
    sla_deadline TIMESTAMPTZ
);

-- 5. IMMUTABLE REQUEST AUDIT LEDGER (Append-Only)
CREATE TABLE IF NOT EXISTS public.request_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_id TEXT,
    actor_role TEXT,
    previous_status TEXT,
    new_status TEXT,
    note TEXT,
    client_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Database Trigger: Strict Revocation of UPDATE and DELETE on Audit Logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'IMMUTABLE_LOG_VIOLATION: Audit logs are append-only. UPDATE and DELETE operations are strictly revoked.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_mutation ON public.request_audit_logs;
CREATE TRIGGER trg_prevent_audit_mutation
BEFORE UPDATE OR DELETE ON public.request_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 6. TARGETED NOTICES
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    posted_by TEXT NOT NULL,
    target_hostel TEXT NOT NULL DEFAULT 'All',
    target_batch TEXT NOT NULL DEFAULT 'All',
    target_branch TEXT NOT NULL DEFAULT 'All',
    actionable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. NOTICE READ & ACTION TRACKING
CREATE TABLE IF NOT EXISTS public.notice_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actioned BOOLEAN NOT NULL DEFAULT FALSE,
    actioned_at TIMESTAMPTZ,
    UNIQUE(notice_id, student_id)
);

-- 8. ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_code TEXT NOT NULL,
    present INT NOT NULL,
    total INT NOT NULL,
    percentage NUMERIC(5,2) NOT NULL
);

-- 9. TIMETABLE
CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel TEXT NOT NULL DEFAULT 'All',
    branch TEXT NOT NULL DEFAULT 'All',
    batch TEXT NOT NULL DEFAULT 'All',
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject TEXT NOT NULL,
    faculty TEXT NOT NULL,
    room TEXT NOT NULL,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10. FEES & DUES
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    term TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Paid', 'Pending', 'Overdue')),
    payment_date DATE
);

-- 11. MESS MENU & FEEDBACK
CREATE TABLE IF NOT EXISTS public.mess_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    items TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.mess_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    day TEXT NOT NULL,
    meal TEXT NOT NULL,
    rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. GATE ACCESS LOGS
CREATE TABLE IF NOT EXISTS public.gate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    hostel TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Entry', 'Exit')),
    gate TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remarks TEXT
);

-- 13. ROOMS & ASSETS
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT NOT NULL,
    hostel TEXT NOT NULL,
    floor INT NOT NULL,
    capacity INT NOT NULL,
    occupied_count INT NOT NULL DEFAULT 0,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    serial_number TEXT,
    condition TEXT NOT NULL DEFAULT 'Good',
    status TEXT NOT NULL DEFAULT 'Operational'
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_requests_student ON public.requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_hostel ON public.requests(hostel);
CREATE INDEX IF NOT EXISTS idx_requests_type_cat ON public.requests(type, category);
CREATE INDEX IF NOT EXISTS idx_audit_request ON public.request_audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_notice_reads_notice ON public.notice_reads(notice_id);
