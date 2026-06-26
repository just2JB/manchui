import { parseDateKey } from "./Home/clubHomeUtils";

export const WEEKDAY_COLUMNS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

export const DEFAULT_GRID_START_HOUR = 9;
export const DEFAULT_GRID_END_HOUR = 18;

const JS_DAY_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const WEEKDAY_LABEL_BY_KEY = Object.fromEntries(
  WEEKDAY_COLUMNS.map(({ key, label }) => [key, label]),
);

export const MINUTE_STEP = 5;
export const MINUTE_OPTIONS = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, index) => index * MINUTE_STEP,
);

function normalizeMinute(value, fallback = 0) {
  const minute = Number(value);
  if (Number.isNaN(minute) || minute < 0 || minute > 59) return fallback;
  return Math.round(minute / MINUTE_STEP) * MINUTE_STEP;
}

function timeToMinutes(hour, minute = 0) {
  return hour * 60 + normalizeMinute(minute, 0);
}

export function formatTimeLabel(hour, minute = 0) {
  const normalizedMinute = normalizeMinute(minute, 0);
  if (normalizedMinute === 0) return `${hour}시`;
  return `${hour}:${String(normalizedMinute).padStart(2, "0")}`;
}

export function formatEntryTimeRange(entry) {
  const startMinute = entry.startMinute ?? 0;
  const endMinute = entry.endMinute ?? 0;
  const startLabel = formatTimeLabel(entry.startHour, startMinute);
  const startTotal = timeToMinutes(entry.startHour, startMinute);
  const endTotal = timeToMinutes(entry.endHour, endMinute);

  if (endTotal <= startTotal) {
    return startLabel;
  }

  if (
    startMinute === 0 &&
    endMinute === 0 &&
    (endTotal - startTotal) % 60 === 0
  ) {
    const durationHours = (endTotal - startTotal) / 60;
    if (durationHours === 1) {
      return `${startLabel}~${formatTimeLabel(entry.endHour, 0)}`;
    }
    if (durationHours > 1) {
      return formatHourRange(entry.startHour, entry.endHour - 1);
    }
  }

  const endLabel = formatTimeLabel(entry.endHour, endMinute);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel}~${endLabel}`;
}

export function formatHourRange(startHour, endHour) {
  if (startHour === endHour) return `${startHour}시`;
  return `${startHour}시~${endHour}시`;
}

export function emptyWeeklyEntries() {
  return [];
}

export function normalizeWeeklyEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const weekday = String(raw.weekday ?? "").trim();
  if (!WEEKDAY_LABEL_BY_KEY[weekday]) return null;

  const name = String(raw.name ?? "").trim();
  if (!name) return null;

  const startHour = Number(raw.startHour);
  const endHour = Number(raw.endHour);
  if (
    Number.isNaN(startHour) ||
    Number.isNaN(endHour) ||
    startHour < 0 ||
    startHour > 23 ||
    endHour < 0 ||
    endHour > 23
  ) {
    return null;
  }

  const normalizedStartHour = Math.min(startHour, endHour);
  const normalizedEndHour = Math.max(startHour, endHour);
  let startMinute = normalizeMinute(raw.startMinute, 0);
  let endMinute = normalizeMinute(raw.endMinute, 0);
  if (
    normalizedStartHour === normalizedEndHour &&
    startMinute > endMinute
  ) {
    [startMinute, endMinute] = [endMinute, startMinute];
  }

  const entry = {
    weekday,
    name,
    startHour: normalizedStartHour,
    endHour: normalizedEndHour,
    startMinute,
    endMinute,
  };
  if (raw._id) entry._id = String(raw._id);
  if (raw.id) entry._id = String(raw.id);
  return entry;
}

export function normalizeWeeklyEntries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeWeeklyEntry).filter(Boolean);
}

export function entryToHours(entry) {
  const hours = [];
  for (let hour = 0; hour <= 23; hour += 1) {
    if (slotOverlapsHour(entry, hour)) {
      hours.push(hour);
    }
  }
  return hours;
}

export function getWeeklyGridHours(entries, selectedByDay = null) {
  let minHour = DEFAULT_GRID_START_HOUR;
  let maxHour = DEFAULT_GRID_END_HOUR;

  for (const entry of normalizeWeeklyEntries(entries)) {
    minHour = Math.min(minHour, entry.startHour);
    maxHour = Math.max(maxHour, entry.endHour);
  }

  if (selectedByDay) {
    for (const { key } of WEEKDAY_COLUMNS) {
      for (const hour of selectedByDay[key] ?? []) {
        minHour = Math.min(minHour, hour);
        maxHour = Math.max(maxHour, hour);
      }
    }
  }

  const hours = [];
  for (let hour = minHour; hour <= maxHour; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

export function emptySelectionByDay() {
  return Object.fromEntries(WEEKDAY_COLUMNS.map(({ key }) => [key, []]));
}

export function selectionByDayFromEntry(entry) {
  const next = emptySelectionByDay();
  if (!entry) return next;
  next[entry.weekday] = entryToHours(entry);
  return next;
}

export function toggleSelectionHour(selectedByDay, weekday, hour) {
  const current = [...(selectedByDay[weekday] ?? [])];
  const index = current.indexOf(hour);
  if (index >= 0) current.splice(index, 1);
  else current.push(hour);
  return {
    ...selectedByDay,
    [weekday]: current.sort((a, b) => a - b),
  };
}

export function toggleSelectionWeekday(selectedByDay, weekday, visibleHours) {
  const current = selectedByDay[weekday] ?? [];
  const allSelected =
    visibleHours.length > 0 &&
    visibleHours.every((hour) => current.includes(hour));
  return {
    ...selectedByDay,
    [weekday]: allSelected ? [] : [...visibleHours],
  };
}

export function hasSelection(selectedByDay) {
  return WEEKDAY_COLUMNS.some(({ key }) => (selectedByDay[key] ?? []).length > 0);
}

export function selectionToEntries(name, selectedByDay) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return [];

  const entries = [];
  for (const { key } of WEEKDAY_COLUMNS) {
    const hours = [...(selectedByDay[key] ?? [])].sort((a, b) => a - b);
    if (hours.length === 0) continue;

    let start = hours[0];
    let prev = hours[0];
    for (let index = 1; index < hours.length; index += 1) {
      const hour = hours[index];
      if (hour === prev + 1) {
        prev = hour;
        continue;
      }
      entries.push({
        weekday: key,
        name: trimmed,
        startHour: start,
        endHour: prev,
      });
      start = hour;
      prev = hour;
    }
    entries.push({
      weekday: key,
      name: trimmed,
      startHour: start,
      endHour: prev,
    });
  }
  return entries;
}

export function formatSelectionSummary(selectedByDay) {
  const parts = [];
  for (const { key, label } of WEEKDAY_COLUMNS) {
    const hours = selectedByDay[key] ?? [];
    if (hours.length === 0) continue;

    let start = hours[0];
    let prev = hours[0];
    const ranges = [];
    for (let index = 1; index < hours.length; index += 1) {
      const hour = hours[index];
      if (hour === prev + 1) {
        prev = hour;
        continue;
      }
      ranges.push(formatHourRange(start, prev));
      start = hour;
      prev = hour;
    }
    ranges.push(formatHourRange(start, prev));
    parts.push(`${label} ${ranges.join(", ")}`);
  }
  return parts.join(" · ");
}

export function getWeekdayLabel(weekdayKey) {
  return WEEKDAY_LABEL_BY_KEY[weekdayKey] ?? "";
}

export function getWeekdayKeyFromDateKey(dateKey) {
  if (!dateKey) return null;
  const date = parseDateKey(dateKey);
  return JS_DAY_TO_KEY[date.getDay()] ?? null;
}

export function getEntriesForWeekday(entries, weekdayKey) {
  return normalizeWeeklyEntries(entries).filter(
    (entry) => entry.weekday === weekdayKey,
  );
}

export function getWeeklyEntriesForDateKey(timetable, dateKey) {
  if (!timetable || !dateKey) return [];
  const weekdayKey = getWeekdayKeyFromDateKey(dateKey);
  if (!weekdayKey) return [];
  return getEntriesForWeekday(timetable.entries ?? [], weekdayKey);
}

export function hasWeeklyTimetableForDateKey(timetable, dateKey) {
  return getWeeklyEntriesForDateKey(timetable, dateKey).length > 0;
}

export function getWeeklyHoursForDateKey(timetable, dateKey) {
  const dayEntries = getWeeklyEntriesForDateKey(timetable, dateKey);
  return mergeHourLists(...dayEntries.map(entryToHours));
}

export function buildHourLabelsFromEntries(entries) {
  const labels = {};
  for (const entry of entries ?? []) {
    for (let hour = 0; hour <= 23; hour += 1) {
      if (!slotOverlapsHour(entry, hour)) continue;
      const name = String(entry.name ?? "").trim();
      if (!name) continue;
      labels[hour] = labels[hour] ? `${labels[hour]}, ${name}` : name;
    }
  }
  return labels;
}

export function mergeHourLabels(existing = {}, incoming = {}) {
  const next = { ...existing };
  for (const [hourKey, label] of Object.entries(incoming)) {
    const hour = Number(hourKey);
    const name = String(label ?? "").trim();
    if (!name || Number.isNaN(hour)) continue;
    next[hour] = next[hour] ? `${next[hour]}, ${name}` : name;
  }
  return next;
}

export function mergeHourLists(...lists) {
  const set = new Set();
  for (const list of lists) {
    for (const hour of list ?? []) {
      set.add(Number(hour));
    }
  }
  return [...set].sort((a, b) => a - b);
}

export function toggleWeekdayDraftSlots(slots, weekday, visibleHours) {
  const hasAllHours =
    visibleHours.length > 0 &&
    visibleHours.every((hour) =>
      slots.some(
        (slot) => slot.weekday === weekday && slotOverlapsHour(slot, hour),
      ),
    );
  if (hasAllHours) {
    return slots.filter((slot) => slot.weekday !== weekday);
  }
  const kept = slots.filter((slot) => slot.weekday !== weekday);
  return [...kept, ...draftSlotsFromHours(weekday, visibleHours)];
}

export function createDraftSlotId() {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createHourDraftSlot(weekday, hour) {
  return createRangeDraftSlot(weekday, hour, hour);
}

function createRangeDraftSlot(weekday, startHour, endHourInclusive) {
  if (endHourInclusive >= 23) {
    return {
      id: createDraftSlotId(),
      weekday,
      startHour,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
    };
  }

  return {
    id: createDraftSlotId(),
    weekday,
    startHour,
    startMinute: 0,
    endHour: endHourInclusive + 1,
    endMinute: 0,
  };
}

function getDraftSlotHours(slots, weekday) {
  const hours = new Set();
  for (const slot of slots) {
    if (slot.weekday !== weekday) continue;
    for (let hour = 0; hour <= 23; hour += 1) {
      if (slotOverlapsHour(slot, hour)) {
        hours.add(hour);
      }
    }
  }
  return [...hours].sort((a, b) => a - b);
}

function draftSlotsFromHours(weekday, hours) {
  const sorted = [...hours].sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const slots = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const hour = sorted[index];
    if (hour === prev + 1) {
      prev = hour;
      continue;
    }
    slots.push(createRangeDraftSlot(weekday, start, prev));
    start = hour;
    prev = hour;
  }

  slots.push(createRangeDraftSlot(weekday, start, prev));
  return slots;
}

export function createTimedDraftSlot(weekday, startHour, startMinute, endHour, endMinute) {
  return {
    id: createDraftSlotId(),
    weekday,
    startHour,
    startMinute: normalizeMinute(startMinute, 0),
    endHour,
    endMinute: normalizeMinute(endMinute, 0),
  };
}

export function validateDraftSlotRange(
  startHour,
  startMinute,
  endHour,
  endMinute,
) {
  const startTotal = timeToMinutes(startHour, startMinute);
  const endTotal = timeToMinutes(endHour, endMinute);
  if (endTotal <= startTotal) {
    return "종료 시간은 시작 시간보다 뒤여야 합니다.";
  }
  return null;
}

export function entryToDraftSlot(entry) {
  return {
    id: entry._id ?? createDraftSlotId(),
    weekday: entry.weekday,
    startHour: entry.startHour,
    startMinute: entry.startMinute ?? 0,
    endHour: entry.endHour,
    endMinute: entry.endMinute ?? 0,
  };
}

export function slotOverlapsHour(slot, hour) {
  const start = timeToMinutes(slot.startHour, slot.startMinute ?? 0);
  const end = timeToMinutes(slot.endHour, slot.endMinute ?? 0);
  const hourStart = hour * 60;
  const hourEnd = hour * 60 + 59;
  return start <= hourEnd && end > hourStart;
}

export function hourHasEntry(entries, hour) {
  return (entries ?? []).some((entry) => slotOverlapsHour(entry, hour));
}

export function toggleHourDraftSlot(slots, weekday, hour) {
  const selectedHours = getDraftSlotHours(slots, weekday);
  const nextHours = selectedHours.includes(hour)
    ? selectedHours.filter((value) => value !== hour)
    : [...selectedHours, hour].sort((a, b) => a - b);

  const otherSlots = slots.filter((slot) => slot.weekday !== weekday);
  return [...otherSlots, ...draftSlotsFromHours(weekday, nextHours)];
}

export function draftSlotsToEntries(name, slots) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed || !Array.isArray(slots) || slots.length === 0) return [];

  const sorted = [...slots].sort((left, right) => {
    if (left.weekday !== right.weekday) {
      return (
        WEEKDAY_COLUMNS.findIndex((item) => item.key === left.weekday) -
        WEEKDAY_COLUMNS.findIndex((item) => item.key === right.weekday)
      );
    }
    return (
      timeToMinutes(left.startHour, left.startMinute) -
      timeToMinutes(right.startHour, right.startMinute)
    );
  });

  const entries = [];
  for (const slot of sorted) {
    const next = {
      weekday: slot.weekday,
      name: trimmed,
      startHour: slot.startHour,
      startMinute: slot.startMinute ?? 0,
      endHour: slot.endHour,
      endMinute: slot.endMinute ?? 0,
    };
    const last = entries[entries.length - 1];
    if (
      last &&
      last.weekday === next.weekday &&
      timeToMinutes(last.endHour, last.endMinute) + MINUTE_STEP >=
        timeToMinutes(next.startHour, next.startMinute)
    ) {
      if (
        timeToMinutes(next.endHour, next.endMinute) >
        timeToMinutes(last.endHour, last.endMinute)
      ) {
        last.endHour = next.endHour;
        last.endMinute = next.endMinute;
      }
      continue;
    }
    entries.push(next);
  }
  return entries;
}

export function getDraftSlotsGridHours(slots, entries = []) {
  return getWeeklyGridHours(entries, draftSlotsToSelectionByDay(slots));
}

function draftSlotsToSelectionByDay(slots) {
  const selectedByDay = emptySelectionByDay();
  for (const slot of slots ?? []) {
    for (let hour = 0; hour <= 23; hour += 1) {
      if (slotOverlapsHour(slot, hour)) {
        if (!selectedByDay[slot.weekday].includes(hour)) {
          selectedByDay[slot.weekday].push(hour);
        }
      }
    }
  }
  for (const key of WEEKDAY_COLUMNS.map(({ key: weekdayKey }) => weekdayKey)) {
    selectedByDay[key].sort((a, b) => a - b);
  }
  return selectedByDay;
}

export function formatDraftSlotLabel(slot) {
  const weekdayLabel = getWeekdayLabel(slot.weekday);
  return `${weekdayLabel} ${formatEntryTimeRange(slot)}`;
}

export function getEntryGridRow(entry, visibleHours) {
  const overlapHours = entryToHours(entry).filter((hour) =>
    visibleHours.includes(hour),
  );
  if (overlapHours.length === 0) return null;

  const startIndex = visibleHours.indexOf(overlapHours[0]);
  const endIndex = visibleHours.indexOf(
    overlapHours[overlapHours.length - 1],
  );
  if (startIndex < 0 || endIndex < 0) return null;
  return `${startIndex + 1} / ${endIndex + 2}`;
}

export function getEntryBlockLayout(entry, visibleHours, rowHeight, rowGap) {
  const overlapHours = entryToHours(entry).filter((hour) =>
    visibleHours.includes(hour),
  );
  if (overlapHours.length === 0) return null;

  const startIndex = visibleHours.indexOf(overlapHours[0]);
  const endIndex = visibleHours.indexOf(
    overlapHours[overlapHours.length - 1],
  );
  if (startIndex < 0 || endIndex < 0) return null;

  const rowSpan = endIndex - startIndex + 1;
  const top = startIndex * (rowHeight + rowGap);
  const height = rowSpan * rowHeight + (rowSpan - 1) * rowGap;
  return { top, height };
}

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);
