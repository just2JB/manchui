import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatReservationTimeRange } from "../Reservation/reservationTimeFormat";
import {
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
} from "../Team/teamCalendarUtils";
import { timesToHours } from "./clubHomeUtils";
import ClubHomeScheduleEditor from "./ClubHomeScheduleEditor";

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

const ClubHomeScheduleSheet = ({
  open,
  dateKey,
  practices = [],
  reservations = [],
  requestTeams = [],
  requestDateSet,
  scheduleMap,
  initialSchedule,
  onClose,
  onScheduleSaved,
  onSchedulesRefreshed,
}) => {
  const [editingSchedule, setEditingSchedule] = useState(false);

  const hasRequest = requestTeams.length > 0;
  const hasPractice = practices.length > 0;
  const hasReservation = reservations.length > 0;
  const hasSavedSchedule = timesToHours(initialSchedule?.times).length > 0;

  useEffect(() => {
    if (!open || !dateKey) return;
    setEditingSchedule(false);
  }, [open, dateKey]);

  const dateLabel = useMemo(
    () => (dateKey ? formatUpcomingPracticeDate(dateKey) : ""),
    [dateKey],
  );

  if (!open || !dateKey) return null;

  const scheduleWriteLabel = hasSavedSchedule ? "일정 수정" : "일정 작성";

  return createPortal(
    <>
      <div className="clubHomeSheet__root" role="presentation">
        <button
          type="button"
          className="clubHomeSheet__backdrop"
          aria-label="닫기"
          onClick={onClose}
        />
        <div
          className="clubHomeSheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="club-home-sheet-title"
        >
          <div className="clubHomeSheet__handleWrap">
            <span className="clubHomeSheet__handle" aria-hidden />
          </div>
          <h2 id="club-home-sheet-title" className="clubHomeSheet__title">
            {dateLabel}
          </h2>

          {hasRequest ? (
            <section
              className="clubHomeSheet__section clubHomeSheet__requestBlock"
              aria-labelledby="club-home-request-label"
            >
              <p
                id="club-home-request-label"
                className="clubHomeSheet__sectionLabel"
              >
                일정 취합 요청
              </p>
              <ul className="clubHomeSheet__requestInfoList">
                {requestTeams.map((entry) => (
                  <li key={entry.teamName} className="clubHomeSheet__requestInfo">
                    <span className="clubHomeSheet__requestInfoTeam">
                      {entry.teamName}
                    </span>
                    <span className="clubHomeSheet__requestInfoDesc">
                      이 날짜에 가능한 시간을 알려주세요.
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="clubHomeSheet__writeBtn"
                onClick={() => setEditingSchedule(true)}
              >
                {scheduleWriteLabel}
              </button>
            </section>
          ) : (
            <section className="clubHomeSheet__section">
              <button
                type="button"
                className="clubHomeSheet__writeBtn clubHomeSheet__writeBtn--solo"
                onClick={() => setEditingSchedule(true)}
              >
                {scheduleWriteLabel}
              </button>
            </section>
          )}

          {hasPractice ? (
            <section
              className="clubHomeSheet__section"
              aria-labelledby="club-home-practice-label"
            >
              <p
                id="club-home-practice-label"
                className="clubHomeSheet__sectionLabel"
              >
                연습
              </p>
              <ul className="clubHomeSheet__list">
                {practices.map((practice, index) => (
                  <li
                    key={
                      practice._id ??
                      `${dateKey}-${practice.time}-${index}`
                    }
                    className="clubHomeSheet__item"
                    style={{
                      "--item-accent": practice.teamColor ?? "#E87070",
                    }}
                  >
                    <span className="clubHomeSheet__itemTeam">
                      {practice.teamName ?? "팀"}
                    </span>
                    <span className="clubHomeSheet__itemMain">
                      {formatPracticeTimeDisplay(practice.time)}
                    </span>
                    <span className="clubHomeSheet__itemSub">
                      {formatPlace(practice.place)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasReservation ? (
            <section
              className="clubHomeSheet__section"
              aria-labelledby="club-home-reservation-label"
            >
              <p
                id="club-home-reservation-label"
                className="clubHomeSheet__sectionLabel"
              >
                동아리방 예약
              </p>
              <ul className="clubHomeSheet__list">
                {reservations.map((reservation) => (
                  <li
                    key={reservation._id}
                    className="clubHomeSheet__item clubHomeSheet__item--reservation"
                  >
                    <span className="clubHomeSheet__itemMain">
                      {formatReservationTimeRange(reservation.time)}
                    </span>
                    <span className="clubHomeSheet__itemSub">
                      연락처 {reservation.agentId ?? "—"}
                      {reservation.headcount != null
                        ? ` · ${reservation.headcount}명`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <ClubHomeScheduleEditor
        open={editingSchedule}
        dateKey={dateKey}
        scheduleMap={scheduleMap}
        requestDateSet={requestDateSet}
        onClose={() => setEditingSchedule(false)}
        onSaveComplete={async () => {
          setEditingSchedule(false);
          await onSchedulesRefreshed?.();
          onClose();
        }}
        onScheduleSaved={onScheduleSaved}
      />
    </>,
    document.body,
  );
};

export default ClubHomeScheduleSheet;
