from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/clients", tags=["clients"])

"""
고객사 API 라우터
- 고객사 목록, 상세, 추가/수정/삭제, 솔루션별 조회 등
"""

@router.get("/", response_model=List[schemas.Client])
def list_clients(db: Session = Depends(get_db)):
    return db.query(models.Client).all()

@router.get("/{client_id}", response_model=schemas.Client)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.post("/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    data = client.dict()
    from datetime import date
    if isinstance(data.get('license_start'), date):
        data['license_start'] = data['license_start'].isoformat()
    if isinstance(data.get('license_end'), date):
        data['license_end'] = data['license_end'].isoformat()
    db_client = models.Client(**data)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.put("/{client_id}", response_model=schemas.Client)
def update_client(client_id: int, client: schemas.ClientUpdate, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    for key, value in client.dict().items():
        setattr(db_client, key, value)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(db_client)
    db.commit()
    return {"ok": True} 

@router.get("/solution/{solution}", response_model=List[schemas.Client])
def list_clients_by_solution(solution: str, db: Session = Depends(get_db)):
    return db.query(models.Client).filter(models.Client.solution == solution).all() 