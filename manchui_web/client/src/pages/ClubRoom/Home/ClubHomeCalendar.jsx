import React, { useMemo, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useCalendarMonthSlide } from "../Reservation/useCalendarMonthSlide";
import {
  WEEK_LABELS,
  buildMonthWeeks,
  formatDateKey,
  formatPracticeTimeLabel,
  startOfMonth,
} from "../Team/teamCalendarUtils";

const ClubHomeCalendar = ({
  practiceByDate,
  scheduleDateSet,
  requestDateSet,
  onDateSelect,
}) => {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const weeks = useMemo(() => buildMonthWeeks(viewMonth), [viewMonth]);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  const { slideDir, goPrevMonth, goNextMonth, swipeHandlers, monthKey } =
    useCalendarMonthSlide(viewMonth, setViewMonth);

  const monthPanelClass = slideDir
    ? ` clubHomeCal__monthPanel--${slideDir}`
    : "";

  const renderCell = (cell) => {
    if (!cell.date) {
      return (
        <span
          key={cell.key}
          className="clubHomeCal__cell clubHomeCal__cell--empty"
          role="gridcell"
          aria-hidden
        />
      );
    }

    const dateKey = cell.key;
    const isToday = dateKey === todayKey;
    const dayPractices = practiceByDate.get(dateKey) ?? [];
    const hasPractice = dayPractices.length > 0;
    const hasSchedule = scheduleDateSet.has(dateKey);
    const hasRequest = requestDateSet.has(dateKey);

    const ariaParts = [dateKey];
    if (hasPractice) {
      const times = dayPractices
        .map((practice) => formatPracticeTimeLabel(practice.time))
        .join(", ");
      ariaParts.push(`연습 ${times}`);
    }
    if (hasSchedule) ariaParts.push("내 일정 입력됨");
    if (hasRequest) ariaParts.push("일정 취합 요청");

    const className = [
      "clubHomeCal__cell",
      "clubHomeCal__cell--interactive",
      isToday ? "clubHomeCal__cell--today" : "",
      hasPractice ? "clubHomeCal__cell--hasPractice" : "",
      dayPractices.length > 1 ? "clubHomeCal__cell--practiceMulti" : "",
      hasRequest ? "clubHomeCal__cell--request" : "",
      hasSchedule ? "clubHomeCal__cell--schedule" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        key={cell.key}
        type="button"
        className={className}
        role="gridcell"
        data-date-key={dateKey}
        aria-label={ariaParts.join(", ")}
        onClick={() => onDateSelect?.(dateKey)}
      >
        <span className="clubHomeCal__day">{cell.date.getDate()}</span>
        {hasPractice ? (
          <span className="clubHomeCal__practiceBars">
            {dayPractices.map((practice) => (
              <span
                key={practice._id ?? `${dateKey}-${practice.time}`}
                className="clubHomeCal__practiceTimeBar"
                style={{
                  "--item-accent": practice.teamColor ?? "#E87070",
                }}
                title={practice.time}
              >
                {formatPracticeTimeLabel(practice.time)}
              </span>
            ))}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="clubHomeCal">
      <div className="clubHomeCal__nav">
        <button
          type="button"
          className="clubHomeCal__navBtn"
          onClick={goPrevMonth}
          aria-label="이전 달"
        >
          <IoChevronBack aria-hidden />
        </button>
        <span className="clubHomeCal__month">{monthLabel}</span>
        <button
          type="button"
          className="clubHomeCal__navBtn"
          onClick={goNextMonth}
          aria-label="다음 달"
        >
          <IoChevronForward aria-hidden />
        </button>
      </div>

      <div className="clubHomeCal__monthSwipe" {...swipeHandlers}>
        <div
          key={monthKey}
          className={`clubHomeCal__monthPanel${monthPanelClass}`}
        >
          <div className="clubHomeCal__weekHead" aria-hidden>
            {WEEK_LABELS.map((label) => (
              <span key={label} className="clubHomeCal__weekLabel">
                {label}
              </span>
            ))}
          </div>

          <div
            className="clubHomeCal__body"
            role="grid"
            aria-label={monthLabel}
          >
            {weeks.map((weekCells, weekIndex) => (
              <div
                key={`week-${weekIndex}`}
                className="clubHomeCal__week"
                role="row"
              >
                {weekCells.map((cell) => renderCell(cell))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="clubHomeCal__legend">
        <span className="clubHomeCal__legendItem">
          <span className="clubHomeCal__legendBar clubHomeCal__legendBar--practiceTime" />
          연습
        </span>
        <span className="clubHomeCal__legendItem">
          <span className="clubHomeCal__legendSwatch clubHomeCal__legendSwatch--request" />
          일정 취합 요청
        </span>
        <span className="clubHomeCal__legendItem">
          <span className="clubHomeCal__legendSwatch clubHomeCal__legendSwatch--schedule" />
          내 일정
        </span>
      </div>
    </div>
  );
};

export default ClubHomeCalendar;
