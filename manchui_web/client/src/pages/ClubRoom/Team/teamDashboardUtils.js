import { buildMemberSchedulesForDate } from "./practiceAvailabilityUtils";
import {
  formatDateKey,
  formatUpcomingPracticeDate,
  normalizeDateKey,
} from "./teamCalendarUtils";
import { getMemberDisplayName } from "./teamUtils";

export function buildScheduleRequestStatuses(
  requestSchedules,
  members,
  memberSchedules,
  { now = new Date() } = {},
) {
  const memberList = (Array.isArray(members) ? members : []).map((member) => ({
    id: String(member?._id ?? member),
    name: getMemberDisplayName(member),
  }));

  const todayKey = formatDateKey(now);
  const dates = [
    ...new Set(
      (Array.isArray(requestSchedules) ? requestSchedules : [])
        .map((raw) => normalizeDateKey(raw))
        .filter(Boolean)
        .filter((dateKey) => dateKey >= todayKey),
    ),
  ].sort();

  return dates.map((dateKey) => {
    const schedulesByUser = buildMemberSchedulesForDate(
      memberSchedules,
      dateKey,
    );
    const responded = memberList.filter((member) =>
      schedulesByUser.has(member.id),
    );
    const pending = memberList.filter(
      (member) => !schedulesByUser.has(member.id),
    );

    return {
      dateKey,
      dateLabel: formatUpcomingPracticeDate(dateKey),
      total: memberList.length,
      respondedCount: responded.length,
      responded,
      pending,
      complete: memberList.length > 0 && pending.length === 0,
    };
  });
}
