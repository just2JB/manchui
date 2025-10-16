const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");

router.post("/create", async (req, res) => {
  try {
    const { name, userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
    const team = new Team({
      name: name,
      leaderId: user._id,
      members: [user],
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
    if (team.members.some((member) => String(member._id) === String(userId))) {
      return res
        .status(401)
        .json({ message: "이미 해당 팀에 가입되어 있습니다." });
    }
    team.members.push(user);
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
      (member) => String(member._id) !== String(userId)
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

router.get("/:teamId", async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "팀 찾을 수 없습니다." });
    }
    res.json({ team: team });
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
      team.members.some((member) => String(member._id) === String(user._id))
    );

    res.json({ myTeam: myTeam });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
module.exports = router;
