const mongoose = require("mongoose");

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const emptyDays = () =>
  Object.fromEntries(WEEKDAY_KEYS.map((key) => [key, []]));

const weeklyEntrySchema = new mongoose.Schema(
  {
    weekday: {
      type: String,
      enum: WEEKDAY_KEYS,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    startHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    endHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    startMinute: {
      type: Number,
      default: 0,
      min: 0,
      max: 59,
    },
    endMinute: {
      type: Number,
      default: 0,
      min: 0,
      max: 59,
    },
  },
  { _id: true },
);

const weeklyTimetableSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  entries: {
    type: [weeklyEntrySchema],
    default: [],
  },
  days: {
    type: Map,
    of: [Number],
    default: () => emptyDays(),
  },
});

const WeeklyTimetable = mongoose.model("WeeklyTimetable", weeklyTimetableSchema);

module.exports = { WeeklyTimetable, WEEKDAY_KEYS, emptyDays };
