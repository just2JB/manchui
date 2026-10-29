const mongoose = require("mongoose");

const eventPrizeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "EventVote", required: true }],
  },
  { _id: false },
);

const eventDrawSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, trim: true },
    prizeName: { type: String, required: true, trim: true, maxlength: 50 },
    winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "EventVote", required: true }],
    prizes: { type: [eventPrizeSchema], default: [] },
    drawnBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

eventDrawSchema.index({ eventKey: 1, createdAt: -1 });

module.exports = mongoose.model("EventDraw", eventDrawSchema);
