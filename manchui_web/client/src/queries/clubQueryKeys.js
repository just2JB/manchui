export const clubKeys = {
  all: ["club"],
  teams: (userId) => [...clubKeys.all, "teams", userId],
  practices: (userId, teamIdsKey = "") => [
    ...clubKeys.all,
    "practices",
    userId,
    teamIdsKey,
  ],
  schedules: (userId) => [...clubKeys.all, "schedules", userId],
  scheduleRequests: (userId) => [...clubKeys.all, "scheduleRequests", userId],
  reservationsAll: () => [...clubKeys.all, "reservations", "all"],
  reservationsMine: (userId) => [...clubKeys.all, "reservations", "mine", userId],
  recommendations: (sort, q) => [
    ...clubKeys.all,
    "recommendations",
    { sort, q },
  ],
};

export function teamIdsKey(teams) {
  if (!Array.isArray(teams) || teams.length === 0) return "";
  return teams
    .map((t) => String(t._id))
    .sort()
    .join(",");
}
