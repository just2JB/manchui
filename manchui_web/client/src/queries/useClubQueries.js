import { useCallback } from "react";
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
  fetchPracticesForTeams,
  fetchRecommendationsPage,
  fetchUserTeams,
} from "./clubFetchers";
import { clubKeys, teamIdsKey } from "./clubQueryKeys";
import { fetchMyOpenPolls } from "../api/pollApi";
const RECOMMEND_PAGE_SIZE = 16;

export function useInvalidateClubReservations(userId) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: clubKeys.reservationsAll(),
    });
    if (userId) {
      void queryClient.invalidateQueries({
        queryKey: clubKeys.reservationsMine(userId),
      });
    }
  }, [queryClient, userId]);
}

export function useInvalidateClubHome(userId) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: clubKeys.teams(userId) });
    void queryClient.invalidateQueries({
      queryKey: [...clubKeys.all, "practices", userId],
    });
    void queryClient.invalidateQueries({
      queryKey: clubKeys.openPolls(userId),
    });
    void queryClient.invalidateQueries({
      queryKey: clubKeys.reservationsMine(userId),
    });
  }, [queryClient, userId]);
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

export function useMyOpenPollsQuery(userId) {
  return useQuery({
    queryKey: clubKeys.openPolls(userId),
    queryFn: fetchMyOpenPolls,
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

export function useReservationMutations() {
  const queryClient = useQueryClient();

  /** 전체·내 예약 모두 갱신 */
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: [...clubKeys.all, "reservations"],
    });
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
