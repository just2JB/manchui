const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { getAccessToken, getRefreshToken } = require("../utils/getToken");
const {
  issueTokenPair,
  setAuthCookies,
  clearAuthCookies,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  verifyAccessToken,
  sanitizeUser,
  buildAuthResponse,
} = require("../utils/tokens");
const requireExecutive = require("../middleware/requireExecutive");
const kakaoAuthRouter = require("./kakaoAuth");
const emailVerificationRouter = require("./emailVerification");
const {
  verifyEmailVerificationToken,
  normalizeEmail,
} = require("./emailVerification");

router.use(kakaoAuthRouter);
router.use(emailVerificationRouter);

async function sendAuthSuccess(res, user) {
  const { accessToken, refreshToken } = await issueTokenPair(user);
  setAuthCookies(res, accessToken, refreshToken);
  res.json(buildAuthResponse(user, accessToken, refreshToken));
}

router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      Identification,
      emailVerificationToken,
    } = req.body;

    if (!emailVerificationToken) {
      return res.status(400).json({ message: "이메일 인증이 필요합니다." });
    }

    let verifiedEmail;
    try {
      const payload = verifyEmailVerificationToken(emailVerificationToken);
      verifiedEmail = normalizeEmail(payload.email);
    } catch (_) {
      return res.status(401).json({
        message: "이메일 인증이 만료되었습니다. 인증번호를 다시 요청해 주세요.",
      });
    }

    const normalizedInputEmail = normalizeEmail(email);
    if (!normalizedInputEmail || normalizedInputEmail !== verifiedEmail) {
      return res.status(400).json({
        message: "인증한 이메일과 가입 이메일이 일치하지 않습니다.",
      });
    }

    const existingUser = await User.findOne({ email: normalizedInputEmail });
    if (existingUser) {
      return res.status(401).json({ message: "이미 가입된 이메일 입니다." });
    }
    const existingIdentification = await User.findOne({ Identification });
    if (existingIdentification) {
      return res.status(401).json({ message: "중복되는 아이디 입니다." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      Identification,
      username,
      email: normalizedInputEmail,
      password: hashedPassword,
      authProvider: "local",
      emailVerified: true,
    });
    await user.save();
    res.status(201).json({ message: "계정 생성이 완료되었습니다." });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    if (user.authProvider === "kakao") {
      return res.status(401).json({
        message: "카카오 로그인으로 가입한 계정입니다. 카카오로 로그인해 주세요.",
      });
    }

    if (user.emailVerified === false) {
      return res.status(401).json({
        message: "이메일 인증이 완료되지 않은 계정입니다.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
    }

    await sendAuthSuccess(res, user);
  } catch (error) {
    console.log("서버 오류:", error.message);
    res.status(501).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = getRefreshToken(req);
    const rotation = await rotateRefreshToken(refreshToken);
    if (!rotation) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "유효하지 않은 refresh 토큰입니다." });
    }

    const user = await User.findById(rotation.userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await issueTokenPair(user);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({
      accessToken,
      token: accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log("refresh 오류:", error.message);
    res.status(500).json({ message: "토큰 갱신에 실패했습니다." });
  }
});

