import axios from "axios";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ClubRoomNavbar.css";

const ClubRoomNavbar = () => {
  const nav = useNavigate();
  const handleLogout = async (e) => {
    try {
      const response = await axios.post(
        "https://manchuitestserver.run.goorm.site/api/auth/logout",
        {},
        { withCredentials: true }
      );
      nav("/club");
      window.location.reload();
      alert(response.data.message);
    } catch (error) {
      nav("/club");
      window.location.reload();
      console.log(error.response.data.message);
    }
  };
  return (
    <div className="ClubRoomNavbar">
      <div className="out">
        <Link to="/club">나가기</Link>
      </div>
      <Link className="logo" to="/">
        <img
          src="/logos/longLogo_white.png"
          alt="Logo"
          className="manchui-logo"
        />
      </Link>
      <div className="button">
        <Link className="mypage" to="/club/mypage">
          마이페이지
        </Link>
        <button className="logout" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default ClubRoomNavbar;
