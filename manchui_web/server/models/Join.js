const mongoose = require("mongoose");

const join = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
  },
  studentId: {
    type: Number,
    required: true,
  },
  contact: {
    type: String,
    require: true,
  },
  contactType: {
    type: String,
    require: true,
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
