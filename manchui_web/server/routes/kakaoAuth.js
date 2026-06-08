const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const {
  issueTokenPair,
  setAuthCookies,
  buildAuthResponse,
} = require("../utils/tokens");

const requireAuth = require("../middleware/requireAuth");

function getSignupSecret() {
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

function getClientUrl() {
  return (process.env.CLIENT_URL || "").replace(/\/$/, "");
}

function getKakaoRedirectUri() {
  return (
    process.env.KAKAO_REDIRECT_URI ||
    `${(process.env.SERVER_URL || "").replace(/\/$/, "")}/api/auth/kakao/callback`
  );
}

const router = express.Router();

function signOAuthState({ fromPath, purpose = "kakao_oauth", userId }) {
  return jwt.sign(
    {
      purpose,
      nonce: crypto.randomBytes(16).toString("hex"),
      from: fromPath || "/club",
      ...(userId ? { userId: String(userId) } : {}),
    },
    getSignupSecret(),
    { expiresIn: "10m" },
  );
}

function buildKakaoAuthorizeUrl(state) {
  const apiKey = (process.env.KAKAO_REST_API_KEY || "").trim();
  const params = new URLSearchParams({
    client_id: apiKey,
    redirect_uri: getKakaoRedirectUri(),
    response_type: "code",
    state,
    scope: "profile_nickname account_email",
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

function verifyOAuthState(state) {
  const decoded = jwt.verify(state, getSignupSecret());
  const purpose = decoded.purpose || "kakao_oauth";
  if (!["kakao_oauth", "kakao_link"].includes(purpose)) {
    throw new Error("Invalid OAuth purpose");
  }
  return { ...decoded, purpose };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findUserByKakaoId(kakaoId) {
  const normalized = String(kakaoId || "").trim();
  if (!normalized) return null;

  const candidates = [normalized];
  if (/^\d+$/.test(normalized)) {
    candidates.push(Number(normalized));
  }

  return User.findOne({ kakaoId: { $in: candidates } });
}

async function findUserByEmail(email) {
  const trimmed = (email || "").trim();
  if (!trimmed) return null;
  return User.findOne({
    email: { $regex: new RegExp(`^${escapeRegExp(trimmed)}$`, "i") },
  });
}

function signKakaoSignupToken({ kakaoId, email, nickname }) {
  return jwt.sign(
    { purpose: "kakao_signup", kakaoId, email, nickname },
    getSignupSecret(),
    { expiresIn: "5m" },
  );
}

function verifyKakaoSignupToken(token) {
  const decoded = jwt.verify(token, getSignupSecret());
  if (decoded.purpose !== "kakao_signup") {
    throw new Error("Invalid signup token");
  }
  return decoded;
}

async function exchangeKakaoCode(code) {
  const clientId = (process.env.KAKAO_REST_API_KEY || "").trim();
  const clientSecret = (process.env.KAKAO_CLIENT_SECRET || "").trim();

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: getKakaoRedirectUri(),
    code,
  });

  if (clientSecret) {
    params.set("client_secret", clientSecret);
  }

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kakao token exchange failed: ${err}`);
  }

  return response.json();
}

async function fetchKakaoProfile(accessToken) {
  const body = new URLSearchParams({
    property_keys: JSON.stringify([
      "kakao_account.profile",
      "kakao_account.email",
      "kakao_account.name",
      "properties",
    ]),
  });

  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kakao profile fetch failed: ${err}`);
  }

  return response.json();
}

function extractKakaoNickname(profile) {
  return (
    profile.kakao_account?.profile?.nickname?.trim() ||
    profile.kakao_account?.name?.trim() ||
    profile.properties?.nickname?.trim() ||
    ""
  );
}

function redirectWithError(res, message) {
  const clientUrl = getClientUrl();
  const params = new URLSearchParams({ error: message });
  return res.redirect(`${clientUrl}/club/login?${params.toString()}`);
}

function redirectWithLinkResult(res, { fromPath, success, error, emailUpdated }) {
  const clientUrl = getClientUrl();
  const path = fromPath || "/club/mypage/profile";
  const params = new URLSearchParams();
  if (success) {
    params.set("kakaoLink", emailUpdated ? "success-email-updated" : "success");
  }
  if (error) params.set("kakaoLinkError", error);
  const query = params.toString();
  return res.redirect(`${clientUrl}${path}${query ? `?${query}` : ""}`);
}

async function linkKakaoToUser(user, kakaoId, kakaoEmail) {
  const normalizedKakaoId = String(kakaoId);

  if (user.kakaoId) {
    if (String(user.kakaoId) === normalizedKakaoId) {
      return { user, emailUpdated: false, alreadyLinked: true };
    }
    const err = new Error("ALREADY_LINKED");
    err.message = "이미 카카오가 연동되어 있습니다.";
    throw err;
  }

  const existingKakaoUser = await findUserByKakaoId(normalizedKakaoId);
  if (existingKakaoUser && String(existingKakaoUser._id) !== String(user._id)) {
    const err = new Error("KAKAO_IN_USE");
    err.message = "이미 다른 계정에 연결된 카카오입니다.";
    throw err;
  }

  let emailUpdated = false;
  const trimmedKakaoEmail = (kakaoEmail || "").trim();
  if (trimmedKakaoEmail) {
    const currentEmail = (user.email || "").trim();
    const emailsDiffer =
      !currentEmail ||
      currentEmail.toLowerCase() !== trimmedKakaoEmail.toLowerCase();

    if (emailsDiffer) {
      const emailTaken = await findUserByEmail(trimmedKakaoEmail);
      if (emailTaken && String(emailTaken._id) !== String(user._id)) {
        const err = new Error("EMAIL_IN_USE");
        err.message =
          "카카오 이메일로 가입된 다른 계정이 있어 이메일을 변경할 수 없습니다. 해당 계정으로 로그인해 주세요.";
        throw err;
      }
      user.email = trimmedKakaoEmail;
      emailUpdated = Boolean(currentEmail);
    }
  }

  user.kakaoId = normalizedKakaoId;
  user.authProvider =
    !user.authProvider || user.authProvider === "local" ? "both" : user.authProvider;
  await user.save();
  return { user, emailUpdated, alreadyLinked: false };
}

async function loginExistingUser(res, user, fromPath) {
  const { accessToken, refreshToken } = await issueTokenPair(user);
  setAuthCookies(res, accessToken, refreshToken);
  const clientUrl = getClientUrl();
  const from = encodeURIComponent(fromPath || "/club");
  return res.redirect(`${clientUrl}/club/auth/kakao/callback?from=${from}`);
}

async function loginKakaoOwnerIfExists(res, kakaoId, fromPath) {
  const owner = await findUserByKakaoId(kakaoId);
  if (!owner) return null;
  return loginExistingUser(res, owner, fromPath);
}

router.get("/kakao", (req, res) => {
  const apiKey = (process.env.KAKAO_REST_API_KEY || "").trim();
  if (!apiKey || apiKey === "...") {
    return res.status(500).json({ message: "카카오 로그인이 설정되지 않았습니다." });
  }

  const from = typeof req.query.from === "string" ? req.query.from : "/club";
  const state = signOAuthState({ fromPath: from, purpose: "kakao_oauth" });

  return res.redirect(buildKakaoAuthorizeUrl(state));
});

router.post("/kakao/link/start", requireAuth, (req, res) => {
  const apiKey = (process.env.KAKAO_REST_API_KEY || "").trim();
  if (!apiKey || apiKey === "...") {
    return res.status(500).json({ message: "카카오 로그인이 설정되지 않았습니다." });
  }

  const from =
    typeof req.body?.from === "string" ? req.body.from : "/club/mypage/profile";
  const state = signOAuthState({
    fromPath: from,
    purpose: "kakao_link",
    userId: req.userId,
  });

  res.json({ authorizeUrl: buildKakaoAuthorizeUrl(state) });
});

router.get("/kakao/callback", async (req, res) => {
  try {
    const { code, state, error, error_description: errorDescription } = req.query;

    let statePayload = null;
    if (state) {
      try {
        statePayload = verifyOAuthState(state);
      } catch (_) {
        if (!error) {
          return redirectWithError(res, "카카오 로그인 상태가 만료되었습니다.");
        }
      }
    }

    if (error) {
      const message =
        errorDescription || error || "카카오 로그인이 취소되었습니다.";
      if (statePayload?.purpose === "kakao_link") {
        return redirectWithLinkResult(res, {
          fromPath: statePayload.from,
          error: message,
        });
      }
      return redirectWithError(res, message);
    }

    if (!code || !state) {
      return redirectWithError(res, "카카오 인증 정보가 올바르지 않습니다.");
    }

    if (!statePayload) {
      return redirectWithError(res, "카카오 로그인 상태가 만료되었습니다.");
    }

    const tokenData = await exchangeKakaoCode(code);
    const profile = await fetchKakaoProfile(tokenData.access_token);
    const kakaoId = String(profile.id);
    const email = profile.kakao_account?.email?.trim() || "";
    const nickname = extractKakaoNickname(profile);

    const fromPath = statePayload.from || "/club";

    if (statePayload.purpose === "kakao_link") {
      const user = await User.findById(statePayload.userId);
      if (!user) {
        return redirectWithLinkResult(res, {
          fromPath,
          error: "연동할 계정을 찾을 수 없습니다.",
        });
      }

      if (!email) {
        return redirectWithLinkResult(res, {
          fromPath,
          error:
            "카카오 이메일 동의가 필요합니다. 카카오 계정 설정에서 이메일 제공에 동의한 뒤 다시 시도해 주세요.",
        });
      }

      try {
        const { emailUpdated } = await linkKakaoToUser(user, kakaoId, email);
        return redirectWithLinkResult(res, {
          fromPath,
          success: true,
          emailUpdated,
        });
      } catch (linkErr) {
        const loggedIn = await loginKakaoOwnerIfExists(res, kakaoId, fromPath);
        if (loggedIn) return loggedIn;
        return redirectWithLinkResult(res, {
          fromPath,
          error: linkErr.message || "카카오 연동에 실패했습니다.",
        });
      }
    }

    const kakaoOwner = await findUserByKakaoId(kakaoId);
    if (kakaoOwner) {
      return loginExistingUser(res, kakaoOwner, fromPath);
    }

    if (email) {
      const emailUser = await findUserByEmail(email);
      if (emailUser) {
        try {
          const { user: linkedUser } = await linkKakaoToUser(
            emailUser,
            kakaoId,
            email,
          );
          return loginExistingUser(res, linkedUser, fromPath);
        } catch (linkErr) {
          const loggedIn = await loginKakaoOwnerIfExists(res, kakaoId, fromPath);
          if (loggedIn) return loggedIn;
          return redirectWithError(
            res,
            linkErr.message || "카카오 연동에 실패했습니다.",
          );
        }
      }
    }

    if (!email) {
      return redirectWithError(
        res,
        "카카오 이메일 동의가 필요합니다. 카카오 계정 설정에서 이메일 제공에 동의해 주세요.",
      );
    }

    const signupToken = signKakaoSignupToken({ kakaoId, email, nickname });
    const clientUrl = getClientUrl();
    const params = new URLSearchParams({
      kakaoSignup: "1",
      signupToken,
      from: fromPath,
    });
    return res.redirect(`${clientUrl}/club/login?${params.toString()}`);
  } catch (err) {
    console.error("Kakao callback error:", err.message);
    return redirectWithError(res, "카카오 로그인 처리 중 오류가 발생했습니다.");
  }
});

router.post("/kakao/complete-signup", async (req, res) => {
  try {
    const { signupToken, nickname, Identification } = req.body;

    if (!signupToken) {
      return res.status(400).json({ message: "카카오 가입 세션이 없습니다." });
    }

    if (!Identification?.trim()) {
      return res.status(400).json({ message: "아이디를 입력해 주세요." });
    }

    let payload;
    try {
      payload = verifyKakaoSignupToken(signupToken);
    } catch (_) {
      return res.status(401).json({
        message: "카카오 가입 세션이 만료되었습니다. 다시 카카오 로그인을 시도해 주세요.",
      });
    }

    const { kakaoId, email, nickname: kakaoNickname } = payload;
    const finalUsername =
      (nickname || "").trim() ||
      (kakaoNickname || "").trim();

    if (!finalUsername) {
      return res.status(400).json({ message: "닉네임을 입력해 주세요." });
    }

    const existingKakao = await findUserByKakaoId(kakaoId);
    if (existingKakao) {
      const { accessToken, refreshToken } = await issueTokenPair(existingKakao);
      setAuthCookies(res, accessToken, refreshToken);
      return res.json(buildAuthResponse(existingKakao, accessToken, refreshToken));
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      try {
        const { user: linkedUser } = await linkKakaoToUser(
          existingEmail,
          kakaoId,
          email,
        );
        const { accessToken, refreshToken } = await issueTokenPair(linkedUser);
        setAuthCookies(res, accessToken, refreshToken);
        return res.json(buildAuthResponse(linkedUser, accessToken, refreshToken));
      } catch (linkErr) {
        const owner = await findUserByKakaoId(kakaoId);
        if (owner) {
          const { accessToken, refreshToken } = await issueTokenPair(owner);
          setAuthCookies(res, accessToken, refreshToken);
          return res.json(buildAuthResponse(owner, accessToken, refreshToken));
        }
        return res.status(401).json({
          message: linkErr.message || "카카오 연동에 실패했습니다.",
        });
      }
    }

    const existingIdentification = await User.findOne({
      Identification: Identification.trim(),
    });
    if (existingIdentification) {
      return res.status(401).json({ message: "중복되는 아이디 입니다." });
    }

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = new User({
      username: finalUsername,
      Identification: Identification.trim(),
      email,
      password: hashedPassword,
      kakaoId,
      authProvider: "kakao",
      emailVerified: true,
    });
    await user.save();

    const { accessToken, refreshToken } = await issueTokenPair(user);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json(buildAuthResponse(user, accessToken, refreshToken));
  } catch (error) {
    console.error("Kakao complete-signup error:", error.message);
    res.status(500).json({ message: "회원가입 처리 중 오류가 발생했습니다." });
  }
});

module.exports = router;
