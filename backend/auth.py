from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserRead, UserLogin, UserUpdate
import os
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, Union, List
from fastapi.responses import JSONResponse

SECRET_KEY = os.environ.get("SECRET_KEY", "secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

"""
인증 및 사용자 관리 라우터
- 회원가입, 로그인, 사용자 정보 갱신, 권한 관리 등
"""

# 비밀번호 해싱 및 검증 함수

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT 토큰 생성 함수

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# JWT 토큰에서 사용자 정보 추출 함수

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# 회원가입 API
@router.post("/signup", response_model=UserRead)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="이미 등록된 이메일입니다.")
    hashed_password = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        is_active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# 로그인 API (JSON 또는 Form 지원)
@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        email = data.get("email")
        password = data.get("password")
        if not email and "username" in data:
            email = data["username"]
    except Exception:
        # 폼 데이터로 시도
        form = await request.form()
        email = form.get("email") or form.get("username")
        password = form.get("password")
    if not email or not password:
        raise HTTPException(status_code=422, detail="이메일/비밀번호를 입력하세요.")
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user or not verify_password(password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="관리자 승인 후 로그인할 수 있습니다.")
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email, "role": db_user.role.value}} 

# 내 정보 수정 API
@router.put("/me", response_model=UserRead)
def update_me(update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if update.name is not None:
        user.name = update.name
    if update.email is not None:
        user.email = update.email
    if update.password is not None:
        # 기존 비밀번호와 동일한지 체크
        if verify_password(update.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="기존 비밀번호와 다른 비밀번호를 입력해 주세요.")
        user.hashed_password = get_password_hash(update.password)
    db.commit()
    db.refresh(user)
    return user

users_router = APIRouter()

# 전체 사용자 조회 (관리자 전용)
@users_router.get("/users", response_model=List[UserRead])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    users = db.query(User).all()
    return users

# 사용자 활성화 (관리자 전용)
@users_router.patch("/users/{user_id}/activate", response_model=UserRead)
def activate_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

# 사용자 권한 변경 (관리자 전용, 자기 자신은 불가)
@users_router.patch("/users/{user_id}/role", response_model=UserRead)
def change_user_role(user_id: int, role: UserRole, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="관리자만 접근 가능합니다.")
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="자기 자신의 권한은 변경할 수 없습니다.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    user.role = role
    db.commit()
    db.refresh(user)
    return user 