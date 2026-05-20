import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { useAuth } from "../../context/AuthContext";
import {
  IoAlbumsOutline,
  IoCalendarOutline,
  IoChatbubbleEllipsesOutline,
  IoClipboardOutline,
  IoGiftOutline,
  IoHomeOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import "./AdminNavbar.css";

const NAV_ITEMS = [
  { to: "/admin", label: "홈", end: true, Icon: IoHomeOutline },
  { to: "/admin/join", label: "가입 신청", Icon: IoClipboardOutline },
  { to: "/admin/reservation", label: "예약 관리", Icon: IoCalendarOutline },
  { to: "/admin/recommendation", label: "곡 추천", Icon: IoMusicalNotesOutline },
  { to: "/admin/lottery", label: "상품 추첨", Icon: IoGiftOutline },
  { to: "/admin/setting", label: "웹 설정", Icon: IoSettingsOutline },
  { to: "/admin/contact", label: "문의", Icon: IoChatbubbleEllipsesOutline },
  { to: "/admin/member", label: "부원", Icon: IoPeopleOutline },
];

const AdminNavbar = ({ user }) => {
  const nav = useNavigate();
  const manchuiModal = useManchuiModal();
  const { logout } = useAuth();

  const handleLogout = async () => {
    if (!(await manchuiModal("로그아웃 하시겠습니까?", "confirm"))) return;
    let message = "로그아웃 되었습니다.";
    try {
      const res = await apiClient.post(
        "/api/auth/logout",
        {},
        { withCredentials: true },
      );
      if (res?.data?.message) message = res.data.message;
    } catch (e) {
      console.log(e);
    } finally {
      await manchuiModal(message);
      logout();
      nav("/");
    }
  };

  return (
    <header className="admin-nav">
      <div className="admin-nav__inner">
        <Link to="/admin" className="admin-nav__brand" title="관리자 홈">
          <span className="admin-nav__brand-mark">MANCHUI</span>
          <span className="admin-nav__brand-sub">임원진</span>
        </Link>

        <nav className="admin-nav__links" aria-label="관리자 메뉴">
          {NAV_ITEMS.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={Boolean(end)}
              className={({ isActive }) =>
                `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`
              }
            >
              <Icon className="admin-nav__linkIcon" aria-hidden />
              <span className="admin-nav__linkText">{label}</span>
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
            <IoAlbumsOutline className="admin-nav__clubIcon" aria-hidden />
            <span>동아리방</span>
          </Link>
          <button
            type="button"
            className="admin-nav__logout"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
