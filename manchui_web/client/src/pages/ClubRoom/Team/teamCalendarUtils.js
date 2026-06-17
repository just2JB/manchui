import { getMemberDisplayName } from "./teamUtils";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export { WEEK_LABELS };

export function formatDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function buildMonthGrid(viewMonth) {
  const first = startOfMonth(viewMonth);
  const year = first.getFullYear();
  const month = first.getMonth();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const cells = [];
  for (let i = 0; i < leading; i++) {
    cells.push({ key: `pad-${i}`, date: null });
  }
  for (let day = 1; day <= lastDate; day++) {
    const date = new Date(year, month, day);
    cells.push({ key: formatDateKey(date), date });
  }
  return cells;
}

/** 7칸 단위 주 행 (끝 주 빈 칸 패딩) */
export function buildMonthWeeks(viewMonth) {
  const cells = buildMonthGrid(viewMonth);
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i += 1) {
    cells.push({ key: `pad-end-${i}`, date: null });
  }
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function groupConsecutiveColumnEntries(entries) {
  if (entries.length === 0) return [];
  const groups = [];
  let start = entries[0];
  let prev = entries[0];
  for (let i = 1; i < entries.length; i += 1) {
    const curr = entries[i];
    if (curr.col === prev.col + 1) {
      prev = curr;
    } else {
      groups.push({ start, end: prev });
      start = curr;
      prev = curr;
    }
  }
  groups.push({ start, end: prev });
  return groups;
}

/**
 * 주(7칸) 안에서 취합 요청 바 세그먼트 — grid-column span 용
 * @returns {{ id, colStart, colSpan, roundLeft, roundRight }[]}
 */
export function buildWeekRequestBarSegments(
  weekCells,
  requestRanges,
  practiceDateSet,
) {
  const segments = [];

  for (const range of requestRanges) {
    const cols = [];
    weekCells.forEach((cell, col) => {
      if (!cell?.date) return;
      const key = cell.key;
      if (key < range.start || key > range.end) return;
      if (practiceDateSet.has(key)) return;
      cols.push({ col, key });
    });

    for (const group of groupConsecutiveColumnEntries(cols)) {
      segments.push({
        id: `req-${range.start}-${group.start.key}-${group.end.key}`,
        colStart: group.start.col + 1,
        colSpan: group.end.col - group.start.col + 1,
        roundLeft: group.start.key === range.start,
        roundRight: group.end.key === range.end,
      });
    }
  }

  return segments;
}

/** API·레거시 날짜 문자열 → YYYY-MM-DD */
export function normalizeDateKey(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dotted = s.replace(/\s/g, "").split(".").filter(Boolean);
  if (dotted.length >= 3) {
    const y = dotted[0];
    const m = String(dotted[1]).padStart(2, "0");
    const d = String(dotted[2]).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return formatDateKey(parsed);
  return null;
}

export function buildRequestDateSet(requestSchedules) {
  const set = new Set();
  if (!Array.isArray(requestSchedules)) return set;
  for (const item of requestSchedules) {
    const key = normalizeDateKey(item);
    if (key) set.add(key);
  }
  return set;
}

function isNextCalendarDay(dateKeyA, dateKeyB) {
  const [y, m, d] = dateKeyA.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return formatDateKey(next) === dateKeyB;
}

/** 연속 날짜 구간 [{ start, end }, ...] */
export function buildConsecutiveRanges(dateKeys) {
  const sorted = [...new Set(dateKeys)].sort();
  if (sorted.length === 0) return [];

  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const key = sorted[i];
    if (isNextCalendarDay(end, key)) {
      end = key;
    } else {
      ranges.push({ start, end });
      start = key;
      end = key;
    }
  }
  ranges.push({ start, end });
  return ranges;
}

export function getRangeSegment(dateKey, ranges) {
  for (const { start, end } of ranges) {
    if (dateKey < start || dateKey > end) continue;
    if (start === end) return "single";
    if (dateKey === start) return "start";
    if (dateKey === end) return "end";
    return "mid";
  }
  return null;
}

export function buildPracticeByDate(practices) {
  const map = new Map();
  if (!Array.isArray(practices)) return map;
  for (const practice of practices) {
    const key = normalizeDateKey(practice?.date);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(practice);
    map.set(key, list);
  }
  return map;
}

/** 캘린더 칸용 짧은 연습 시간 라벨 */
export function formatPracticeTimeLabel(time) {
  const raw = String(time ?? "").trim();
  if (!raw) return "연습";
  return raw
    .replace(/:00/g, "")
    .replace(/\s*[-–~]\s*/g, "-")
    .replace(/\s+/g, "");
}

