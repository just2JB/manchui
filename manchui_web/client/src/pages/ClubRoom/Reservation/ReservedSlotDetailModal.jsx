import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatReservationTimeRange } from "./reservationTimeFormat";
import { getReservationBookerName } from "./reservationLookup";
import "./Reservation.css";
import "./ReservedSlotDetailModal.css";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-11-21" → "11월 21일 (토)" */
function formatDate(dateKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateKey ?? ""));
  if (!m) return dateKey ?? "—";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
}

/**
 * 예약 정보 창: 팀 이름이 제목, 시간을 크게, 날짜·인원·표시(내 예약/임원진),
 * 아래에 하루 24시간 막대에서 이 예약이 차지한 구간.
 */
export default function ReservedSlotDetailModal({ reservation, mine = false, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!reservation) return null;

  const name = getReservationBookerName(reservation);
  const timeStr = formatReservationTimeRange(reservation.time);
  const hours = (reservation.time ?? []).map(Number).filter((n) => !Number.isNaN(n));
  const start = hours.length ? Math.min(...hours) : null;
  const end = hours.length ? Math.max(...hours) + 1 : null;
  const isAdmin = reservation.bookingType === "admin";

  return createPortal(
    <div
      className="reservation__detailRoot"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="reservation__detailDialog slotDetail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserved-slot-detail-title"
      >
        <p className="slotDetail__date">{formatDate(reservation.date)}</p>
        <h2 id="reserved-slot-detail-title" className="slotDetail__team">
          {name}
        </h2>
        <p className="slotDetail__time">{timeStr}</p>

        <div className="slotDetail__tags">
          {reservation.headcount != null ? (
            <span className="slotDetail__tag">{reservation.headcount}명</span>
          ) : null}
          {mine ? <span className="slotDetail__tag slotDetail__tag--mine">내 예약</span> : null}
          {isAdmin ? <span className="slotDetail__tag">임원진</span> : null}
        </div>

        {start != null ? (
          <div className="slotDetail__day" aria-hidden="true">
            <div className="slotDetail__bar">
              <span
                className="slotDetail__fill"
                data-mine={mine || undefined}
                style={{ left: `${(start / 24) * 100}%`, width: `${((end - start) / 24) * 100}%` }}
              />
            </div>
            <div className="slotDetail__ticks">
              <span>0</span>
              <span>6</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
          </div>
        ) : null}

        <button type="button" className="reservation__detailOkBtn slotDetail__ok" onClick={onClose}>
          확인
        </button>
      </div>
    </div>,
    document.body,
  );
}
