const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  joinForm: {
    type: Number,
    default: 0, // 0: disabled, 1: enabled
  },
});

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
