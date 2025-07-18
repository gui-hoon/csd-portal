from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List
import enum

"""
Pydantic 스키마 정의
- Client, User, Work, Issue, IssueComment 등 API 데이터 구조
"""

# Client(고객사) 스키마
class ClientBase(BaseModel):
    name: str
    solution: Optional[str] = None
    contract_type: Optional[str] = None
    license_type: Optional[str] = None
    license_start: Optional[date] = None
    license_end: Optional[date] = None
    manager_name: Optional[str] = None
    manager_email: Optional[EmailStr] = None
    manager_phone: Optional[str] = None
    location: Optional[str] = None
    memo: Optional[str] = None
    is_active: bool = True

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserRole(str, enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.viewer
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class ClientUpdate(ClientBase):
    pass

# 클라이언트(고객사) 스키마
# (아래쪽 중복 정의 전체 삭제) 

class WorkBase(BaseModel):
    client: str
    date: date
    solution: str
    content: str
    issue: Optional[str] = None

class WorkCreate(WorkBase):
    pass

class WorkUpdate(WorkBase):
    pass

class Work(WorkBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IssueStatus(str, enum.Enum):
    in_progress = "in_progress"
    waiting = "waiting"
    resolved = "resolved"

class IssuePriority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class IssueBase(BaseModel):
    title: str
    client: str
    assignee: str
    status: IssueStatus = IssueStatus.in_progress
    priority: IssuePriority = IssuePriority.medium
    content: str = ""
    tags: Optional[List[str]] = []
    due_date: Optional[datetime] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    client: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    due_date: Optional[datetime] = None

class Issue(IssueBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IssueCommentBase(BaseModel):
    issue_id: int
    author: str
    content: str

class IssueCommentCreate(IssueCommentBase):
    pass

class IssueComment(IssueCommentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True 