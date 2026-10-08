from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from database import init_db
from scheduler import check_sla_escalations
from routes.auth_routes import router as auth_router
from routes.request_routes import router as request_router
from routes.notice_routes import router as notice_router
from routes.student_routes import router as student_router
from routes.admin_routes import router as admin_router

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized
    init_db()
    # Schedule deterministic SLA auto-escalation check every 60 seconds
    scheduler.add_job(check_sla_escalations, 'interval', seconds=60, id="sla_escalation_job")
    scheduler.start()
    print("[CampOS Engine] SLA Auto-Escalation background scheduler started.")
    yield
    scheduler.shutdown()
    print("[CampOS Engine] Background scheduler shutdown.")

app = FastAPI(
    title="CampOS — Campus Operating System API",
    description="Unified API for campus request operations, SLA auto-escalation, accountability, and institutional precedent.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware for frontend web app integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Core API Routers
app.include_router(auth_router)
app.include_router(request_router)
app.include_router(notice_router)
app.include_router(student_router)
app.include_router(admin_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "CampOS — Campus Operating System",
        "version": "2.0.0",
        "architecture": "Modular FastAPI + Persistent Relational Database + Deterministic SLA Engine"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "CampOS API Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
