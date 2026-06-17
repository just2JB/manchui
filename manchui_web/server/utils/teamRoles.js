function normalizeCoLeaderIds(team) {
  return (Array.isArray(team?.coLeaderIds) ? team.coLeaderIds : [])
    .map((id) => String(id))
    .filter(Boolean);
}

function isMainTeamLeader(team, userId) {
  if (!team || !userId) return false;
  return String(team.leaderId) === String(userId);
}

function isCoTeamLeader(team, userId) {
  if (!team || !userId) return false;
  return normalizeCoLeaderIds(team).includes(String(userId));
}

function isTeamLeader(team, userId) {
  return isMainTeamLeader(team, userId) || isCoTeamLeader(team, userId);
}

function getTeamLeaderIds(team) {
  const ids = [];
  if (team?.leaderId) ids.push(String(team.leaderId));
  for (const id of normalizeCoLeaderIds(team)) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function removeMemberFromCoLeaders(team, memberId) {
  const key = String(memberId);
  team.coLeaderIds = normalizeCoLeaderIds(team).filter((id) => id !== key);
}

module.exports = {
  normalizeCoLeaderIds,
  isMainTeamLeader,
  isCoTeamLeader,
  isTeamLeader,
  getTeamLeaderIds,
  removeMemberFromCoLeaders,
};
