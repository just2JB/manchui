const mongoose = require("mongoose");

const prizeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    winnerCount: { type: Number, required: true, min: 0, default: 1 },
  },
  { _id: true },
);

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    entries: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: true },
);

const lotteryConfigSchema = new mongoose.Schema({
  prizes: { type: [prizeSchema], default: [] },
  participants: { type: [participantSchema], default: [] },
  lastDraw: {
    drawnAt: Date,
    results: [
      {
        name: String,
        entries: Number,
        prize: String,
      },
    ],
  },
});

/** 단일 설정 문서 키 */
lotteryConfigSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({ prizes: [], participants: [] });
  }
  return doc;
};

const LotteryConfig = mongoose.model("LotteryConfig", lotteryConfigSchema);

const DEFAULT_PRIZES = [
  { label: "🍗 뿌링클", winnerCount: 2 },
  { label: "🍜 배달의 민족 1만원 쿠폰", winnerCount: 3 },
  { label: "🧋 메가커피 아메리카노", winnerCount: 3 },
  { label: "🍰 투썸플레이스 떠먹는 아박", winnerCount: 2 },
];

const DEFAULT_PARTICIPANTS = [
  { name: "김민서", entries: 4 },
  { name: "공지민", entries: 2 },
  { name: "유하정", entries: 4 },
  { name: "이영현", entries: 1 },
  { name: "김기빈", entries: 4 },
  { name: "이승민", entries: 2 },
  { name: "깅은후", entries: 2 },
  { name: "이성수", entries: 2 },
  { name: "임하경", entries: 3 },
  { name: "김은우", entries: 1 },
  { name: "김지수", entries: 1 },
  { name: "박수현", entries: 1 },
  { name: "제관욱", entries: 1 },
  { name: "서은서", entries: 1 },
  { name: "양인성", entries: 1 },
  { name: "강수연", entries: 1 },
  { name: "이영준", entries: 2 },
  { name: "김서연", entries: 1 },
  { name: "유경식", entries: 3 },
  { name: "장우진", entries: 2 },
  { name: "송채연", entries: 1 },
  { name: "서원경", entries: 1 },
  { name: "나은", entries: 1 },
  { name: "이나형", entries: 1 },
];

LotteryConfig.DEFAULT_PRIZES = DEFAULT_PRIZES;
LotteryConfig.DEFAULT_PARTICIPANTS = DEFAULT_PARTICIPANTS;

module.exports = LotteryConfig;
