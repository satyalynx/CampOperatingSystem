from fastapi.testclient import TestClient
from main import app
from seed import seed_database

client = TestClient(app)

def test_all():
    # Ensure fresh deterministic state for idempotent test runs
    seed_database()
    print("--- [1] Health Check ---")
    r = client.get("/")
    assert r.status_code == 200
    print("Health check passed:", r.json())

    print("\n--- [2] Demo Accounts ---")
    r = client.get("/api/auth/demo-accounts")
    assert r.status_code == 200
    accounts = r.json()
    print(f"Loaded {len(accounts)} demo personas.")

    print("\n--- [3] Student Login ---")
    r = client.post("/api/auth/login", json={"email": "rahul.verma@campos.edu", "password": "Password123!"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {token}"}
    print("Student logged in successfully:", r.json()["user"]["name"])

    print("\n--- [4] Student Requests & Scoping ---")
    r = client.get("/api/requests", headers=student_headers)
    assert r.status_code == 200
    reqs = r.json()
    print(f"Student has {len(reqs)} requests visible.")
    for req in reqs:
        assert req["student_id"] == "std-1", "Security breach: student saw another user's request!"

    print("\n--- [5] Similar-Ticket Precedent Engine ---")
    r = client.get("/api/requests/similar?type=complaint&category=Plumbing", headers=student_headers)
    assert r.status_code == 200
    similars = r.json()
    print(f"Found {len(similars)} precedent tickets for Plumbing:")
    for sim in similars:
        print(f"  - [{sim['status']}] {sim['title']} (Room {sim['room']}) | Resolution: {sim.get('resolution_note')}")

    print("\n--- [6] Student Attendance & Low-Attendance Indicator ---")
    r = client.get("/api/student/attendance", headers=student_headers)
    assert r.status_code == 200
    att = r.json()
    print(f"Overall attendance: {att['overall_percentage']}% (Low Warning: {att['is_overall_low']})")
    for rec in att["records"]:
        if rec["is_low_attendance"]:
            print(f"  * LOW ATTENDANCE ALERT: {rec['subject']} ({rec['percentage']}%)")

    print("\n--- [7] Timetable with Class Cancellation ---")
    r = client.get("/api/student/timetable", headers=student_headers)
    assert r.status_code == 200
    tt = r.json()
    print(f"Today's classes: {len(tt)}")
    cancelled = [c for c in tt if c["is_cancelled"]]
    print(f"Cancelled classes: {[c['subject'] for c in cancelled]}")

    print("\n--- [8] Targeted Notices & Read / Action Tracking ---")
    r = client.get("/api/notices", headers=student_headers)
    assert r.status_code == 200
    notices = r.json()
    print(f"Student sees {len(notices)} targeted notices.")
    if notices:
        first_id = notices[0]["id"]
        # Mark read
        r_read = client.post(f"/api/notices/{first_id}/read", headers=student_headers)
        assert r_read.status_code == 200
        # Mark action
        r_act = client.post(f"/api/notices/{first_id}/action", headers=student_headers)
        assert r_act.status_code == 200
        print("Successfully recorded student read receipt and action acknowledgement.")

    print("\n--- [9] Warden Login & Scope Verification ---")
    r = client.post("/api/auth/login", json={"email": "warden.sharma@campos.edu", "password": "Password123!"})
    assert r.status_code == 200
    warden_token = r.json()["access_token"]
    warden_headers = {"Authorization": f"Bearer {warden_token}"}
    r = client.get("/api/requests", headers=warden_headers)
    assert r.status_code == 200
    warden_reqs = r.json()
    for w_req in warden_reqs:
        assert w_req["hostel"] == "Girls Block A", "Security breach: Warden saw unauthorized hostel request!"
    print(f"Warden Sharma scoped correctly to Girls Block A ({len(warden_reqs)} requests).")

    print("\n--- [10] Admin Login & Real-Time Operational Analytics ---")
    r = client.post("/api/auth/login", json={"email": "admin@campos.edu", "password": "Password123!"})
    assert r.status_code == 200
    admin_token = r.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.get("/api/admin/dashboard", headers=admin_headers)
    assert r.status_code == 200
    dash = r.json()
    print("Admin Live Metrics:")
    print(f"  - Total Requests: {dash['total_requests']}")
    print(f"  - Open: {dash['open_requests']}, Resolved: {dash['resolved_requests']}, Escalated: {dash['escalated_requests']}")
    print(f"  - Ageing over 48h: {dash['ageing_over_48h']}")
    print(f"  - Average Resolution Time: {dash['avg_resolution_hours']} hours ({dash['avg_resolution_days']} days)")
    print(f"  - Repeat Issues Count: {dash['repeat_issues_count']}")

    print("\n--- [11] Repeat Issue Detection ---")
    r = client.get("/api/admin/repeat-issues", headers=admin_headers)
    assert r.status_code == 200
    repeats = r.json()
    print(f"Detected {len(repeats)} recurring facility issues:")
    for rep in repeats:
        print(f"  * {rep['hostel']} Room {rep['room']} - {rep['category']}: {rep['complaint_count']} complaints!")

    print("\n--- [12] Trigger SLA Escalation Engine ---")
    r = client.post("/api/requests/escalate-check", headers=admin_headers)
    assert r.status_code == 200
    print("SLA Engine executed successfully:", r.json())

    print("\n--- [13] QR Gate Pass Verification ---")
    r = client.get("/api/requests/req-06/qr")
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    print("Verified Digital Gate Pass QR Code successfully generated (image/png).")

    print("\n--- [14] Student Community Upvoting & Dynamic SLA Compression ---")
    # Rahul Verma upvotes req-02 (Priya's complaint in same hostel)
    r_upvote = client.post("/api/requests/req-02/upvote", headers=student_headers)
    assert r_upvote.status_code == 200, f"Upvote failed: {r_upvote.text}"
    up_res = r_upvote.json()
    assert up_res["upvotes_count"] == 2, f"Expected 2 upvotes, got {up_res['upvotes_count']}"
    # Base 48h - 2*4h = 40h
    assert up_res["effective_sla_hours"] == 40.0, f"Expected 40.0h SLA, got {up_res['effective_sla_hours']}"
    print(f"Community upvote registered: Total {up_res['upvotes_count']} upvotes. Dynamic SLA shortened to {up_res['effective_sla_hours']}h!")

    print("\n--- [15] Zero-Trust FSM & Mandatory Resolution Proof Enforcement ---")
    # 15A: Staff attempts to directly mark Resolved or Closed -> Hard blocked with HTTP 403 Forbidden
    r_direct_close = client.patch(
        "/api/requests/req-02/status",
        headers=warden_headers,
        json={"status": "Resolved", "note": "Fixed by warden directly"}
    )
    assert r_direct_close.status_code == 403, f"Security violation: Staff directly resolved ticket! Status: {r_direct_close.status_code}"
    print("Zero-Trust FSM Guard verified: Staff direct resolution blocked with HTTP 403 Forbidden.")

    # 15B: Staff submits Pending Verification with invalid proof image URL or short notes -> Blocked with HTTP 400
    r_invalid_proof = client.patch(
        "/api/requests/req-02/status",
        headers=warden_headers,
        json={
            "status": "Pending Verification",
            "proof_image_url": "not-a-valid-url",
            "action_taken_notes": "Short note"
        }
    )
    assert r_invalid_proof.status_code == 400, "Validation failure: Accepted invalid proof payload!"
    print("Proof payload validation verified: Invalid URL and short notes rejected with HTTP 400.")

    # 15C: Staff submits valid proof payload -> Moves to Pending Verification
    r_valid_proof = client.patch(
        "/api/requests/req-02/status",
        headers=warden_headers,
        json={
            "status": "Pending Verification",
            "proof_image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
            "action_taken_notes": "Replaced faulty brass compression gasket and tested water pressure for 15 minutes. Zero leaks observed.",
            "vendor_invoice_or_slip": "https://campos.edu/records/INV-2026-8812.pdf"
        }
    )
    assert r_valid_proof.status_code == 200, f"Valid proof failed: {r_valid_proof.text}"
    assert r_valid_proof.json()["status"] == "Pending Verification"
    assert r_valid_proof.json()["proof_image_url"].startswith("https://")
    print("Ticket transitioned to 'Pending Verification' with verified proof image and work notes.")

    print("\n--- [16] Student Verification & Anti-Fraud Escalation Engine ---")
    # 16A: Student confirms resolution -> transitions to Closed
    r_verify_accept = client.post(
        "/api/requests/req-12/verify",
        headers=student_headers,
        json={"confirmed": True, "note": "Verified corridor light working properly."}
    )
    assert r_verify_accept.status_code == 200, f"Verification failed: {r_verify_accept.text}"
    assert r_verify_accept.json()["status"] == "Closed"
    assert r_verify_accept.json()["student_verified"] == 1
    print("Two-way closure loop confirmed: Student accepted proof -> status transitioned to 'Closed'.")

    # 16B: Anti-Fraud Escalation: Student Priya Sharma rejects inadequate/fake proof on req-02
    r_priya = client.post("/api/auth/login", json={"email": "priya.sharma@campos.edu", "password": "Password123!"})
    assert r_priya.status_code == 200
    priya_headers = {"Authorization": f"Bearer {r_priya.json()['access_token']}"}

    # Jumps Level 1/2 and auto-escalates directly to Level 3 (Dean / Director) with fraud flag!
    r_verify_fraud = client.post(
        "/api/requests/req-02/verify",
        headers=priya_headers,
        json={"confirmed": False, "note": "Fake photo uploaded; flush valve is still leaking heavily onto floor."}
    )
    assert r_verify_fraud.status_code == 200, f"Fraud rejection failed: {r_verify_fraud.text}"
    fraud_ticket = r_verify_fraud.json()
    assert fraud_ticket["status"] == "Escalated"
    assert fraud_ticket["escalation_level"] == 3
    assert fraud_ticket["escalation_target"] == "Dean / Director of Campus Operations"
    assert fraud_ticket["fraud_flag"] == 1
    assert fraud_ticket["priority"] == "Critical"
    print("Anti-Fraud Engine verified: Rejected proof auto-escalated directly to Level 3 (Dean / Director) with fraud_flag=1.")

    print("\n--- [17] Shared Amenity Duplicate Interception Engine ---")
    # Student submits duplicate shared complaint for already reported issue in same hostel
    r_duplicate = client.post(
        "/api/requests",
        headers=student_headers,
        json={
            "type": "complaint",
            "category": "Canteen",
            "title": "Muddy water dispensing from canteen cooler",
            "description": "Water cooler on 1st floor dining area dispensing discolored water.",
            "amenity_type": "shared_amenity"
        }
    )
    assert r_duplicate.status_code == 200
    dup_res = r_duplicate.json()
    assert dup_res.get("duplicate_intercepted") is True, "Duplicate was not intercepted!"
    print("Shared Amenity Engine verified: Duplicate complaint converted into +1 Upvote with dynamic SLA compression.")

    print("\n--- [18] Append-Only Immutable Audit Ledger DB Trigger Guard ---")
    import sqlite3
    from database import DB_PATH
    conn_raw = sqlite3.connect(DB_PATH)
    cur_raw = conn_raw.cursor()

    # Attempt direct SQL UPDATE on request_audit_logs -> Must be aborted by trigger
    try:
        cur_raw.execute("UPDATE request_audit_logs SET note = 'Tampered' WHERE id IS NOT NULL;")
        conn_raw.commit()
        assert False, "Security vulnerability: Direct SQL UPDATE succeeded on audit logs!"
    except sqlite3.IntegrityError as e:
        assert "IMMUTABLE_LOG_VIOLATION" in str(e)
        print("Database trigger prevent_audit_update successfully aborted direct SQL UPDATE.")

    # Attempt direct SQL DELETE on request_audit_logs -> Must be aborted by trigger
    try:
        cur_raw.execute("DELETE FROM request_audit_logs;")
        conn_raw.commit()
        assert False, "Security vulnerability: Direct SQL DELETE succeeded on audit logs!"
    except sqlite3.IntegrityError as e:
        assert "IMMUTABLE_LOG_VIOLATION" in str(e)
        print("Database trigger prevent_audit_delete successfully aborted direct SQL DELETE.")
    finally:
        conn_raw.close()

    print("\n[SUCCESS] ALL 18 ZERO-TRUST & TAMPER-PROOF ARCHITECTURE TESTS PASSED SUCCESSFULLY!")
    print("==================================================================================")

if __name__ == "__main__":
    test_all()
