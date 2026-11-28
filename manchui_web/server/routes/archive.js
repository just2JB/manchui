const express = require("express");
const mongoose = require("mongoose");
const ArchiveEvent = require("../models/ArchiveEvent");
const User = require("../models/User");
const requireExecutive = require("../middleware/requireExecutive");
const { titleFromBody } = require("../utils/archiveNoticeTitle");
const { wikiLinksOf } = require("../utils/archiveWikiLinks");

/**
 * 임원진 아카이브 (행사별 공지글 묶음). 전부 임원진만.
 *  GET    /api/archive?q=검색어          행사 목록 (행사명·요약·태그·공지 제목/본문 검색)
 *  GET    /api/archive/graph             그래프 뷰용 전체 기록·항목·위키링크 (본문 제외)
 *  GET    /api/archive/:id               행사 + 공지글
 *  POST   /api/archive                   행사 만들기
 *  PATCH  /api/archive/:id               행사 정보 수정
 *  DELETE /api/archive/:id               행사 삭제 (공지 포함)
 *  POST   /api/archive/:id/notices       공지 추가
 *  PATCH  /api/archive/:id/notices/:nid  공지 수정
 *  DELETE /api/archive/:id/notices/:nid  공지 삭제
 *  POST   /api/archive/:id/notices/:nid/split  공지 나누기 { at, body? , title? }
 *  POST   /api/archive/:id/notices/:nid/merge  공지 합치기 { into, body? } → into 뒤에 붙임
 */
const router = express.Router();
router.use(requireExecutive);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isId = (id) => mongoose.Types.ObjectId.isValid(id);

const MAX_NOTICES = 200;

/** 실제 있는 날짜인지 (2026-02-31 같은 값 거르기) */
const isRealDate = (d) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [y, m, day] = d.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, day));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === day;
};

const normalizeEvent = (raw) => {
  const body = raw && typeof raw === "object" ? raw : {};
  const out = {};
  if (body.title !== undefined) out.title = String(body.title ?? "").trim().slice(0, 80);
  if (body.startDate !== undefined || body.endDate !== undefined) {
    let start = String(body.startDate ?? "").trim();
    let end = String(body.endDate ?? "").trim();
    start = isRealDate(start) ? start : "";
    end = isRealDate(end) ? end : "";
    if (!start && end) start = end;
    if (start && (!end || end < start)) end = start;
    out.startDate = start;
    out.endDate = start ? end : "";
    out.eventDate = "";
  }
  if (body.generation !== undefined) {
    const g = Number(body.generation);
    out.generation = body.generation === null || body.generation === "" || !Number.isFinite(g) ? null : g;
  }
  if (body.tags !== undefined) {
    const raw = Array.isArray(body.tags) ? body.tags : String(body.tags ?? "").split(",");
    out.tags = [...new Set(raw.map((t) => String(t).trim().replace(/^#/, "")).filter(Boolean))]
      .slice(0, 10)
      .map((t) => t.slice(0, 20));
  }
  if (body.category !== undefined) {
    const category = body.category === "동아리 활동" ? "활동" : body.category === "동아리 운영" ? "운영" : body.category;
    out.category = ArchiveEvent.EVENT_CATEGORIES.includes(category) ? category : "기타";
  }
  if (body.eventGroup !== undefined) out.eventGroup = String(body.eventGroup ?? "").trim().slice(0, 80);
  if (body.summary !== undefined) out.summary = String(body.summary ?? "").slice(0, 2000);
  return out;
};

const normalizeNotice = (raw) => {
  const body = raw && typeof raw === "object" ? raw : {};
  const out = {};
  if (body.title !== undefined) out.title = String(body.title ?? "").trim().slice(0, 120);
  if (body.body !== undefined) out.body = String(body.body ?? "").slice(0, 20000);
  if (body.date !== undefined) {
    const d = String(body.date ?? "").trim();
    out.date = isRealDate(d) ? d : "";
  }
  if (body.endDate !== undefined) {
    // 시작 날짜보다 뒤일 때만 기간으로
    const e = String(body.endDate ?? "").trim();
    const start = out.date ?? "";
    out.endDate = isRealDate(e) && start && e > start ? e : "";
  }
  if (body.branch !== undefined) out.branch = String(body.branch ?? "").trim().replace(/\s+/g, " ").slice(0, 30);
  if (body.kind !== undefined) {
    out.kind = body.kind === "공지" ? "공지" : "일정";
  }
  if (Array.isArray(body.tags)) {
    out.tags = ["행사", "공연"].filter((tag) => body.tags.includes(tag));
    out.kind = "일정";
  }
  return out;
};

const toListItem = (e) => ({
  _id: e._id,
  title: e.title,
  startDate: e.startDate || e.eventDate || "",
  endDate: e.endDate || e.startDate || e.eventDate || "",
  generation: e.generation,
  category: e.category || "기타",
  eventGroup: e.eventGroup || "",
  tags: e.tags,
  summary: e.summary,
  noticeCount: e.notices?.length ?? 0,
  noticeTitles: (e.notices ?? []).slice(0, 3).map((n) => n.title),
  updatedAt: e.updatedAt,
});

router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim().slice(0, 50);
    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { title: rx },
        { eventGroup: rx },
        { summary: rx },
        { tags: rx },
        { "notices.title": rx },
        { "notices.body": rx },
      ];
    }
    const events = await ArchiveEvent.find(filter)
      .sort({ startDate: -1, eventDate: -1, createdAt: -1 })
      .limit(300)
      .lean();
    if (!q) return res.json({ events: events.map(toListItem) });
    // 검색이면 일치한 공지와 일치 부분 앞뒤 문맥을 같이 보낸다 (결과에서 본문으로 바로 이동).
    const lower = q.toLowerCase();
    const snippetOf = (text) => {
      // 본문 속 섹션(콜아웃) 표시 줄은 문맥에 보이지 않게 뺀다.
      const s = String(text ?? "").replace(/^@@section.*$/gm, "");
      const at = s.toLowerCase().indexOf(lower);
      if (at < 0) return "";
      const from = Math.max(0, at - 30);
      const to = Math.min(s.length, at + q.length + 50);
      return `${from > 0 ? "…" : ""}${s.slice(from, to).replace(/\s+/g, " ").trim()}${to < s.length ? "…" : ""}`;
    };
    return res.json({
      events: events.map((e) => ({
        ...toListItem(e),
        matches: (e.notices ?? [])
          .filter((n) => `${n.title ?? ""}\n${n.body ?? ""}`.toLowerCase().includes(lower))
          .slice(0, 10)
          .map((n) => ({
            _id: n._id,
            title: n.title,
            date: n.date || "",
            snippet: snippetOf(n.body) || "",
          })),
      })),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "아카이브를 불러오지 못했습니다." });
  }
});

