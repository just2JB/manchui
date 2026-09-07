const crypto = require("crypto");
const express = require("express");
const EventVote = require("../models/EventVote");
const EventComment = require("../models/EventComment");
const requireExecutive = require("../middleware/requireExecutive");

const router = express.Router();
const EVENT_KEY = "2026-2-street-recruitment";
const GENRE_IDS = new Set(["voguing", "hiphop", "house", "locking", "popping", "krump"]);

function getVisitorHash(req) {
  const visitorId = String(req.get("x-event-visitor-id") || "").trim();
  if (!/^[a-zA-Z0-9-]{20,80}$/.test(visitorId)) return null;
  return crypto.createHash("sha256").update(visitorId).digest("hex");
}

function normalizeVoterIdentifier(rawValue) {
  const value = String(rawValue || "").trim();
  const phoneDigits = value.replace(/\D/g, "");
  if (/^01\d{8,9}$/.test(phoneDigits) && /^[\d\s-]+$/.test(value)) {
    return { normalized: phoneDigits, identifierType: "phone" };
  }

  const kakaoId = value.toLowerCase();
  if (/^[a-z0-9가-힣._-]{2,30}$/.test(kakaoId)) {
    return { normalized: kakaoId, identifierType: "kakao" };
  }
  return null;
}

function hashVoterIdentifier(normalizedIdentifier) {
  const secret = process.env.EVENT_VOTER_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(`${EVENT_KEY}:${normalizedIdentifier}`).digest("hex");
}

function serializeComment(comment) {
  return {
    id: String(comment._id),
    genreId: comment.genreId,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

router.get("/status", async (req, res) => {
  try {
    const visitorHash = getVisitorHash(req);
    const [voteRows, myVote] = await Promise.all([
      EventVote.aggregate([
        { $match: { eventKey: EVENT_KEY } },
        { $group: { _id: "$genreId", count: { $sum: 1 } } },
      ]),
      visitorHash
        ? EventVote.findOne({ eventKey: EVENT_KEY, visitorHash }).select("genreId").lean()
        : null,
    ]);

    const votes = Object.fromEntries([...GENRE_IDS].map((genreId) => [genreId, 0]));
    voteRows.forEach(({ _id, count }) => {
      if (GENRE_IDS.has(_id)) votes[_id] = count;
    });

    res.json({ eventKey: EVENT_KEY, votes, myVote: myVote?.genreId ?? null });
  } catch (error) {
    console.error("이벤트 투표 현황 조회 실패", error);
    res.status(500).json({ message: "투표 현황을 불러오지 못했습니다." });
  }
});

router.post("/votes", async (req, res) => {
  const visitorHash = getVisitorHash(req);
  const genreId = String(req.body?.genreId || "").trim();
  const voterIdentifier = normalizeVoterIdentifier(req.body?.voterIdentifier);
  if (!visitorHash) return res.status(400).json({ message: "브라우저 식별자가 필요합니다." });
  if (!GENRE_IDS.has(genreId)) return res.status(400).json({ message: "올바른 장르를 선택해주세요." });
  if (!voterIdentifier) return res.status(400).json({ message: "올바른 카카오톡 ID 또는 전화번호를 입력해주세요." });
  const voterHash = hashVoterIdentifier(voterIdentifier.normalized);
  if (!voterHash) return res.status(503).json({ message: "투표 보안 설정이 완료되지 않았습니다." });

  try {
    const vote = await EventVote.create({
      eventKey: EVENT_KEY,
      genreId,
      visitorHash,
      voterHash,
      identifierType: voterIdentifier.identifierType,
    });
    return res.status(201).json({ genreId: vote.genreId });
  } catch (error) {
    if (error?.code === 11000) {
      const existingVote = await EventVote.findOne({
        eventKey: EVENT_KEY,
        $or: [{ visitorHash }, { voterHash }],
      }).select("genreId").lean();
      return res.status(409).json({ message: "이미 투표에 참여했습니다.", myVote: existingVote?.genreId ?? null });
    }
    console.error("이벤트 투표 저장 실패", error);
    return res.status(500).json({ message: "투표를 저장하지 못했습니다." });
  }
});

router.get("/comments", async (req, res) => {
  try {
    const genreId = String(req.query.genreId || "").trim();
    if (genreId && !GENRE_IDS.has(genreId)) return res.status(400).json({ message: "올바른 장르가 아닙니다." });
    const filter = { eventKey: EVENT_KEY, ...(genreId ? { genreId } : {}) };
    const comments = await EventComment.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ comments: comments.map(serializeComment) });
  } catch (error) {
    console.error("이벤트 댓글 조회 실패", error);
    return res.status(500).json({ message: "댓글을 불러오지 못했습니다." });
  }
});

