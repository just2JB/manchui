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

const TEMP_TABS = [{ id: "temp-home", label: "홈", Icon: IoHomeOutline }];

const ClubRoomNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();

  if (location.pathname.includes("/club/team/join")) {
    return <div className="ClubRoomNavbar ClubRoomNavbar--joinOnly" />;
  }

  const isHome = location.pathname.startsWith("/club");
  const isMypage = location.pathname.startsWith("/club/mypage");
  const isReservation = location.pathname.startsWith("/club/reservation");
  const isRecommend = location.pathname.startsWith("/club/recommend");
  const isTeam = location.pathname.startsWith("/club/team");

  return (
    <nav className="ClubRoomBottomNav" aria-label="클럽룸 하단 메뉴">
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isHome ? " ClubRoomBottomNav__item--active" : ""}`}
        onClick={() => nav("/club")}
      >
        <IoHomeOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">홈</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isTeam ? " ClubRoomBottomNav__item--active" : ""}`}
        onClick={() => nav("/club/team")}
      >
        <IoPeopleOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">팀</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isReservation ? " ClubRoomBottomNav__item--active" : ""}`}
        onClick={() => nav("/club/reservation")}
      >
        <IoCalendarOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">예약</span>
      </button>
      <button
        type="button"
        className={`ClubRoomBottomNav__item${isRecommend ? " ClubRoomBottomNav__item--active" : ""}`}
        onClick={() => nav("/club/recommend")}
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
        onClick={() => nav("/club/mypage")}
      >
        <IoPersonOutline className="ClubRoomBottomNav__icon" aria-hidden />
        <span className="ClubRoomBottomNav__label">마이페이지</span>
      </button>
    </nav>
  );
};

export default ClubRoomNavbar;
