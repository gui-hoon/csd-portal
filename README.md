# CSD Portal

## 🏗️ 설치 및 구동 방법

아래 순서대로 따라하면 어떤 OS에서도 프로젝트를 바로 실행할 수 있습니다.

### 1. OS 패키지 설치

#### Rocky Linux/CentOS/RHEL 계열
```bash
sudo dnf groupinstall "Development Tools" -y
sudo dnf install python3 python3-venv postgresql postgresql-server postgresql-devel -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

#### Ubuntu/Debian 계열
```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip gcc make libpq-dev postgresql postgresql-contrib -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. GitHub에서 소스 클론
```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo/csd-portal
```

### 3. 데이터베이스(PostgreSQL) 준비
```bash
# PostgreSQL 서비스 시작 및 DB 생성
sudo systemctl enable --now postgresql
sudo -u postgres psql

# 아래 명령을 psql 프롬프트에서 실행
CREATE DATABASE csd_portal;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE csd_portal TO your_username;
\q
```

### 4. 환경변수 파일(.env) 작성
- `csd-portal/backend/.env` 파일을 아래 예시처럼 작성

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=csd_portal
SECRET_KEY=your_secret_key
```

### 5. 백엔드(FastAPI) 설치 및 실행
```bash
cd csd-portal/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

### 6. 프론트엔드(Next.js) 설치 및 실행
```bash
cd csd-portal/frontend
npm install
npm run dev
```

### 7. 웹 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 최근 업데이트 (2025-07-17)

- 전체 주요 페이지(대시보드, 작업내역, 이슈, 고객사 등)에서 날짜, 필터, 선택 등 주요 상태를 URL 쿼리와 완전히 동기화
    - 상태 변경 시마다 router.push({ query })로 URL 업데이트, 진입 시 useSearchParams로 쿼리 파싱해 상태 초기화
    - 새로고침, 공유, 뒤로가기 등에서도 동일한 화면/상태 재현 가능
    - 모달(추가/수정 등) 등 임시 상태는 필요시 replace로 URL에서 쿼리 제거
- 대시보드 주요 타일/차트/리스트 UX 개선
    - "미해결 이슈" 타일: 우선순위별(높음/보통/낮음)로 가로 구분, 색상(높음: 주황, 보통: 노랑, 낮음: 초록), 건수는 검정색으로 표기
    - "주요 작업 내역"/"미해결 이슈 Top5" 등 리스트형 타일: 한 줄 넘으면 ...으로 잘림, 주요 작업 클릭 시 해당 작업내역 페이지로 이동 및 자동 선택
- 작업내역/고객사/이슈 등 추가/수정 모달: 폼 바깥(오버레이) 클릭 시 닫힘 UX 적용
- 작업내역/이슈/고객사 등 모든 리스트/필터/검색/선택/페이지네이션 상태가 URL에 반영되어 북마크, 공유, 새로고침, 뒤로가기 UX 완전 일관화
- 대시보드/작업내역/이슈 등에서 날짜(week) 선택 시 URL 쿼리로 반영, 링크 이동 시에도 쿼리 유지
- 전체 코드 리팩터링 및 중복 제거, 상태 관리 일원화

## 최근 업데이트 (2025-07-16)

- 솔루션 대시보드(메인) UI/UX 대폭 개선
    - 고객사/작업/이슈 현황을 한눈에 볼 수 있는 대시보드 타일 및 차트(파이/바) 구현
    - 차트 데이터(계약 유형별, 요일별, 이슈 상태별 등) 실시간 DB 연동
    - 주 단위(week picker)로 기간 선택, 선택한 주의 날짜 범위 자동 표기
    - 각 타일/차트/리스트의 스타일 및 배치, 색상(이슈 빨강, 상태별 차트 등) 통일
    - 요일별 작업 건수 차트 가로 확장, 각주(수치) 한 줄 표시 등 레이아웃 개선

- 상단 네비게이션 바 메뉴 순서 변경
    - Docs와 Issue 게시판 메뉴 위치를 서로 교체하여 UX 개선

- 이슈 게시판/대시보드 세부 개선
    - 이슈 상태별 파이차트 색상: 진행중(빨강), 대기중(회색), 해결(초록)로 명확히 구분
    - 이슈 건수 타일 값 빨간색 강조
    - Bar 차트 y축 눈금 정수(1~10) 단위로만 표시, 소수점 제거
    - 각 차트 타일의 각주(요약 수치) 하단 배치 및 가독성 향상

- 기타
    - 전체 UI/UX 고객사/작업내역/이슈 게시판과 완전 통일
    - 코드 리팩터링 및 불필요한 중복 제거

## 최근 업데이트 (2025-07-15)

- 이슈 게시판 UI/UX 대폭 개선 및 실제 DB 연동 완료
    - 이슈 상태(진행중/대기중/해결됨)와 우선순위(높음/보통/낮음)만 사용하도록 UI 단순화
    - FastAPI 백엔드: 이슈/댓글용 DB 테이블, SQLAlchemy 모델, Pydantic 스키마, CRUD 라우터 구현
    - 프론트엔드 fetch 경로 및 next.config.ts 프록시 설정을 통해 실제 DB와 연동
    - 고객사별 이슈 등록 시 해당 솔루션에 등록된 고객사만 선택 가능
    - 이슈 등록, 목록, 상세, 댓글 등록/조회 등 모든 기능을 실제 DB와 연동
