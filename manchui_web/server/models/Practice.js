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
