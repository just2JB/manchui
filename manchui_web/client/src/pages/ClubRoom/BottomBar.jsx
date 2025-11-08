import React from "react";

import {
  LiaHomeSolid,
  LiaAddressCard,
  LiaFlag,
  LiaCalendarCheckSolid,
} from "react-icons/lia";
import { RiMenuAddLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import "./BottomBar.css";

const BottomBar = () => {
  return (
    <div className="bottomBar">
      <Link className="menu-button" to="/club">
        <LiaHomeSolid className="button-icon" />홈
      </Link>
      <Link className="menu-button" to="/club/reservation">
        <LiaCalendarCheckSolid className="button-icon" />
        동아리방 예약
      </Link>
      <Link className="menu-button" to="/club/practice">
        <LiaFlag className="button-icon" />
        연습
      </Link>
      <Link className="menu-button" to="/club">
        <RiMenuAddLine className="button-icon" />빈 블럭
      </Link>
      <Link className="menu-button" to="/club/mypage">
        <LiaAddressCard className="button-icon" />
        마이 페이지
      </Link>
    </div>
  );
};

export default BottomBar;
