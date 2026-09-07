const mongoose = require("mongoose");

const eventCommentSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, trim: true },
    genreId: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true, maxlength: 40 },
    visitorHash: { type: String, required: true },
  },
  { timestamps: true },
);

eventCommentSchema.index({ eventKey: 1, createdAt: -1 });
eventCommentSchema.index({ eventKey: 1, genreId: 1, createdAt: -1 });

module.exports = mongoose.model("EventComment", eventCommentSchema);
