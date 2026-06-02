const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  Identification: {
    type: String,
  },
  position: {
    type: String,
    default: "댄서",
  },
  /** null이면 사이트 기본 예약 건수 제한 적용 */
  reservationLimit: {
    type: Number,
    default: null,
    min: 0,
    max: 99,
  },
  recommendationLikes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "SongRecommendation" },
  ],
  recommendationScraps: [
    { type: mongoose.Schema.Types.ObjectId, ref: "SongRecommendation" },
  ],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
