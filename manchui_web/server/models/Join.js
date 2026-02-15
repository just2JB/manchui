const mongoose = require("mongoose");

const join = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  academicState: {
    type: String,
    required: true,
  },
  grade: {
    type: Number,
    required: true,
  },
  studentId: {
    type: Number,
    required: true,
  },
  college: {
    type: String,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  wish: {
    type: String,
  },
  applyAt: {
    type: Date,
    default: Date.now,
  },
});

const Join = mongoose.model("Join", join);
module.exports = Join;
