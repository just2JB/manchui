import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 5 * 60_000;

/** Refresh visible pages on focus and periodically while they remain open. */
export function useRefreshOnFocus(refresh) {
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
