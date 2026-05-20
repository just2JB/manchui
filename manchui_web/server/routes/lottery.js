const express = require("express");
const LotteryConfig = require("../models/LotteryConfig");
const requireExecutive = require("../middleware/requireExecutive");
const { runLotteryDraw, sortResultsByNameKo } = require("../utils/lotteryDraw");

const router = express.Router();

function normalizePrizes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => ({
      label: String(p.label ?? "").trim(),
      winnerCount: Math.max(0, Math.floor(Number(p.winnerCount) || 0)),
    }))
    .filter((p) => p.label.length > 0);
}

function normalizeParticipants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => ({
      name: String(p.name ?? "").trim(),
      entries: Math.max(1, Math.floor(Number(p.entries) || 1)),
    }))
    .filter((p) => p.name.length > 0);
}

function toConfigPayload(doc) {
  return {
    prizes: doc.prizes.map((p) => ({
      _id: p._id,
      label: p.label,
      winnerCount: p.winnerCount,
    })),
    participants: doc.participants.map((p) => ({
      _id: p._id,
      name: p.name,
      entries: p.entries,
    })),
    lastDraw: doc.lastDraw?.results?.length
      ? {
          drawnAt: doc.lastDraw.drawnAt,
          results: doc.lastDraw.results,
        }
      : null,
  };
}

async function ensureDefaults(doc) {
  let changed = false;
  if (!doc.prizes.length) {
    doc.prizes = LotteryConfig.DEFAULT_PRIZES.map((p) => ({ ...p }));
    changed = true;
  }
  if (!doc.participants.length) {
    doc.participants = LotteryConfig.DEFAULT_PARTICIPANTS.map((p) => ({
      ...p,
    }));
    changed = true;
  }
  if (changed) await doc.save();
}

router.get("/config", requireExecutive, async (req, res) => {
  try {
    const doc = await LotteryConfig.getSingleton();
    await ensureDefaults(doc);
    res.json(toConfigPayload(doc));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "설정을 불러오지 못했습니다." });
  }
});

router.put("/config", requireExecutive, async (req, res) => {
  try {
    const prizes = normalizePrizes(req.body?.prizes);
    const participants = normalizeParticipants(req.body?.participants);
    if (!prizes.length) {
      return res.status(400).json({ message: "상품을 1개 이상 등록해 주세요." });
    }
    if (!participants.length) {
      return res.status(400).json({ message: "참여자를 1명 이상 등록해 주세요." });
    }

    const doc = await LotteryConfig.getSingleton();
    doc.prizes = prizes;
    doc.participants = participants;
    await doc.save();
    res.json({ message: "저장되었습니다.", ...toConfigPayload(doc) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "저장에 실패했습니다." });
  }
});

router.post("/draw", requireExecutive, async (req, res) => {
  try {
    const doc = await LotteryConfig.getSingleton();
    await ensureDefaults(doc);

    const bodyPrizes = normalizePrizes(req.body?.prizes);
    const bodyParticipants = normalizeParticipants(req.body?.participants);
    const useBody =
      Array.isArray(req.body?.prizes) || Array.isArray(req.body?.participants);

    const prizes = (
      useBody && bodyPrizes.length ? bodyPrizes : doc.prizes
    ).map((p) => ({
      label: p.label,
      winnerCount: p.winnerCount,
    }));
    const participants = (
      useBody && bodyParticipants.length
        ? bodyParticipants
        : doc.participants
    ).map((p) => ({
      name: p.name,
      entries: p.entries,
    }));

    const results = sortResultsByNameKo(
      runLotteryDraw(prizes, participants),
    );
    doc.lastDraw = { drawnAt: new Date(), results };
    await doc.save();

    res.json({
      drawnAt: doc.lastDraw.drawnAt,
      results,
      totalWinners: results.length,
    });
  } catch (e) {
    const msg = e.message || "추첨에 실패했습니다.";
    const status = e.message?.includes("적습니다") ? 400 : 500;
    res.status(status).json({ message: msg });
  }
});

module.exports = router;
