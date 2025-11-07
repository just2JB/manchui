const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const Practice = require("../models/Practice");

router.post("/create", async (req, res) => {
  try {
    const { teamId, date, time, members } = req.body;
    const practice = new Practice({
      teamId: teamId,
      date: date,
      time: time,
      members: members,
    });
    await practice.save();
    res.status(201).json({ message: "연습 생성이 완료되었습니다" });
  } catch {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.get("/teamPractice/:teamId", async (req, res) => {
  try {
    const practices = await Practice.find();

    const teamPractice = practices.filter(
      (practice) => String(practice.teamId) === String(req.params.teamId)
    );

    res.json({ teamPractice: teamPractice });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

module.exports = router;
