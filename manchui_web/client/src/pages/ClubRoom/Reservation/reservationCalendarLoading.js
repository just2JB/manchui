/** 예약 일정 로드 중 캘린더 셀·그리드용 클래스 */
export function calendarGridLoadingClass(loading) {
  return loading ? " reservation__dayGrid--loading" : "";
}

export function calendarDayLoadingClass(loading) {
  return loading ? " reservation__day--loading" : "";
}
