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
  const hideBottomNav = location.pathname === "/club/login";

  useEffect(() => {
    if (!shareOnly) {
      void ensureJoinConfigLoaded();
    }
  }, [shareOnly, ensureJoinConfigLoaded]);

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

  if (
    joinConfigLoaded &&
    assistantEnabled === false &&
    !isReservationSharePath(location.pathname)
  ) {
    return (
      <div className="clubRoomLayout preparingWrapper">
        <PreparingPage variant="club" reason="assistantDisabled" />
      </div>
    );
  }

  return (
    <>
      <ScrollToTopOnRoute />
      <div className="clubRoomLayout">
        {assistantEnabled && !hideBottomNav ? <ClubRoomNavbar /> : null}
        <div
          className={
            hideBottomNav
              ? "clubRoombody clubRoombody--noBottomNav"
              : "clubRoombody"
          }
        >
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default ClubRoomLayout;
