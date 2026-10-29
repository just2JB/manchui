import { QueryClient } from "@tanstack/react-query";

/** 탭 전환 시 캐시를 즉시 보여주고, 이 시간 이후 포커스/재진입 시 백그라운드 갱신 */
export const CLUB_STALE_TIME_MS = 60_000;

/** 언마운트된 탭 데이터 유지 시간 */
export const CLUB_GC_TIME_MS = 30 * 60_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CLUB_STALE_TIME_MS,
      gcTime: CLUB_GC_TIME_MS,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
