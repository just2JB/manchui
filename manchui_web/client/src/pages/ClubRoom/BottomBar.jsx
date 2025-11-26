import React, { useEffect, useState } from "react";

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
  const [navIndex, setNavIndex] = useState(3);

  useEffect(() => {
    if (location.pathname.includes("/club/reservation")) {
      setNavIndex(1);
    } else if (location.pathname.includes("/club/practice")) {
      setNavIndex(2);
    } else if (location.pathname === "/club") {
      setNavIndex(3);
    } else if (location.pathname.includes("/club/team")) {
      setNavIndex(4);
    } else if (location.pathname === "/club/schedule") {
      setNavIndex(5);
    }
  }, [location]);

  return (
    <div
      className="bottomBar"
      style={{
        border: `${
          location.pathname.includes("/club/team/join") ? "none" : ""
        }`,
      }}
    >
      {location.pathname.includes("/club/team/join") ? (
        <div className="inviteLinkBottom"></div>
      ) : (
        ""
      )}

      <Link
        onClick={() => setNavIndex(1)}
        className={`menu-button firstButton ${
          location.pathname === "/club/reservation" ? "selcetMenu" : ""
        }`}
        to="/club/reservation"
      >
        <div className={`indexBox index${navIndex}`}>
          <div className="circle"></div>
        </div>
        <div className="buttonText">
          <LiaCalendarCheckSolid className="button-icon" />
          동방 예약
        </div>
      </Link>
      <Link
        onClick={() => setNavIndex(2)}
        className={`menu-button ${
          location.pathname.includes("/club/practice") ? "selcetMenu" : ""
        }`}
        to="/club/practice"
      >
        <div className="buttonText">
          <AiOutlineFieldTime className="button-icon" />
          연습
        </div>
      </Link>
      <Link
        onClick={() => setNavIndex(3)}
        className={`menu-button ${
          location.pathname === "/club" ? "selcetMenu" : ""
        }`}
        to="/club"
      >
        <div className="buttonText">
          <LiaHomeSolid className="button-icon" />홈
        </div>
      </Link>
      <Link
        onClick={() => setNavIndex(4)}
        className={`menu-button ${
          location.pathname.includes("/club/team") ? "selcetMenu" : ""
        }`}
        to="/club/team"
      >
        <div className="buttonText">
          <LiaFlag className="button-icon" />팀
        </div>
      </Link>
      <Link
        onClick={() => setNavIndex(5)}
        className={`menu-button ${
          location.pathname === "/club/schedule" ? "selcetMenu" : ""
        }`}
        to="/club/schedule"
      >
        <div className="buttonText">
          <RiMenuAddLine className="button-icon" />
          일정 작성
        </div>
      </Link>
    </div>
  );
};

export default BottomBar;
