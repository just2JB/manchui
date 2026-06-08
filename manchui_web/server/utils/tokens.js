const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, type: "access" },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getAccessSecret());
}

function cookieOptions(maxAge) {
  const sameSite = (process.env.COOKIE_SAME_SITE || "none").toLowerCase();
  const opts = {
    httpOnly: true,
    secure: sameSite === "none" ? true : process.env.NODE_ENV === "production",
    sameSite,
    maxAge,
  };

  const domain = (process.env.COOKIE_DOMAIN || "").trim();
  if (domain) {
    opts.domain = domain;
  }

  return opts;
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, cookieOptions(REFRESH_TOKEN_MS));
  // 전환 기간: 일부 클라이언트/프록시 호환
  res.cookie("token", accessToken, cookieOptions(15 * 60 * 1000));
}

function clearAuthCookies(res) {
  const sameSite = (process.env.COOKIE_SAME_SITE || "none").toLowerCase();
  const opts = {
    httpOnly: true,
    secure: sameSite === "none" ? true : process.env.NODE_ENV === "production",
    sameSite,
  };
  const domain = (process.env.COOKIE_DOMAIN || "").trim();
  if (domain) {
    opts.domain = domain;
  }
  res.clearCookie("accessToken", opts);
  res.clearCookie("refreshToken", opts);
  res.clearCookie("token", opts);
}

async function storeRefreshToken(userId, refreshToken) {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);
  await RefreshToken.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
  });
  return expiresAt;
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  await storeRefreshToken(user._id, refreshToken);
  return { accessToken, refreshToken };
}

async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
}

async function revokeAllRefreshTokens(userId) {
  await RefreshToken.deleteMany({ userId });
}

/**
 * refresh 토큰 검증 후 로테이션. 재사용(이미 삭제된 해시) 시 해당 사용자 전체 refresh 무효화.
 */
async function rotateRefreshToken(refreshToken) {
  if (!refreshToken) return null;

  const tokenHash = hashToken(refreshToken);
  const record = await RefreshToken.findOne({ tokenHash });
  if (!record || record.expiresAt < new Date()) {
    if (record) {
      await RefreshToken.deleteMany({ userId: record.userId });
    }
    return null;
  }

  await RefreshToken.deleteOne({ _id: record._id });
  return { userId: record.userId };
}

function sanitizeUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.schedule;
  delete obj.recommendationLikes;
  delete obj.recommendationScraps;
  return obj;
}

function buildAuthResponse(user, accessToken, refreshToken) {
  return {
    user: sanitizeUser(user),
    accessToken,
    token: accessToken,
    refreshToken,
  };
}

module.exports = {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_MS,
  signAccessToken,
  verifyAccessToken,
  setAuthCookies,
  clearAuthCookies,
  issueTokenPair,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  rotateRefreshToken,
  sanitizeUser,
  buildAuthResponse,
  hashToken,
  getAccessSecret,
};