router.post("/session", async (req, res) => {
  try {
    const refreshToken = getRefreshToken(req);
    if (!refreshToken) {
      return res.status(401).json({ message: "세션 쿠키가 없습니다." });
    }

    const rotation = await rotateRefreshToken(refreshToken);
    if (!rotation) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "유효하지 않은 세션입니다." });
    }

    const user = await User.findById(rotation.userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await issueTokenPair(user);
    setAuthCookies(res, accessToken, newRefreshToken);
    res.json(buildAuthResponse(user, accessToken, newRefreshToken));
  } catch (error) {
    console.log("session 오류:", error.message);
    res.status(500).json({ message: "세션 확인에 실패했습니다." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = getRefreshToken(req);
    await revokeRefreshToken(refreshToken);
    clearAuthCookies(res);
    res.json({ message: "로그아웃 되었습니다." });
  } catch (error) {
    console.log("로그아웃 오류:", error.message);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.delete("/delete/:userId", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "계정을 찾을 수 없습니다." });
    }
    await revokeAllRefreshTokens(req.params.userId);
    res.json({ message: "계정을 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/verify-token", async (req, res) => {
  const token = getAccessToken(req);
  if (!token) {
    return res.status(401).json({ isVaild: false, message: "토큰이 없습니다" });
  }
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res
        .status(401)
        .json({ isVaild: false, message: "사용자를 찾을 수 없습니다." });
    }
    return res.status(201).json({
      isValid: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res
      .status(401)
      .json({ isVaild: false, message: "유효하지 않은 토큰" });
  }
});

router.post("/edit/:data", async (req, res) => {
  try {
    const { userId, formData } = req.body;
    const dataName = req.params.data;
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "계정을 찾을 수 없습니다." });
    }
    if (dataName === "password") {
      if (user.authProvider === "kakao") {
        return res.status(400).json({
          message: "카카오 전용 계정은 비밀번호를 변경할 수 없습니다.",
        });
      }
      const changePassword = formData.changePassword;
      const checkPassword = formData.checkPassword;
      const isValidPassword = await bcrypt.compare(
        formData.password,
        user.password,
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
      }
      if (checkPassword !== changePassword) {
        return res
          .status(401)
          .json({ message: "변경될 비밀번호와 확인 비밀번호가 다릅니다." });
      }
      const hashedPassword = await bcrypt.hash(changePassword, 10);
      user.password = hashedPassword;
      await user.save();
      res.status(201).json({ message: "수정되었습니다" });
      return;
    }

    if (dataName === "Identification") {
      const Identification = formData.Identification;
      const existingIdentification = await User.findOne({ Identification });
      if (existingIdentification) {
        return res.status(401).json({ message: "중복되는 아이디 입니다." });
      }
    }

    user[dataName] = formData[dataName];
    await user.save();
    res.status(201).json({ message: "수정되었습니다" });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/delete/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "계정을 찾을 수 없습니다." });
    }
    await revokeAllRefreshTokens(userId);
    clearAuthCookies(res);
    res.json({ message: "계정이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** --- 임원진 전용: 부원 목록·직책 변경·강제 탈퇴 --- */
const EXECUTIVE_POSITION = "임원진";
const MEMBER_POSITION_DEFAULT = "댄서";

router.get("/admin/members", requireExecutive, async (req, res) => {
  try {
    const raw = await User.find({})
      .select("-password")
      .sort({ username: 1 })
      .lean();
    const members = raw.map((doc) => {
      let joinedAt = doc.createdAt || null;
      if (!joinedAt && doc._id?.getTimestamp) {
        try {
          joinedAt = doc._id.getTimestamp();
        } catch (_) {
          joinedAt = null;
        }
      }
      return {
        ...doc,
        joinedAt: joinedAt ? joinedAt.toISOString() : null,
      };
    });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ message: "회원 목록을 불러오지 못했습니다." });
  }
});

router.patch("/admin/members/:id/position", requireExecutive, async (req, res) => {
  try {
    const { position } = req.body;
    const allowed = [EXECUTIVE_POSITION, MEMBER_POSITION_DEFAULT];
    if (!allowed.includes(position)) {
      return res.status(400).json({ message: "허용되지 않은 직책입니다." });
    }
    const targetId = req.params.id;
    if (String(req.adminUserId) === String(targetId) && position !== EXECUTIVE_POSITION) {
      return res.status(400).json({ message: "본인의 임원진 권한은 여기서 해제할 수 없습니다." });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (
      targetUser.position === EXECUTIVE_POSITION &&
      position !== EXECUTIVE_POSITION
    ) {
      const executiveCount = await User.countDocuments({
        position: EXECUTIVE_POSITION,
      });
      if (executiveCount <= 1) {
        return res
          .status(400)
          .json({ message: "최소 한 명의 임원진이 필요합니다." });
      }
    }

    targetUser.position = position;
    await targetUser.save();
    const user = targetUser.toObject();
    delete user.password;
    res.json({ message: "직책이 변경되었습니다.", user });
  } catch (error) {
    res.status(500).json({ message: "직책 변경에 실패했습니다." });
  }
});

router.delete("/admin/members/:id", requireExecutive, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (String(req.adminUserId) === String(targetId)) {
      return res.status(400).json({ message: "본인 계정은 삭제할 수 없습니다." });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (targetUser.position === EXECUTIVE_POSITION) {
      const executiveCount = await User.countDocuments({
        position: EXECUTIVE_POSITION,
      });
      if (executiveCount <= 1) {
        return res.status(400).json({
          message: "마지막 임원진 계정은 삭제할 수 없습니다.",
        });
      }
    }

    await User.findByIdAndDelete(targetId);
    await revokeAllRefreshTokens(targetId);
    res.json({ message: "회원이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "삭제에 실패했습니다." });
  }
});

module.exports = router;
module.exports.sendAuthSuccess = sendAuthSuccess;
