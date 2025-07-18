from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/works", tags=["works"])

"""
작업내역 API 라우터
- 작업 목록, 상세, 추가/수정/삭제, 솔루션별/기간별 조회 등
"""

@router.get("/", response_model=List[schemas.Work])
def list_works(solution: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Work)
    if solution:
        q = q.filter(models.Work.solution == solution)
    return q.order_by(models.Work.date.desc()).all()

@router.get("/{work_id}", response_model=schemas.Work)
def get_work(work_id: int, db: Session = Depends(get_db)):
    work = db.query(models.Work).filter(models.Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    return work

@router.post("/", response_model=schemas.Work)
def create_work(work: schemas.WorkCreate, db: Session = Depends(get_db)):
    db_work = models.Work(**work.dict())
    db.add(db_work)
    db.commit()
    db.refresh(db_work)
    return db_work

@router.put("/{work_id}", response_model=schemas.Work)
def update_work(work_id: int, work: schemas.WorkUpdate, db: Session = Depends(get_db)):
    db_work = db.query(models.Work).filter(models.Work.id == work_id).first()
    if not db_work:
        raise HTTPException(status_code=404, detail="Work not found")
    for key, value in work.dict().items():
        setattr(db_work, key, value)
    db.commit()
    db.refresh(db_work)
    return db_work

@router.delete("/{work_id}")
def delete_work(work_id: int, db: Session = Depends(get_db)):
    db_work = db.query(models.Work).filter(models.Work.id == work_id).first()
    if not db_work:
        raise HTTPException(status_code=404, detail="Work not found")
    db.delete(db_work)
    db.commit()
    return {"ok": True}

@router.get("/solution/{solution}", response_model=List[schemas.Work])
def list_works_by_solution(
    solution: str,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Work).filter(models.Work.solution == solution)
    if start:
        q = q.filter(models.Work.date >= start)
    if end:
        q = q.filter(models.Work.date <= end)
    return q.order_by(models.Work.date.desc()).all() 