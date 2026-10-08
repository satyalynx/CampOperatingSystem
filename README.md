# CampOS — Campus Operating System

> **BPUT Hackathon 2026 | Problem Statement PS07: "Attendance, Mess, Hostel, Repeat: Campus Life, Debugged" (Fretbox)**

---

## 1. Project Overview

**CampOS (Campus Operating System)** is a unified campus operations and request orchestration platform engineered to eliminate operational friction across higher-education residential campuses. 

In traditional campus administration, routine student needs—repairing a leaking hostel tap, obtaining a weekend gatepass, or requesting a bonafide certificate—are fragmented across paper registers, WhatsApp broadcast groups, disparate spreadsheets, and unwritten staff memory. Requests sit in unmonitored queues with no forcing function or accountability.

CampOS unifies these fragmented channels into an automated, transparent, and enforceable campus workflow engine.

### Core Value Proposition & Differentiating USP:
1. **Deterministic SLA Auto-Escalation Engine:** Strict time guarantees attached to every request (**Complaints: 48 hours**, **Leave / Gatepasses: 2 hours**, **Documents & Certificates: 72 hours**). If a request breaches its SLA deadline, it is automatically escalated to executive administration (Dean / Chief Admin) with an immutable audit log.
2. **Staff SLA Accountability Matrix:** Real-time administrative metrics tracking assigned workload vs. SLA breaches per officer.
3. **Institutional Precedent Engine (Similar-Ticket Precedent):** When a student raises a ticket, the system matches previous resolved tickets of the same type and category, displaying resolution notes to prevent duplicate filing. *(Rule-based deterministic matching, explicitly not AI/ML).*
4. **Facility Repeat-Issue Detection:** Automated root-cause detection that groups complaints by `Room + Category` to identify systemic maintenance defects (threshold: ≥ 2 occurrences) rather than treating each complaint as an isolated incident.
5. **Verified Digital QR Gatepass:** Real-time scannable QR pass for approved student leave, verifiable at campus turnstiles and security gates.
6. **Targeted Notices & Action Receipts:** Filtered communication targeting specific Hostels, Branches, or Batches with individual student read receipts and actionable acknowledgment tracking.

---

## 2. System Architecture

```text
                               +-----------------------------+
                               |    STUDENT / WARDEN / ADMIN |
                               +-----------------------------+
                                              |
                                              v
                               +-----------------------------+
                               |     REACT 19 + VITE + CSS   |
                               |    Tailwind Design System   |
                               +-----------------------------+
                                              |
                                              | REST JSON (JWT Auth)
                                              v
                               +-----------------------------+
                               |       FASTAPI BACKEND       |
                               |  - Route Handlers           |
                               |  - Role Guard Dependencies  |
                               |  - APScheduler Background   |
                               +-----------------------------+
                                     /               \
                                    /                 \
                                   v                   v
            +---------------------------+   +---------------------------+
            |    RELATIONAL DATABASE    |   |     SUPABASE POSTGRES     |
            | SQLite Engine (campos.db) |   | Full DDL Schema Available |
            | Foreign Keys & Indices    |   | (supabase/schema.sql)     |
            +---------------------------+   +---------------------------+
```

---

## 3. Technology Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS, Lucide React icons.
- **Backend Application Server:** Python 3.12, FastAPI, Uvicorn, Pydantic v2.
- **Background Scheduler:** APScheduler (runs 60-second background SLA checks).
- **Security & Authentication:** JWT (PyJWT HS256), Cryptographic Salted PBKDF2-HMAC Password Hashing.
- **Digital Passes:** Python QRCode generator (Dynamic Streaming PNG QR pass).
- **Database Engine:**
  - **Local Persistence Engine:** Embedded Relational SQLite (`campos.db`) with foreign key constraints, relational indexing, and transactions.
  - **Cloud PostgreSQL Migration:** Production-ready DDL schema (`supabase/schema.sql`) for PostgreSQL/Supabase.

---

## 4. SLA Rules & Auto-Escalation Engine

Every request raised in CampOS is governed by a deterministic, server-side SLA clock:

| Workflow Type | Allowed SLA Deadline | Auto-Escalation Target | Priority Elevation |
| :--- | :--- | :--- | :--- |
| **Hostel Complaint** | **48 Hours** | Warden → Dean / Chief Admin | Elevated to **High** |
| **Leave / Gatepass** | **2 Hours** | Warden → Chief Security / Admin | Elevated to **High** |
| **Document / Certificate** | **72 Hours** | Registrar Staff → Dean | Elevated to **High** |

### Escalation Mechanism:
1. `scheduler.py` runs automatically every 60 seconds in the background.
2. The engine queries all open/in-progress tickets and computes:
   $$\text{elapsed\_hours} = \frac{\text{now} - \text{created\_at}}{3600}$$
3. When $\text{elapsed\_hours} \ge \text{SLA\_limit}$ and `escalated == false`:
   - Sets `escalated = true` and `escalated_at = now()`.
   - Elevates priority to `High` and updates status to `Escalated`.
   - Inserts an immutable audit log: `AUTO_ESCALATED_SLA_BREACH` by `"System SLA Engine"`.
   - Instantly reflected in the Admin Escalation Queue and Student status badge.
