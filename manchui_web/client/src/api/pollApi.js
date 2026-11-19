import apiClient from "./apiClient";

/** POST /api/poll — 팀장: 일정 투표 만들기 */
export async function createPoll({ teamId, title, dates, startHour, endHour }) {
  const res = await apiClient.post("/api/poll", {
    teamId,
    title,
    dates,
    startHour,
    endHour,
  });
  return res.data?.poll ?? null;
}

/** GET /api/poll/team/:teamId */
export async function fetchTeamPolls(teamId) {
  const res = await apiClient.get(`/api/poll/team/${teamId}`);
  return Array.isArray(res.data?.polls) ? res.data.polls : [];
}

/** GET /api/poll/mine/open — 내 팀의 진행 중 투표 */
export async function fetchMyOpenPolls() {
  const res = await apiClient.get("/api/poll/mine/open");
  return Array.isArray(res.data?.polls) ? res.data.polls : [];
}

/** GET /api/poll/:pollId — 공개 */
export async function fetchPoll(pollId) {
  const res = await apiClient.get(`/api/poll/${pollId}`);
  return {
    poll: res.data?.poll ?? null,
    viewer: res.data?.viewer ?? {},
    teamMembers: Array.isArray(res.data?.teamMembers) ? res.data.teamMembers : [],
  };
}

/** POST /api/poll/:pollId/guest — 이름·비밀번호로 입장 (없으면 생성) */
export async function enterPollAsGuest(pollId, { name, password }) {
  const res = await apiClient.post(`/api/poll/${pollId}/guest`, {
    name,
    password,
  });
  return res.data?.response ?? null;
}

/**
 * PUT /api/poll/:pollId/response
 * guest 가 있으면 게스트로, 없으면 로그인 계정으로 저장
 */
export async function savePollResponse(pollId, { availability, guest = null }) {
  const res = await apiClient.put(`/api/poll/${pollId}/response`, {
    availability,
    ...(guest ? { guest } : {}),
  });
  return {
    response: res.data?.response ?? null,
    joinedTeam: Boolean(res.data?.joinedTeam),
  };
}

export async function updatePoll(pollId, patch) {
  const res = await apiClient.patch(`/api/poll/${pollId}`, patch);
  return res.data?.poll ?? null;
}

export async function deletePoll(pollId) {
  await apiClient.delete(`/api/poll/${pollId}`);
}

export async function deletePollResponse(pollId, responseId) {
  const res = await apiClient.delete(
    `/api/poll/${pollId}/response/${responseId}`,
  );
  return res.data?.poll ?? null;
}
