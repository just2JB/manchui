import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IoCloseOutline } from "react-icons/io5";
import PollRecommendations from "./PollRecommendations";
import "./Poll.css";

/**
 * 팀장: '연습 추가' 바텀시트.
 * 일정 종합의 추천 연습시간(바로 만들기) + 그리드에서 직접 시간 정하기.
 */
export default function PollPracticeSheet({ open, poll, teamId, pendingMembers = [], onClose }) {
  const nav = useNavigate();

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

  if (!open || !poll) return null;

  return createPortal(
    <div className="pollSheet" role="presentation">
      <button type="button" className="pollSheet__backdrop" aria-label="닫기" tabIndex={-1} onClick={onClose} />
      <div className="pollSheet__panel" role="dialog" aria-modal="true" aria-labelledby="poll-sheet-title">
        <div className="pollSheet__head">
          <span className="pollSheet__handle" aria-hidden="true" />
          <h2 id="poll-sheet-title" className="pollSheet__title">
            연습 추가
          </h2>
          <button type="button" className="pollSheet__close" onClick={onClose} aria-label="닫기">
            <IoCloseOutline aria-hidden />
          </button>
        </div>
        <div className="pollSheet__body">
          <PollRecommendations poll={poll} teamId={teamId} pendingMembers={pendingMembers} />
          <button
            type="button"
            className="pollSheet__manual"
            onClick={() => nav(`/club/team/${teamId}/practice/new?poll=${encodeURIComponent(poll._id)}`)}
          >
            직접 시간 정하기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
