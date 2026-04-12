const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  Identification: {
    type: String,
  },
  position: {
    type: String,
    default: "댄서",
  },
  recommendationLikes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "SongRecommendation" },
  ],
  recommendationScraps: [
    { type: mongoose.Schema.Types.ObjectId, ref: "SongRecommendation" },
  ],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
