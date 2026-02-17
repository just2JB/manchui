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
});

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
