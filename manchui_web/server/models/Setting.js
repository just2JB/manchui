const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  joinForm: {
    type: Number,
    default: 0, // 0: 닫힘, 1: 열림
  },
  currentGeneration: {
    type: Number,
    default: 1,
  },
  /** true면 가입(/join) 외 페이지는 "현재 준비중입니다" 표시 */
  siteRestricted: {
    type: Boolean,
    default: false,
  },
  /** false면 메인 네비에서 로그인·동아리방(어시스턴트)·마이페이지 비활성화, /club 접근 제한 */
  assistantEnabled: {
    type: Boolean,
    default: true,
  },
  /** 회장 정보 */
  president: {
    name: { type: String, default: "" },
    contact: { type: String, default: "" },
    major: { type: String, default: "" },
  },
  /** 동아리방 일반 예약: 계정당 기본 최대 건수 (개별 설정 없을 때) */
  defaultReservationLimitPerUser: {
    type: Number,
    default: 3,
    min: 0,
    max: 99,
  },
  /** 관리자 화면에서 맨 위에 고정해 둔 팀 (임원진 공용) */
  pinnedTeamIds: {
    type: [String],
    default: [],
  },
  /** 동아리방 이용 수칙 (한 줄에 하나). 비어 있으면 화면 기본 문구 */
  clubRoomRules: {
    type: [String],
    default: [],
  },
  /** 연습 장소별 시간당 요금(원) — 관리자 연습 장소 기록·결산용 */
  placeRates: {
    type: [
      {
        _id: false,
        place: { type: String, required: true },
        hourlyRate: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  },
});

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
