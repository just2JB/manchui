# 만취 웹 (manchui)

한양대학교 ERICA 댄스동아리 **만취**의 공식 웹 서비스입니다.
동아리를 소개하는 공개 사이트, 부원용 **어시스턴트(동아리방)**, 임원진용 **관리자 페이지**, 정기공연 **조명 큐시트**를 하나의 저장소에서 운영합니다.

---

## 1. 서비스 소개

### 1-1. 공개 사이트 (`/`)
누구나 볼 수 있는 페이지입니다.

| 경로 | 내용 |
| --- | --- |
| `/` | 메인: 동아리 소개, 주요 활동, 자주 묻는 질문 |
| `/join`, `/join/form`, `/join/check` | 가입 신청서 작성과 신청 결과 확인 |
| `/goods` | 굿즈 |
| `/contact` | 연락처 |
| `/privacy`, `/terms` | 개인정보 처리방침, 이용약관 |

### 1-2. 어시스턴트 · 동아리방 (`/club`)
로그인한 부원이 쓰는 공간입니다. 이메일 인증 가입과 카카오 로그인을 지원합니다.

| 기능 | 내용 |
| --- | --- |
| 홈 | 동아리 일정과 내 예약·팀 소식 한눈에 보기 |
| 연습실 예약 | 날짜별 예약 현황, 팀 이름으로 예약, 예약 한도 |
| 팀 | 팀 만들기·초대 링크로 참여, 팀 연습 일정 잡기, 팀 투표 |
| 곡 추천 | 곡 추천 올리기·저장하기 |
| 마이페이지 | 프로필·아이디·비밀번호 수정, 내 예약, 저장한 추천 |

### 1-3. 관리자 페이지 (`/admin`, 임원진 전용)

| 메뉴 | 내용 |
| --- | --- |
| 가입 신청 | 신청서 확인·처리 |
| 멤버 / 팀 | 부원과 팀 관리 |
| 예약 관리 | 연습실 예약 관리·결산, 예약 한도 설정, 연습 장소 배정 |
| 곡 추천 / 추첨 | 추천 곡 관리, 추첨 진행 |
| 설정 | 사이트 설정 |
| **아카이브** | 행사별로 그때 쓴 공지를 묶어 보관합니다. 다음 임원진이 "작년 MT 공지는 어떻게 했지?" 할 때 찾아보는 용도입니다. 분류 → 행사 묶음 → 기수별 기록 → 날짜 타임라인 순서로 들어가며, **그래프 보기**에서는 기록·갈래(공연진·곡장 등)·항목·태그·`[[위키링크]]`를 옵시디언처럼 연결해 보여 줍니다. |

### 1-4. 조명 큐시트 (`/lighting`)
정기공연 팀별로 곡마다 조명 큐를 입력합니다. 암전 표시, 시트(CSV) 다운로드를 지원합니다.

---

## 2. 기술 스택과 구조

| 영역 | 사용 기술 |
| --- | --- |
| 프론트엔드 | React 19, Vite 7, React Router 7, TanStack Query, Axios, d3-force(아카이브 그래프), GSAP·motion·three(메인 연출) |
| 백엔드 | Node.js, Express 5, Mongoose 8 (MongoDB) |
| 인증 | JWT 액세스·리프레시 토큰(리프레시 회전), 카카오 OAuth, 이메일 인증(Resend 또는 SMTP) |
| 배포 | 프론트: Vercel (`manchui_web/vercel.json`) · 서버: _(호스팅 서비스 적어 주세요)_ |

```
manchui/
├─ docs/                      설계·계획 문서
└─ manchui_web/
   ├─ client/                 React 앱
   │  └─ src/
   │     ├─ pages/            화면 (MainPage, Join, ClubRoom, Admin, Lighting …)
   │     ├─ components/       공용 컴포넌트
   │     ├─ api/              apiClient(토큰 갱신 포함), tokenStorage
   │     ├─ queries/ hooks/   TanStack Query 훅, 공용 훅
   │     └─ context/ utils/ constants/ config/
   └─ server/                 Express API
      ├─ index.js             앱 진입점, /api/* 라우터 등록
      ├─ routes/              auth · reservation · join · team · practice · recommendations
      │                       lottery · poll · archive · lighting
      ├─ models/              Mongoose 스키마
      ├─ middleware/          requireExecutive 등 권한 확인
      ├─ utils/
      └─ scripts/             1회용 데이터 이전·시드 스크립트
```

---

