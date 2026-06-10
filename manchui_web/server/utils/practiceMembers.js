function normalizeMemberByHour(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((slot) => {
      const hour = Number(slot?.hour);
      const time = String(slot?.time ?? "").trim();
      const members = Array.isArray(slot?.members)
        ? slot.members.map(String).filter(Boolean)
        : [];

      return {
        hour: Number.isNaN(hour) ? undefined : hour,
        time,
        members,
      };
    })
    .filter((slot) => slot.time);
}

function unionMemberIds(memberByHour, fallbackMembers = []) {
  const set = new Set();

  for (const slot of memberByHour) {
    for (const memberId of slot.members ?? []) {
      set.add(String(memberId));
    }
  }

  if (set.size === 0 && Array.isArray(fallbackMembers)) {
    for (const memberId of fallbackMembers) {
      set.add(String(memberId));
    }
  }

  return [...set];
}

function resolvePracticeMembers({ members, memberByHour }) {
  const normalizedMemberByHour = normalizeMemberByHour(memberByHour);
  const resolvedMembers = unionMemberIds(
    normalizedMemberByHour,
    Array.isArray(members) ? members : [],
  );

  return {
    memberByHour: normalizedMemberByHour,
    members: resolvedMembers,
  };
}

function ensureLeaderInPractice({ members, memberByHour, leaderId }) {
  if (!leaderId) {
    return { members, memberByHour };
  }

  const leaderKey = String(leaderId);
  const nextMemberByHour = normalizeMemberByHour(memberByHour).map((slot) => {
    const slotMembers = [...slot.members];
    if (!slotMembers.includes(leaderKey)) slotMembers.push(leaderKey);
    slotMembers.sort();
    return { ...slot, members: slotMembers };
  });

  const nextMembers = unionMemberIds(
    nextMemberByHour,
    Array.isArray(members) ? members : [],
  );
  if (!nextMembers.includes(leaderKey)) nextMembers.push(leaderKey);
  nextMembers.sort();

  return {
    members: nextMembers,
    memberByHour: nextMemberByHour,
  };
}

module.exports = {
  normalizeMemberByHour,
  unionMemberIds,
  resolvePracticeMembers,
  ensureLeaderInPractice,
};
