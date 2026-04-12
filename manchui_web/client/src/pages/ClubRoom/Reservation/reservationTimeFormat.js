/**
 * 예약 time 배열을 "n시~m시" 형식으로 표시합니다.
 */
export function formatReservationTimeRange(timeArr) {
  if (!Array.isArray(timeArr) || timeArr.length === 0) return "—";
  const nums = timeArr.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return "—";
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return `${lo}시~${hi}시`;
}
