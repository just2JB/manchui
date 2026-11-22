import { useLayoutEffect, useRef, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { WEEK_LABELS, buildMonthWeeks, formatDateKey } from "../Team/teamCalendarUtils";
import { toVisibleTeamColor } from "../Team/teamColorPresets";
import { parseDateKey } from "./clubHomeUtils";

const MAX_MARKS = 3;
const HEIGHT_MS = 280;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** 그날 일정의 색: 연습·일정 종합은 팀 색, 예약은 기본색(null). 같은 색은 한 번만 */
function dayMarkColors(key, practiceByDate, reservationByDate, pollsByDate) {
  const colors = [];
  const push = (color) => {
    if (colors.length >= MAX_MARKS || colors.includes(color)) return;
    colors.push(color);
  };
  for (const practice of practiceByDate.get(key) ?? []) {
    push(practice.teamColor ? toVisibleTeamColor(practice.teamColor) : null);
  }
  for (const poll of pollsByDate.get(key) ?? []) {
    push(poll.team?.teamColor ? toVisibleTeamColor(poll.team.teamColor) : null);
  }
  if ((reservationByDate.get(key)?.length ?? 0) > 0) push(null);
  return colors;
}

export default function ClubHomeCalendar({ selected, onSelect, practiceByDate, reservationByDate, pollsByDate }) {
  const [expanded, setExpanded] = useState(false);
  const touchStart = useRef(null);
  const viewportRef = useRef(null);
  const lastHeightRef = useRef(null);
  const date = parseDateKey(selected);
  const today = formatDateKey(new Date());
  const month = date.getMonth();
  const year = date.getFullYear();
  const weekStart = new Date(year, month, date.getDate() - date.getDay());
  const cells = expanded ? buildMonthWeeks(date).flat() : WEEK_LABELS.map((_, index) => {
    const day = new Date(year, month, date.getDate() - date.getDay() + index);
    return { key: formatDateKey(day), date: day };
  });

  // 보이는 기간이 바뀌면(주·달 이동) 방향에 맞춰 밀어 넣는다. 같은 기간 안에서 날짜만 고르면 그대로.
  const periodKey = expanded
    ? `m:${year}-${String(month + 1).padStart(2, "0")}`
    : `w:${formatDateKey(weekStart)}`;
  const [motion, setMotion] = useState({ key: periodKey, kind: "none" });
  if (motion.key !== periodKey) {
    const modeChanged = motion.key[0] !== periodKey[0];
    setMotion({
      key: periodKey,
      kind: modeChanged ? "mode" : periodKey > motion.key ? "next" : "prev",
    });
  }

  // 주간 ↔ 월간, 또는 5주 ↔ 6주 달처럼 높이가 바뀌면 부드럽게 늘이고 줄인다
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const to = el.offsetHeight;
    const from = lastHeightRef.current;
    lastHeightRef.current = to;
    if (from == null || from === to || prefersReducedMotion() || !el.animate) return;
    el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: HEIGHT_MS, easing: EASE });
  }, [periodKey]);

  function move(direction) {
    const target = expanded
      ? new Date(year, month + direction, Math.min(date.getDate(), new Date(year, month + direction + 1, 0).getDate()))
      : new Date(year, month, date.getDate() + direction * 7);
    onSelect(formatDateKey(target));
  }

  return <div className="dCal">
    <div className="dCal__head">
      <p className="dCal__title">{year !== new Date().getFullYear() && <small>{year}년 </small>}{month + 1}월</p>
      <div className="dCal__tools">
        {selected !== today && <button type="button" className="dCal__today" onClick={() => onSelect(today)}>오늘</button>}
        <button type="button" className="dCal__icon" aria-label={expanded ? "이전 달" : "이전 주"} onClick={() => move(-1)}><IoChevronBack /></button>
        <button type="button" className="dCal__icon" aria-label={expanded ? "다음 달" : "다음 주"} onClick={() => move(1)}><IoChevronForward /></button>
        <button type="button" className="dCal__mode" aria-pressed={expanded} onClick={() => setExpanded(v => !v)}>
          {expanded ? "주간" : "월간"}
        </button>
      </div>
    </div>
    <div className="dCal__weekdays" aria-hidden="true">
      {WEEK_LABELS.map((label, index) => <span className="dCal__weekday" data-sunday={index === 0 || undefined} key={label}>{label}</span>)}
    </div>
    <div className="dCal__viewport" ref={viewportRef}
      onTouchStart={e => { touchStart.current = e.touches[0]; }}
      onTouchEnd={e => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.clientX;
        const dy = e.changedTouches[0].clientY - start.clientY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      }}>
      <div key={periodKey} className="dCal__grid" data-expanded={expanded} data-motion={motion.kind}>
        {cells.map(cell => {
          if (!cell.date) return <span key={cell.key} />;
          const count = (practiceByDate.get(cell.key)?.length ?? 0) + (reservationByDate.get(cell.key)?.length ?? 0) + (pollsByDate.get(cell.key)?.length ?? 0);
          const colors = count > 0 ? dayMarkColors(cell.key, practiceByDate, reservationByDate, pollsByDate) : [];
          return <button type="button" key={cell.key} className="dCal__day" aria-pressed={selected === cell.key}
            aria-current={cell.key === today ? "date" : undefined} data-outside={cell.date.getMonth() !== month || undefined}
            aria-label={cell.key + (count ? `, 일정 ${count}건` : "")} onClick={() => onSelect(cell.key)}>
            <span>{cell.date.getDate()}</span>
            <span className="dCal__marks" aria-hidden="true">
              {colors.length === 0
                ? <i />
                : colors.map((color, index) => <i key={color ?? `base-${index}`} data-on style={color ? { "--mark": color } : undefined} />)}
            </span>
          </button>;
        })}
      </div>
    </div>
  </div>;
}
