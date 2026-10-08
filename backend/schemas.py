from pydantic import BaseModel
from typing import Optional

class RequestCreate(BaseModel):
    type: str  # 'complaint', 'leave', 'document'
    category: str
    title: str
    description: str
    student_id: str
    student_name: str
    hostel: str
    room: str
    priority: Optional[str] = "Medium"

class RequestStatusUpdate(BaseModel):
    status: str  # 'Open', 'Resolved', 'Approved', 'Rejected'
    actor_name: str

class NoticeCreate(BaseModel):
    title: str
    body: str
    posted_by: str
    target_hostel: Optional[str] = "All"
    target_batch: Optional[str] = "All"
    target_branch: Optional[str] = "All"
    actionable: Optional[bool] = False