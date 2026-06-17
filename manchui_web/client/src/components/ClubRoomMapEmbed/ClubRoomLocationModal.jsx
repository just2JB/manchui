import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import ClubRoomMapEmbed from "./ClubRoomMapEmbed";
import "./ClubRoomLocationModal.css";

const ClubRoomLocationModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;

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
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="clubRoomLocationModal__root"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="clubRoomLocationModal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-room-location-modal-title"
      >
        <h2
          id="club-room-location-modal-title"
          className="clubRoomLocationModal__title"
        >
          동아리방 위치
        </h2>
        <ClubRoomMapEmbed key="club-room-location-map" height={360} />
        <button
          type="button"
          className="clubRoomLocationModal__closeBtn"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default ClubRoomLocationModal;
