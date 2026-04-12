const jwt = require("jsonwebtoken");
const getToken = require("../utils/getToken");

/** 토큰이 있으면 검증해 req.userId(ObjectId 문자열) 설정, 없거나 무효면 null */
function optionalAuth(req, res, next) {
  req.userId = null;
  const token = getToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch (_) {
    req.userId = null;
  }
  next();
}

module.exports = optionalAuth;
