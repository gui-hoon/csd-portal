from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Issue, IssueComment, IssueStatus, IssuePriority
from schemas import Issue as IssueSchema, IssueCreate, IssueUpdate, IssueComment as IssueCommentSchema, IssueCommentCreate
from datetime import datetime
from auth import get_current_user

router = APIRouter(prefix="/issues", tags=["issues"])

"""
이슈/댓글 API 라우터
- 이슈 목록, 상세, 추가/수정/삭제, 댓글 관리 등
"""

# 이슈 목록 조회 (필터/검색/페이지네이션)
@router.get("/{solution}", response_model=List[IssueSchema])
def list_issues(
    solution: str,
    status: Optional[IssueStatus] = Query(None),
    priority: Optional[IssuePriority] = Query(None),
    client: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    q = db.query(Issue).filter(Issue.solution == solution)
    if status:
        q = q.filter(Issue.status == status)
    if priority:
        q = q.filter(Issue.priority == priority)
    if client:
        q = q.filter(Issue.client == client)
    if search:
        q = q.filter(
            Issue.title.ilike(f"%{search}%") |
            Issue.content.ilike(f"%{search}%") |
            Issue.assignee.ilike(f"%{search}%")
        )
    if start:
        q = q.filter(Issue.created_at >= start)
    if end:
        q = q.filter(Issue.created_at <= end)
    q = q.order_by(Issue.created_at.asc())
    return q.offset(skip).limit(limit).all()

# 이슈 등록
@router.post("/{solution}", response_model=IssueSchema)
def create_issue(solution: str, issue: IssueCreate, db: Session = Depends(get_db)):
    db_issue = Issue(
        solution=solution,
        title=issue.title,
        client=issue.client,
        assignee=issue.assignee,
        status=issue.status,
        priority=issue.priority,
        content=issue.content,
        tags=issue.tags,
        due_date=issue.due_date,
        created_at=datetime.utcnow()
    )
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)
    return db_issue

# 이슈 상세
@router.get("/{solution}/{issue_id}", response_model=IssueSchema)
def get_issue(solution: str, issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.solution == solution, Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

# 이슈 수정
@router.patch("/{solution}/{issue_id}", response_model=IssueSchema)
def update_issue(solution: str, issue_id: int, update: IssueUpdate, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.solution == solution, Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    for field, value in update.dict(exclude_unset=True).items():
        setattr(issue, field, value)
    db.commit()
    db.refresh(issue)
    return issue

# 이슈 삭제
@router.delete("/{solution}/{issue_id}")
def delete_issue(solution: str, issue_id: int, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.solution == solution, Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()
    return {"ok": True}

# 댓글 등록
@router.post("/{solution}/{issue_id}/comments", response_model=IssueCommentSchema)
def create_comment(solution: str, issue_id: int, comment: IssueCommentCreate, db: Session = Depends(get_db)):
    db_comment = IssueComment(
        issue_id=issue_id,
        author=comment.author,
        content=comment.content,
        created_at=datetime.utcnow()
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

# 댓글 목록
@router.get("/{solution}/{issue_id}/comments", response_model=List[IssueCommentSchema])
def list_comments(solution: str, issue_id: int, db: Session = Depends(get_db)):
    return db.query(IssueComment).filter(IssueComment.issue_id == issue_id).order_by(IssueComment.created_at.asc()).all()

# 댓글 수정
@router.patch("/{solution}/{issue_id}/comments/{comment_id}", response_model=IssueCommentSchema)
def update_comment(solution: str, issue_id: int, comment_id: int, update: IssueCommentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    comment = db.query(IssueComment).filter(IssueComment.id == comment_id, IssueComment.issue_id == issue_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author != current_user.name:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인이 작성한 댓글만 수정할 수 있습니다.")
    update_data = update.dict(exclude_unset=True)
    if 'content' in update_data:
        comment.content = update_data['content']
    db.commit()
    db.refresh(comment)
    return comment

# 댓글 삭제
@router.delete("/{solution}/{issue_id}/comments/{comment_id}")
def delete_comment(solution: str, issue_id: int, comment_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    comment = db.query(IssueComment).filter(IssueComment.id == comment_id, IssueComment.issue_id == issue_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author != current_user.name:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인이 작성한 댓글만 삭제할 수 있습니다.")
    db.delete(comment)
    db.commit()
    return {"ok": True} 