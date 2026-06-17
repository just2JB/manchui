import React from "react";
import { Link } from "react-router-dom";
import {
  IoCalendarOutline,
  IoClipboardOutline,
  IoGiftOutline,
  IoMusicalNotesOutline,
  IoPeopleOutline,
  IoPeopleCircleOutline,
  IoSettingsOutline,
} from "react-icons/io5";
import "./AdminHome.css";

const HOME_LINKS = [
  {
    to: "/admin/join",
    label: "가입 신청 관리",
    Icon: IoClipboardOutline,
  },
  {
    to: "/admin/reservation",
    label: "예약 관리",
    Icon: IoCalendarOutline,
  },
  {
    to: "/admin/recommendation",
    label: "곡 추천 관리",
    Icon: IoMusicalNotesOutline,
  },
  {
    to: "/admin/lottery",
    label: "상품 추첨",
    Icon: IoGiftOutline,
  },
  {
    to: "/admin/member",
    label: "부원 관리",
    Icon: IoPeopleOutline,
  },
  {
    to: "/admin/team",
    label: "팀 관리",
    Icon: IoPeopleCircleOutline,
  },
  {
    to: "/admin/setting",
    label: "웹페이지 설정",
    Icon: IoSettingsOutline,
  },
];

const AdminHome = () => {
  return (
    <div className="adminHome">
      <p className="adminHome__lead">업무 메뉴를 선택하세요.</p>

      <div className="linkBox">
        {HOME_LINKS.map(({ to, label, Icon }) => (
          <Link key={to} className="linkbutton" to={to}>
            <Icon className="adminHome__linkIcon" aria-hidden />
            <span className="adminHome__linkLabel">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
