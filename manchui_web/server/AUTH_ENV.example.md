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

## Token behavior

- **Access token**: 15 minutes, returned in JSON and optional httpOnly cookie; client stores in `localStorage` as `accessToken`.
- **Refresh token**: 30 days, httpOnly cookie only; stored hashed in MongoDB with rotation on `/api/auth/refresh`.
