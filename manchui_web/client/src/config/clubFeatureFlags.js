/**
 * 예약 기능만 우선 배포할 때 true.
 * 홈·팀·곡 추천 진입을 막고 예약 페이지로 보냅니다.
 */
export const CLUB_RESERVATION_ONLY_DEPLOY = true;

export const CLUB_RESERVATION_HOME = "/club/reservation";

export const CLUB_UNDER_DEVELOPMENT_MESSAGE = "개발 중인 기능입니다.";

/** 임시 배포 중 접근 불가 경로 */
export function isClubPathBlockedForReservationDeploy(pathname) {
  if (!CLUB_RESERVATION_ONLY_DEPLOY) return false;
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/club") return true;
  if (p.startsWith("/club/team")) return true;
  if (p.startsWith("/club/recommend")) return true;
  return false;
}

/** 로그인 후·직접 URL 등 허용 경로로 정규화 */
export function resolveClubAllowedPath(pathname) {
  if (isClubPathBlockedForReservationDeploy(pathname)) {
    return CLUB_RESERVATION_HOME;
  }
  return pathname;
}
