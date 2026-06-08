const { getAccessToken } = require("../utils/getToken");
const { verifyAccessToken } = require("../utils/tokens");

function requireAuth(req, res, next) {
  const token = getAccessToken(req);
  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    next();
  } catch (_) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}

module.exports = requireAuth;
