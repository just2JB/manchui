const express = require("express");
const mongoose = require("mongoose");
const SongRecommendation = require("../models/SongRecommendation");
const User = require("../models/User");
const optionalAuth = require("../middleware/optionalAuth");
const requireAuth = require("../middleware/requireAuth");
const {
  parseHashtagString,
  normalizeTagArray,
} = require("../utils/parseHashtags");
const { fetchOpenGraphImage } = require("../utils/fetchOpenGraphImage");

const router = express.Router();

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergedTagsFromDoc(o) {
  let list = Array.isArray(o.tags) ? normalizeTagArray(o.tags) : [];
  if (
    list.length === 0 &&
    (o.tagPerformance || o.tagClass || o.tagMood || o.tagGenre)
  ) {
    list = normalizeTagArray([
      o.tagPerformance,
      o.tagClass,
      o.tagMood,
      o.tagGenre,
    ]);
  }
  return list;
}

/** # 제거 후 남은 일반 검색어(공백 정리). */
function parseTagQueriesFromQ(q) {
  const s = q != null ? String(q).trim() : "";
  if (!s) return { tagTokens: [], rest: "" };
  const tagTokens = [];
  const re = /#([^\s#]+)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const t = m[1].trim();
    if (t) tagTokens.push(t);
  }
  const rest = s.replace(/#[^\s#]+/g, " ").replace(/\s+/g, " ").trim();
  return { tagTokens, rest };
}

/** 해시 없는 부분만 제목·본문·URL·태그 부분일치 검색 */
function buildTextSearchFilter(q) {
  if (!q || !String(q).trim()) return null;
  const rx = new RegExp(escapeRegex(String(q).trim()), "i");
  return {
    $or: [
      { title: rx },
      { body: rx },
      { videoUrl: rx },
      { tags: rx },
      { tagPerformance: rx },
      { tagClass: rx },
      { tagMood: rx },
      { tagGenre: rx },
    ],
  };
}

/**
 * q에 #태그 가 있으면 해당 태그(들)가 문서 tags 배열에 모두 있는 글만(정확 일치, 대소문자 무시),
 * # 구간을 뺀 나머지 문자열은 기존처럼 부분 검색.
 */
function buildCombinedSearchFilter(q) {
  const { tagTokens, rest } = parseTagQueriesFromQ(q);
  const parts = [];
  if (tagTokens.length) {
    const tagPart =
      tagTokens.length === 1
        ? { tags: new RegExp(`^${escapeRegex(tagTokens[0])}$`, "i") }
        : {
            $and: tagTokens.map((t) => ({
              tags: new RegExp(`^${escapeRegex(t)}$`, "i"),
            })),
          };
    parts.push(tagPart);
  }
  const textF = buildTextSearchFilter(rest);
  if (textF) parts.push(textF);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

/** ?tag=락킹 또는 #락킹 — 해당 해시가 포함된 글만 */
function buildSingleTagFilter(query) {
  const raw = query.tag ?? query.tags;
  if (!raw || !String(raw).trim()) return null;
  const t = String(raw).replace(/^#+/, "").trim();
  if (!t) return null;
  return { tags: new RegExp(`^${escapeRegex(t)}$`, "i") };
}

function sortFromQuery(sortParam) {
  switch (sortParam) {
    case "oldest":
      return { createdAt: 1 };
    case "title_asc":
      return { title: 1 };
    case "title_desc":
      return { title: -1 };
    case "likes_asc":
      return { likeCount: 1, createdAt: -1 };
    case "likes_desc":
      return { likeCount: -1, createdAt: -1 };
    case "latest":
    default:
      return { createdAt: -1 };
  }
}

function idSetFromRefArray(arr) {
  return new Set(
    (arr || []).map((x) =>
      String(typeof x === "object" && x != null && x._id ? x._id : x),
    ),
  );
}

function serializeRec(doc, userId, likedSet, scrapedSet, isExecutive = false) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  let authorIdStr = null;
  let authorName = null;
  if (o.authorId) {
    if (
      typeof o.authorId === "object" &&
      o.authorId !== null &&
      o.authorId._id
    ) {
      authorIdStr = String(o.authorId._id);
      authorName = o.authorId.username ?? null;
    } else {
      authorIdStr = String(o.authorId);
    }
  }
  const plain = { ...o };
  delete plain.authorId;
  const tags = mergedTagsFromDoc(plain);
  delete plain.tagPerformance;
  delete plain.tagClass;
  delete plain.tagMood;
  delete plain.tagGenre;
  plain.tags = tags;
  const id = String(plain._id);
  const canManageOwn = Boolean(
    userId && authorIdStr && authorIdStr === String(userId),
  );
  const canEdit = Boolean(userId && (isExecutive || canManageOwn));
  return {
    ...plain,
    authorId: authorIdStr,
    authorName,
    likedByMe: Boolean(userId && likedSet?.has(id)),
    scrapedByMe: Boolean(userId && scrapedSet?.has(id)),
    canEdit,
    canDelete: canEdit,
  };
}

async function userIsExecutive(userId) {
  if (!userId) return false;
  const u = await User.findById(userId).select("position").lean();
  return u?.position === "임원진";
}

router.get("/mine/likes", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: "recommendationLikes",
        options: { sort: { createdAt: -1 } },
        populate: { path: "authorId", select: "username Identification" },
      })
      .lean();
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const isExecutive = user.position === "임원진";
    const scraped = idSetFromRefArray(user.recommendationScraps);
    const likedSet = idSetFromRefArray(user.recommendationLikes);
    const raw = (user.recommendationLikes || []).filter(Boolean);
    const items = raw.map((doc) => {
      const base = serializeRec(
        doc,
        req.userId,
        likedSet,
        scraped,
        isExecutive,
      );
      return { ...base, likedByMe: true };
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: "목록을 불러오지 못했습니다." });
  }
});

