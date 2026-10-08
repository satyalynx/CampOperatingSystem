from datetime import datetime, timezone, timedelta
from database import supabase

def check_sla_escalations():
    try:
        # SLA breach threshold: requests open for more than 2 days
        threshold = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        
        response = supabase.table("requests") \
            .select("*") \
            .eq("status", "Open") \
            .eq("escalated", False) \
            .lt("created_at", threshold) \
            .execute()

        overdue_requests = response.data or []
        for req in overdue_requests:
            # Auto-escalate status & elevate priority to High
            supabase.table("requests").update({
                "escalated": True,
                "escalated_at": datetime.now(timezone.utc).isoformat(),
                "priority": "High"
            }).eq("id", req["id"]).execute()

            # Insert system audit log entry
            supabase.table("request_audit_logs").insert({
                "request_id": req["id"],
                "action": "AUTO_ESCALATED_SLA_BREACH",
                "actor_name": "System SLA Engine"
            }).execute()

        if overdue_requests:
            print(f"[SLA Scheduler] Successfully escalated {len(overdue_requests)} overdue request(s).")
    except Exception as e:
        print(f"[SLA Scheduler Error]: {e}")