## 3. 로컬에서 실행하기

필요한 것: Node.js 20 이상, MongoDB(로컬 또는 Atlas)

```bash
# 서버
cd manchui_web/server
npm install
# server/AUTH_ENV.example.md 를 보고 .env 작성
npm run dev            # nodemon

# 클라이언트 (새 터미널)
cd manchui_web/client
npm install
# .env 에 VITE_SERVER_URL=http://localhost:<서버 포트>
npm run dev
```

### 환경 변수
값은 절대 커밋하지 않습니다 (`.env`는 `.gitignore`에 들어 있음). 이름과 설명은 [server/AUTH_ENV.example.md](manchui_web/server/AUTH_ENV.example.md)를 기준으로 합니다.

| 위치 | 변수 |
| --- | --- |
| client | `VITE_SERVER_URL` |
| server | `MONGO_URI`, `PORT`, `CLIENT_URL`, `CLIENT_URLS`, `SERVER_URL`, `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`, `COOKIE_DOMAIN`, `COOKIE_SAME_SITE`, `RESEND_API_KEY`, `RESEND_FROM`, `MAIL_FROM`, `SMTP_*` |

### 점검 명령

```bash
cd manchui_web/client
npm run lint
npm run build
node --test "src/**/*.test.mjs"     # 순수 로직 테스트 (아카이브 등)
```

### 데이터 스크립트 (`server/scripts/`)
대부분 1회용 데이터 이전 스크립트입니다. **기본은 확인만 하고, `--yes`를 붙여야 실제 DB에 저장합니다.** 운영 DB에 돌리기 전에는 반드시 확인 모드 결과를 먼저 보고, 실행 사실을 팀에 공유해 주세요.

---

## 4. 운영 방식

기획·디자인·프론트엔드·백엔드·배포·운영을 **한 명이 모두 맡는 1인 프로젝트**입니다 (GitHub: just2JB).
혼자 하더라도 나중에 기록을 되짚을 수 있게, 그리고 누가 이어받아도 흐름을 알 수 있게 아래 규칙을 지킵니다.

- 운영 DB를 직접 고치는 작업(스크립트 `--yes` 실행)은 PR 본문이나 커밋 본문에 언제·무엇을 바꿨는지 남깁니다.
- DB 구조를 바꾸면(스키마 필드 추가·이름 변경) 기존 데이터가 깨지지 않는지 확인하고 PR에 적습니다.
- 비밀 값(토큰, 비밀번호, API 키)은 저장소·PR·이슈에 올리지 않습니다.

---

## 5. 브랜치 · 커밋 · PR 정책

### 5-1. 브랜치
- `master`: 배포되는 브랜치입니다. 직접 푸시하지 않고 **PR로만** 합칩니다.
- 작업 브랜치는 `master`에서 따서 만들고, 이름은 `타입/짧은-설명`으로 짓습니다.
  - 예: `feat/archive-graph`, `fix/reservation-limit`, `refactor/club-data-cleanup`
  - 한글도 괜찮습니다: `feat/아카이브-그래프`
- 테스트 배포용 브랜치는 `deploy/설명`으로 짓고, 쓰고 나면 지웁니다.

