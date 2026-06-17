import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IoReaderOutline } from "react-icons/io5";
import { CLUB_ROOM_RULES_ITEMS } from "./clubRoomRulesContent";
import "./Reservation.css";

/**
 * 이용 수칙 열기 버튼 + 모달
 * @param {{ inline?: boolean }} props — `inline`: 제목 옆 등 한 줄 배치용
 */
export default function ClubRoomRulesBar({ inline = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`reservation__rulesBar${inline ? " reservation__rulesBar--inline" : ""}`}
      >
        <button
          type="button"
          className="reservation__rulesOpenBtn"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <IoReaderOutline className="reservation__rulesOpenIcon" aria-hidden />
          동아리방 이용 수칙
        </button>
      </div>
      {open ? (
        <ClubRoomRulesModalInner onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function ClubRoomRulesModalInner({ onClose }) {
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

  return createPortal(
    <div
      className="reservation__rulesRoot"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="reservation__rulesDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-rules-title"
      >
        <h2 id="reservation-rules-title" className="reservation__rulesTitle">
          동아리방 이용 수칙
        </h2>
        <ul className="reservation__rulesList">
          {CLUB_ROOM_RULES_ITEMS.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <button
          type="button"
          className="reservation__rulesOkBtn"
          onClick={onClose}
        >
          확인
        </button>
      </div>
    </div>,
    document.body,
  );
}
