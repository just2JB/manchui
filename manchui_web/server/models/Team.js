const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  leaderId: {
    type: String,
  },
  members: {
    type: Array,
  },
  comment: {
    type: String,
    default: "작성해 주세요.",
  },
  practice: {
    type: Array,
    default: [],
  },
});

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
