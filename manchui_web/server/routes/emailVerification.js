const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const { sendSignupVerificationEmail } = require("../utils/mail");
const { buildEmailCodeCopyPage } = require("../utils/emailTemplates/emailCodeCopyPage");

const router = express.Router();

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const VERIFICATION_TOKEN_TTL = "15m";

function getVerificationSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function signEmailVerificationToken(email) {
  return jwt.sign(
    { purpose: "email_verified", email: normalizeEmail(email) },
    getVerificationSecret(),
    { expiresIn: VERIFICATION_TOKEN_TTL },
  );
}

function verifyEmailVerificationToken(token) {
  const decoded = jwt.verify(token, getVerificationSecret());
  if (decoded.purpose !== "email_verified" || !decoded.email) {
    throw new Error("Invalid verification token");
  }
  return decoded;
}

async function findRegisteredUserByEmail(email) {
  const normalized = normalizeEmail(email);
  return User.findOne({
    email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });
}

router.get("/email/copy/:code", (req, res) => {
  const code = String(req.params.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).send("올바르지 않은 인증번호입니다.");
  }
  res.type("html").send(buildEmailCodeCopyPage(code));
});

router.post("/email/send-code", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "올바른 이메일 주소를 입력해 주세요." });
    }

    const existingUser = await findRegisteredUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "이미 가입된 이메일입니다." });
    }

    const existing = await EmailVerification.findOne({ email });
    if (
      existing?.lastSentAt &&
      Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000,
      );
      return res.status(429).json({
        message: `${waitSec}초 후에 다시 요청할 수 있습니다.`,
        retryAfterSec: waitSec,
      });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await EmailVerification.findOneAndUpdate(
      { email },
      {
        email,
        codeHash: hashCode(code),
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const mailResult = await sendSignupVerificationEmail(
      email,
      code,
      CODE_TTL_MS / 60000,
    );

    res.json({
      message: "인증번호를 이메일로 발송했습니다.",
      expiresInMinutes: CODE_TTL_MS / 60000,
      sentTo: email,
      devMode: mailResult.devMode,
    });
  } catch (error) {
    console.error("send-code error:", error.message, error.response || "");
    res.status(500).json({ message: "인증번호 발송에 실패했습니다." });
  }
});

router.post("/email/verify-code", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || "").trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "올바른 이메일 주소를 입력해 주세요." });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: "6자리 인증번호를 입력해 주세요." });
    }

    const record = await EmailVerification.findOne({ email });
    if (!record) {
      return res.status(400).json({
        message: "인증번호를 먼저 요청해 주세요.",
      });
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        message: "인증번호가 만료되었습니다. 다시 요청해 주세요.",
      });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        message: "인증 시도 횟수를 초과했습니다. 인증번호를 다시 요청해 주세요.",
      });
    }

    const isMatch = hashCode(code) === record.codeHash;
    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "인증번호가 올바르지 않습니다." });
    }

    await EmailVerification.deleteOne({ _id: record._id });

    const emailVerificationToken = signEmailVerificationToken(email);
    res.json({
      message: "이메일 인증이 완료되었습니다.",
      emailVerificationToken,
    });
  } catch (error) {
    console.error("verify-code error:", error.message);
    res.status(500).json({ message: "인증번호 확인에 실패했습니다." });
  }
});

module.exports = router;
module.exports.verifyEmailVerificationToken = verifyEmailVerificationToken;
module.exports.normalizeEmail = normalizeEmail;
