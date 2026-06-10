import {
  formatDateKey,
  normalizeDateKey,
  getUpcomingPractices,
  WEEK_LABELS,
} from "../Team/teamCalendarUtils";

export { WEEK_LABELS };

export function parseDateKey(dateKey) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToDateKey(dateKey, days) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

export function formatScheduleMonthLabel(dateKey) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function formatScheduleDateHeader(dateKey) {
  const date = parseDateKey(dateKey);
  return {
    day: date.getDate(),
    week: WEEK_LABELS[date.getDay()],
    label: `${date.getDate()} ${WEEK_LABELS[date.getDay()]}`,
  };
}

export function buildVisibleDateKeys(startDateKey, count = 3) {
  const keys = [];
  for (let i = 0; i < count; i += 1) {
    keys.push(addDaysToDateKey(startDateKey, i));
  }
  return keys;
}

export const SCHEDULE_SLOT_COUNT = 48;

export function createEmptyTimes() {
  return new Array(SCHEDULE_SLOT_COUNT).fill(0);
}

/** 선택한 정시(0~23) → 30분 슬롯 배열 */
export function hoursToTimes(selectedHours) {
  const times = createEmptyTimes();
  for (const h of selectedHours) {
    const hour = Number(h);
    if (Number.isNaN(hour) || hour < 0 || hour > 23) continue;
    times[hour * 2] = 1;
    times[hour * 2 + 1] = 1;
  }
  return times;
}

/** 30분 슬롯 배열 → 정시 목록 */
export function timesToHours(times) {
  const hours = new Set();
  if (!Array.isArray(times)) return [];
  for (let h = 0; h < 24; h += 1) {
    if (times[h * 2] || times[h * 2 + 1]) hours.add(h);
  }
  return [...hours].sort((a, b) => a - b);
}

export function buildUserScheduleMap(userSchedules) {
  const map = new Map();
  if (!Array.isArray(userSchedules)) return map;
  for (const item of userSchedules) {
    const key = normalizeDateKey(item?.date);
    if (!key || item?.category === "temp") continue;
    map.set(key, item);
  }
  return map;
}

export function flattenRequestDates(teamRequests) {
  const byDate = new Map();
  if (!Array.isArray(teamRequests)) return byDate;

  for (const entry of teamRequests) {
    const teamName = String(entry?.name ?? "팀").trim() || "팀";
    const requests = Array.isArray(entry?.request) ? entry.request : [];
    for (const raw of requests) {
      const key = normalizeDateKey(raw);
      if (!key) continue;
      const list = byDate.get(key) ?? [];
      if (!list.some((t) => t.teamName === teamName)) {
        list.push({ teamName, dateKey: key });
      }
      byDate.set(key, list);
    }
  }
  return byDate;
}

export function filterPracticesForTeams(practices, teamIds) {
  const idSet = new Set(teamIds.map(String));
  return (Array.isArray(practices) ? practices : []).filter((p) =>
    idSet.has(String(p.teamId)),
  );
}

export function enrichPracticesWithTeam(practices, teams) {
  const teamMap = new Map(
    (Array.isArray(teams) ? teams : []).map((t) => [String(t._id), t]),
  );
  return (Array.isArray(practices) ? practices : []).map((practice) => {
    const team = teamMap.get(String(practice.teamId));
    return {
      ...practice,
      teamName: practice.teamName ?? team?.name ?? "팀",
      teamColor: practice.teamColor ?? team?.teamColor ?? "#E87070",
    };
  });
}

export function getHomeUpcomingPractices(practices, { limit = 8 } = {}) {
  return getUpcomingPractices(practices, { limit }).map((practice) => ({
    ...practice,
    teamName: practice.teamName ?? "팀",
    teamColor: practice.teamColor ?? "#E87070",
  }));
}

export function getUpcomingReservations(reservations, now = new Date()) {
  const todayKey = normalizeDateKey(now);
  return (Array.isArray(reservations) ? reservations : [])
    .map((r) => ({ ...r, dateKey: normalizeDateKey(r.date) }))
    .filter((r) => r.dateKey && r.dateKey >= todayKey)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function buildPracticeByDate(practices) {
  const map = new Map();
  for (const practice of Array.isArray(practices) ? practices : []) {
    const key = normalizeDateKey(practice?.date);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(practice);
    map.set(key, list);
  }
  return map;
}

export function buildReservationByDate(reservations) {
  const map = new Map();
  for (const reservation of Array.isArray(reservations) ? reservations : []) {
    const key = normalizeDateKey(reservation?.date);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(reservation);
    map.set(key, list);
  }
  return map;
}
