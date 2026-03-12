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
  /** 회장 정보 */
  president: {
    name: { type: String, default: "" },
    contact: { type: String, default: "" },
    major: { type: String, default: "" },
  },
});

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