router.get("/mine/scraps", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: "recommendationScraps",
        options: { sort: { createdAt: -1 } },
        populate: { path: "authorId", select: "username Identification" },
      })
      .lean();
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const isExecutive = user.position === "임원진";
    const liked = idSetFromRefArray(user.recommendationLikes);
    const scrapedSet = idSetFromRefArray(user.recommendationScraps);
    const raw = (user.recommendationScraps || []).filter(Boolean);
    const items = raw.map((doc) => {
      const base = serializeRec(
        doc,
        req.userId,
        liked,
        scrapedSet,
        isExecutive,
      );
      return { ...base, scrapedByMe: true };
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: "목록을 불러오지 못했습니다." });
  }
});

router.get("/", optionalAuth, async (req, res) => {
  try {
    const searchF = buildCombinedSearchFilter(req.query.q);
    const tagF = buildSingleTagFilter(req.query);
    const match = {};
    if (searchF && tagF) {
      match.$and = [searchF, tagF];
    } else if (searchF) {
      Object.assign(match, searchF);
    } else if (tagF) {
      Object.assign(match, tagF);
    }

    const sort = sortFromQuery(req.query.sort);
    const limitRaw = req.query.limit;
    const usePagination =
      limitRaw != null && String(limitRaw).trim() !== "";
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    let query = SongRecommendation.find(match)
      .sort(sort)
      .populate({ path: "authorId", select: "username Identification" });

    let list;
    let hasMore = false;
    let limit = null;

    if (usePagination) {
      limit = Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 50);
      list = await query.skip(skip).limit(limit + 1).lean();
      hasMore = list.length > limit;
      if (hasMore) list = list.slice(0, limit);
    } else {
      list = await query.lean();
    }

    let likedSet = null;
    let scrapedSet = null;
    let isExecutive = false;
    if (req.userId) {
      const u = await User.findById(req.userId)
        .select("recommendationLikes recommendationScraps position")
        .lean();
      if (u) {
        likedSet = new Set(
          (u.recommendationLikes || []).map((id) => String(id)),
        );
        scrapedSet = new Set(
          (u.recommendationScraps || []).map((id) => String(id)),
        );
        isExecutive = u.position === "임원진";
      }
    }

    const items = list.map((doc) =>
      serializeRec(doc, req.userId, likedSet, scrapedSet, isExecutive),
    );
    if (usePagination) {
      return res.json({ items, hasMore, skip, limit });
    }
    res.json({ items });
  } catch (e) {
    res.status(500).json({ message: "목록을 불러오지 못했습니다." });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const recId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recId)) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }
    const doc = await SongRecommendation.findById(recId)
      .populate({ path: "authorId", select: "username Identification" })
      .lean();
    if (!doc) {
      return res.status(404).json({ message: "추천을 찾을 수 없습니다." });
    }
    let likedSet = null;
    let scrapedSet = null;
    let isExecutive = false;
    if (req.userId) {
      const u = await User.findById(req.userId)
        .select("recommendationLikes recommendationScraps position")
        .lean();
      if (u) {
        likedSet = new Set(
          (u.recommendationLikes || []).map((id) => String(id)),
        );
        scrapedSet = new Set(
          (u.recommendationScraps || []).map((id) => String(id)),
        );
        isExecutive = u.position === "임원진";
      }
    }
    const item = serializeRec(doc, req.userId, likedSet, scrapedSet, isExecutive);
    res.json({ item });
  } catch (e) {
    res.status(500).json({ message: "불러오지 못했습니다." });
  }
});

