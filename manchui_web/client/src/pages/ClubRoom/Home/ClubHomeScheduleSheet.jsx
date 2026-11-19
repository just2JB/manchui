import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { formatReservationTimeRange } from "../Reservation/reservationTimeFormat";
import {
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
} from "../Team/teamCalendarUtils";
import { getPollDisplayTitle } from "../Poll/pollUtils";

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

const ClubHomeScheduleSheet = ({
  open,
  dateKey,
  practices = [],
  reservations = [],
  polls = [],
  onClose,
}) => {
  const hasPoll = polls.length > 0;
  const hasPractice = practices.length > 0;
  const hasReservation = reservations.length > 0;

  const dateLabel = useMemo(
    () => (dateKey ? formatUpcomingPracticeDate(dateKey) : ""),
    [dateKey],
  );

  if (!open || !dateKey) return null;

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

          {hasPoll ? (
            <section
              className="clubHomeSheet__section clubHomeSheet__requestBlock"
              aria-labelledby="club-home-request-label"
            >
              <p
                id="club-home-request-label"
                className="clubHomeSheet__sectionLabel"
              >
                일정 종합
              </p>
              <ul className="clubHomeSheet__requestInfoList">
                {polls.map((poll) => (
                  <li key={poll._id} className="clubHomeSheet__requestInfo">
                    <span className="clubHomeSheet__requestInfoTeam">
                      {poll.team?.name ?? "팀"}
                    </span>
                    <span className="clubHomeSheet__requestInfoDesc">
                      {getPollDisplayTitle(poll)}
                      {poll.responded ? " · 응답 완료" : ""}
                    </span>
                    <Link
                      className="clubHomeSheet__writeBtn"
                      to={`/club/poll/${poll._id}`}
                      onClick={onClose}
                    >
                      {poll.responded ? "내 시간 수정" : "가능한 시간 입력"}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!hasPoll && !hasPractice && !hasReservation ? (
            <p className="clubHomeSheet__empty">이 날은 일정이 없어요.</p>
          ) : null}

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
                      팀 {reservation.teamName ?? "—"}
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

    </>,
    document.body,
  );
};

export default ClubHomeScheduleSheet;
