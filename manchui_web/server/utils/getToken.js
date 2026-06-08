/**
 * Access/Refresh 토큰 추출.
 * iOS Safari 등에서 크로스 사이트 쿠키가 막힐 수 있어, access는 Bearer 헤더도 지원.
 */

function getAccessToken(req) {
  const fromAccessCookie = req.cookies?.accessToken;
  if (fromAccessCookie) return fromAccessCookie;

  const fromLegacyCookie = req.cookies?.token;
  if (fromLegacyCookie) return fromLegacyCookie;

  const auth = req.headers?.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

function getRefreshToken(req) {
  return req.cookies?.refreshToken || null;
}

/** @deprecated getAccessToken 사용 */
function getToken(req) {
  return getAccessToken(req);
}

module.exports = getToken;
module.exports.getAccessToken = getAccessToken;
module.exports.getRefreshToken = getRefreshToken;
