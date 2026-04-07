import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";
import {
  IoHomeOutline,
  IoCalendarOutline,
  IoChatbubbleOutline,
  IoNotificationsOutline,
  IoPersonOutline,
} from "react-icons/io5";

const TEMP_TABS = [
  { id: "temp-home", label: "홈", Icon: IoHomeOutline },
  { id: "temp-schedule", label: "일정", Icon: IoCalendarOutline },
  { id: "temp-chat", label: "채팅", Icon: IoChatbubbleOutline },
  { id: "temp-alert", label: "알림", Icon: IoNotificationsOutline },
];

const ClubRoomNavbar = () => {
  const location = useLocation();
  const nav = useNavigate();

  if (location.pathname.includes("/club/team/join")) {
    return <div className="ClubRoomNavbar ClubRoomNavbar--joinOnly" />;
  }

  const isMypage = location.pathname.startsWith("/club/mypage");

  return (
    <nav className="ClubRoomBottomNav" aria-label="클럽룸 하단 메뉴">
      {TEMP_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="ClubRoomBottomNav__item ClubRoomBottomNav__item--placeholder"
          disabled
          title={`${label} (준비 중)`}
        >
          <Icon className="ClubRoomBottomNav__icon" aria-hidden />
          <span className="ClubRoomBottomNav__label">{label}</span>
        </button>
      ))}
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
