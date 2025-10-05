const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
router.post("/", async (req, res) => {
  try {
    const { userId, date, schedule } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const filteredSchedules = user.schedule.filter(
      (item) => item.date !== date
    );
    if (schedule.length === 0) {
      user.schedule = filteredSchedules;
      await user.save();
      return res.status(201).json({ message: "스케줄이 삭제되었습니다." });
    }
    filteredSchedules.push({ date, schedule });
    user.schedule = filteredSchedules;
    await user.save();
    res.status(201).json({ message: "스케줄이 저장되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    res.json(user.schedule);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
