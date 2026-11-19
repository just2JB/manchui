import { useEffect, useState } from "react";

const NOW_TICK_MS = 60_000;

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
