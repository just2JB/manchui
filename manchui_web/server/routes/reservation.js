const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Reservation = require("../models/Reservation");
const { getAccessToken } = require("../utils/getToken");
const { verifyAccessToken } = require("../utils/tokens");
const requireExecutive = require("../middleware/requireExecutive");
const {
  assertCanCreateGeneralReservation,
  buildAdminLimitsPayload,
  countGeneralReservations,
  getQuotaForUser,
  parseRequiredLimit,
  setDefaultReservationLimit,
  setUserReservationLimit,
} = require("../utils/reservationLimits");
const { validateTeamName } = require("../utils/reservationTeamName");
const {
  isPastReservationEnd,
  isRetentionExpired,
  filterActiveForUserDisplay,
  filterActiveForAdminDisplay,
  purgeExpiredReservations,
} = require("../utils/reservationRetention");

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 서버 타임존과 무관하게 한국 날짜 기준 오늘 (YYYY-MM-DD) */
function todayKeyKst() {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function getUserIdFromReq(req) {
  const token = getAccessToken(req);
  if (!token) return null;
  try {
    const decoded = verifyAccessToken(token);
    return decoded.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}

async function purgePastReservations() {
  return purgeExpiredReservations(Reservation);
}

async function hasReservedTimeOverlap(date, timeArray) {
  const now = new Date();
  const existingReservation = await Reservation.find({ date });
  for (const item of existingReservation) {
    if (isPastReservationEnd(item, now)) continue;
    const reservedTime = item.time.map(Number);
    for (const reqTime of timeArray) {
      if (reservedTime.includes(Number(reqTime))) return true;
    }
  }
  return false;
}

/**
 * 날짜·시간 형식 검증 (클라이언트 값을 그대로 믿지 않고 서버에서 한 번 더 확인)
 * @returns {{ ok: true, hours: number[] } | { ok: false, message: string }}
 */
function validateDateAndHours(date, time) {
  if (typeof date !== "string" || !DATE_KEY_RE.test(date)) {
    return { ok: false, message: "날짜 형식이 올바르지 않습니다." };
  }
  if (date < todayKeyKst()) {
    return { ok: false, message: "지난 날짜는 예약할 수 없습니다." };
  }
  if (!Array.isArray(time) || time.length === 0 || time.length > 24) {
    return { ok: false, message: "예약할 시간을 선택해 주세요." };
  }
  const hours = [...new Set(time.map(Number))].sort((a, b) => a - b);
  if (hours.some((h) => !Number.isInteger(h) || h < 0 || h > 23)) {
    return { ok: false, message: "시간 형식이 올바르지 않습니다." };
  }
  for (let i = 1; i < hours.length; i++) {
    if (hours[i] !== hours[i - 1] + 1) {
      return { ok: false, message: "연속된 시간만 예약할 수 있습니다." };
    }
  }
  return { ok: true, hours };
}

function parseHeadcount(headcount) {
  const hc =
    headcount !== undefined && headcount !== null && headcount !== ""
      ? Number(headcount)
      : 1;
  if (!Number.isInteger(hc) || hc < 1 || hc > 99) return null;
  return hc;
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

    const { date, teamName, time, headcount } = req.body || {};

    const team = validateTeamName(teamName);
    if (!team.ok) {
      return res.status(400).json({ message: team.message });
    }

    const slot = validateDateAndHours(date, time);
    if (!slot.ok) {
      return res.status(400).json({ message: slot.message });
    }

    const hc = parseHeadcount(headcount);
    if (hc === null) {
      return res.status(400).json({ message: "인원수는 1~99 사이로 입력해 주세요." });
    }

    await purgePastReservations();

    if (bookingType === "general") {
      const quotaCheck = await assertCanCreateGeneralReservation(userId);
      if (!quotaCheck.ok) {
        return res.status(403).json({ message: quotaCheck.message });
      }
    }

    if (await hasReservedTimeOverlap(date, slot.hours)) {
      return res
        .status(409)
        .json({ message: "해당 시간은 이미 예약 되었습니다." });
    }

    const reservation = new Reservation({
      date,
      teamName: team.name,
      time: slot.hours,
      userId,
      headcount: hc,
      bookingType,
    });
    await reservation.save();
    res.status(201).json({
      message: "예약이 완료되었습니다.",
      reservationId: reservation._id,
      reservation: {
        _id: reservation._id,
        date: reservation.date,
        time: reservation.time,
        teamName: reservation.teamName,
        headcount: reservation.headcount,
        bookingType: reservation.bookingType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "서버 오류가 발생하였습니다." });
  }
}

function sortByDateThenStart(list) {
  return list.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const minA = Math.min(...(a.time || []).map(Number));
    const minB = Math.min(...(b.time || []).map(Number));
    return minA - minB;
  });
}

