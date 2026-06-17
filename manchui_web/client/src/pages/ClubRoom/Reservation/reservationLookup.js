/** dateKey·hour에 해당하는 예약 1건 (없으면 null) */
export function findReservationForHour(dateKey, hour, reservations) {
  if (!dateKey || !Array.isArray(reservations)) return null;
  const h = Number(hour);
  return (
    reservations.find(
      (r) =>
        r.date === dateKey &&
        Array.isArray(r.time) &&
        r.time.map(Number).includes(h),
    ) ?? null
  );
}

export function getReservationBookerName(reservation) {
  const u = reservation?.userId;
  if (u && typeof u === "object" && u.username) return u.username;
  return "—";
}

/**
 * 시간 칸 UI 상태 (예약됨 / 지난 시간 / 선택 가능)
 */
export function getHourSlotState(h, {
  reservedOnSelected,
  selectedDateKey,
  todayKey,
  canCreateReservation,
}) {
  const reserved = reservedOnSelected.has(h);
  const pastOnly =
    selectedDateKey === todayKey && h <= new Date().getHours();
  const visuallyBlocked = reserved || pastOnly;
  const disabled =
    (pastOnly && !reserved) || (!reserved && !canCreateReservation);
  return { reserved, visuallyBlocked, disabled };
}
