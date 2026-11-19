import { normalizeDateKey, WEEK_LABELS } from "../Team/teamCalendarUtils";

export const POLL_DEFAULT_START_HOUR = 10;
export const POLL_DEFAULT_END_HOUR = 24;
export const POLL_MAX_DATES = 31;
export const POLL_RECOMMEND_MIN_HOURS = 2;
export const GUEST_MEMBER_PREFIX = "guest:";

/* ---------- 포맷 ---------- */

export function formatPollHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** endHour 는 미포함 경계 */
export function formatPollHourRange(startHour, endHourExclusive) {
  return `${formatPollHour(startHour)}–${formatPollHour(endHourExclusive)}`;
}

export function parseDateKey(dateKey) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatPollDate(dateKey) {
  const date = parseDateKey(dateKey);
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    week: WEEK_LABELS[date.getDay()],
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  };
}

export function formatPollDateShort(dateKey) {
  const { month, day, week } = formatPollDate(dateKey);
  return `${month}/${day} (${week})`;
}

export function formatPollDatesSummary(dates) {
  const keys = Array.isArray(dates) ? dates : [];
  if (keys.length === 0) return "";
  if (keys.length === 1) return formatPollDateShort(keys[0]);
  return `${formatPollDateShort(keys[0])} – ${formatPollDateShort(keys[keys.length - 1])} · ${keys.length}일`;
}

export function getPollDisplayTitle(poll) {
  const title = String(poll?.title ?? "").trim();
  return title || "연습 일정 종합";
}

/* ---------- 상태 ---------- */

export function getPollHours(poll) {
  const start = Number(poll?.startHour ?? POLL_DEFAULT_START_HOUR);
  const end = Number(poll?.endHour ?? POLL_DEFAULT_END_HOUR);
  const hours = [];
  for (let hour = start; hour < end; hour += 1) hours.push(hour);
  return hours;
}

export function isPollPast(poll, now = new Date()) {
  const dates = Array.isArray(poll?.dates) ? poll.dates : [];
  if (dates.length === 0) return true;
  const todayKey = normalizeDateKey(now);
  return dates[dates.length - 1] < todayKey;
}

export function isPollActive(poll) {
  return Boolean(poll) && !poll.closed && !isPollPast(poll);
}

/* ---------- 가능 시간 집합 ---------- */

export function slotKey(dateKey, hour) {
  return `${dateKey}|${hour}`;
}

export function availabilityToSet(availability) {
  const set = new Set();
  for (const item of Array.isArray(availability) ? availability : []) {
    for (const hour of Array.isArray(item?.hours) ? item.hours : []) {
      set.add(slotKey(item.date, Number(hour)));
    }
  }
  return set;
}

export function setToAvailability(set, dates) {
  const byDate = new Map();
  for (const key of set) {
    const [date, hourRaw] = key.split("|");
    const hour = Number(hourRaw);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(hour);
  }
  return (Array.isArray(dates) ? dates : [])
    .filter((date) => byDate.has(date))
    .map((date) => ({
      date,
      hours: byDate.get(date).sort((a, b) => a - b),
    }));
}

export function countSlots(availability) {
  return (Array.isArray(availability) ? availability : []).reduce(
    (sum, item) => sum + (item?.hours?.length ?? 0),
    0,
  );
}

/** 한 칸이라도 입력한 응답만 집계 대상 */
export function getRespondents(poll) {
  return (Array.isArray(poll?.responses) ? poll.responses : []).filter(
    (response) => countSlots(response.availability) > 0,
  );
}

/** slotKey → 가능 응답 id 목록 */
export function buildPollHeatmap(poll) {
  const respondents = getRespondents(poll);
  const slots = new Map();
  for (const response of respondents) {
    for (const key of availabilityToSet(response.availability)) {
      if (!slots.has(key)) slots.set(key, []);
      slots.get(key).push(response._id);
    }
  }
  let max = 0;
  for (const ids of slots.values()) max = Math.max(max, ids.length);
  return { slots, total: respondents.length, max, respondents };
}

/* ---------- 추천 ---------- */

/**
 * 추천 연습시간: 같은 사람들이 처음부터 끝까지 가능한 연속 구간.
 * 가능 인원 많은 순 → 길이 긴 순 → 오후 우선 → 날짜 빠른 순,
 * 같은 날짜에서 겹치는 구간은 건너뛰어 서로 다른 후보만 남긴다.
 */
