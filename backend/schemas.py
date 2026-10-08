from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class LoginRequest(BaseModel):
    email: str
    password: str

class DemoLoginRequest(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

class RequestCreate(BaseModel):
    type: str = Field(..., description="Type of request: complaint, leave, document")
    category: str = Field(..., description="Category, e.g. Plumbing, Medical, Bonafide")
    title: str = Field(..., description="Short summary title")
    description: str = Field(..., description="Detailed description")
    priority: Optional[str] = "Medium"
    amenity_type: Optional[str] = Field("individual", description="individual or shared_amenity")
    # Optional override if administrative override is permitted, otherwise taken from authenticated user
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    hostel: Optional[str] = None
    room: Optional[str] = None

class RequestStatusUpdate(BaseModel):
    status: str = Field(..., description="Open, In Progress, Pending Verification, Approved, Rejected, Resolved, Closed, Escalated")
    note: Optional[str] = None
    actor_name: Optional[str] = None
    resolution_proof: Optional[str] = Field(None, description="Detailed notes on resolution")
    proof_image_url: Optional[str] = Field(None, description="Mandatory verified proof image URL")
    vendor_invoice_or_slip: Optional[str] = Field(None, description="Optional vendor invoice / work order slip PDF or image URL")
    action_taken_notes: Optional[str] = Field(None, description="Action taken notes (min 25 characters when resolving)")

class ProofSubmissionPayload(BaseModel):
    ticket_id: Optional[str] = None
    status_target: str = Field(default="Pending Verification", description="Must transition to Pending Verification")
    proof_image_url: str = Field(..., description="Mandatory verified proof image URL (HTTP/HTTPS)")
    action_taken_notes: str = Field(..., min_length=25, description="Minimum 25 characters detailing resolution steps")
    vendor_invoice_or_slip: Optional[str] = Field(None, description="Optional PDF / Invoice slip URL")

class RequestVerifyPayload(BaseModel):
    confirmed: bool = Field(..., description="True if student confirms fix, False if rejected")
    note: Optional[str] = Field(None, description="Student verification or dispute feedback")
    is_fraud: Optional[bool] = Field(False, description="Flag as fraudulent resolution attempt")

class NoticeCreate(BaseModel):
    title: str
    body: str
    target_hostel: Optional[str] = "All"
    target_batch: Optional[str] = "All"
    target_branch: Optional[str] = "All"
    actionable: Optional[bool] = False

class MessFeedbackCreate(BaseModel):
    day: str
    meal: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class GateLogCreate(BaseModel):
    student_id: str
    type: str = Field(..., description="Entry or Exit")
    gate: str
    remarks: Optional[str] = None

class RoomCreate(BaseModel):
    room_number: str
    hostel: str
    floor: int
    capacity: int
    notes: Optional[str] = None