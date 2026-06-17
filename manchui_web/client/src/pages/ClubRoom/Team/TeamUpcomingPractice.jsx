import React from "react";
import { IoClipboardOutline } from "react-icons/io5";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  buildUpcomingPracticesCopyText,
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
  getUpcomingPractices,
} from "./teamCalendarUtils";

const UPCOMING_LIMIT = 6;

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

const TeamUpcomingPractice = ({
  practices,
  members = [],
  isLeader = false,
  onPracticeClick,
}) => {
  const modal = useManchuiModal();
  const upcoming = getUpcomingPractices(practices, { limit: UPCOMING_LIMIT });
  const hasUpcoming =
    getUpcomingPractices(practices, { limit: 0 }).length > 0;

  const handleCopy = async () => {
    const text = buildUpcomingPracticesCopyText(practices, members);
    if (!text) {
      await modal("복사할 연습이 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      await modal("연습 일정이 클립보드에 복사되었습니다.");
    } catch {
      await modal(`복사에 실패했습니다.\n\n${text}`);
    }
  };

  return (
    <section
      className="teamDetailBlock teamUpcoming"
      aria-labelledby="team-upcoming-title"
    >
      <div className="teamUpcoming__head">
        <h2 id="team-upcoming-title" className="teamDetailBlock__title">
          다가오는 연습
        </h2>
        {hasUpcoming ? (
          <button
            type="button"
            className="teamUpcoming__copyBtn"
            onClick={() => void handleCopy()}
            aria-label="연습 일정 클립보드에 복사"
            title="연습 일정 복사"
          >
            <IoClipboardOutline aria-hidden />
          </button>
        ) : null}
      </div>

      {upcoming.length === 0 ? (
        <p className="teamUpcoming__empty">예정된 연습이 없습니다.</p>
      ) : (
        <div className="teamUpcoming__trackWrap">
          <ul className="teamUpcoming__track" aria-label="다가오는 연습 목록">
            {upcoming.map((practice, index) => {
              const key =
                practice._id ??
                `${practice.dateKey}-${practice.time}-${index}`;

              const cardClassName = [
                "teamUpcoming__card",
                index === 0 ? "teamUpcoming__card--next" : "",
                isLeader ? "teamUpcoming__card--clickable" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const content = (
                <>
                  <span className="teamUpcoming__date">
                    {formatUpcomingPracticeDate(practice.dateKey)}
                  </span>
                  <span className="teamUpcoming__time">
                    {formatPracticeTimeDisplay(practice.time)}
                  </span>
                  <span className="teamUpcoming__place">
                    {formatPlace(practice.place)}
                  </span>
                </>
              );

              if (isLeader) {
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={cardClassName}
                      onClick={() => onPracticeClick?.(practice)}
                      aria-label={`${formatUpcomingPracticeDate(practice.dateKey)} ${formatPracticeTimeDisplay(practice.time)} 연습 편집`}
                    >
                      {content}
                    </button>
                  </li>
                );
              }

              return (
                <li key={key} className={cardClassName}>
                  {content}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default TeamUpcomingPractice;
