import apiClient, { serverUrl } from "../api/apiClient";
import {
  fetchMyScheduleRequests,
  fetchMySchedules,
} from "../api/scheduleApi";
import { enrichPracticesWithTeam } from "../pages/ClubRoom/Home/clubHomeUtils";
import { parseMineResponse } from "../pages/ClubRoom/Reservation/reservationMine";

export async function fetchUserTeams(userId) {
  const res = await apiClient.get(`/api/team/user/${userId}`, {
    withCredentials: true,
  });
  return {
    teams: Array.isArray(res.data?.myTeam) ? res.data.myTeam : [],
    activeTeamIds: Array.isArray(res.data?.activeTeam)
      ? res.data.activeTeam.map(String)
      : [],
  };
}

export async function fetchPracticesForTeams(teams) {
  if (!Array.isArray(teams) || teams.length === 0) return [];

  const practiceResponses = await Promise.all(
    teams.map((team) =>
      apiClient
        .get(`/api/practice/teamPractice/${team._id}`, {
          withCredentials: true,
        })
        .then((res) => ({
          team,
          list: Array.isArray(res.data?.teamPractice)
            ? res.data.teamPractice
            : [],
        }))
        .catch(() => ({ team, list: [] })),
    ),
  );

  let practices = practiceResponses.flatMap(({ team, list }) =>
    list.map((practice) => ({
      ...practice,
      teamId: String(team._id),
      teamName: team.name,
      teamColor: team.teamColor,
    })),
  );
  return enrichPracticesWithTeam(practices, teams);
}

export async function fetchAllReservations() {
  if (!serverUrl) return [];
  const res = await apiClient.get("/api/reservation");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchMyReservations() {
  if (!serverUrl) {
    return { reservations: [], quota: parseMineResponse(null).quota };
  }
  const res = await apiClient.get("/api/reservation/mine", {
    withCredentials: true,
  });
  return parseMineResponse(res.data);
}

export async function fetchRecommendationsPage({
  sort,
  q,
  skip = 0,
  limit = 16,
}) {
  if (!serverUrl) {
    return { items: [], hasMore: false };
  }
  const p = new URLSearchParams();
  p.set("sort", sort);
  if (q) p.set("q", q);
  p.set("limit", String(limit));
  p.set("skip", String(skip));
  const res = await apiClient.get(`/api/recommendations?${p}`, {
    withCredentials: true,
  });
  return {
    items: Array.isArray(res.data?.items) ? res.data.items : [],
    hasMore: Boolean(res.data?.hasMore),
  };
}

export { fetchMySchedules, fetchMyScheduleRequests };
