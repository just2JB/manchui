import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatReservationTimeRange } from "./reservationTimeFormat";
import { getReservationBookerName } from "./reservationLookup";
import "./Reservation.css";

export default function ReservedSlotDetailModal({ reservation, onClose }) {
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
  const contact = reservation.agentId?.trim() || "—";
  const headcount =
    reservation.headcount != null ? `${reservation.headcount}명` : "—";

  return createPortal(
    <div
      className="reservation__detailRoot"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="reservation__detailDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserved-slot-detail-title"
      >
        <h2 id="reserved-slot-detail-title" className="reservation__detailTitle">
          예약 정보
        </h2>
        <dl className="reservation__detailList">
          <div className="reservation__detailRow">
            <dt>날짜</dt>
            <dd>{reservation.date ?? "—"}</dd>
          </div>
          <div className="reservation__detailRow">
            <dt>시간</dt>
            <dd>{timeStr}</dd>
          </div>
          <div className="reservation__detailRow">
            <dt>예약자</dt>
            <dd>{name}</dd>
          </div>
          <div className="reservation__detailRow">
            <dt>연락처</dt>
            <dd>{contact}</dd>
          </div>
          <div className="reservation__detailRow">
            <dt>인원</dt>
            <dd>{headcount}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="reservation__detailOkBtn"
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>,
    document.body,
  );
}
