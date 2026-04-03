import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * pathname/hash 변경 후 페인트 전에 스크롤 정렬.
 * 메인 /#session은 MainPage가 처리하므로 건너뜀.
 * (링크 onClick에서 scrollTo 하면 이전 화면이 위로 튀어 보임)
 */
export function ScrollToTopOnRoute() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (location.pathname === "/" && location.hash === "#session") {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);

  return null;
}
