const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const router = express.Router();
const Team = require("../models/Team");
const TeamPoll = require("../models/TeamPoll");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const optionalAuth = require("../middleware/optionalAuth");
const { isTeamLeader } = require("../utils/teamRoles");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATES = 31;
const MAX_RESPONSES = 100;
const GUEST_NAME_MAX = 20;
const GUEST_PASSWORD_MIN = 4;
const GUEST_PASSWORD_MAX = 64;

function isValidDateKey(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function normalizeName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function nameKey(value) {
  return normalizeName(value).toLowerCase();
}

function isTeamMemberId(team, userId) {
  if (!team || !userId) return false;
  return (Array.isArray(team.members) ? team.members : []).some(
    (member) => String(member) === String(userId),
  );
}

/** 투표 범위 안의 날짜·시간만 남기고 정렬 */
function sanitizeAvailability(poll, raw) {
  const dateSet = new Set(poll.dates);
  const byDate = new Map();
  for (const item of Array.isArray(raw) ? raw : []) {
    const date = String(item?.date ?? "");
    if (!dateSet.has(date)) continue;
    const hours = new Set(byDate.get(date) ?? []);
    for (const value of Array.isArray(item?.hours) ? item.hours : []) {
      const hour = Number(value);
      if (
        Number.isInteger(hour) &&
        hour >= poll.startHour &&
        hour < poll.endHour
      ) {
        hours.add(hour);
      }
    }
    byDate.set(date, [...hours]);
  }
  return poll.dates
    .filter((date) => (byDate.get(date) ?? []).length > 0)
    .map((date) => ({
      date,
      hours: byDate.get(date).sort((a, b) => a - b),
    }));
}

function serializeResponse(response) {
  return {
    _id: String(response._id),
    kind: response.kind,
    userId: response.userId ? String(response.userId) : null,
    name: response.name,
    availability: (response.availability ?? []).map((item) => ({
      date: item.date,
      hours: [...(item.hours ?? [])],
    })),
    updatedAt: response.updatedAt ?? null,
  };
}

function serializePoll(poll, team) {
  return {
    _id: String(poll._id),
    teamId: String(poll.teamId),
    title: poll.title,
    dates: [...poll.dates],
    startHour: poll.startHour,
    endHour: poll.endHour,
    closed: Boolean(poll.closed),
    createdBy: poll.createdBy,
    createdAt: poll.createdAt ?? null,
    updatedAt: poll.updatedAt ?? null,
    team: team
      ? {
          _id: String(team._id),
          name: team.name,
          teamColor: team.teamColor,
        }
      : null,
    responses: (poll.responses ?? []).map(serializeResponse),
  };
}

async function loadTeamMemberSummaries(team) {
  const ids = (Array.isArray(team?.members) ? team.members : []).map(String);
  if (ids.length === 0) return [];
  const users = await User.find({ _id: { $in: ids } })
    .select("username Identification")
    .lean();
  return users.map((user) => ({
    _id: String(user._id),
    username: user.username,
  }));
}

async function loadPollWithTeam(pollId) {
  if (!pollId || !/^[a-f0-9]{24}$/i.test(String(pollId))) return {};
  const poll = await TeamPoll.findById(pollId);
  if (!poll) return {};
  const team = await Team.findById(poll.teamId);
  return { poll, team };
}

/** 팀장·부곡장: 새 투표 만들기 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { teamId, title, dates, startHour, endHour } = req.body ?? {};
    const team = teamId ? await Team.findById(teamId) : null;
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    if (!isTeamLeader(team, req.userId)) {
      return res
        .status(403)
        .json({ message: "곡장·부곡장만 일정 투표를 만들 수 있습니다." });
    }

    const dateKeys = [
      ...new Set((Array.isArray(dates) ? dates : []).filter(isValidDateKey)),
    ].sort();
    if (dateKeys.length === 0) {
      return res.status(400).json({ message: "날짜를 하나 이상 선택해 주세요." });
    }
    if (dateKeys.length > MAX_DATES) {
      return res
        .status(400)
        .json({ message: `날짜는 최대 ${MAX_DATES}일까지 선택할 수 있습니다.` });
    }

    const start = Number(startHour);
    const end = Number(endHour);
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end > 24 ||
      start >= end
    ) {
      return res.status(400).json({ message: "시간대가 올바르지 않습니다." });
    }

    const poll = new TeamPoll({
      teamId: String(team._id),
      title: String(title ?? "").trim().slice(0, 40),
      dates: dateKeys,
      startHour: start,
      endHour: end,
      createdBy: String(req.userId),
    });
    await poll.save();

    res.status(201).json({
      message: "일정 투표를 만들었습니다.",
      poll: serializePoll(poll, team),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/** 팀 상세: 팀의 투표 목록 (응답 포함) */
router.get("/team/:teamId", requireAuth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "팀을 찾을 수 없습니다." });
    }
    const polls = await TeamPoll.find({ teamId: String(team._id) }).sort({
      createdAt: -1,
    });
    res.json({ polls: polls.map((poll) => serializePoll(poll, team)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/** 홈: 내가 속한 팀의 진행 중 투표 (응답 여부 포함) */
router.get("/mine/open", requireAuth, async (req, res) => {
  try {
    const userKey = String(req.userId);
    // members 는 ObjectId/문자열이 섞인 Mixed 배열이라 쿼리 대신 메모리에서 거른다
    const teams = await Team.find().select("name teamColor members").lean();
    const myTeams = teams.filter((team) => isTeamMemberId(team, userKey));
    if (myTeams.length === 0) return res.json({ polls: [] });

    const teamById = new Map(myTeams.map((team) => [String(team._id), team]));
    const polls = await TeamPoll.find({
      teamId: { $in: [...teamById.keys()] },
      closed: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    const cutoff = `${y}-${m}-${d}`;

    res.json({
      polls: polls
        .filter((poll) => (poll.dates ?? []).some((date) => date > cutoff))
        .map((poll) => {
          const team = teamById.get(String(poll.teamId));
          return {
            _id: String(poll._id),
            title: poll.title,
            dates: poll.dates,
            startHour: poll.startHour,
            endHour: poll.endHour,
            responseCount: (poll.responses ?? []).length,
            responded: (poll.responses ?? []).some(
              (item) => String(item.userId) === userKey,
            ),
            team: { _id: String(team._id), name: team.name, teamColor: team.teamColor },
          };
        }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/** 공개 투표 페이지 */
router.get("/:pollId", optionalAuth, async (req, res) => {
  try {
    const { poll, team } = await loadPollWithTeam(req.params.pollId);
    if (!poll || !team) {
      return res.status(404).json({ message: "일정 투표를 찾을 수 없습니다." });
    }

    const viewerId = req.userId ? String(req.userId) : null;
    const isLeader = viewerId ? isTeamLeader(team, viewerId) : false;
    const isMember = viewerId ? isTeamMemberId(team, viewerId) : false;
    const myResponse = viewerId
      ? poll.responses.find((item) => String(item.userId) === viewerId)
      : null;

    res.json({
      poll: serializePoll(poll, team),
      viewer: {
        isLeader,
        isMember,
        myResponseId: myResponse ? String(myResponse._id) : null,
      },
      teamMembers: isMember ? await loadTeamMemberSummaries(team) : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

async function findGuestResponse(pollId, name) {
  if (!pollId || !/^[a-f0-9]{24}$/i.test(String(pollId))) {
    return { poll: null, response: null };
  }
  const poll = await TeamPoll.findById(pollId);
  if (!poll) return { poll: null, response: null };
  const key = nameKey(name);
  const response = poll.responses.find(
    (item) => item.kind === "guest" && nameKey(item.name) === key,
  );
  return { poll, response };
}

function validateGuestCredentials(name, password) {
  const cleanName = normalizeName(name);
  const cleanPassword = String(password ?? "");
  if (!cleanName) return { error: "이름을 입력해 주세요." };
  if (cleanName.length > GUEST_NAME_MAX) {
    return { error: `이름은 ${GUEST_NAME_MAX}자 이내로 입력해 주세요.` };
  }
  if (
    cleanPassword.length < GUEST_PASSWORD_MIN ||
    cleanPassword.length > GUEST_PASSWORD_MAX
  ) {
    return { error: `비밀번호는 ${GUEST_PASSWORD_MIN}자 이상 입력해 주세요.` };
  }
  return { name: cleanName, password: cleanPassword };
}

/*
 * 응답 쓰기는 문서 전체 save() 대신 원자적 업데이트로 한다.
 * 링크를 뿌리면 여러 명이 동시에 저장하므로, save() 는 VersionError 나
 * 다른 사람 응답 덮어쓰기가 날 수 있다.
 */

async function pushResponse(pollId, doc, guard) {
  const _id = new mongoose.Types.ObjectId();
  const now = new Date();
  const result = await TeamPoll.updateOne(
    {
      _id: pollId,
      closed: false,
      [`responses.${MAX_RESPONSES - 1}`]: { $exists: false },
      ...guard,
    },
    { $push: { responses: { _id, ...doc, createdAt: now, updatedAt: now } } },
  );
  return result.modifiedCount > 0 ? _id : null;
}

async function setResponseFields(pollId, responseId, fields) {
  const $set = { "responses.$.updatedAt": new Date() };
  for (const [key, value] of Object.entries(fields)) {
    $set[`responses.$.${key}`] = value;
  }
  await TeamPoll.updateOne(
    { _id: pollId, closed: false, "responses._id": responseId },
    { $set },
  );
}

async function loadResponse(pollId, responseId) {
  const poll = await TeamPoll.findById(pollId);
  return poll?.responses.find((item) => String(item._id) === String(responseId)) ?? null;
}

/**
 * 게스트 로그인: 같은 이름이 있으면 비밀번호 확인, 없으면 새 응답 생성.
 * 응답 저장 때마다 이름·비밀번호를 다시 보내는 무상태 방식.
 */
router.post("/:pollId/guest", async (req, res) => {
  try {
    const creds = validateGuestCredentials(req.body?.name, req.body?.password);
    if (creds.error) return res.status(400).json({ message: creds.error });

    const { poll, response } = await findGuestResponse(
      req.params.pollId,
      creds.name,
    );
    if (!poll) {
      return res.status(404).json({ message: "일정 투표를 찾을 수 없습니다." });
    }

    if (response) {
      const ok = await bcrypt.compare(creds.password, response.passwordHash || "");
      if (!ok) {
        return res.status(401).json({
          message: "이미 사용 중인 이름이에요. 비밀번호가 맞지 않습니다.",
        });
      }
      return res.json({ response: serializeResponse(response), created: false });
    }

    if (poll.closed) {
      return res.status(403).json({ message: "마감된 일정 투표입니다." });
    }
    if (poll.responses.length >= MAX_RESPONSES) {
      return res.status(400).json({ message: "응답 인원이 가득 찼습니다." });
    }

    const key = nameKey(creds.name);
    const createdId = await pushResponse(
      poll._id,
      {
        kind: "guest",
        name: creds.name,
        nameKey: key,
        passwordHash: await bcrypt.hash(creds.password, 10),
        availability: [],
      },
      { responses: { $not: { $elemMatch: { kind: "guest", nameKey: key } } } },
    );
    if (!createdId) {
      // 같은 이름이 방금 먼저 등록됐거나, 마감·정원 초과
      return res.status(409).json({
        message: "이미 사용 중인 이름이에요. 다시 시도해 주세요.",
      });
    }
    const created = await loadResponse(poll._id, createdId);
    res
      .status(201)
      .json({ response: serializeResponse(created), created: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/**
 * 응답 저장.
 * - body.guest = { name, password } 이면 게스트로 저장
 * - 아니면 로그인한 만취 계정으로 저장하고, 팀원이 아니면 자동으로 팀에 합류
 */
router.put("/:pollId/response", optionalAuth, async (req, res) => {
  try {
    const { availability, guest } = req.body ?? {};

    if (guest) {
      const creds = validateGuestCredentials(guest.name, guest.password);
      if (creds.error) return res.status(400).json({ message: creds.error });
      const { poll, response } = await findGuestResponse(
        req.params.pollId,
        creds.name,
      );
      if (!poll) {
        return res.status(404).json({ message: "일정 투표를 찾을 수 없습니다." });
      }
      if (poll.closed) {
        return res.status(403).json({ message: "마감된 일정 투표입니다." });
      }
      if (!response) {
        return res.status(404).json({ message: "게스트 정보를 찾을 수 없습니다." });
      }
      const ok = await bcrypt.compare(creds.password, response.passwordHash || "");
      if (!ok) {
        return res.status(401).json({ message: "비밀번호가 맞지 않습니다." });
      }
      await setResponseFields(poll._id, response._id, {
        availability: sanitizeAvailability(poll, availability),
      });
      const saved = await loadResponse(poll._id, response._id);
      return res.json({ response: serializeResponse(saved), joinedTeam: false });
    }

    if (!req.userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { poll, team } = await loadPollWithTeam(req.params.pollId);
    if (!poll || !team) {
      return res.status(404).json({ message: "일정 투표를 찾을 수 없습니다." });
    }
    if (poll.closed) {
      return res.status(403).json({ message: "마감된 일정 투표입니다." });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const userKey = String(user._id);
    const name = user.username || "회원";
    const cleanAvailability = sanitizeAvailability(poll, availability);

    let responseId = poll.responses.find(
      (item) => String(item.userId) === userKey,
    )?._id;
    if (!responseId) {
      responseId = await pushResponse(
        poll._id,
        { kind: "user", userId: userKey, name, availability: cleanAvailability },
        { "responses.userId": { $ne: userKey } },
      );
      if (!responseId) {
        // 동시에 두 번 저장된 경우: 이미 생긴 응답을 갱신
        const fresh = await TeamPoll.findById(poll._id);
        responseId = fresh?.responses.find(
          (item) => String(item.userId) === userKey,
        )?._id;
        if (!responseId) {
          return res.status(400).json({ message: "응답을 저장하지 못했습니다." });
        }
      }
    }
    await setResponseFields(poll._id, responseId, {
      name,
      availability: cleanAvailability,
    });

    let joinedTeam = false;
    if (!isTeamMemberId(team, userKey)) {
      await Team.updateOne(
        { _id: team._id },
        { $addToSet: { members: user._id } },
      );
      joinedTeam = true;
    }

    const saved = await loadResponse(poll._id, responseId);
    res.json({ response: serializeResponse(saved), joinedTeam });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

async function requirePollLeader(req, res) {
  const { poll, team } = await loadPollWithTeam(req.params.pollId);
  if (!poll || !team) {
    res.status(404).json({ message: "일정 투표를 찾을 수 없습니다." });
    return {};
  }
  if (!isTeamLeader(team, req.userId)) {
    res.status(403).json({ message: "곡장·부곡장만 관리할 수 있습니다." });
    return {};
  }
  return { poll, team };
}

/** 마감·재개, 제목 수정 */
router.patch("/:pollId", requireAuth, async (req, res) => {
  try {
    const { poll, team } = await requirePollLeader(req, res);
    if (!poll) return;
    const { closed, title } = req.body ?? {};
    if (typeof closed === "boolean") poll.closed = closed;
    if (typeof title === "string") poll.title = title.trim().slice(0, 40);
    await poll.save();
    res.json({ poll: serializePoll(poll, team) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.delete("/:pollId", requireAuth, async (req, res) => {
  try {
    const { poll } = await requirePollLeader(req, res);
    if (!poll) return;
    await TeamPoll.findByIdAndDelete(poll._id);
    res.json({ message: "일정 투표를 삭제했습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

/** 팀장: 응답 하나 삭제 (잘못 들어온 게스트 등) */
router.delete("/:pollId/response/:responseId", requireAuth, async (req, res) => {
  try {
    const { poll, team } = await requirePollLeader(req, res);
    if (!poll) return;
    if (!/^[a-f0-9]{24}$/i.test(String(req.params.responseId))) {
      return res.status(404).json({ message: "응답을 찾을 수 없습니다." });
    }
    const result = await TeamPoll.updateOne(
      { _id: poll._id },
      { $pull: { responses: { _id: req.params.responseId } } },
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "응답을 찾을 수 없습니다." });
    }
    const fresh = await TeamPoll.findById(poll._id);
    res.json({ poll: serializePoll(fresh, team) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
