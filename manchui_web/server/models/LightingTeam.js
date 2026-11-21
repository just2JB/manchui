const mongoose = require("mongoose");

/** 정기공연 조명 시트의 팀 (1회용) */
const lightingTeamSchema = new mongoose.Schema(
  {
    order: { type: Number, default: null },
    name: { type: String, default: "", trim: true },
    /** 팀당 조명 채널 1개 (콘솔 28 · 29 · 30) */
    channel: { type: Number, default: 28 },
    /** 곡 길이 ("3:45") */
    length: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LightingTeam", lightingTeamSchema);
