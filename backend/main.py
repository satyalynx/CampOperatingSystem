from typing import Optional
from datetime import datetime, timezone
import io
import qrcode

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from database import supabase
from schemas import RequestCreate, RequestStatusUpdate, NoticeCreate
from scheduler import check_sla_escalations

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(check_sla_escalations, 'interval', seconds=60)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="CampOS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "system": "CampOS Modular Backend Engine"}

# --- REQUESTS API ENDPOINTS ---
@app.get("/api/requests")
def get_requests(type: Optional[str] = None, hostel: Optional[str] = None):
    query = supabase.table("requests").select("*")
    if type:
        query = query.eq("type", type)
    if hostel and hostel != "All":
        query = query.eq("hostel", hostel)
    res = query.order("created_at", desc=True).execute()
    return res.data

@app.post("/api/requests")
def create_request(payload: RequestCreate):
    data = payload.model_dump()
    res = supabase.table("requests").insert(data).execute()
    if res.data:
        req_id = res.data[0]["id"]
        supabase.table("request_audit_logs").insert({
            "request_id": req_id,
            "action": f"CREATED_{payload.type.upper()}",
            "actor_name": payload.student_name
        }).execute()
    return res.data

@app.patch("/api/requests/{request_id}/status")
def update_request_status(request_id: str, payload: RequestStatusUpdate):
    update_data = {"status": payload.status}
    if payload.status in ["Resolved", "Approved"]:
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()

    res = supabase.table("requests").update(update_data).eq("id", request_id).execute()
    
    supabase.table("request_audit_logs").insert({
        "request_id": request_id,
        "action": f"STATUS_UPDATED_{payload.status.upper()}",
        "actor_name": payload.actor_name
    }).execute()
    
    return res.data

@app.get("/api/requests/{request_id}/logs")
def get_request_logs(request_id: str):
    res = supabase.table("request_audit_logs").select("*").eq("request_id", request_id).order("created_at", desc=True).execute()
    return res.data

# --- GATEPASS QR CODE ENDPOINT ---
@app.get("/api/requests/{request_id}/qr")
def get_gatepass_qr(request_id: str):
    res = supabase.table("requests").select("*").eq("id", request_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req = res.data[0]
    qr_payload = f"CAMPOS-VERIFIED|ID:{req['id']}|STUDENT:{req['student_name']}|STATUS:{req['status']}|HOSTEL:{req['hostel']}"
    
    img = qrcode.make(qr_payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

# --- NOTICES API ENDPOINTS ---
@app.get("/api/notices")
def get_notices():
    res = supabase.table("notices").select("*").order("created_at", desc=True).execute()
    return res.data

@app.post("/api/notices")
def create_notice(payload: NoticeCreate):
    res = supabase.table("notices").insert(payload.model_dump()).execute()
    return res.data
