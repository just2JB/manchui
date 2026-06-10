import apiClient from "./apiClient";

/** GET /api/schedule/mine */
export async function fetchMySchedules() {
  const res = await apiClient.get("/api/schedule/mine", {
    withCredentials: true,
  });
  return Array.isArray(res.data?.userSchedules) ? res.data.userSchedules : [];
}

/** GET /api/schedule/request/mine */
export async function fetchMyScheduleRequests() {
  const res = await apiClient.get("/api/schedule/request/mine", {
    withCredentials: true,
  });
  return Array.isArray(res.data?.myTeam) ? res.data.myTeam : [];
}

/**
 * POST /api/schedule/mine
 * @returns {Promise<{ schedule: object | null }>}
 */
export async function saveMySchedule({ date, times, category }) {
  const res = await apiClient.post(
    "/api/schedule/mine",
    { date, times, category },
    { withCredentials: true },
  );
  return {
    schedule: res.data?.schedule ?? null,
    message: res.data?.message,
  };
}
