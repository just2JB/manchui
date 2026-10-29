import apiClient from "./apiClient";

export async function fetchMyWeeklyTimetables() {
  const res = await apiClient.get("/api/weekly-timetable/mine", {
    withCredentials: true,
  });
  return {
    timetables: Array.isArray(res.data?.timetables) ? res.data.timetables : [],
    activeTimetable: res.data?.activeTimetable ?? null,
  };
}

export async function createWeeklyTimetable(name, { activate = true } = {}) {
  const res = await apiClient.post(
    "/api/weekly-timetable",
    { name, activate },
    { withCredentials: true },
  );
  return res.data;
}

export async function updateWeeklyTimetable(id, payload) {
  const res = await apiClient.put(`/api/weekly-timetable/${id}`, payload, {
    withCredentials: true,
  });
  return res.data;
}

export async function activateWeeklyTimetable(id) {
  const res = await apiClient.patch(
    `/api/weekly-timetable/${id}/activate`,
    {},
    { withCredentials: true },
  );
  return res.data;
}

export async function deleteWeeklyTimetable(id) {
  const res = await apiClient.delete(`/api/weekly-timetable/${id}`, {
    withCredentials: true,
  });
  return res.data;
}