/** 다가오는 연습 목록용 시간 표시 */
export function formatPracticeTimeDisplay(time) {
  const raw = String(time ?? "").trim();
  if (!raw) return "시간 미정";
  return raw.replace(/\s*[-–~]\s*/g, " – ");
}

function parsePracticeSortKey(time) {
  const match = String(time ?? "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function getInclusiveDateRange(startKey, endKey) {
  const start = startKey <= endKey ? startKey : endKey;
  const end = startKey <= endKey ? endKey : startKey;
  const [y, m, d] = start.split("-").map(Number);
  const cur = new Date(y, m - 1, d);
  const [ey, em, ed] = end.split("-").map(Number);
  const endDate = new Date(ey, em - 1, ed);
  const keys = [];

  while (cur <= endDate) {
    keys.push(formatDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }

  return keys;
}

export function isDateInInclusiveRange(dateKey, startKey, endKey) {
  if (!startKey || !endKey || !dateKey) return false;
  const start = startKey <= endKey ? startKey : endKey;
  const end = startKey <= endKey ? endKey : startKey;
  return dateKey >= start && dateKey <= end;
}

export function formatUpcomingPracticeDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const week = WEEK_LABELS[date.getDay()];
  return `${m}월 ${d}일 (${week})`;
}

/** 오늘 이후 연습만 날짜·시간 순으로 반환 */
export function getUpcomingPractices(practices, { limit = 6, now = new Date() } = {}) {
  const todayKey = formatDateKey(now);
  const list = (Array.isArray(practices) ? practices : [])
    .map((practice) => ({
      ...practice,
      dateKey: normalizeDateKey(practice?.date),
    }))
    .filter((practice) => practice.dateKey && practice.dateKey >= todayKey)
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) {
        return a.dateKey.localeCompare(b.dateKey);
      }
      return parsePracticeSortKey(a.time) - parsePracticeSortKey(b.time);
    });

  return limit > 0 ? list.slice(0, limit) : list;
}

/** 연습 생성 URL 쿼리 → 정렬·중복 제거된 날짜 키 배열 */
export function parsePracticeDateKeys(searchParams) {
  const multi = searchParams?.get?.("dates");
  if (multi) {
    return [
      ...new Set(
        multi
          .split(",")
          .map((raw) => normalizeDateKey(raw.trim()))
          .filter(Boolean),
      ),
    ].sort();
  }

  const single = normalizeDateKey(searchParams?.get?.("date"));
  return single ? [single] : [];
}

export function formatPracticeDatesSummary(dateKeys) {
  if (!Array.isArray(dateKeys) || dateKeys.length === 0) return "";
  if (dateKeys.length === 1) return formatUpcomingPracticeDate(dateKeys[0]);
  return `${formatUpcomingPracticeDate(dateKeys[0])} – ${formatUpcomingPracticeDate(dateKeys[dateKeys.length - 1])} (${dateKeys.length}일)`;
}

export function buildPracticeCreateSearch(dateKeys) {
  const keys = (Array.isArray(dateKeys) ? dateKeys : [])
    .map((key) => normalizeDateKey(key))
    .filter(Boolean);
  if (keys.length === 0) return "";
  if (keys.length === 1) {
    return `date=${encodeURIComponent(keys[0])}`;
  }
  return `dates=${encodeURIComponent(keys.join(","))}`;
}

function formatPracticePlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

function buildPracticeMemberIdSet(practice) {
  return new Set(
    (Array.isArray(practice?.members) ? practice.members : []).map((member) =>
      String(member?._id ?? member),
    ),
  );
}

/** 클립보드용 한 줄: 날짜 시간 위치 인원수 (제외인원 명단) */
export function buildUpcomingPracticeCopyLine(practice, teamMembers = []) {
  const dateKey = normalizeDateKey(practice?.dateKey ?? practice?.date);
  const dateLabel = dateKey ? formatUpcomingPracticeDate(dateKey) : "—";
  const timeLabel = formatPracticeTimeDisplay(practice?.time);
  const placeLabel = formatPracticePlace(practice?.place);
  const memberIds = buildPracticeMemberIdSet(practice);
  const excludedNames = (Array.isArray(teamMembers) ? teamMembers : [])
    .filter((member) => !memberIds.has(String(member?._id ?? member)))
    .map((member) => getMemberDisplayName(member));

  return `${dateLabel} ${timeLabel} ${placeLabel} ${memberIds.size}명 (${excludedNames.join(", ")})`;
}

/** 앞으로 잡힌 연습 전체를 클립보드용 텍스트로 */
export function buildUpcomingPracticesCopyText(
  practices,
  teamMembers = [],
  options = {},
) {
  const upcoming = getUpcomingPractices(practices, { limit: 0, ...options });
  return upcoming
    .map((practice) => buildUpcomingPracticeCopyLine(practice, teamMembers))
    .join("\n");
}
