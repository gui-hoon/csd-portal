from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Date, UniqueConstraint
from sqlalchemy.sql import func
from database import Base
import enum
from sqlalchemy.dialects.postgresql import JSONB

class UserRole(enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default="viewer", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Client(Base):
    __tablename__ = "clients"
    __table_args__ = (
        UniqueConstraint('name', 'solution', name='uix_name_solution'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    contract_type = Column(String, nullable=False)
    license_type = Column(String, nullable=False)
    license_start = Column(Date, nullable=False)
    license_end = Column(Date, nullable=False)
    solution = Column(String, nullable=True)
    manager_name = Column(String, nullable=True)
    manager_email = Column(String, nullable=True)
    manager_phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    memo = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 

class Work(Base):
    __tablename__ = "works"

    id = Column(Integer, primary_key=True, index=True)
    client = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    solution = Column(String, nullable=False)
    content = Column(String, nullable=False)
    issue = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class IssueStatus(enum.Enum):
    in_progress = "in_progress"
    waiting = "waiting"
    resolved = "resolved"

class IssuePriority(enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    solution = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    client = Column(String, nullable=False)
    assignee = Column(String, nullable=False)
    status = Column(Enum(IssueStatus), default="in_progress", nullable=False)
    priority = Column(Enum(IssuePriority), default="medium", nullable=False)
    content = Column(String, nullable=True)
    tags = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class IssueComment(Base):
    __tablename__ = "issue_comments"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, nullable=False, index=True)
    author = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now()) 