/**
 * 그래프 뷰용 가벼운 전체 목록: 본문 대신 본문에서 뽑은 [[위키링크]] 대상만 보낸다.
 */
router.get("/graph", async (req, res) => {
  try {
    const events = await ArchiveEvent.find({})
      .select("title startDate endDate eventDate generation category eventGroup tags summary notices._id notices.title notices.date notices.endDate notices.kind notices.tags notices.branch notices.body")
      .sort({ startDate: -1, eventDate: -1, createdAt: -1 })
      .limit(500)
      .lean();
    return res.json({
      events: events.map((e) => ({
        _id: e._id,
        title: e.title,
        startDate: e.startDate || e.eventDate || "",
        endDate: e.endDate || e.startDate || e.eventDate || "",
        generation: e.generation,
        category: e.category || "기타",
        eventGroup: e.eventGroup || "",
        tags: e.tags ?? [],
        links: wikiLinksOf(e.summary),
        notices: (e.notices ?? []).map((n) => ({
          _id: n._id,
          title: n.title,
          date: n.date || "",
          endDate: n.endDate || "",
          kind: n.kind,
          tags: n.tags,
          branch: n.branch || "",
          links: wikiLinksOf(`${n.title ?? ""}\n${n.body ?? ""}`),
        })),
      })),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "그래프를 불러오지 못했습니다." });
  }
});

router.get("/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
  try {
    const event = await ArchiveEvent.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "행사를 불러오지 못했습니다." });
  }
});

router.post("/", async (req, res) => {
  const data = normalizeEvent(req.body);
  if (!data.title) return res.status(400).json({ message: "행사 이름을 입력해 주세요." });
  try {
    const event = await ArchiveEvent.create({ ...data, createdBy: req.adminUserId });
    return res.status(201).json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "행사를 만들지 못했습니다." });
  }
});

router.patch("/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
  const data = normalizeEvent(req.body);
  if (data.title !== undefined && !data.title) {
    return res.status(400).json({ message: "행사 이름을 입력해 주세요." });
  }
  try {
    const event = await ArchiveEvent.findByIdAndUpdate(req.params.id, { $set: data }, { new: true }).lean();
    if (!event) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
    return res.json({ event });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "저장하지 못했습니다." });
  }
});

router.delete("/:id", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
  try {
    const out = await ArchiveEvent.findByIdAndDelete(req.params.id);
    if (!out) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "삭제하지 못했습니다." });
  }
});

