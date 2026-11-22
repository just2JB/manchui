import React, { useState } from "react";
import {
  IoAdd,
  IoChevronDown,
  IoChevronUp,
  IoClipboardOutline,
  IoShareOutline,
} from "react-icons/io5";
import { useManchuiModal } from "../../../hooks/ManchuiModal";
import {
  buildUpcomingPracticesCopyText,
  formatDateKey,
  formatPracticeTimeDisplay,
  formatUpcomingPracticeDate,
  getUpcomingPractices,
} from "./teamCalendarUtils";
import { shareTeamPracticeSchedule } from "./teamUtils";

/** 처음에 보여줄 연습 수 (다음 연습 1 + 이후 3) */
const INITIAL_COUNT = 4;

function formatPlace(place) {
  const value = String(place ?? "").trim();
  return value || "미확정";
}

function formatDDay(dateKey) {
  const today = new Date(formatDateKey(new Date()) + "T00:00");
  const target = new Date(dateKey + "T00:00");
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  return `D-${diff}`;
}

const TeamUpcomingPractice = ({
  practices,
  members = [],
  isLeader = false,
  onPracticeClick,
  onAddPractice,
  /** 연습 일정 공유 페이지용 */
  teamId,
  teamName = "",
}) => {
  const modal = useManchuiModal();
  const [expanded, setExpanded] = useState(false);
  const all = getUpcomingPractices(practices, { limit: 0 });
  const [next, ...rest] = all;
  const visibleRest = expanded ? rest : rest.slice(0, INITIAL_COUNT - 1);
  const hiddenCount = rest.length - visibleRest.length;

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

  const keyOf = (practice, index) =>
    practice._id ?? `${practice.dateKey}-${practice.time}-${index}`;

  const labelOf = (practice) =>
    `${formatUpcomingPracticeDate(practice.dateKey)} ${formatPracticeTimeDisplay(practice.time)} 연습 편집`;

  /** 팀장이면 버튼(편집), 아니면 정적 요소 */
  const renderItem = (practice, className, children) =>
    isLeader ? (
      <button
        type="button"
        className={`${className} teamUpcoming__item--clickable`}
        onClick={() => onPracticeClick?.(practice)}
        aria-label={labelOf(practice)}
      >
        {children}
      </button>
    ) : (
      <div className={className}>{children}</div>
    );

  return (
    <section
      className="teamDetailBlock teamUpcoming"
      aria-labelledby="team-upcoming-title"
    >
      <div className="teamUpcoming__head">
        <h2 id="team-upcoming-title" className="teamDetailBlock__title">
          다가오는 연습
          {all.length > 0 ? (
            <span className="teamUpcoming__count">{all.length}</span>
          ) : null}
        </h2>
        <div className="teamUpcoming__tools">
        {teamId ? (
          <button
            type="button"
            className="teamUpcoming__copyBtn"
            onClick={() => void shareTeamPracticeSchedule(teamName, teamId, modal)}
            aria-label="연습 일정 공유 페이지 링크 보내기"
            title="연습 일정 공유"
          >
            <IoShareOutline aria-hidden />
          </button>
        ) : null}
        {all.length > 0 ? (
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
      </div>

      {!next ? (
        <p className="teamUpcoming__empty">예정된 연습이 없습니다.</p>
      ) : (
        <>
          {renderItem(
            next,
            "teamUpcoming__next",
            <>
              <span className="teamUpcoming__nextTop">
                <span className="teamUpcoming__nextDate">
                  {formatUpcomingPracticeDate(next.dateKey)}
                </span>
                <span className="teamUpcoming__dday">{formatDDay(next.dateKey)}</span>
              </span>
              <span className="teamUpcoming__nextTime">
                {formatPracticeTimeDisplay(next.time)}
              </span>
              <span className="teamUpcoming__nextPlace">{formatPlace(next.place)}</span>
            </>,
          )}

          {visibleRest.length > 0 ? (
            <ul className="teamUpcoming__list" aria-label="이후 연습">
              {visibleRest.map((practice, index) => (
                <li key={keyOf(practice, index)}>
                  {renderItem(
                    practice,
                    "teamUpcoming__row",
                    <>
                      <span className="teamUpcoming__rowDate">
                        {formatUpcomingPracticeDate(practice.dateKey)}
                      </span>
                      <span className="teamUpcoming__rowTime">
                        {formatPracticeTimeDisplay(practice.time)}
                      </span>
                      <span className="teamUpcoming__rowPlace">
                        {formatPlace(practice.place)}
                      </span>
                    </>,
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {rest.length > INITIAL_COUNT - 1 ? (
            <button
              type="button"
              className="teamUpcoming__moreBtn"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  접기 <IoChevronUp aria-hidden />
                </>
              ) : (
                <>
                  {hiddenCount}개 더 보기 <IoChevronDown aria-hidden />
                </>
              )}
            </button>
          ) : null}
        </>
      )}

      {/* 팀장: 연습 추가 (일정 종합에서 고르기 / 직접 입력은 추가 페이지에서) */}
      {onAddPractice ? (
        <button type="button" className="teamUpcoming__addBtn" onClick={onAddPractice}>
          <IoAdd aria-hidden />
          연습 추가
        </button>
      ) : null}
    </section>
  );
};

export default TeamUpcomingPractice;
