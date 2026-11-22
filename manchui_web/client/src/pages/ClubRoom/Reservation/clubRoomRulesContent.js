import { useEffect } from "react";
import { useAppSettings } from "../../../context/AppSettingsContext";

/** 동아리방 이용 수칙 기본 문구 — 관리자 웹 설정에서 바꾸지 않았을 때 */
export const CLUB_ROOM_RULES_ITEMS = [
  "사용 후 쓰레기 수거, 정리·청소, 전기·조명·냉난방 등을 확인해 주세요.",
  "시설과 비품을 소중히 다루고, 문제가 있으면 동아리 임원진에게 알려 주세요.",
];

/** 관리자 웹 설정에 저장된 수칙 (없으면 기본 문구) */
export function useClubRoomRules() {
  const { joinConfig, ensureJoinConfigLoaded } = useAppSettings();
  useEffect(() => {
    void ensureJoinConfigLoaded();
  }, [ensureJoinConfigLoaded]);
  const saved = joinConfig?.clubRoomRules;
  return Array.isArray(saved) && saved.length > 0 ? saved : CLUB_ROOM_RULES_ITEMS;
}
