const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, Identification } = req.body;
    const existingUser = await User.findOne({ email });
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
      email,
      password: hashedPassword,
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
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.log("서버 오류:", error.message);
    res.status(501).json({ message: "서버 오류가 발생했습니다." });
  }
});
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(400).json({ message: "이미 로그아웃된 상태입니다." });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
    } catch (error) {
      console.log("토큰 검증 오류:", error.message);
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

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
    res.json({ message: "계정을 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
router.post("/verify-token", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ isVaild: false, message: "토큰이 없습니다" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    const userWithoutSchedule = user.toObject();
    delete userWithoutSchedule.schedule;
    return res.status(201).json({ isValid: true, user: userWithoutSchedule });
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
      const changePassword = formData.changePassword;
      const checkPassword = formData.checkPassword;
      const isValidPassword = await bcrypt.compare(
        formData.password,
        user.password
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
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ message: "계정이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

module.exports = router;
