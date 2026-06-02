import React from "react";
import AdminReservationLimits from "./AdminReservationLimits";
import "../ClubRoom/Reservation/Reservation.css";
import "./AdminReservation.css";

const AdminReservationLimitsPage = () => {
  return (
    <div className="reservation admin-reservation">
      <h1 className="admin-page-heading reservation__title">예약 건수 제한</h1>
      <AdminReservationLimits />
    </div>
  );
};

export default AdminReservationLimitsPage;
