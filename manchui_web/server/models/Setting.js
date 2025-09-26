const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  join: {
    type: Boolean,
    required: true,
  },
});

const Setting = mongoose.model("Setting", settingSchema);
module.exports = Setting;
