const express = require("express");
const mongoose = require("mongoose");
const LightingTeam = require("../models/LightingTeam");
const LightingRow = require("../models/LightingRow");

/**
 * 정기공연 조명 시트 (1회용, 공개 · 누구나 편집)
 *  팀 목록 → 팀별 큐 표 (채널 1개, 곡 길이). 음원은 각자 기기에서만 테스트 재생
 */
const router = express.Router();

const MAX_TEAMS = 60;
const MAX_ROWS_PER_TEAM = 100;

const isId = (id) => mongoose.isValidObjectId(id);
/** 콘솔 채널 (클라이언트 lightingPresets.js 의 CHANNELS 와 같게) */
const CHANNELS = [28, 29, 30];

function clampInt(value, min, max, fallback) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}
const str = (v, max) => String(v ?? "").slice(0, max);

function pickTeam(body) {
  const out = {};
  if ("order" in body) {
    out.order =
      body.order === "" || body.order === null ? null : clampInt(body.order, 0, 999, null);
  }
  if ("name" in body) out.name = str(body.name, 60).trim();
  if ("channel" in body) {
    const ch = Math.floor(Number(body.channel));
    out.channel = CHANNELS.includes(ch) ? ch : CHANNELS[0];
  }
  if ("length" in body) out.length = str(body.length, 10).trim();
  return out;
}

function pickRow(body) {
  const out = {};
  if ("start" in body) out.start = str(body.start, 10).trim();
  if ("end" in body) out.end = str(body.end, 10).trim();
  // 0 = 암전, 1~10 = 콘솔 조명 번호
  if ("preset" in body) out.preset = clampInt(body.preset, 0, 10, 1);
  if ("note" in body) out.note = str(body.note, 2000);
  return out;
}

const teamPayload = (t, rowCount) => ({
  _id: t._id,
  order: t.order,
  name: t.name,
  channel: CHANNELS.includes(t.channel) ? t.channel : CHANNELS[0],
  length: t.length || "",
  createdAt: t.createdAt,
  ...(rowCount !== undefined ? { rowCount } : {}),
});

const rowPayload = (r) => ({
  _id: r._id,
  teamId: r.teamId,
  start: r.start,
  end: r.end,
  preset: r.preset,
  note: r.note,
  createdAt: r.createdAt,
});

function fail(res, e, message) {
  console.error(e);
  res.status(500).json({ message });
}

/* ───────── 시트로 받기: 모든 팀 + 구간 ───────── */

router.get("/export", async (req, res) => {
  try {
    const [teams, rows] = await Promise.all([
      LightingTeam.find().sort({ createdAt: 1 }),
      LightingRow.find().sort({ createdAt: 1 }),
    ]);
    const byTeam = {};
    rows.forEach((r) => {
      const key = String(r.teamId);
      (byTeam[key] = byTeam[key] || []).push(rowPayload(r));
    });
    res.json({
      teams: teams.map((t) => ({ ...teamPayload(t), rows: byTeam[String(t._id)] || [] })),
    });
  } catch (e) {
    fail(res, e, "불러오지 못했어요.");
  }
});

/* ───────── 팀 ───────── */

router.get("/teams", async (req, res) => {
  try {
    const [teams, counts] = await Promise.all([
      LightingTeam.find().sort({ createdAt: 1 }),
      LightingRow.aggregate([{ $group: { _id: "$teamId", n: { $sum: 1 } } }]),
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json({ teams: teams.map((t) => teamPayload(t, countMap[String(t._id)] || 0)) });
  } catch (e) {
    fail(res, e, "불러오지 못했어요.");
  }
});

router.post("/teams", async (req, res) => {
  try {
    if ((await LightingTeam.estimatedDocumentCount()) >= MAX_TEAMS) {
      return res.status(400).json({ message: "팀이 너무 많아요." });
    }
    const team = await LightingTeam.create(pickTeam(req.body || {}));
    res.status(201).json({ team: teamPayload(team, 0) });
  } catch (e) {
    fail(res, e, "추가하지 못했어요.");
  }
});

router.get("/teams/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: "없는 팀이에요." });
    const team = await LightingTeam.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "없는 팀이에요." });
    const rows = await LightingRow.find({ teamId: team._id }).sort({ createdAt: 1 });
    res.json({ team: teamPayload(team), rows: rows.map(rowPayload) });
  } catch (e) {
    fail(res, e, "불러오지 못했어요.");
  }
});

router.put("/teams/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: "없는 팀이에요." });
    const team = await LightingTeam.findByIdAndUpdate(
      req.params.id,
      { $set: pickTeam(req.body || {}) },
      { new: true },
    );
    if (!team) return res.status(404).json({ message: "없는 팀이에요." });
    res.json({ team: teamPayload(team) });
  } catch (e) {
    fail(res, e, "저장하지 못했어요.");
  }
});

router.delete("/teams/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: "없는 팀이에요." });
    const team = await LightingTeam.findByIdAndDelete(req.params.id);
    if (team) {
      await LightingRow.deleteMany({ teamId: team._id });
    }
    res.json({ ok: true });
  } catch (e) {
    fail(res, e, "삭제하지 못했어요.");
  }
});

/* ───────── 큐(줄) ───────── */

router.post("/teams/:id/rows", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: "없는 팀이에요." });
    const team = await LightingTeam.findById(req.params.id).select("_id");
    if (!team) return res.status(404).json({ message: "없는 팀이에요." });
    if ((await LightingRow.countDocuments({ teamId: team._id })) >= MAX_ROWS_PER_TEAM) {
      return res.status(400).json({ message: "구간이 너무 많아요." });
    }
    const row = await LightingRow.create({ ...pickRow(req.body || {}), teamId: team._id });
    res.status(201).json({ row: rowPayload(row) });
  } catch (e) {
    fail(res, e, "추가하지 못했어요.");
  }
});

router.put("/rows/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: "없는 줄이에요." });
    const row = await LightingRow.findByIdAndUpdate(
      req.params.id,
      { $set: pickRow(req.body || {}) },
      { new: true },
    );
    if (!row) return res.status(404).json({ message: "없는 줄이에요." });
    res.json({ row: rowPayload(row) });
  } catch (e) {
    fail(res, e, "저장하지 못했어요.");
  }
});

router.delete("/rows/:id", async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(404).json({ message: "없는 줄이에요." });
    await LightingRow.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    fail(res, e, "삭제하지 못했어요.");
  }
});

module.exports = router;
