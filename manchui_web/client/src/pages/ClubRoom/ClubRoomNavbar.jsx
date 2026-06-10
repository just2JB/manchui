import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "react-icons/io5";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import {
  CLUB_UNDER_DEVELOPMENT_MESSAGE,
  isClubPathBlockedForReservationDeploy,
} from "../../config/clubFeatureFlags";

const ClubRoomNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();
  const modal = useManchuiModal();

  if (location.pathname.includes("/club/team/join")) {
    return <div className="ClubRoomNavbar ClubRoomNavbar--joinOnly" />;
  }

  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isHome = path === "/club";
  const isMypage = location.pathname.startsWith("/club/mypage");
  const isReservation = location.pathname.startsWith("/club/reservation");
  const isRecommend = location.pathname.startsWith("/club/recommend");
  const isTeam = location.pathname.startsWith("/club/team");

  const isTabLimited = (targetPath) =>
    isClubPathBlockedForReservationDeploy(targetPath);

  const goTab = async (targetPath) => {
    if (isTabLimited(targetPath)) {
      await modal(CLUB_UNDER_DEVELOPMENT_MESSAGE, "alert");
      return;
    }
    nav(targetPath);
  };

  const navItemClass = (active, limited = false) =>
    [
      "ClubRoomBottomNav__item",
      active && "ClubRoomBottomNav__item--active",
      limited && "ClubRoomBottomNav__item--limited",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <nav className="ClubRoomBottomNav" aria-label="클럽룸 하단 메뉴">
      <button
        type="button"
        className={navItemClass(isHome, isTabLimited("/club"))}
        onClick={() => void goTab("/club")}
        aria-current={isHome ? "page" : undefined}
        aria-disabled={isTabLimited("/club") || undefined}
      >
        <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
          {isHome ? (
            <IoHome className="ClubRoomBottomNav__icon" />
          ) : (
            <IoHomeOutline className="ClubRoomBottomNav__icon" />
          )}
        </span>
        <span className="ClubRoomBottomNav__label">홈</span>
      </button>
      <button
        type="button"
        className={navItemClass(isTeam, isTabLimited("/club/team"))}
        onClick={() => void goTab("/club/team")}
        aria-current={isTeam ? "page" : undefined}
        aria-disabled={isTabLimited("/club/team") || undefined}
      >
        <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
          {isTeam ? (
            <IoPeople className="ClubRoomBottomNav__icon" />
          ) : (
            <IoPeopleOutline className="ClubRoomBottomNav__icon" />
          )}
        </span>
        <span className="ClubRoomBottomNav__label">팀</span>
      </button>
      <button
        type="button"
        className={navItemClass(isReservation)}
        onClick={() => void goTab("/club/reservation")}
        aria-current={isReservation ? "page" : undefined}
      >
        <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
          {isReservation ? (
            <IoCalendar className="ClubRoomBottomNav__icon" />
          ) : (
            <IoCalendarOutline className="ClubRoomBottomNav__icon" />
          )}
        </span>
        <span className="ClubRoomBottomNav__label">예약</span>
      </button>
      <button
        type="button"
        className={navItemClass(isRecommend, isTabLimited("/club/recommend"))}
        onClick={() => void goTab("/club/recommend")}
        aria-current={isRecommend ? "page" : undefined}
        aria-disabled={isTabLimited("/club/recommend") || undefined}
      >
        <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
          {isRecommend ? (
            <IoMusicalNotes className="ClubRoomBottomNav__icon" />
          ) : (
            <IoMusicalNotesOutline className="ClubRoomBottomNav__icon" />
          )}
        </span>
        <span className="ClubRoomBottomNav__label">추천</span>
      </button>
      <button
        type="button"
        className={navItemClass(isMypage)}
        onClick={() => void goTab("/club/mypage")}
        aria-current={isMypage ? "page" : undefined}
      >
        <span className="ClubRoomBottomNav__iconWrap" aria-hidden="true">
          {isMypage ? (
            <IoPerson className="ClubRoomBottomNav__icon" />
          ) : (
            <IoPersonOutline className="ClubRoomBottomNav__icon" />
          )}
        </span>
        <span className="ClubRoomBottomNav__label">마이페이지</span>
      </button>
    </nav>
  );
};

export default ClubRoomNavbar;
