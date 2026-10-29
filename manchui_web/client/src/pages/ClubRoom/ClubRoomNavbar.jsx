import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import {
  IoHome,
  IoHomeOutline,
  IoCalendar,
  IoCalendarOutline,
  IoPerson,
  IoPersonOutline,
  IoMusicalNotes,
  IoMusicalNotesOutline,
  IoPeople,
  IoPeopleOutline,
  IoArrowBackOutline,
} from "react-icons/io5";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import { useAuth } from "../../context/AuthContext";
import {
  CLUB_UNDER_DEVELOPMENT_MESSAGE,
  isClubPathBlockedForReservationDeploy,
} from "../../config/clubFeatureFlags";

/** 하단 탭(모바일)과 사이드바(PC)가 같은 목록을 사용 */
const NAV_ITEMS = [
  {
    path: "/club",
    label: "홈",
    Icon: IoHomeOutline,
    ActiveIcon: IoHome,
    isActive: (pathname) => (pathname.replace(/\/+$/, "") || "/") === "/club",
  },
  {
    path: "/club/team",
    label: "팀",
    Icon: IoPeopleOutline,
    ActiveIcon: IoPeople,
    isActive: (pathname) => pathname.startsWith("/club/team"),
  },
  {
    path: "/club/reservation",
    label: "예약",
    sideLabel: "동아리방 예약",
    Icon: IoCalendarOutline,
    ActiveIcon: IoCalendar,
    isActive: (pathname) => pathname.startsWith("/club/reservation"),
  },
  {
    path: "/club/recommend",
    label: "추천",
    sideLabel: "노래 추천",
    Icon: IoMusicalNotesOutline,
    ActiveIcon: IoMusicalNotes,
    isActive: (pathname) => pathname.startsWith("/club/recommend"),
  },
  {
    path: "/club/mypage",
    label: "마이페이지",
    Icon: IoPersonOutline,
    ActiveIcon: IoPerson,
    isActive: (pathname) => pathname.startsWith("/club/mypage"),
  },
];

const ClubRoomNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();
  const modal = useManchuiModal();
  const { user } = useAuth();

  if (location.pathname.includes("/club/team/join")) {
    return <div className="ClubRoomNavbar ClubRoomNavbar--joinOnly" />;
  }

  const isTabLimited = (targetPath) =>
    isClubPathBlockedForReservationDeploy(targetPath);

  const goTab = async (targetPath) => {
    if (isTabLimited(targetPath)) {
      await modal(CLUB_UNDER_DEVELOPMENT_MESSAGE, "alert");
      return;
    }
    nav(targetPath);
  };

  const items = NAV_ITEMS.map((item) => ({
    ...item,
    active: item.isActive(location.pathname),
    limited: isTabLimited(item.path),
  }));

  const itemClass = (base, { active, limited }) =>
    [base, active && `${base}--active`, limited && `${base}--limited`]
      .filter(Boolean)
      .join(" ");

  return (
    <>
      <nav className="ClubRoomBottomNav" aria-label="클럽룸 하단 메뉴">
        {items.map((item) => {
          const Icon = item.active ? item.ActiveIcon : item.Icon;
          return (
            <button
              key={item.path}
              type="button"
              className={itemClass("ClubRoomBottomNav__item", item)}
              onClick={() => void goTab(item.path)}
              aria-current={item.active ? "page" : undefined}
              aria-disabled={item.limited || undefined}
            >
              <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
                <Icon className="ClubRoomBottomNav__icon" />
              </span>
              <span className="ClubRoomBottomNav__label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <nav className="ClubRoomSideNav" aria-label="어시스턴트 메뉴">
        <Link to="/" className="ClubRoomSideNav__brand">
          <span className="ClubRoomSideNav__logo">MANCHUI</span>
          <span className="ClubRoomSideNav__brandSub">어시스턴트</span>
        </Link>

        <ul className="ClubRoomSideNav__list">
          {items.map((item) => {
            const Icon = item.active ? item.ActiveIcon : item.Icon;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  className={itemClass("ClubRoomSideNav__item", item)}
                  onClick={() => void goTab(item.path)}
                  aria-current={item.active ? "page" : undefined}
                  aria-disabled={item.limited || undefined}
                >
                  <Icon className="ClubRoomSideNav__icon" aria-hidden />
                  <span>{item.sideLabel ?? item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="ClubRoomSideNav__footer">
          {user ? (
            <button
              type="button"
              className="ClubRoomSideNav__user"
              onClick={() => nav("/club/mypage")}
            >
              <span className="ClubRoomSideNav__avatar" aria-hidden>
                <IoPersonOutline />
              </span>
              <span className="ClubRoomSideNav__userText">
                <span className="ClubRoomSideNav__userName">
                  {user.username ?? "이름 없음"}
                </span>
                <span className="ClubRoomSideNav__userSub">내 정보</span>
              </span>
            </button>
          ) : null}
          <Link to="/" className="ClubRoomSideNav__exit">
            <IoArrowBackOutline aria-hidden />
            메인 사이트로
          </Link>
        </div>
      </nav>
    </>
  );
};

export default ClubRoomNavbar;
