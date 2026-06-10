import { normalizeDateKey, WEEK_LABELS } from "./teamCalendarUtils";

export const PRACTICE_DAWN_HOUR_START = 0;
export const PRACTICE_DAWN_HOUR_END = 7;
export const PRACTICE_DEFAULT_HOUR_START = 8;
export const PRACTICE_DEFAULT_HOUR_END = 23;

export function getPracticeGridHours(showDawn) {
  const main = Array.from(
    { length: PRACTICE_DEFAULT_HOUR_END - PRACTICE_DEFAULT_HOUR_START + 1 },
    (_, index) => PRACTICE_DEFAULT_HOUR_START + index,
  );
  if (!showDawn) return main;

  const dawn = Array.from(
    { length: PRACTICE_DAWN_HOUR_END - PRACTICE_DAWN_HOUR_START + 1 },
    (_, index) => PRACTICE_DAWN_HOUR_START + index,
  );
  return [...dawn, ...main];
}

export function isMemberAvailableAtHour(times, hour) {
  if (!Array.isArray(times)) return false;
  const slot = Number(hour);
  if (Number.isNaN(slot) || slot < 0 || slot > 23) return false;
  return Boolean(times[slot * 2] || times[slot * 2 + 1]);
}

export function buildMemberSchedulesForDate(memberSchedules, dateKey) {
  const map = new Map();
  if (!dateKey || !Array.isArray(memberSchedules)) return map;

  for (const item of memberSchedules) {
    if (normalizeDateKey(item?.date) !== dateKey) continue;
    if (item?.category === "temp") continue;
    map.set(String(item.userId), item);
  }
  return map;
}

export function buildHourAvailability(memberIds, schedulesByUser, visibleHours) {
  const counts = {};
  const hours = Array.isArray(visibleHours) ? visibleHours : [];
  const ids = Array.isArray(memberIds) ? memberIds.map(String) : [];

  for (const hour of hours) {
    counts[hour] = 0;
  }

  for (const memberId of ids) {
    const times = schedulesByUser.get(memberId)?.times;
    for (const hour of hours) {
      if (isMemberAvailableAtHour(times, hour)) {
        counts[hour] += 1;
      }
    }
  }

  return { counts, totalMembers: ids.length };
}

export function buildDateHourAvailability(
  dateKeys,
  memberIds,
  memberSchedules,
  visibleHours,
) {
  const matrix = {};
  const respondedByDate = {};
  const ids = Array.isArray(memberIds) ? memberIds.map(String) : [];
  const hours = Array.isArray(visibleHours) ? visibleHours : [];

  for (const dateKey of dateKeys) {
    const schedulesByUser = buildMemberSchedulesForDate(memberSchedules, dateKey);
    respondedByDate[dateKey] = schedulesByUser.size;
    matrix[dateKey] = buildHourAvailability(ids, schedulesByUser, hours).counts;
  }

  return {
    matrix,
    totalMembers: ids.length,
    respondedByDate,
  };
}

export function availabilityIntensity(count, totalMembers) {
  if (!totalMembers || totalMembers <= 0 || count <= 0) return 0;
  return Math.min(1, count / totalMembers);
}

export function isAllMembersAvailable(count, totalMembers) {
  return totalMembers > 0 && count === totalMembers;
}

export function formatHourClock(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatHourRangeLabel(startHour, endHour) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (Number.isNaN(start) || Number.isNaN(end)) return "";
  const endNext = end + 1;
  const endLabel = endNext === 24 ? "00:00" : formatHourClock(endNext);
  return `${formatHourClock(start)}–${endLabel}`;
}

export function formatPracticeGridHourLabel(hour) {
  return `${String(hour).padStart(2, "0")}시`;
}

export function formatPracticeGridDateHeader(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    month: m,
    day: d,
    week: WEEK_LABELS[date.getDay()],
  };
}

export function isHourSelected(hour, hours) {
  if (!Array.isArray(hours)) return false;
  return hours.includes(hour);
}

/** 같은 칸을 다시 탭하면 선택 해제 */
export function toggleHourInSelection(hours, hour) {
  const list = Array.isArray(hours) ? [...hours] : [];
  const index = list.indexOf(hour);
  if (index >= 0) {
    list.splice(index, 1);
    return list;
  }
  list.push(hour);
  list.sort((a, b) => a - b);
  return list;
}

export function mergeConsecutiveHourRanges(hours) {
  if (!Array.isArray(hours) || hours.length === 0) return [];

  const sorted = [...hours].sort((a, b) => a - b);
  const ranges = [];
  let startHour = sorted[0];
  let endHour = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const hour = sorted[index];
    if (hour === endHour + 1) {
      endHour = hour;
      continue;
    }
    ranges.push({ startHour, endHour });
    startHour = hour;
    endHour = hour;
  }

  ranges.push({ startHour, endHour });
  return ranges;
}

