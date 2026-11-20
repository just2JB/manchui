import React, { useEffect, useMemo, useState } from "react";
import { IoCloseOutline, IoLocationOutline, IoTrashOutline } from "react-icons/io5";
import { createPortal } from "react-dom";
import apiClient from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import { getMemberDisplayName } from "./teamUtils";
import {
  formatDateKey,
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
  normalizeDateKey,
} from "./teamCalendarUtils";

function practiceMemberIds(members) {
  return (Array.isArray(members) ? members : []).map((member) =>
    String(member?._id ?? member),
  );
}

function formatDDay(dateKey) {
  if (!dateKey) return "";
  const today = new Date(formatDateKey(new Date()) + "T00:00");
  const diff = Math.round((new Date(dateKey + "T00:00") - today) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  return diff > 0 ? `D-${diff}` : "지난 연습";
}

function initialPlaceValue(place) {
  const value = String(place ?? "").trim();
  return value === "미확정" ? "" : value;
}

const TeamPracticeEditSheet = ({
  open,
  practice,
  accentColor = "#E87070",
  /** 팀 멤버 (참석 멤버 이름 표시용) */
  teamMembers = [],
  /** 이전에 쓴 장소 (빠른 선택) */
  placeSuggestions = [],
  onClose,
  onSaved,
  onDeleted,
}) => {
  const modal = useManchuiModal();
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !practice) return undefined;
    setPlace(initialPlaceValue(practice.place));
    const onKey = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, practice, busy, onClose]);

  const attendeeNames = useMemo(() => {
    if (!practice) return [];
    const nameById = new Map(
      teamMembers.map((member) => [String(member?._id ?? member), getMemberDisplayName(member)]),
    );
    const names = practiceMemberIds(practice.members)
      .map((id) => nameById.get(id))
      .filter(Boolean);
    const guests = (Array.isArray(practice.guestNames) ? practice.guestNames : []).filter(Boolean);
    return [...names, ...guests];
  }, [practice, teamMembers]);

  if (!open || !practice) return null;

  const dateKey = normalizeDateKey(practice.dateKey ?? practice.date);
  const dateLabel = dateKey ? formatUpcomingPracticeDate(dateKey) : "—";
  const timeLabel = formatPracticeTimeDisplay(practice.time);

  const handleSave = async () => {
    if (busy || !practice._id) return;

    const nextPlace = place.trim() || "미확정";
    setBusy(true);
    try {
      await apiClient.post(
        "/api/practice/edit",
        {
          practiceId: practice._id,
          time: practice.time,
          members: practiceMemberIds(practice.members),
          memberByHour: Array.isArray(practice.memberByHour)
            ? practice.memberByHour
            : [],
          place: nextPlace,
        },
        { withCredentials: true },
      );
      await modal("연습 정보를 저장했습니다.");
      onSaved?.({
        ...practice,
        place: nextPlace,
        date: practice.date ?? dateKey,
      });
      onClose();
    } catch (error) {
      await modal(error.response?.data?.message ?? "연습 수정에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy || !practice._id) return;

    const confirmed = await modal(
      `${dateLabel} ${timeLabel} 연습을 삭제할까요?`,
      "confirm",
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      await apiClient.delete(`/api/practice/${practice._id}`, {
        withCredentials: true,
      });
      await modal("연습을 삭제했습니다.");
      onDeleted?.(practice._id);
      onClose();
    } catch (error) {
      await modal(error.response?.data?.message ?? "연습 삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="teamCalSheet__root" role="presentation">
      <button
        type="button"
        className="teamCalSheet__backdrop"
        aria-label="닫기"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        className="teamCalSheet teamPracticeEdit"
        style={{ "--team-accent": accentColor }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-practice-edit-title"
      >
        <div className="teamCalSheet__handleWrap">
          <span className="teamCalSheet__handle" aria-hidden />
        </div>
        <div className="teamPracticeEdit__head">
          <h2 id="team-practice-edit-title" className="teamCalSheet__title">
            연습 편집
          </h2>
          <button
            type="button"
            className="teamPracticeEdit__close"
            onClick={onClose}
            disabled={busy}
            aria-label="닫기"
          >
            <IoCloseOutline aria-hidden />
          </button>
        </div>

        <div className="teamPracticeEdit__summary">
          <span className="teamPracticeEdit__summaryTop">
            <span>{dateLabel}</span>
            <span className="teamPracticeEdit__dday">{formatDDay(dateKey)}</span>
          </span>
          <span className="teamPracticeEdit__time">{timeLabel}</span>
          <span className="teamPracticeEdit__count">참석 {attendeeNames.length}명</span>
        </div>

        <div className="teamPracticeEdit__section">
          <label className="teamPracticeEdit__label" htmlFor="team-practice-place">
            장소
          </label>
          <div className="teamPracticeEdit__inputWrap">
            <IoLocationOutline className="teamPracticeEdit__inputIcon" aria-hidden />
            <input
              id="team-practice-place"
              type="text"
              className="teamPracticeEdit__input"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="비워 두면 미확정"
              autoComplete="off"
              disabled={busy}
            />
          </div>
          {placeSuggestions.length > 0 ? (
            <div className="teamPracticeEdit__chips" aria-label="최근 장소">
              {placeSuggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={[
                    "teamPracticeEdit__chip",
                    place.trim() === value ? "teamPracticeEdit__chip--on" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setPlace(value)}
                  disabled={busy}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {attendeeNames.length > 0 ? (
          <div className="teamPracticeEdit__section">
            <p className="teamPracticeEdit__label">참석 멤버</p>
            <ul className="teamPracticeEdit__members">
              {attendeeNames.map((name, index) => (
                <li key={`${name}-${index}`}>{name}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          className="teamPracticeEdit__save"
          onClick={() => void handleSave()}
          disabled={busy}
        >
          {busy ? "처리 중…" : "저장"}
        </button>
        <button
          type="button"
          className="teamPracticeEdit__deleteBtn"
          onClick={() => void handleDelete()}
          disabled={busy}
        >
          <IoTrashOutline aria-hidden />
          연습 삭제
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default TeamPracticeEditSheet;
