const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  agentId: {
    type: String,
    required: true,
  },
  time: {
    type: Array,
    required: true,
  },
});

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
