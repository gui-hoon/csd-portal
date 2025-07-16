from fastapi import FastAPI, Depends
from starlette.middleware.cors import CORSMiddleware
from auth import router as auth_router, get_current_user, users_router
from clients import router as clients_router
from works import router as works_router
from issues import router as issues_router

app = FastAPI()

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 중에는 모든 origin을 허용합니다.
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메소드를 허용합니다.
    allow_headers=["*"],  # 모든 HTTP 헤더를 허용합니다.
)

app.include_router(auth_router)
app.include_router(clients_router)
app.include_router(works_router)
app.include_router(users_router)
app.include_router(issues_router)

@app.get("/")
def read_root(current_user=Depends(get_current_user)):
    return {"message": f"{current_user.name}님, CSD Portal에 오신 것을 환영합니다!"} 