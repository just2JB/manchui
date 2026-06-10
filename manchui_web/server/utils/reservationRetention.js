/** 예약 종료 시각 이후 보관 일수 (이후 자동 삭제) */
const RETENTION_DAYS_AFTER_END = 2;

/**
 * @param {{ date?: string, time?: unknown[] }} reservation
 * @returns {Date | null} 예약 종료 시각 (마지막 슬롯 시작 + 1시)
 */
function getReservationEndAt(reservation) {
  const { date, time } = reservation || {};
  if (!date || !Array.isArray(time) || time.length === 0) return null;

  const nums = time.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;

  const endHour = Math.max(...nums) + 1;
  const [y, m, d] = String(date).split("-").map(Number);
  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d, endHour, 0, 0, 0);
}

/**
 * @param {{ date?: string, time?: unknown[] }} reservation
 * @returns {Date | null}
 */
function getRetentionExpiresAt(reservation) {
  const endAt = getReservationEndAt(reservation);
  if (!endAt) return null;

  const expires = new Date(endAt);
  expires.setDate(expires.getDate() + RETENTION_DAYS_AFTER_END);
  return expires;
}

/** 예약 종료 시각이 지났는지 (건수 제한·시간 중복 검사용) */
function isPastReservationEnd(reservation, now = new Date()) {
  const endAt = getReservationEndAt(reservation);
  if (!endAt) return false;
  return now.getTime() > endAt.getTime();
}

/** 보관 기간(종료 후 2일)이 지났는지 (삭제·조회 제외용) */
function isRetentionExpired(reservation, now = new Date()) {
  const expiresAt = getRetentionExpiresAt(reservation);
  if (!expiresAt) return true;
  return now.getTime() > expiresAt.getTime();
}

/** 사용자 화면·일반 API에 내려줄 예약 (종료 시각이 지나면 제외) */
function filterActiveForUserDisplay(reservations, now = new Date()) {
  if (!Array.isArray(reservations)) return [];
  return reservations.filter((r) => !isPastReservationEnd(r, now));
}

/** 관리자 화면에 내려줄 예약 (종료 후 2일까지 포함) */
function filterActiveForAdminDisplay(reservations, now = new Date()) {
  if (!Array.isArray(reservations)) return [];
  return reservations.filter((r) => !isRetentionExpired(r, now));
}

/** 보관 기간이 지난 예약 일괄 삭제 */
async function purgeExpiredReservations(Reservation) {
  const docs = await Reservation.find({}).select("_id date time").lean();
  const now = new Date();
  const ids = docs
    .filter((doc) => isRetentionExpired(doc, now))
    .map((doc) => doc._id);

  if (ids.length === 0) {
    return { deletedCount: 0 };
  }

  const result = await Reservation.deleteMany({ _id: { $in: ids } });
  return { deletedCount: result.deletedCount ?? 0 };
}

module.exports = {
  RETENTION_DAYS_AFTER_END,
  getReservationEndAt,
  getRetentionExpiresAt,
  isPastReservationEnd,
  isRetentionExpired,
  filterActiveForUserDisplay,
  filterActiveForAdminDisplay,
  purgeExpiredReservations,
};
