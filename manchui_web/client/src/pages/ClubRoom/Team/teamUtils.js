export function isDefaultComment(comment) {
  const c = String(comment ?? "").trim();
  return !c || c === "작성해 주세요.";
}

export function getMemberDisplayName(member) {
  return (
    member?.username || member?.Identification || member?.email || "이름 없음"
  );
}

export function normalizeCoLeaderIds(team) {
  return (Array.isArray(team?.coLeaderIds) ? team.coLeaderIds : [])
    .map((id) => String(id))
    .filter(Boolean);
}

export function isMainTeamLeader(team, userId) {
  if (!team || !userId) return false;
  return String(team.leaderId) === String(userId);
}

export function isCoTeamLeader(team, userId) {
  if (!team || !userId) return false;
  return normalizeCoLeaderIds(team).includes(String(userId));
}

/** 곡장 또는 부곡장 */
export function isTeamLeader(team, userId) {
  return isMainTeamLeader(team, userId) || isCoTeamLeader(team, userId);
}

export function getTeamLeaderIds(team) {
  const ids = [];
  if (team?.leaderId) ids.push(String(team.leaderId));
  for (const id of normalizeCoLeaderIds(team)) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function isTeamMember(team, userId) {
  if (!team || !userId) return false;
  const members = Array.isArray(team.members) ? team.members : [];
  return members.some((member) => String(member?._id ?? member) === String(userId));
}

export function getTeamInviteUrl(teamId) {
  if (!teamId) return "";
  return `${window.location.origin}/club/team/join/${teamId}`;
}

export async function shareTeamInvite(teamName, teamId, modal) {
  const url = getTeamInviteUrl(teamId);
  const shareData = {
    title: `${teamName} 팀 초대`,
    text: `${teamName} 팀에 초대되었습니다. 링크에서 가입해 주세요.`,
    url,
  };

  if (
    typeof navigator.share === "function" &&
    (!navigator.canShare || navigator.canShare(shareData))
  ) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    await modal("초대 링크가 복사되었습니다.");
  } catch {
    await modal(`아래 링크를 복사해 보내 주세요.\n\n${url}`);
  }
}
