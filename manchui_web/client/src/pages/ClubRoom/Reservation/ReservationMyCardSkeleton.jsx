import React from "react";

const ReservationMyCardSkeleton = () => (
  <li className="reservation__myCard reservation__myCard--skeleton" aria-hidden="true">
    <div className="reservation__myMain">
      <span className="reservationSkeleton__line reservationSkeleton__line--date reservationSkeleton__block" />
      <span className="reservationSkeleton__line reservationSkeleton__line--time reservationSkeleton__block" />
      <span className="reservationSkeleton__line reservationSkeleton__line--meta reservationSkeleton__block" />
    </div>
    <div className="reservation__myActions">
      <span className="reservationSkeleton__btn reservationSkeleton__block" />
      <span className="reservationSkeleton__btn reservationSkeleton__btn--wide reservationSkeleton__block" />
    </div>
  </li>
);

export default ReservationMyCardSkeleton;
