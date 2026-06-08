# Server environment variables (auth)

Copy to `.env` in this directory and fill in values.

```env
MONGO_URI=
CLIENT_URL=https://www.example.com
SERVER_URL=https://api.example.com

# Access token signing (falls back to JWT_SECRET if unset)
JWT_SECRET=
JWT_ACCESS_SECRET=

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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="만취" <noreply@example.com>
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

## Token behavior

- **Access token**: 15 minutes, returned in JSON and optional httpOnly cookie; client stores in `localStorage` as `accessToken`.
- **Refresh token**: 30 days, httpOnly cookie only; stored hashed in MongoDB with rotation on `/api/auth/refresh`.
