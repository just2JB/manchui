const Setting = require("../models/Setting");
const User = require("../models/User");
const Reservation = require("../models/Reservation");
const { isPastReservationEnd } = require("./reservationRetention");

const DEFAULT_RESERVATION_LIMIT = 3;
const MIN_LIMIT = 0;
const MAX_LIMIT = 99;

async function ensureSetting() {
  let setting = await Setting.findOne();
  if (!setting) {
    setting = await Setting.create({ joinForm: 0, currentGeneration: 1 });
  }
  return setting;
}

function clampLimit(n) {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return null;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, x));
}

/** 기본값 설정용: 0~99 정수만 허용 */
function parseRequiredLimit(value) {
  const parsed = clampLimit(value);
  if (parsed === null) return null;
  return parsed;
}

/** 사용자별 null/빈 값 = 기본값 사용 */
function parseOptionalUserLimit(value) {
  if (value === null || value === undefined || value === "") return null;
  return clampLimit(value);
}

async function getDefaultReservationLimit() {
  const setting = await ensureSetting();
  const n = setting.defaultReservationLimitPerUser;
  if (n === null || n === undefined) return DEFAULT_RESERVATION_LIMIT;
  return clampLimit(n) ?? DEFAULT_RESERVATION_LIMIT;
}

async function setDefaultReservationLimit(limit) {
  const parsed = parseRequiredLimit(limit);
  if (parsed === null) {
    return { ok: false, message: "기본 제한은 0~99 사이 정수로 입력해 주세요." };
  }
  const setting = await ensureSetting();
  setting.defaultReservationLimitPerUser = parsed;
  await setting.save();
  return { ok: true, limit: parsed };
}

async function resolveUserReservationLimit(userDocOrId) {
  const defaultLimit = await getDefaultReservationLimit();
  let user = userDocOrId;
  if (!user || typeof user === "string" || user._id) {
    const id =
      user && typeof user === "object" && user._id ? user._id : userDocOrId;
    if (!id) return defaultLimit;
    user = await User.findById(id).select("reservationLimit").lean();
  }
  if (!user) return defaultLimit;
  const custom = user.reservationLimit;
  if (custom === null || custom === undefined) return defaultLimit;
  return clampLimit(custom) ?? defaultLimit;
}

/** 일반 예약 중 아직 종료되지 않은 건만 (건수 제한에 포함) */
async function countGeneralReservations(userId) {
  const list = await Reservation.find({
    userId,
    bookingType: { $ne: "admin" },
  })
    .select("date time")
    .lean();

  const now = new Date();
  return list.filter((r) => !isPastReservationEnd(r, now)).length;
}

async function assertCanCreateGeneralReservation(userId) {
  const limit = await resolveUserReservationLimit(userId);
  const count = await countGeneralReservations(userId);
  if (count >= limit) {
    return {
      ok: false,
      limit,
      count,
      message: `한 계정당 예약은 최대 ${limit}건까지 가능합니다.`,
    };
  }
  return { ok: true, limit, count };
}

async function getQuotaForUser(userId) {
  const limit = await resolveUserReservationLimit(userId);
  const count = await countGeneralReservations(userId);
  const user = await User.findById(userId).select("reservationLimit").lean();
  const customLimit =
    user &&
    user.reservationLimit !== null &&
    user.reservationLimit !== undefined
      ? clampLimit(user.reservationLimit)
      : null;
  return {
    limit,
    count,
    customLimit,
    usesDefault: customLimit === null,
  };
}

async function buildAdminLimitsPayload() {
  const defaultLimit = await getDefaultReservationLimit();
  const members = await User.find({})
    .select("username Identification email reservationLimit")
    .sort({ username: 1 })
    .lean();

  const generalReservations = await Reservation.find({
    bookingType: { $ne: "admin" },
  })
    .select("userId date time")
    .lean();

  const now = new Date();
  const countByUserId = new Map();
  for (const r of generalReservations) {
    if (isPastReservationEnd(r, now)) continue;
    const id = String(r.userId);
    countByUserId.set(id, (countByUserId.get(id) || 0) + 1);
  }

  const users = members.map((m) => {
    const id = String(m._id);
    const customLimit =
      m.reservationLimit === null || m.reservationLimit === undefined
        ? null
        : clampLimit(m.reservationLimit);
    const effectiveLimit =
      customLimit !== null ? customLimit : defaultLimit;
    return {
      _id: m._id,
      username: m.username,
      Identification: m.Identification ?? "",
      email: m.email ?? "",
      customLimit,
      effectiveLimit,
      currentCount: countByUserId.get(id) ?? 0,
    };
  });

  return { defaultLimit, users };
}

async function setUserReservationLimit(userId, limitInput) {
  const user = await User.findById(userId);
  if (!user) {
    return { ok: false, message: "사용자를 찾을 수 없습니다." };
  }
  if (limitInput === null || limitInput === undefined || limitInput === "") {
    user.reservationLimit = null;
    await user.save();
    const effectiveLimit = await resolveUserReservationLimit(user);
    return { ok: true, customLimit: null, effectiveLimit };
  }
  const parsed = parseOptionalUserLimit(limitInput);
  if (parsed === null) {
    return {
      ok: false,
      message: "개별 제한은 0~99 사이 정수이거나, 비우면 기본값을 따릅니다.",
    };
  }
  user.reservationLimit = parsed;
  await user.save();
  const effectiveLimit = await resolveUserReservationLimit(user);
  return { ok: true, customLimit: parsed, effectiveLimit };
}

module.exports = {
  DEFAULT_RESERVATION_LIMIT,
  MIN_LIMIT,
  MAX_LIMIT,
  getDefaultReservationLimit,
  setDefaultReservationLimit,
  resolveUserReservationLimit,
  countGeneralReservations,
  assertCanCreateGeneralReservation,
  getQuotaForUser,
  buildAdminLimitsPayload,
  setUserReservationLimit,
  parseRequiredLimit,
  parseOptionalUserLimit,
};