router.post("/:id/notices", async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
  const data = normalizeNotice(req.body);
  if (!data.title) return res.status(400).json({ message: "공지 제목을 입력해 주세요." });
  try {
    const author = await User.findById(req.adminUserId).select("username").lean();
    const event = await ArchiveEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "행사를 찾을 수 없습니다." });
    if (event.notices.length >= MAX_NOTICES) {
      return res.status(400).json({ message: `공지는 행사당 ${MAX_NOTICES}개까지 저장할 수 있습니다.` });
    }
    event.notices.push({ ...data, authorName: author?.username ?? "" });
    await event.save();
    return res.status(201).json({ event: event.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "공지를 추가하지 못했습니다." });
  }
});

router.patch("/:id/notices/:nid", async (req, res) => {
  const { id, nid } = req.params;
  if (!isId(id) || !isId(nid)) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
  const data = normalizeNotice(req.body);
  if (data.title !== undefined && !data.title) {
    return res.status(400).json({ message: "공지 제목을 입력해 주세요." });
  }
  try {
    const event = await ArchiveEvent.findById(id);
    const notice = event?.notices.id(nid);
    if (!notice) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
    Object.assign(notice, data);
    await event.save();
    return res.json({ event: event.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "저장하지 못했습니다." });
  }
});

/**
 * 공지 나누기: 본문을 at 위치에서 잘라 뒷부분을 바로 다음 항목으로 만든다.
 * body 를 보내면 저장 전 작성 중인 본문 기준으로 자른다.
 */
router.post("/:id/notices/:nid/split", async (req, res) => {
  const { id, nid } = req.params;
  if (!isId(id) || !isId(nid)) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
  try {
    const event = await ArchiveEvent.findById(id);
    const notice = event?.notices.id(nid);
    if (!notice) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
    if (event.notices.length >= MAX_NOTICES) {
      return res.status(400).json({ message: `공지는 행사당 ${MAX_NOTICES}개까지 저장할 수 있습니다.` });
    }
    const text = typeof req.body?.body === "string" ? req.body.body.slice(0, 20000) : notice.body ?? "";
    const at = req.body?.at;
    const valid = Number.isInteger(at) && at > 0 && at < text.length;
    const head = valid ? text.slice(0, at).replace(/\s+$/, "") : "";
    const tail = valid ? text.slice(at).replace(/^\s+/, "") : "";
    if (!head || !tail) {
      return res.status(400).json({ message: "나눌 위치에 커서를 두세요. 앞뒤에 모두 내용이 있어야 합니다." });
    }
    const title = String(req.body?.title ?? "").trim().slice(0, 120) || titleFromBody(tail, `${notice.title} (이어서)`).slice(0, 120);
    const index = event.notices.findIndex((n) => String(n._id) === String(nid));
    notice.body = head;
    event.notices.splice(index + 1, 0, {
      title,
      date: notice.date,
      endDate: notice.endDate,
      kind: notice.kind,
      branch: notice.branch,
      tags: Array.isArray(notice.tags) ? [...notice.tags] : undefined,
      body: tail,
      authorName: notice.authorName,
    });
    await event.save();
    return res.status(201).json({ event: event.toObject(), noticeId: event.notices[index + 1]._id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "나누지 못했습니다." });
  }
});

/** 공지 합치기: nid 공지 본문을 into 공지 뒤에 붙이고 nid 는 지운다. */
router.post("/:id/notices/:nid/merge", async (req, res) => {
  const { id, nid } = req.params;
  const into = String(req.body?.into ?? "");
  if (!isId(id) || !isId(nid) || !isId(into) || into === nid) {
    return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
  }
  try {
    const event = await ArchiveEvent.findById(id);
    const source = event?.notices.id(nid);
    const target = event?.notices.id(into);
    if (!source || !target) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
    const sourceBody = typeof req.body?.body === "string" ? req.body.body : source.body ?? "";
    const merged = [target.body ?? "", sourceBody].map((s) => s.trim()).filter(Boolean).join("\n\n");
    if (merged.length > 20000) return res.status(400).json({ message: "합친 본문이 너무 깁니다." });
    target.body = merged;
    source.deleteOne();
    await event.save();
    return res.json({ event: event.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "합치지 못했습니다." });
  }
});

router.delete("/:id/notices/:nid", async (req, res) => {
  const { id, nid } = req.params;
  if (!isId(id) || !isId(nid)) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
  try {
    const event = await ArchiveEvent.findById(id);
    const notice = event?.notices.id(nid);
    if (!notice) return res.status(404).json({ message: "공지를 찾을 수 없습니다." });
    notice.deleteOne();
    await event.save();
    return res.json({ event: event.toObject() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "삭제하지 못했습니다." });
  }
});

module.exports = router;
