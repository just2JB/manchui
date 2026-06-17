/** 예약 종료 후 백엔드 보관 일수 (server/utils/reservationRetention.js 와 동일) */
export const RETENTION_DAYS_AFTER_END = 2;

/**
 * @param {{ date?: string, time?: unknown[] }} reservation
 * @returns {Date | null}
 */
export function getReservationEndAt(reservation) {
  const { date, time } = reservation || {};
  if (!date || !Array.isArray(time) || time.length === 0) return null;

  const nums = time.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return null;

  const endHour = Math.max(...nums) + 1;
  const [y, m, d] = String(date).split("-").map(Number);
  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d, endHour, 0, 0, 0);
}

function getRetentionExpiresAt(reservation) {
  const endAt = getReservationEndAt(reservation);
  if (!endAt) return null;

  const expires = new Date(endAt);
  expires.setDate(expires.getDate() + RETENTION_DAYS_AFTER_END);
  return expires;
}

/** 예약 종료 시각이 지났는지 */
export function isPastReservationEnd(reservation, now = new Date()) {
  const endAt = getReservationEndAt(reservation);
  if (!endAt) return false;
  return now.getTime() > endAt.getTime();
}

/** 백엔드 보관 기간(종료 후 2일)이 지났는지 — 관리자 화면용 */
export function isRetentionExpired(reservation, now = new Date()) {
  const expiresAt = getRetentionExpiresAt(reservation);
  if (!expiresAt) return true;
  return now.getTime() > expiresAt.getTime();
}

/** 사용자 화면에 보여줄 예약 (종료 즉시 숨김) */
export function filterVisibleReservations(reservations, now = new Date()) {
  if (!Array.isArray(reservations)) return [];
  return reservations.filter((r) => !isPastReservationEnd(r, now));
}

/** 관리자 화면 (종료 후 2일까지 표시) */
export function filterAdminVisibleReservations(reservations, now = new Date()) {
  if (!Array.isArray(reservations)) return [];
  return reservations.filter((r) => !isRetentionExpired(r, now));
}

/** 예약 건수 제한에 포함되는 일반 예약 수 */
export function countActiveReservations(reservations, now = new Date()) {
  return filterVisibleReservations(reservations, now).length;
}

/** 캘린더 시간 칸 점유 판단용 */
export function isReservationBlockingHours(reservation, now = new Date()) {
  return !isPastReservationEnd(reservation, now);
}

export function collectReservedHoursForDate(dateKey, reservations, now = new Date()) {
  const set = new Set();
  if (!dateKey || !Array.isArray(reservations)) return set;

  for (const r of reservations) {
    if (r.date !== dateKey || !Array.isArray(r.time)) continue;
    if (!isReservationBlockingHours(r, now)) continue;
    for (const t of r.time) {
      set.add(Number(t));
    }
  }
  return set;
}
