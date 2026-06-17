import React from "react";
import ReservationMyCardSkeleton from "./ReservationMyCardSkeleton";

const DEFAULT_COUNT = 2;

const ReservationMyListSkeleton = ({
  count = DEFAULT_COUNT,
  showQuota = true,
}) => {
  return (
    <div
      className="reservationMySkeleton"
      aria-busy="true"
      aria-label="불러오는 중"
    >
      {showQuota ? (
        <span className="reservationSkeleton__line reservationSkeleton__line--quota reservationSkeleton__block" />
      ) : null}
      <ul className="reservation__myList">
        {Array.from({ length: count }, (_, i) => (
          <ReservationMyCardSkeleton key={`res-mine-sk-${i}`} />
        ))}
      </ul>
    </div>
  );
};

export default ReservationMyListSkeleton;
