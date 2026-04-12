const jwt = require("jsonwebtoken");
const getToken = require("../utils/getToken");
const User = require("../models/User");

/**
 * JWT로 인증하고, position이 "임원진"인 사용자만 통과.
 * req.adminUserId 에 ObjectId 설정.
 */
async function requireExecutive(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }
    if (user.position !== "임원진") {
      return res.status(403).json({ message: "임원진만 접근할 수 있습니다." });
    }
    req.adminUserId = user._id;
    next();
  } catch (e) {
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}

module.exports = requireExecutive;
