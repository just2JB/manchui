const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  times: {
    type: Array,
    default: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
  },
});

const Schedule = mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule;
