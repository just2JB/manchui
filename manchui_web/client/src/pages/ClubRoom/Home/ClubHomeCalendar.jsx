import { useRef, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { WEEK_LABELS, buildMonthWeeks, formatDateKey } from "../Team/teamCalendarUtils";
import { parseDateKey } from "./clubHomeUtils";

export default function ClubHomeCalendar({ selected, onSelect, practiceByDate, reservationByDate, pollsByDate }) {
  const [expanded, setExpanded] = useState(false);
  const touchStart = useRef(null);
  const date = parseDateKey(selected);
  const today = formatDateKey(new Date());
  const month = date.getMonth();
  const year = date.getFullYear();
  const cells = expanded ? buildMonthWeeks(date).flat() : WEEK_LABELS.map((_, index) => {
    const day = new Date(year, month, date.getDate() - date.getDay() + index);
    return { key: formatDateKey(day), date: day };
  });

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
    <div className="dCal__grid" data-expanded={expanded}
      onTouchStart={e => { touchStart.current = e.touches[0]; }}
      onTouchEnd={e => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.clientX;
        const dy = e.changedTouches[0].clientY - start.clientY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      }}>
      {WEEK_LABELS.map((label, index) => <span className="dCal__weekday" data-sunday={index === 0 || undefined} key={label}>{label}</span>)}
      {cells.map(cell => {
        if (!cell.date) return <span key={cell.key} />;
        const count = (practiceByDate.get(cell.key)?.length ?? 0) + (reservationByDate.get(cell.key)?.length ?? 0) + (pollsByDate.get(cell.key)?.length ?? 0);
        return <button type="button" key={cell.key} className="dCal__day" aria-pressed={selected === cell.key}
          aria-current={cell.key === today ? "date" : undefined} data-outside={cell.date.getMonth() !== month || undefined}
          aria-label={cell.key + (count ? `, 일정 ${count}건` : "")} onClick={() => onSelect(cell.key)}>
          <span>{cell.date.getDate()}</span>
          <i aria-hidden="true" data-on={count > 0 || undefined} />
        </button>;
      })}
    </div>
  </div>;
}
