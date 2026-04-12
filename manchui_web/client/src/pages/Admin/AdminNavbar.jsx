import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./AdminNavbar.css";

const NAV_ITEMS = [
  { to: "/admin", label: "홈", end: true },
  { to: "/admin/join", label: "가입 신청" },
  { to: "/admin/reservation", label: "예약 관리" },
  { to: "/admin/setting", label: "웹 설정" },
  { to: "/admin/contact", label: "문의" },
  { to: "/admin/member", label: "부원" },
];

const AdminNavbar = ({ user }) => {
  return (
    <header className="admin-nav">
      <div className="admin-nav__inner">
        <Link to="/admin" className="admin-nav__brand" title="관리자 홈">
          <span className="admin-nav__brand-mark">MANCHUI</span>
          <span className="admin-nav__brand-sub">임원진</span>
        </Link>

        <nav className="admin-nav__links" aria-label="관리자 메뉴">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={({ isActive }) =>
                `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-nav__actions">
          {user?.username ? (
            <span className="admin-nav__user" title="로그인 계정">
              {user.username}
            </span>
          ) : null}
          <Link to="/club" className="admin-nav__club">
            동아리방
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