router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const recId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recId)) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }
    const rec = await SongRecommendation.findById(recId);
    if (!rec) {
      return res.status(404).json({ message: "추천을 찾을 수 없습니다." });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const has = user.recommendationLikes.some(
      (id) => String(id) === String(recId),
    );
    if (has) {
      user.recommendationLikes = user.recommendationLikes.filter(
        (id) => String(id) !== String(recId),
      );
      rec.likeCount = Math.max(0, (rec.likeCount || 0) - 1);
    } else {
      user.recommendationLikes.push(recId);
      rec.likeCount = (rec.likeCount || 0) + 1;
    }
    await Promise.all([user.save(), rec.save()]);
    res.json({
      liked: !has,
      likeCount: rec.likeCount,
    });
  } catch (e) {
    res.status(500).json({ message: "처리에 실패했습니다." });
  }
});

router.post("/:id/scrap", requireAuth, async (req, res) => {
  try {
    const recId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recId)) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }
    const rec = await SongRecommendation.findById(recId);
    if (!rec) {
      return res.status(404).json({ message: "추천을 찾을 수 없습니다." });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }
    const has = user.recommendationScraps.some(
      (id) => String(id) === String(recId),
    );
    if (has) {
      user.recommendationScraps = user.recommendationScraps.filter(
        (id) => String(id) !== String(recId),
      );
      rec.scrapCount = Math.max(0, (rec.scrapCount || 0) - 1);
    } else {
      user.recommendationScraps.push(recId);
      rec.scrapCount = (rec.scrapCount || 0) + 1;
    }
    await Promise.all([user.save(), rec.save()]);
    res.json({ scraped: !has, scrapCount: rec.scrapCount });
  } catch (e) {
    res.status(500).json({ message: "처리에 실패했습니다." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, videoUrl, body = "", tagLine, tags: tagsBody } = req.body;
    if (
      !title ||
      !String(title).trim() ||
      !videoUrl ||
      !String(videoUrl).trim()
    ) {
      return res
        .status(400)
        .json({ message: "제목과 영상 링크는 필수입니다." });
    }
    let tags = [];
    if (Array.isArray(tagsBody) && tagsBody.length) {
      tags = normalizeTagArray(tagsBody);
    } else {
      tags = parseHashtagString(tagLine ?? "");
    }
    const url = String(videoUrl).trim();
    let thumbnailUrl = null;
    try {
      thumbnailUrl = await fetchOpenGraphImage(url);
    } catch {
      thumbnailUrl = null;
    }
    const doc = await SongRecommendation.create({
      title: String(title).trim(),
      videoUrl: url,
      body: String(body || ""),
      tags,
      authorId: req.userId,
      thumbnailUrl: thumbnailUrl || undefined,
    });
    res.status(201).json({ recommendation: doc });
  } catch (e) {
    res.status(500).json({ message: "등록에 실패했습니다." });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const recId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recId)) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }
    const rec = await SongRecommendation.findById(recId);
    if (!rec) {
      return res.status(404).json({ message: "추천을 찾을 수 없습니다." });
    }
    const isExecutive = await userIsExecutive(req.userId);
    const authorId = rec.authorId ? String(rec.authorId) : null;
    const isAuthor = authorId && authorId === String(req.userId);
    if (!isExecutive && !isAuthor) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }
    const { title, videoUrl, body, tagLine, tags: tagsBody } = req.body;
    if (title !== undefined) rec.title = String(title).trim();
    if (videoUrl !== undefined) {
      const v = String(videoUrl).trim();
      rec.videoUrl = v;
      try {
        rec.thumbnailUrl = (await fetchOpenGraphImage(v)) || null;
      } catch {
        rec.thumbnailUrl = null;
      }
    }
    if (body !== undefined) rec.body = String(body ?? "");
    if (tagsBody !== undefined || tagLine !== undefined) {
      if (Array.isArray(tagsBody)) {
        rec.tags = normalizeTagArray(tagsBody);
      } else if (tagLine !== undefined) {
        rec.tags = parseHashtagString(tagLine);
      }
    }
    if (!rec.title || !rec.videoUrl) {
      return res
        .status(400)
        .json({ message: "제목과 영상 링크는 비울 수 없습니다." });
    }
    await rec.save();
    res.json({ recommendation: rec });
  } catch (e) {
    res.status(500).json({ message: "수정에 실패했습니다." });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const recId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recId)) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }
    const existing = await SongRecommendation.findById(recId);
    if (!existing) {
      return res.status(404).json({ message: "추천을 찾을 수 없습니다." });
    }
    const isExecutive = await userIsExecutive(req.userId);
    const authorId = existing.authorId ? String(existing.authorId) : null;
    const isAuthor = authorId && authorId === String(req.userId);
    if (!isExecutive && !isAuthor) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }
    await existing.deleteOne();
    await User.updateMany(
      {},
      {
        $pull: {
          recommendationLikes: recId,
          recommendationScraps: recId,
        },
      },
    );
    res.json({ message: "삭제되었습니다." });
  } catch (e) {
    res.status(500).json({ message: "삭제에 실패했습니다." });
  }
});

module.exports = router;
