import React, { useMemo } from "react";
import { findReservationForHour, getHourSlotState } from "./reservationLookup";

const PERIODS = [
  { key: "am", label: "오전", from: 0, to: 11 },
  { key: "pm", label: "오후", from: 12, to: 23 },
];

/**
 * 시간 칩 그리드: 시작 시각 → 끝 시각 순서로 두 번 눌러 연속 구간 선택.
 * 예약된 칸을 누르면 예약 정보를 보여 줍니다.
 */
export default function ReservationHourPicker({
  selectedDateKey,
  selectedHours,
  reservedOnSelected,
  todayKey,
  canCreateReservation,
  allReservations,
  onSelectHour,
  onViewReservation,
}) {
  const selectedSet = useMemo(() => new Set(selectedHours), [selectedHours]);
  const rangeStart = selectedHours.length ? Math.min(...selectedHours) : null;
  const rangeEnd = selectedHours.length ? Math.max(...selectedHours) : null;

  const renderChip = (h) => {
    const { reserved, visuallyBlocked, disabled } = getHourSlotState(h, {
      reservedOnSelected,
      selectedDateKey,
      todayKey,
      canCreateReservation,
    });
    const selected = selectedSet.has(h);
    const past = visuallyBlocked && !reserved;
    const className = [
      "reservation__hourChip",
      selected && "reservation__hourChip--selected",
      selected && h === rangeStart && "reservation__hourChip--rangeStart",
      selected && h === rangeEnd && "reservation__hourChip--rangeEnd",
      reserved && "reservation__hourChip--reserved",
      past && "reservation__hourChip--past",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        key={h}
        type="button"
        className={className}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={
          reserved
            ? `${h}시~${h + 1}시 예약됨, 정보 보기`
            : past
              ? `${h}시~${h + 1}시 지난 시간`
              : selected
                ? `${h}시~${h + 1}시 선택됨`
                : `${h}시~${h + 1}시 선택`
        }
        onClick={() => {
          if (reserved) {
            const r = findReservationForHour(selectedDateKey, h, allReservations);
            if (r) onViewReservation(r);
            return;
          }
          if (!disabled) onSelectHour(h);
        }}
      >
        <span className="reservation__hourChipTime">{h}시</span>
        {reserved ? (
          <span className="reservation__hourChipTag">예약</span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="reservation__hourPicker">
      <ul className="reservation__hourLegend" aria-hidden="true">
        <li>
          <span className="reservation__hourLegendSwatch reservation__hourLegendSwatch--free" />
          가능
        </li>
        <li>
          <span className="reservation__hourLegendSwatch reservation__hourLegendSwatch--selected" />
          선택
        </li>
        <li>
          <span className="reservation__hourLegendSwatch reservation__hourLegendSwatch--reserved" />
          예약됨
        </li>
      </ul>
      {PERIODS.map((p) => {
        const hours = [];
        for (let h = p.from; h <= p.to; h++) hours.push(h);
        return (
          <div key={p.key} className="reservation__hourGroup">
            <span
              className={`reservation__hourGroupLabel reservation__hourGroupLabel--${p.key}`}
            >
              {p.label}
            </span>
            <div
              className="reservation__hourGrid"
              role="group"
              aria-label={`${p.label} 시간대 선택`}
            >
              {hours.map(renderChip)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
