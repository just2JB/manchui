const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Team = require("../models/Team");
const Schedule = require("../models/Schedule");
const getFomatDate = (localeDateString) => {
  localeDateString = localeDateString.split(". ").join(".");
  const year = localeDateString.split(".")[0];
  const month =
    localeDateString.split(".")[1].length === 1
      ? "0" + localeDateString.split(".")[1]
      : localeDateString.split(".")[1];
  const date =
    localeDateString.split(".")[2].length === 1
      ? "0" + localeDateString.split(".")[2]
      : localeDateString.split(".")[2];
  return `${year}-${month}-${date}`;
};

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
      if ((category === "temp") & times.every((time) => time === 0)) {
        await Schedule.findByIdAndDelete(sameDateSchedule._id);
        return res.status(201).json({ message: "스케줄이 저장되었습니다." });
      } else await sameDateSchedule.save();
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
    res.json({ userSchedules: userSchedules });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/request/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const teams = await Team.find();
    const myTeam = teams.filter((team) =>
      team.members.some((member) => String(member) === String(user._id))
    );

    const myTeamRequst = myTeam.map((team) => {
      return {
        name: team.name,
        request: team.requestSchedules.filter(
          (req) =>
            new Date(getFomatDate(req)) >=
            new Date(new Date().setDate(new Date().getDate() - 1))
        ),
      };
    });

    res.json({ myTeam: myTeamRequst });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
