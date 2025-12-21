const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const Practice = require("../models/Practice");
const User = require("../models/User");

router.post("/create", async (req, res) => {
  try {
    const { teamId, date, time, members, place } = req.body;
    const practice = new Practice({
      teamId: teamId,
      date: date,
      time: time,
      members: members,
      place: place,
    });
    await practice.save();
    res.status(201).json({ message: "연습 생성이 완료되었습니다" });
  } catch {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});
router.post("/edit", async (req, res) => {
  try {
    const { practiceId, time, members, place } = req.body;
    const practice = await Practice.findById(practiceId);
    practice.time = time;
    practice.members = members;
    practice.place = place;
    await practice.save();
    res.status(201).json({ message: "연습이 수정되었습니다" });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});
router.get("/teamPractice/:teamId", async (req, res) => {
  try {
    const practices = await Practice.find();
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "존재하지 않는 팀입니다." });
    }
    const teamPractice = practices.filter(
      (practice) => String(practice.teamId) === String(req.params.teamId)
    );
    team.numberofPractice = teamPractice.length;
    await team.save();

    res.json({ teamPractice: teamPractice });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id);
    const memberDetails = await User.find({
      _id: { $in: practice.members },
    });
    practice.members = memberDetails;
    res.json({ practice: practice });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});
router.get("/", async (req, res) => {
  try {
    const practices = await Practice.find();
    const teams = await Team.find();
    const detailPractices = [];
    const toMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(toMonth.getMonth() - 1);
    lastMonth.setDate(1);
    const nextMonth = new Date();
    nextMonth.setMonth(toMonth.getMonth() + 2);
    nextMonth.setDate(0);

    const monthFiltered = practices.filter(
      (prac) =>
        lastMonth < new Date(prac.date) && new Date(prac.date) < nextMonth
    );

    monthFiltered.forEach((practice) => {
      const team = teams.find((t) => String(t._id) === practice.teamId);
      if (!team) {
      } else {
        detailPractices.push({
          _id: practice._id,
          time: practice.time,
          date: practice.date,
          place: practice.place,
          members: practice.members,
          teamName: team.name,
          teamColor: team.teamColor,
        });
      }
    });
    res.json({ practices: detailPractices });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.get("/today/:userId", async (req, res) => {
  try {
    const practices = await Practice.find();
    const teams = await Team.find();
    const detailPractices = [];
    const toDate = new Date();
    const lastDate = new Date();
    lastDate.setDate(toDate.getDate() - 2);

    const nextDate = new Date();
    nextDate.setDate(toDate.getDate() + 2);

    const monthFiltered = practices
      .filter(
        (prac) =>
          lastDate < new Date(prac.date) && new Date(prac.date) < nextDate
      )
      .filter((prac) => prac.members.includes(req.params.userId));

    monthFiltered.forEach((practice) => {
      const team = teams.find((t) => String(t._id) === practice.teamId);
      if (!team) {
      } else {
        detailPractices.push({
          _id: practice._id,
          time: practice.time,
          date: practice.date,
          place: practice.place,
          members: practice.members,
          teamName: team.name,
          teamColor: team.teamColor,
        });
      }
    });
    res.json({ practices: detailPractices });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const practices = await Practice.findByIdAndDelete(req.params.id);
    if (!practices) {
      return res.status(404).json({ message: "없는 연습 입니다." });
    }
    res.json({ message: "연습이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

module.exports = router;
