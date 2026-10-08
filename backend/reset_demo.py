from database import supabase
from datetime import datetime, timezone, timedelta

def reset_db():
    print("Resetting CampOS Demo Data...")
    
    # Clean audit logs & requests
    supabase.table("request_audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("requests").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    # Re-insert fresh seed request (3 days old to trigger instant SLA Breach)
    old_time = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
    
    supabase.table("requests").insert({
        "id": "99999999-9999-9999-9999-999999999999",
        "type": "complaint",
        "category": "Plumbing",
        "title": "Water Tap Leaking",
        "description": "Tap dripping continuously in room 204. Water wastage ongoing.",
        "student_id": "11111111-1111-1111-1111-111111111111",
        "student_name": "Rahul Verma",
        "hostel": "Girls Block A",
        "room": "204",
        "status": "Open",
        "priority": "High",
        "created_at": old_time,
        "assigned_to": "33333333-3333-3333-3333-333333333333",
        "assigned_staff_name": "Warden Sharma",
        "escalated": False
    }).execute()

    print("? Database successfully reset to initial Demo state!")

if __name__ == "__main__":
    reset_db()