/** 공개 목록용: 연락처·계정 정보 제외 */
function toPublicReservation(doc) {
  const legacyName =
    doc.userId && typeof doc.userId === "object" ? doc.userId.username : null;
  return {
    _id: doc._id,
    date: doc.date,
    time: doc.time,
    headcount: doc.headcount,
    teamName: doc.teamName || legacyName || null,
    bookingType: doc.bookingType,
  };
}

/** 일반 예약 (로그인 필요) */
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
    const now = new Date();
    const list = filterActiveForUserDisplay(
      await Reservation.find().populate("userId", "username").lean(),
      now,
    );
    res.json(sortByDateThenStart(list).map(toPublicReservation));
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 공개: 링크로 열람 (로그인 불필요) */
router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
    }
    const doc = await Reservation.findById(id)
      .populate("userId", "username")
      .lean();
    if (!doc) {
      return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
    }
    if (isRetentionExpired(doc)) {
      await Reservation.findByIdAndDelete(id);
      return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
    }
    res.json(toPublicReservation(doc));
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 내 예약 (예약 페이지·마이페이지·홈 표시용) */
router.get("/mine", async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    await purgePastReservations();
    const now = new Date();
    /** 일반 예약만: 종료 시각이 지난 건은 UI에 노출하지 않음 (DB에는 2일 보관) */
    const list = filterActiveForUserDisplay(
      await Reservation.find({
        userId,
        bookingType: { $ne: "admin" },
      }).lean(),
      now,
    );
    const quota = await getQuotaForUser(userId);
    res.json({
      reservations: sortByDateThenStart(list),
      quota: {
        limit: quota.limit,
        count: quota.count,
        customLimit: quota.customLimit,
        usesDefault: quota.usesDefault,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 예약 건수 제한(기본·회원별) 조회 */
router.get("/admin/limits", requireExecutive, async (req, res) => {
  try {
    await purgePastReservations();
    const payload = await buildAdminLimitsPayload();
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 계정당 기본 예약 건수 제한 */
router.put("/admin/limits/default", requireExecutive, async (req, res) => {
  try {
    const parsed = parseRequiredLimit(req.body?.limit);
    if (parsed === null) {
      return res
        .status(400)
        .json({ message: "기본 제한은 0~99 사이 정수로 입력해 주세요." });
    }
    const result = await setDefaultReservationLimit(parsed);
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }
    res.json({
      message: "기본 예약 제한이 저장되었습니다.",
      defaultLimit: result.limit,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 회원별 예약 건수 제한 (null/생략 시 기본값) */
router.patch("/admin/limits/users/:userId", requireExecutive, async (req, res) => {
  try {
    const { userId } = req.params;
    const hasLimit = Object.prototype.hasOwnProperty.call(req.body, "limit");
    const raw = hasLimit ? req.body.limit : undefined;
    if (!hasLimit) {
      return res.status(400).json({ message: "limit 값이 필요합니다." });
    }
    const useDefault =
      raw === null || raw === undefined || raw === "" || raw === "default";
    const result = await setUserReservationLimit(
      userId,
      useDefault ? null : raw,
    );
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }
    const count = await countGeneralReservations(userId);
    res.json({
      message: "회원별 예약 제한이 저장되었습니다.",
      customLimit: result.customLimit,
      effectiveLimit: result.effectiveLimit,
      currentCount: count,
    });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 전체 예약 목록 (예약자 정보 포함) */
router.get("/admin/list", requireExecutive, async (req, res) => {
  try {
    await purgePastReservations();
    const now = new Date();
    const raw = filterActiveForAdminDisplay(
      await Reservation.find()
        .populate("userId", "username Identification email position")
        .lean(),
      now,
    );
    res.json(sortByDateThenStart(raw));
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

/** 임원진: 보관 기간(예약 종료 후 2일)이 지난 예약 일괄 삭제 */
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

/**
 * 예약 취소: 본인 예약만 허용
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "해당 예약을 찾을 수 없습니다." });
    }
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "해당 예약을 찾을 수 없습니다." });
    }
    if (reservation.bookingType === "admin") {
      return res.status(403).json({
        message: "관리자 예약은 관리 화면에서만 취소할 수 있습니다.",
      });
    }

    const userId = getUserIdFromReq(req);
    const isOwner =
      Boolean(userId) &&
      Boolean(reservation.userId) &&
      String(reservation.userId) === String(userId);

    if (!isOwner) {
      return res.status(403).json({
        message: "본인의 예약만 취소할 수 있습니다.",
      });
    }
    await Reservation.findByIdAndDelete(id);
    res.json({ message: "예약이 삭제되었습니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

module.exports = router;
