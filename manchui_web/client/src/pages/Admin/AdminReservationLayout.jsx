import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AdminReservationLayout.css";

const SUB_NAV = [
  { to: "/admin/reservation", label: "예약 관리", end: true },
  { to: "/admin/reservation/limits", label: "예약 건수 제한" },
];

const AdminReservationLayout = () => {
  return (
    <div className="admin-reservation-layout">
      <nav
        className="admin-reservation-layout__tabs"
        aria-label="예약 관리 하위 메뉴"
      >
        {SUB_NAV.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={Boolean(end)}
            className={({ isActive }) =>
              `admin-reservation-layout__tab${isActive ? " admin-reservation-layout__tab--active" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
};

export default AdminReservationLayout;
