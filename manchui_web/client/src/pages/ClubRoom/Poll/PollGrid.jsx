import React, { useCallback, useEffect, useRef, useState } from "react";
import { formatPollDate, formatPollHour, slotKey } from "./pollUtils";

function rectContains(drag, di, hi) {
  if (!drag) return false;
  const d0 = Math.min(drag.startD, drag.curD);
  const d1 = Math.max(drag.startD, drag.curD);
  const h0 = Math.min(drag.startH, drag.curH);
  const h1 = Math.max(drag.startH, drag.curH);
  return di >= d0 && di <= d1 && hi >= h0 && hi <= h1;
}

function readCellIndex(target) {
  const cell = target?.closest?.("[data-poll-cell]");
  if (!cell) return null;
  const di = Number(cell.dataset.di);
  const hi = Number(cell.dataset.hi);
  if (Number.isNaN(di) || Number.isNaN(hi)) return null;
  return { di, hi };
}

/**
 * 웬투밋식 시간 그리드.
 * - mode="edit": 칸을 누른 채 끌면 사각형 범위가 한 번에 칠해지거나 지워진다
 * - mode="view": 가능 인원이 많을수록 진하게, 칸을 누르면(PC는 올리면) 명단 표시
 */
const PollGrid = ({
  dates = [],
  hours = [],
  mode = "view",
  selected,
  onCommit,
  heatmap,
  activeSlot,
  onSlotFocus,
  highlightIds = null,
  disabled = false,
  ariaLabel,
}) => {
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const isEdit = mode === "edit";

  const finishDrag = useCallback(() => {
    const current = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!current) return;
    const next = new Set(selectedRef.current ?? []);
    const d0 = Math.min(current.startD, current.curD);
    const d1 = Math.max(current.startD, current.curD);
    const h0 = Math.min(current.startH, current.curH);
    const h1 = Math.max(current.startH, current.curH);
    for (let di = d0; di <= d1; di += 1) {
      for (let hi = h0; hi <= h1; hi += 1) {
        const key = slotKey(dates[di], hours[hi]);
        if (current.adding) next.add(key);
        else next.delete(key);
      }
    }
    onCommit?.(next);
  }, [dates, hours, onCommit]);

  useEffect(() => {
    if (!drag) return undefined;

    const handleMove = (event) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const index = readCellIndex(target);
      if (!index || !dragRef.current) return;
      if (
        index.di === dragRef.current.curD &&
        index.hi === dragRef.current.curH
      ) {
        return;
      }
      dragRef.current = { ...dragRef.current, curD: index.di, curH: index.hi };
      setDrag(dragRef.current);
    };

    const handleUp = () => finishDrag();

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [drag, finishDrag]);

  const handlePointerDown = (event, di, hi) => {
    if (!isEdit || disabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    // 터치는 기본적으로 누른 요소에 포인터가 묶이므로 풀어 줘야 이동 칸을 추적할 수 있다
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const key = slotKey(dates[di], hours[hi]);
    const next = {
      startD: di,
      startH: hi,
      curD: di,
      curH: hi,
      adding: !(selected?.has(key) ?? false),
    };
    dragRef.current = next;
    setDrag(next);
  };

  const handleKeyToggle = (event, di, hi) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (isEdit) {
      if (disabled) return;
      const key = slotKey(dates[di], hours[hi]);
      const next = new Set(selected ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      onCommit?.(next);
    } else {
      onSlotFocus?.({ dateKey: dates[di], hour: hours[hi] });
    }
  };

  const total = heatmap?.total ?? 0;
  const highlightSet = highlightIds ? new Set(highlightIds) : null;

  return (
    <div
      className={[
        "pollGrid",
        isEdit ? "pollGrid--edit" : "pollGrid--view",
        disabled ? "pollGrid--disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--poll-cols": dates.length }}
      role="grid"
      aria-label={ariaLabel}
      onPointerLeave={() => {
        if (!isEdit) onSlotFocus?.(null, { fromHover: true });
      }}
    >
      <div className="pollGrid__corner" aria-hidden />
      {dates.map((dateKey) => {
        const { month, day, week, isWeekend } = formatPollDate(dateKey);
        return (
          <div
            key={dateKey}
            className={`pollGrid__dateHead${isWeekend ? " pollGrid__dateHead--weekend" : ""}`}
            role="columnheader"
          >
            <span className="pollGrid__dateWeek">{week}</span>
            <span className="pollGrid__dateDay">
              {month}/{day}
            </span>
          </div>
        );
      })}

      {hours.map((hour, hi) => (
        <React.Fragment key={hour}>
          <div className="pollGrid__hourLabel" role="rowheader">
            {formatPollHour(hour)}
          </div>
          {dates.map((dateKey, di) => {
            const key = slotKey(dateKey, hour);
            let className = "pollGrid__cell";
            let style;
            let label;

            if (isEdit) {
              const inDrag = rectContains(drag, di, hi);
              const on = inDrag ? drag.adding : (selected?.has(key) ?? false);
              if (on) className += " pollGrid__cell--on";
              if (inDrag) className += " pollGrid__cell--dragging";
              label = `${formatPollDate(dateKey).month}/${formatPollDate(dateKey).day} ${formatPollHour(hour)} ${on ? "가능" : "불가"}`;
            } else {
              const ids = heatmap?.slots.get(key) ?? [];
              const count = highlightSet
                ? ids.filter((id) => highlightSet.has(id)).length
                : ids.length;
              const denom = highlightSet ? highlightSet.size : total;
              const ratio = denom > 0 ? count / denom : 0;
              style = { "--heat": ratio };
              if (count > 0) className += " pollGrid__cell--heat";
              if (denom > 0 && count === denom) className += " pollGrid__cell--all";
              if (
                activeSlot &&
                activeSlot.dateKey === dateKey &&
                activeSlot.hour === hour
              ) {
                className += " pollGrid__cell--active";
              }
              label = `${formatPollDate(dateKey).month}/${formatPollDate(dateKey).day} ${formatPollHour(hour)} ${count}/${denom}명 가능`;
            }
            if (hour % 2 === 0) className += " pollGrid__cell--evenHour";

            return (
              <div
                key={key}
                className={className}
                style={style}
                role="gridcell"
                tabIndex={disabled ? -1 : 0}
                aria-label={label}
                aria-selected={isEdit ? (selected?.has(key) ?? false) : undefined}
                data-poll-cell=""
                data-di={di}
                data-hi={hi}
                onPointerDown={(event) => handlePointerDown(event, di, hi)}
                onPointerEnter={(event) => {
                  if (!isEdit && event.pointerType === "mouse") {
                    onSlotFocus?.({ dateKey, hour }, { fromHover: true });
                  }
                }}
                onClick={() => {
                  if (!isEdit) onSlotFocus?.({ dateKey, hour });
                }}
                onKeyDown={(event) => handleKeyToggle(event, di, hi)}
              />
            );
          })}
        </React.Fragment>
      ))}
      <div className="pollGrid__hourLabel pollGrid__hourLabel--end" aria-hidden>
        {formatPollHour(hours.length ? hours[hours.length - 1] + 1 : 0)}
      </div>
    </div>
  );
};

export default PollGrid;
