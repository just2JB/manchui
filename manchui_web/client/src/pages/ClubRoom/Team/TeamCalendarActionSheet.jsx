import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { IoAdd } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import "../Home/ClubHome.css";
import {
  buildPracticeByDate,
  buildPracticeCreateSearch,
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
} from "./teamCalendarUtils";

function formatDateSummary(dates) {
  if (!dates?.length) return "";
  if (dates.length === 1) return formatUpcomingPracticeDate(dates[0]);
  return `${formatUpcomingPracticeDate(dates[0])} – ${formatUpcomingPracticeDate(dates[dates.length - 1])} (${dates.length}일)`;
}

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

const TeamCalendarActionSheet = ({
  open,
  mode,
  dates = [],
  teamId,
  isLeader = false,
  practices = [],
  accentColor = "#E87070",
  requestSet,
  onClose,
  onPracticeClick,
}) => {
  const nav = useNavigate();
  const ignoreBackdropCloseRef = useRef(false);

  const practiceByDate = useMemo(
    () => buildPracticeByDate(practices),
    [practices],
  );

  useEffect(() => {
    if (!open) return undefined;
    ignoreBackdropCloseRef.current = true;
    const id = window.setTimeout(() => {
      ignoreBackdropCloseRef.current = false;
    }, 350);
    return () => window.clearTimeout(id);
  }, [open, dates]);

  if (!open || dates.length === 0) return null;

  const handleBackdropClose = () => {
    if (ignoreBackdropCloseRef.current) return;
    onClose();
  };

  const isRange = mode === "range";
  const isSingle = !isRange && dates.length === 1;
  const selectedDate = isSingle ? dates[0] : null;
  const dayPractices = selectedDate
    ? (practiceByDate.get(selectedDate) ?? [])
    : [];

  const pollDateCount = dates.filter((date) => requestSet?.has(date)).length;

  const handleCreatePoll = () => {
    const query = buildPracticeCreateSearch(dates);
    if (!query) return;
    onClose();
    nav(`/club/team/${teamId}/poll/new?${query}`);
  };

  const handleCreatePractice = () => {
    if (dates.length === 0) return;
    const query = buildPracticeCreateSearch(dates);
    if (!query) return;
    onClose();
    nav(`/club/team/${teamId}/practice/new?${query}`);
  };

  const handleOpenPracticeEdit = (practice) => {
    onPracticeClick?.(practice);
    onClose();
  };

  const renderPracticeCard = (practice, index) => {
    const cardKey =
      practice._id ?? `${selectedDate}-${practice.time}-${index}`;
    const cardContent = (
      <>
        <span className="teamCalSheet__practiceTime">
          {formatPracticeTimeDisplay(practice.time)}
        </span>
        <span className="teamCalSheet__practicePlace">
          {formatPlace(practice.place)}
        </span>
      </>
    );

    if (isLeader) {
      return (
        <li key={cardKey}>
          <button
            type="button"
            className="teamCalSheet__practiceCard teamCalSheet__practiceCard--clickable"
            onClick={() => handleOpenPracticeEdit(practice)}
            aria-label={`${formatPracticeTimeDisplay(practice.time)} 연습 편집`}
          >
            {cardContent}
          </button>
        </li>
      );
    }

    return (
      <li key={cardKey} className="teamCalSheet__practiceCard">
        {cardContent}
      </li>
    );
  };

  return createPortal(
    <div className="teamCalSheet__root" role="presentation">
      <button
        type="button"
        className="teamCalSheet__backdrop"
        aria-label="닫기"
        onPointerDown={(event) => event.preventDefault()}
        onClick={handleBackdropClose}
      />
      <div
        className="teamCalSheet"
        style={{ "--team-accent": accentColor }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-cal-sheet-title"
      >
        <div className="teamCalSheet__handleWrap">
          <span className="teamCalSheet__handle" aria-hidden />
        </div>
        <h2 id="team-cal-sheet-title" className="teamCalSheet__title">
          {formatDateSummary(dates)}
        </h2>
        {pollDateCount > 0 ? (
          <p className="teamCalSheet__hint">
            {pollDateCount === dates.length
              ? "일정 종합이 진행 중인 날짜예요."
              : `${pollDateCount}일은 이미 일정 종합이 진행 중이에요.`}
          </p>
        ) : null}

        {isSingle ? (
          <div className="teamCalSheet__practiceSection">
            <p className="teamCalSheet__sectionLabel">연습</p>
            {dayPractices.length > 0 ? (
              <div className="teamCalSheet__practiceTrackWrap">
                <ul
                  className="teamCalSheet__practiceTrack"
                  aria-label={`${formatDateSummary(dates)} 연습`}
                >
                  {dayPractices.map((practice, index) =>
                    renderPracticeCard(practice, index),
                  )}
                  {isLeader ? (
                    <li>
                      <button
                        type="button"
                        className="teamCalSheet__practiceCard teamCalSheet__practiceCard--add"
                        onClick={handleCreatePractice}
                      >
                        <IoAdd
                          className="teamCalSheet__practiceAddIcon"
                          aria-hidden
                        />
                        <span className="teamCalSheet__practiceAddLabel">
                          연습 추가
                        </span>
                      </button>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : isLeader ? (
              <div className="teamCalSheet__practiceTrackWrap">
                <ul
                  className="teamCalSheet__practiceTrack"
                  aria-label={`${formatDateSummary(dates)} 연습`}
                >
                  <li>
                    <button
                      type="button"
                      className="teamCalSheet__practiceCard teamCalSheet__practiceCard--add"
                      onClick={handleCreatePractice}
                    >
                      <IoAdd
                        className="teamCalSheet__practiceAddIcon"
                        aria-hidden
                      />
                      <span className="teamCalSheet__practiceAddLabel">
                        연습 추가
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <p className="teamCalSheet__practiceEmpty">
                등록된 연습이 없습니다.
              </p>
            )}
          </div>
        ) : null}

        {isLeader && !isSingle ? (
          <div className="teamCalSheet__practiceSection teamCalSheet__practiceSection--range">
            <p className="teamCalSheet__sectionLabel">연습</p>
            <button
              type="button"
              className="teamCalSheet__action teamCalSheet__action--practice"
              onClick={handleCreatePractice}
            >
              연습 추가
              {dates.length > 1 ? ` (${dates.length}일)` : ""}
            </button>
          </div>
        ) : null}

        {isLeader ? (
          <div className="teamCalSheet__actions">
            <button
              type="button"
              className="teamCalSheet__action teamCalSheet__action--primary"
              onClick={handleCreatePoll}
            >
              이 날짜로 일정 종합 만들기
              {dates.length > 1 ? ` (${dates.length}일)` : ""}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
};

export default TeamCalendarActionSheet;
