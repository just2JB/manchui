const crypto = require("crypto");
const express = require("express");
const EventVote = require("../models/EventVote");
const EventComment = require("../models/EventComment");
const EventDraw = require("../models/EventDraw");
const requireExecutive = require("../middleware/requireExecutive");
const {
  decodeBase64Key,
  decryptVoterIdentifier,
  encryptVoterIdentifier,
  maskVoterIdentifier,
} = require("../utils/eventVoterIdentity");

const router = express.Router();
const EVENT_KEY = "2026-2-street-recruitment";
const PRIVACY_POLICY_VERSION = "2026-09-08-v2";
const VOTE_DATA_EXPIRES_AT = new Date("2026-10-12T00:00:00+09:00");
const GENRE_IDS = new Set([
  "voguing",
  "hiphop",
  "house",
  "locking",
  "popping",
  "krump",
  "tutting",
  "waacking",
  "breaking",
  "girlish",
]);

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

function getVoterHashKeys() {
  const versions = new Set([
    process.env.EVENT_VOTER_ACTIVE_KEY_VERSION,
    ...(process.env.EVENT_VOTER_READ_KEY_VERSIONS || "").split(","),
  ].map((value) => String(value || "").trim()).filter((value) => /^[a-zA-Z0-9_]{1,20}$/.test(value)));
  const keys = [...versions]
    .map((version) => decodeBase64Key(process.env[`EVENT_VOTER_HASH_KEY_${version.toUpperCase()}`]))
    .filter(Boolean);
  if (process.env.EVENT_VOTER_HASH_SECRET) keys.push(process.env.EVENT_VOTER_HASH_SECRET);
  return keys;
}

function hashVoterIdentifier(normalizedIdentifier) {
  const [activeKey] = getVoterHashKeys();
  if (!activeKey) return null;
  return crypto.createHmac("sha256", activeKey).update(`${EVENT_KEY}:${normalizedIdentifier}`).digest("hex");
}

function getVoterHashCandidates(normalizedIdentifier) {
  return getVoterHashKeys().map((key) => (
    crypto.createHmac("sha256", key).update(`${EVENT_KEY}:${normalizedIdentifier}`).digest("hex")
  ));
}

