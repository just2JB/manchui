import { useEffect, useState } from "react";

const NOW_TICK_MS = 60_000;
const REFRESH_INTERVAL_MS = 5 * 60_000;

/** 분 단위로 now 갱신 — 종료·만료 시각 UI 반영 */
export function useReservationNow(tickMs = NOW_TICK_MS) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const bump = () => setNow(new Date());
    const id = window.setInterval(bump, tickMs);
    const onVis = () => {
      if (document.visibilityState === "visible") bump();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [tickMs]);

  return now;
}

/** 탭 복귀·주기적으로 서버 재조회 (만료 예약 purge 반영) */
export function useReservationRefreshOnFocus(refresh) {
  useEffect(() => {
    if (!refresh) return undefined;

    const run = () => {
      if (document.visibilityState === "visible") void refresh();
    };

    document.addEventListener("visibilitychange", run);
    window.addEventListener("focus", run);
    const id = window.setInterval(run, REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("focus", run);
      window.clearInterval(id);
    };
  }, [refresh]);
}
