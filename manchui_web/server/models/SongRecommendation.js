const mongoose = require("mongoose");

const songRecommendationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true, trim: true },
    body: { type: String, default: "" },
    /** 해시태그 본문(# 제외 저장), 예: ["공연", "락킹", "힙합"] */
    tags: {
      type: [String],
      default: [],
    },
    likeCount: { type: Number, default: 0 },
    scrapCount: { type: Number, default: 0 },
    /** og:image 등으로 가져온 미리보기 (릴스·벅스 등, 실패 시 비움) */
    thumbnailUrl: { type: String, default: null },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SongRecommendation", songRecommendationSchema);
