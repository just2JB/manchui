const { getAccessToken } = require("../utils/getToken");
const { verifyAccessToken } = require("../utils/tokens");

/** 토큰이 있으면 검증해 req.userId(ObjectId 문자열) 설정, 없거나 무효면 null */
function optionalAuth(req, res, next) {
  req.userId = null;
  const token = getAccessToken(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
  } catch (_) {
    req.userId = null;
  }
  next();
}

module.exports = optionalAuth;
