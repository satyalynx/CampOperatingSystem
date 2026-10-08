import uuid
from datetime import datetime, timezone, timedelta
from database import get_db, init_db
from auth import hash_password

def seed_database():
    """
    Idempotent seed generator populating comprehensive demonstration data for CampOS:
    - Multiple student profiles across hostels & branches
    - Hostel Wardens and Chief Admin
    - Complaints, Leave/Gatepass and Document requests (Open, Resolved, Approved, Escalated)
    - Repeat Issues in Room 204 Plumbing
    - Deterministic precedent tickets for similar-ticket suggestions
    - Targeted notices with read and action acknowledgements
    - Academic attendance (including low-attendance indicator < 75%)
    - Timetable with class cancellation banner
    - Fee dues (Paid and Pending)
    - Weekly mess menu & student feedback
    - Campus gate entry/exit logs
    - Hostel rooms and asset registers
    """
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing records (temporarily disable audit triggers for administrative re-seed)
    cursor.execute("DROP TRIGGER IF EXISTS prevent_audit_delete;")
    cursor.execute("DROP TRIGGER IF EXISTS prevent_audit_update;")

    tables = [
        "assets", "rooms", "gate_logs", "mess_feedback", "mess_menu",
        "fees", "timetable", "attendance", "notice_reads", "notices",
        "request_audit_logs", "request_upvotes", "requests", "staff", "students", "users"
    ]
    for table in tables:
        cursor.execute(f"DELETE FROM {table};")

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    pwd_hash = hash_password("Password123!")

    # 1. USERS & PROFILES
    users_data = [
        # Students
        ("u-std-1", "rahul.verma@campos.edu", pwd_hash, "student", "Rahul Verma", "Girls Block A", "204"),
        ("u-std-2", "priya.sharma@campos.edu", pwd_hash, "student", "Priya Sharma", "Girls Block A", "204"),
        ("u-std-3", "amit.patel@campos.edu", pwd_hash, "student", "Amit Patel", "Boys Block B", "105"),
        ("u-std-4", "sneha.roy@campos.edu", pwd_hash, "student", "Sneha Roy", "Girls Block A", "302"),
        ("u-std-5", "rohan.das@campos.edu", pwd_hash, "student", "Rohan Das", "Boys Block B", "201"),
        # Staff
        ("u-stf-1", "warden.sharma@campos.edu", pwd_hash, "warden", "Warden Sharma", "Girls Block A", None),
        ("u-stf-2", "warden.mehta@campos.edu", pwd_hash, "warden", "Warden Mehta", "Boys Block B", None),
        ("u-stf-3", "admin@campos.edu", pwd_hash, "admin", "Dr. A. K. Satpathy (Dean/Chief Admin)", "All", None),
    ]
    cursor.executemany("""
        INSERT INTO users (id, email, password_hash, role, name, hostel, room, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, [(u[0], u[1], u[2], u[3], u[4], u[5], u[6], now_iso) for u in users_data])

    # 2. STUDENTS ROSTER
    students_data = [
        ("std-1", "u-std-1", "22CSE045", "Rahul Verma", "rahul.verma@campos.edu", "Girls Block A", "204", "CSE", "2022-2026", "+91 98765 11001"),
        ("std-2", "u-std-2", "22CSE046", "Priya Sharma", "priya.sharma@campos.edu", "Girls Block A", "204", "CSE", "2022-2026", "+91 98765 11002"),
        ("std-3", "u-std-3", "23MECH012", "Amit Patel", "amit.patel@campos.edu", "Boys Block B", "105", "MECH", "2023-2027", "+91 98765 11003"),
        ("std-4", "u-std-4", "23ECE088", "Sneha Roy", "sneha.roy@campos.edu", "Girls Block A", "302", "ECE", "2023-2027", "+91 98765 11004"),
        ("std-5", "u-std-5", "24CSE099", "Rohan Das", "rohan.das@campos.edu", "Boys Block B", "201", "CSE", "2024-2028", "+91 98765 11005"),
    ]
    cursor.executemany("""
        INSERT INTO students (id, user_id, roll_no, name, email, hostel, room, branch, batch, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, students_data)

    # 3. STAFF
    staff_data = [
        ("stf-1", "u-stf-1", "Warden Sharma", "warden.sharma@campos.edu", "warden", "Girls Block A", "+91 98765 43210"),
        ("stf-2", "u-stf-2", "Warden Mehta", "warden.mehta@campos.edu", "warden", "Boys Block B", "+91 98765 43211"),
        ("stf-3", "u-stf-3", "Dr. A. K. Satpathy", "admin@campos.edu", "admin", "All", "+91 98765 43212"),
    ]
    cursor.executemany("""
        INSERT INTO staff (id, user_id, name, email, role, hostel, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, staff_data)

    # 4. REQUESTS & AUDIT LOGS
    # Timing helpers
    t_3d_ago = (now - timedelta(days=3)).isoformat()
    t_2d_ago = (now - timedelta(days=2)).isoformat()
    t_1d_ago = (now - timedelta(days=1)).isoformat()
    t_8h_ago = (now - timedelta(hours=8)).isoformat()
    t_3h_ago = (now - timedelta(hours=3)).isoformat()
    t_30m_ago = (now - timedelta(minutes=30)).isoformat()

    requests_seed = [
        # Req 1: Room 204 Plumbing - Breached 48h SLA -> Escalated to Tier 2 (Dean of Student Affairs)
        ("req-01", "complaint", "Plumbing", "Water Tap Dripping Continuously",
         "The washbasin tap in room 204 drips continuously causing water wastage and noise.",
         "std-1", "Rahul Verma", "Girls Block A", "204", "Escalated", "High",
         t_3d_ago, None, "stf-1", "Warden Sharma", 1, (now - timedelta(hours=24)).isoformat(),
         3, 2, "Dean of Student Affairs", None, 0, None,
         None, None, 0, None, "individual", (now - timedelta(hours=24)).isoformat()),

        # Req 2: Room 204 Plumbing - Active Open Complaint (Flags Repeat Issue with Req 1 & 3!)
        ("req-02", "complaint", "Plumbing", "Flush Valve Handle Jammed",
         "Toilet flush handle in room 204 stuck. Requires plumbing replacement.",
         "std-2", "Priya Sharma", "Girls Block A", "204", "Open", "Medium",
         t_8h_ago, None, "stf-1", "Warden Sharma", 0, None,
         1, 0, "Warden", None, 0, None,
         None, None, 0, None, "individual", (now + timedelta(hours=40)).isoformat()),

        # Req 3: Room 204 Plumbing - Closed with verified proof & student verified
        ("req-03", "complaint", "Plumbing", "Main Pipeline Leakage Under Sink",
         "Pipe joint under sink was spraying water.",
         "std-2", "Priya Sharma", "Girls Block A", "204", "Closed", "High",
         t_3d_ago, t_1d_ago, "stf-1", "Warden Sharma", 0, None,
         0, 0, "Warden", "Apex Plumbers replaced rubber washer & brass spindle (Work Order #WO-4102)", 1, "Verified dry and fully operational by student",
         "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80", "https://storage.campos.edu/invoices/inv-4102.pdf", 0, None, "individual", t_1d_ago),

        # Req 4: Room 105 Electrical - Open High Priority
        ("req-04", "complaint", "Electrical", "Ceiling Fan Regulator Sparking",
         "Speed regulator sparks when turned to speed 3. Fire safety hazard.",
         "std-3", "Amit Patel", "Boys Block B", "105", "Open", "High",
         t_8h_ago, None, "stf-2", "Warden Mehta", 0, None,
         0, 0, "Warden", None, 0, None,
         None, None, 0, None, "individual", (now + timedelta(hours=40)).isoformat()),

        # Req 5: Internet/WiFi - Closed precedent for WiFi tickets
        ("req-05", "complaint", "Internet/WiFi", "Hostel WiFi Access Point Dropping Packets",
         "AP 2B in hallway keeps disconnecting devices every 5 minutes.",
         "std-5", "Rohan Das", "Boys Block B", "201", "Closed", "Medium",
         t_2d_ago, t_1d_ago, "stf-2", "Warden Mehta", 0, None,
         2, 0, "Warden", "Replaced faulty Cisco Catalyst POE injector on 2nd floor switch rack", 1, "Speed test normal (95 Mbps) verified",
         "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80", None, 0, None, "shared_amenity", t_1d_ago),

        # Req 6: Leave / Gatepass - Approved with QR Verification
        ("req-06", "leave", "Outing", "Weekend Family Visit",
         "Visiting hometown over the weekend. Train departs Friday 6:30 PM.",
         "std-1", "Rahul Verma", "Girls Block A", "204", "Approved", "Medium",
         t_1d_ago, (now - timedelta(hours=20)).isoformat(), "stf-1", "Warden Sharma", 0, None,
         0, 0, "Warden", None, 0, None,
         None, None, 0, None, "individual", (now - timedelta(hours=22)).isoformat()),

        # Req 7: Leave / Gatepass - Breached 2h SLA -> Escalated to Tier 1 (Chief Warden)
        ("req-07", "leave", "Emergency", "Urgent Dental Hospital Appointment",
         "Severe toothache, scheduled dentist consultation in city center.",
         "std-3", "Amit Patel", "Boys Block B", "105", "Escalated", "High",
         t_3h_ago, None, "stf-2", "Warden Mehta", 1, (now - timedelta(hours=1)).isoformat(),
         0, 1, "Chief Warden / Campus Supervisor", None, 0, None,
         None, None, 0, None, "individual", (now - timedelta(hours=1)).isoformat()),

        # Req 8: Document Request - Bonafide Certificate (In Progress)
        ("req-08", "document", "Bonafide", "Bonafide Certificate for National Scholarship Portal",
         "Application for NSP scholarship 2026. Required before 15th.",
         "std-2", "Priya Sharma", "Girls Block A", "204", "In Progress", "Medium",
         t_1d_ago, None, "stf-3", "Dr. A. K. Satpathy", 0, None,
         0, 0, "Staff", None, 0, None,
         None, None, 0, None, "individual", (now + timedelta(hours=48)).isoformat()),

        # Req 9: Document Request - Breached 72h SLA -> Escalated to Tier 2 (Dean of Student Affairs)
        ("req-09", "document", "Character Certificate", "Character Certificate for Internship Verification",
         "Required by summer research internship committee at IIT.",
         "std-5", "Rohan Das", "Boys Block B", "201", "Escalated", "High",
         (now - timedelta(days=4)).isoformat(), None, "stf-3", "Dr. A. K. Satpathy", 1, (now - timedelta(hours=12)).isoformat(),
         0, 2, "Dean of Student Affairs", None, 0, None,
         None, None, 0, None, "individual", (now - timedelta(hours=24)).isoformat()),

        # Req 10: Document Request - Closed Precedent
        ("req-10", "document", "Transcript", "Official Grade Transcript Semester 1-4",
         "Required for foreign university exchange program application.",
         "std-4", "Sneha Roy", "Girls Block A", "302", "Closed", "Low",
         (now - timedelta(days=5)).isoformat(), (now - timedelta(days=2)).isoformat(), "stf-3", "Dr. A. K. Satpathy", 0, None,
         0, 0, "Staff", "Official physical transcript sealed and archived with Registrar ref #REG-2026-901", 1, "Received official transcript copy",
         "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80", None, 0, None, "individual", (now - timedelta(days=2)).isoformat()),

        # Req 11: Canteen Facility Complaint with Community Upvotes & Compressed SLA
        ("req-11", "complaint", "Canteen", "Drinking Water Cooler Dispensing Muddy Water",
         "Water filter unit on 1st floor dining area dispensing discolored water. Over 150 students affected.",
         "std-2", "Priya Sharma", "Girls Block A", "Canteen", "Open", "Critical",
         t_8h_ago, None, "stf-1", "Warden Sharma", 0, None,
         5, 0, "Warden", None, 0, None,
         None, None, 0, None, "shared_amenity", (now + timedelta(hours=2)).isoformat()),

        # Req 12: Complaint with Proof Submitted -> In 'Pending Verification' (Awaiting Rahul Verma's confirmation)
        ("req-12", "complaint", "Electrical", "Corridor Emergency Light Replacement",
         "Tube light outside room 204 replaced.",
         "std-1", "Rahul Verma", "Girls Block A", "204", "Pending Verification", "Medium",
         t_1d_ago, None, "stf-1", "Warden Sharma", 0, None,
         0, 0, "Warden", "Installed Philips 20W LED batten under maintenance ticket #WO-7719. Corridors verified adequately illuminated.", 0, None,
         "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=400&q=80", "https://storage.campos.edu/slips/wo-7719.pdf", 0, None, "individual", (now + timedelta(hours=24)).isoformat()),

        # Req 13: Fraudulent Resolution Flagged -> Direct Level 3 Escalation to Dean / Director!
        ("req-13", "complaint", "Sanitation", "Overflowing Sewage Drain Near Wing C",
         "Main drain line backing up near laundry area. Unsanitary stench.",
         "std-3", "Amit Patel", "Boys Block B", "Wing C", "Escalated", "Critical",
         t_2d_ago, None, "stf-2", "Warden Mehta", 1, t_8h_ago,
         2, 3, "Dean / Director of Campus Operations", "Contractor claimed drain cleared", -1, "FRAUDULENT PROOF: Contractor submitted photo of a different block. Sewage still flowing.",
         "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=400&q=80", None, 1, "FRAUDULENT PROOF: Contractor submitted photo of a different block. Sewage still flowing.", "shared_amenity", t_1d_ago)
    ]

    cursor.executemany("""
        INSERT INTO requests (
            id, type, category, title, description,
            student_id, student_name, hostel, room,
            status, priority, created_at, resolved_at,
            assigned_to, assigned_staff_name, escalated, escalated_at,
            upvotes_count, escalation_level, escalation_target,
            resolution_proof, student_verified, student_verification_note,
            proof_image_url, vendor_invoice_or_slip, fraud_flag,
            fraud_reason, amenity_type, sla_deadline
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, requests_seed)

    # Immutable Audit Ledger with Client IP & User Agent
    audit_seed = [
        (str(uuid.uuid4()), "req-01", "CREATED_COMPLAINT", "Rahul Verma", "std-1", "student", None, "Open", "Ticket created by student", "192.168.1.104", "CampOS-Web/Student", t_3d_ago),
        (str(uuid.uuid4()), "req-01", "STUDENT_COMMUNITY_UPVOTE", "Sneha Roy", "std-4", "student", "Open", "Open", "Upvoted by community members (Total: 3). SLA compressed.", "192.168.1.112", "CampOS-Web/Student", (now - timedelta(days=2)).isoformat()),
        (str(uuid.uuid4()), "req-01", "AUTO_ESCALATED_L1_CHIEF_WARDEN", "CampOS SLA Daemon", "daemon-sla-worker", "system_daemon", "Open", "Escalated", "Breached resolution window. Escalated to Chief Warden.", "127.0.0.1 (Internal Daemon)", "CampOS-SLA-Daemon/2.0", (now - timedelta(hours=36)).isoformat()),
        (str(uuid.uuid4()), "req-01", "AUTO_ESCALATED_L2_DEAN", "CampOS SLA Daemon", "daemon-sla-worker", "system_daemon", "Escalated", "Escalated", "Tier 1 window expired. Escalated to Dean of Student Affairs.", "127.0.0.1 (Internal Daemon)", "CampOS-SLA-Daemon/2.0", (now - timedelta(hours=24)).isoformat()),
        (str(uuid.uuid4()), "req-02", "CREATED_COMPLAINT", "Priya Sharma", "std-2", "student", None, "Open", "Ticket created by student", "192.168.1.105", "CampOS-Web/Student", t_8h_ago),
        (str(uuid.uuid4()), "req-03", "CREATED_COMPLAINT", "Priya Sharma", "std-2", "student", None, "Open", "Plumbing leak reported", "192.168.1.105", "CampOS-Web/Student", t_3d_ago),
        (str(uuid.uuid4()), "req-03", "PROOF_SUBMITTED", "Warden Sharma", "stf-1", "warden", "In Progress", "Pending Verification", "Staff submitted verified proof payload: Apex Plumbers replaced washer & spindle. Work Order #WO-4102.", "192.168.1.10", "CampOS-Web/Staff", t_1d_ago),
        (str(uuid.uuid4()), "req-03", "STUDENT_ACCEPTED_CLOSURE", "Priya Sharma", "std-2", "student", "Pending Verification", "Closed", "Resolution Verified & Closed by Student: Verified dry and fully operational.", "192.168.1.105", "CampOS-Web/Student", (now - timedelta(hours=20)).isoformat()),
        (str(uuid.uuid4()), "req-04", "CREATED_COMPLAINT", "Amit Patel", "std-3", "student", None, "Open", "Regulator sparking reported", "192.168.1.108", "CampOS-Web/Student", t_8h_ago),
        (str(uuid.uuid4()), "req-05", "CREATED_COMPLAINT", "Rohan Das", "std-5", "student", None, "Open", "WiFi AP issue reported", "192.168.1.109", "CampOS-Web/Student", t_2d_ago),
        (str(uuid.uuid4()), "req-05", "PROOF_SUBMITTED", "Warden Mehta", "stf-2", "warden", "In Progress", "Pending Verification", "Replaced faulty Cisco Catalyst POE injector on 2nd floor rack.", "192.168.1.12", "CampOS-Web/Staff", t_1d_ago),
        (str(uuid.uuid4()), "req-05", "STUDENT_ACCEPTED_CLOSURE", "Rohan Das", "std-5", "student", "Pending Verification", "Closed", "Student confirmed resolution: Speed test normal (95 Mbps).", "192.168.1.109", "CampOS-Web/Student", (now - timedelta(hours=18)).isoformat()),
        (str(uuid.uuid4()), "req-06", "CREATED_LEAVE", "Rahul Verma", "std-1", "student", None, "Open", "Gatepass request submitted", "192.168.1.104", "CampOS-Web/Student", t_1d_ago),
        (str(uuid.uuid4()), "req-06", "LEAVE_PASS_APPROVED", "Warden Sharma", "stf-1", "warden", "Open", "Approved", "Parental confirmation verified via telephone. Digital QR pass activated.", "192.168.1.10", "CampOS-Web/Staff", (now - timedelta(hours=20)).isoformat()),
        (str(uuid.uuid4()), "req-07", "CREATED_LEAVE", "Amit Patel", "std-3", "student", None, "Open", "Emergency medical pass requested", "192.168.1.108", "CampOS-Web/Student", t_3h_ago),
        (str(uuid.uuid4()), "req-07", "AUTO_ESCALATED_L1_CHIEF_WARDEN", "CampOS SLA Daemon", "daemon-sla-worker", "system_daemon", "Open", "Escalated", "Leave request pending past 2h SLA threshold. Escalated to Chief Warden / Campus Supervisor.", "127.0.0.1 (Internal Daemon)", "CampOS-SLA-Daemon/2.0", (now - timedelta(hours=1)).isoformat()),
        (str(uuid.uuid4()), "req-08", "CREATED_DOCUMENT", "Priya Sharma", "std-2", "student", None, "Open", "Bonafide requested", "192.168.1.105", "CampOS-Web/Student", t_1d_ago),
        (str(uuid.uuid4()), "req-08", "TRIAGE_IN_PROGRESS", "Dr. A. K. Satpathy", "stf-3", "admin", "Open", "In Progress", "Verification in progress with registrar database.", "192.168.1.2", "CampOS-Web/Admin", t_8h_ago),
        (str(uuid.uuid4()), "req-09", "CREATED_DOCUMENT", "Rohan Das", "std-5", "student", None, "Open", "Character certificate requested", "192.168.1.109", "CampOS-Web/Student", (now - timedelta(days=4)).isoformat()),
        (str(uuid.uuid4()), "req-09", "AUTO_ESCALATED_L2_DEAN", "CampOS SLA Daemon", "daemon-sla-worker", "system_daemon", "Open", "Escalated", "Document unactioned after 72 hours. Escalated to Dean of Student Affairs.", "127.0.0.1 (Internal Daemon)", "CampOS-SLA-Daemon/2.0", (now - timedelta(hours=12)).isoformat()),
        (str(uuid.uuid4()), "req-10", "CREATED_DOCUMENT", "Sneha Roy", "std-4", "student", None, "Open", "Official transcript requested", "192.168.1.112", "CampOS-Web/Student", (now - timedelta(days=5)).isoformat()),
        (str(uuid.uuid4()), "req-10", "PROOF_SUBMITTED", "Dr. A. K. Satpathy", "stf-3", "admin", "In Progress", "Pending Verification", "Transcript sealed and dispatched with Registrar ref #REG-2026-901.", "192.168.1.2", "CampOS-Web/Admin", (now - timedelta(days=2)).isoformat()),
        (str(uuid.uuid4()), "req-10", "STUDENT_ACCEPTED_CLOSURE", "Sneha Roy", "std-4", "student", "Pending Verification", "Closed", "Student confirmed delivery.", "192.168.1.112", "CampOS-Web/Student", (now - timedelta(days=2)).isoformat()),
        (str(uuid.uuid4()), "req-11", "CREATED_COMPLAINT", "Priya Sharma", "std-2", "student", None, "Open", "Canteen water cooler reported", "192.168.1.105", "CampOS-Web/Student", t_8h_ago),
        (str(uuid.uuid4()), "req-11", "STUDENT_COMMUNITY_UPVOTE", "Campus Body", "std-3", "student", "Open", "Open", "Upvote velocity trigger: 5 students upvoted. Priority accelerated to Critical, SLA set to 6h floor.", "192.168.1.108", "CampOS-Web/Student", (now - timedelta(hours=4)).isoformat()),
        (str(uuid.uuid4()), "req-12", "CREATED_COMPLAINT", "Rahul Verma", "std-1", "student", None, "Open", "Corridor emergency light reported", "192.168.1.104", "CampOS-Web/Student", t_1d_ago),
        (str(uuid.uuid4()), "req-12", "PROOF_SUBMITTED", "Warden Sharma", "stf-1", "warden", "In Progress", "Pending Verification", "Staff submitted verified proof: Installed Philips 20W LED batten under maintenance ticket #WO-7719. Corridors verified illuminated.", "192.168.1.10", "CampOS-Web/Staff", (now - timedelta(hours=2)).isoformat()),
        (str(uuid.uuid4()), "req-13", "CREATED_COMPLAINT", "Amit Patel", "std-3", "student", None, "Open", "Sewage drain reported", "192.168.1.108", "CampOS-Web/Student", t_2d_ago),
        (str(uuid.uuid4()), "req-13", "PROOF_SUBMITTED", "Warden Mehta", "stf-2", "warden", "In Progress", "Pending Verification", "Contractor claimed drain cleared.", "192.168.1.12", "CampOS-Web/Staff", t_12h_ago if 't_12h_ago' in locals() else (now - timedelta(hours=12)).isoformat()),
        (str(uuid.uuid4()), "req-13", "FRAUDULENT_RESOLUTION_ATTEMPT", "Amit Patel", "std-3", "student", "Pending Verification", "Escalated", "FRAUD FLAGGED BY STUDENT: Contractor submitted photo of a different block. Sewage still flowing. Auto-escalated to Level 3 (Dean / Director).", "192.168.1.108", "CampOS-Web/Student", t_8h_ago)
    ]
    cursor.executemany("""
        INSERT INTO request_audit_logs (id, request_id, action, actor_name, actor_id, actor_role, previous_status, new_status, note, client_ip, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, audit_seed)

    # 5. NOTICES
    notices_seed = [
        ("not-01", "BPUT Annual Innovation & Hackathon 2026 Registration Open",
         "Teams are invited to register for Problem Statement 07: Campus Life Debugged. Submissions close on 15th October.",
         "Dean Academic Affairs", "All", "All", "All", 1, t_2d_ago),

        ("not-02", "Girls Block A: Overhead Water Tank Disinfection Notice",
         "Water supply will be suspended between 9:00 AM and 1:00 PM tomorrow due to bi-monthly overhead tank chlorination.",
         "Warden Sharma", "Girls Block A", "All", "All", 0, t_1d_ago),

        ("not-03", "CSE 2022-2026 Batch: Final Capstone Topic Submission",
         "All 7th semester students must submit capstone project abstracts on the portal by Friday 5 PM.",
         "HOD Computer Science", "All", "2022-2026", "CSE", 1, t_8h_ago)
    ]
    cursor.executemany("""
        INSERT INTO notices (id, title, body, posted_by, target_hostel, target_batch, target_branch, actionable, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, notices_seed)

    # 6. NOTICE READS & ACTIONS
    notice_reads_seed = [
        (str(uuid.uuid4()), "not-01", "std-1", t_1d_ago, 1, t_8h_ago),
        (str(uuid.uuid4()), "not-01", "std-2", t_1d_ago, 0, None),
        (str(uuid.uuid4()), "not-01", "std-3", t_8h_ago, 1, t_30m_ago),
        (str(uuid.uuid4()), "not-02", "std-1", t_8h_ago, 0, None),
        (str(uuid.uuid4()), "not-02", "std-2", t_8h_ago, 0, None),
        (str(uuid.uuid4()), "not-03", "std-1", t_30m_ago, 1, t_30m_ago),
        (str(uuid.uuid4()), "not-03", "std-2", t_30m_ago, 0, None),
    ]
    cursor.executemany("""
        INSERT INTO notice_reads (id, notice_id, student_id, read_at, actioned, actioned_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, notice_reads_seed)

    # 7. ATTENDANCE (Including low attendance < 75% for Rahul Verma)
    attendance_seed = [
        (str(uuid.uuid4()), "std-1", "Design & Analysis of Algorithms", "CS501", 38, 40, 95.0),
        (str(uuid.uuid4()), "std-1", "Database Engineering", "CS502", 33, 36, 91.7),
        (str(uuid.uuid4()), "std-1", "Computer Networks", "CS503", 22, 32, 68.8), # Alert < 75%
        (str(uuid.uuid4()), "std-1", "Operating Systems Internals", "CS504", 29, 30, 96.7),
        (str(uuid.uuid4()), "std-2", "Design & Analysis of Algorithms", "CS501", 36, 40, 90.0),
        (str(uuid.uuid4()), "std-2", "Computer Networks", "CS503", 28, 32, 87.5),
    ]
    cursor.executemany("""
        INSERT INTO attendance (id, student_id, subject, subject_code, present, total, percentage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, attendance_seed)

    # 8. TIMETABLE (Including cancelled class banner demonstration)
    timetable_seed = [
        (str(uuid.uuid4()), "All", "CSE", "2022-2026", "Thursday", "09:00 AM", "10:00 AM", "Algorithms (CS501)", "Prof. P. K. Sen", "Room 304", 0),
        (str(uuid.uuid4()), "All", "CSE", "2022-2026", "Thursday", "10:15 AM", "11:15 AM", "Operating Systems (CS504)", "Dr. S. Mishra", "CS Lab 2", 0),
        (str(uuid.uuid4()), "All", "CSE", "2022-2026", "Thursday", "11:30 AM", "12:30 PM", "Database Engineering (CS502)", "Prof. R. Rao", "Lecture Hall 2", 1), # Cancelled!
        (str(uuid.uuid4()), "All", "CSE", "2022-2026", "Thursday", "02:00 PM", "04:00 PM", "Networks Simulation Lab", "Prof. Sen & Tech Team", "Networking Lab", 0),
    ]
    cursor.executemany("""
        INSERT INTO timetable (id, hostel, branch, batch, day_of_week, start_time, end_time, subject, faculty, room, is_cancelled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, timetable_seed)

    # 9. FEES & DUES
    fees_seed = [
        (str(uuid.uuid4()), "std-1", "Academic Tuition Fee - Autumn 2026", 45000.0, "2026-08-15", "Paid", "2026-08-10"),
        (str(uuid.uuid4()), "std-1", "Hostel & Mess Dues - Term II", 28500.0, "2026-11-15", "Pending", None),
        (str(uuid.uuid4()), "std-2", "Academic Tuition Fee - Autumn 2026", 45000.0, "2026-08-15", "Paid", "2026-08-12"),
        (str(uuid.uuid4()), "std-3", "Hostel & Mess Dues - Term II", 28500.0, "2026-10-01", "Overdue", None),
    ]
    cursor.executemany("""
        INSERT INTO fees (id, student_id, term, amount, due_date, status, payment_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, fees_seed)

    # 10. MESS MENU & FEEDBACK
    menu_seed = [
        (str(uuid.uuid4()), "Monday", "Breakfast", "Puri Sabzi, Banana, Boiled Eggs, Tea / Milk"),
        (str(uuid.uuid4()), "Monday", "Lunch", "Steamed Rice, Dal Makhani, Mixed Veg, Curd, Papad"),
        (str(uuid.uuid4()), "Monday", "Snacks", "Veg Samosa, Green Chutney, Masala Chai"),
        (str(uuid.uuid4()), "Monday", "Dinner", "Roti, Paneer Butter Masala / Chicken Curry, Jeera Rice, Gulab Jamun"),
        (str(uuid.uuid4()), "Thursday", "Breakfast", "Masala Dosa, Sambar, Coconut Chutney, Coffee"),
        (str(uuid.uuid4()), "Thursday", "Lunch", "Veg Biryani / Egg Biryani, Mirchi Ka Salan, Raita, Salad"),
        (str(uuid.uuid4()), "Thursday", "Snacks", "Aloo Bonda, Filter Coffee"),
        (str(uuid.uuid4()), "Thursday", "Dinner", "Phulka, Dal Tadka, Seasonal Bhindi Fry, Kheer"),
    ]
    cursor.executemany("""
        INSERT INTO mess_menu (id, day_of_week, meal_type, items)
        VALUES (?, ?, ?, ?)
    """, menu_seed)

    mess_feedback_seed = [
        (str(uuid.uuid4()), "std-1", "Rahul Verma", "Monday", "Dinner", 4, "Paneer quality was fresh and tasty.", t_2d_ago),
        (str(uuid.uuid4()), "std-2", "Priya Sharma", "Thursday", "Breakfast", 5, "Crispy dosas and authentic sambar.", t_8h_ago),
        (str(uuid.uuid4()), "std-3", "Amit Patel", "Wednesday", "Lunch", 2, "Dal was excessively watery. Salt level high.", t_1d_ago),
    ]
    cursor.executemany("""
        INSERT INTO mess_feedback (id, student_id, student_name, day, meal, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, mess_feedback_seed)

    # 11. GATE LOGS
    gate_logs_seed = [
        (str(uuid.uuid4()), "std-1", "Rahul Verma", "22CSE045", "Girls Block A", "Exit", "Campus Main Gate 1", t_1d_ago, "Weekend home pass verified with QR scan"),
        (str(uuid.uuid4()), "std-1", "Rahul Verma", "22CSE045", "Girls Block A", "Entry", "Campus Main Gate 1", t_8h_ago, "Returned on time"),
        (str(uuid.uuid4()), "std-3", "Amit Patel", "23MECH012", "Boys Block B", "Exit", "North Hostel Turnstile", t_3h_ago, "Medical visit"),
    ]
    cursor.executemany("""
        INSERT INTO gate_logs (id, student_id, student_name, roll_no, hostel, type, gate, timestamp, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, gate_logs_seed)

    # 12. ROOMS & ASSETS
    rooms_seed = [
        ("room-204", "204", "Girls Block A", 2, 3, 2, "Contains recurring plumbing complaints; flagged for facility audit"),
        ("room-302", "302", "Girls Block A", 3, 2, 1, "Good condition, renovated August 2025"),
        ("room-105", "105", "Boys Block B", 1, 2, 2, "Regulator replacement scheduled"),
        ("room-201", "201", "Boys Block B", 2, 3, 3, "Fully occupied"),
    ]
    cursor.executemany("""
        INSERT INTO rooms (id, room_number, hostel, floor, capacity, occupied_count, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, rooms_seed)

    assets_seed = [
        (str(uuid.uuid4()), "room-204", "Ceiling Fan (Usha 1200mm)", "FAN-204-A", "Good", "Operational"),
        (str(uuid.uuid4()), "room-204", "Water Basin Tap (Jaguar Brass)", "PLM-204-B", "Needs Repair", "Dripping"),
        (str(uuid.uuid4()), "room-105", "Speed Regulator (Anchor Roma)", "REG-105-A", "Faulty", "Sparking"),
        (str(uuid.uuid4()), "room-105", "Study Tables & Chairs (Godrej)", "FURN-105-B", "Good", "Operational"),
    ]
    cursor.executemany("""
        INSERT INTO assets (id, room_id, asset_name, serial_number, condition, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, assets_seed)

    # Re-enable Zero-Trust Immutable Audit Ledger triggers
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS prevent_audit_update
        BEFORE UPDATE ON request_audit_logs
        BEGIN
            SELECT RAISE(ABORT, 'IMMUTABLE_LOG_VIOLATION: UPDATE is strictly revoked on audit logs.');
        END;
    """)
    cursor.execute("""
        CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
        BEFORE DELETE ON request_audit_logs
        BEGIN
            SELECT RAISE(ABORT, 'IMMUTABLE_LOG_VIOLATION: DELETE is strictly revoked on audit logs.');
        END;
    """)

    conn.commit()
    conn.close()
    print("[Seed Engine] Database successfully initialized with comprehensive CampOS demonstration dataset.")

if __name__ == "__main__":
    seed_database()
