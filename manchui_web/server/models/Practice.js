const mongoose = require("mongoose");

const practiceHourMemberSchema = new mongoose.Schema(
  {
    hour: { type: Number },
    time: { type: String, required: true },
    members: { type: [String], default: [] },
  },
  { _id: false },
);

const practiceSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  members: {
    type: [String],
    required: true,
  },
  memberByHour: {
    type: [practiceHourMemberSchema],
    default: [],
  },
  place: {
    type: String,
    default: "미확정",
  },
  /** 임원진이 관리자 화면에서 장소를 배정한 시각·사람 (결산 기록용) */
  placeAssignedAt: {
    type: Date,
    default: null,
  },
  placeAssignedBy: {
    type: String,
    default: null,
  },
  /** 이 연습만 금액을 따로 정할 때(원). null 이면 장소 시간당 요금 × 시간 */
  placeCost: {
    type: Number,
    default: null,
  },
  /** 일정 투표에서 만든 연습: 계정 없이 응답한 게스트 참여자 이름 */
  guestNames: {
    type: [String],
    default: [],
  },
  pollId: {
    type: String,
    default: null,
  },
  scheduleHoldbacks: {
    type: [
      {
        userId: { type: String, required: true },
        date: { type: String, required: true },
        hours: { type: [Number], default: [] },
        timesBefore: { type: [Number], default: [] },
      },
    ],
    default: [],
  },
});

const Practice = mongoose.model("Practice", practiceSchema);
module.exports = Practice;
