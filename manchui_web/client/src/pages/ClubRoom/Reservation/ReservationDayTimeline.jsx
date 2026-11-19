import React, { useMemo } from "react";
import { getReservationBookerName } from "./reservationLookup";
import { formatReservationTimeRange } from "./reservationTimeFormat";
import "./ReservationDayTimeline.css";

const ROWS = [
  { key: "am", label: "오전", from: 0 },
  { key: "pm", label: "오후", from: 12 },
];
const TICKS = [0, 3, 6, 9];

/** 예약 시간 배열 → 연속 구간들 [{ start, end }] (end 는 끝 시각, 예: 18~20시면 end=20) */
function toSegments(timeArr) {
  const hours = [...new Set((timeArr ?? []).map(Number).filter((n) => !Number.isNaN(n)))].sort(
    (a, b) => a - b,
  );
  const segments = [];
  for (const h of hours) {
    const last = segments[segments.length - 1];
    if (last && last.end === h) last.end = h + 1;
    else segments.push({ start: h, end: h + 1 });
  }
  return segments;
}

/**
 * 선택한 날의 예약을 하루 시간 막대(오전/오후 두 줄)로 그린다.
 * 내 예약은 반전색 블록, 다른 팀은 회색 블록, 오늘이면 지난 시간은 흐리게 + 현재 시각 빨간 선.
 * 팀 이름은 블록 위에 겹쳐 왼쪽 아래 모서리에 회색으로. 다른 팀 이름은 다음 블록 시작 전까지 넘쳐도 되고,
 * 내 예약(밝은 블록) 이름은 블록 밖에선 안 보이므로 블록 안에서만 줄임표 처리.
 * 블록을 누르면 예약 상세(onSelect)를 연다.
 * selectable 이면 빈 칸을 눌러 예약할 시간을 고른다(onSelectHour: 시작 → 끝 순서, 규칙은 부모가 처리).
 */
export default function ReservationDayTimeline({
  reservations,
  myIds,
  isToday,
  now,
  onSelect,
  selectable = false,
  selectedHours = [],
  isHourBlocked,
  onSelectHour,
  footer = null,
}) {
  const selectedSet = useMemo(() => new Set(selectedHours.map(Number)), [selectedHours]);
  const blocks = useMemo(() => {
    const out = [];
    for (const r of reservations) {
      const mine = myIds.has(String(r._id));
      for (const seg of toSegments(r.time)) {
        // 오전/오후 경계(12시)를 넘으면 두 줄로 나눈다
        for (const row of ROWS) {
          const start = Math.max(seg.start, row.from);
          const end = Math.min(seg.end, row.from + 12);
          if (start < end) out.push({ r, mine, row: row.key, start, end });
        }
      }
    }
    return out;
  }, [reservations, myIds]);

  const nowHour = now ? now.getHours() + now.getMinutes() / 60 : null;

  return (
    <div className="dayTimeline">
      {ROWS.map((row) => {
        const rowBlocks = blocks
          .filter((b) => b.row === row.key)
          .sort((a, b) => a.start - b.start);
        const showNow = isToday && nowHour != null && nowHour >= row.from && nowHour < row.from + 12;
        return (
          <div key={row.key} className="dayTimeline__row">
            <span className="dayTimeline__rowLabel">{row.label}</span>
            <div className="dayTimeline__track">
              <div className="dayTimeline__ticks" aria-hidden="true">
                {TICKS.map((t) => (
                  <span key={t} style={{ gridColumn: `${t + 1} / span 3` }}>
                    {row.from + t}
                  </span>
                ))}
              </div>
              <div className="dayTimeline__lane">
                {Array.from({ length: 12 }, (_, i) => {
                  const h = row.from + i;
                  const past = isToday && nowHour != null && h + 1 <= nowHour;
                  const selected = selectedSet.has(h);
                  const blocked = isHourBlocked ? isHourBlocked(h) : past;
                  if (!selectable || blocked) {
                    return (
                      <span
                        key={h}
                        className="dayTimeline__cell"
                        data-past={past || undefined}
                        style={{ gridColumn: `${i + 1}` }}
                        aria-hidden="true"
                      />
                    );
                  }
                  return (
                    <button
                      key={h}
                      type="button"
                      className="dayTimeline__cell dayTimeline__cell--free"
                      data-selected={selected || undefined}
                      data-range-start={(selected && !selectedSet.has(h - 1)) || undefined}
                      data-range-end={(selected && !selectedSet.has(h + 1)) || undefined}
                      style={{ gridColumn: `${i + 1}` }}
                      onClick={() => onSelectHour?.(h)}
                      aria-pressed={selected}
                      aria-label={`${h}시`}
                    />
                  );
                })}
                {rowBlocks.map((b) => {
                  const name = getReservationBookerName(b.r);
                  const span = b.end - b.start;
                  return (
                    <button
                      key={`${b.r._id}-${b.start}`}
                      type="button"
                      className="dayTimeline__block"
                      data-mine={b.mine || undefined}
                      data-narrow={span < 2 || undefined}
                      style={{ gridColumn: `${b.start - row.from + 1} / span ${span}` }}
                      onClick={() => onSelect?.(b.r)}
                      title={`${formatReservationTimeRange(b.r.time)} · ${name}`}
                      aria-label={`${formatReservationTimeRange(b.r.time)} ${name}${b.mine ? " (내 예약)" : ""} 상세 보기`}
                    >
                    </button>
                  );
                })}
                {rowBlocks.map((b, i) => {
                  // 이름표: 블록 시작 칸부터 — 다른 팀은 다음 블록 시작 전(또는 줄 끝)까지, 내 예약은 블록 안까지
                  const nextStart = b.mine ? b.end : (rowBlocks[i + 1]?.start ?? row.from + 12);
                  return (
                    <span
                      key={`label-${b.r._id}-${b.start}`}
                      className="dayTimeline__label"
                      data-mine={b.mine || undefined}
                      style={{ gridColumn: `${b.start - row.from + 1} / ${nextStart - row.from + 1}` }}
                      aria-hidden="true"
                    >
                      {getReservationBookerName(b.r)}
                    </span>
                  );
                })}
                {showNow ? (
                  <span
                    className="dayTimeline__now"
                    style={{ left: `${((nowHour - row.from) / 12) * 100}%` }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
      {/* 아래 줄: 왼쪽 칸 설명(고른 뒤에만) · 오른쪽 예약 버튼 */}
      <div className="dayTimeline__foot">
        {selectable && selectedHours.length > 0 ? (
          <div className="dayTimeline__legend" aria-hidden="true">
            <span><i data-kind="free" />비어 있음</span>
            <span><i data-kind="picked" />고른 칸</span>
            <span><i data-kind="other" />선택 불가</span>
          </div>
        ) : (
          <span />
        )}
        {footer}
      </div>
    </div>
  );
}
