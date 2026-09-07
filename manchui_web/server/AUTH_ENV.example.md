# Server environment variables (auth)

Copy to `.env` in this directory and fill in values.

```env
MONGO_URI=
CLIENT_URL=https://www.example.com
SERVER_URL=https://api.example.com

# Access token signing (falls back to JWT_SECRET if unset)
JWT_SECRET=
JWT_ACCESS_SECRET=

# 이벤트 투표 식별자 HMAC 키 (미설정 시 JWT_SECRET 사용)
EVENT_VOTER_HASH_SECRET=

# Refresh token rotation + Kakao OAuth state/signup tokens
JWT_REFRESH_SECRET=

# Kakao Developers → REST API key
KAKAO_REST_API_KEY=
# [앱] > [플랫폼 키] > REST API 키 > Client Secret (ON이면 필수)
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=https://api.example.com/api/auth/kakao/callback

# Optional: cookie domain when frontend/API share parent domain (e.g. .example.com)
# COOKIE_DOMAIN=.example.com
# COOKIE_SAME_SITE=none

# Optional: extra allowed frontend origins (comma-separated)
# CLIENT_URLS=https://preview.example.com

# Email verification (signup)
# 배포(Render/Railway 등)에서는 SMTP 포트(587/465)가 차단될 수 있어 Resend(HTTPS) 권장
RESEND_API_KEY=
RESEND_FROM="만취" <noreply@yourdomain.com>
# 또는 공통 발신 주소 (Resend/SMTP 공용)
# MAIL_FROM="만취" <noreply@yourdomain.com>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
# SMTP_FROM 전체를 따옴표로 감싸면 dotenv 파싱 오류가 날 수 있음 → MAIL_FROM 사용 권장
SMTP_FROM=
```

## Kakao Developers console

1. Create an app and copy the REST API key to `KAKAO_REST_API_KEY`.
2. Set **Redirect URI** to `KAKAO_REDIRECT_URI` (must match exactly).
3. Enable consent items: **Kakao account email**, **Profile nickname**.
4. Register **Web** site domain from `CLIENT_URL`.

## Production (Vercel + API server)

**Server `.env`**
- `CLIENT_URL` = 실제 프론트 URL (예: `https://www.manchui.com`)
- `KAKAO_REDIRECT_URI` = API 서버 콜백 (예: `https://api.manchui.com/api/auth/kakao/callback`)
- 카카오 콘솔 Redirect URI / Web 도메인도 위와 동일하게 등록

**Vercel (client) Environment Variables** — 빌드 시점에 박힘
- `VITE_SERVER_URL` = API 서버 URL (예: `https://api.manchui.com`)

배포 후 프론트에서 카카오 로그인 → API 콜백 → `kakaoTicket`으로 세션 교환 (`POST /api/auth/kakao/exchange`).

## Email verification (production)

**Render / Railway 무료·일부 플랜**은 SMTP 포트(25, 465, 587) 아웃바운드를 차단합니다. Gmail SMTP가 로컬에서는 되고 배포에서만 안 되면 이 경우가 많습니다.

**권장: Resend (HTTPS, 포트 443)**
1. [resend.com](https://resend.com)에서 API Key 발급
2. 발신 도메인 DNS 인증 (또는 테스트용 `onboarding@resend.dev`)
3. API 서버 env:
   - `RESEND_API_KEY=re_...`
   - `RESEND_FROM=만취 <noreply@yourdomain.com>` 또는 `MAIL_FROM=...`
   - `SERVER_URL=https://api.example.com` (메일 내 복사 링크용)

**SMTP 사용 시 (VPS·SMTP 허용 플랜)**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` 설정
- `NODE_ENV=production` 이면 SMTP/Resend 중 하나 필수 (미설정 시 503)
- Gmail은 앱 비밀번호 사용, `SMTP_PASS` 공백은 자동 제거됨

서버 기동 로그: `[mail] provider=resend` 또는 `[mail] provider=smtp ...` 확인

## Token behavior

- **Access token**: 15 minutes, returned in JSON and optional httpOnly cookie; client stores in `localStorage` as `accessToken`.
- **Refresh token**: 30 days, httpOnly cookie only; stored hashed in MongoDB with rotation on `/api/auth/refresh`.