4. Admins can also trigger an on-demand SLA evaluation at any moment via the **"Run SLA Engine Now"** button or `POST /api/requests/escalate-check`.

---

## 5. Seed Demonstration Personas

CampOS includes pre-configured personas for testing. You can log in using either the credentials below or the **1-Click Evaluator Persona Switcher** in the navigation bar:

| Persona | Role | Email | Password | Scope / Hostel |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Verma** | Student | `rahul.verma@campos.edu` | `Password123!` | Girls Block A (Rm 204) |
| **Priya Sharma** | Student | `priya.sharma@campos.edu` | `Password123!` | Girls Block A (Rm 204) |
| **Amit Patel** | Student | `amit.patel@campos.edu` | `Password123!` | Boys Block B (Rm 105) |
| **Warden Sharma** | Warden | `warden.sharma@campos.edu` | `Password123!` | Scoped to **Girls Block A** |
| **Warden Mehta** | Warden | `warden.mehta@campos.edu` | `Password123!` | Scoped to **Boys Block B** |
| **Dr. A. K. Satpathy** | Admin | `admin@campos.edu` | `Password123!` | Institution-Wide (Dean) |

---

## 6. Setup & Installation Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone & Enter Project
```bash
git clone https://github.com/satyalynx/CampOperatingSystem.git
cd CampOperatingSystem
```

### 2. Backend Setup
```bash
cd backend

# Install Python requirements
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env if not already created
cp .env.example .env

# Initialize and seed database
python seed.py

# Start FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies (already included in node_modules)
npm install

# Build or start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 7. Environment Variables

### Backend (`backend/.env`):
```ini
PORT=8000
DB_PATH="campos.db"
JWT_SECRET="campos_campus_os_secret_token_2026_jwt"
SUPABASE_URL="https://xmglogiieaqhtlasrbjw.supabase.co"
SUPABASE_KEY="sb_publishable_JcWaWbBPMvtELNPX_Z5Eug_sFrAakpL"
```

### Frontend (`frontend/.env`):
```ini
VITE_API_URL="http://127.0.0.1:8000"
```

---

## 8. REST API Reference

### Authentication
- `POST /api/auth/login` — Sign in with email and password (returns JWT).
- `GET /api/auth/me` — Retrieve authenticated user profile with role context.
- `POST /api/auth/demo-switch` — 1-click evaluator persona switcher.
- `GET /api/auth/demo-accounts` — List pre-seeded personas.

### Requests Desk
- `GET /api/requests` — List requests (auto-scoped: students see own, wardens see hostel, admin sees all).
- `POST /api/requests` — File a new Complaint, Leave, or Document request.
- `GET /api/requests/{id}` — Request details with immutable audit trail.
- `PATCH /api/requests/{id}/status` — Staff updates status (Open, In Progress, Resolved, Approved, Rejected).
- `GET /api/requests/{id}/logs` — Retrieve request audit trail.
- `GET /api/requests/{id}/qr` — Verified digital gate pass QR image.
- `GET /api/requests/similar` — Deterministic similar-ticket suggestions.
- `POST /api/requests/escalate-check` — Manually trigger SLA auto-escalation check.

### Notices
- `GET /api/notices` — Targeted notice feed (students get filtered feed; staff get engagement stats).
- `POST /api/notices` — Staff publishes a targeted notice.
- `POST /api/notices/{id}/read` — Student marks notice as read.
- `POST /api/notices/{id}/action` — Student completes actionable notice task.

### Student Portal Endpoints
- `GET /api/student/profile` — Full academic and residential profile.
- `GET /api/student/attendance` — Attendance record with low-attendance warnings (< 75%).
- `GET /api/student/timetable` — Daily lecture schedule with class cancellations.
- `GET /api/student/fees` — Fee dues and clearance certificates.
- `GET /api/student/mess-menu` — Weekly meal menu.
- `POST /api/student/mess-feedback` — Submit meal quality review (1-5 stars).
- `GET /api/student/gate-history` — Personal entry/exit logs.

### Administration & Warden Operations
- `GET /api/admin/dashboard` — Live operational metrics (total, open, resolved, escalated, ageing, avg resolution).
- `GET /api/admin/repeat-issues` — Room + Category repeat defect analyzer (count ≥ 2).
- `GET /api/admin/rooms` — Hostel rooms and assets directory.
- `GET /api/admin/gate-logs` — Master campus gate log access.
- `POST /api/admin/gate-logs` — Security guard logs student turnstile movement.
- `GET /api/admin/mess-feedback` — Aggregated ratings across meals.
- `POST /api/admin/reset-demo` — Restore database to clean demonstration dataset.

---

## 9. Verification & Testing

The backend includes an automated verification test suite:
```bash
cd backend
python test_backend.py
```
This runs 13 end-to-end integration tests covering:
- Health check
- Persona authentication & JWT issuance
- Student role authorization and request isolation
- Precedent ticket matching
- Attendance calculation and sub-75% alerts
- Timetable with lecture cancellation flags
- Notice targeting and read/action tracking
- Warden hostel scoping enforcement
- Admin real-time analytics aggregation
- Repeat issue detection algorithm
- SLA Auto-Escalation Engine execution
- Scannable QR Gate Pass PNG generation