router.post("/comments", async (req, res) => {
  const visitorHash = getVisitorHash(req);
  const genreId = String(req.body?.genreId || "").trim();
  const content = String(req.body?.content || "").replace(/\s+/g, " ").trim();
  if (!visitorHash) return res.status(400).json({ message: "브라우저 식별자가 필요합니다." });
  if (!GENRE_IDS.has(genreId)) return res.status(400).json({ message: "올바른 장르를 선택해주세요." });
  if (!content || content.length > 40) return res.status(400).json({ message: "댓글은 1자 이상 40자 이하로 작성해주세요." });

  try {
    const recentComment = await EventComment.findOne({ eventKey: EVENT_KEY, visitorHash }).sort({ createdAt: -1 }).select("createdAt").lean();
    if (recentComment && Date.now() - new Date(recentComment.createdAt).getTime() < 3_000) {
      return res.status(429).json({ message: "댓글은 3초에 한 번 작성할 수 있습니다." });
    }
    const comment = await EventComment.create({ eventKey: EVENT_KEY, genreId, content, visitorHash });
    return res.status(201).json({ comment: serializeComment(comment) });
  } catch (error) {
    console.error("이벤트 댓글 저장 실패", error);
    return res.status(500).json({ message: "댓글을 저장하지 못했습니다." });
  }
});

router.get("/admin", requireExecutive, async (req, res) => {
  try {
    const [voteRows, comments, recentVotes] = await Promise.all([
      EventVote.aggregate([
        { $match: { eventKey: EVENT_KEY } },
        { $group: { _id: "$genreId", count: { $sum: 1 } } },
      ]),
      EventComment.find({ eventKey: EVENT_KEY }).sort({ createdAt: -1 }).limit(300).lean(),
      EventVote.find({ eventKey: EVENT_KEY })
        .sort({ createdAt: -1 })
        .limit(300)
        .select("genreId identifierType createdAt")
        .lean(),
    ]);
    const votes = Object.fromEntries([...GENRE_IDS].map((genreId) => [genreId, 0]));
    voteRows.forEach(({ _id, count }) => {
      if (GENRE_IDS.has(_id)) votes[_id] = count;
    });
    return res.json({
      eventKey: EVENT_KEY,
      votes,
      totalVotes: Object.values(votes).reduce((sum, count) => sum + count, 0),
      comments: comments.map(serializeComment),
      recentVotes: recentVotes.map((vote) => ({
        id: String(vote._id),
        genreId: vote.genreId,
        identifierType: vote.identifierType,
        createdAt: vote.createdAt,
      })),
    });
  } catch (error) {
    console.error("이벤트 관리자 현황 조회 실패", error);
    return res.status(500).json({ message: "이벤트 관리 정보를 불러오지 못했습니다." });
  }
});

router.delete("/admin/comments/:commentId", requireExecutive, async (req, res) => {
  try {
    const deleted = await EventComment.findOneAndDelete({ _id: req.params.commentId, eventKey: EVENT_KEY });
    if (!deleted) return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    return res.json({ message: "댓글을 삭제했습니다." });
  } catch (error) {
    if (error?.name === "CastError") return res.status(400).json({ message: "올바르지 않은 댓글 ID입니다." });
    console.error("이벤트 댓글 삭제 실패", error);
    return res.status(500).json({ message: "댓글을 삭제하지 못했습니다." });
  }
});

router.delete("/admin/votes", requireExecutive, async (req, res) => {
  try {
    const result = await EventVote.deleteMany({ eventKey: EVENT_KEY });
    return res.json({ message: "투표를 초기화했습니다.", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("이벤트 투표 초기화 실패", error);
    return res.status(500).json({ message: "투표를 초기화하지 못했습니다." });
  }
});

router.delete("/admin/comments", requireExecutive, async (req, res) => {
  try {
    const result = await EventComment.deleteMany({ eventKey: EVENT_KEY });
    return res.json({ message: "댓글을 모두 삭제했습니다.", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("이벤트 댓글 초기화 실패", error);
    return res.status(500).json({ message: "댓글을 초기화하지 못했습니다." });
  }
});

module.exports = router;
