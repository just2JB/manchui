import React, { useMemo, useRef, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useCalendarMonthSlide } from "../Reservation/useCalendarMonthSlide";
import TeamCalendarActionSheet from "./TeamCalendarActionSheet";
import {
  WEEK_LABELS,
  buildConsecutiveRanges,
  buildMonthWeeks,
  buildPracticeByDate,
  buildRequestDateSet,
  buildWeekRequestBarSegments,
  formatDateKey,
  formatPracticeTimeLabel,
  getInclusiveDateRange,
  isDateInInclusiveRange,
  startOfMonth,
} from "./teamCalendarUtils";

const RANGE_HOLD_MS = 420;
const RANGE_MOVE_CANCEL_PX = 12;

function reqSpanRadius(roundLeft, roundRight) {
  const r = 3;
  const tl = roundLeft ? r : 0;
  const bl = roundLeft ? r : 0;
  const tr = roundRight ? r : 0;
  const br = roundRight ? r : 0;
  return `${tl}px ${tr}px ${br}px ${bl}px`;
}

const TeamCalendar = ({
  teamId,
  teamName = "",
  isLeader = false,
  isMember = false,
  requestSchedules = [],
  practices = [],
  scheduleMap,
  accentColor = "#E87070",
  onScheduleSaved,
  onRequestSchedulesUpdated,
  onPracticeClick,
}) => {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [dragAnchor, setDragAnchor] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rangeHoldAnchor, setRangeHoldAnchor] = useState(null);
  const [actionSheet, setActionSheet] = useState(null);
  const dragAnchorRef = useRef(null);
  const dragEndRef = useRef(null);
  const dragListenersRef = useRef(null);
  const pendingPressRef = useRef(false);
  const rangeArmedRef = useRef(false);
  const holdTimerRef = useRef(null);
  const pointerStartRef = useRef(null);
  const pointerIdRef = useRef(null);
  const captureTargetRef = useRef(null);

  const requestSet = useMemo(
    () => buildRequestDateSet(requestSchedules),
    [requestSchedules],
  );

  const requestRanges = useMemo(
    () => buildConsecutiveRanges([...requestSet]),
    [requestSet],
  );

  const practiceByDate = useMemo(
    () => buildPracticeByDate(practices),
    [practices],
  );

  const practiceDateSet = useMemo(
    () => new Set(practiceByDate.keys()),
    [practiceByDate],
  );

  const weeks = useMemo(() => buildMonthWeeks(viewMonth), [viewMonth]);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  const { slideDir, goPrevMonth, goNextMonth, swipeHandlers, monthKey } =
    useCalendarMonthSlide(viewMonth, setViewMonth);

  const monthPanelClass = slideDir
    ? ` teamCalendar__monthPanel--${slideDir}`
    : "";

  const detachDragListeners = () => {
    const listeners = dragListenersRef.current;
    if (!listeners) return;
    window.removeEventListener("pointermove", listeners.move);
    window.removeEventListener("pointerup", listeners.up);
    window.removeEventListener("pointercancel", listeners.cancel);
    dragListenersRef.current = null;
  };

  const clearDrag = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    detachDragListeners();
    pendingPressRef.current = false;
    rangeArmedRef.current = false;
    pointerStartRef.current = null;
    dragAnchorRef.current = null;
    dragEndRef.current = null;
    if (
      captureTargetRef.current?.releasePointerCapture &&
      pointerIdRef.current != null
    ) {
      try {
        captureTargetRef.current.releasePointerCapture(pointerIdRef.current);
      } catch {
        /* ignore */
      }
    }
    pointerIdRef.current = null;
    captureTargetRef.current = null;
    setIsDragging(false);
    setRangeHoldAnchor(null);
    setDragAnchor(null);
    setDragEnd(null);
  };

  const cancelPendingPress = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pendingPressRef.current = false;
    pointerStartRef.current = null;
    if (!rangeArmedRef.current) {
      dragAnchorRef.current = null;
      dragEndRef.current = null;
      setRangeHoldAnchor(null);
      detachDragListeners();
    }
  };

  const armRangeSelection = () => {
    if (!pendingPressRef.current || !dragAnchorRef.current) return;
    rangeArmedRef.current = true;
    if (
      captureTargetRef.current?.setPointerCapture &&
      pointerIdRef.current != null
    ) {
      try {
        captureTargetRef.current.setPointerCapture(pointerIdRef.current);
      } catch {
        /* ignore */
      }
    }
    setIsDragging(true);
    setRangeHoldAnchor(null);
    setDragAnchor(dragAnchorRef.current);
    setDragEnd(dragEndRef.current);
  };

  const findDateKeyAtPoint = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    return el?.closest("[data-date-key]")?.dataset?.dateKey ?? null;
  };

  const openActionSheet = (startKey, endKey) => {
    const start = startKey <= endKey ? startKey : endKey;
    const end = startKey <= endKey ? endKey : startKey;
    const isRange = start !== end;
    const dates = isRange ? getInclusiveDateRange(start, end) : [startKey];
    setActionSheet({
      mode: isRange ? "range" : "single",
      dates,
    });
  };

  const updateDragEnd = (dateKey) => {
    if (!dateKey || dateKey === dragEndRef.current) return;
    dragEndRef.current = dateKey;
    setDragEnd(dateKey);
  };

  const finishRangeSelection = (clientX, clientY) => {
    if (!rangeArmedRef.current || !dragAnchorRef.current) return;
    const anchor = dragAnchorRef.current;
    const endKey =
      findDateKeyAtPoint(clientX, clientY) ?? dragEndRef.current ?? anchor;
    clearDrag();
    window.setTimeout(() => {
      openActionSheet(anchor, endKey);
    }, 0);
  };

  const openSingleDateSheet = (dateKey) => {
    window.setTimeout(() => {
      openActionSheet(dateKey, dateKey);
    }, 0);
  };

  const attachDragListeners = () => {
    detachDragListeners();

    const handleMove = (event) => {
      if (!pendingPressRef.current && !rangeArmedRef.current) return;

      const start = pointerStartRef.current;
      if (!rangeArmedRef.current && start) {
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.hypot(dx, dy) > RANGE_MOVE_CANCEL_PX) {
          cancelPendingPress();
          return;
        }
      }

      if (rangeArmedRef.current) {
        updateDragEnd(findDateKeyAtPoint(event.clientX, event.clientY));
      }
    };

    const handleUp = (event) => {
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      if (rangeArmedRef.current) {
        finishRangeSelection(event.clientX, event.clientY);
        return;
      }

      if (pendingPressRef.current && dragAnchorRef.current) {
        const anchor = dragAnchorRef.current;
        clearDrag();
        openSingleDateSheet(anchor);
        return;
      }

      clearDrag();
    };

    const handleCancel = () => {
      clearDrag();
    };

    dragListenersRef.current = {
      move: handleMove,
      up: handleUp,
      cancel: handleCancel,
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
  };

  const handleMemberDateClick = (dateKey) => {
    window.setTimeout(() => {
      setActionSheet({ mode: "single", dates: [dateKey] });
    }, 0);
  };

  const handleDatePointerDown = (dateKey, event) => {
    if (!isLeader) return;
    clearDrag();
    pendingPressRef.current = true;
    dragAnchorRef.current = dateKey;
    dragEndRef.current = dateKey;
    pointerIdRef.current = event.pointerId;
    captureTargetRef.current = event.currentTarget;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    setRangeHoldAnchor(dateKey);
    attachDragListeners();
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      armRangeSelection();
    }, RANGE_HOLD_MS);
  };

  const renderCell = (cell) => {
    if (!cell.date) {
      return (
        <span
          key={cell.key}
          className="teamCalendar__cell teamCalendar__cell--empty"
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
    const isHoldPending = rangeHoldAnchor === dateKey;
    const isSelecting =
      isDragging &&
      dragAnchor &&
      dragEnd &&
      isDateInInclusiveRange(dateKey, dragAnchor, dragEnd);

    const ariaParts = [dateKey];
    if (requestSet.has(dateKey) && !hasPractice) {
      ariaParts.push("일정 취합 요청");
    }
    if (hasPractice) {
      const times = dayPractices
        .map((p) => formatPracticeTimeLabel(p.time))
        .join(", ");
      ariaParts.push(`연습 ${times}`);
    }

    const className = [
      "teamCalendar__cell",
      isToday ? "teamCalendar__cell--today" : "",
      hasPractice ? "teamCalendar__cell--practice" : "",
      isPracticeMulti ? "teamCalendar__cell--practiceMulti" : "",
      isHoldPending ? "teamCalendar__cell--holdPending" : "",
      isSelecting
        ? "teamCalendar__cell--selecting teamCalendar__cell--rangeActive"
        : "",
      isLeader || isMember ? "teamCalendar__cell--interactive" : "",
      isMember && !isLeader ? "teamCalendar__cell--view" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        <span className="teamCalendar__day">{cell.date.getDate()}</span>
        {hasPractice ? (
          <span className="teamCalendar__practiceBars">
            {dayPractices.map((practice) => (
              <span
                key={practice._id ?? `${dateKey}-${practice.time}`}
                className="teamCalendar__practiceTimeBar"
                title={practice.time}
              >
                {formatPracticeTimeLabel(practice.time)}
              </span>
            ))}
          </span>
        ) : null}
      </>
    );

    if (isLeader) {
      return (
        <button
          key={cell.key}
          type="button"
          className={className}
          role="gridcell"
          data-date-key={dateKey}
          aria-label={ariaParts.join(", ")}
          onPointerDown={(event) => handleDatePointerDown(dateKey, event)}
        >
          {content}
        </button>
      );
    }

    if (isMember) {
      return (
        <button
          key={cell.key}
          type="button"
          className={className}
          role="gridcell"
          data-date-key={dateKey}
          aria-label={ariaParts.join(", ")}
          onClick={() => handleMemberDateClick(dateKey)}
        >
          {content}
        </button>
      );
    }

    return (
      <span
        key={cell.key}
        className={className}
        role="gridcell"
        aria-label={ariaParts.join(", ")}
      >
        {content}
      </span>
    );
  };

  return (
    <div className="teamCalendar" style={{ "--team-accent": accentColor }}>
      <div className="teamCalendar__nav">
        <button
          type="button"
          className="teamCalendar__navBtn"
          onClick={goPrevMonth}
          aria-label="이전 달"
        >
          <IoChevronBack aria-hidden />
        </button>
        <span className="teamCalendar__month">{monthLabel}</span>
        <button
          type="button"
          className="teamCalendar__navBtn"
          onClick={goNextMonth}
          aria-label="다음 달"
        >
          <IoChevronForward aria-hidden />
        </button>
      </div>

      <div className="teamCalendar__monthSwipe" {...swipeHandlers}>
        <div
          key={monthKey}
          className={`teamCalendar__monthPanel${monthPanelClass}`}
        >
          <div className="teamCalendar__weekHead" aria-hidden>
            {WEEK_LABELS.map((label) => (
              <span key={label} className="teamCalendar__weekLabel">
                {label}
              </span>
            ))}
          </div>

          <div
            className="teamCalendar__body"
            role="grid"
            aria-label={monthLabel}
          >
            {weeks.map((weekCells, weekIndex) => {
              const barSegments = buildWeekRequestBarSegments(
                weekCells,
                requestRanges,
                practiceDateSet,
              );

              return (
                <div
                  key={`week-${weekIndex}`}
                  className="teamCalendar__week"
                  role="row"
                >
                  {weekCells.map((cell) => renderCell(cell))}

                  {barSegments.length > 0 ? (
                    <div className="teamCalendar__barLayer" aria-hidden>
                      {barSegments.map((bar) => (
                        <span
                          key={bar.id}
                          className="teamCalendar__reqSpan"
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
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="teamCalendar__legend">
        <span className="teamCalendar__legendItem">
          <span className="teamCalendar__legendBar teamCalendar__legendBar--request" />
          일정 취합 요청
        </span>
        <span className="teamCalendar__legendItem">
          <span className="teamCalendar__legendSwatch teamCalendar__legendSwatch--practice" />
          연습이 있는 날
        </span>
      </div>

      <TeamCalendarActionSheet
        open={Boolean(actionSheet)}
        mode={actionSheet?.mode}
        dates={actionSheet?.dates ?? []}
        teamId={teamId}
        teamName={teamName}
        isLeader={isLeader}
        isMember={isMember}
        practices={practices}
        scheduleMap={scheduleMap}
        accentColor={accentColor}
        requestSet={requestSet}
        onClose={() => setActionSheet(null)}
        onScheduleSaved={onScheduleSaved}
        onRequestSchedulesUpdated={onRequestSchedulesUpdated}
        onPracticeClick={onPracticeClick}
      />
    </div>
  );
};

export default TeamCalendar;
