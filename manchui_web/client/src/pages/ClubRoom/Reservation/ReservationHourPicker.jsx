import React, { Fragment, useEffect, useMemo, useRef } from "react";
import { findReservationForHour, getHourSlotState } from "./reservationLookup";
import { hourLabelPeriodClass, isAmHourSlot } from "./reservationTimeFormat";

const FIRST_HOUR = 0;
const LAST_HOUR = 23;
/** 시트 열릴 때 가로 스크롤 기준(정오) */
const HOUR_SCROLL_ANCHOR = 12;

export default function ReservationHourPicker({
  active,
  selectedDateKey,
  selectedHours,
  reservedOnSelected,
  todayKey,
  canCreateReservation,
  allReservations,
  onSelectHour,
  onViewReservation,
}) {
  const hourScrollRef = useRef(null);

  const hourSlots = useMemo(() => {
    const list = [];
    for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) list.push(h);
    return list;
  }, []);

  useEffect(() => {
    if (!active || !selectedDateKey) return;
    const scrollEl = hourScrollRef.current;
    if (!scrollEl) return;

    const run = () => {
      const anchor = scrollEl.querySelector(
        `[data-hour-scroll-anchor="${HOUR_SCROLL_ANCHOR}"]`,
      );
      if (!anchor) return;
      const scrollRect = scrollEl.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const delta =
        anchorRect.left +
        anchorRect.width / 2 -
        (scrollRect.left + scrollRect.width / 2);
      scrollEl.scrollLeft = Math.max(0, scrollEl.scrollLeft + delta);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  }, [active, selectedDateKey]);

  return (
    <>
      <div className="reservation__hourPeriodLegend" aria-hidden="true">
        <span className="reservation__hourPeriodLegend__am">오전 (0~12시)</span>
        <span className="reservation__hourPeriodLegend__pm">
          오후 (12~24시)
        </span>
      </div>
      <div className="reservation__hourTrack">
        <div ref={hourScrollRef} className="reservation__hourScroll">
          <div
            className="reservation__hourScrollInner"
            role="group"
            aria-label="0시부터 23시까지 시간대 선택"
          >
            <span className="reservation__hourLabelWrap">
              <span
                className={`reservation__hourLabel ${hourLabelPeriodClass(FIRST_HOUR)}`}
              >
                {FIRST_HOUR}
              </span>
            </span>
            {hourSlots.map((h) => {
              const { reserved, visuallyBlocked, disabled } = getHourSlotState(
                h,
                {
                  reservedOnSelected,
                  selectedDateKey,
                  todayKey,
                  canCreateReservation,
                },
              );
              const selected = selectedHours.includes(h);
              const amSlot = isAmHourSlot(h);
              return (
                <Fragment key={h}>
                  <button
                    type="button"
                    disabled={disabled}
                    data-hour-scroll-anchor={
                      h === HOUR_SCROLL_ANCHOR ? HOUR_SCROLL_ANCHOR : undefined
                    }
                    className={`reservation__hourCell${selected ? " reservation__hourCell--selected" : ""}${visuallyBlocked ? " reservation__hourCell--blocked" : ""}${reserved ? " reservation__hourCell--reserved" : ""}${amSlot ? " reservation__hourCell--am" : " reservation__hourCell--pm"}`}
                    onClick={() => {
                      if (reserved) {
                        const r = findReservationForHour(
                          selectedDateKey,
                          h,
                          allReservations,
                        );
                        if (r) onViewReservation(r);
                        return;
                      }
                      if (!disabled) onSelectHour(h);
                    }}
                    aria-pressed={selected}
                    aria-label={
                      reserved
                        ? `${h}시~${h + 1}시 예약됨, 정보 보기`
                        : visuallyBlocked
                          ? `${h}시~${h + 1}시 구간 예약 불가`
                          : selected
                            ? `${h}시~${h + 1}시 구간 선택됨`
                            : `${h}시~${h + 1}시 구간 선택`
                    }
                  />
                  <span className="reservation__hourLabelWrap">
                    <span
                      className={`reservation__hourLabel ${hourLabelPeriodClass(h + 1)}`}
                    >
                      {h + 1}
                    </span>
                  </span>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