export function unionMemberIdsFromSlots(slots) {
  const set = new Set();
  for (const slot of Array.isArray(slots) ? slots : []) {
    for (const memberId of slot?.members ?? slot?.availableMemberIds ?? []) {
      set.add(String(memberId));
    }
  }
  return [...set].sort();
}

/** 연습 생성 시 곡장을 참여 멤버·시간별 목록에 항상 포함 */
export function ensureLeaderInPracticeEntry(entry, leaderId) {
  if (!entry || !leaderId) return entry;

  const leaderKey = String(leaderId);
  const memberByHour = (Array.isArray(entry.memberByHour) ? entry.memberByHour : []).map(
    (slot) => {
      const slotMembers = [...(slot.members ?? [])].map(String);
      if (!slotMembers.includes(leaderKey)) slotMembers.push(leaderKey);
      slotMembers.sort();
      return { ...slot, members: slotMembers };
    },
  );

  const members = unionMemberIdsFromSlots(memberByHour);
  const availableMemberIds = [...new Set([...(entry.availableMemberIds ?? members).map(String), leaderKey])].sort();

  const memberHours = Array.isArray(entry.memberHours)
    ? entry.memberHours.map((slot) => {
        const ids = [...(slot.availableMemberIds ?? slot.members ?? [])].map(String);
        if (!ids.includes(leaderKey)) ids.push(leaderKey);
        ids.sort();
        return {
          ...slot,
          availableMemberIds: ids,
          availableCount: ids.length,
          members: ids,
        };
      })
    : entry.memberHours;

  return {
    ...entry,
    members,
    memberByHour,
    memberHours,
    availableMemberIds,
    availableCount: availableMemberIds.length,
  };
}

export function buildMemberByHourForRange(
  memberIds,
  schedulesByUser,
  startHour,
  endHour,
) {
  return getHoursInRange(startHour, endHour).map((hour) => {
    const members = getMembersAvailableAtHour(memberIds, schedulesByUser, hour);
    return {
      hour,
      time: formatHourRangeLabel(hour, hour),
      members,
    };
  });
}

export function buildSelectionEntries(
  selectionByDate,
  dateKeys,
  memberIds = [],
  memberSchedules = [],
  leaderIds = null,
  leaderId = null,
) {
  const resolvedLeaderIds = Array.isArray(leaderIds)
    ? leaderIds.map(String).filter(Boolean)
    : leaderId
      ? [String(leaderId)]
      : [];
  const entries = [];
  const keys = Array.isArray(dateKeys) ? dateKeys : [];
  const totalMembers = Array.isArray(memberIds) ? memberIds.length : 0;

  for (const dateKey of keys) {
    const hours = selectionByDate[dateKey];
    if (!Array.isArray(hours) || hours.length === 0) continue;

    const schedulesByUser = buildMemberSchedulesForDate(memberSchedules, dateKey);

    for (const range of mergeConsecutiveHourRanges(hours)) {
      const memberByHour = buildMemberByHourForRange(
        memberIds,
        schedulesByUser,
        range.startHour,
        range.endHour,
      );

      const memberHours = memberByHour.map((slot) => ({
        hour: slot.hour,
        time: slot.time,
        availableMemberIds: slot.members,
        availableCount: slot.members.length,
      }));

      const availableMemberIds = getMembersAvailableForRange(
        memberIds,
        schedulesByUser,
        range.startHour,
        range.endHour,
      );

      let entry = {
        dateKey,
        startHour: range.startHour,
        endHour: range.endHour,
        time: formatHourRangeLabel(range.startHour, range.endHour),
        members: unionMemberIdsFromSlots(memberByHour),
        memberByHour,
        availableMemberIds,
        availableCount: availableMemberIds.length,
        totalMembers,
        memberHours,
        displayKey: `${dateKey}-${range.startHour}-${range.endHour}`,
      };

      for (const id of resolvedLeaderIds) {
        entry = ensureLeaderInPracticeEntry(entry, id);
      }

      entries.push(entry);
    }
  }

  return entries;
}

export function getMembersAvailableAtHour(memberIds, schedulesByUser, hour) {
  const ids = Array.isArray(memberIds) ? memberIds.map(String) : [];
  const available = [];

  for (const memberId of ids) {
    const times = schedulesByUser.get(memberId)?.times;
    if (isMemberAvailableAtHour(times, hour)) {
      available.push(memberId);
    }
  }

  return available.sort();
}

