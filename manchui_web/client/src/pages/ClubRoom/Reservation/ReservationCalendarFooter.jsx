import React from "react";
import { LOADING_TEXT } from "../../../constants/loadingText";

export default function ReservationCalendarFooter({
  loading,
  hint,
  onToday,
}) {
  return (
    <div className="reservation__calendarFooter">
      {loading ? (
        <p className="reservation__calendarLoadingHint" aria-live="polite">
          {LOADING_TEXT}
        </p>
      ) : (
        <p className="reservation__hint">{hint}</p>
      )}
      <button
        type="button"
        className="reservation__todayBtn"
        onClick={onToday}
        disabled={loading}
        aria-label="오늘 날짜가 있는 달로 이동"
      >
        오늘로
      </button>
    </div>
  );
}
