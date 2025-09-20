import React from "react";
import { Link } from "react-router-dom";
import "./BottomBar.css";

const BottomBar = () => {
  return (
    <div className="bottomBar">
      <Link className="menu-button" to="/club/reservation">
        동아리방 예약
      </Link>
      <Link className="menu-button" to="/club/practice">
        연습
      </Link>
      <Link className="menu-button" to="/club">
        홈
      </Link>
      <Link className="menu-button" to="/club/mypage">
        마이 페이지
      </Link>
    </div>
  );
};

export default BottomBar;