export function buildPollRecommendations(
  poll,
  { minHours = POLL_RECOMMEND_MIN_HOURS, limit = 3 } = {},
) {
  const respondents = getRespondents(poll);
  const total = respondents.length;
  if (total === 0) return [];

  const hours = getPollHours(poll);
  const sets = respondents.map((response) => ({
    response,
    slots: availabilityToSet(response.availability),
  }));

  const candidates = [];
  for (const dateKey of poll.dates ?? []) {
    for (let i = 0; i < hours.length; i += 1) {
      let available = sets.filter(({ slots }) =>
        slots.has(slotKey(dateKey, hours[i])),
      );
      for (let j = i; j < hours.length && available.length > 0; j += 1) {
        if (j > i) {
          available = available.filter(({ slots }) =>
            slots.has(slotKey(dateKey, hours[j])),
          );
          if (available.length === 0) break;
        }
        const duration = j - i + 1;
        if (duration < minHours) continue;
        candidates.push({
          dateKey,
          startHour: hours[i],
          endHour: hours[j] + 1,
          duration,
          availableIds: available.map(({ response }) => response._id),
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (b.availableIds.length !== a.availableIds.length) {
      return b.availableIds.length - a.availableIds.length;
    }
    if (b.duration !== a.duration) return b.duration - a.duration;
    const aPm = a.startHour >= 12;
    const bPm = b.startHour >= 12;
    if (aPm !== bPm) return aPm ? -1 : 1;
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    return a.startHour - b.startHour;
  });

  const byId = new Map(respondents.map((response) => [response._id, response]));
  const picked = [];
  for (const candidate of candidates) {
    const overlaps = picked.some(
      (item) =>
        item.dateKey === candidate.dateKey &&
        candidate.startHour < item.endHour &&
        item.startHour < candidate.endHour,
    );
    if (overlaps) continue;
    const availableSet = new Set(candidate.availableIds);
    picked.push({
      ...candidate,
      id: `${candidate.dateKey}-${candidate.startHour}-${candidate.endHour}`,
      total,
      allAvailable: availableSet.size === total,
      available: candidate.availableIds.map((id) => byId.get(id)),
      unavailable: respondents.filter((response) => !availableSet.has(response._id)),
    });
    if (picked.length >= limit) break;
  }
  return picked;
}

/** 팀원 중 아직 응답하지 않은 사람 */
export function getPendingTeamMembers(poll, teamMembers) {
  const respondedUserIds = new Set(
    getRespondents(poll)
      .filter((response) => response.userId)
      .map((response) => String(response.userId)),
  );
  return (Array.isArray(teamMembers) ? teamMembers : []).filter(
    (member) => !respondedUserIds.has(String(member?._id ?? member)),
  );
}

/* ---------- 연습 만들기 그리드용 변환 ---------- */

export function getRespondentMemberId(response) {
  return response.kind === "user" && response.userId
    ? String(response.userId)
    : `${GUEST_MEMBER_PREFIX}${response._id}`;
}

export function isGuestMemberId(memberId) {
  return String(memberId).startsWith(GUEST_MEMBER_PREFIX);
}

/**
 * 투표 응답을 TeamPracticeAvailabilityGrid 가 쓰는 형태
 * ({ userId, date, times[48] }) 로 바꾼다.
 */
export function pollToPracticeGridData(poll) {
  const respondents = getRespondents(poll);
  const members = respondents.map((response) => ({
    _id: getRespondentMemberId(response),
    username:
      response.kind === "guest" ? `${response.name} (게스트)` : response.name,
    guestName: response.kind === "guest" ? response.name : null,
  }));

  const memberSchedules = [];
  for (const response of respondents) {
    const userId = getRespondentMemberId(response);
    for (const item of response.availability ?? []) {
      const times = new Array(48).fill(0);
      for (const hour of item.hours ?? []) {
        if (hour >= 0 && hour < 24) {
          times[hour * 2] = 1;
          times[hour * 2 + 1] = 1;
        }
      }
      memberSchedules.push({ userId, date: item.date, times, category: "poll" });
    }
  }

  return {
    dateKeys: [...(poll?.dates ?? [])],
    hours: getPollHours(poll),
    memberIds: members.map((member) => member._id),
    members,
    memberSchedules,
  };
}

/* ---------- 링크 ---------- */

export function getPollUrl(pollId) {
  if (!pollId) return "";
  return `${window.location.origin}/club/poll/${pollId}`;
}

export async function sharePollLink(poll, teamName, modal) {
  const url = getPollUrl(poll?._id);
  const title = getPollDisplayTitle(poll);
  const shareData = {
    title: `${teamName ? `${teamName} · ` : ""}${title}`,
    text: `${teamName ? `[${teamName}] ` : ""}가능한 시간을 표시해 주세요 (${formatPollDatesSummary(poll?.dates)})`,
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
    await modal("일정 종합 링크가 복사되었습니다.");
  } catch {
    await modal(`아래 링크를 복사해 보내 주세요.\n\n${url}`);
  }
}

/* ---------- 게스트 자격 (탭 세션 동안만) ---------- */

const GUEST_STORAGE_PREFIX = "manchui.poll.guest.";

export function loadGuestCredentials(pollId) {
  try {
    const raw = sessionStorage.getItem(`${GUEST_STORAGE_PREFIX}${pollId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.name && parsed?.password ? parsed : null;
  } catch {
    return null;
  }
}

export function storeGuestCredentials(pollId, creds) {
  try {
    if (creds) {
      sessionStorage.setItem(
        `${GUEST_STORAGE_PREFIX}${pollId}`,
        JSON.stringify(creds),
      );
    } else {
      sessionStorage.removeItem(`${GUEST_STORAGE_PREFIX}${pollId}`);
    }
  } catch {
    /* 저장 불가 환경은 무시 */
  }
}
