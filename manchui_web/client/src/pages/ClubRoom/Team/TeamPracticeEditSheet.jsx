import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import apiClient from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
  normalizeDateKey,
} from "./teamCalendarUtils";

function practiceMemberIds(members) {
  return (Array.isArray(members) ? members : []).map((member) =>
    String(member?._id ?? member),
  );
}

function initialPlaceValue(place) {
  const value = String(place ?? "").trim();
  return value === "미확정" ? "" : value;
}

const TeamPracticeEditSheet = ({
  open,
  practice,
  accentColor = "#E87070",
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
        <h2 id="team-practice-edit-title" className="teamCalSheet__title">
          연습 편집
        </h2>
        <p className="teamPracticeEdit__meta">
          {dateLabel} · {timeLabel}
        </p>

        <div className="teamPracticeEdit__form">
          <label className="teamForm__field" htmlFor="team-practice-place">
            <span className="teamForm__label">연습 장소</span>
            <input
              id="team-practice-place"
              type="text"
              className="teamForm__input"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="예: 동아리방, 00홀"
              autoComplete="off"
              disabled={busy}
            />
          </label>
          <p className="teamForm__hint">
            비워 두면 「미확정」으로 표시됩니다.
          </p>
        </div>

        <div className="teamPracticeEdit__actions">
          <button
            type="button"
            className="teamCalSheet__action teamCalSheet__action--cancel"
            onClick={onClose}
            disabled={busy}
          >
            취소
          </button>
          <button
            type="button"
            className="teamCalSheet__action teamCalSheet__action--primary"
            onClick={() => void handleSave()}
            disabled={busy}
          >
            {busy ? "처리 중…" : "저장"}
          </button>
        </div>

        <div className="teamPracticeEdit__danger">
          <button
            type="button"
            className="teamPracticeEdit__deleteBtn"
            onClick={() => void handleDelete()}
            disabled={busy}
          >
            연습 삭제
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TeamPracticeEditSheet;