- 프록시/라우팅 문제 해결 및 안정화
    - 프론트엔드에서 /issues/{solution} 경로로 통일, FastAPI 라우터 prefix 조정
    - 서버 재시작 및 프록시 정상화
- UI 세부 개선
    - 진행중 상태 색상 빨강으로 변경, 날짜(YYYY-MM-DD (요일)) 표기 통일
    - 팝업(상세/등록)에서 오버레이 클릭 시 닫힘 UX 개선
- 이슈 상태/우선순위 인라인 수정 기능 추가
    - 상세 팝업에서 상태/우선순위 태그 클릭 시 드롭다운으로 즉시 수정 가능(저장 버튼 없이 자동 반영)
- 댓글 기능 고도화
    - 댓글 등록 시 로그인 유저 이름으로 저장, 본인만 수정/삭제 가능
    - 댓글 수정/삭제 UI 및 API 연동, 삭제 시 확인 팝업 제공
    - 댓글 개수 실시간 표시, 상세 팝업에서 댓글 (N) 형태로 노출

## 최근 업데이트 (2025-07-09)

- /account 페이지 회원 정보 관리 UI/UX 대폭 개선 (좌우 분할, 반응형, 컬럼 폭, 정렬, 페이지네이션 고정 등)
- 회원 정보 리스트: 실제 DB users 테이블 연동, 이름순 정렬, 권한/승인/상태 실시간 반영
- 회원 권한(admin/editor/viewer) 변경 기능 및 자기 자신 권한 변경 불가 처리
- 회원 승인(활성화) 기능: 회원가입 시 is_active=false, admin 승인 시만 로그인 가능
- 회원 정보 페이지네이션: 고객사 페이지와 동일한 스타일, 5명씩, 위치 고정, 회원 없을 때 미표시
- 내 정보 UI: admin이 아닐 때는 화면 중앙에 고정, admin은 좌측에 고정
- 회원 정보 테이블: 컬럼 폭/정렬/이메일 한 줄 표시, 가로 스크롤 방지, 반응형 개선
- favicon(브라우저 탭 아이콘) 배경 제거 및 교체

## 최근 업데이트 (2025-07-08)

- 메인/고객사, 솔루션/고객사, 메인/작업내역, 솔루션/작업내역 네 페이지의 타일/테이블 모드, 페이지네이션, 안내 문구, 타일 크기, 흰색 배경 영역, 페이지네이션 위치 등 UI/UX 완전 통일
- 솔루션/작업내역 페이지의 페이지네이션 위치 및 정렬 개선
- 주차 표기 로직(ISO-8601, 월요일 시작, 과반수 포함 기준) 개선
- 상단 메뉴 클릭 시 항상 메인페이지로 이동하도록 라우팅 보완
- 메인페이지 하얀색 영역 반응형(w-full)으로 개선
- FastAPI 인증: Swagger UI에서 username/password 안내 및 JSON/폼데이터 모두 지원
- 솔루션/작업내역 페이지 타일 선택/일괄 삭제/수정, 버튼 스타일 및 위치 완전 통일
- 작업내역/고객사 페이지 상단 버튼 크기, 폰트 통일(text-base, font-medium)
- 솔루션/작업내역 타일 선택 시 스타일(배경, 테두리) 고객사와 완전 동일하게 통일
- 메인페이지 환영 메시지/솔루션 태그/안내문구를 화면에서 더 아래쪽에 표시되도록 조정
- 메인페이지 안내문구 문구 수정(상단 탭 → 상단 메뉴)

APM/NPM 솔루션 통합 기술지원 플랫폼

## 📋 프로젝트 개요

CSD Portal은 다양한 모니터링 솔루션(AppDynamics, Dynatrace, Netscout, NewRelic, RWS)의 고객을 통합 관리하고 기술 지원을 제공하는 웹 애플리케이션입니다.

## 🖥️ 운영체제 및 환경

- **OS**: Rocky Linux 9.6 (Blue Onyx) - RHEL/CentOS 호환
- **커널**: Linux 5.14.0-427.13.1.el9_4.x86_64
- **쉘**: /bin/bash

## 🛠️ 기술 스택

### 프론트엔드 (Frontend)

| 기술 | 버전 | 설명 |
|------|------|------|
| **Node.js** | v20.19.3 | JavaScript 런타임 |
| **npm** | 10.8.2 | 패키지 매니저 |
| **Next.js** | 15.3.4 | React 프레임워크 |
| **React** | 19.0.0 | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Tailwind CSS** | 4.x | CSS 프레임워크 |
| **Lucide React** | 0.525.0 | 아이콘 라이브러리 |

### 백엔드 (Backend)

