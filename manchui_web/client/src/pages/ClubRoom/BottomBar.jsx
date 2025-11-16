import React from "react";

import {
  LiaHomeSolid,
  LiaAddressCard,
  LiaFlag,
  LiaCalendarCheckSolid,
} from "react-icons/lia";
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
          location.pathname === "/club" ? "selcetMenu" : ""
        }`}
        to="/club"
      >
        <LiaHomeSolid className="button-icon" />홈
      </Link>
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
          location.pathname === "/club/practice" ? "selcetMenu" : ""
        }`}
        to="/club/practice"
      >
        <LiaFlag className="button-icon" />
        연습
      </Link>
      <Link
        className={`menu-button ${
          location.pathname === "/club/ww" ? "selcetMenu" : ""
        }`}
        to="/club"
      >
        <RiMenuAddLine className="button-icon" />빈 블럭
      </Link>
      <Link
        className={`menu-button ${
          location.pathname === "/club/mypage" ? "selcetMenu" : ""
        }`}
        to="/club/mypage"
      >
        <LiaAddressCard className="button-icon" />
        마이 페이지
      </Link>
    </div>
  );
};

export default BottomBar;
