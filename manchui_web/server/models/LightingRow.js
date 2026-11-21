const mongoose = require("mongoose");

/**
 * 정기공연 조명 큐 한 줄 (1회용). 팀(LightingTeam)에 속한다.
 * 시간은 입력한 그대로("1:30") 저장. 채널은 팀에 하나.
 */
const lightingRowSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    start: { type: String, default: "", trim: true },
    end: { type: String, default: "", trim: true },
    preset: { type: Number, default: 1, min: 1, max: 10 },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("LightingRow", lightingRowSchema);
