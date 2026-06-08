import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

function buildYearRange(minYear, maxYear) {
  const years = [];
  for (let y = maxYear; y >= minYear; y -= 1) years.push(y);
  return years;
}

export default function ReservationMonthNav({
  viewMonth,
  slideDir,
  goPrevMonth,
  goNextMonth,
  navigateToMonth,
  yearMin,
  yearMax,
}) {
  const [picker, setPicker] = useState(null);
  const navRef = useRef(null);

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const min = yearMin ?? now;
    const max = yearMax ?? now + 2;
    return buildYearRange(min, max);
  }, [yearMin, yearMax]);

  useEffect(() => {
    if (!picker) return undefined;

    const onPointerDown = (e) => {
      if (navRef.current?.contains(e.target)) return;
      setPicker(null);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setPicker(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [picker]);

  const goToYear = (nextYear) => {
    navigateToMonth(new Date(nextYear, monthIndex, 1));
    setPicker(null);
  };

  const goToMonth = (nextMonthIndex) => {
    navigateToMonth(new Date(year, nextMonthIndex, 1));
    setPicker(null);
  };

  const titleWrapClass = [
    "reservation__monthTitleWrap",
    slideDir ? "reservation__monthTitleWrap--slide" : "",
    picker ? "reservation__monthTitleWrap--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="reservation__monthNav" ref={navRef}>
      <button
        type="button"
        className="reservation__monthBtn"
        onClick={goPrevMonth}
        aria-label="이전 달"
      >
        <IoChevronBack />
      </button>

      <div className={titleWrapClass}>
        <button
          type="button"
          className={`reservation__monthPickBtn${picker === "year" ? " reservation__monthPickBtn--active" : ""}`}
          onClick={() => setPicker((p) => (p === "year" ? null : "year"))}
          aria-expanded={picker === "year"}
          aria-haspopup="listbox"
        >
          {year}년
        </button>
        <button
          type="button"
          className={`reservation__monthPickBtn${picker === "month" ? " reservation__monthPickBtn--active" : ""}`}
          onClick={() => setPicker((p) => (p === "month" ? null : "month"))}
          aria-expanded={picker === "month"}
          aria-haspopup="listbox"
        >
          {monthIndex + 1}월
        </button>

        {picker === "year" ? (
          <div
            className="reservation__monthPicker reservation__monthPicker--year"
            role="listbox"
            aria-label="연도 선택"
          >
            {years.map((y) => (
              <button
                key={y}
                type="button"
                role="option"
                aria-selected={y === year}
                className={`reservation__monthPickerItem${y === year ? " reservation__monthPickerItem--selected" : ""}`}
                onClick={() => goToYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        ) : null}

        {picker === "month" ? (
          <div
            className="reservation__monthPicker reservation__monthPicker--month"
            role="listbox"
            aria-label="월 선택"
          >
            {MONTH_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                role="option"
                aria-selected={i === monthIndex}
                className={`reservation__monthPickerItem${i === monthIndex ? " reservation__monthPickerItem--selected" : ""}`}
                onClick={() => goToMonth(i)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="reservation__monthBtn"
        onClick={goNextMonth}
        aria-label="다음 달"
      >
        <IoChevronForward />
      </button>
    </div>
  );
}
