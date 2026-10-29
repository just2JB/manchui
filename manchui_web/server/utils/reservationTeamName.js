/** 동아리방 예약에 적는 팀 이름 (표시용) */
const TEAM_NAME_MAX_LENGTH = 20;

/** 앞뒤 공백 제거, 연속 공백 1칸 */
function normalizeTeamName(raw) {
  if (raw === null || raw === undefined) return "";
  return String(raw).trim().replace(/\s+/g, " ");
}

/** @returns {{ ok: true, name: string } | { ok: false, message: string }} */
function validateTeamName(raw) {
  const name = normalizeTeamName(raw);
  if (!name) return { ok: false, message: "팀 이름을 입력해 주세요." };
  if (name.length > TEAM_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `팀 이름은 ${TEAM_NAME_MAX_LENGTH}자 이내로 입력해 주세요.`,
    };
  }
  return { ok: true, name };
}

module.exports = {
  TEAM_NAME_MAX_LENGTH,
  normalizeTeamName,
  validateTeamName,
};
