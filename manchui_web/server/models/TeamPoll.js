const mongoose = require("mongoose");

/** 날짜별 가능 시간(정시 단위, startHour 이상 endHour 미만) */
const pollAvailabilitySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    hours: { type: [Number], default: [] },
  },
  { _id: false },
);

const pollResponseSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["user", "guest"], required: true },
    /** kind === "user" 일 때 만취 계정 _id */
    userId: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    /** 게스트 이름 중복 확인용 (소문자·공백 정리) */
    nameKey: { type: String, default: null },
    /** kind === "guest" 일 때 bcrypt 해시 (API 응답에는 절대 포함하지 않음) */
    passwordHash: { type: String, default: null },
    availability: { type: [pollAvailabilitySchema], default: [] },
  },
  { timestamps: true },
);

/**
 * 웬투밋 스타일 팀 일정 투표.
 * 팀장이 날짜·시간대를 정해 링크를 뿌리면, 만취 계정 또는 이름+비밀번호(게스트)로 응답한다.
 */
const teamPollSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, index: true },
    title: { type: String, default: "", trim: true },
    dates: { type: [String], default: [] },
    startHour: { type: Number, default: 10, min: 0, max: 23 },
    /** 미포함 (예: 24 → 23:00~24:00 칸까지) */
    endHour: { type: Number, default: 24, min: 1, max: 24 },
    createdBy: { type: String, default: null },
    closed: { type: Boolean, default: false },
    responses: { type: [pollResponseSchema], default: [] },
  },
  { timestamps: true },
);

const TeamPoll = mongoose.model("TeamPoll", teamPollSchema);
module.exports = TeamPoll;