function serializeComment(comment) {
  return {
    id: String(comment._id),
    genreId: comment.genreId,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

function serializeMaskedVote(vote) {
  let identifier = null;
  try {
    identifier = decryptVoterIdentifier(vote);
  } catch (error) {
    console.error("이벤트 투표 식별정보 복호화 실패", error);
  }
  return {
    id: String(vote._id),
    genreId: vote.genreId,
    identifierType: vote.identifierType,
    maskedIdentifier: maskVoterIdentifier(identifier, vote.identifierType),
    detailAvailable: Boolean(identifier),
    createdAt: vote.createdAt,
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
  const privacyConsent = req.body?.privacyConsent === true;
  if (!visitorHash) return res.status(400).json({ message: "브라우저 식별자가 필요합니다." });
  if (!GENRE_IDS.has(genreId)) return res.status(400).json({ message: "올바른 장르를 선택해주세요." });
  if (!voterIdentifier) return res.status(400).json({ message: "올바른 카카오톡 ID 또는 전화번호를 입력해주세요." });
  if (!privacyConsent) return res.status(400).json({ message: "개인정보 수집·이용 동의가 필요합니다." });
  const voterHash = hashVoterIdentifier(voterIdentifier.normalized);
  if (!voterHash) return res.status(503).json({ message: "투표 보안 설정이 완료되지 않았습니다." });
  const encryptedIdentity = encryptVoterIdentifier(voterIdentifier.normalized);
  if (!encryptedIdentity) return res.status(503).json({ message: "투표 식별정보 암호화 설정이 완료되지 않았습니다." });

  try {
    const existingVote = await EventVote.findOne({
      eventKey: EVENT_KEY,
      $or: [
        { visitorHash },
        { voterHash: { $in: getVoterHashCandidates(voterIdentifier.normalized) } },
      ],
    }).select("genreId").lean();
    if (existingVote) {
      return res.status(409).json({ message: "이미 투표에 참여했습니다.", myVote: existingVote.genreId });
    }
    const vote = await EventVote.create({
      eventKey: EVENT_KEY,
      genreId,
      visitorHash,
      voterHash,
      identifierType: voterIdentifier.identifierType,
      ...encryptedIdentity,
      consentedAt: new Date(),
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      expiresAt: VOTE_DATA_EXPIRES_AT,
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
    const [voteRows, comments, recentVotes, eligibleVoteCount, lastDraw] = await Promise.all([
      EventVote.aggregate([
        { $match: { eventKey: EVENT_KEY } },
        { $group: { _id: "$genreId", count: { $sum: 1 } } },
      ]),
      EventComment.find({ eventKey: EVENT_KEY }).sort({ createdAt: -1 }).limit(300).lean(),
      EventVote.find({ eventKey: EVENT_KEY })
        .sort({ createdAt: -1 })
        .limit(300)
        .lean(),
      EventVote.countDocuments({ eventKey: EVENT_KEY, encryptedIdentifier: { $ne: null } }),
      EventDraw.findOne({ eventKey: EVENT_KEY })
        .sort({ createdAt: -1 })
        .populate("winners prizes.winners")
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
      eligibleVoteCount,
      recentVotes: recentVotes.map(serializeMaskedVote),
      lastDraw: lastDraw
        ? {
            id: String(lastDraw._id),
            prizeName: lastDraw.prizeName,
            createdAt: lastDraw.createdAt,
            winners: (lastDraw.winners || []).filter(Boolean).map(serializeMaskedVote),
            prizes: lastDraw.prizes?.length
              ? lastDraw.prizes.map((prize) => ({
                  name: prize.name,
                  winners: (prize.winners || []).filter(Boolean).map(serializeMaskedVote),
                }))
              : [{
                  name: lastDraw.prizeName,
                  winners: (lastDraw.winners || []).filter(Boolean).map(serializeMaskedVote),
                }],
          }
        : null,
    });
  } catch (error) {
    console.error("이벤트 관리자 현황 조회 실패", error);
    return res.status(500).json({ message: "이벤트 관리 정보를 불러오지 못했습니다." });
  }
});

router.get("/admin/votes/:voteId", requireExecutive, async (req, res) => {
  try {
    const vote = await EventVote.findOne({ _id: req.params.voteId, eventKey: EVENT_KEY }).lean();
    if (!vote) return res.status(404).json({ message: "투표 정보를 찾을 수 없습니다." });
    const identifier = decryptVoterIdentifier(vote);
    if (!identifier) return res.status(404).json({ message: "기존 투표는 상세 식별정보를 확인할 수 없습니다." });
    return res.json({
      id: String(vote._id),
      genreId: vote.genreId,
      identifierType: vote.identifierType,
      identifier,
      createdAt: vote.createdAt,
    });
  } catch (error) {
    if (error?.name === "CastError") return res.status(400).json({ message: "올바르지 않은 투표 ID입니다." });
    console.error("이벤트 투표 상세 조회 실패", error);
    return res.status(500).json({ message: "투표 상세정보를 불러오지 못했습니다." });
  }
});

router.post("/admin/draw", requireExecutive, async (req, res) => {
  const prizes = Array.isArray(req.body?.prizes)
    ? req.body.prizes.map((prize) => ({
        name: String(prize?.name || "").trim(),
        winnerCount: Math.floor(Number(prize?.winnerCount)),
      }))
    : [{
        name: String(req.body?.prizeName || "").trim(),
        winnerCount: Math.floor(Number(req.body?.winnerCount)),
      }];
  if (!prizes.length || prizes.length > 20) return res.status(400).json({ message: "상품은 1개 이상 20개 이하로 추가해주세요." });
  if (prizes.some(({ name }) => !name || name.length > 50)) return res.status(400).json({ message: "각 상품명을 1자 이상 50자 이하로 입력해주세요." });
  if (prizes.some(({ winnerCount }) => !Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 100)) return res.status(400).json({ message: "상품별 당첨 인원은 1명 이상 100명 이하로 입력해주세요." });
  const totalWinnerCount = prizes.reduce((sum, prize) => sum + prize.winnerCount, 0);
  if (totalWinnerCount > 100) return res.status(400).json({ message: "전체 당첨 인원은 100명 이하로 설정해주세요." });

  try {
    const candidates = await EventVote.find({
      eventKey: EVENT_KEY,
      encryptedIdentifier: { $ne: null },
    }).lean();
    if (candidates.length < totalWinnerCount) {
      return res.status(400).json({ message: `추첨 가능한 참여자는 ${candidates.length}명입니다.` });
    }
    const pool = [...candidates];
    const drawnPrizes = prizes.map((prize) => ({
      name: prize.name,
      winners: Array.from({ length: prize.winnerCount }, () => {
        const winnerIndex = crypto.randomInt(pool.length);
        return pool.splice(winnerIndex, 1)[0];
      }),
    }));
    const winners = drawnPrizes.flatMap((prize) => prize.winners);
    const draw = await EventDraw.create({
      eventKey: EVENT_KEY,
      prizeName: prizes[0].name,
      winners: winners.map((winner) => winner._id),
      prizes: drawnPrizes.map((prize) => ({
        name: prize.name,
        winners: prize.winners.map((winner) => winner._id),
      })),
      drawnBy: req.adminUserId,
    });
    return res.status(201).json({
      id: String(draw._id),
      prizeName: draw.prizeName,
      createdAt: draw.createdAt,
      winners: winners.map(serializeMaskedVote),
      prizes: drawnPrizes.map((prize) => ({
        name: prize.name,
        winners: prize.winners.map(serializeMaskedVote),
      })),
    });
  } catch (error) {
    console.error("이벤트 당첨자 추첨 실패", error);
    return res.status(500).json({ message: "당첨자를 추첨하지 못했습니다." });
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
    const [result] = await Promise.all([
      EventVote.deleteMany({ eventKey: EVENT_KEY }),
      EventDraw.deleteMany({ eventKey: EVENT_KEY }),
    ]);
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
