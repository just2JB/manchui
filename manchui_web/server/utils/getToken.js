/**
 * 쿠키 또는 Authorization 헤더에서 토큰 반환.
 * iOS Safari 등에서 크로스 사이트 쿠키가 막힐 수 있어, 헤더(Bearer)도 지원.
 */
function getToken(req) {
  const fromCookie = req.cookies?.token;
  if (fromCookie) return fromCookie;
  const auth = req.headers?.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

module.exports = getToken;
