import { useEffect, useCallback } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient, { serverUrl } from "../api/apiClient";
import { DEFAULT_RESERVATION_QUOTA } from "../pages/ClubRoom/Reservation/reservationMine";
import {
  fetchAllReservations,
  fetchMyReservations,
  fetchMyScheduleRequests,
  fetchMySchedules,
  fetchPracticesForTeams,
  fetchRecommendationsPage,
  fetchUserTeams,
} from "./clubFetchers";
import { clubKeys, teamIdsKey } from "./clubQueryKeys";

const RECOMMEND_PAGE_SIZE = 16;
const REFRESH_INTERVAL_MS = 5 * 60_000;

/** 탭 복귀·주기적 백그라운드 갱신 */
export function useClubQueryInvalidationOnFocus(invalidate) {
  useEffect(() => {
    if (!invalidate) return undefined;

    const run = () => {
      if (document.visibilityState === "visible") void invalidate();
    };

    document.addEventListener("visibilitychange", run);
    window.addEventListener("focus", run);
    const id = window.setInterval(run, REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("focus", run);
      window.clearInterval(id);
    };
  }, [invalidate]);
}

export function useInvalidateClubReservations(userId) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: clubKeys.reservationsAll(),
    });
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: clubKeys.reservationsMine(userId),
      });
    }
  };
}

export function useInvalidateClubHome(userId) {
  const queryClient = useQueryClient();
  return () => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: clubKeys.teams(userId) });
    void queryClient.invalidateQueries({
      queryKey: [...clubKeys.all, "practices", userId],
    });
    void queryClient.invalidateQueries({
      queryKey: clubKeys.schedules(userId),
    });
    void queryClient.invalidateQueries({
      queryKey: clubKeys.scheduleRequests(userId),
    });
    void queryClient.invalidateQueries({
      queryKey: clubKeys.reservationsMine(userId),
    });
  };
}

export function useInvalidateClubTeams(userId) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: clubKeys.teams(userId) });
    void queryClient.invalidateQueries({
      queryKey: [...clubKeys.all, "practices", userId],
    });
  }, [queryClient, userId]);
}

export function useInvalidateClubRecommendations() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [...clubKeys.all, "recommendations"],
    });
  }, [queryClient]);
}

export function useUserTeamsQuery(userId) {
  return useQuery({
    queryKey: clubKeys.teams(userId),
    queryFn: () => fetchUserTeams(userId),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export function usePracticesQuery(userId, teams) {
  const idsKey = teamIdsKey(teams);
  return useQuery({
    queryKey: clubKeys.practices(userId, idsKey),
    queryFn: () => fetchPracticesForTeams(teams),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export function useMySchedulesQuery(userId) {
  return useQuery({
    queryKey: clubKeys.schedules(userId),
    queryFn: fetchMySchedules,
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export function useMyScheduleRequestsQuery(userId) {
  return useQuery({
    queryKey: clubKeys.scheduleRequests(userId),
    queryFn: fetchMyScheduleRequests,
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}

export function useMyReservationsQuery(userId) {
  return useQuery({
    queryKey: clubKeys.reservationsMine(userId),
    queryFn: fetchMyReservations,
    enabled: Boolean(userId) && Boolean(serverUrl),
    placeholderData: keepPreviousData,
  });
}

export function useAllReservationsQuery() {
  return useQuery({
    queryKey: clubKeys.reservationsAll(),
    queryFn: fetchAllReservations,
    enabled: Boolean(serverUrl),
    placeholderData: keepPreviousData,
  });
}

export function useRecommendationsInfiniteQuery(sort, q) {
  return useInfiniteQuery({
    queryKey: clubKeys.recommendations(sort, q),
    queryFn: ({ pageParam }) =>
      fetchRecommendationsPage({
        sort,
        q,
        skip: pageParam,
        limit: RECOMMEND_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + RECOMMEND_PAGE_SIZE : undefined,
    enabled: Boolean(serverUrl),
    placeholderData: keepPreviousData,
  });
}

export function useReservationMutations(userId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: clubKeys.reservationsAll(),
    });
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: clubKeys.reservationsMine(userId),
      });
    }
  };

  const createReservation = useMutation({
    mutationFn: (payload) =>
      apiClient.post("/api/reservation/make", payload, {
        withCredentials: true,
      }),
    onSuccess: invalidate,
  });

  const deleteReservation = useMutation({
    mutationFn: (id) =>
      apiClient.delete(`/api/reservation/${id}`, { withCredentials: true }),
    onSuccess: invalidate,
  });

  return { createReservation, deleteReservation, invalidate };
}

/** 첫 로드만 true — 캐시가 있으면 스켈레톤 없이 이전 데이터 표시 */
export function isClubInitialLoading(query) {
  return query.isLoading;
}

export function emptyReservationsMine() {
  return { reservations: [], quota: { ...DEFAULT_RESERVATION_QUOTA } };
}
