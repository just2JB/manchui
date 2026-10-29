/**
 * 마지막으로 입력한 팀 이름을 기억해 다음 예약 때 미리 채움.
 * 저장소가 막힌 환경(사생활 보호 모드 등)에서도 예약은 동작하도록 try/catch.
 */
const LAST_TEAM_NAME_KEY = "manchui.reservation.lastTeamName";

export function readLastTeamName() {
  try {
    return window.localStorage.getItem(LAST_TEAM_NAME_KEY) || "";
  } catch {
    return "";
  }
}

export function writeLastTeamName(name) {
  try {
    window.localStorage.setItem(LAST_TEAM_NAME_KEY, name);
  } catch {
    /* ignore */
  }
}
