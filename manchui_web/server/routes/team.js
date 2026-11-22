const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const Schedule = require("../models/Schedule");
const Practice = require("../models/Practice");
const Setting = require("../models/Setting");
const TeamPoll = require("../models/TeamPoll");
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

/**
 * 팀을 지울 때 연습 정리: 연습실이 배정된 연습은 결산 기록으로 남기고(팀 이름·색 저장),
 * 연습실이 없는 연습만 지운다. 멤버 일정에서 비워 둔 시간은 모두 되돌린다.
 */
async function removeTeamPracticesKeepingPlaceRecords(team) {
  const teamId = String(team._id);
  const teamPractices = await Practice.find({ teamId });
  await releaseScheduleHoldbacksForPractices(teamPractices);
  const hasPlace = (practice) => {
    const place = String(practice.place ?? "").trim();
    return place && place !== "미확정";
  };
  const keepIds = teamPractices.filter(hasPlace).map((practice) => practice._id);
  const dropIds = teamPractices.filter((practice) => !hasPlace(practice)).map((practice) => practice._id);
  if (dropIds.length > 0) await Practice.deleteMany({ _id: { $in: dropIds } });
  if (keepIds.length > 0) {
    // 결산에 필요한 것만 남기고 참석자 이름(멤버·게스트)은 지운다
    const deletedAt = new Date();
    await Practice.bulkWrite(
      teamPractices.filter(hasPlace).map((practice) => ({
        updateOne: {
          filter: { _id: practice._id },
          update: {
            $set: {
              teamNameSnapshot: team.name ?? null,
              teamColorSnapshot: team.teamColor ?? null,
              teamDeletedAt: deletedAt,
              memberCountSnapshot:
                (Array.isArray(practice.members) ? practice.members.length : 0) +
                (Array.isArray(practice.guestNames) ? practice.guestNames.length : 0),
              members: [],
              memberByHour: [],
              guestNames: [],
              scheduleHoldbacks: [],
            },
          },
        },
      })),
    );
  }
  return { kept: keepIds.length, deleted: dropIds.length };
}

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

    res.json({ ...payload, pinnedTeamIds: await loadPinnedTeamIds() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * 임원진: 모든 팀의 연습 (장소 배정 화면용)
 * 어제 이후 연습만, 팀 이름·색과 함께. 자주 쓴 장소 목록도 같이 준다.
 */
router.get("/admin/practices", requireExecutive, async (req, res) => {
  try {
    const [teams, practices] = await Promise.all([
      Team.find().select("name teamColor").lean(),
      Practice.find()
        .select(
          "teamId date time place members guestNames placeAssignedAt placeAssignedBy placeCost teamNameSnapshot teamColorSnapshot teamDeletedAt memberCountSnapshot",
        )
        .lean(),
    ]);
    const teamById = new Map(teams.map((team) => [String(team._id), team]));

    // 자주 쓴 장소: 전체 연습 기록에서 많이 쓴 순
    const placeCount = new Map();
    for (const practice of practices) {
      const place = String(practice.place ?? "").trim();
      if (!place || place === "미확정") continue;
      placeCount.set(place, (placeCount.get(place) ?? 0) + 1);
    }
    const places = [...placeCount.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
      .slice(0, 20)
      .map(([place, count]) => ({ place, count }));

    res.json({
      practices: practices
        // 팀이 있거나, 팀은 지워졌지만 연습실 기록으로 남긴 연습
        .filter((practice) => teamById.has(String(practice.teamId)) || practice.teamDeletedAt)
        .map((practice) => {
          const team = teamById.get(String(practice.teamId)) ?? {
            name: practice.teamNameSnapshot || "삭제된 팀",
            teamColor: practice.teamColorSnapshot,
          };
          return {
            teamDeleted: !teamById.has(String(practice.teamId)),
            _id: String(practice._id),
            teamId: String(practice.teamId),
            teamName: team.name,
            teamColor: team.teamColor,
            date: practice.date,
            time: practice.time,
            place: practice.place,
            placeAssignedAt: practice.placeAssignedAt ?? null,
            placeAssignedBy: practice.placeAssignedBy ?? null,
            placeCost: typeof practice.placeCost === "number" ? practice.placeCost : null,
            memberCount: practice.teamDeletedAt
              ? practice.memberCountSnapshot ?? 0
              : (Array.isArray(practice.members) ? practice.members.length : 0) +
              (Array.isArray(practice.guestNames) ? practice.guestNames.length : 0),
          };
        }),
      places,
      teams: teams.map((team) => ({ _id: String(team._id), name: team.name, teamColor: team.teamColor })),
      placeRates: await loadPlaceRates(),
      pinnedTeamIds: await loadPinnedTeamIds(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

async function loadPinnedTeamIds() {
  const setting = await Setting.findOne().select("pinnedTeamIds").lean();
  return Array.isArray(setting?.pinnedTeamIds) ? setting.pinnedTeamIds.map(String) : [];
}

/** 임원진: 고정 팀 목록 저장 (순서대로) */
router.put("/admin/pins", requireExecutive, async (req, res) => {
  try {
    const ids = [
      ...new Set(
        (Array.isArray(req.body?.teamIds) ? req.body.teamIds : [])
          .map(String)
          .filter((id) => /^[a-f0-9]{24}$/i.test(id)),
      ),
    ].slice(0, 30);
    let setting = await Setting.findOne();
    if (!setting) setting = new Setting({});
    setting.pinnedTeamIds = ids;
    await setting.save();
    res.json({ pinnedTeamIds: ids });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

async function loadPlaceRates() {
  const setting = await Setting.findOne().select("placeRates").lean();
  return Array.isArray(setting?.placeRates) ? setting.placeRates : [];
}

/** 임원진: 장소별 시간당 요금 저장 (전체 목록을 통째로 바꾼다) */
router.put("/admin/place-rates", requireExecutive, async (req, res) => {
  try {
    const seen = new Set();
    const rates = (Array.isArray(req.body?.rates) ? req.body.rates : [])
      .map((item) => ({
        place: String(item?.place ?? "").trim().slice(0, 40),
        hourlyRate: Math.max(0, Math.round(Number(item?.hourlyRate) || 0)),
      }))
      .filter((item) => {
        if (!item.place || item.place === "미확정" || seen.has(item.place)) return false;
        seen.add(item.place);
        return true;
      })
      .slice(0, 100);
    let setting = await Setting.findOne();
    if (!setting) setting = new Setting({});
    setting.placeRates = rates;
    await setting.save();
    res.json({ placeRates: rates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/** 임원진: 연습 금액 직접 정하기 (cost 가 null 이면 다시 자동 계산) */
router.post("/admin/practices/cost", requireExecutive, async (req, res) => {
  try {
    const ids = (Array.isArray(req.body?.practiceIds) ? req.body.practiceIds : [])
      .map(String)
      .filter((id) => /^[a-f0-9]{24}$/i.test(id))
      .slice(0, 200);
    if (ids.length === 0) {
      return res.status(400).json({ message: "연습을 골라 주세요." });
    }
    const raw = req.body?.cost;
    const cost =
      raw === null || raw === undefined || raw === ""
        ? null
        : Math.max(0, Math.round(Number(raw) || 0));
    await Practice.updateMany({ _id: { $in: ids } }, { $set: { placeCost: cost } });
    res.json({ placeCost: cost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/** 임원진: 연습 장소 한 번에 지정 (여러 개 가능). 비우면 미확정 */
router.post("/admin/practices/place", requireExecutive, async (req, res) => {
  try {
    const ids = (Array.isArray(req.body?.practiceIds) ? req.body.practiceIds : [])
      .map(String)
      .filter((id) => /^[a-f0-9]{24}$/i.test(id))
      .slice(0, 200);
    if (ids.length === 0) {
      return res.status(400).json({ message: "연습을 골라 주세요." });
    }
    const place = String(req.body?.place ?? "").trim().slice(0, 40) || "미확정";
    const admin = await User.findById(req.adminUserId).select("username").lean();
    // 미정으로 되돌리면 배정 기록도 지운다
    const assigned = place !== "미확정";
    const placeAssignedAt = assigned ? new Date() : null;
    const placeAssignedBy = assigned ? admin?.username ?? null : null;
    const result = await Practice.updateMany(
      { _id: { $in: ids } },
      { $set: { place, placeAssignedAt, placeAssignedBy } },
    );
    res.json({
      place,
      placeAssignedAt,
      placeAssignedBy,
      updatedCount: result.modifiedCount ?? result.nModified ?? 0,
    });
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

    await removeTeamPracticesKeepingPlaceRecords(team);
    await TeamPoll.deleteMany({ teamId: String(team._id) });
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
    await removeTeamPracticesKeepingPlaceRecords(team);
    await TeamPoll.deleteMany({ teamId: String(team._id) });
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
      await TeamPoll.deleteMany({ teamId: String(teamId) });
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
