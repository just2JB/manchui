import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import {
  IoHomeOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
} from "react-icons/io5";
import { useManchuiModal } from "../../hooks/ManchuiModal";
import {
  CLUB_RESERVATION_ONLY_DEPLOY,
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

  const goTab = async (targetPath) => {
    if (
      CLUB_RESERVATION_ONLY_DEPLOY &&
      isClubPathBlockedForReservationDeploy(targetPath)
    ) {
      await modal(CLUB_UNDER_DEVELOPMENT_MESSAGE, "alert");
      return;
    }
    nav(targetPath);
  };

  return (
    <nav className="ClubRoomBottomNav" aria-label="클럽룸 하단 메뉴">
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isHome ? " ClubRoomBottomNav__item--active" : ""}${CLUB_RESERVATION_ONLY_DEPLOY ? " ClubRoomBottomNav__item--limited" : ""}`}
        onClick={() => void goTab("/club")}
        aria-disabled={CLUB_RESERVATION_ONLY_DEPLOY || undefined}
      >
        <IoHomeOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">홈</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isTeam ? " ClubRoomBottomNav__item--active" : ""}${CLUB_RESERVATION_ONLY_DEPLOY ? " ClubRoomBottomNav__item--limited" : ""}`}
        onClick={() => void goTab("/club/team")}
        aria-disabled={CLUB_RESERVATION_ONLY_DEPLOY || undefined}
      >
        <IoPeopleOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">팀</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isReservation ? " ClubRoomBottomNav__item--active" : ""}`}
        onClick={() => void goTab("/club/reservation")}
      >
        <IoCalendarOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">예약</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isRecommend ? " ClubRoomBottomNav__item--active" : ""}${CLUB_RESERVATION_ONLY_DEPLOY ? " ClubRoomBottomNav__item--limited" : ""}`}
        onClick={() => void goTab("/club/recommend")}
        aria-disabled={CLUB_RESERVATION_ONLY_DEPLOY || undefined}
      >
        <IoMusicalNotesOutline
          className="ClubRoomBottomNav__icon"
          aria-hidden
        />
        <span className="ClubRoomBottomNav__label">추천</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isMypage ? " ClubRoomBottomNav__item--active" : ""}`}
        onClick={() => void goTab("/club/mypage")}
      >
        <IoPersonOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">마이페이지</span>
      </button>
    </nav>
  );
};

export default ClubRoomNavbar;
