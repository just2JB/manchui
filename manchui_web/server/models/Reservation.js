const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  /** 대표자 연락처(전화 등) */
  agentId: {
    type: String,
    required: true,
  },
  time: {
    type: Array,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  headcount: {
    type: Number,
    required: false,
    min: 1,
  },
  /**
   * general: 동아리방 일반 예약(/make)
   * admin: 임원진 관리자 화면(/admin/make)
   */
  bookingType: {
    type: String,
    enum: ["general", "admin"],
    default: "general",
  },
});

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
