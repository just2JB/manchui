const Schedule = require("../models/Schedule");
const Practice = require("../models/Practice");
const { normalizeScheduleDate } = require("./scheduleDate");

const SLOT_COUNT = 48;

function cloneTimes(times) {
  const base = Array.isArray(times) ? times.map((value) => Number(value) || 0) : [];
  while (base.length < SLOT_COUNT) base.push(0);
  return base.slice(0, SLOT_COUNT);
}

/** "14:00–16:00" → [14, 15] */
function parsePracticeTimeHours(timeStr) {
  const raw = String(timeStr ?? "").trim();
  const match = raw.match(/(\d{1,2}):(\d{2})\s*[-–~]\s*(\d{1,2}):(\d{2})/);
  if (!match) return [];

  const startHour = Number(match[1]);
  let endHourExclusive = Number(match[3]);
  if (Number.isNaN(startHour) || Number.isNaN(endHourExclusive)) return [];
  if (endHourExclusive === 0) endHourExclusive = 24;
  if (endHourExclusive <= startHour) return [];

  const hours = [];
  for (let hour = startHour; hour < endHourExclusive; hour += 1) {
    hours.push(hour);
  }
  return hours;
}

function getMemberPracticeHours(practice, memberId) {
  const memberKey = String(memberId);
  const hours = new Set();

  for (const slot of practice.memberByHour ?? []) {
    const slotMembers = Array.isArray(slot?.members)
      ? slot.members.map(String)
      : [];
    if (!slotMembers.includes(memberKey)) continue;
    const hour = Number(slot.hour);
    if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
      hours.add(hour);
    }
  }

  if (hours.size > 0) {
    return [...hours].sort((a, b) => a - b);
  }

  return parsePracticeTimeHours(practice.time);
}

async function findUserScheduleForDate(userId, date) {
  const normalizedDate = normalizeScheduleDate(date);
  if (!normalizedDate) return null;

  const schedules = await Schedule.find({ userId: String(userId) });
  return (
    schedules.find(
      (schedule) =>
        schedule.category !== "temp" &&
        normalizeScheduleDate(schedule.date) === normalizedDate,
    ) ?? null
  );
}

function clearHoursInTimes(times, hours) {
  const next = cloneTimes(times);
  let changed = false;

  for (const hour of hours) {
    if (hour < 0 || hour > 23) continue;
    const index = hour * 2;
    if (next[index] || next[index + 1]) changed = true;
    next[index] = 0;
    next[index + 1] = 0;
  }

  return { times: next, changed };
}

function restoreHoursInTimes(times, timesBefore, hours) {
  const next = cloneTimes(times);
  const before = cloneTimes(timesBefore);

  for (const hour of hours) {
    if (hour < 0 || hour > 23) continue;
    const index = hour * 2;
    next[index] = before[index];
    next[index + 1] = before[index + 1];
  }

  return next;
}

async function rollbackAppliedHolds(applied) {
  for (const item of applied) {
    const schedule = await Schedule.findById(item.scheduleId);
    if (!schedule) continue;
    schedule.times = cloneTimes(item.timesBefore);
    await schedule.save();
  }
}

async function getHoursStillBlockedByOtherPractices(
  userId,
  date,
  excludePracticeId,
  candidateHours,
) {
  const normalizedDate = normalizeScheduleDate(date);
  if (!normalizedDate) return new Set();

  const practices = await Practice.find({
    members: String(userId),
    _id: { $ne: excludePracticeId },
  });

  const blocked = new Set();
  for (const practice of practices) {
    if (normalizeScheduleDate(practice.date) !== normalizedDate) continue;
    for (const hour of getMemberPracticeHours(practice, userId)) {
      if (candidateHours.includes(hour)) blocked.add(hour);
    }
  }

  return blocked;
}

/**
 * 연습에 포함된 멤버의 해당 시간대 가능 일정을 임시 제거하고,
 * practice.scheduleHoldbacks 에 복구용 스냅샷을 기록합니다.
 */
async function applyScheduleHoldbacks(practice) {
  const normalizedDate = normalizeScheduleDate(practice.date);
  if (!normalizedDate) {
    practice.scheduleHoldbacks = [];
    return;
  }

  const applied = [];
  const holdbacks = [];

  try {
    for (const memberId of practice.members ?? []) {
      const hours = getMemberPracticeHours(practice, memberId);
      if (hours.length === 0) continue;

      const schedule = await findUserScheduleForDate(memberId, normalizedDate);
      if (!schedule) continue;

      const timesBefore = cloneTimes(schedule.times);
      const { times, changed } = clearHoursInTimes(timesBefore, hours);
      if (!changed) continue;

      schedule.times = times;
      await schedule.save();

      applied.push({
        scheduleId: schedule._id,
        timesBefore,
      });

      holdbacks.push({
        userId: String(memberId),
        date: normalizedDate,
        hours,
        timesBefore,
      });
    }

    practice.scheduleHoldbacks = holdbacks;
  } catch (error) {
    await rollbackAppliedHolds(applied);
    throw error;
  }
}

/** 연습 삭제 시 홀드했던 일정 시간대를 복구합니다. */
async function releaseScheduleHoldbacks(practice) {
  const practiceId = practice?._id;
  if (!practiceId) return;

  for (const hold of practice.scheduleHoldbacks ?? []) {
    const { userId, date, hours, timesBefore } = hold;
    if (!userId || !Array.isArray(hours) || hours.length === 0) continue;

    const stillBlocked = await getHoursStillBlockedByOtherPractices(
      userId,
      date,
      practiceId,
      hours,
    );
    const hoursToRestore = hours.filter((hour) => !stillBlocked.has(hour));
    if (hoursToRestore.length === 0) continue;

    const schedule = await findUserScheduleForDate(userId, date);
    if (!schedule) continue;

    schedule.times = restoreHoursInTimes(
      schedule.times,
      timesBefore,
      hoursToRestore,
    );
    await schedule.save();
  }
}

/** 여러 연습 삭제 전 각 연습의 홀드 일정을 복구합니다. */
async function releaseScheduleHoldbacksForPractices(practices) {
  for (const practice of practices) {
    await releaseScheduleHoldbacks(practice);
  }
}

module.exports = {
  parsePracticeTimeHours,
  getMemberPracticeHours,
  applyScheduleHoldbacks,
  releaseScheduleHoldbacks,
  releaseScheduleHoldbacksForPractices,
};
