const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Schedule = require("../models/Schedule");

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
    const { userId, date, times, category } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const schedules = await Schedule.find();
    const sameDateSchedule = schedules.find(
      (schedule) => (schedule.userId === userId) & (schedule.date === date)
    );
    if (sameDateSchedule) {
      sameDateSchedule.times = times;
      sameDateSchedule.category = category;

      await sameDateSchedule.save();
    } else {
      const schedule = new Schedule({
        userId: userId,
        date: date,
        times: times,
        category: category,
      });
      await schedule.save();
    }

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

    const schedules = await Schedule.find();
    const userSchedules = schedules.filter(
      (schedule) => schedule.userId === req.params.userId
    );
    res.json(userSchedules);
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;

/*    const thisWeek = new Date().setDate(
      new Date().getDate() - new Date().getDay() - 1
    );*/
