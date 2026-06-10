import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoAdd } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import ClubHomeScheduleEditor from "../Home/ClubHomeScheduleEditor";
import { timesToHours } from "../Home/clubHomeUtils";
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
  teamName = "",
  isLeader = false,
  isMember = false,
  practices = [],
  scheduleMap,
  accentColor = "#E87070",
  requestSet,
  onClose,
  onScheduleSaved,
  onRequestSchedulesUpdated,
  onPracticeClick,
}) => {
  const nav = useNavigate();
  const modal = useManchuiModal();
  const [requesting, setRequesting] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const ignoreBackdropCloseRef = useRef(false);

  const practiceByDate = useMemo(
    () => buildPracticeByDate(practices),
    [practices],
  );

  useEffect(() => {
    if (!open) {
      setEditingSchedule(false);
      return undefined;
    }
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

  const pendingDates = dates.filter((date) => !requestSet.has(date));
  const alreadyRequested = dates.filter((date) => requestSet.has(date));

  const hasScheduleRequest =
    isMember &&
    !isLeader &&
    isSingle &&
    selectedDate &&
    requestSet.has(selectedDate);
  const hasSavedSchedule =
    hasScheduleRequest &&
    timesToHours(scheduleMap?.get(selectedDate)?.times).length > 0;
  const scheduleWriteLabel = hasSavedSchedule ? "일정 수정" : "일정 작성";

  const toggleRequestSchedules = async (targetDates, successMessage) => {
    if (requesting || targetDates.length === 0) return;

    setRequesting(true);
    try {
      let latestSchedules = null;
      for (const date of targetDates) {
        const res = await apiClient.post(
          "/api/team/request-schedule",
          { teamId, date },
          { withCredentials: true },
        );
        latestSchedules = res.data?.newRequestSchedules ?? latestSchedules;
      }
      await modal(successMessage);
      onRequestSchedulesUpdated?.(latestSchedules);
      onClose();
    } catch (error) {
      await modal(
        error.response?.data?.message ?? "일정 취합 요청 처리에 실패했습니다.",
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleRequestSchedule = () => {
    void toggleRequestSchedules(
      pendingDates,
      pendingDates.length === 1
        ? "일정 취합을 요청했습니다."
        : `${pendingDates.length}일에 일정 취합을 요청했습니다.`,
    );
  };

  const handleCancelRequestSchedule = () => {
    void toggleRequestSchedules(
      alreadyRequested,
      alreadyRequested.length === 1
        ? "일정 취합 요청을 취소했습니다."
        : `${alreadyRequested.length}일의 일정 취합 요청을 취소했습니다.`,
    );
  };

  const handleCreatePractice = () => {
    if (dates.length === 0) return;
    const query = buildPracticeCreateSearch(dates);
    if (!query) return;
    onClose();
    nav(`/club/team/${teamId}/practice/new?${query}`);
  };

  const handleOpenScheduleEditor = () => {
    setEditingSchedule(true);
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
    <>
    {!editingSchedule ? (
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
        {isLeader && alreadyRequested.length > 0 ? (
          <p className="teamCalSheet__hint">
            {alreadyRequested.length === dates.length
              ? "선택한 날짜는 모두 취합 요청 중입니다. 아래에서 요청을 취소할 수 있습니다."
              : `이미 요청 중인 날짜 ${alreadyRequested.length}일은 건너뜁니다.`}
          </p>
        ) : null}

        {hasScheduleRequest ? (
          <section
            className="teamCalSheet__requestSection"
            aria-labelledby="team-cal-request-label"
          >
            <p id="team-cal-request-label" className="teamCalSheet__sectionLabel">
              일정 취합 요청
            </p>
            <p className="teamCalSheet__requestHint">
              {teamName || "팀"}에서 이 날짜에 가능한 시간을 알려주세요.
            </p>
            <button
              type="button"
              className="teamCalSheet__writeBtn"
              onClick={handleOpenScheduleEditor}
            >
              {scheduleWriteLabel}
            </button>
          </section>
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
            {pendingDates.length > 0 ? (
              <button
                type="button"
                className="teamCalSheet__action teamCalSheet__action--primary"
                onClick={handleRequestSchedule}
                disabled={requesting}
              >
                {requesting ? "처리 중…" : "일정 취합 요청"}
              </button>
            ) : null}
            {alreadyRequested.length > 0 ? (
              <button
                type="button"
                className="teamCalSheet__action teamCalSheet__action--cancel"
                onClick={handleCancelRequestSchedule}
                disabled={requesting}
              >
                {requesting
                  ? "처리 중…"
                  : alreadyRequested.length === 1
                    ? "취합 요청 취소"
                    : `취합 요청 취소 (${alreadyRequested.length}일)`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
    ) : null}

    <ClubHomeScheduleEditor
      open={editingSchedule}
      dateKey={selectedDate}
      scheduleMap={scheduleMap}
      hasRequest={hasScheduleRequest}
      requestTeamNames={teamName ? [teamName] : []}
      onClose={() => setEditingSchedule(false)}
      onSaveComplete={() => {
        setEditingSchedule(false);
        onClose();
      }}
      onScheduleSaved={onScheduleSaved}
    />
    </>,
    document.body,
  );
};

export default TeamCalendarActionSheet;
