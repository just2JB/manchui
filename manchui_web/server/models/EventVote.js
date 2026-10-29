const mongoose = require("mongoose");

const eventVoteSchema = new mongoose.Schema(
  {
    eventKey: { type: String, required: true, trim: true },
    genreId: { type: String, required: true, trim: true },
    visitorHash: { type: String, required: true },
    voterHash: { type: String, required: true },
    identifierType: { type: String, enum: ["phone", "kakao"], required: true },
    encryptedIdentifier: { type: String, default: null },
    identifierIv: { type: String, default: null },
    identifierAuthTag: { type: String, default: null },
    identifierKeyVersion: { type: String, default: null, maxlength: 20 },
    consentedAt: { type: Date, required: true },
    privacyPolicyVersion: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

eventVoteSchema.index({ eventKey: 1, visitorHash: 1 }, { unique: true });
eventVoteSchema.index({ eventKey: 1, voterHash: 1 }, { unique: true, sparse: true });
eventVoteSchema.index({ eventKey: 1, genreId: 1 });
eventVoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("EventVote", eventVoteSchema);
