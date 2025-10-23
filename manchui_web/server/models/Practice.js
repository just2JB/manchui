const mongoose = require("mongoose");

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
    type: Array,
    required: true,
  },
});

const Practice = mongoose.model("Practice", practiceSchema);
module.exports = Practice;