| 기술 | 버전 | 설명 |
|------|------|------|
| **Python** | 3.9.21 | 프로그래밍 언어 |
| **FastAPI** | 최신 | 웹 프레임워크 |
| **SQLAlchemy** | 최신 | ORM |
| **Alembic** | 최신 | 데이터베이스 마이그레이션 |
| **PostgreSQL** | 13.20 | 데이터베이스 |
| **JWT** | python-jose | 인증 토큰 |
| **bcrypt** | <4.0.0 | 비밀번호 해싱 |

## 📁 프로젝트 구조

```
csd-portal/
├── frontend/                 # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/             # App Router 구조
│   │   │   ├── clients/     # 고객 관리 페이지
│   │   │   │   └── clients/ # 솔루션별 고객 관리
│   │   │   ├── login/       # 로그인 페이지
│   │   │   ├── signup/      # 회원가입 페이지
│   │   │   ├── account/     # 계정 관리
│   │   │   ├── setting/     # 설정 페이지
│   │   │   ├── chatai/      # AI 채팅 기능
│   │   │   ├── issues/      # 이슈 관리
│   │   │   └── docs/        # 문서 관리
│   │   └── components/      # 재사용 컴포넌트
│   │       ├── Header.tsx   # 헤더 컴포넌트
│   │       ├── Sidebar.tsx  # 사이드바 컴포넌트
│   │       └── AuthProvider.tsx # 인증 컨텍스트
│   ├── public/              # 정적 파일
│   ├── package.json         # 프론트엔드 의존성
│   ├── tsconfig.json        # TypeScript 설정
│   ├── tailwind.config.ts   # Tailwind CSS 설정
│   └── next.config.ts       # Next.js 설정
└── backend/                 # FastAPI 백엔드
    ├── main.py             # FastAPI 앱 진입점
    ├── models.py           # SQLAlchemy 모델
    ├── schemas.py          # Pydantic 스키마
    ├── auth.py             # 인증 관련 API
    ├── clients.py          # 고객 관리 API
    ├── database.py         # 데이터베이스 설정
    ├── config.py           # 환경 설정
    ├── requirements.txt    # Python 의존성
    ├── alembic.ini         # Alembic 설정
    └── migrations/         # 데이터베이스 마이그레이션
```

## 🎯 구현된 기능

### 1. 인증 시스템 (Authentication) ✅

- **JWT 기반 인증**: 24시간 토큰 유효기간
- **사용자 역할 관리**: admin, editor, viewer
- **회원가입/로그인**: 이메일 기반
- **비밀번호 해싱**: bcrypt 사용

### 2. 고객 관리 시스템 (Client Management) ✅

- **고객 정보 CRUD**: 생성, 조회, 수정, 삭제
- **라이선스 관리**: 시작일/종료일 추적
- **솔루션별 분류**: AppDynamics, Dynatrace, Netscout, NewRelic, RWS
- **계약 유형**: 다양한 계약 형태 지원
- **담당자 정보**: 이름, 이메일, 전화번호

### 3. 데이터베이스 스키마 ✅

```sql
-- 사용자 테이블
users (
  id, name, email, hashed_password, role, 
  is_active, created_at, updated_at
)

-- 고객 테이블  
clients (
  id, name, contract_type, license_type,
  license_start, license_end, solution,
  manager_name, manager_email, manager_phone,
  location, memo, is_active, created_at, updated_at
)
```

### 4. 프론트엔드 기능 ✅

- **반응형 UI**: Tailwind CSS 기반
- **동적 라우팅**: 솔루션별 페이지
- **인증 상태 관리**: Context API 사용
- **모던 UI/UX**: Next.js 15 + React 19

## 🔧 개발 환경 설정

### 프론트엔드 설정

- **TypeScript**: 엄격한 타입 체크
- **ESLint**: 코드 품질 관리
- **PostCSS**: CSS 전처리
- **Turbopack**: 빠른 개발 서버
- **CORS**: 프론트엔드-백엔드 통신 허용

### 백엔드 설정

- **FastAPI**: 자동 API 문서 생성
- **SQLAlchemy**: ORM을 통한 데이터베이스 관리
- **Alembic**: 데이터베이스 스키마 버전 관리
- **Pydantic**: 데이터 검증 및 직렬화

## 📊 현재 구현 상태

| 기능 | 상태 | 설명 |
|------|------|------|
| **인증 시스템** | ✅ 완료 | JWT 기반 로그인/회원가입 |
| **고객 관리 CRUD** | ✅ 완료 | 고객 정보 관리 |
| **데이터베이스 스키마** | ✅ 완료 | PostgreSQL 스키마 |
| **프론트엔드 기본 구조** | ✅ 완료 | Next.js App Router |
| **솔루션별 기능** | 🔄 진행중 | 동적 라우팅 구현 |
| **AI 채팅** | 📋 계획 | 구조만 존재 |
| **이슈 관리** | 📋 계획 | 구조만 존재 |
| **문서 관리** | 📋 계획 | 구조만 존재 |


## 📝 API 문서

FastAPI 자동 문서 생성:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요. 