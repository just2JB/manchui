import axios from "axios";
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./ClubRoomNavbar.css";

const ClubRoomNavbar = ({ isLogin, setAuthIsOpen }) => {
  const location = useLocation();
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
        {location.pathname === "/club" ? (
          <Link to="/">홈으로</Link>
        ) : (
          <Link to="/club">뒤로가기</Link>
        )}
      </div>
      <div className="title">
        <div>
          {location.pathname === "/club" ? (
            <Link className="logo" to="/">
              <img
                src="/logos/longLogo_white.png"
                alt="Logo"
                className="manchui-logo"
              />
            </Link>
          ) : location.pathname === "/club/reservation" ? (
            <h2>동아리방 예약</h2>
          ) : (
            ""
          )}
        </div>
      </div>
      <div className="button">
        {isLogin ? (
          <>
            <Link className="mypage" to="/club/mypage">
              마이페이지
            </Link>
            <div className="logout" onClick={handleLogout}>
              로그아웃
            </div>
          </>
        ) : (
          <>
            <div
              className="login"
              onClick={() => {
                setAuthIsOpen(true);
              }}
            >
              로그인
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClubRoomNavbar;
