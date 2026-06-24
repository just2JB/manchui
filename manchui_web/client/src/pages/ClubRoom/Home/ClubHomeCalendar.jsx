import React, { useMemo, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useCalendarMonthSlide } from "../Reservation/useCalendarMonthSlide";
import {
  WEEK_LABELS,
  buildConsecutiveRanges,
  buildMonthWeeks,
  buildWeekRangeBarSegments,
  formatDateKey,
  formatPracticeTimeLabel,
  startOfMonth,
} from "../Team/teamCalendarUtils";

function reqSpanRadius(roundLeft, roundRight) {
  const r = 3;
  const tl = roundLeft ? r : 0;
  const bl = roundLeft ? r : 0;
  const tr = roundRight ? r : 0;
  const br = roundRight ? r : 0;
  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

function getBarSegmentDateKeys(weekCells, bar) {
  const keys = [];
  const startCol = bar.colStart - 1;
  for (let i = 0; i < bar.colSpan; i += 1) {
    const cell = weekCells[startCol + i];
    keys.push(cell?.date ? cell.key : null);
  }
  return keys;
}

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

  const requestRanges = useMemo(
    () => buildConsecutiveRanges([...requestDateSet]),
    [requestDateSet],
  );

  const scheduleRanges = useMemo(
    () => buildConsecutiveRanges([...scheduleDateSet]),
    [scheduleDateSet],
  );

  const practiceDateSet = useMemo(
    () => new Set(practiceByDate.keys()),
    [practiceByDate],
  );

  const scheduleBarSkipDateSet = useMemo(() => {
    const set = new Set(practiceDateSet);
    for (const key of requestDateSet) set.add(key);
    return set;
  }, [practiceDateSet, requestDateSet]);

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
    const isPracticeMulti = dayPractices.length > 1;
    const hasSchedule = scheduleDateSet.has(dateKey);
    const hasRequest = requestDateSet.has(dateKey);
    const practiceAccent =
      dayPractices.length === 1
        ? (dayPractices[0].teamColor ?? "#E87070")
        : null;

    const ariaParts = [dateKey];
    if (hasPractice) {
      const times = dayPractices
        .map((practice) => formatPracticeTimeLabel(practice.time))
        .join(", ");
      ariaParts.push(`연습 ${times}`);
    }
    if (hasSchedule) ariaParts.push("내 일정 입력됨");
    if (hasRequest && !hasPractice) ariaParts.push("일정 취합 요청");

    const className = [
      "clubHomeCal__cell",
      "clubHomeCal__cell--interactive",
      isToday ? "clubHomeCal__cell--today" : "",
      hasPractice ? "clubHomeCal__cell--practice" : "",
      isPracticeMulti ? "clubHomeCal__cell--practiceMulti" : "",
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
        style={
          practiceAccent
            ? { "--practice-accent": practiceAccent }
            : undefined
        }
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
                  "--practice-accent": practice.teamColor ?? "#E87070",
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
            {weeks.map((weekCells, weekIndex) => {
              const requestBarSegments = buildWeekRangeBarSegments(
                weekCells,
                requestRanges,
                practiceDateSet,
                "req",
              );
              const scheduleBarSegments = buildWeekRangeBarSegments(
                weekCells,
                scheduleRanges,
                scheduleBarSkipDateSet,
                "sched",
              );

              return (
                <div
                  key={`week-${weekIndex}`}
                  className="clubHomeCal__week"
                  role="row"
                >
                  {weekCells.map((cell) => renderCell(cell))}

                  {scheduleBarSegments.length > 0 ? (
                    <div
                      className="clubHomeCal__barLayer clubHomeCal__barLayer--schedule"
                      aria-hidden
                    >
                      {scheduleBarSegments.map((bar) => (
                        <span
                          key={bar.id}
                          className="clubHomeCal__schedSpan"
                          style={{
                            gridColumn: `${bar.colStart} / span ${bar.colSpan}`,
                            borderRadius: reqSpanRadius(
                              bar.roundLeft,
                              bar.roundRight,
                            ),
                          }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {requestBarSegments.length > 0 ? (
                    <div
                      className="clubHomeCal__barLayer clubHomeCal__barLayer--request"
                      aria-hidden
                    >
                      {requestBarSegments.map((bar) => {
                        const segmentDateKeys = getBarSegmentDateKeys(
                          weekCells,
                          bar,
                        );

                        return (
                          <span
                            key={bar.id}
                            className="clubHomeCal__reqSpan"
                            style={{
                              gridColumn: `${bar.colStart} / span ${bar.colSpan}`,
                              borderRadius: reqSpanRadius(
                                bar.roundLeft,
                                bar.roundRight,
                              ),
                              "--req-cols": bar.colSpan,
                            }}
                          >
                            {segmentDateKeys.map((key, index) => (
                              <span
                                key={key ?? `req-gap-${bar.id}-${index}`}
                                className={[
                                  "clubHomeCal__reqSpanCell",
                                  key && scheduleDateSet.has(key)
                                    ? "clubHomeCal__reqSpanCell--schedule"
                                    : "",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              />
                            ))}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="clubHomeCal__legend">
        <span className="clubHomeCal__legendItem">
          <span className="clubHomeCal__legendSwatch clubHomeCal__legendSwatch--practice" />
          연습
        </span>
        <span className="clubHomeCal__legendItem">
          <span className="clubHomeCal__legendBar clubHomeCal__legendBar--request" />
          일정 취합 요청
        </span>
        <span className="clubHomeCal__legendItem">
          <span className="clubHomeCal__legendBar clubHomeCal__legendBar--schedule" />
          내 일정
        </span>
      </div>
    </div>
  );
};

export default ClubHomeCalendar;
