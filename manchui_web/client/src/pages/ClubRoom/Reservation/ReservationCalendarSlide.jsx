import React from "react";

export default function ReservationCalendarSlide({
  monthKey,
  slideDir,
  swipeHandlers,
  children,
}) {
  const panelClass = slideDir
    ? ` reservation__monthPanel--${slideDir}`
    : "";

  return (
    <div
      className="reservation__monthSwipe"
      {...swipeHandlers}
    >
      <div
        key={monthKey}
        className={`reservation__monthPanel${panelClass}`}
      >
        {children}
      </div>
    </div>
  );
}
