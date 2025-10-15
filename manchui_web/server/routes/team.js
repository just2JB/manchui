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
      members: [user],
    });
    await team.save();
    res.status(201).json({ message: "팀 생성이 완료되었습니다" });
  } catch {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

//초대 링크를 보내면 어떻게 가입이 되야할지 고민해야할 듯
//1. 초대 링크에 팀 아이디 담아서 보내고 그 페이지에서 로그인 토큰 있을 시 가입 완
// 해당 페이지는 로그인 창 따로하기? clubRoom 레이아웃에서 하면 될 듯
//2. 노션처럼 이메일로 찾아서 권한 부여할까
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
module.exports = router;

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
    console.log(myTeam);
    res.json({ myTeam: myTeam });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
module.exports = router;
