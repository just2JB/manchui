/** 시간 눈금 색: 0~12시 주황, 13~24시 흰색 */
export function hourLabelPeriodClass(labelHour) {
  const n = Number(labelHour);
  return n <= 12 ? "reservation__hourLabel--am" : "reservation__hourLabel--pm";
}

/** 슬롯 시각(0~23)이 오전 구간인지 */
export function isAmHourSlot(h) {
  return Number(h) < 12;
}

/**
 * 예약 time 배열(각 정시 슬롯의 시작 시각 0~23)을 "n시~m시"로 표시합니다.
 * 끝 시각은 마지막 슬롯 시작 + 1 (예: [14] → 14시~15시, [14,15] → 14시~16시).
 */
export function formatReservationTimeRange(timeArr) {
  if (!Array.isArray(timeArr) || timeArr.length === 0) return "—";
  const nums = timeArr.map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return "—";
  const start = Math.min(...nums);
  const end = Math.max(...nums) + 1;
  return `${start}시~${end}시`;
}
