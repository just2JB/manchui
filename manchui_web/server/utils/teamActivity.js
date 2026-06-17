const { normalizeScheduleDate } = require("./scheduleDate");

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function getTeamCreatedAt(team) {
  if (team?.createdAt) {
    const date = new Date(team.createdAt);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const id = team?._id;
  if (id != null && String(id).length === 24) {
    const sec = parseInt(String(id).slice(0, 8), 16);
    if (!Number.isNaN(sec)) return new Date(sec * 1000);
  }
  return null;
}

function parseCalendarDate(raw) {
  const normalized = normalizeScheduleDate(raw);
  if (!normalized) return null;
  const [y, m, d] = normalized.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinOneMonth(date, now = new Date()) {
  if (!date || Number.isNaN(date.getTime())) return false;
  return Math.abs(date.getTime() - now.getTime()) <= ONE_MONTH_MS;
}

function isTeamCreatedWithinOneMonth(team, now = new Date()) {
  const createdAt = getTeamCreatedAt(team);
  if (!createdAt) return false;
  return now.getTime() - createdAt.getTime() <= ONE_MONTH_MS;
}

function teamHasRecentRequestSchedule(team, now = new Date()) {
  const schedules = Array.isArray(team?.requestSchedules)
    ? team.requestSchedules
    : [];
  return schedules.some((raw) => isWithinOneMonth(parseCalendarDate(raw), now));
}

function teamHasRecentPractice(practices, teamId, now = new Date()) {
  const id = String(teamId);
  return (Array.isArray(practices) ? practices : []).some((practice) => {
    if (String(practice?.teamId) !== id) return false;
    return isWithinOneMonth(parseCalendarDate(practice?.date), now);
  });
}

function isTeamActive(team, practices, now = new Date()) {
  if (isTeamCreatedWithinOneMonth(team, now)) return true;
  if (teamHasRecentRequestSchedule(team, now)) return true;
  if (teamHasRecentPractice(practices, team._id, now)) return true;
  return false;
}

function formatDateKey(date) {
  if (!date || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function summarizeTeam(team, practices, userMap, now = new Date()) {
  const teamId = String(team._id);
  const teamPractices = (Array.isArray(practices) ? practices : []).filter(
    (practice) => String(practice.teamId) === teamId,
  );
  const createdAt = getTeamCreatedAt(team);

  let lastPracticeDate = null;
  for (const practice of teamPractices) {
    const date = parseCalendarDate(practice.date);
    if (date && (!lastPracticeDate || date > lastPracticeDate)) {
      lastPracticeDate = date;
    }
  }

  let lastRequestScheduleDate = null;
  for (const raw of Array.isArray(team.requestSchedules)
    ? team.requestSchedules
    : []) {
    const date = parseCalendarDate(raw);
    if (date && (!lastRequestScheduleDate || date > lastRequestScheduleDate)) {
      lastRequestScheduleDate = date;
    }
  }

  const leader = userMap.get(String(team.leaderId));

  return {
    _id: team._id,
    name: team.name,
    comment: team.comment,
    teamColor: team.teamColor,
    leaderId: team.leaderId,
    leaderName: leader?.username || leader?.Identification || leader?.email || "—",
    memberCount: Array.isArray(team.members) ? team.members.length : 0,
    createdAt: createdAt ? createdAt.toISOString() : null,
    isActive: isTeamActive(team, practices, now),
    practiceCount: teamPractices.length,
    requestScheduleCount: Array.isArray(team.requestSchedules)
      ? team.requestSchedules.length
      : 0,
    lastPracticeDate: formatDateKey(lastPracticeDate),
    lastRequestScheduleDate: formatDateKey(lastRequestScheduleDate),
  };
}

function buildAdminTeamSummaries(teams, practices, users, now = new Date()) {
  const userMap = new Map(
    (Array.isArray(users) ? users : []).map((user) => [String(user._id), user]),
  );

  const summaries = (Array.isArray(teams) ? teams : []).map((team) =>
    summarizeTeam(team, practices, userMap, now),
  );

  summaries.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const activeTeams = summaries.filter((team) => team.isActive);
  const inactiveTeams = summaries.filter((team) => !team.isActive);

  return {
    activeTeams,
    inactiveTeams,
    totalCount: summaries.length,
    activeCount: activeTeams.length,
    inactiveCount: inactiveTeams.length,
  };
}

module.exports = {
  ONE_MONTH_MS,
  getTeamCreatedAt,
  isTeamActive,
  buildAdminTeamSummaries,
  parseCalendarDate,
  formatDateKey,
};