export function getMembersUnavailableAtHour(memberIds, schedulesByUser, hour) {
  const ids = Array.isArray(memberIds) ? memberIds.map(String) : [];
  const available = new Set(
    getMembersAvailableAtHour(memberIds, schedulesByUser, hour),
  );
  return ids.filter((memberId) => !available.has(memberId));
}

export function getMembersAvailableForRange(
  memberIds,
  schedulesByUser,
  startHour,
  endHour,
) {
  const hours = getHoursInRange(startHour, endHour);
  if (hours.length === 0) return [];

  let intersection = null;

  for (const hour of hours) {
    const atHour = new Set(
      getMembersAvailableAtHour(memberIds, schedulesByUser, hour),
    );
    if (intersection === null) {
      intersection = atHour;
      continue;
    }
    intersection = new Set(
      [...intersection].filter((memberId) => atHour.has(memberId)),
    );
  }

  return [...(intersection ?? [])].sort();
}

export function clearHourRange(hours, startHour, endHour) {
  const list = Array.isArray(hours) ? hours : [];
  const start = Number(startHour);
  const end = Number(endHour);
  if (Number.isNaN(start) || Number.isNaN(end)) return list;

  const remove = new Set();
  for (let hour = start; hour <= end; hour += 1) {
    remove.add(hour);
  }
  return list.filter((hour) => !remove.has(hour));
}

export const PRACTICE_FULL_DAY_HOURS = Array.from({ length: 24 }, (_, index) => index);
export const PRACTICE_AFTERNOON_START = 12;
export const PRACTICE_RECOMMEND_MIN_HOURS = 2;

export function getHoursInRange(startHour, endHour) {
  const start = Number(startHour);
  const end = Number(endHour);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return [];

  const hours = [];
  for (let hour = start; hour <= end; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

export function getRangeMinAvailability(counts, startHour, endHour) {
  const hours = getHoursInRange(startHour, endHour);
  if (hours.length === 0) return 0;

  let min = Infinity;
  for (const hour of hours) {
    const count = counts?.[hour] ?? 0;
    if (count < min) min = count;
  }
  return min === Infinity ? 0 : min;
}

/** 2시간 이상 · 참여 가능 인원 많은 순 · 오후 우선 */
export function buildRecommendedPracticeSlots(
  dateKeys,
  matrix,
  totalMembers,
  { minDuration = PRACTICE_RECOMMEND_MIN_HOURS, maxResults = 50 } = {},
) {
  const keys = Array.isArray(dateKeys) ? dateKeys : [];
  const candidates = [];

  for (const dateKey of keys) {
    const counts = matrix?.[dateKey] ?? {};

    for (let startHour = 0; startHour <= 23; startHour += 1) {
      for (
        let endHour = startHour + minDuration - 1;
        endHour <= 23;
        endHour += 1
      ) {
        const duration = endHour - startHour + 1;
        if (duration < minDuration) continue;

        const minAvailable = getRangeMinAvailability(counts, startHour, endHour);
        if (minAvailable <= 0) continue;

        candidates.push({
          id: `${dateKey}-${startHour}-${endHour}`,
          dateKey,
          startHour,
          endHour,
          duration,
          minAvailable,
          totalMembers,
          time: formatHourRangeLabel(startHour, endHour),
          isAfternoon: startHour >= PRACTICE_AFTERNOON_START,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.minAvailable !== a.minAvailable) {
      return b.minAvailable - a.minAvailable;
    }
    if (a.isAfternoon !== b.isAfternoon) {
      return a.isAfternoon ? -1 : 1;
    }
    if (a.dateKey !== b.dateKey) {
      return a.dateKey.localeCompare(b.dateKey);
    }
    if (a.startHour !== b.startHour) {
      return a.startHour - b.startHour;
    }
    return b.duration - a.duration;
  });

  return candidates.slice(0, maxResults);
}

export function applyRecommendedRanges(selectionByDate, ranges) {
  const next = { ...(selectionByDate ?? {}) };

  for (const range of ranges) {
    const dateKey = range?.dateKey;
    const startHour = Number(range?.startHour);
    const endHour = Number(range?.endHour);
    if (!dateKey || Number.isNaN(startHour) || Number.isNaN(endHour)) continue;

    const merged = new Set(Array.isArray(next[dateKey]) ? next[dateKey] : []);
    for (const hour of getHoursInRange(startHour, endHour)) {
      merged.add(hour);
    }
    next[dateKey] = [...merged].sort((a, b) => a - b);
  }

  return next;
}

export function recommendationNeedsDawn(ranges) {
  return (Array.isArray(ranges) ? ranges : []).some(
    (range) => Number(range?.startHour) <= PRACTICE_DAWN_HOUR_END,
  );
}
