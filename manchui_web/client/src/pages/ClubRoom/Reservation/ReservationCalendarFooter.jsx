import React from "react";
import { LoadingHint } from "../../../components/Loading/Loading";

export default function ReservationCalendarFooter({
  loading,
  hint,
  onToday,
  isViewingTodayMonth = false,
}) {
  return (
    <div className="reservation__calendarFooter">
      {loading ? (
        <LoadingHint className="reservation__calendarLoadingHint" />
      ) : (
        <p className="reservation__hint">{hint}</p>
      )}
      {!isViewingTodayMonth ? (
        <button
          type="button"
          className="reservation__todayBtn"
          onClick={onToday}
          disabled={loading}
          aria-label="오늘 날짜가 있는 달로 이동"
        >
          오늘로
        </button>
      ) : null}
    </div>
  );
}
