const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const Schedule = require("../models/Schedule");
const Practice = require("../models/Practice");
const requireExecutive = require("../middleware/requireExecutive");
const { buildAdminTeamSummaries, getTeamCreatedAt } = require("../utils/teamActivity");
const { releaseScheduleHoldbacksForPractices } = require("../utils/practiceScheduleHold");
const {
  isMainTeamLeader,
  isCoTeamLeader,
  isTeamLeader,
  normalizeCoLeaderIds,
  removeMemberFromCoLeaders,
} = require("../utils/teamRoles");

router.get("/admin/list", requireExecutive, async (req, res) => {
  try {
    const [teams, practices] = await Promise.all([
      Team.find().lean(),
      Practice.find().lean(),
    ]);

    const memberIds = new Set();
    for (const team of teams) {
      for (const memberId of Array.isArray(team.members) ? team.members : []) {
        memberIds.add(String(memberId));
      }
      if (team.leaderId) memberIds.add(String(team.leaderId));
    }

    const users = await User.find({ _id: { $in: [...memberIds] } }).lean();
    const payload = buildAdminTeamSummaries(teams, practices, users);

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/admin/:teamId", requireExecutive, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).lean();
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    const memberDetails = await User.find({
      _id: { $in: Array.isArray(team.members) ? team.members : [] },
    }).lean();

    const leader = team.leaderId
      ? await User.findById(team.leaderId).lean()
      : null;

    const createdAt = getTeamCreatedAt(team);

    res.json({
      team: {
        ...team,
        members: memberDetails,
        leader,
        createdAt: createdAt ? createdAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/admin/:teamId/practices", requireExecutive, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    const practices = await Practice.find({
      teamId: String(team._id),
    }).lean();

    practices.sort((a, b) => {
      const aDate = String(a.date ?? "");
      const bDate = String(b.date ?? "");
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return String(a.time ?? "").localeCompare(String(b.time ?? ""));
    });

    res.json({ practices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.delete("/admin/:teamId", requireExecutive, async (req, res) => {
  try {
    const { confirmName } = req.body ?? {};
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }

    const expected = String(team.name ?? "").trim();
    const typed = String(confirmName ?? "").trim();
    if (!expected || typed !== expected) {
      return res.status(400).json({
        message: "팀 이름 확인 문자가 일치하지 않습니다.",
      });
    }

    const teamPractices = await Practice.find({ teamId: String(team._id) });
    await releaseScheduleHoldbacksForPractices(teamPractices);
    await Practice.deleteMany({ teamId: String(team._id) });
    await Team.findByIdAndDelete(team._id);

    res.json({ message: "팀이 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { name, comment, userId, teamColor } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
    const team = new Team({
      name: name,
      leaderId: user._id,
      members: [user._id],
      comment: comment,
      teamColor: teamColor,
    });
    await team.save();
    res.status(201).json({
      message: "팀 생성이 완료되었습니다",
      team,
    });
  } catch {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "없는 팀 입니다." });
    }
    const teamPractices = await Practice.find({ teamId: String(team._id) });
    await releaseScheduleHoldbacksForPractices(teamPractices);
    await Practice.deleteMany({ teamId: String(team._id) });
    await Team.findByIdAndDelete(req.params.id);
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

router.post("/remove-member", async (req, res) => {
  try {
    const { teamId, leaderId, memberId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (!isTeamLeader(team, leaderId)) {
      return res.status(403).json({
        message: "곡장·부곡장만 멤버를 보낼 수 있습니다.",
      });
    }
    if (String(memberId) === String(team.leaderId)) {
      return res.status(400).json({ message: "곡장은 내보낼 수 없습니다." });
    }
    if (
      isCoTeamLeader(team, memberId) &&
      !isMainTeamLeader(team, leaderId)
    ) {
      return res.status(403).json({
        message: "부곡장은 다른 부곡장을 내보낼 수 없습니다.",
      });
    }
    const isMember = team.members.some(
      (member) => String(member) === String(memberId),
    );
    if (!isMember) {
      return res.status(404).json({ message: "해당 멤버를 찾을 수 없습니다." });
    }
    team.members = team.members.filter(
      (member) => String(member) !== String(memberId),
    );
    removeMemberFromCoLeaders(team, memberId);
    await team.save();
    return res.status(201).json({ message: "멤버를 보냈습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/quit", async (req, res) => {
  try {
    const { teamId, userId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    const afterMembers = team.members.filter(
      (member) => String(member) !== String(userId),
    );
    if (afterMembers.length > 0) {
      team.members = afterMembers;
      removeMemberFromCoLeaders(team, userId);
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
        (item) => item !== date,
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

router.post("/edit", async (req, res) => {
  try {
    const { teamId, name, comment, teamColor } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (name) {
      team.name = name;
    }
    if (comment) {
      team.comment = comment;
    }
    if (teamColor) {
      team.teamColor = teamColor;
    }

    await team.save();
    return res.status(201).json({
      message: "업데이트 되었습니다",
      newRequestSchedules: team.requestSchedules,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/change-leader", async (req, res) => {
  try {
    const { teamId, leaderId, userId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (String(team.leaderId) !== String(leaderId)) {
      return res.status(403).json({ message: "곡장만 위임할 수 있습니다." });
    }
    if (String(userId) === String(leaderId)) {
      return res.status(400).json({ message: "이미 곡장입니다." });
    }
    const isMember = team.members.some(
      (member) => String(member) === String(userId),
    );
    if (!isMember) {
      return res.status(404).json({ message: "해당 멤버를 찾을 수 없습니다." });
    }
    team.leaderId = userId;
    removeMemberFromCoLeaders(team, userId);
    await team.save();
    return res.status(201).json({
      message: "곡장이 위임되었습니다.",
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});
//change-leader

router.post("/set-co-leader", async (req, res) => {
  try {
    const { teamId, actorId, memberId, appoint } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (!isMainTeamLeader(team, actorId)) {
      return res.status(403).json({
        message: "곡장만 부곡장을 임명·해임할 수 있습니다.",
      });
    }
    if (String(memberId) === String(team.leaderId)) {
      return res
        .status(400)
        .json({ message: "곡장은 부곡장으로 지정할 수 없습니다." });
    }
    const isMember = team.members.some(
      (member) => String(member) === String(memberId),
    );
    if (!isMember) {
      return res.status(404).json({ message: "해당 멤버를 찾을 수 없습니다." });
    }

    const coLeaderIds = normalizeCoLeaderIds(team);
    const memberKey = String(memberId);

    if (appoint) {
      if (coLeaderIds.includes(memberKey)) {
        return res.status(400).json({ message: "이미 부곡장입니다." });
      }
      team.coLeaderIds = [...coLeaderIds, memberKey];
    } else {
      if (!coLeaderIds.includes(memberKey)) {
        return res.status(400).json({ message: "부곡장이 아닙니다." });
      }
      team.coLeaderIds = coLeaderIds.filter((id) => id !== memberKey);
    }

    await team.save();
    return res.status(201).json({
      message: appoint ? "부곡장으로 임명했습니다." : "부곡장을 해임했습니다.",
      coLeaderIds: team.coLeaderIds,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/add-goal", async (req, res) => {
  try {
    const { teamId, newGoal } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    newGoal._id = Date.now().toString();
    team.goals.push(newGoal);

    team.goals.sort((a, b) => new Date(a.date) - new Date(b.date));
    await team.save();
    return res.status(201).json({ message: "팀 목표가 추가 되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.post("/delete-goal", async (req, res) => {
  try {
    const { teamId, goalId } = req.body;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    const afterGoals = team.goals.filter(
      (goal) => String(goal._id) !== String(goalId),
    );
    team.goals = afterGoals;
    await team.save();
    return res.status(201).json({ message: "팀 목표가 삭제 되었습니다." });
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
      (schedule) => schedule.category !== "temp",
    );
    const memberIds = team.members.map((m) => String(m));
    const memberSchedules = confirmScheduls.filter((schedule) =>
      memberIds.includes(String(schedule.userId)),
    );

    const memberDetails = await User.find({ _id: { $in: team.members } });
    const teamPayload = team.toObject();
    teamPayload.members = memberDetails;
    res.json({ team: teamPayload, memberSchedules });
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
      team.members.some((member) => String(member) === String(user._id)),
    );
    const practices = await Practice.find();

    const activePractice = practices.filter(
      (practice) =>
        new Date(practice.date) >= new Date(Date.now()) ||
        new Date(practice.date) >=
          new Date(Date.now() - 24 * 60 * 60 * 1000 * 3),
    );

    const activeTeam = myTeam.filter((team) => {
      const teamPractices = activePractice.filter(
        (practice) => String(practice.teamId) === String(team._id),
      );
      if (teamPractices.length > 0) {
        return true;
      } else {
        return false;
      }
    });

    res.json({
      myTeam: myTeam,
      activeTeam: activeTeam.map((team) => {
        return team._id;
      }),
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

//팀장이 나가면 팀 삭제 or 팀장 위임 기능은 추후에...
//팀 삭제될 때 그 팀의 연습도 다 삭제해야함
module.exports = router;
