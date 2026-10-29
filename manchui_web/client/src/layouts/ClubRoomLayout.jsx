import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ClubRoomNavbar from "../pages/ClubRoom/ClubRoomNavbar";
import { ScrollToTopOnRoute } from "../components/ScrollToTopOnRoute/ScrollToTopOnRoute";
import Loading from "../components/Loading/Loading";
import PreparingPage from "./PreparingPage";
import { useAppSettings } from "../context/AppSettingsContext";

/** 공개 예약 공유 링크만 어시스턴트 비활성화 시에도 표시 */
function isReservationSharePath(pathname) {
  return /^\/club\/reservation\/share\/[^/]+$/.test(pathname);
}

/** 예약 페이지는 데스크톱에서 600px 열 대신 전체 폭 사용 */
function isReservationPagePath(pathname) {
  return /^\/club\/reservation\/?$/.test(pathname);
}

const ClubRoomLayout = () => {
  const location = useLocation();
  const {
    joinConfigLoading,
    joinConfigLoaded,
    siteRestricted,
    assistantEnabled,
    ensureJoinConfigLoaded,
  } = useAppSettings();
  const shareOnly = isReservationSharePath(location.pathname);
  const wideBody = isReservationPagePath(location.pathname);
  const hideBottomNav = location.pathname === "/club/login";

  useEffect(() => {
    if (!shareOnly) {
      void ensureJoinConfigLoaded();
    }
  }, [shareOnly, ensureJoinConfigLoaded]);

  /** 모바일: 하단 탭 / PC(1024px+): 왼쪽 사이드바 */
  const showNav = assistantEnabled && !hideBottomNav;

  if (joinConfigLoading && !shareOnly) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <Loading overlay={false} size="sm" />
      </div>
    );
  }

  if (joinConfigLoaded && siteRestricted) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="siteRestricted" />
      </div>
    );
  }

  if (joinConfigLoaded && assistantEnabled === false && !shareOnly) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="assistantDisabled" />
      </div>
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <div
        className={
          showNav ? "clubRoomLayout clubRoomLayout--withNav" : "clubRoomLayout"
        }
      >
        {showNav ? <ClubRoomNavbar /> : null}
        <div
          className={[
            "clubRoombody",
            hideBottomNav && "clubRoombody--noBottomNav",
            wideBody && "clubRoombody--wide",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default ClubRoomLayout;
