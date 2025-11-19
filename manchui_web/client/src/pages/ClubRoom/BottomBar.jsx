import React from "react";

import {
  LiaHomeSolid,
  LiaAddressCard,
  LiaFlag,
  LiaCalendarCheckSolid,
} from "react-icons/lia";
import { AiOutlineFieldTime } from "react-icons/ai";
import { RiMenuAddLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import "./BottomBar.css";

const BottomBar = () => {
  const location = useLocation();

  return (
    <div className="bottomBar">
      {location.pathname.includes("/club/team/join") ? (
        <div className="inviteLinkBottom"></div>
      ) : (
        ""
      )}

      <Link
        className={`menu-button ${
          location.pathname === "/club/reservation" ? "selcetMenu" : ""
        }`}
        to="/club/reservation"
      >
        <LiaCalendarCheckSolid className="button-icon" />
        동아리방 예약
      </Link>
      <Link
        className={`menu-button ${
          location.pathname.includes("/club/practice") ? "selcetMenu" : ""
        }`}
        to="/club/practice"
      >
        <AiOutlineFieldTime className="button-icon" />
        연습
      </Link>
      <Link
        className={`menu-button ${
          location.pathname === "/club" ? "selcetMenu" : ""
        }`}
        to="/club"
      >
        <LiaHomeSolid className="button-icon" />홈
      </Link>
      <Link
        className={`menu-button ${
          location.pathname.includes("/club/team") ? "selcetMenu" : ""
        }`}
        to="/club/team"
      >
        <LiaFlag className="button-icon" />팀
      </Link>
      <Link
        className={`menu-button ${
          location.pathname === "/club/schedule" ? "selcetMenu" : ""
        }`}
        to="/club/schedule"
      >
        <RiMenuAddLine className="button-icon" />
        일정 작성
      </Link>
    </div>
  );
};

export default BottomBar;
