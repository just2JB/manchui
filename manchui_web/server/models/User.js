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
});

const User = mongoose.model("User", userSchema);
module.exports = User;