### 5-2. 커밋 메시지
[Conventional Commits](https://www.conventionalcommits.org/ko/) 형식을 따르고, 설명은 **한국어**로 씁니다.

```
<타입>(<범위, 선택>): <무엇을 했는지 한 줄 요약>

<필요하면 본문: 왜 바꿨는지, 주의할 점>
```

| 타입 | 언제 |
| --- | --- |
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `style` | 화면 모양·CSS만 바꿈 (동작 변화 없음) |
| `refactor` | 동작은 그대로 두고 코드 구조만 바꿈 |
| `perf` | 성능 개선 |
| `test` | 테스트 추가·수정 |
| `docs` | 문서 |
| `chore` | 빌드·의존성·설정, 잡일 |
| `data` | 데이터 이전·시드 스크립트 |

범위 예시: `archive`, `reservation`, `team`, `admin`, `club`, `main`, `lighting`, `auth`, `server`

```
feat(archive): 그래프 보기에 갈래(공연진·곡장) 노드 추가
fix(reservation): 자정 넘는 예약이 다음 날 한도에 잡히는 문제 수정
style(admin): 설정 페이지 여백 정리
```

- 커밋 하나에는 한 가지 일만 담습니다. "이것저것", "수정", "ㅇㅇ" 같은 메시지는 쓰지 않습니다.
- 요약은 50자 안팎, 끝에 마침표를 찍지 않습니다.
- `.env`, 개인정보가 담긴 파일(가입 신청 CSV, 카카오톡 대화 원본 등)은 커밋하지 않습니다.
- AI가 코드 대부분을 쓴 커밋에는 마지막 줄에 `Co-Authored-By: <도구·모델 이름> <주소>`를 붙입니다 (아래 [6. AI 활용 기록](#6-ai-활용-기록) 참고).

### 5-3. PR
기능 하나(또는 수정 하나)마다 PR 하나를 엽니다. 혼자 머지하더라도 PR이 **변경 기록이자 체크리스트** 역할을 합니다.

**제목**: 커밋 메시지와 같은 형식 — `feat(archive): 그래프 보기 추가`

**본문 양식**: [.github/pull_request_template.md](.github/pull_request_template.md)에 있고, GitHub에서 PR을 열면 자동으로 채워집니다.
무엇을 / 왜 / 확인한 것(lint·build·test·화면·스크린샷) / AI 사용 / 주의할 점 순서입니다.

**머지 전 셀프 리뷰**
- GitHub의 **Files changed** 탭에서 전체 변경을 한 번 끝까지 읽습니다. 디버그용 `console.log`, 주석 처리한 코드, 의도하지 않은 파일이 섞이지 않았는지 봅니다.
- 위 체크리스트를 모두 채운 뒤 머지합니다.

**머지**
- 기본은 **Squash and merge**입니다. 합쳐진 커밋 메시지는 PR 제목 형식을 그대로 씁니다.
- 머지 후 배포 화면을 한 번 열어 확인하고, 작업 브랜치는 지웁니다.
- 급한 장애 수정은 `fix/` 브랜치로 바로 PR을 열고, 체크리스트 중 못 한 항목은 본문에 "생략: 이유"로 남깁니다.

---

## 6. AI 활용 기록

언제부터 AI를 썼고, 어디까지 사람이 직접 코드를 쓰고 커밋했는지 git 기록을 기준으로 남깁니다.
커밋 작성자 이름(just2JB · 그냥제비 · Just_JB · choijibeom · jibeom choi)은 기기와 계정 설정만 다를 뿐 모두 같은 개발자입니다.

| 기간 | 작성 방식 | 근거 |
| --- | --- | --- |
| 2025-07-29 ~ 2026-02-14 | **사람이 직접 작성** | 첫 커밋 `4d71a73`부터. 커밋 메시지·코드에 AI 사용 표시 없음 |
| 2026-02-15 ~ 2026-10-28 | **사람이 작성, 일부 AI 보조** | `d66d205` (2026-02-15) "AI 디자인 로그인창, 굿즈, 가입하기"에서 처음 AI 사용을 적음. 2026-02-21 · 2026-04-08의 영어 서술형 커밋 메시지는 커밋 메시지 자동 생성으로 추정 |
| 2026-10-29 ~ 현재 | **AI 공동 작성** (Claude Code, Claude Opus 5.5) | `3ea948a` (2026-10-29) "동아리방 예약 개편"부터 `Co-Authored-By: Claude` 표시. 사람은 요구사항 정리·방향 결정·검토·커밋을 맡음 |

- **AI 표시가 없는 마지막 커밋**: `72fd616` (2026-09-25) "주요활동 이모지화"
- **AI 공동 작성 표시가 붙은 첫 커밋**: `3ea948a` (2026-10-29)
- 2026-10-29 이후 커밋 중 표시가 빠진 것도 있습니다: `0bba2e9` · `4ae57fa` · `b26ae2a` · `26ceda3` · `707a0b7` · `74600d3` · `3f2ef65` (2026-11-20), `337fb86` (2026-11-21), `826be09` (2026-11-23). 같은 시기 작업이라 AI 공동 작성으로 봅니다.
- 앞으로는 커밋의 `Co-Authored-By` 줄과 PR 양식의 **AI 사용** 항목으로 기록합니다.

**AI 시기에 만든 주요 기능**: 어시스턴트 PC 화면과 새 디자인 룩, 연습실 예약 개편·결산, 정기공연 조명 큐시트(`/lighting`), 아카이브 그래프 보기·갈래, 이 README와 PR 양식

---

## 7. 관련 문서
- [자료 저장과 React Native 앱 배포 계획](docs/storage-and-mobile-roadmap.md)
- [서버 환경 변수 예시](manchui_web/server/AUTH_ENV.example.md)
