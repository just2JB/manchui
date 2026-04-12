const jwt = require("jsonwebtoken");
const getToken = require("../utils/getToken");

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (_) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}

module.exports = requireAuth;
