const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const Schedule = require("../models/Schedule");

router.post("/create", async (req, res) => {
  try {
    const { name, comment, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
    const team = new Team({
      name: name,
      leaderId: user._id,
      members: [user._id],
      comment: comment,
    });
    await team.save();
    res.status(201).json({ message: "팀 생성이 완료되었습니다" });
  } catch {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "없는 팀 입니다." });
    }
    res.json({ message: "팀이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});
//팀 삭제될 때 그 팀의 연습도 다 삭제해야함

router.post("/join", async (req, res) => {
  try {
    const { teamId, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (team.members.some((member) => String(member) === String(userId))) {
      return res
        .status(401)
        .json({ message: "이미 해당 팀에 가입되어 있습니다." });
    }
    team.members.push(user._id);
    await team.save();
    return res.status(201).json({ message: "가입 완료되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/quit", async (req, res) => {
  try {
    const { teamId, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    const afterMembers = team.members.filter(
      (member) => String(member) !== String(userId)
    );
    if (afterMembers.length > 0) {
      team.members = afterMembers;
      await team.save();
      return res.status(201).json({ message: "탈퇴되었습니다" });
    } else {
      await Team.findByIdAndDelete(teamId);
      console.log("팀 인원 0명으로 팀 삭제");
      return res.status(201).json({ message: "탈퇴되었습니다" });
    }
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/request-schedule", async (req, res) => {
  try {
    const { teamId, date } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (team.requestSchedules.includes(date)) {
      team.requestSchedules = team.requestSchedules.filter(
        (item) => item !== date
      );
      await team.save();
      return res.status(201).json({
        message: "업데이트 되었습니다",
        newRequestSchedules: team.requestSchedules,
      });
    } else {
      team.requestSchedules.push(date);
      await team.save();
      return res.status(201).json({
        message: "업데이트 되었습니다",
        newRequestSchedules: team.requestSchedules,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/:teamId", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "팀 찾을 수 없습니다." });
    }
    const schedules = await Schedule.find();
    const confirmScheduls = schedules.filter(
      (schedule) => schedule.category !== "temp"
    );
    const memberSchedules = confirmScheduls.filter((schedule) =>
      team.members.includes(schedule.userId)
    );

    const memberDetails = await User.find({ _id: { $in: team.members } });
    team.members = memberDetails;

    res.json({ team: team, memberSchedules: memberSchedules });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const teams = await Team.find();

    const myTeam = teams.filter((team) =>
      team.members.some((member) => String(member) === String(user._id))
    );

    res.json({ myTeam: myTeam });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

//팀장이 나가면 팀 삭제 or 팀장 위임 기능은 추후에...
//팀 삭제될 때 그 팀의 연습도 다 삭제해야함
module.exports = router;
