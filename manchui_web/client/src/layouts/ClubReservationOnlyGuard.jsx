import { Outlet, useLocation } from "react-router-dom";
import { isClubPathBlockedForReservationDeploy } from "../config/clubFeatureFlags";
import { ClubUnderDevelopmentRedirect } from "../pages/ClubRoom/ClubUnderDevelopmentRedirect";

/** 예약-only 배포: 홈·팀·추천 URL 직접 접근 시 모달 후 예약으로 리다이렉트 */
const ClubReservationOnlyGuard = () => {
  const { pathname } = useLocation();

  if (isClubPathBlockedForReservationDeploy(pathname)) {
    return <ClubUnderDevelopmentRedirect />;
  }

  return <Outlet />;
};

export default ClubReservationOnlyGuard;
