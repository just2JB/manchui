const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const router = express.Router();
const Reservation = require("../models/Reservation");
const getToken = require("../utils/getToken");
const requireExecutive = require("../middleware/requireExecutive");

/** 공유 페이지용: 연락처 마스킹 */
function maskAgentId(raw) {
  if (raw == null || String(raw).trim() === "") return "—";
  const s = String(raw).trim();
  const digits = s.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
  if (s.length <= 3) return "***";
  return `${s.slice(0, 2)}***${s.slice(-1)}`;
}

function getUserIdFromReq(req) {
  const token = getToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

/** 서버 로컬 기준 오늘 날짜 (YYYY-MM-DD) */
function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 예약일(캘린더 date)이 오늘보다 이전인 문서 삭제 */
async function purgePastReservations() {
  const todayKey = getTodayDateKey();
  return Reservation.deleteMany({ date: { $lt: todayKey } });
}

async function hasReservedTimeOverlap(date, timeArray) {
  const existingReservation = await Reservation.find({ date });
  for (const item of existingReservation) {
    const reservedTime = item.time;
    for (const reqTime of timeArray) {
      if (reservedTime.includes(Number(reqTime))) return true;
    }
  }
  return false;
}

/**
 * @param {"general"|"admin"} bookingType
 */
async function createReservationHandler(req, res, bookingType) {
  try {
    const userId =
      bookingType === "admin"
        ? req.adminUserId
          ? String(req.adminUserId)
          : null
        : getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { date, agentId, time, headcount } = req.body;
    if (!date || !agentId || !Array.isArray(time) || time.length === 0) {
      return res.status(400).json({ message: "필수 정보가 누락되었습니다." });
    }

    await purgePastReservations();

    if (await hasReservedTimeOverlap(date, time)) {
      return res
        .status(401)
        .json({ message: "해당 시간은 이미 예약 되었습니다." });
    }

    const hc =
      headcount !== undefined && headcount !== null && headcount !== ""
        ? Number(headcount)
        : 1;
    if (Number.isNaN(hc) || hc < 1) {
      return res.status(400).json({ message: "인원수를 확인해 주세요." });
    }

    const reservation = new Reservation({
      date: date,
      agentId: String(agentId).trim(),
      time: time,
      userId,
      headcount: hc,
      bookingType,
    });
    await reservation.save();
    res.status(201).json({
      message: "예약이 완료되었습니다.",
      reservationId: reservation._id,
    });
  } catch (error) {
    res.status(501).json({ message: "서버 오류가 발생하였습니다." });
  }
}

router.post("/make", async (req, res) => {
  await createReservationHandler(req, res, "general");
});

/** 임원진: 관리자 화면 전용 예약 (bookingType: admin) */
router.post("/admin/make", requireExecutive, async (req, res) => {
  await createReservationHandler(req, res, "admin");
});

router.get("/", async (req, res) => {
  try {
    await purgePastReservations();
    const reservation = await Reservation.find()
      .populate("userId", "username")
      .lean();
    const sortDay = reservation.sort((a, b) => {
      if (new Date(a.date) > new Date(b.date)) {
        return 1;
      } else if (new Date(a.date) < new Date(b.date)) {
        return -1;
      } else {
        return 0;
      }
    });
    const sortTime = sortDay.sort((a, b) => {
      if (a.date === b.date) {
        if (Math.min(...a.time) > Math.min(...b.time)) {
          return 1;
        } else if (Math.min(...a.time) < Math.min(...b.time)) {
          return -1;
        }
      } else {
        return 0;
      }
    });

    res.json(sortTime);
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 공개: 링크로 열람 (로그인 불필요). 연락처는 마스킹 */
router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
    }
    const doc = await Reservation.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
    }
    if (doc.date && doc.date < getTodayDateKey()) {
      await Reservation.findByIdAndDelete(id);
      return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
    }
    res.json({
      _id: doc._id,
      date: doc.date,
      time: doc.time,
      headcount: doc.headcount,
      contactMasked: maskAgentId(doc.agentId),
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

router.get("/mine", async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    await purgePastReservations();
    /** 일반 예약만: 관리자 화면 예약(bookingType: admin)은 내 예약 목록에 포함하지 않음 */
    const list = await Reservation.find({
      userId,
      bookingType: { $ne: "admin" },
    }).lean();
    list.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (da.getTime() !== db.getTime()) return da - db;
      const minA = Math.min(...(a.time || []).map(Number));
      const minB = Math.min(...(b.time || []).map(Number));
      return minA - minB;
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 전체 예약 목록 (예약자 정보 포함) */
router.get("/admin/list", requireExecutive, async (req, res) => {
  try {
    await purgePastReservations();
    const raw = await Reservation.find()
      .populate("userId", "username Identification email position")
      .lean();
    raw.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      if (da.getTime() !== db.getTime()) return da - db;
      const minA = Math.min(...(a.time || []).map(Number));
      const minB = Math.min(...(b.time || []).map(Number));
      return minA - minB;
    });
    res.json(raw);
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 오늘 날짜 이전(캘린더 기준) 예약 일괄 삭제 */
router.post("/admin/delete-past", requireExecutive, async (req, res) => {
  try {
    const result = await purgePastReservations();
    res.json({
      message: "처리되었습니다.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 단일 예약 삭제 */
router.delete("/admin/by-id/:id", requireExecutive, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "잘못된 ID입니다." });
    }
    const deleted = await Reservation.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "해당 예약을 찾을 수 없습니다." });
    }
    res.json({ message: "예약이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "해당 예약을 찾을 수 없습니다." });
    }
    if (
      !reservation.userId ||
      String(reservation.userId) !== String(userId)
    ) {
      return res
        .status(403)
        .json({ message: "본인의 예약만 삭제할 수 있습니다." });
    }
    if (reservation.bookingType === "admin") {
      return res.status(403).json({
        message: "관리자 예약은 관리 화면에서만 취소할 수 있습니다.",
      });
    }
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: "예약이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

module.exports = router;
