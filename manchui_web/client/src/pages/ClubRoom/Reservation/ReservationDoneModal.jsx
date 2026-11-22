import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useClubRoomRules } from "./clubRoomRulesContent";
import "./Reservation.css";

/**
 * 예약 완료 창: 예약 요약 + 동아리방 이용 수칙.
 * 위치 안내는 선택 — '위치 안내' 버튼을 누를 때만 연다(onShowLocation).
 * 이용 수칙 모달(ClubRoomRulesBar)과 같은 틀(.reservation__rules*)을 쓴다.
 */
export default function ReservationDoneModal({ info, onClose, onShowLocation }) {
  const rules = useClubRoomRules();
  useEffect(() => {
    if (!info) return undefined;
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
  }, [info, onClose]);

  if (!info) return null;

  return createPortal(
    <div
      className="reservation__rulesRoot"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="reservation__rulesDialog reservation__doneDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-done-title"
      >
        <h2 id="reservation-done-title" className="reservation__rulesTitle">
          예약이 완료되었어요
        </h2>
        <dl className="reservation__doneSummary">
          <div>
            <dt>날짜</dt>
            <dd>{info.date}</dd>
          </div>
          <div>
            <dt>시간</dt>
            <dd>{info.time}</dd>
          </div>
          <div>
            <dt>팀</dt>
            <dd>{info.team}</dd>
          </div>
        </dl>

        <h3 className="reservation__doneRulesTitle">동아리방 이용 수칙</h3>
        <ul className="reservation__rulesList">
          {rules.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <div className="reservation__doneActions">
          <button
            type="button"
            className="reservation__doneLocationBtn"
            onClick={onShowLocation}
          >
            위치 안내
          </button>
          <button
            type="button"
            className="reservation__rulesOkBtn"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
