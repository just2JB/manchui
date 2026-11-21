import apiClient from "./apiClient";

/* 팀 */
export async function fetchLightingTeams() {
  const res = await apiClient.get("/api/lighting/teams");
  return Array.isArray(res.data?.teams) ? res.data.teams : [];
}

export async function createLightingTeam(fields) {
  const res = await apiClient.post("/api/lighting/teams", fields);
  return res.data?.team ?? null;
}

/** { team, rows } */
export async function fetchLightingTeam(teamId) {
  const res = await apiClient.get(`/api/lighting/teams/${teamId}`);
  return {
    team: res.data?.team ?? null,
    rows: Array.isArray(res.data?.rows) ? res.data.rows : [],
  };
}

export async function updateLightingTeam(teamId, fields) {
  const res = await apiClient.put(`/api/lighting/teams/${teamId}`, fields);
  return res.data?.team ?? null;
}

export async function deleteLightingTeam(teamId) {
  await apiClient.delete(`/api/lighting/teams/${teamId}`);
}

/* 큐(줄) */
export async function createLightingRow(teamId, fields) {
  const res = await apiClient.post(`/api/lighting/teams/${teamId}/rows`, fields);
  return res.data?.row ?? null;
}

export async function updateLightingRow(rowId, fields) {
  const res = await apiClient.put(`/api/lighting/rows/${rowId}`, fields);
  return res.data?.row ?? null;
}

export async function deleteLightingRow(rowId) {
  await apiClient.delete(`/api/lighting/rows/${rowId}`);
}
