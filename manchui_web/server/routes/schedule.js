const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const Schedule = require("../models/Schedule");
const requireAuth = require("../middleware/requireAuth");
const { getAccessToken } = require("../utils/getToken");
const { verifyAccessToken, sanitizeUser } = require("../utils/tokens");
const {
  normalizeScheduleDate,
  isScheduleDateOnOrAfterYesterday,
} = require("../utils/scheduleDate");

const EMPTY_TIMES = new Array(48).fill(0);

function serializeSchedule(doc) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    _id: plain._id,
    userId: String(plain.userId),
    date: normalizeScheduleDate(plain.date) || plain.date,
    times: Array.isArray(plain.times) ? plain.times : EMPTY_TIMES,
    category: plain.category,
  };
}

async function upsertUserSchedule(userId, date, times, category) {
  const normalizedDate = normalizeScheduleDate(date);
  if (!normalizedDate) {
    const err = new Error("INVALID_DATE");
    err.status = 400;
    throw err;
  }

  const normalizedTimes = Array.isArray(times)
    ? times.map((value) => Number(value) || 0)
    : [...EMPTY_TIMES];
  while (normalizedTimes.length < 48) normalizedTimes.push(0);

  const schedules = await Schedule.find({ userId: String(userId) });
  const sameDateSchedule = schedules.find(
    (schedule) =>
      normalizeScheduleDate(schedule.date) === normalizedDate,
  );

  const shouldDelete =
    category === "temp" && normalizedTimes.every((value) => value === 0);

  if (sameDateSchedule) {
    if (shouldDelete) {
      await Schedule.findByIdAndDelete(sameDateSchedule._id);
      return null;
    }
    sameDateSchedule.times = normalizedTimes;
    sameDateSchedule.category = category;
    sameDateSchedule.date = normalizedDate;
    await sameDateSchedule.save();
    return sameDateSchedule;
  }

  if (shouldDelete) return null;

  const schedule = new Schedule({
    userId: String(userId),
    date: normalizedDate,
    times: normalizedTimes,
    category,
  });
  await schedule.save();
  return schedule;
}

async function loadTeamScheduleRequests(userId) {
  const userKey = String(userId);
  const teams = await Team.find().lean();
  const myTeams = teams.filter((team) =>
    (Array.isArray(team.members) ? team.members : []).some(
      (member) => String(member) === userKey,
    ),
  );

  return myTeams.map((team) => ({
    teamId: String(team._id),
    name: team.name,
    request: (Array.isArray(team.requestSchedules) ? team.requestSchedules : [])
      .map((raw) => normalizeScheduleDate(raw))
      .filter(
        (dateKey) => dateKey && isScheduleDateOnOrAfterYesterday(dateKey),
      )
      .sort((a, b) => a.localeCompare(b)),
  }));
}

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: String(req.userId) });
    res.json({
      userSchedules: schedules
        .map(serializeSchedule)
        .filter((item) => item?.category !== "temp"),
    });
  } catch {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/mine", requireAuth, async (req, res) => {
  try {
    const { date, times, category } = req.body;
    if (!date || !Array.isArray(times) || !category) {
      return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
    }

    const saved = await upsertUserSchedule(
      req.userId,
      date,
      times,
      category,
    );

    res.status(201).json({
      message: "스케줄이 저장되었습니다.",
      schedule: serializeSchedule(saved),
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: "날짜 형식이 올바르지 않습니다." });
    }
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/request/mine", requireAuth, async (req, res) => {
  try {
    const myTeam = await loadTeamScheduleRequests(req.userId);
    res.json({ myTeam });
  } catch {
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
    return res.status(201).json({ isValid: true, user: sanitizeUser(user) });
  } catch {
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

    const saved = await upsertUserSchedule(userId, date, times, category);
    res.status(201).json({
      message: "스케줄이 저장되었습니다.",
      schedule: serializeSchedule(saved),
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ message: "날짜 형식이 올바르지 않습니다." });
    }
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/request/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const myTeam = await loadTeamScheduleRequests(req.params.userId);
    res.json({ myTeam });
  } catch {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const schedules = await Schedule.find({
      userId: String(req.params.userId),
    });
    res.json({
      userSchedules: schedules
        .map(serializeSchedule)
        .filter((item) => item?.category !== "temp"),
    });
  } catch {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
