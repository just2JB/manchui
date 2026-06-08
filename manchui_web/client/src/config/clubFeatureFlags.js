/**
 * 예약 기능만 우선 배포할 때 true.
 * 홈·팀 등 미완 기능 진입을 막고 예약 페이지로 보냅니다.
 */
export const CLUB_RESERVATION_ONLY_DEPLOY = true;

/** 예약-only 모드에서도 접근 허용할 경로 prefix */
const CLUB_RESERVATION_ONLY_ALLOWED_PREFIXES = ["/club/recommend"];

export const CLUB_RESERVATION_HOME = "/club/reservation";

export const CLUB_UNDER_DEVELOPMENT_MESSAGE = "개발 중인 기능입니다.";

function isClubPathAllowedDuringReservationDeploy(pathname) {
  const p = pathname.replace(/\/+$/, "") || "/";
  return CLUB_RESERVATION_ONLY_ALLOWED_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

/** 임시 배포 중 접근 불가 경로 */
export function isClubPathBlockedForReservationDeploy(pathname) {
  if (!CLUB_RESERVATION_ONLY_DEPLOY) return false;
  if (isClubPathAllowedDuringReservationDeploy(pathname)) return false;
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
